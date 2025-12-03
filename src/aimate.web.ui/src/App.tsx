import { useState, useRef, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationSidebar, Conversation } from "./components/ConversationSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessage } from "./components/ChatMessage";
import { EmptyState } from "./components/EmptyState";
import { ChatInput, AttachmentData } from "./components/ChatInput";
import { DebugPanel } from "./components/DebugPanel";
import { useMemories } from "./hooks/useMemories";
import { useTools, ToolCall } from "./hooks/useTools";
import { useCustomModels } from "./hooks/useCustomModels";
import { useContextMeter } from "./components/ContextMeter";
import { useContextCompression, getCompressionInfo } from "./hooks/useContextCompression";
import { getContextLimit } from "./utils/modelLimits";
import { ShowcaseModeIndicator } from "./components/ShowcaseModeIndicator";
import { ThemeProvider } from "./components/ThemeProvider";
import { DebugProvider, useDebug } from "./components/DebugContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { AdminSettingsProvider, useAdminSettings } from "./context/AdminSettingsContext";
import { UserSettingsProvider, useUserSettings } from "./context/UserSettingsContext";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import { AppConfig } from "./utils/config";
import { ScrollArea } from "./components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "./components/ui/sheet";
import { Sparkles } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { exportToPdf, exportToJson, exportToMarkdown } from "./utils/exportPdf";
import { generateTitle, generateFallbackTitle, needsTitleGeneration } from "./utils/titleGeneration";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("simulated"); // Default fallback
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const { addLog } = useDebug();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get all our data from context
  const { chat, conversations, workspaces, projects, admin } = useAppData();
  const { settings: userSettings } = useUserSettings();
  const { settings: adminSettings } = useAdminSettings();
  const memories = useMemories();
  const tools = useTools();
  const { selectedModel: activeCustomModel } = useCustomModels();

  // Build system prompt for context meter
  const currentSystemPrompt = useMemo(() => {
    const customModelSystemPrompt = activeCustomModel?.systemPrompt || '';
    const userSystemPrompt = userSettings.general?.systemPrompt || '';
    return [customModelSystemPrompt, userSystemPrompt].filter(Boolean).join('\n\n');
  }, [activeCustomModel?.systemPrompt, userSettings.general?.systemPrompt]);

  // Build memory context for context meter
  const currentMemoryContext = useMemo(() => {
    return memories.getContextString();
  }, [memories]);

  // Context meter - tracks token usage
  const contextMeter = useContextMeter({
    messages: chat.messages,
    modelId: selectedModel,
    systemPrompt: currentSystemPrompt,
    memoryContext: currentMemoryContext,
  });

  // Context compression - optimize long conversations
  const compressionSettings = userSettings.contextManagement || {
    enabled: true,
    threshold: 80,
    strategy: 'hybrid' as const,
    preserveRecentMessages: 5,
    showIndicator: true,
  };

  const compression = useContextCompression({
    messages: chat.messages,
    contextLimit: getContextLimit(selectedModel),
    settings: compressionSettings,
    systemPromptTokens: contextMeter.breakdown.systemPrompt,
    memoryTokens: contextMeter.breakdown.memories,
  });

  const compressionInfo = useMemo(() => {
    if (!compressionSettings.showIndicator) return undefined;
    return getCompressionInfo(compression, compressionSettings.strategy);
  }, [compression, compressionSettings.showIndicator, compressionSettings.strategy]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      chat.loadMessages(activeConversationId);
      addLog({
        action: 'Loading messages',
        category: 'chat:messages',
        api: 'api/v1/chat/messages',
        payload: { conversationId: activeConversationId },
        type: 'info'
      });
    }
  }, [activeConversationId, chat.loadMessages, addLog]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.messages, chat.streaming]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNewConversation = async () => {
    try {
      const newConv = await conversations.createConversation({
        title: "New Conversation",
        workspaceId: workspaces.currentWorkspace?.id,
      });

      // If in project view, auto-add to project
      if (activeProjectId) {
        await projects.addConversation(activeProjectId, newConv.id);
        const project = projects.projects.find(p => p.id === activeProjectId);
        addLog({
          action: 'Conversation added to project',
          api: 'api/v1/projects/conversations',
          payload: { conversationId: newConv.id, projectId: activeProjectId, projectName: project?.name },
          type: 'success',
          category: 'chat:conversation'
        });
      }

      setActiveConversationId(newConv.id);
      setMobileSidebarOpen(false);

      addLog({
        action: 'New conversation created',
        api: 'api/v1/conversations',
        payload: { conversationId: newConv.id, projectId: activeProjectId },
        type: 'success',
        category: 'chat:conversation'
      });

      const project = activeProjectId ? projects.projects.find(p => p.id === activeProjectId) : null;
      toast.success(project ? `New conversation in "${project.name}"` : "New conversation created");
    } catch (err) {
      console.error('Failed to create conversation:', err);
      toast.error("Failed to create conversation");
    }
  };

  const handleSendMessage = async (content: string, attachments?: AttachmentData) => {
    // Determine which conversation to use
    let targetConversationId = activeConversationId;

    if (!targetConversationId) {
      // Create new conversation first
      try {
        const newConv = await conversations.createConversation({
          title: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
          workspaceId: workspaces.currentWorkspace?.id,
        });

        // If in project view, auto-add to project
        if (activeProjectId) {
          await projects.addConversation(activeProjectId, newConv.id);
        }

        setActiveConversationId(newConv.id);
        targetConversationId = newConv.id;
      } catch (err) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    try {
      addLog({
        action: 'Sending message',
        api: 'api/v1/chat/send',
        payload: {
          message: content,
          conversationId: targetConversationId,
          model: selectedModel,
          attachments: attachments ? {
            knowledge: attachments.knowledgeIds.length,
            notes: attachments.noteIds.length,
            files: attachments.fileIds.length,
            chats: attachments.chatIds.length,
            webpages: attachments.webpageUrls.length,
          } : null,
        },
        type: 'info',
        category: 'chat:message'
      });

      // Extract any new memories from the user's message
      memories.extractMemoriesFromText(content, targetConversationId);

      // Map creativity level to temperature (fallback if agent doesn't specify)
      const creativityToTemp: Record<string, number> = {
        precise: 0.3,
        balanced: 0.7,
        creative: 1.0,
      };
      const defaultTemperature = creativityToTemp[userSettings.personalisation?.creativityLevel || 'balanced'];

      // Map response style to max_tokens (fallback if agent doesn't specify)
      const styleToTokens: Record<string, number> = {
        concise: 512,
        balanced: 2048,
        detailed: 4096,
      };
      const defaultMaxTokens = styleToTokens[userSettings.personalisation?.responseStyle || 'balanced'];

      // Custom model configuration takes priority over user settings
      const customModelSystemPrompt = activeCustomModel?.systemPrompt;
      const userSystemPrompt = userSettings.general?.systemPrompt;

      // Combine prompts: custom model prompt first, then user's custom prompt
      const combinedSystemPrompt = [customModelSystemPrompt, userSystemPrompt]
        .filter(Boolean)
        .join('\n\n');

      // Use custom model's temperature/maxTokens if specified, otherwise use user settings
      const temperature = activeCustomModel?.parameters?.temperature ?? defaultTemperature;
      const maxTokens = activeCustomModel?.parameters?.maxTokens ?? defaultMaxTokens;

      // Merge knowledge IDs from attachments and custom model bindings
      const knowledgeIds = [
        ...(attachments?.knowledgeIds || []),
        ...(activeCustomModel?.knowledgeCollectionIds || []),
        ...(activeCustomModel?.knowledgeFileIds || []),
      ];

      await chat.sendMessage(content, {
        conversationId: targetConversationId,
        workspaceId: workspaces.currentWorkspace?.id,
        model: selectedModel,
        systemPrompt: combinedSystemPrompt,
        // Pass all attachment types
        knowledgeIds: knowledgeIds.length > 0 ? knowledgeIds : undefined,
        noteIds: attachments?.noteIds.length ? attachments.noteIds : undefined,
        fileIds: attachments?.fileIds.length ? attachments.fileIds : undefined,
        chatIds: attachments?.chatIds.length ? attachments.chatIds : undefined,
        webpageUrls: attachments?.webpageUrls.length ? attachments.webpageUrls : undefined,
        memoryContext: memories.getContextString(),
        temperature,
        maxTokens,
        includeHistory: userSettings.personalisation?.rememberContext !== false,
      });

      addLog({
        action: 'Message sent successfully',
        api: 'api/v1/chat/send',
        type: 'success',
        category: 'chat:message'
      });

      // Generate title for new conversations
      const conv = conversations.conversations.find(c => c.id === targetConversationId);
      const shouldGenerateTitle = conv && (
        conv.messageCount === 0 ||
        needsTitleGeneration(conv.title)
      );

      if (shouldGenerateTitle && adminSettings.interface?.titleGeneration !== false) {
        // Get the last assistant message for title generation
        const lastAssistantMsg = chat.messages.filter(m => m.role === 'assistant').pop();

        if (lastAssistantMsg) {
          // Find active LM connection for title generation
          const activeConnection = adminSettings.connections.find(c => c.enabled && c.url);

          if (activeConnection?.url) {
            // Generate title using LLM (async, don't block)
            generateTitle(
              content,
              lastAssistantMsg.content,
              activeConnection.url,
              activeConnection.apiKey,
              selectedModel,
              adminSettings.interface?.titleGenerationPrompt
            ).then(async (generatedTitle) => {
              if (generatedTitle) {
                await conversations.updateConversation(targetConversationId!, {
                  title: generatedTitle,
                });
                addLog({
                  action: 'Title generated',
                  payload: { title: generatedTitle },
                  type: 'success',
                  category: 'chat:title'
                });
              }
            }).catch(err => {
              console.error('[Title generation] Failed:', err);
            });
          } else {
            // Fallback: Use truncated first message
            const fallbackTitle = generateFallbackTitle(content);
            await conversations.updateConversation(targetConversationId, {
              title: fallbackTitle,
            });
          }
        } else {
          // No assistant response yet, use fallback
          const fallbackTitle = generateFallbackTitle(content);
          await conversations.updateConversation(targetConversationId, {
            title: fallbackTitle,
          });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to send message:', err);
        addLog({
          action: 'Failed to send message',
          api: 'api/v1/chat/send',
          payload: { error: String(err) },
          type: 'error',
          category: 'chat:message'
        });
        toast.error("Failed to send message");
      }
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await chat.editMessage(messageId, newContent);
      toast.success("Message updated");

      // Regenerate response after editing
      setTimeout(() => {
        handleRegenerateResponse();
      }, 100);
    } catch (err) {
      console.error('Failed to edit message:', err);
      toast.error("Failed to edit message");
    }
  };

  const handleRegenerateResponse = async () => {
    if (!chat.messages.length) return;

    // Find the last assistant message
    const lastAssistantMsg = [...chat.messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;

    try {
      addLog({
        action: 'Regenerating response',
        api: 'api/v1/chat/regenerate',
        payload: { messageId: lastAssistantMsg.id },
        type: 'info',
        category: 'chat:regenerate'
      });

      await chat.regenerateMessage(lastAssistantMsg.id);

      toast.success("Response regenerated");
    } catch (err) {
      console.error('Failed to regenerate:', err);
      toast.error("Failed to regenerate response");
    }
  };

  const handleContinue = async () => {
    if (!chat.messages.length || chat.streaming) return;

    addLog({
      action: 'Continuing message',
      api: 'LM server /chat/completions',
      type: 'info',
      category: 'chat:continue'
    });

    // Map creativity level to temperature
    const creativityToTemp: Record<string, number> = {
      precise: 0.3,
      balanced: 0.7,
      creative: 1.0,
    };
    const temperature = creativityToTemp[userSettings.personalisation?.creativityLevel || 'balanced'];

    await chat.continueMessage({
      model: selectedModel,
      systemPrompt: userSettings.general?.systemPrompt,
      temperature,
    });
  };

  const handleRetryToolCall = async (toolCall: ToolCall) => {
    addLog({
      action: 'Retrying tool call',
      api: 'MCP tool execution',
      payload: { toolName: toolCall.toolName, serverId: toolCall.serverId },
      type: 'info',
      category: 'tools:retry'
    });

    await tools.executeTool(
      toolCall.serverId,
      toolCall.toolName,
      toolCall.parameters
    );
  };

  const handleExplainSelection = (text: string) => {
    const prompt = `Explain this:\n\n"${text}"`;
    handleSendMessage(prompt);
    addLog({
      action: 'Explain selection',
      api: 'api/v1/chat/send',
      payload: { selectionLength: text.length },
      type: 'info',
      category: 'chat:selection'
    });
  };

  const handleAskAboutSelection = (text: string) => {
    const prompt = `Tell me more about this:\n\n"${text}"`;
    handleSendMessage(prompt);
    addLog({
      action: 'Ask about selection',
      api: 'api/v1/chat/send',
      payload: { selectionLength: text.length },
      type: 'info',
      category: 'chat:selection'
    });
  };

  const handleExportConversation = async (conversationId: string, format: 'pdf' | 'json' | 'md') => {
    const conv = conversations.conversations.find(c => c.id === conversationId);
    if (!conv) {
      toast.error('Conversation not found');
      return;
    }

    // If exporting the active conversation, use current messages
    // Otherwise, we'd need to load them - for now, show a message
    if (conversationId !== activeConversationId || chat.messages.length === 0) {
      toast.info('Please open the conversation first to export it');
      return;
    }

    const exportOptions = {
      title: conv.title,
      messages: chat.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      includeTimestamps: true,
    };

    try {
      switch (format) {
        case 'pdf':
          exportToPdf(exportOptions);
          toast.success('PDF export ready for printing');
          break;
        case 'json':
          exportToJson(exportOptions);
          toast.success('JSON exported');
          break;
        case 'md':
          exportToMarkdown(exportOptions);
          toast.success('Markdown exported');
          break;
      }

      addLog({
        action: 'Export conversation',
        api: 'local',
        payload: { conversationId, format },
        type: 'success',
        category: 'chat:export'
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export conversation');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await conversations.deleteConversation(id);

      if (activeConversationId === id) {
        const remaining = conversations.conversations.filter(c => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }

      addLog({
        action: 'Conversation deleted',
        api: 'api/v1/conversations',
        payload: { conversationId: id },
        type: 'warning',
        category: 'chat:conversation'
      });

      toast.success("Conversation deleted");
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error("Failed to delete conversation");
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await conversations.updateConversation(id, { title: newTitle });
      toast.success("Conversation renamed");
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      toast.error("Failed to rename conversation");
    }
  };

  const handleCloneConversation = async (id: string) => {
    try {
      const conv = conversations.conversations.find(c => c.id === id);
      if (!conv) return;

      const cloned = await conversations.createConversation({
        title: `${conv.title} (Copy)`,
        workspaceId: conv.workspaceId,
        tags: conv.tags,
      });

      setActiveConversationId(cloned.id);

      addLog({
        action: 'Conversation cloned',
        api: 'api/v1/conversations',
        payload: { originalId: id, clonedId: cloned.id },
        type: 'success',
        category: 'chat:conversation'
      });

      toast.success("Conversation duplicated");
    } catch (err) {
      console.error('Failed to clone conversation:', err);
      toast.error("Failed to duplicate conversation");
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  // ============================================================================
  // PREPARE DATA FOR UI
  // ============================================================================

  const conversationList: Conversation[] = conversations.conversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    lastMessage: `${conv.messageCount} messages`,
    timestamp: new Date(conv.lastMessageAt || conv.createdAt),
  }));

  // Get available models from admin
  // Filter to only show models with valid enabled connections (unless in offline mode with no connections)
  const allModels = admin?.models || [];
  const enabledConnectionNames = new Set(
    admin?.connections?.filter(c => c.isActive || c.enabled).map(c => c.name) || []
  );
  const availableModels = allModels.filter(model => {
    // Always show models that have a matching enabled connection
    if (enabledConnectionNames.has(model.provider)) return true;
    // In offline mode, show all models as fallback (for testing)
    if (AppConfig.isOfflineMode() && enabledConnectionNames.size === 0) return true;
    // Otherwise filter out models without valid connections
    return false;
  });
  const enabledModels = availableModels.reduce((acc, model) => {
    acc[model.id] = model.isActive || false;
    return acc;
  }, {} as Record<string, boolean>);

  // Auto-select first available model when models load
  useEffect(() => {
    if (availableModels.length > 0) {
      const currentModelExists = availableModels.some(m => m.id === selectedModel);
      if (!currentModelExists) {
        setSelectedModel(availableModels[0].id);
      }
    }
  }, [availableModels, selectedModel]);

  const handleToggleModel = async (modelId: string) => {
    if (!admin) return;

    try {
      await admin.toggleModel(modelId);
      toast.success("Model status updated");
    } catch (err) {
      console.error('Failed to toggle model:', err);
      toast.error("Failed to update model");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <div className="hidden md:block w-80 shrink-0">
          <ErrorBoundary context="sidebar">
            <ConversationSidebar
              conversations={conversationList}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onCloneConversation={handleCloneConversation}
              onExportConversation={handleExportConversation}
              enabledModels={enabledModels}
              onToggleModel={handleToggleModel}
              hasMore={conversations.hasMore}
              onLoadMore={conversations.loadMore}
              loading={conversations.loading}
              activeProjectId={activeProjectId}
              onSetActiveProject={setActiveProjectId}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <ErrorBoundary context="sidebar">
            <ConversationSidebar
              conversations={conversationList}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setMobileSidebarOpen(false);
              }}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onCloneConversation={handleCloneConversation}
              onExportConversation={handleExportConversation}
              onClose={() => setMobileSidebarOpen(false)}
              enabledModels={enabledModels}
              onToggleModel={handleToggleModel}
              hasMore={conversations.hasMore}
              onLoadMore={conversations.loadMore}
              loading={conversations.loading}
              activeProjectId={activeProjectId}
              onSetActiveProject={setActiveProjectId}
            />
          </ErrorBoundary>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          onNewChat={handleNewConversation}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen || mobileSidebarOpen}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableModels={availableModels.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            contextWindow: m.contextWindow,
            capabilities: m.capabilities,
            color: '#888888', // Default color
          }))}
          contextUsedTokens={contextMeter.usedTokens}
          contextMaxTokens={contextMeter.maxTokens}
          contextBreakdown={contextMeter.breakdown}
          contextCompression={compressionInfo}
        />

        <div className="flex-1 overflow-hidden">
          <ErrorBoundary context="chat">
            <ScrollArea className="h-full">
              {chat.messages.length === 0 && !chat.loading ? (
                <EmptyState onSendMessage={handleSendMessage} />
              ) : (
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                  {chat.messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                      structuredContent={message.structuredContent}
                      toolCalls={message.role === "assistant" ? tools.toolCalls : undefined}
                      onEdit={
                        message.role === "user"
                          ? (newContent) => handleEditMessage(message.id, newContent)
                          : undefined
                      }
                      onRegenerate={
                        message.role === "assistant" &&
                          index === chat.messages.length - 1 &&
                          !chat.streaming
                          ? handleRegenerateResponse
                          : undefined
                      }
                      onContinue={
                        message.role === "assistant" &&
                          index === chat.messages.length - 1 &&
                          !chat.streaming
                          ? handleContinue
                          : undefined
                      }
                      onRetryToolCall={handleRetryToolCall}
                      onExplainSelection={message.role === "assistant" ? handleExplainSelection : undefined}
                      onAskAboutSelection={message.role === "assistant" ? handleAskAboutSelection : undefined}
                    />
                  ))}

                  {/* Show streaming indicator only while waiting for first chunk (before assistant message appears) */}
                  {chat.streaming && chat.messages[chat.messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>
          </ErrorBoundary>
        </div>

        <ChatInput
          onSend={handleSendMessage}
          disabled={chat.streaming}
          activeProject={activeProjectId ? {
            id: activeProjectId,
            name: projects.projects.find(p => p.id === activeProjectId)?.name || 'Project',
            icon: projects.projects.find(p => p.id === activeProjectId)?.icon,
            color: projects.projects.find(p => p.id === activeProjectId)?.color,
          } : null}
        />

        <DebugPanel />
      </div>

      <ShowcaseModeIndicator />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <DebugProvider>
          <AuthProvider>
            <AdminSettingsProvider>
              <UserSettingsProvider>
                <AppDataProvider isAdmin={true}>
                  <Toaster />
                  <ErrorBoundary context="app">
                    <ChatApp />
                  </ErrorBoundary>
                </AppDataProvider>
              </UserSettingsProvider>
            </AdminSettingsProvider>
          </AuthProvider>
        </DebugProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;