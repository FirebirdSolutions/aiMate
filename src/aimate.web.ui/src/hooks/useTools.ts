/**
 * Tools Hook
 *
 * Manages MCP tool discovery, execution, and state
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toolsService, ToolDto, ToolExecutionResponse } from '../api/services';
import { useAdminSettings } from '../context/AdminSettingsContext';
import { toast } from 'sonner';

export interface ToolCall {
  id: string;
  serverId: string;
  toolName: string;
  parameters: Record<string, any>;
  status: 'pending' | 'awaiting_approval' | 'running' | 'completed' | 'failed' | 'declined';
  result?: ToolExecutionResponse;
  error?: string;
  startedAt: string;
  completedAt?: string;
  permission?: 'never' | 'ask' | 'always';
}

export function useTools() {
  const { settings } = useAdminSettings();

  // State
  const [tools, setTools] = useState<Record<string, ToolDto[]>>({});
  const [loading, setLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [executing, setExecuting] = useState(false);

  // Get enabled MCP server IDs from admin settings
  const enabledServerIds = useMemo(() => {
    return settings.mcpConnectors
      ?.filter(c => c.enabled)
      .map(c => c.id) || [];
  }, [settings.mcpConnectors]);

  // ============================================================================
  // LOAD TOOLS
  // ============================================================================

  const loadTools = useCallback(async () => {
    if (enabledServerIds.length === 0) {
      setTools({});
      return;
    }

    setLoading(true);
    try {
      const allTools = await toolsService.getAllTools(enabledServerIds);
      setTools(allTools);
      console.log('[useTools] Loaded tools:', Object.values(allTools).flat().length, 'total');
    } catch (err) {
      console.error('[useTools] Failed to load tools:', err);
      toast.error('Failed to load MCP tools');
    } finally {
      setLoading(false);
    }
  }, [enabledServerIds]);

  // Load tools when enabled servers change
  useEffect(() => {
    loadTools();
  }, [loadTools]);

  // ============================================================================
  // GET TOOL
  // ============================================================================

  const getTool = useCallback((serverId: string, toolName: string): ToolDto | undefined => {
    return tools[serverId]?.find(t => t.name === toolName);
  }, [tools]);

  // ============================================================================
  // EXECUTE TOOL
  // ============================================================================

  const executeTool = useCallback(async (
    serverId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ToolCall> => {
    const tool = getTool(serverId, toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`);
    }

    // Validate parameters
    const validation = toolsService.validateParameters(tool, parameters);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Create tool call record
    const toolCall: ToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serverId,
      toolName,
      parameters,
      status: 'pending',
      startedAt: new Date().toISOString(),
    };

    // Add to state
    setToolCalls(prev => [...prev, toolCall]);
    setExecuting(true);

    try {
      // Update status to running
      setToolCalls(prev => prev.map(tc =>
        tc.id === toolCall.id ? { ...tc, status: 'running' as const } : tc
      ));

      console.log('[useTools] Executing tool:', toolName, parameters);
      const result = await toolsService.executeTool(serverId, toolName, parameters);

      // Update with result
      const completedCall: ToolCall = {
        ...toolCall,
        status: 'completed',
        result,
        completedAt: new Date().toISOString(),
      };

      setToolCalls(prev => prev.map(tc =>
        tc.id === toolCall.id ? completedCall : tc
      ));

      console.log('[useTools] Tool execution complete:', result);
      return completedCall;
    } catch (err) {
      console.error('[useTools] Tool execution failed:', err);

      // Update with error
      const failedCall: ToolCall = {
        ...toolCall,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date().toISOString(),
      };

      setToolCalls(prev => prev.map(tc =>
        tc.id === toolCall.id ? failedCall : tc
      ));

      toast.error(`Tool execution failed: ${failedCall.error}`);
      return failedCall;
    } finally {
      setExecuting(false);
    }
  }, [getTool]);

  // ============================================================================
  // SEARCH TOOLS
  // ============================================================================

  const searchTools = useCallback(async (query: string) => {
    if (!query.trim() || enabledServerIds.length === 0) {
      return [];
    }

    return toolsService.searchTools(query, enabledServerIds);
  }, [enabledServerIds]);

  // ============================================================================
  // PARSE TOOL CALLS FROM TEXT
  // ============================================================================

  /**
   * Parse tool calls from assistant message content
   * Format: <tool_call name="tool_name" server="server_id">{"param": "value"}</tool_call>
   * Or JSON: {"tool_calls": [{"name": "...", "server": "...", "parameters": {...}}]}
   */
  const parseToolCalls = useCallback((content: string): Array<{
    toolName: string;
    serverId: string;
    parameters: Record<string, any>;
  }> => {
    const calls: Array<{
      toolName: string;
      serverId: string;
      parameters: Record<string, any>;
    }> = [];

    // Try XML-like format first
    const xmlPattern = /<tool_call\s+name="([^"]+)"\s+server="([^"]+)">([\s\S]*?)<\/tool_call>/g;
    let match;

    while ((match = xmlPattern.exec(content)) !== null) {
      try {
        const [, toolName, serverId, paramsJson] = match;
        const parameters = JSON.parse(paramsJson.trim());
        calls.push({ toolName, serverId, parameters });
      } catch {
        // Skip invalid JSON
        console.warn('[useTools] Failed to parse tool call parameters');
      }
    }

    // Try JSON format if no XML matches
    if (calls.length === 0) {
      try {
        // Look for JSON block with tool_calls
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (Array.isArray(parsed.tool_calls)) {
            for (const call of parsed.tool_calls) {
              if (call.name && call.server && call.parameters) {
                calls.push({
                  toolName: call.name,
                  serverId: call.server,
                  parameters: call.parameters,
                });
              }
            }
          }
        }
      } catch {
        // Not valid JSON
      }
    }

    return calls;
  }, []);

  // ============================================================================
  // GET ALL TOOLS FLAT
  // ============================================================================

  const allTools = useMemo(() => {
    const result: Array<{ serverId: string; tool: ToolDto }> = [];
    for (const [serverId, serverTools] of Object.entries(tools)) {
      for (const tool of serverTools) {
        result.push({ serverId, tool });
      }
    }
    return result;
  }, [tools]);

  // ============================================================================
  // CLEAR TOOL CALLS
  // ============================================================================

  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  // ============================================================================
  // GET PENDING TOOL CALLS
  // ============================================================================

  const pendingToolCalls = useMemo(() => {
    return toolCalls.filter(tc => tc.status === 'pending' || tc.status === 'running');
  }, [toolCalls]);

  // ============================================================================
  // GET AWAITING APPROVAL TOOL CALLS
  // ============================================================================

  const awaitingApprovalCalls = useMemo(() => {
    return toolCalls.filter(tc => tc.status === 'awaiting_approval');
  }, [toolCalls]);

  // ============================================================================
  // REQUEST TOOL EXECUTION (WITH PERMISSION CHECK)
  // ============================================================================

  /**
   * Request a tool execution, checking permission settings.
   * Returns the tool call with appropriate status based on permission.
   */
  const requestToolExecution = useCallback((
    serverId: string,
    toolName: string,
    parameters: Record<string, any>
  ): ToolCall => {
    // Find the connector and tool to check permission
    const connector = settings.mcpConnectors?.find(c => c.id === serverId);
    const toolConfig = connector?.tools?.find(t => t.name === toolName);
    const permission = toolConfig?.permission || 'ask';

    // Create tool call record
    const toolCall: ToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serverId,
      toolName,
      parameters,
      status: permission === 'always' ? 'pending' : permission === 'never' ? 'declined' : 'awaiting_approval',
      startedAt: new Date().toISOString(),
      permission,
    };

    // Add to state
    setToolCalls(prev => [...prev, toolCall]);

    // If permission is 'always', automatically start execution
    if (permission === 'always') {
      // Execute in the next tick to allow state update
      setTimeout(() => {
        executeTool(serverId, toolName, parameters);
      }, 0);
    } else if (permission === 'never') {
      toast.error(`Tool "${toolName}" is blocked by permission settings`);
    }

    return toolCall;
  }, [settings.mcpConnectors, executeTool]);

  // ============================================================================
  // APPROVE TOOL CALL
  // ============================================================================

  const approveToolCall = useCallback(async (toolCallId: string): Promise<ToolCall | null> => {
    const toolCall = toolCalls.find(tc => tc.id === toolCallId);
    if (!toolCall || toolCall.status !== 'awaiting_approval') {
      return null;
    }

    // Update status to pending first
    setToolCalls(prev => prev.map(tc =>
      tc.id === toolCallId ? { ...tc, status: 'pending' as const } : tc
    ));

    // Execute the tool
    return executeTool(toolCall.serverId, toolCall.toolName, toolCall.parameters);
  }, [toolCalls, executeTool]);

  // ============================================================================
  // DECLINE TOOL CALL
  // ============================================================================

  const declineToolCall = useCallback((toolCallId: string) => {
    setToolCalls(prev => prev.map(tc =>
      tc.id === toolCallId
        ? { ...tc, status: 'declined' as const, completedAt: new Date().toISOString() }
        : tc
    ));
    toast.info('Tool execution declined');
  }, []);

  return {
    // State
    tools,
    allTools,
    toolCalls,
    pendingToolCalls,
    awaitingApprovalCalls,
    loading,
    executing,

    // Actions
    loadTools,
    getTool,
    executeTool,
    requestToolExecution,
    approveToolCall,
    declineToolCall,
    searchTools,
    parseToolCalls,
    clearToolCalls,
  };
}
