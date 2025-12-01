import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "./ui/button";
import { Menu, MoreVertical, Plus, PanelLeftClose, PanelLeft, ChevronDown, Sparkles, MessageSquare, Keyboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
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
}: ChatHeaderProps) {
  const { showcaseMode } = useDebug();
  const { logUIEvent } = useUIEventLogger();
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  }, [settingsOpen, aboutOpen, helpOpen, keyboardShortcutsOpen, moreMenuOpen, modelSelectOpen]);

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
          </div>
          
          <div className="flex items-center gap-2">
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