import { useState, useRef } from "react";
import { useUIEventLogger } from "./DebugContext";
import { useUserSettings } from "../context/UserSettingsContext";
import { useAppData } from "../context/AppDataContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Bot, User, Edit2, Check, X, RotateCw, Sparkles, Copy, Volume2, Info, ThumbsUp, ThumbsDown, Play, Share2, Send, Brain, Loader2 } from "lucide-react";
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
  const messageContentRef = useRef<HTMLDivElement>(null);

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
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      toast.info("Reading aloud...", { duration: 2000 });
    };

    utterance.onerror = () => {
      toast.error("Failed to read aloud");
    };

    window.speechSynthesis.speak(utterance);
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
                {isUser ? (
                  <p className="whitespace-pre-wrap break-words">{content}</p>
                ) : markdownSupport ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const codeString = String(children).replace(/\n$/, '');

                          // Hide structured content code blocks
                          if (!inline && codeString.includes('```structured')) {
                            return null;
                          }
                          if (!inline && className === 'language-structured') {
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
                      }}
                    >
                      {structuredContent ? content.replace(/```structured[\s\S]*?```/g, '').trim() : content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{content}</p>
                )}
              </div>

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleReadAloud}
                    title="Read Aloud"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
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
