/**
 * Artifact Renderer
 *
 * Parses markdown content for artifact blocks and renders the appropriate component.
 *
 * Supported syntax:
 * ```artifact:json
 * {"key": "value"}
 * ```
 *
 * ```artifact:table
 * {"headers": ["Name", "Age"], "rows": [["John", 30]]}
 * ```
 *
 * ```file:filename.ext
 * file content here
 * ```
 */

import { useCallback } from "react";
import { JsonArtifact } from "./JsonArtifact";
import { TableArtifact } from "./TableArtifact";
import { CodeArtifact } from "./CodeArtifact";
import { FileArtifact, FileArtifactData } from "../FileArtifact";
import type { ArtifactData, JsonArtifactData, TableArtifactData, CodeArtifactData, ParsedArtifact } from "./types";

// Pattern for artifact blocks: ```artifact:type or ```file:filename
const ARTIFACT_PATTERN = /```(artifact:(\w+)|file:([^\n]+))\n([\s\S]*?)```/g;

interface ParseResult {
  artifacts: ParsedArtifact[];
  cleanedContent: string;
  placeholders: Map<string, ParsedArtifact>;
}

/**
 * Parse markdown content for artifact blocks
 */
export function parseArtifacts(content: string): ParseResult {
  const artifacts: ParsedArtifact[] = [];
  const placeholders = new Map<string, ParsedArtifact>();
  let cleanedContent = content;
  let match;
  let idx = 0;

  // Reset regex state
  ARTIFACT_PATTERN.lastIndex = 0;

  while ((match = ARTIFACT_PATTERN.exec(content)) !== null) {
    const [fullMatch, , artifactType, filename, rawContent] = match;
    const placeholderId = `__ARTIFACT_${idx}__`;

    let artifact: ParsedArtifact | null = null;

    if (filename) {
      // File artifact: ```file:filename.ext
      artifact = {
        type: 'file',
        data: {
          type: 'file',
          filename: filename.trim(),
          content: rawContent.trimEnd(),
          mimeType: inferMimeType(filename.trim()),
          encoding: 'utf-8',
        } as FileArtifactData,
        raw: fullMatch,
      };
    } else if (artifactType) {
      // Other artifact types: ```artifact:json, ```artifact:table, etc.
      try {
        const parsed = JSON.parse(rawContent.trim());

        switch (artifactType) {
          case 'json':
            artifact = {
              type: 'json',
              data: {
                type: 'json',
                data: parsed.data ?? parsed,
                title: parsed.title,
                collapsed: parsed.collapsed,
                maxDepth: parsed.maxDepth,
              } as JsonArtifactData,
              raw: fullMatch,
            };
            break;

          case 'table':
            artifact = {
              type: 'table',
              data: {
                type: 'table',
                headers: parsed.headers || [],
                rows: parsed.rows || [],
                title: parsed.title,
                sortable: parsed.sortable ?? true,
                searchable: parsed.searchable ?? true,
              } as TableArtifactData,
              raw: fullMatch,
            };
            break;

          case 'code':
            artifact = {
              type: 'code',
              data: {
                type: 'code',
                language: parsed.language || 'javascript',
                code: parsed.code || '',
                title: parsed.title,
                filename: parsed.filename,
                executable: parsed.executable ?? true,
              } as CodeArtifactData,
              raw: fullMatch,
            };
            break;

          default:
            // Unknown artifact type - treat as JSON
            artifact = {
              type: artifactType,
              data: {
                type: 'json',
                data: parsed,
                title: `${artifactType} data`,
              } as JsonArtifactData,
              raw: fullMatch,
            };
        }
      } catch {
        // Failed to parse JSON - skip this artifact
        console.warn(`[ArtifactRenderer] Failed to parse artifact:${artifactType}`);
      }
    }

    if (artifact) {
      artifacts.push(artifact);
      placeholders.set(placeholderId, artifact);
      cleanedContent = cleanedContent.replace(fullMatch, `<!-- ${placeholderId} -->`);
      idx++;
    }
  }

  return { artifacts, cleanedContent, placeholders };
}

/**
 * Infer MIME type from filename
 */
function inferMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'py': 'text/x-python',
    'html': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

interface ArtifactRendererProps {
  artifacts: ParsedArtifact[];
  onSaveToKnowledge?: (artifact: ArtifactData) => void;
}

/**
 * Renders a list of parsed artifacts
 */
export function ArtifactRenderer({ artifacts, onSaveToKnowledge }: ArtifactRendererProps) {
  const handleSaveToKnowledge = useCallback((data: ArtifactData) => {
    onSaveToKnowledge?.(data);
  }, [onSaveToKnowledge]);

  if (artifacts.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      {artifacts.map((artifact, idx) => {
        switch (artifact.type) {
          case 'file':
            return (
              <FileArtifact
                key={`file-${idx}`}
                file={artifact.data as FileArtifactData}
                showPreview={true}
              />
            );

          case 'json':
            return (
              <JsonArtifact
                key={`json-${idx}`}
                data={artifact.data as JsonArtifactData}
                onSaveToKnowledge={handleSaveToKnowledge}
                collapsed={true}
              />
            );

          case 'table':
            return (
              <TableArtifact
                key={`table-${idx}`}
                data={artifact.data as TableArtifactData}
                onSaveToKnowledge={handleSaveToKnowledge}
                collapsed={true}
              />
            );

          case 'code':
            return (
              <CodeArtifact
                key={`code-${idx}`}
                data={artifact.data as CodeArtifactData}
                onSaveToKnowledge={handleSaveToKnowledge}
                collapsed={true}
              />
            );

          default:
            // Default to JSON viewer for unknown types
            return (
              <JsonArtifact
                key={`unknown-${idx}`}
                data={{
                  type: 'json',
                  data: artifact.data,
                  title: `${artifact.type} artifact`,
                }}
                onSaveToKnowledge={handleSaveToKnowledge}
                collapsed={true}
              />
            );
        }
      })}
    </div>
  );
}

// Re-export types and components
export { JsonArtifact } from "./JsonArtifact";
export { TableArtifact } from "./TableArtifact";
export { CodeArtifact } from "./CodeArtifact";
export * from "./types";

export default ArtifactRenderer;
