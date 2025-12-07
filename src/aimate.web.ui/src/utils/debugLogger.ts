/**
 * Debug Logger
 *
 * Comprehensive logging system for debugging aiMate issues.
 * Captures structured logs with timestamps, categories, and context.
 * Logs can be exported for sharing with developers.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory =
  | 'chat:send'
  | 'chat:stream'
  | 'chat:receive'
  | 'chat:error'
  | 'connection:state'
  | 'connection:test'
  | 'connection:error'
  | 'model:select'
  | 'model:validate'
  | 'tool:discover'
  | 'tool:execute'
  | 'tool:result'
  | 'conversation:switch'
  | 'conversation:create'
  | 'conversation:load'
  | 'api:request'
  | 'api:response'
  | 'api:error'
  | 'state:change'
  | 'ui:action'
  | 'system:init'
  | 'system:error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  stack?: string;
  duration?: number;
  sessionId: string;
}

export interface LogContext {
  conversationId?: string;
  model?: string;
  connectionUrl?: string;
  connectionMode?: string;
  [key: string]: string | undefined;
}

// Generate unique session ID for this browser session
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// In-memory log storage
const logs: LogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 logs

// Current context (updated by components)
let currentContext: LogContext = {};

// Subscribers for real-time log updates
type LogSubscriber = (entry: LogEntry) => void;
const subscribers: Set<LogSubscriber> = new Set();

/**
 * Update the current context (call when conversation/model/connection changes)
 */
export function setLogContext(context: Partial<LogContext>) {
  currentContext = { ...currentContext, ...context };
  log('debug', 'state:change', 'Log context updated', { context: currentContext });
}

/**
 * Clear the current context
 */
export function clearLogContext() {
  currentContext = {};
}

/**
 * Main logging function
 */
export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data: data ? { ...data, ...currentContext } : { ...currentContext },
    sessionId: SESSION_ID,
  };

  // Add stack trace for errors
  if (level === 'error') {
    entry.stack = new Error().stack?.split('\n').slice(2).join('\n');
  }

  // Store log
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift(); // Remove oldest
  }

  // Console output with formatting
  const style = getLogStyle(level);
  const prefix = `[${entry.timestamp.split('T')[1].split('.')[0]}] [${category}]`;

  if (level === 'error') {
    console.error(`%c${prefix} ${message}`, style, data || '');
    if (entry.stack) {
      console.error(entry.stack);
    }
  } else if (level === 'warn') {
    console.warn(`%c${prefix} ${message}`, style, data || '');
  } else if (level === 'debug') {
    console.debug(`%c${prefix} ${message}`, style, data || '');
  } else {
    console.log(`%c${prefix} ${message}`, style, data || '');
  }

  // Notify subscribers
  subscribers.forEach(fn => fn(entry));

  return entry;
}

function getLogStyle(level: LogLevel): string {
  switch (level) {
    case 'error': return 'color: #ef4444; font-weight: bold;';
    case 'warn': return 'color: #f59e0b;';
    case 'debug': return 'color: #6b7280;';
    default: return 'color: #3b82f6;';
  }
}

/**
 * Convenience methods
 */
export const logger = {
  debug: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    log('debug', category, message, data),

  info: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    log('info', category, message, data),

  warn: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    log('warn', category, message, data),

  error: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    log('error', category, message, data),
};

/**
 * Timer for measuring operation duration
 */
export function startTimer(category: LogCategory, operation: string): () => void {
  const startTime = performance.now();
  log('debug', category, `Starting: ${operation}`);

  return () => {
    const duration = Math.round(performance.now() - startTime);
    log('info', category, `Completed: ${operation}`, { duration: `${duration}ms` });
  };
}

/**
 * Log an API request/response cycle
 */
