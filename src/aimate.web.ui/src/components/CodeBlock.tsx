/**
 * Enhanced Code Block Component
 *
 * Features:
 * - Floating copy button (always visible in corner)
 * - Language detection and display
 * - Syntax highlighting ready
 * - Mermaid diagram rendering for ```mermaid blocks
 * - Save to knowledge functionality
 */

import { useState, useCallback } from 'react';
import { Copy, Check, FileCode, Brain, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { MermaidDiagram } from './MermaidDiagram';
import { toast } from 'sonner';
import { useAppData } from '../context/AppDataContext';

interface CodeBlockProps {
  language?: string;
  children: string;
  className?: string;
  onSaveToKnowledge?: (code: string, language: string) => Promise<void>;
}

/**
 * Simple syntax highlighting using regex patterns
 * Covers common tokens: keywords, strings, comments, numbers, functions
 */
function highlightCode(code: string, language: string): string {
  // Escape HTML first
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Language-specific keywords
  const keywordSets: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'new', 'this', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'new', 'this', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'as', 'implements', 'private', 'public', 'protected', 'readonly'],
    python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'self', 'async', 'await'],
    rust: ['fn', 'let', 'mut', 'const', 'if', 'else', 'match', 'for', 'while', 'loop', 'return', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'self', 'Self', 'true', 'false', 'where', 'async', 'await', 'move'],
    go: ['func', 'var', 'const', 'if', 'else', 'for', 'range', 'return', 'struct', 'interface', 'type', 'package', 'import', 'defer', 'go', 'chan', 'select', 'case', 'default', 'nil', 'true', 'false', 'map', 'make', 'new'],
    java: ['class', 'public', 'private', 'protected', 'static', 'final', 'void', 'int', 'String', 'boolean', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'super', 'extends', 'implements', 'interface', 'try', 'catch', 'throw', 'throws', 'null', 'true', 'false', 'import', 'package'],
    sql: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'NULL', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'],
  };

  // Map aliases
  const langMap: Record<string, string> = {
    js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    py: 'python', rb: 'ruby', rs: 'rust',
  };
  const normalizedLang = langMap[language] || language;
  const keywords = keywordSets[normalizedLang] || keywordSets.javascript || [];

  // Apply highlighting patterns in order

  // 1. Comments (single line)
  highlighted = highlighted.replace(
    /(\/\/.*$|#(?!include|define|ifdef|ifndef|endif|pragma).*$)/gm,
    '<span class="token-comment">$1</span>'
  );

  // 2. Multi-line comments
  highlighted = highlighted.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="token-comment">$1</span>'
  );

  // 3. Strings (double and single quotes, backticks)
  highlighted = highlighted.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    '<span class="token-string">$1</span>'
  );

  // 4. Numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="token-number">$1</span>'
  );

  // 5. Keywords (word boundaries)
  if (keywords.length > 0) {
    const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(
      keywordPattern,
      '<span class="token-keyword">$1</span>'
    );
  }

  // 6. Function calls
  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    '<span class="token-function">$1</span>('
  );

  // 7. Class names (capitalized words)
  highlighted = highlighted.replace(
    /\b([A-Z][a-zA-Z0-9_]*)\b(?!<\/span>)/g,
    '<span class="token-class">$1</span>'
  );

  return highlighted;
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
  const [saving, setSaving] = useState(false);
  const { knowledge } = useAppData();

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

  const handleSaveToKnowledge = useCallback(async () => {
    if (saving) return;

    try {
      setSaving(true);
      // Get file extension from language
      const ext = lang || 'txt';
      const title = `Code Snippet - ${displayLanguage} - ${new Date().toLocaleString()}`;

      // Wrap code with language marker for markdown
      const content = `\`\`\`${lang}\n${code}\n\`\`\``;

      await knowledge.saveTextAsKnowledge(content, title, ['code-snippet', lang || 'code']);
      toast.success('Code saved to knowledge!');
    } catch (err) {
      console.error('Failed to save code to knowledge:', err);
      toast.error('Failed to save code');
    } finally {
      setSaving(false);
    }
  }, [code, lang, displayLanguage, knowledge, saving]);

  return (
    <div className={`relative group rounded-lg overflow-hidden bg-gray-900 ${className}`}>
      {/* Header bar with language and action buttons */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileCode className="h-3.5 w-3.5" />
          <span>{displayLanguage}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 gap-1.5"
            onClick={handleSaveToKnowledge}
            disabled={saving}
            title="Save to Knowledge"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </Button>
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
      </div>

      {/* Code content with syntax highlighting */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed syntax-highlight">
        <code
          className="text-gray-100 font-mono block whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }}
        />
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
