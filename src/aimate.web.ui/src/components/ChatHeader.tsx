import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "./ui/button";
import { Menu, MoreVertical, Plus, PanelLeftClose, PanelLeft, ChevronDown, Sparkles, MessageSquare, Keyboard, Bot, Check, Swords, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { useAgents, AgentPreset } from "../hooks/useAgents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SettingsModal } from "./SettingsModal";
import { AboutModal } from "./AboutModal";
import { HelpModal } from "./HelpModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { OfflineModeIndicator } from "./OfflineModeIndicator";
import { ErrorBoundary, ModalErrorFallback } from "./ErrorBoundary";
import { ConnectionHealthIndicator } from "./ConnectionHealthIndicator";
import { useDebug, useUIEventLogger } from "./DebugContext";
import { useKeyboardShortcuts, createDefaultShortcuts, formatShortcut, type KeyboardShortcut } from "../hooks/useKeyboardShortcuts";

interface ModelOption {
  id: string;
  name: string;
  color: string;
}

interface ChatHeaderProps {
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  enabledModels?: Record<string, boolean>;
  availableModels?: ModelOption[];
  // Arena mode props
  isArenaMode?: boolean;
  onToggleArenaMode?: () => void;
}

export function ChatHeader({
  onNewChat,
  onToggleSidebar,
  sidebarOpen,
  selectedModel = "simulated",
  onModelChange,
  enabledModels = {
    "simulated": true,
  },
  availableModels,
  isArenaMode = false,
  onToggleArenaMode,
}: ChatHeaderProps) {
  const { showcaseMode } = useDebug();
  const { logUIEvent } = useUIEventLogger();
  const { enabledPresets, recentPresets, activePreset, setActivePreset } = useAgents();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [modelSelectOpen, setModelSelectOpen] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleNewChat = useCallback(() => {
    logUIEvent('New chat clicked', 'ui:chat:new');
    onNewChat();
  }, [logUIEvent, onNewChat]);

  const handleToggleSidebar = useCallback(() => {
    logUIEvent(`Sidebar ${sidebarOpen ? 'closed' : 'opened'}`, 'ui:sidebar:toggle', { open: !sidebarOpen });
    if (onToggleSidebar) onToggleSidebar();
  }, [logUIEvent, onToggleSidebar, sidebarOpen]);

  const handleFocusInput = useCallback(() => {
    // Focus the main chat input
    const input = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    // Close any open modal
    if (settingsOpen) setSettingsOpen(false);
    else if (aboutOpen) setAboutOpen(false);
    else if (helpOpen) setHelpOpen(false);
    else if (keyboardShortcutsOpen) setKeyboardShortcutsOpen(false);
    else if (moreMenuOpen) setMoreMenuOpen(false);
    else if (modelSelectOpen) setModelSelectOpen(false);
    else if (agentMenuOpen) setAgentMenuOpen(false);
  }, [settingsOpen, aboutOpen, helpOpen, keyboardShortcutsOpen, moreMenuOpen, modelSelectOpen, agentMenuOpen]);

  const handleAgentChange = useCallback((agentId: string) => {
    const agent = enabledPresets.find(a => a.id === agentId);
    if (agent) {
      setActivePreset(agentId);
      logUIEvent(`Agent changed to: ${agent.name}`, 'ui:agent:change', { agentId, name: agent.name });
      setAgentMenuOpen(false);
    }
  }, [enabledPresets, setActivePreset, logUIEvent]);

  // Create keyboard shortcuts
  const shortcuts = useMemo(() => createDefaultShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: handleToggleSidebar,
    onFocusInput: handleFocusInput,
    onSettings: () => setSettingsOpen(true),
    onHelp: () => setKeyboardShortcutsOpen(true),
    onCloseModal: handleCloseModal,
  }), [handleNewChat, handleToggleSidebar, handleFocusInput, handleCloseModal]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({ shortcuts });

  // Use provided models or fall back to static list
  const defaultModels: ModelOption[] = [
    { id: "simulated", name: "Simulated", color: "text-gray-400" },
  ];

  const models = availableModels || defaultModels;

  const handleModelChange = (value: string) => {
    if (onModelChange) {
      onModelChange(value);
    }
  };

  return (
    <>
      <ErrorBoundary context="settings-modal" fallback={<ModalErrorFallback onClose={() => setSettingsOpen(false)} />}>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="about-modal" fallback={<ModalErrorFallback onClose={() => setAboutOpen(false)} />}>
        <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="help-modal" fallback={<ModalErrorFallback onClose={() => setHelpOpen(false)} />}>
        <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="keyboard-shortcuts-modal" fallback={<ModalErrorFallback onClose={() => setKeyboardShortcutsOpen(false)} />}>
        <KeyboardShortcutsModal open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen} shortcuts={shortcuts} />
      </ErrorBoundary>
      
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
              className="shrink-0"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            
            {/* Model Selector - responsive width */}
            <Select value={selectedModel} onValueChange={handleModelChange} open={modelSelectOpen} onOpenChange={setModelSelectOpen}>
              <SelectTrigger className="w-[140px] sm:w-[200px] border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-0 focus:ring-offset-0">
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 shrink-0 ${models.find(m => m.id === selectedModel)?.color || "text-purple-500"}`} />
                  <span className="truncate"><SelectValue /></span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {models.filter(model => enabledModels[model.id]).map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className={`h-4 w-4 ${model.color}`} />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Agent Selector */}
            <DropdownMenu open={agentMenuOpen} onOpenChange={setAgentMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 sm:px-3 border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: (activePreset?.color || '#8b5cf6') + '20',
                      borderColor: activePreset?.color || '#8b5cf6',
                      borderWidth: 1
                    }}
                  >
                    {activePreset?.icon || '🤖'}
                  </div>
                  <span className="hidden sm:inline truncate max-w-[100px]">{activePreset?.name || 'Agent'}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px]">
                {recentPresets.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-gray-500">Recent</DropdownMenuLabel>
                    {recentPresets.slice(0, 3).map(agent => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => handleAgentChange(agent.id)}
                        className="gap-2 cursor-pointer"
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                          style={{
                            backgroundColor: (agent.color || '#8b5cf6') + '20',
                          }}
                        >
                          {agent.icon || '🤖'}
                        </div>
                        <span className="flex-1 truncate">{agent.name}</span>
                        {activePreset?.id === agent.id && (
                          <Check className="h-4 w-4 text-purple-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel className="text-xs text-gray-500">All Agents</DropdownMenuLabel>
                {enabledPresets.map(agent => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => handleAgentChange(agent.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: (agent.color || '#8b5cf6') + '20',
                      }}
                    >
                      {agent.icon || '🤖'}
                    </div>
                    <span className="flex-1 truncate">{agent.name}</span>
                    {activePreset?.id === agent.id && (
                      <Check className="h-4 w-4 text-purple-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Arena Mode Toggle */}
            {onToggleArenaMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isArenaMode ? "default" : "ghost"}
                    size="icon"
                    onClick={onToggleArenaMode}
                    className={isArenaMode ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <Swords className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isArenaMode ? "Exit Arena Mode" : "Enter Arena Mode - Compare models side-by-side"}
                </TooltipContent>
              </Tooltip>
            )}

            <ConnectionHealthIndicator />
            <OfflineModeIndicator />
            
            {/* Mobile: icon only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="sm:hidden"
              title="New Chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            {/* Desktop: full button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="gap-2 hidden sm:flex"
            >
              <MessageSquare className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
            
            <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  Settings
                </DropdownMenuItem>
                {onToggleArenaMode && (
                  <DropdownMenuItem onClick={onToggleArenaMode}>
                    <Swords className="h-4 w-4 mr-2" />
                    {isArenaMode ? "Exit Arena Mode" : "Arena Mode"}
                    {isArenaMode && <span className="ml-auto text-xs text-purple-500">Active</span>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setHelpOpen(true)}>
                  Help & FAQ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setKeyboardShortcutsOpen(true)}>
                  <Keyboard className="h-4 w-4 mr-2" />
                  Keyboard Shortcuts
                  <span className="ml-auto text-xs text-muted-foreground">{formatShortcut(['mod', '?'])}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                  About
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}