/**
 * Tools Service
 *
 * Handles MCP tool discovery and execution for chat integration
 */

import { apiClient } from '../client';
import {
  ToolDto,
  ToolExecutionRequest,
  ToolExecutionResponse,
} from '../types';

/**
 * Response for listing available tools
 */
export interface ToolsListResponse {
  tools: ToolDto[];
  serverCount: number;
  totalTools: number;
}

/**
 * Tool execution options
 */
export interface ExecuteToolOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Conversation context for the tool */
  conversationId?: string;
  /** Message context for the tool */
  messageId?: string;
}

class ToolsService {
  // ============================================================================
  // TOOL DISCOVERY
  // ============================================================================

  /**
   * Get all available tools from connected MCP servers
   */
  async getAvailableTools(): Promise<ToolDto[]> {
    return apiClient.get<ToolDto[]>('/tools');
  }

  /**
   * Get tools grouped by category
   */
  async getToolsByCategory(): Promise<Record<string, ToolDto[]>> {
    const tools = await this.getAvailableTools();
    return tools.reduce((acc, tool) => {
      const category = tool.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    }, {} as Record<string, ToolDto[]>);
  }

  /**
   * Get a specific tool by name
   */
  async getTool(name: string): Promise<ToolDto> {
    return apiClient.get<ToolDto>(`/tools/${encodeURIComponent(name)}`);
  }

  /**
   * Search tools by name or description
   */
  async searchTools(query: string): Promise<ToolDto[]> {
    const tools = await this.getAvailableTools();
    const lowerQuery = query.toLowerCase();
    return tools.filter(
      tool =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================================================
  // TOOL EXECUTION
  // ============================================================================

  /**
   * Execute a tool with the given parameters
   */
  async executeTool(
    request: ToolExecutionRequest,
    options?: ExecuteToolOptions
  ): Promise<ToolExecutionResponse> {
    const payload = {
      ...request,
      conversationId: options?.conversationId,
      messageId: options?.messageId,
    };

    return apiClient.post<ToolExecutionResponse>('/tools/execute', payload, {
      timeout: options?.timeout || 30000, // Default 30s timeout for tool execution
    });
  }

  /**
   * Execute multiple tools in sequence
   */
  async executeToolsSequence(
    requests: ToolExecutionRequest[],
    options?: ExecuteToolOptions
  ): Promise<ToolExecutionResponse[]> {
    const results: ToolExecutionResponse[] = [];

    for (const request of requests) {
      const result = await this.executeTool(request, options);
      results.push(result);

      // Stop if a tool fails
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeToolsParallel(
    requests: ToolExecutionRequest[],
    options?: ExecuteToolOptions
  ): Promise<ToolExecutionResponse[]> {
    return Promise.all(
      requests.map(request => this.executeTool(request, options))
    );
  }

  // ============================================================================
  // TOOL VALIDATION
  // ============================================================================

  /**
   * Validate tool parameters before execution
   */
  validateToolParameters(
    tool: ToolDto,
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      if (paramDef.required && !(paramName in parameters)) {
        errors.push(`Missing required parameter: ${paramName}`);
        continue;
      }

      const value = parameters[paramName];
      if (value === undefined || value === null) {
        if (paramDef.required) {
          errors.push(`Parameter ${paramName} is required`);
        }
        continue;
      }

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const expectedType = paramDef.type;

      if (expectedType === 'integer' && (!Number.isInteger(value))) {
        errors.push(`Parameter ${paramName} must be an integer`);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${paramName} must be a number`);
      } else if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(`Parameter ${paramName} must be a string`);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${paramName} must be a boolean`);
      } else if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter ${paramName} must be an array`);
      } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`Parameter ${paramName} must be an object`);
      }
    }

    // Check for unknown parameters
    for (const paramName of Object.keys(parameters)) {
      if (!(paramName in tool.parameters)) {
        errors.push(`Unknown parameter: ${paramName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build default parameters for a tool
   */
  buildDefaultParameters(tool: ToolDto): Record<string, any> {
    const defaults: Record<string, any> = {};

    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      if (paramDef.default !== undefined) {
        defaults[paramName] = paramDef.default;
      }
    }

    return defaults;
  }
}

export const toolsService = new ToolsService();
export default toolsService;
