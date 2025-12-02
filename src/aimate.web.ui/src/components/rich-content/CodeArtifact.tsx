/**
 * Code Artifact Component
 *
 * Renders executable code with syntax highlighting and browser sandbox execution.
 * Supports JavaScript and TypeScript execution in a sandboxed iframe.
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  Code,
  Play,
  Square,
  Maximize2,
  Minimize2,
  Terminal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { CodeArtifactData, ArtifactProps } from "./types";

// Languages that can be executed in browser
const EXECUTABLE_LANGUAGES = ['javascript', 'js', 'typescript', 'ts'];

// Language display names and file extensions
const LANGUAGE_INFO: Record<string, { display: string; ext: string }> = {
  javascript: { display: 'JavaScript', ext: 'js' },
  js: { display: 'JavaScript', ext: 'js' },
  typescript: { display: 'TypeScript', ext: 'ts' },
  ts: { display: 'TypeScript', ext: 'ts' },
  python: { display: 'Python', ext: 'py' },
  py: { display: 'Python', ext: 'py' },
  html: { display: 'HTML', ext: 'html' },
  css: { display: 'CSS', ext: 'css' },
  json: { display: 'JSON', ext: 'json' },
  bash: { display: 'Bash', ext: 'sh' },
  sh: { display: 'Bash', ext: 'sh' },
  sql: { display: 'SQL', ext: 'sql' },
  rust: { display: 'Rust', ext: 'rs' },
  go: { display: 'Go', ext: 'go' },
  java: { display: 'Java', ext: 'java' },
  csharp: { display: 'C#', ext: 'cs' },
  cs: { display: 'C#', ext: 'cs' },
  cpp: { display: 'C++', ext: 'cpp' },
  c: { display: 'C', ext: 'c' },
};

interface ExecutionResult {
  logs: { type: 'log' | 'warn' | 'error' | 'info'; args: string[] }[];
  error?: string;
  duration: number;
}

export function CodeArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<CodeArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const language = data.language?.toLowerCase() || 'javascript';
  const langInfo = LANGUAGE_INFO[language] || { display: language, ext: 'txt' };
  const isExecutable = data.executable !== false && EXECUTABLE_LANGUAGES.includes(language);
  const lineCount = data.code.split('\n').length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([data.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || `code.${langInfo.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${data.filename || `code.${langInfo.ext}`}`);
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  const stopExecution = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (iframeRef.current) {
      // Remove and recreate iframe to stop execution
      const parent = iframeRef.current.parentNode;
      if (parent) {
        parent.removeChild(iframeRef.current);
        const newIframe = document.createElement('iframe');
        newIframe.sandbox.add('allow-scripts');
        newIframe.style.display = 'none';
        parent.appendChild(newIframe);
        iframeRef.current = newIframe as HTMLIFrameElement;
      }
    }
    setIsRunning(false);
    toast.info("Execution stopped");
  }, []);

  const runCode = useCallback(async () => {
    if (!isExecutable || isRunning) return;

    setIsRunning(true);
    setShowOutput(true);
    setResult(null);

    const startTime = performance.now();
    const logs: ExecutionResult['logs'] = [];
    let executionError: string | undefined;

    // Create sandboxed iframe for execution
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts'); // Only allow scripts, no DOM access, no same-origin
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // Set up message handler for console output
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      const { type, args, error, done } = event.data;

      if (error) {
        executionError = error;
      } else if (type) {
        logs.push({ type, args });
      }

      if (done) {
        cleanup();
      }
    };

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setIsRunning(false);
      setResult({
        logs,
        error: executionError,
        duration: performance.now() - startTime,
      });
    };

    window.addEventListener('message', handleMessage);

    // Set execution timeout (10 seconds)
    timeoutRef.current = window.setTimeout(() => {
      executionError = 'Execution timed out (10 second limit)';
      cleanup();
      toast.error("Execution timed out");
    }, 10000);

    // Prepare code for execution
    // For TypeScript, we do a simple strip of type annotations (basic approach)
    let codeToRun = data.code;
    if (language === 'typescript' || language === 'ts') {
      // Basic TypeScript to JavaScript conversion (strips type annotations)
      // This is a simplified approach - a real implementation would use the TS compiler
      codeToRun = stripTypeAnnotations(data.code);
    }

    // Create the sandbox code with console overrides
    const sandboxCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            // Override console methods to send messages to parent
            const originalConsole = { ...console };
            const sendLog = (type, args) => {
              parent.postMessage({
                type,
                args: args.map(arg => {
                  try {
                    if (typeof arg === 'object') {
                      return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                  } catch {
                    return String(arg);
                  }
                })
              }, '*');
            };

            console.log = (...args) => sendLog('log', args);
            console.warn = (...args) => sendLog('warn', args);
            console.error = (...args) => sendLog('error', args);
            console.info = (...args) => sendLog('info', args);

            // Execute the user code
            try {
              ${codeToRun}
              parent.postMessage({ done: true }, '*');
            } catch (error) {
              parent.postMessage({ error: error.message || String(error), done: true }, '*');
            }
          <\/script>
        </head>
        <body></body>
      </html>
    `;

    // Write to iframe
    try {
      iframe.srcdoc = sandboxCode;
    } catch (e) {
      executionError = `Failed to start execution: ${e}`;
      cleanup();
    }
  }, [data.code, language, isExecutable, isRunning]);

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">
            {data.title || data.filename || 'Code'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {langInfo.display}
          </Badge>
          <span className="text-xs text-gray-400">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isExecutable && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 gap-1 ${isRunning ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
              onClick={isRunning ? stopExecution : runCode}
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
          )}
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
            title="Copy"
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
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
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

      {/* Code Content */}
      {isExpanded && (
        <div className={`${fullscreen ? 'flex-1 overflow-hidden flex flex-col' : ''}`}>
          <pre className={`p-3 overflow-auto font-mono text-xs bg-gray-900 text-gray-100 ${fullscreen ? 'flex-1' : 'max-h-80'}`}>
            <code>
              {data.code.split('\n').map((line, idx) => (
                <div key={idx} className="flex">
                  <span className="w-8 pr-3 text-gray-500 text-right select-none">
                    {idx + 1}
                  </span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                </div>
              ))}
            </code>
          </pre>

          {/* Output Panel */}
          {showOutput && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 cursor-pointer"
                onClick={() => setShowOutput(!showOutput)}
              >
                <Terminal className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Output
                </span>
                {isRunning && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
                {result?.error && (
                  <AlertCircle className="h-3 w-3 text-red-500" />
                )}
                {result && !result.error && (
                  <span className="text-[10px] text-gray-400">
                    {result.duration.toFixed(0)}ms
                  </span>
                )}
              </div>
              <div className={`p-2 bg-gray-950 font-mono text-xs overflow-auto ${fullscreen ? 'max-h-48' : 'max-h-40'}`}>
                {isRunning && !result && (
                  <div className="text-gray-400 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Running...
                  </div>
                )}
                {result?.error && (
                  <div className="text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{result.error}</span>
                  </div>
                )}
                {result?.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`py-0.5 ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-yellow-400' :
                      log.type === 'info' ? 'text-blue-400' :
                      'text-gray-300'
                    }`}
                  >
                    {log.args.join(' ')}
                  </div>
                ))}
                {result && result.logs.length === 0 && !result.error && (
                  <div className="text-gray-500 italic">No output</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Basic TypeScript to JavaScript conversion
 * Strips type annotations - this is a simplified approach
 * A production implementation would use the TypeScript compiler
 */
function stripTypeAnnotations(code: string): string {
  // Remove interface/type declarations
  code = code.replace(/^(interface|type)\s+\w+.*?[{;][\s\S]*?^}/gm, '');
  code = code.replace(/^type\s+\w+\s*=\s*[^;]+;/gm, '');

  // Remove type annotations from variables: const x: Type = ...
  code = code.replace(/:\s*\w+(\[\])?(\s*[|&]\s*\w+(\[\])?)*(?=\s*[=;,)])/g, '');

  // Remove generic type parameters: <T>, <T, U>
  code = code.replace(/<[^>]+>/g, '');

  // Remove function return type annotations: ): Type {
  code = code.replace(/\):\s*\w+(\[\])?(\s*[|&]\s*\w+(\[\])?)*\s*(?=[{=>])/g, ') ');

  // Remove 'as Type' assertions
  code = code.replace(/\s+as\s+\w+(\[\])?/g, '');

  // Remove non-null assertions
  code = code.replace(/!/g, '');

  return code;
}

export default CodeArtifact;
