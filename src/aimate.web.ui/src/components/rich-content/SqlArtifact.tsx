/**
 * SQL Artifact Component
 *
 * In-browser SQLite playground using sql.js (SQLite compiled to WebAssembly).
 * Run SQL queries directly in the browser - no server required!
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Brain,
  Database,
  Maximize2,
  Minimize2,
  Play,
  Loader2,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Table2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { SqlArtifactData, ArtifactProps } from "./types";

// Types for sql.js
interface SqlJsDatabase {
  run: (sql: string) => void;
  exec: (sql: string) => { columns: string[]; values: any[][] }[];
  export: () => Uint8Array;
  close: () => void;
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowsAffected?: number;
  duration: number;
  error?: string;
}

export function SqlArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<SqlArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // SQL state
  const [sql, setSql] = useState(data.query);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  // Database reference
  const dbRef = useRef<SqlJsDatabase | null>(null);
  const sqlJsRef = useRef<SqlJsStatic | null>(null);

  // Initialize sql.js and database
  const initDatabase = useCallback(async () => {
    if (dbRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import sql.js
      const initSqlJs = (await import('sql.js')).default;

      // Initialize sql.js with WASM
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          `https://sql.js.org/dist/${file}`,
      });

      sqlJsRef.current = SQL;

      // Create new database
      const db = new SQL.Database();
      dbRef.current = db;

      // Run schema if provided
      if (data.schema) {
        try {
          db.run(data.schema);
          toast.success("Database schema initialized");
        } catch (err) {
          console.error('Schema error:', err);
          setError(`Schema error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Run seed data if provided
      if (data.seedData) {
        try {
          db.run(data.seedData);
        } catch (err) {
          console.error('Seed data error:', err);
        }
      }

      // Get list of tables
      refreshTables();
    } catch (err) {
      console.error('[SqlArtifact] Failed to initialize sql.js:', err);
      setError('Failed to load SQLite engine. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [data.schema, data.seedData]);

  // Refresh table list
  const refreshTables = useCallback(() => {
    if (!dbRef.current) return;

    try {
      const result = dbRef.current.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      if (result.length > 0) {
        setTables(result[0].values.map(row => row[0] as string));
      } else {
        setTables([]);
      }
    } catch {
      setTables([]);
    }
  }, []);

  // Initialize on expand
  useEffect(() => {
    if (isExpanded && !dbRef.current) {
      initDatabase();
    }
  }, [isExpanded, initDatabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, []);

  // Execute SQL query
  const executeQuery = useCallback(async () => {
    if (!dbRef.current || !sql.trim()) return;

    setIsRunning(true);
    setError(null);
    const newResults: QueryResult[] = [];

    const startTime = performance.now();

    try {
      // Split multiple statements
      const statements = sql.split(';').filter(s => s.trim());

      for (const stmt of statements) {
        const stmtStart = performance.now();
        const trimmedStmt = stmt.trim();

        if (!trimmedStmt) continue;

        try {
          // Check if it's a SELECT statement
          const isSelect = trimmedStmt.toUpperCase().startsWith('SELECT');

          if (isSelect) {
            const result = dbRef.current.exec(trimmedStmt);
            if (result.length > 0) {
              newResults.push({
                columns: result[0].columns,
                rows: result[0].values,
                duration: performance.now() - stmtStart,
              });
            } else {
              newResults.push({
                columns: [],
                rows: [],
                duration: performance.now() - stmtStart,
              });
            }
          } else {
            // Non-SELECT statement
            dbRef.current.run(trimmedStmt);
            newResults.push({
              columns: ['Result'],
              rows: [['Query executed successfully']],
              duration: performance.now() - stmtStart,
            });
          }
        } catch (err) {
          newResults.push({
            columns: [],
            rows: [],
            duration: performance.now() - stmtStart,
            error: err instanceof Error ? err.message : 'Query failed',
          });
        }
      }

      // Refresh table list after modifications
      refreshTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setResults(newResults);
      setIsRunning(false);
    }
  }, [sql, refreshTables]);

  // Reset database
  const resetDatabase = useCallback(async () => {
    if (dbRef.current) {
      dbRef.current.close();
      dbRef.current = null;
    }
    setResults([]);
    setTables([]);
    await initDatabase();
    toast.success("Database reset");
  }, [initDatabase]);

  // Export database
  const exportDatabase = useCallback(() => {
    if (!dbRef.current) return;

    try {
      const data = dbRef.current.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.sqlite';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Database exported");
    } catch (err) {
      toast.error("Failed to export database");
    }
  }, []);

  // Import database
  const importDatabase = useCallback(async (file: File) => {
    if (!sqlJsRef.current) return;

    try {
      const data = await file.arrayBuffer();
      if (dbRef.current) {
        dbRef.current.close();
      }
      dbRef.current = new sqlJsRef.current.Database(new Uint8Array(data));
      refreshTables();
      setResults([]);
      toast.success("Database imported");
    } catch (err) {
      toast.error("Failed to import database");
    }
  }, [refreshTables]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied SQL to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-3xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm font-medium">
            {data.title || 'SQL Playground'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            SQLite
          </Badge>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 text-green-600 dark:text-green-400"
            onClick={executeQuery}
            disabled={isRunning || isLoading || !dbRef.current}
            title="Run Query (Ctrl+Enter)"
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            <span className="text-xs">Run</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={resetDatabase}
            title="Reset Database"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={exportDatabase}
            disabled={!dbRef.current}
            title="Export Database"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".sqlite,.db,.sqlite3"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importDatabase(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              asChild
              title="Import Database"
            >
              <span>
                <Upload className="h-3.5 w-3.5" />
              </span>
            </Button>
          </label>
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
            title="Copy SQL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
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
        <div className={`bg-white dark:bg-gray-950 ${fullscreen ? 'flex-1 overflow-hidden flex flex-col' : ''}`}>
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading SQLite engine...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Main content */}
          {!isLoading && (
            <div className={`flex ${fullscreen ? 'flex-1 overflow-hidden' : ''}`}>
              {/* Tables sidebar */}
              <div className={`w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${fullscreen ? 'overflow-auto' : 'max-h-[400px] overflow-auto'}`}>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Table2 className="h-3 w-3" />
                  Tables
                </div>
                {tables.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    No tables
                  </div>
                ) : (
                  <div className="py-1">
                    {tables.map((table) => (
                      <button
                        key={table}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        onClick={() => setSql(`SELECT * FROM ${table} LIMIT 100;`)}
                      >
                        {table}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Query area */}
              <div className={`flex-1 flex flex-col ${fullscreen ? 'overflow-hidden' : ''}`}>
                {/* SQL input */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <Textarea
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        executeQuery();
                      }
                    }}
                    className="font-mono text-sm min-h-[100px]"
                    placeholder="Enter SQL query... (Ctrl+Enter to run)"
                  />
                </div>

                {/* Results */}
                <div className={`${fullscreen ? 'flex-1 overflow-auto' : 'max-h-[300px] overflow-auto'}`}>
                  {results.map((result, idx) => (
                    <div key={idx} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {result.error ? (
                            <span className="text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Error
                            </span>
                          ) : (
                            `${result.rows.length} row${result.rows.length !== 1 ? 's' : ''}`
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {result.duration.toFixed(1)}ms
                        </span>
                      </div>

                      {result.error ? (
                        <div className="p-3 text-sm text-red-500">
                          {result.error}
                        </div>
                      ) : result.columns.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-800">
                                {result.columns.map((col, colIdx) => (
                                  <th
                                    key={colIdx}
                                    className="px-3 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.rows.map((row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  {row.map((cell, cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      className="px-3 py-1.5 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                    >
                                      {cell === null ? (
                                        <span className="text-gray-400 italic">NULL</span>
                                      ) : (
                                        String(cell)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-gray-400">
                          No results
                        </div>
                      )}
                    </div>
                  ))}

                  {results.length === 0 && !error && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      Run a query to see results
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

export default SqlArtifact;
