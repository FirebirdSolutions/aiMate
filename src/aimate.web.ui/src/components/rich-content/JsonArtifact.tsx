/**
 * JSON Artifact Component
 *
 * Renders JSON data as an interactive collapsible tree viewer.
 */

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  Braces,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { toast } from "sonner";
import type { JsonArtifactData, ArtifactProps } from "./types";

interface JsonNodeProps {
  keyName?: string;
  value: any;
  depth: number;
  maxDepth: number;
  defaultExpanded?: boolean;
}

function JsonNode({ keyName, value, depth, maxDepth, defaultExpanded = true }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded && depth < 2);

  const valueType = Array.isArray(value) ? 'array' : typeof value;
  const isExpandable = valueType === 'object' || valueType === 'array';
  const hasContent = isExpandable && value !== null && Object.keys(value).length > 0;

  // Determine if we should truncate deep nested content
  const shouldTruncate = depth >= maxDepth && hasContent;

  const renderValue = () => {
    if (value === null) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (value === undefined) {
      return <span className="text-gray-400 italic">undefined</span>;
    }

    switch (valueType) {
      case 'string':
        return (
          <span className="text-green-600 dark:text-green-400">
            "{value.length > 100 ? value.slice(0, 100) + '...' : value}"
          </span>
        );
      case 'number':
        return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
      case 'boolean':
        return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
      case 'array':
        if (!hasContent) return <span className="text-gray-500">[]</span>;
        if (shouldTruncate) {
          return <span className="text-gray-400">[...{value.length} items]</span>;
        }
        return null;
      case 'object':
        if (!hasContent) return <span className="text-gray-500">{'{}'}</span>;
        if (shouldTruncate) {
          return <span className="text-gray-400">{'{...}'}</span>;
        }
        return null;
      default:
        return <span className="text-gray-500">{String(value)}</span>;
    }
  };

  const getTypeLabel = () => {
    if (valueType === 'array') return `[${value.length}]`;
    if (valueType === 'object' && hasContent) return `{${Object.keys(value).length}}`;
    return null;
  };

  if (!isExpandable || !hasContent || shouldTruncate) {
    return (
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        <span className="w-4" />
        {keyName !== undefined && (
          <>
            <span className="text-red-600 dark:text-red-400 font-medium">"{keyName}"</span>
            <span className="text-gray-500">:</span>
          </>
        )}
        {renderValue()}
        {getTypeLabel() && (
          <span className="text-xs text-gray-400 ml-1">{getTypeLabel()}</span>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        <CollapsibleTrigger className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-500" />
          )}
        </CollapsibleTrigger>
        {keyName !== undefined && (
          <>
            <span className="text-red-600 dark:text-red-400 font-medium">"{keyName}"</span>
            <span className="text-gray-500">:</span>
          </>
        )}
        <span className="text-gray-500">{valueType === 'array' ? '[' : '{'}</span>
        {!expanded && (
          <span className="text-xs text-gray-400">{getTypeLabel()}</span>
        )}
      </div>
      <CollapsibleContent>
        {Object.entries(value).map(([k, v], idx) => (
          <JsonNode
            key={`${k}-${idx}`}
            keyName={valueType === 'array' ? undefined : k}
            value={v}
            depth={depth + 1}
            maxDepth={maxDepth}
            defaultExpanded={depth < 1}
          />
        ))}
        <div style={{ paddingLeft: `${depth * 16}px` }} className="text-gray-500 py-0.5">
          <span className="w-4 inline-block" />
          {valueType === 'array' ? ']' : '}'}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function JsonArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<JsonArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data.data, null, 2);
    } catch {
      return 'Invalid JSON';
    }
  }, [data.data]);

  const summary = useMemo(() => {
    if (Array.isArray(data.data)) {
      return `Array with ${data.data.length} items`;
    }
    if (typeof data.data === 'object' && data.data !== null) {
      const keys = Object.keys(data.data);
      return `Object with ${keys.length} ${keys.length === 1 ? 'key' : 'keys'}`;
    }
    return typeof data.data;
  }, [data.data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.title ? `${data.title}.json` : 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded JSON");
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium">
            {data.title || 'JSON Data'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {summary}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Content */}
      {isExpanded && (
        <div className={`p-2 overflow-auto font-mono text-xs ${fullscreen ? 'h-[calc(100%-48px)]' : 'max-h-80'}`}>
          <JsonNode
            value={data.data}
            depth={0}
            maxDepth={data.maxDepth ?? 5}
            defaultExpanded={!data.collapsed}
          />
        </div>
      )}
    </div>
  );
}

export default JsonArtifact;