export async function logApiCall<T>(
  method: string,
  url: string,
  body?: unknown,
  fn?: () => Promise<T>
): Promise<T | undefined> {
  const requestId = `req-${Date.now()}`;
  const startTime = performance.now();

  log('info', 'api:request', `${method} ${url}`, {
    requestId,
    method,
    url,
    bodyPreview: body ? JSON.stringify(body).substring(0, 200) : undefined,
  });

  if (!fn) return undefined;

  try {
    const result = await fn();
    const duration = Math.round(performance.now() - startTime);

    log('info', 'api:response', `${method} ${url} - OK`, {
      requestId,
      duration: `${duration}ms`,
      responsePreview: typeof result === 'object'
        ? JSON.stringify(result).substring(0, 200)
        : String(result).substring(0, 200),
    });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', 'api:error', `${method} ${url} - FAILED`, {
      requestId,
      duration: `${duration}ms`,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Log chat message flow
 */
export const chatLogger = {
  sendStart: (content: string, options: Record<string, unknown>) => {
    log('info', 'chat:send', 'Sending message', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      ...options,
    });
  },

  streamChunk: (chunkSize: number, totalLength: number) => {
    log('debug', 'chat:stream', 'Received chunk', { chunkSize, totalLength });
  },

  streamComplete: (totalLength: number, duration: number) => {
    log('info', 'chat:receive', 'Stream complete', {
      responseLength: totalLength,
      duration: `${duration}ms`,
    });
  },

  error: (error: unknown, context?: Record<string, unknown>) => {
    log('error', 'chat:error', error instanceof Error ? error.message : String(error), {
      ...context,
      errorType: error instanceof Error ? error.name : typeof error,
    });
  },
};

/**
 * Log connection state changes
 */
export const connectionLogger = {
  stateChange: (from: string, to: string, reason?: string) => {
    log('info', 'connection:state', `Connection state: ${from} → ${to}`, { from, to, reason });
  },

  testStart: (url: string) => {
    log('info', 'connection:test', `Testing connection: ${url}`, { url });
  },

  testResult: (url: string, success: boolean, details?: Record<string, unknown>) => {
    log(success ? 'info' : 'warn', 'connection:test',
      `Connection test ${success ? 'passed' : 'failed'}: ${url}`,
      { url, success, ...details }
    );
  },

  error: (url: string, error: unknown) => {
    log('error', 'connection:error', `Connection error: ${url}`, {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
  },
};

/**
 * Log tool/MCP operations
 */
export const toolLogger = {
  discover: (serverId: string, toolCount: number) => {
    log('info', 'tool:discover', `Discovered ${toolCount} tools from ${serverId}`, {
      serverId,
      toolCount,
    });
  },

  execute: (serverId: string, toolName: string, params: Record<string, unknown>) => {
    log('info', 'tool:execute', `Executing tool: ${toolName}`, {
      serverId,
      toolName,
      params,
    });
  },

  result: (serverId: string, toolName: string, success: boolean, result?: unknown) => {
    log(success ? 'info' : 'error', 'tool:result',
      `Tool ${success ? 'succeeded' : 'failed'}: ${toolName}`,
      { serverId, toolName, success, resultPreview: JSON.stringify(result).substring(0, 200) }
    );
  },
};

/**
 * Subscribe to log updates (for debug panel)
 */
export function subscribeToLogs(fn: LogSubscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Get all logs or filtered by category/level
 */
export function getLogs(filter?: {
  level?: LogLevel;
  category?: LogCategory;
  since?: Date;
}): LogEntry[] {
  let filtered = [...logs];

  if (filter?.level) {
    filtered = filtered.filter(l => l.level === filter.level);
  }
  if (filter?.category) {
    filtered = filtered.filter(l => l.category === filter.category);
  }
  if (filter?.since) {
    filtered = filtered.filter(l => new Date(l.timestamp) >= filter.since!);
  }

  return filtered;
}

/**
 * Clear all logs
 */
export function clearLogs() {
  logs.length = 0;
  log('info', 'system:init', 'Logs cleared');
}

/**
 * Export logs as JSON for sharing
 */
export function exportLogs(): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    sessionId: SESSION_ID,
    userAgent: navigator.userAgent,
    url: window.location.href,
    context: currentContext,
    logCount: logs.length,
    logs: logs,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export logs as downloadable file
 */
export function downloadLogs(filename?: string) {
  const data = exportLogs();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `aimate-debug-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log('info', 'system:init', 'Logs exported', { filename: a.download, logCount: logs.length });
}

/**
 * Copy logs to clipboard
 */
export async function copyLogsToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(exportLogs());
    log('info', 'system:init', 'Logs copied to clipboard');
    return true;
  } catch {
    log('error', 'system:error', 'Failed to copy logs to clipboard');
    return false;
  }
}

/**
 * Get a summary of recent issues (errors and warnings)
 */
export function getIssueSummary(): { errors: LogEntry[]; warnings: LogEntry[] } {
  const recentLogs = logs.slice(-100); // Last 100 logs
  return {
    errors: recentLogs.filter(l => l.level === 'error'),
    warnings: recentLogs.filter(l => l.level === 'warn'),
  };
}

/**
 * Format a log entry for display
 */
export function formatLogEntry(entry: LogEntry): string {
  const time = entry.timestamp.split('T')[1].split('.')[0];
  const level = entry.level.toUpperCase().padEnd(5);
  const category = entry.category.padEnd(20);
  let line = `[${time}] ${level} [${category}] ${entry.message}`;

  if (entry.data && Object.keys(entry.data).length > 0) {
    line += `\n    Data: ${JSON.stringify(entry.data)}`;
  }
  if (entry.stack) {
    line += `\n    Stack: ${entry.stack.split('\n')[0]}`;
  }

  return line;
}

// Initialize logging
log('info', 'system:init', 'Debug logger initialized', {
  sessionId: SESSION_ID,
  maxLogs: MAX_LOGS,
  timestamp: new Date().toISOString(),
});

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).__aimateLogs = {
    getLogs,
    exportLogs,
    downloadLogs,
    copyLogsToClipboard,
    getIssueSummary,
    clearLogs,
    SESSION_ID,
  };

  console.log(
    '%c🔧 aiMate Debug Logger Active',
    'color: #8b5cf6; font-weight: bold; font-size: 14px;'
  );
  console.log(
    '%cAccess via window.__aimateLogs or use downloadLogs() in console',
    'color: #6b7280; font-size: 12px;'
  );
}
