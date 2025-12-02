/**
 * Regex Artifact Component
 *
 * Interactive regex tester with live matching and group highlighting.
 * Supports flags, match highlighting, and capture group display.
 */

import { useState, useMemo, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Brain,
  Regex,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import type { RegexArtifactData, ArtifactProps } from "./types";

interface MatchResult {
  fullMatch: string;
  groups: string[];
  index: number;
  input: string;
}

export function RegexArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<RegexArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Editable state for interactive testing
  const [pattern, setPattern] = useState(data.pattern);
  const [flags, setFlags] = useState(data.flags || 'g');
  const [testString, setTestString] = useState(data.testString || '');
  const [showSettings, setShowSettings] = useState(false);

  // Compute regex and matches
  const { regex, error, matches } = useMemo(() => {
    try {
      const rx = new RegExp(pattern, flags);
      const results: MatchResult[] = [];

      if (flags.includes('g')) {
        let match;
        while ((match = rx.exec(testString)) !== null) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: testString,
          });
          // Prevent infinite loops with zero-width matches
          if (match.index === rx.lastIndex) {
            rx.lastIndex++;
          }
        }
      } else {
        const match = rx.exec(testString);
        if (match) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: testString,
          });
        }
      }

      return { regex: rx, error: null, matches: results };
    } catch (err) {
      return {
        regex: null,
        error: err instanceof Error ? err.message : 'Invalid regex',
        matches: [],
      };
    }
  }, [pattern, flags, testString]);

  // Highlight matches in test string
  const highlightedText = useMemo(() => {
    if (!testString || matches.length === 0) return null;

    const parts: { text: string; isMatch: boolean; matchIndex?: number }[] = [];
    let lastIndex = 0;

    // Sort matches by index
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

    for (let i = 0; i < sortedMatches.length; i++) {
      const match = sortedMatches[i];
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: testString.slice(lastIndex, match.index), isMatch: false });
      }
      // Add match
      parts.push({ text: match.fullMatch, isMatch: true, matchIndex: i });
      lastIndex = match.index + match.fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), isMatch: false });
    }

    return parts;
  }, [testString, matches]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`/${pattern}/${flags}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied regex to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => {
      if (prev.includes(flag)) {
        return prev.replace(flag, '');
      } else {
        return prev + flag;
      }
    });
  }, []);

  // Color palette for match highlighting
  const matchColors = [
    'bg-yellow-200 dark:bg-yellow-800/50',
    'bg-green-200 dark:bg-green-800/50',
    'bg-blue-200 dark:bg-blue-800/50',
    'bg-pink-200 dark:bg-pink-800/50',
    'bg-purple-200 dark:bg-purple-800/50',
  ];

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Regex className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium">
            {data.title || 'Regex Tester'}
          </span>
          {error ? (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Invalid
            </Badge>
          ) : matches.length > 0 ? (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </Badge>
          ) : testString ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              No matches
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${showSettings ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings2 className="h-3.5 w-3.5" />
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
            title="Copy regex"
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
        <div className={`bg-white dark:bg-gray-950 ${fullscreen ? 'flex-1 overflow-auto' : ''}`}>
          {/* Pattern Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-mono">/</span>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="flex-1 font-mono text-sm"
                placeholder="Enter regex pattern..."
              />
              <span className="text-gray-500 font-mono">/</span>
              <Input
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className="w-16 font-mono text-sm text-center"
                placeholder="flags"
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Flags toggles */}
            {showSettings && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { flag: 'g', label: 'Global', desc: 'Find all matches' },
                  { flag: 'i', label: 'Case Insensitive', desc: 'Ignore case' },
                  { flag: 'm', label: 'Multiline', desc: '^ and $ match line boundaries' },
                  { flag: 's', label: 'Dotall', desc: '. matches newlines' },
                  { flag: 'u', label: 'Unicode', desc: 'Unicode support' },
                ].map(({ flag, label }) => (
                  <Button
                    key={flag}
                    variant={flags.includes(flag) ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleFlag(flag)}
                  >
                    {flag} - {label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Test String Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Test String
            </label>
            <Textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="font-mono text-sm min-h-[80px]"
              placeholder="Enter text to test against..."
            />
          </div>

          {/* Results */}
          {testString && (
            <div className="p-3 space-y-3">
              {/* Highlighted text */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Matches Highlighted
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm whitespace-pre-wrap break-all">
                  {highlightedText ? (
                    highlightedText.map((part, idx) => (
                      <span
                        key={idx}
                        className={part.isMatch ? `${matchColors[part.matchIndex! % matchColors.length]} px-0.5 rounded` : ''}
                      >
                        {part.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">{testString}</span>
                  )}
                </div>
              </div>

              {/* Match details */}
              {matches.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Match Details ({matches.length})
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-auto">
                    {matches.map((match, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg ${matchColors[idx % matchColors.length]} border border-gray-200 dark:border-gray-700`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            Match {idx + 1}
                          </Badge>
                          <span className="text-gray-500">
                            Index: {match.index}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-sm">
                          <span className="font-medium">Full:</span>{' '}
                          <code className="bg-gray-900/10 dark:bg-white/10 px-1 rounded">
                            {match.fullMatch}
                          </code>
                        </div>
                        {match.groups.length > 0 && (
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {match.groups.map((group, gIdx) => (
                              <div key={gIdx}>
                                <span className="font-medium">Group {gIdx + 1}:</span>{' '}
                                <code className="bg-gray-900/10 dark:bg-white/10 px-1 rounded">
                                  {group || '(empty)'}
                                </code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No matches indicator */}
              {!error && testString && matches.length === 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>No matches found</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {data.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RegexArtifact;
