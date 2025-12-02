/**
 * File Artifact Component
 *
 * Renders a downloadable file card in chat. Used for both:
 * 1. Inline file artifacts from AI (```file:filename.ext blocks)
 * 2. File results from MCP tool calls
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  FileText,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  File,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { toast } from "sonner";

export interface FileArtifactData {
  filename: string;
  content: string;
  mimeType?: string;
  size?: number;
  // For binary files (base64 encoded)
  encoding?: 'utf-8' | 'base64';
  // Optional download URL (for server-generated files)
  downloadUrl?: string;
}

interface FileArtifactProps {
  file: FileArtifactData;
  showPreview?: boolean;
}

// Get icon based on file extension/mime type
function getFileIcon(filename: string, mimeType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Check by extension first
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt'].includes(ext)) {
    return FileCode;
  }
  if (['json', 'yaml', 'yml', 'xml', 'toml'].includes(ext)) {
    return FileJson;
  }
  if (['csv', 'tsv', 'xls', 'xlsx'].includes(ext)) {
    return FileSpreadsheet;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext)) {
    return FileArchive;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) {
    return FileImage;
  }
  if (['md', 'txt', 'log', 'rtf', 'doc', 'docx', 'pdf'].includes(ext)) {
    return FileText;
  }

  // Check by mime type
  if (mimeType?.startsWith('image/')) return FileImage;
  if (mimeType?.startsWith('text/')) return FileText;
  if (mimeType?.includes('json')) return FileJson;
  if (mimeType?.includes('zip') || mimeType?.includes('archive')) return FileArchive;

  return File;
}

// Get syntax highlighting language for preview
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'md': 'markdown',
  };
  return langMap[ext] || 'plaintext';
}

// Format file size
function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Determine mime type from filename
function inferMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'jsx': 'application/javascript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'html': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',
    'zip': 'application/zip',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export function FileArtifact({ file, showPreview = true }: FileArtifactProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const FileIcon = getFileIcon(file.filename, file.mimeType);
  const isTextFile = !file.encoding || file.encoding === 'utf-8';
  const canPreview = isTextFile && file.content.length < 50000; // 50KB preview limit
  const mimeType = file.mimeType || inferMimeType(file.filename);
  const fileSize = file.size || new Blob([file.content]).size;

  const handleDownload = () => {
    // If we have a download URL, use it directly
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
      return;
    }

    // Create blob from content
    let blob: Blob;
    if (file.encoding === 'base64') {
      // Decode base64
      const binaryStr = atob(file.content);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
    } else {
      blob = new Blob([file.content], { type: mimeType });
    }

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${file.filename}`);
  };

  const handleCopy = async () => {
    if (!isTextFile) {
      toast.error("Cannot copy binary file to clipboard");
      return;
    }

    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 my-2 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={file.filename}>
            {file.filename}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {fileSize > 0 && <span>{formatSize(fileSize)}</span>}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 flex-1"
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>

        {isTextFile && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}

        {canPreview && showPreview && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {canPreview && showPreview && (
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleContent>
            <div className="mt-3 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 uppercase font-medium">
                  {getLanguage(file.filename)}
                </span>
                <span className="text-[10px] text-gray-400">
                  {file.content.split('\n').length} lines
                </span>
              </div>
              <pre className="p-2 text-xs overflow-x-auto max-h-64 bg-white dark:bg-gray-900">
                <code>{file.content.slice(0, 5000)}{file.content.length > 5000 ? '\n\n... (truncated)' : ''}</code>
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

/**
 * Parse file artifacts from markdown content
 *
 * Format: ```file:filename.ext
 * file content here
 * ```
 */
export function parseFileArtifacts(content: string): {
  files: FileArtifactData[];
  cleanedContent: string;
} {
  const files: FileArtifactData[] = [];

  // Match ```file:filename.ext ... ``` blocks
  const fileBlockPattern = /```file:([^\n]+)\n([\s\S]*?)```/g;

  let cleanedContent = content;
  let match;

  while ((match = fileBlockPattern.exec(content)) !== null) {
    const [fullMatch, filename, fileContent] = match;

    files.push({
      filename: filename.trim(),
      content: fileContent.trimEnd(),
      mimeType: inferMimeType(filename.trim()),
      encoding: 'utf-8',
    });

    // Remove the file block from content (will be replaced with component)
    cleanedContent = cleanedContent.replace(fullMatch, `<!-- FILE_ARTIFACT:${filename.trim()} -->`);
  }

  return { files, cleanedContent };
}

/**
 * Check if a tool result contains file data
 */
export function isFileResult(result: any): result is { file: FileArtifactData } | { files: FileArtifactData[] } {
  if (!result || typeof result !== 'object') return false;

  // Single file
  if (result.file && typeof result.file.filename === 'string' && typeof result.file.content === 'string') {
    return true;
  }

  // Multiple files
  if (Array.isArray(result.files) && result.files.length > 0) {
    return result.files.every((f: any) =>
      typeof f.filename === 'string' && typeof f.content === 'string'
    );
  }

  // Direct file object (from create_file tool)
  if (typeof result.filename === 'string' && typeof result.content === 'string') {
    return true;
  }

  return false;
}

/**
 * Extract file data from tool result
 */
export function extractFilesFromResult(result: any): FileArtifactData[] {
  if (!result) return [];

  // Direct file object
  if (typeof result.filename === 'string' && typeof result.content === 'string') {
    return [{
      filename: result.filename,
      content: result.content,
      mimeType: result.mimeType || inferMimeType(result.filename),
      encoding: result.encoding || 'utf-8',
      size: result.size,
      downloadUrl: result.downloadUrl,
    }];
  }

  // Wrapped in { file: ... }
  if (result.file) {
    return [{
      filename: result.file.filename,
      content: result.file.content,
      mimeType: result.file.mimeType || inferMimeType(result.file.filename),
      encoding: result.file.encoding || 'utf-8',
      size: result.file.size,
      downloadUrl: result.file.downloadUrl,
    }];
  }

  // Wrapped in { files: [...] }
  if (Array.isArray(result.files)) {
    return result.files.map((f: any) => ({
      filename: f.filename,
      content: f.content,
      mimeType: f.mimeType || inferMimeType(f.filename),
      encoding: f.encoding || 'utf-8',
      size: f.size,
      downloadUrl: f.downloadUrl,
    }));
  }

  return [];
}

export default FileArtifact;
