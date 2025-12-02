/**
 * Canvas Artifact Component
 *
 * Renders interactive HTML5 Canvas visualizations.
 * Supports p5.js-style sketches and raw Canvas API code.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  Palette,
  Maximize2,
  Minimize2,
  Play,
  Square,
  RefreshCw,
  Code2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { CanvasArtifactData, ArtifactProps } from "./types";

export function CanvasArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<CanvasArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasWidth = data.width || 400;
  const canvasHeight = data.height || 400;

  // Generate the sandboxed HTML for the canvas
  const generateCanvasHtml = useCallback(() => {
    const isP5 = data.mode === 'p5' || data.code.includes('setup') || data.code.includes('draw');

    if (isP5) {
      // p5.js mode
      return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script>
    // Error handling
    window.onerror = function(msg, url, line) {
      parent.postMessage({ error: msg + ' (line ' + line + ')' }, '*');
      return true;
    };

    try {
      ${data.code}
      parent.postMessage({ status: 'running' }, '*');
    } catch (e) {
      parent.postMessage({ error: e.message }, '*');
    }
  </script>
</body>
</html>`;
    } else {
      // Raw Canvas API mode
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      overflow: hidden;
    }
    canvas { display: block; background: white; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
  <script>
    // Error handling
    window.onerror = function(msg, url, line) {
      parent.postMessage({ error: msg + ' (line ' + line + ')' }, '*');
      return true;
    };

    try {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');

      // Helper functions
      const width = ${canvasWidth};
      const height = ${canvasHeight};
      const clear = () => ctx.clearRect(0, 0, width, height);
      const fill = (color) => { ctx.fillStyle = color; };
      const stroke = (color) => { ctx.strokeStyle = color; };
      const rect = (x, y, w, h) => ctx.fillRect(x, y, w, h);
      const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
      const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };

      ${data.code}
      parent.postMessage({ status: 'running' }, '*');
    } catch (e) {
      parent.postMessage({ error: e.message }, '*');
    }
  </script>
</body>
</html>`;
    }
  }, [data.code, data.mode, canvasWidth, canvasHeight]);

  // Run the canvas code
  const runCanvas = useCallback(() => {
    setIsRunning(true);
    setError(null);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateCanvasHtml();
    }
  }, [generateCanvasHtml]);

  // Stop the canvas
  const stopCanvas = useCallback(() => {
    setIsRunning(false);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
    }
  }, []);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframeRef.current?.contentWindow) {
        if (event.data.error) {
          setError(event.data.error);
          setIsRunning(false);
        } else if (event.data.status === 'running') {
          setIsRunning(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-run on expand if autoRun is set
  useEffect(() => {
    if (isExpanded && data.autoRun !== false && !isRunning) {
      runCanvas();
    }
  }, [isExpanded, data.autoRun]);

  // Copy code
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied code to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Download as PNG
  const handleDownloadPng = () => {
    if (!iframeRef.current?.contentWindow) {
      toast.error("Canvas not running");
      return;
    }

    try {
      const canvas = iframeRef.current.contentWindow.document.querySelector('canvas');
      if (!canvas) {
        toast.error("No canvas found");
        return;
      }

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title || 'canvas'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloaded PNG");
    } catch (err) {
      toast.error("Failed to export - canvas may be tainted");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  const mode = data.mode === 'p5' || data.code.includes('setup') ? 'p5.js' : 'Canvas';

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
          <span className="text-sm font-medium">
            {data.title || 'Canvas'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {mode}
          </Badge>
          <span className="text-xs text-gray-400">
            {canvasWidth} × {canvasHeight}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 gap-1 ${isRunning ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
            onClick={isRunning ? stopCanvas : runCanvas}
            title={isRunning ? "Stop" : "Run"}
          >
            {isRunning ? (
              <>
                <Square className="h-3 w-3" />
                <span className="text-xs">Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span className="text-xs">Run</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={runCanvas}
            title="Restart"
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
            onClick={handleDownloadPng}
            title="Download PNG"
            disabled={!isRunning}
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
        <div className={`${fullscreen ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
          {/* Code view (toggleable) */}
          {showCode && (
            <pre className="p-3 overflow-auto font-mono text-xs bg-gray-900 text-gray-100 max-h-40 border-b border-gray-700">
              <code>{data.code}</code>
            </pre>
          )}

          {/* Error display */}
          {error && (
            <div className="px-3 py-2 bg-red-900/20 border-b border-red-800 text-red-400 text-sm">
              Error: {error}
            </div>
          )}

          {/* Canvas iframe */}
          <div
            className={`flex items-center justify-center bg-[#1a1a2e] ${fullscreen ? 'flex-1' : ''}`}
            style={{ minHeight: fullscreen ? undefined : canvasHeight + 40 }}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts"
              className="border-0"
              style={{
                width: fullscreen ? '100%' : canvasWidth,
                height: fullscreen ? '100%' : canvasHeight,
                maxWidth: '100%',
              }}
              title={data.title || 'Canvas'}
            />
          </div>

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

export default CanvasArtifact;
