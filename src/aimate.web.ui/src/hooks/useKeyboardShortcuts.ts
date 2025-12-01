/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for the aiMate application.
 * Supports both Mac (⌘) and Windows/Linux (Ctrl) modifiers.
 */

import { useEffect, useCallback, useState } from 'react';

export interface KeyboardShortcut {
  id: string;
  keys: string[];  // e.g., ['mod', 'k'] where 'mod' = ⌘ on Mac, Ctrl elsewhere
  description: string;
  category: 'navigation' | 'chat' | 'editing' | 'general';
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

// Detect if running on Mac
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Format keys for display
export function formatShortcut(keys: string[]): string {
  return keys.map(key => {
    switch (key.toLowerCase()) {
      case 'mod':
        return isMac ? '⌘' : 'Ctrl';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'enter':
        return '↵';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'arrowup':
        return '↑';
      case 'arrowdown':
        return '↓';
      case 'arrowleft':
        return '←';
      case 'arrowright':
        return '→';
      case 'backspace':
        return '⌫';
      case 'delete':
        return '⌦';
      case 'space':
        return 'Space';
      default:
        return key.toUpperCase();
    }
  }).join(isMac ? '' : '+');
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs (except for escape and mod shortcuts)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    for (const shortcut of shortcuts) {
      const keys = shortcut.keys.map(k => k.toLowerCase());
      const requiresMod = keys.includes('mod');
      const requiresShift = keys.includes('shift');
      const requiresAlt = keys.includes('alt');

      // Get the main key (not a modifier)
      const mainKey = keys.find(k => !['mod', 'shift', 'alt', 'ctrl'].includes(k));

      if (!mainKey) continue;

      // Check modifiers
      const modPressed = isMac ? event.metaKey : event.ctrlKey;
      const modMatches = requiresMod ? modPressed : !modPressed;
      const shiftMatches = requiresShift ? event.shiftKey : !event.shiftKey;
      const altMatches = requiresAlt ? event.altKey : !event.altKey;

      // Check main key
      const keyMatches = event.key.toLowerCase() === mainKey.toLowerCase() ||
                         event.code.toLowerCase() === `key${mainKey.toLowerCase()}`;

      // Skip if in input and not a modifier shortcut (except Escape)
      if (isInput && !requiresMod && mainKey.toLowerCase() !== 'escape') {
        continue;
      }

      if (keyMatches && modMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    helpModalOpen,
    setHelpModalOpen,
    formatShortcut,
  };
}

// Default shortcuts factory
export function createDefaultShortcuts(handlers: {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onFocusInput?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onCloseModal?: () => void;
  onAdmin?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onNewChat) {
    shortcuts.push({
      id: 'new-chat',
      keys: ['mod', 'n'],
      description: 'New conversation',
      category: 'chat',
      action: handlers.onNewChat,
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      id: 'toggle-sidebar',
      keys: ['mod', 'b'],
      description: 'Toggle sidebar',
      category: 'navigation',
      action: handlers.onToggleSidebar,
    });
  }

  if (handlers.onFocusInput) {
    shortcuts.push({
      id: 'focus-input',
      keys: ['mod', '/'],
      description: 'Focus message input',
      category: 'chat',
      action: handlers.onFocusInput,
    });
  }

  if (handlers.onSearch) {
    shortcuts.push({
      id: 'search',
      keys: ['mod', 'k'],
      description: 'Search conversations',
      category: 'navigation',
      action: handlers.onSearch,
    });
  }

  if (handlers.onSettings) {
    shortcuts.push({
      id: 'settings',
      keys: ['mod', ','],
      description: 'Open settings',
      category: 'general',
      action: handlers.onSettings,
    });
  }

  if (handlers.onAdmin) {
    shortcuts.push({
      id: 'admin',
      keys: ['mod', 'shift', 'a'],
      description: 'Open admin panel',
      category: 'general',
      action: handlers.onAdmin,
    });
  }

  if (handlers.onHelp) {
    shortcuts.push({
      id: 'help',
      keys: ['mod', '?'],
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: handlers.onHelp,
    });
  }

  if (handlers.onCloseModal) {
    shortcuts.push({
      id: 'close-modal',
      keys: ['escape'],
      description: 'Close modal / Cancel',
      category: 'general',
      action: handlers.onCloseModal,
    });
  }

  return shortcuts;
}
