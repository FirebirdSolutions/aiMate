/**
 * Math Artifact Component
 *
 * Renders LaTeX mathematical expressions using KaTeX.
 * Supports both inline and display mode math.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Brain,
  Sigma,
  Maximize2,
  Minimize2,
  Code2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { MathArtifactData, ArtifactProps } from "./types";

export function MathArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<MathArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const isDisplayMode = data.displayMode !== false; // Default to display mode

  // Render LaTeX using KaTeX
  const renderMath = useCallback(async () => {
    if (!data.latex) return;

    setIsRendering(true);
    setError(null);

    try {
      // Dynamically import KaTeX
      const katex = (await import('katex')).default;
      // Also load the CSS
      await import('katex/dist/katex.min.css');

      const rendered = katex.renderToString(data.latex, {
        displayMode: isDisplayMode,
        throwOnError: false,
        errorColor: '#ef4444',
        trust: false,
        strict: false,
        macros: {
          // Common macros
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
          "\\Q": "\\mathbb{Q}",
          "\\C": "\\mathbb{C}",
        },
      });

      setHtml(rendered);
    } catch (err) {
      console.error('[MathArtifact] Render error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render math');
    } finally {
      setIsRendering(false);
    }
  }, [data.latex, isDisplayMode]);

  // Render on mount and when latex changes
  useEffect(() => {
    if (isExpanded) {
      renderMath();
    }
  }, [isExpanded, renderMath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied LaTeX to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  // Determine math type for badge
  const getMathType = (): string => {
    const latex = data.latex.toLowerCase();
    if (latex.includes('\\int') || latex.includes('\\iint') || latex.includes('\\oint')) return 'Integral';
    if (latex.includes('\\sum') || latex.includes('\\prod')) return 'Series';
    if (latex.includes('\\lim')) return 'Limit';
    if (latex.includes('\\frac') && latex.includes('d')) return 'Derivative';
    if (latex.includes('\\matrix') || latex.includes('\\begin{pmatrix}') || latex.includes('\\begin{bmatrix}')) return 'Matrix';
    if (latex.includes('\\sqrt')) return 'Root';
    if (latex.includes('\\begin{align}') || latex.includes('\\begin{equation}')) return 'Equation';
    return 'Math';
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sigma className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">
            {data.title || 'Math Expression'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {getMathType()}
          </Badge>
          {!isDisplayMode && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              inline
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1"
            onClick={renderMath}
            disabled={isRendering}
            title="Re-render"
          >
            <RefreshCw className={`h-3 w-3 ${isRendering ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${showCode ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => setShowCode(!showCode)}
            title={showCode ? "Hide LaTeX" : "Show LaTeX"}
          >
            <Code2 className="h-3.5 w-3.5" />
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
            title="Copy LaTeX"
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
        <div className={`${fullscreen ? 'flex-1 overflow-hidden flex flex-col' : ''}`}>
          {/* LaTeX source (toggleable) */}
          {showCode && (
            <pre className="p-3 overflow-auto font-mono text-xs bg-gray-900 text-gray-100 max-h-40 border-b border-gray-700">
              <code>{data.latex}</code>
            </pre>
          )}

          {/* Rendered math */}
          <div
            className={`p-6 flex items-center justify-center bg-white dark:bg-gray-950 ${fullscreen ? 'flex-1 overflow-auto' : 'min-h-[80px]'}`}
          >
            {isRendering && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Rendering...</span>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm p-4 text-center flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {html && !error && (
              <div
                className="text-gray-900 dark:text-gray-100 text-lg overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>

          {/* Description if provided */}
          {data.description && (
            <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {data.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MathArtifact;
