/**
 * Keyboard Shortcuts Modal
 *
 * Displays all available keyboard shortcuts grouped by category.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { KeyboardShortcut, formatShortcut } from "../hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

const categoryLabels: Record<string, string> = {
  navigation: 'Navigation',
  chat: 'Chat',
  editing: 'Editing',
  general: 'General',
};

const categoryOrder = ['navigation', 'chat', 'editing', 'general'];

export function KeyboardShortcutsModal({ open, onOpenChange, shortcuts }: KeyboardShortcutsModalProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Sort categories by predefined order
  const sortedCategories = categoryOrder.filter(cat => groupedShortcuts[cat]?.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick actions to navigate and use aiMate efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sortedCategories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-2">
                {groupedShortcuts[category].map(shortcut => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted font-mono text-xs">
                      {formatShortcut(shortcut.keys)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">?</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
              {formatShortcut(['mod', '?'])}
            </kbd>{' '}
            anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
