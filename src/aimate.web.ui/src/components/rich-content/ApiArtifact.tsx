/**
 * API Artifact Component
 *
 * Interactive API tester - like a mini Postman in chat.
 * Test REST endpoints with custom headers, body, and see responses.
 */

import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Brain,
  Globe,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ApiArtifactData, ArtifactProps } from "./types";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
  error?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-blue-500',
  PUT: 'text-orange-500',
  PATCH: 'text-yellow-500',
  DELETE: 'text-red-500',
};

export function ApiArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<ApiArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Editable state
  const [method, setMethod] = useState(data.method || 'GET');
  const [url, setUrl] = useState(data.url);
  const [headers, setHeaders] = useState<Header[]>(
    data.headers
      ? Object.entries(data.headers).map(([key, value]) => ({ key, value, enabled: true }))
      : [{ key: 'Content-Type', value: 'application/json', enabled: true }]
  );
  const [body, setBody] = useState(data.body || '');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'response'>('response');

  // Response state
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Send request
  const sendRequest = useCallback(async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setActiveTab('response');

    const startTime = performance.now();

    try {
      // Build headers object
      const headerObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) {
          headerObj[h.key] = h.value;
        }
      });

      // Build fetch options
      const options: RequestInit = {
        method,
        headers: headerObj,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const duration = performance.now() - startTime;

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let responseBody: any;
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          responseBody = await res.json();
        } catch {
          responseBody = await res.text();
        }
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
      });
    } catch (err) {
      const duration = performance.now() - startTime;
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: null,
        duration,
        error: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headers, body]);

  // Add header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  // Remove header
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Update header
  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  // Copy as cURL
  const handleCopy = async () => {
    const headerFlags = headers
      .filter(h => h.enabled && h.key)
      .map(h => `-H '${h.key}: ${h.value}'`)
      .join(' ');

    const bodyFlag = method !== 'GET' && body ? `-d '${body}'` : '';
    const curl = `curl -X ${method} ${headerFlags} ${bodyFlag} '${url}'`.trim();

    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied as cURL");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-yellow-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    if (status >= 500) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-3xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-medium">
            {data.title || 'API Request'}
          </span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${METHOD_COLORS[method] || ''}`}>
            {method}
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
            title="Copy as cURL"
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
          {/* URL bar */}
          <div className="p-3 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-mono font-medium ${METHOD_COLORS[method] || ''}`}
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={sendRequest}
              disabled={isLoading}
              className="px-4 gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(['headers', 'body', 'response'] as const).map(tab => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'response' && response && (
                  <span className={`ml-2 ${getStatusColor(response.status)}`}>
                    {response.status || 'Error'}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className={`${fullscreen ? 'flex-1 overflow-auto' : 'max-h-[400px] overflow-auto'}`}>
            {/* Headers tab */}
            {activeTab === 'headers' && (
              <div className="p-3 space-y-2">
                {headers.map((header, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Input
                      value={header.key}
                      onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                      placeholder="Header name"
                      className="flex-1 text-sm font-mono"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 text-sm font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => removeHeader(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={addHeader}
                >
                  <Plus className="h-3 w-3" />
                  Add Header
                </Button>
              </div>
            )}

            {/* Body tab */}
            {activeTab === 'body' && (
              <div className="p-3">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
            )}

            {/* Response tab */}
            {activeTab === 'response' && (
              <div>
                {isLoading && (
                  <div className="p-4 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending request...</span>
                  </div>
                )}

                {response && !isLoading && (
                  <div>
                    {/* Status bar */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {response.error ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : response.status >= 200 && response.status < 300 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className={`font-medium ${getStatusColor(response.status)}`}>
                          {response.error ? 'Error' : `${response.status} ${response.statusText}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-3 w-3" />
                        {response.duration.toFixed(0)}ms
                      </div>
                    </div>

                    {/* Response body */}
                    <div className="p-3">
                      {response.error ? (
                        <div className="text-red-500 text-sm">
                          {response.error}
                        </div>
                      ) : (
                        <pre className="font-mono text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-auto max-h-[300px]">
                          {typeof response.body === 'object'
                            ? JSON.stringify(response.body, null, 2)
                            : response.body || '(empty response)'}
                        </pre>
                      )}
                    </div>

                    {/* Response headers */}
                    {!response.error && Object.keys(response.headers).length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500">
                          Response Headers
                        </div>
                        <div className="p-3 text-xs font-mono space-y-1">
                          {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-500">{key}:</span>
                              <span className="text-gray-300">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!response && !isLoading && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Click Send to make a request
                  </div>
                )}
              </div>
            )}
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

export default ApiArtifact;
