import { useDebug } from "./DebugContext";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Trash2, Bug, ChevronDown, ChevronUp, Camera, Filter, X, Download, Copy, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { downloadLogs, copyLogsToClipboard, getIssueSummary, getLogs as getSystemLogs, type LogEntry as SystemLogEntry } from "../utils/debugLogger";
import { toast } from "sonner";

export function DebugPanel() {
  const { debugEnabled, showcaseMode, setShowcaseMode, logs, clearLogs, filterCategory, setFilterCategory, debugSettings } = useDebug();
  const [isExpanded, setIsExpanded] = useState(true);
  const [height, setHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const previousLogsLength = useRef(logs.length);

  // Auto-expand when new logs arrive and panel is minimized
  useEffect(() => {
    if (logs.length > previousLogsLength.current && !isExpanded) {
      setIsExpanded(true);
    }
    previousLogsLength.current = logs.length;
  }, [logs.length, isExpanded]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(100, Math.min(600, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Get unique categories from logs
  const categories = useMemo(() => {
    const cats = new Set<string>();
    logs.forEach(log => cats.add(log.category));
    return ['all', ...Array.from(cats).sort()];
  }, [logs]);

  // Filter logs by category
  const filteredLogs = useMemo(() => {
    if (filterCategory === 'all') return logs;
    return logs.filter(log => log.category === filterCategory);
  }, [logs, filterCategory]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedLogIds(new Set(filteredLogs.map(log => log.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  if (!debugEnabled) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    } as any);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-500 dark:text-green-400";
      case "error":
        return "text-red-500 dark:text-red-400";
      case "warning":
        return "text-yellow-500 dark:text-yellow-400";
      default:
        return "text-blue-500 dark:text-blue-400";
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
      case "error":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900";
      default:
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      {/* Resize Handle */}
      <div
        className="h-1 bg-gray-200 dark:bg-gray-800 hover:bg-purple-500 dark:hover:bg-purple-500 transition-colors cursor-ns-resize"
        onMouseDown={() => setIsResizing(true)}
      />
      
      <div 
        className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-sm">Debug Console</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({filteredLogs.length}{filterCategory !== 'all' ? ` of ${logs.length}` : ''} {filteredLogs.length === 1 ? "entry" : "entries"})
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isExpanded && (
            <>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="h-8 px-2 text-xs"
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-8 px-2 text-xs"
              >
                Collapse All
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadLogs();
              toast.success('Debug logs downloaded');
            }}
            className="h-8 px-2"
            title="Download logs as JSON file"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation();
              const success = await copyLogsToClipboard();
              if (success) {
                toast.success('Logs copied to clipboard');
              } else {
                toast.error('Failed to copy logs');
              }
            }}
            className="h-8 px-2"
            title="Copy logs to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowcaseMode(!showcaseMode);
            }}
            className={`h-8 px-2 ${showcaseMode ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}`}
          >
            <Camera className="h-3 w-3 mr-1" />
            Showcase
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            className="h-8 px-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <ScrollArea style={{ height: `${height}px` }}>
          <div className="px-4 py-2 space-y-2 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                {filterCategory !== 'all' ? 'No logs in this category' : 'No debug logs yet'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogIds.has(log.id);
                const hasDetails = (debugSettings.showPayloads && log.payload) || 
                                  (debugSettings.showResponses && log.response) || 
                                  log.api;
                
                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg ${getTypeBg(log.type)}`}
                  >
                    {/* Header - always visible */}
                    <div 
                      className="p-2 flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => hasDetails && toggleLogExpansion(log.id)}
                    >
                      {hasDetails && (
                        <div className="shrink-0 mt-0.5">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-500" />
                          ) : (
                            <ChevronUp className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                      )}
                      {debugSettings.showTimestamps && (
                        <span className="text-gray-500 dark:text-gray-400 shrink-0 mt-0.5">
                          [{formatTime(log.timestamp)}]
                        </span>
                      )}
                      <span className={`${getTypeColor(log.type)} shrink-0 uppercase font-semibold mt-0.5`}>
                        {log.type}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 shrink-0 text-[10px] mt-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30">
                        {log.category}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 flex-1 mt-0.5">
                        {log.action}
                      </span>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && hasDetails && (
                      <div className="px-2 pb-2 space-y-2 border-t border-current/10 mt-2 pt-2">
                        {log.api && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-purple-700 dark:text-purple-300">
                              API Endpoint
                            </div>
                            <div className="text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                              {log.api}
                            </div>
                          </div>
                        )}
                        {debugSettings.showPayloads && log.payload && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-gray-700 dark:text-gray-300">
                              Request Payload
                            </div>
                            <pre className="text-[10px] overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {debugSettings.showResponses && log.response && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-gray-700 dark:text-gray-300">
                              Response
                            </div>
                            <pre className="text-[10px] overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}