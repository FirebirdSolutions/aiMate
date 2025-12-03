/**
 * Mermaid Artifact Component
 *
 * Renders Mermaid diagrams - flowcharts, sequence diagrams, ER diagrams, etc.
 * Uses mermaid.js for rendering with dark mode support.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  GitBranch,
  Maximize2,
  Minimize2,
  RefreshCw,
  Code2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { MermaidArtifactData, ArtifactProps } from "./types";

// Detect diagram type from mermaid code
function detectDiagramType(code: string): string {
  const firstLine = code.trim().split('\n')[0].toLowerCase();
  if (firstLine.includes('flowchart') || firstLine.includes('graph')) return 'Flowchart';
  if (firstLine.includes('sequencediagram')) return 'Sequence';
  if (firstLine.includes('classDiagram')) return 'Class';
  if (firstLine.includes('erdiagram')) return 'ER Diagram';
  if (firstLine.includes('gantt')) return 'Gantt';
  if (firstLine.includes('pie')) return 'Pie Chart';
  if (firstLine.includes('gitgraph')) return 'Git Graph';
  if (firstLine.includes('mindmap')) return 'Mind Map';
  if (firstLine.includes('timeline')) return 'Timeline';
  if (firstLine.includes('statediagram')) return 'State';
  return 'Diagram';
}

export function MermaidArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<MermaidArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  const diagramType = detectDiagramType(data.code);

  // Load and render mermaid
  const renderDiagram = useCallback(async () => {
    if (!data.code) return;

    setIsRendering(true);
    setError(null);

    try {
      // Dynamically import mermaid
      const mermaid = (await import('mermaid')).default;

      // Configure mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'strict',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      });

      // Generate unique ID for this render
      const renderId = ++renderIdRef.current;
      const elementId = `mermaid-${renderId}-${Date.now()}`;

      // Render the diagram
      const { svg } = await mermaid.render(elementId, data.code);

      // Only update if this is still the latest render
      if (renderId === renderIdRef.current) {
        setSvgContent(svg);
      }
    } catch (err) {
      console.error('[MermaidArtifact] Render error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render diagram');
    } finally {
      setIsRendering(false);
    }
  }, [data.code]);

  // Render on mount and when code changes
  useEffect(() => {
    if (isExpanded) {
      renderDiagram();
    }
  }, [isExpanded, renderDiagram]);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (isExpanded && svgContent) {
        renderDiagram();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [isExpanded, svgContent, renderDiagram]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied mermaid code to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) {
      toast.error("No diagram to download");
      return;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || 'diagram'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded SVG");
  };

  const handleDownloadPng = async () => {
    if (!svgContent || !containerRef.current) {
      toast.error("No diagram to download");
      return;
    }

    try {
      // Create a canvas to convert SVG to PNG
      const svgElement = containerRef.current.querySelector('svg');
      if (!svgElement) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();
      const scale = 2; // Higher resolution
      canvas.width = svgRect.width * scale;
      canvas.height = svgRect.height * scale;

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${data.title || 'diagram'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("Downloaded PNG");
        }, 'image/png');
      };
      img.src = svgUrl;
    } catch (err) {
      toast.error("Failed to export PNG");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium">
            {data.title || 'Diagram'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {diagramType}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1"
            onClick={renderDiagram}
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
            title={showCode ? "Hide code" : "Show code"}
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
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownloadSvg}
            title="Download SVG"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownloadPng}
            title="Download PNG"
          >
            <ImageIcon className="h-3.5 w-3.5" />
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
          {/* Code view (toggleable) */}
          {showCode && (
            <pre className="p-3 overflow-auto font-mono text-xs bg-gray-900 text-gray-100 max-h-40 border-b border-gray-700">
              <code>{data.code}</code>
            </pre>
          )}

          {/* Diagram render area */}
          <div
            ref={containerRef}
            className={`p-4 flex items-center justify-center bg-white dark:bg-gray-950 ${fullscreen ? 'flex-1 overflow-auto' : 'min-h-[200px] max-h-[500px] overflow-auto'}`}
          >
            {isRendering && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Rendering diagram...</span>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm p-4 text-center">
                <p className="font-medium">Failed to render diagram</p>
                <p className="text-xs mt-1 text-gray-500">{error}</p>
              </div>
            )}
            {svgContent && !error && (
              <div
                className="mermaid-container w-full flex justify-center"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MermaidArtifact;
