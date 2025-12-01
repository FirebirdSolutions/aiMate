/**
 * Mermaid Diagram Component
 *
 * Renders Mermaid diagrams with error handling and theme support.
 * Supports pan and zoom for interactive exploration.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Maximize2, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with theme-aware config
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
  },
});

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Render the mermaid diagram
  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Clean up the chart string
        const cleanChart = chart.trim();

        // Validate basic structure
        const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
          'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph',
          'mindmap', 'timeline', 'quadrantChart', 'sankey', 'xychart'];

        const firstWord = cleanChart.split(/[\s\n]/)[0].toLowerCase();
        const hasValidType = validTypes.some(t =>
          firstWord === t.toLowerCase() || firstWord.startsWith(t.toLowerCase())
        );

        if (!hasValidType) {
          throw new Error(`Invalid diagram type: ${firstWord}`);
        }

        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('[MermaidDiagram] Render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setSvg('');
      }
    };

    if (chart) {
      renderDiagram();
    }
  }, [chart]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Pan controls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Copy SVG
  const handleCopy = useCallback(async () => {
    if (svg) {
      try {
        await navigator.clipboard.writeText(svg);
        toast.success('SVG copied to clipboard');
      } catch {
        toast.error('Failed to copy SVG');
      }
    }
  }, [svg]);

  // Download SVG
  const handleDownload = useCallback(() => {
    if (svg) {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('SVG downloaded');
    }
  }, [svg]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Diagram Error</p>
        <p className="text-xs text-red-500 dark:text-red-500 mt-1">{error}</p>
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center text-xs text-gray-400 px-1 min-w-[3rem] justify-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleReset}
          title="Reset view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="w-px bg-gray-600 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleCopy}
          title="Copy SVG"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleDownload}
          title="Download SVG"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Diagram container with pan/zoom */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
        style={{ minHeight: '200px', maxHeight: '500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="transition-transform duration-100 ease-out p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}

export default MermaidDiagram;
