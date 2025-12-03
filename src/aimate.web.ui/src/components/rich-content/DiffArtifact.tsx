/**
 * Diff Artifact Component
 *
 * Renders code diffs with syntax highlighting.
 * Supports split view and unified view modes.
 */

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Brain,
  GitCompare,
  Maximize2,
  Minimize2,
  Columns2,
  Rows3,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import type { DiffArtifactData, ArtifactProps } from "./types";

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

// Parse unified diff format
function parseUnifiedDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple line-by-line diff (not a full diff algorithm)
  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldIdx < oldLines.length ? oldLines[oldIdx] : undefined;
    const newLine = newIdx < newLines.length ? newLines[newIdx] : undefined;

    if (oldLine === newLine) {
      // Context line
      result.push({
        type: 'context',
        content: oldLine || '',
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
      oldIdx++;
      newIdx++;
    } else if (oldLine !== undefined && (newLine === undefined || !newLines.slice(newIdx).includes(oldLine))) {
      // Removed line
      result.push({
        type: 'remove',
        content: oldLine,
        oldLineNum: oldLineNum++,
      });
      oldIdx++;
    } else if (newLine !== undefined) {
      // Added line
      result.push({
        type: 'add',
        content: newLine,
        newLineNum: newLineNum++,
      });
      newIdx++;
    }
  }

  return result;
}

// Parse pre-formatted diff (like git diff output)
function parseDiffFormat(diff: string): DiffLine[] {
  const lines = diff.split('\n');
  const result: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const line of lines) {
    // Skip diff headers
    if (line.startsWith('diff ') || line.startsWith('index ') ||
        line.startsWith('---') || line.startsWith('+++') ||
        line.startsWith('@@')) {
      continue;
    }

    if (line.startsWith('+')) {
      result.push({
        type: 'add',
        content: line.slice(1),
        newLineNum: newLineNum++,
      });
    } else if (line.startsWith('-')) {
      result.push({
        type: 'remove',
        content: line.slice(1),
        oldLineNum: oldLineNum++,
      });
    } else {
      result.push({
        type: 'context',
        content: line.startsWith(' ') ? line.slice(1) : line,
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
    }
  }

  return result;
}

export function DiffArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<DiffArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(data.viewMode || 'unified');

  // Parse the diff
  const diffLines = useMemo(() => {
    if (data.diff) {
      // Pre-formatted diff
      return parseDiffFormat(data.diff);
    } else if (data.oldText !== undefined && data.newText !== undefined) {
      // Compare two texts
      return parseUnifiedDiff(data.oldText, data.newText);
    }
    return [];
  }, [data.diff, data.oldText, data.newText]);

  // Calculate stats
  const stats = useMemo(() => {
    const additions = diffLines.filter(l => l.type === 'add').length;
    const deletions = diffLines.filter(l => l.type === 'remove').length;
    return { additions, deletions };
  }, [diffLines]);

  const handleCopy = async () => {
    try {
      const content = data.diff || `--- old\n+++ new\n${diffLines.map(l => {
        const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
        return prefix + l.content;
      }).join('\n')}`;
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied diff to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  const renderUnifiedView = () => (
    <div className="font-mono text-xs overflow-auto">
      {diffLines.map((line, idx) => (
        <div
          key={idx}
          className={`flex ${
            line.type === 'add'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : line.type === 'remove'
              ? 'bg-red-500/10 text-red-700 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <span className="w-12 px-2 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            {line.oldLineNum || ''}
          </span>
          <span className="w-12 px-2 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            {line.newLineNum || ''}
          </span>
          <span className="w-5 text-center flex-shrink-0 select-none">
            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
          </span>
          <span className="flex-1 px-2 whitespace-pre">{line.content}</span>
        </div>
      ))}
    </div>
  );

  const renderSplitView = () => {
    // Separate lines into old (left) and new (right)
    const leftLines: (DiffLine | null)[] = [];
    const rightLines: (DiffLine | null)[] = [];

    for (const line of diffLines) {
      if (line.type === 'context') {
        leftLines.push(line);
        rightLines.push(line);
      } else if (line.type === 'remove') {
        leftLines.push(line);
        rightLines.push(null);
      } else if (line.type === 'add') {
        leftLines.push(null);
        rightLines.push(line);
      }
    }

    // Balance arrays
    const maxLen = Math.max(leftLines.length, rightLines.length);
    while (leftLines.length < maxLen) leftLines.push(null);
    while (rightLines.length < maxLen) rightLines.push(null);

    return (
      <div className="font-mono text-xs overflow-auto flex">
        {/* Left side (old) */}
        <div className="flex-1 border-r border-gray-300 dark:border-gray-600">
          <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {data.oldFile || 'Original'}
          </div>
          {leftLines.map((line, idx) => (
            <div
              key={`left-${idx}`}
              className={`flex min-h-[1.5rem] ${
                line?.type === 'remove'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="w-10 px-2 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                {line?.oldLineNum || ''}
              </span>
              <span className="flex-1 px-2 whitespace-pre">{line?.content || ''}</span>
            </div>
          ))}
        </div>

        {/* Right side (new) */}
        <div className="flex-1">
          <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {data.newFile || 'Modified'}
          </div>
          {rightLines.map((line, idx) => (
            <div
              key={`right-${idx}`}
              className={`flex min-h-[1.5rem] ${
                line?.type === 'add'
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="w-10 px-2 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                {line?.newLineNum || ''}
              </span>
              <span className="flex-1 px-2 whitespace-pre">{line?.content || ''}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-3xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium">
            {data.title || 'Diff'}
          </span>
          {data.language && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {data.language}
            </Badge>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Plus className="h-3 w-3" />
              {stats.additions}
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <Minus className="h-3 w-3" />
              {stats.deletions}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${viewMode === 'split' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <Columns2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${viewMode === 'unified' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => setViewMode('unified')}
            title="Unified view"
          >
            <Rows3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy diff"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          {onSaveToKnowledge && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleSaveToKnowledge}
              title="Save to Knowledge"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={`bg-white dark:bg-gray-950 ${fullscreen ? 'flex-1 overflow-auto' : 'max-h-[500px] overflow-auto'}`}>
          {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
        </div>
      )}
    </div>
  );
}

export default DiffArtifact;
