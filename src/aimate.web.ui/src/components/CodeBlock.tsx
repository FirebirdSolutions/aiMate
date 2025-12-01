/**
 * Enhanced Code Block Component
 *
 * Features:
 * - Floating copy button (always visible in corner)
 * - Language detection and display
 * - Syntax highlighting ready
 * - Mermaid diagram rendering for ```mermaid blocks
 */

import { useState, useCallback } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { MermaidDiagram } from './MermaidDiagram';
import { toast } from 'sonner';

interface CodeBlockProps {
  language?: string;
  children: string;
  className?: string;
}

// Map common language aliases to display names
const LANGUAGE_DISPLAY: Record<string, string> = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'tsx': 'TypeScript React',
  'jsx': 'JavaScript React',
  'py': 'Python',
  'python': 'Python',
  'rb': 'Ruby',
  'ruby': 'Ruby',
  'go': 'Go',
  'rs': 'Rust',
  'rust': 'Rust',
  'java': 'Java',
  'cpp': 'C++',
  'c': 'C',
  'cs': 'C#',
  'csharp': 'C#',
  'php': 'PHP',
  'swift': 'Swift',
  'kt': 'Kotlin',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'sh': 'Shell',
  'bash': 'Bash',
  'zsh': 'Zsh',
  'powershell': 'PowerShell',
  'ps1': 'PowerShell',
  'sql': 'SQL',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'Sass',
  'less': 'Less',
  'json': 'JSON',
  'yaml': 'YAML',
  'yml': 'YAML',
  'xml': 'XML',
  'md': 'Markdown',
  'markdown': 'Markdown',
  'dockerfile': 'Dockerfile',
  'docker': 'Dockerfile',
  'graphql': 'GraphQL',
  'gql': 'GraphQL',
  'mermaid': 'Mermaid',
  'plaintext': 'Plain Text',
  'text': 'Plain Text',
};

export function CodeBlock({ language, children, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const code = typeof children === 'string' ? children.trim() : String(children).trim();
  const lang = language?.toLowerCase() || '';
  const displayLanguage = LANGUAGE_DISPLAY[lang] || lang.toUpperCase() || 'Code';

  // Handle mermaid diagrams specially
  if (lang === 'mermaid') {
    return <MermaidDiagram chart={code} className={className} />;
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className={`relative group rounded-lg overflow-hidden bg-gray-900 ${className}`}>
      {/* Header bar with language and copy button */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileCode className="h-3.5 w-3.5" />
          <span>{displayLanguage}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-100 font-mono">{code}</code>
      </pre>

      {/* Floating copy button (shows on hover for quick access) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-12 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700/80 hover:bg-gray-600 text-gray-300"
        onClick={handleCopy}
        title="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

/**
 * Inline code component for click-to-copy functionality
 */
interface InlineCodeProps {
  children: string;
  className?: string;
}

export function InlineCode({ children, className = '' }: InlineCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const code = typeof children === 'string' ? children : String(children);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore errors for inline copy
    }
  }, [children]);

  return (
    <code
      className={`px-1.5 py-0.5 rounded text-sm bg-gray-200 dark:bg-gray-700 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${copied ? 'ring-2 ring-green-400' : ''} ${className}`}
      onClick={handleClick}
      title="Click to copy"
    >
      {children}
    </code>
  );
}

export default CodeBlock;
