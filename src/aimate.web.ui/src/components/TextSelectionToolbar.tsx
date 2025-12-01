/**
 * Text Selection Toolbar
 *
 * A floating toolbar that appears when text is selected in chat messages.
 * Provides quick actions like "Explain", "Ask about this", "Copy", and "Save to Knowledge".
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Lightbulb, MessageSquarePlus, Copy, Check, Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

interface TextSelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement>;
  onExplain?: (text: string) => void;
  onAsk?: (text: string) => void;
  onSaveToKnowledge?: (text: string) => Promise<void>;
  disabled?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function TextSelectionToolbar({
  containerRef,
  onExplain,
  onAsk,
  onSaveToKnowledge,
  disabled = false,
}: TextSelectionToolbarProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<Position | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Delay hiding to allow clicking toolbar buttons
      selectionTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        setSelectedText('');
      }, 200);
      return;
    }

    // Check if selection is within our container
    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Check if the selection is within the container
    const isWithinContainer = container.contains(
      commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentNode
        : commonAncestor
    );

    if (!isWithinContainer) {
      setVisible(false);
      return;
    }

    // Clear any pending hide timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setVisible(false);
      return;
    }

    // Get selection position
    const rect = range.getBoundingClientRect();

    // Position toolbar above the selection, centered
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10; // 10px above selection

    setSelectedText(text);
    setPosition({ x, y });
    setVisible(true);
    setCopied(false);
  }, [containerRef, disabled]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mouseup', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleSelection]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [selectedText]);

  const handleExplain = useCallback(() => {
    if (onExplain) {
      onExplain(selectedText);
      setVisible(false);
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, onExplain]);

  const handleAsk = useCallback(() => {
    if (onAsk) {
      onAsk(selectedText);
      setVisible(false);
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, onAsk]);

  const handleSaveToKnowledge = useCallback(async () => {
    if (onSaveToKnowledge && !saving) {
      try {
        setSaving(true);
        await onSaveToKnowledge(selectedText);
        toast.success('Saved to knowledge');
      } catch {
        toast.error('Failed to save');
      } finally {
        setSaving(false);
      }
    }
  }, [selectedText, onSaveToKnowledge, saving]);

  // Keep toolbar visible while interacting with it
  const handleToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
  }, []);

  if (!visible || !position) return null;

  const toolbarContent = (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseDown={handleToolbarMouseDown}
    >
      {onExplain && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs"
          onClick={handleExplain}
          title="Explain this"
        >
          <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
          <span>Explain</span>
        </Button>
      )}

      {onAsk && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs"
          onClick={handleAsk}
          title="Ask about this"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 text-blue-500" />
          <span>Ask</span>
        </Button>
      )}

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 gap-1.5 text-xs"
        onClick={handleCopy}
        title="Copy"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </Button>

      {onSaveToKnowledge && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs"
          onClick={handleSaveToKnowledge}
          disabled={saving}
          title="Save to Knowledge"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Brain className="h-3.5 w-3.5 text-purple-500" />
          )}
          <span>Save</span>
        </Button>
      )}

      {/* Arrow pointing down */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45"
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  );

  // Use portal to render at document root to avoid positioning issues
  return createPortal(toolbarContent, document.body);
}
