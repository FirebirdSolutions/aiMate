import { useState, useRef, useEffect } from "react";
import { useUIEventLogger } from "./DebugContext";
import { useUserSettings } from "../context/UserSettingsContext";
import { useAdminSettings } from "../context/AdminSettingsContext";
import { useAppData } from "../context/AppDataContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Bot, User, Edit2, Check, X, RotateCw, Sparkles, Copy, Volume2, VolumeX, Info, ThumbsUp, ThumbsDown, Play, Share2, Send, Brain, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { toast } from "sonner";
import { CodeBlock, InlineCode } from "./CodeBlock";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { RatingModal } from "./RatingModal";
import { ShareModal } from "./ShareModal";
import { StructuredPanel } from "./StructuredPanel";
import { ToolCallCard } from "./ToolCallCard";
import { ToolCall } from "../hooks/useTools";
import { TextSelectionToolbar } from "./TextSelectionToolbar";
import { ArtifactRenderer, parseArtifacts, type ArtifactData } from "./rich-content";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  structuredContent?: any;
  toolCalls?: ToolCall[];
  onEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
  onContinue?: () => void;
  onRetryToolCall?: (toolCall: ToolCall) => void;
  onExplainSelection?: (text: string) => void;
  onAskAboutSelection?: (text: string) => void;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  structuredContent,
  toolCalls,
  onEdit,
  onRegenerate,
  onContinue,
  onRetryToolCall,
  onExplainSelection,
  onAskAboutSelection,
}: ChatMessageProps) {
  const { logUIEvent } = useUIEventLogger();
  const { settings } = useUserSettings();
  const { settings: adminSettings } = useAdminSettings();
  const { knowledge } = useAppData();
  const interfaceSettings = settings.interface || {};
  const showTimestamps = interfaceSettings.showTimestamps ?? true;
  const markdownSupport = interfaceSettings.markdownSupport ?? true;
  const syntaxHighlighting = interfaceSettings.syntaxHighlighting ?? true;

  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [infoOpen, setInfoOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingType, setRatingType] = useState<"up" | "down">("up");
  const [shareOpen, setShareOpen] = useState(false);
  const [savingToKnowledge, setSavingToKnowledge] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messageContentRef = useRef<HTMLDivElement>(null);

  // Check if TTS is enabled
  const ttsEnabled = adminSettings.audio?.textToSpeechEnabled ?? true;

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
      }
    };
  }, [isSpeaking]);

  // Handler for saving selected text to knowledge
  const handleSaveSelectionToKnowledge = async (text: string) => {
    const title = `Selection: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
    await knowledge.saveTextAsKnowledge(text, title, ['selection', 'chat-selection']);
  };

  // Mock performance metrics
  const performanceMetrics = {
    tokensPerSecond: 12.27,
    totalTokens: 68,
    timeSeconds: 5.54,
  };

  // Parse artifacts from content (assistant messages only)
  const { artifacts, cleanedContent: contentWithoutArtifacts } = !isUser
    ? parseArtifacts(content)
    : { artifacts: [], cleanedContent: content };

  // Handle saving artifact to knowledge
  const handleSaveArtifactToKnowledge = (artifact: ArtifactData) => {
    // This will be wired up to the knowledge hook
    const title = artifact.type === 'file'
      ? (artifact as any).filename
      : (artifact as any).title || `${artifact.type} artifact`;

    toast.info(`Saving "${title}" to Knowledge...`);
    // TODO: Wire up to knowledge.saveTextAsKnowledge
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() && onEdit) {
      logUIEvent('Edit message saved', 'ui:chat:message:edit:save', { role, originalLength: content.length, editedLength: editedContent.trim().length });
      onEdit(editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    logUIEvent('Edit message cancelled', 'ui:chat:message:edit:cancel', { role });
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    logUIEvent('Edit button clicked', 'ui:chat:message:edit:start', { role });
    setIsEditing(true);
  };

  const handleRegenerateClick = () => {
    logUIEvent('Regenerate message clicked', 'ui:chat:message:regenerate', { role });
    if (onRegenerate) onRegenerate();
  };

  const handleInfoClick = () => {
    logUIEvent('Message info opened', 'ui:chat:message:info', { role });
    setInfoOpen(!infoOpen);
  };

  const handleShareClick = () => {
    logUIEvent('Share message clicked', 'ui:chat:message:share', { role });
    setShareOpen(true);
  };

  const handleRatingClick = (type: 'up' | 'down') => {
    logUIEvent(`Message rated: ${type}`, 'ui:chat:message:rating', { role, rating: type });
    setRatingType(type);
    setRatingOpen(true);
  };

  const handleBrainClick = () => {
    logUIEvent('Brain/Knowledge button clicked', 'ui:chat:message:brain', { role });
    setBrainTooltipOpen(true);
    setTimeout(() => setBrainTooltipOpen(false), 2000);
  };

  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const [brainTooltipOpen, setBrainTooltipOpen] = useState(false);

  const handleCopy = async () => {
    logUIEvent(`Copy message: ${isUser ? 'user' : 'assistant'}`, 'ui:chat:message:copy', { role, contentLength: content.length });
    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(content);
      setCopyTooltipOpen(true);
      setTimeout(() => setCopyTooltipOpen(false), 2000);
    } catch (err) {
      // Fallback to execCommand for when Clipboard API is blocked
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopyTooltipOpen(true);
          setTimeout(() => setCopyTooltipOpen(false), 2000);
        } else {
          toast.error("Failed to copy to clipboard");
        }
      } catch (fallbackErr) {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  const handleReadAloud = () => {
    if (!ttsEnabled) {
      toast.info("Text-to-speech is disabled in settings");
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }

    // If already speaking, stop
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any ongoing speech from other messages
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(content);

    // Apply voice settings from admin
    const voiceModel = adminSettings.audio?.voiceModel || 'default';
    const voices = window.speechSynthesis.getVoices();

    // Try to match the voice model to available voices
    if (voiceModel !== 'default' && voices.length > 0) {
      const matchedVoice = voices.find(v =>
        v.name.toLowerCase().includes(voiceModel.toLowerCase()) ||
        v.voiceURI.toLowerCase().includes(voiceModel.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      logUIEvent('TTS started', 'ui:chat:message:tts:start');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      logUIEvent('TTS completed', 'ui:chat:message:tts:end');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Failed to read aloud");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    logUIEvent('TTS stopped', 'ui:chat:message:tts:stop');
  };

  const handleLike = () => {
    setRatingType("up");
    setRatingOpen(true);
  };

  const handleDislike = () => {
    setRatingType("down");
    setRatingOpen(true);
  };

  const handleContinue = () => {
    if (onContinue) {
      logUIEvent('Continue message clicked', 'ui:chat:message:continue');
      onContinue();
    } else {
      toast.info("Continue not available");
    }
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleSaveToKnowledge = async () => {
    if (savingToKnowledge) return;

    try {
      setSavingToKnowledge(true);
      logUIEvent('Save to knowledge clicked', 'ui:chat:message:save-knowledge', { role, contentLength: content.length });

      // Generate a title from the first line or first 50 chars
      const firstLine = content.split('\n')[0] || content;
      const title = `${isUser ? 'User' : 'AI'}: ${firstLine.substring(0, 50)}${firstLine.length > 50 ? '...' : ''}`;

      await knowledge.saveTextAsKnowledge(
        content,
        title,
        [isUser ? 'user-message' : 'ai-response', 'chat-saved']
      );

      setBrainTooltipOpen(true);
      setTimeout(() => setBrainTooltipOpen(false), 2000);
      toast.success('Saved to knowledge base');
    } catch (err) {
      console.error('Failed to save to knowledge:', err);
      toast.error('Failed to save to knowledge');
    } finally {
      setSavingToKnowledge(false);
    }
  };

  return (
    <>
      <RatingModal
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        type={ratingType}
      />
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} group`}>
        <Avatar className="h-8 w-8 shrink-0 hidden md:flex">
          {isUser ? (
            <AvatarFallback className="bg-gray-600 dark:bg-gray-700">
              <User className="h-4 w-4 text-white" />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-gray-600 dark:bg-gray-700">
              <Sparkles className="h-4 w-4 text-white" />
            </AvatarFallback>
          )}
        </Avatar>

        <div className={`flex flex-col max-w-[95%] md:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
          {isEditing ? (
            <div className="w-full space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="gap-2"
                >
                  <Send className="h-3 w-3" />
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={messageContentRef}
                className={`rounded-2xl px-3 py-2 ${isUser
                  ? "bg-gray-700 dark:bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }`}
              >
                {markdownSupport ? (
                  <div className={`prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 ${isUser ? 'prose-invert' : ''}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const codeString = String(children).replace(/\n$/, '');

                          // Hide structured content code blocks (assistant only)
                          if (!isUser && !inline && codeString.includes('```structured')) {
                            return null;
                          }
                          if (!isUser && !inline && className === 'language-structured') {
                            return null;
                          }

                          // Extract language from className (e.g., "language-javascript")
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';

                          // Use enhanced components for block and inline code
                          if (inline) {
                            return <InlineCode>{codeString}</InlineCode>;
                          }

                          // Block code - use CodeBlock component (handles mermaid too)
                          return (
                            <CodeBlock language={language} className="my-3">
                              {codeString}
                            </CodeBlock>
                          );
                        },
                        // Override pre to avoid double wrapping
                        pre: ({ children }) => <>{children}</>,
                        // Style links appropriately for user messages
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={isUser ? 'text-blue-300 hover:text-blue-200 underline' : 'text-blue-500 hover:text-blue-600 underline'}
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {!isUser && structuredContent
                        ? contentWithoutArtifacts.replace(/```structured[\s\S]*?```/g, '').trim()
                        : contentWithoutArtifacts}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{content}</p>
                )}
              </div>

              {/* Artifacts (files, JSON, tables, etc.) */}
              {artifacts.length > 0 && (
                <div className="w-full mt-2">
                  <ArtifactRenderer
                    artifacts={artifacts}
                    onSaveToKnowledge={handleSaveArtifactToKnowledge}
                  />
                </div>
              )}

              {/* Text Selection Toolbar - only for assistant messages */}
              {!isUser && (
                <TextSelectionToolbar
                  containerRef={messageContentRef}
                  onExplain={onExplainSelection}
                  onAsk={onAskAboutSelection}
                  onSaveToKnowledge={handleSaveSelectionToKnowledge}
                />
              )}

              {/* Structured Content */}
              {structuredContent && (
                <div className="w-full mt-2">
                  <StructuredPanel
                    data={structuredContent}
                    onAction={(action, rowData) => {
                      toast.info(`Action: ${action.title} (Tool: ${action.tool})`);
                      console.log('Structured action:', action, rowData);
                    }}
                  />
                </div>
              )}

              {/* Tool Calls */}
              {toolCalls && toolCalls.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  {toolCalls.map((toolCall) => (
                    <ToolCallCard
                      key={toolCall.id}
                      toolCall={toolCall}
                      onRetry={onRetryToolCall ? () => onRetryToolCall(toolCall) : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Action Icons */}
              {!isUser ? (
                <div className="flex items-center gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleEditClick}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Tooltip open={copyTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={handleCopy}
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copied to clipboard</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isSpeaking ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        onClick={isSpeaking ? handleStopSpeaking : handleReadAloud}
                        disabled={!ttsEnabled}
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isSpeaking ? 'Stop reading' : ttsEnabled ? 'Read aloud' : 'TTS disabled'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Popover open={infoOpen} onOpenChange={setInfoOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Info"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-auto p-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm mb-2">Performance Metrics</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                          {performanceMetrics.tokensPerSecond} T/s | {performanceMetrics.totalTokens} tokens | {performanceMetrics.timeSeconds} sec
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleLike}
                    title="Like"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleDislike}
                    title="Dislike"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleContinue}
                    title="Continue"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  {onRegenerate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={onRegenerate}
                      title="Regenerate"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleShare}
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Tooltip open={brainTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={handleSaveToKnowledge}
                        disabled={savingToKnowledge}
                        title="Save to Knowledge"
                      >
                        {savingToKnowledge ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Saved to knowledge</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 px-2">
                  {showTimestamps && <span className="text-xs text-gray-500">{timestamp}</span>}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Tooltip open={copyTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleCopy}
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copied to clipboard</TooltipContent>
                  </Tooltip>
                  <Tooltip open={brainTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleSaveToKnowledge}
                        disabled={savingToKnowledge}
                        title="Save to Knowledge"
                      >
                        {savingToKnowledge ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Brain className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Saved to knowledge</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
