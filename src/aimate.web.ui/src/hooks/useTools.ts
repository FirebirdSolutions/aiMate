/**
 * Tools Hook
 *
 * Manages MCP tool discovery and execution for chat integration
 */

import { useState, useCallback, useEffect } from 'react';
import { toolsService } from '../api/services';
import { ToolDto, ToolExecutionRequest, ToolExecutionResponse } from '../api/types';
import { AppConfig } from '../utils/config';

// ============================================================================
// MOCK DATA FOR OFFLINE MODE
// ============================================================================

const MOCK_TOOLS: ToolDto[] = [
  {
    name: 'web_search',
    description: 'Search the web for information',
    category: 'Search',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query',
        required: true,
      },
      maxResults: {
        type: 'integer',
        description: 'Maximum number of results',
        required: false,
        default: 5,
      },
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    category: 'Weather',
    parameters: {
      location: {
        type: 'string',
        description: 'City name or coordinates',
        required: true,
      },
      units: {
        type: 'string',
        description: 'Temperature units (celsius or fahrenheit)',
        required: false,
        default: 'celsius',
      },
    },
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    category: 'Math',
    parameters: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate',
        required: true,
      },
    },
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a text description',
    category: 'Media',
    parameters: {
      prompt: {
        type: 'string',
        description: 'Text description of the image to generate',
        required: true,
      },
      style: {
        type: 'string',
        description: 'Art style (realistic, cartoon, abstract)',
        required: false,
        default: 'realistic',
      },
    },
  },
  {
    name: 'read_url',
    description: 'Read and extract content from a URL',
    category: 'Web',
    parameters: {
      url: {
        type: 'string',
        description: 'URL to read',
        required: true,
      },
      extractImages: {
        type: 'boolean',
        description: 'Whether to extract images',
        required: false,
        default: false,
      },
    },
  },
];

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface ToolExecution {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'success' | 'error';
  result?: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
}

export interface UseToolsReturn {
  // State
  tools: ToolDto[];
  toolsByCategory: Record<string, ToolDto[]>;
  loading: boolean;
  error: string | null;
  executions: ToolExecution[];

  // Actions
  loadTools: () => Promise<void>;
  getTool: (name: string) => ToolDto | undefined;
  searchTools: (query: string) => ToolDto[];
  executeTool: (
    request: ToolExecutionRequest,
    options?: { conversationId?: string; messageId?: string }
  ) => Promise<ToolExecutionResponse>;
  validateParameters: (
    tool: ToolDto,
    parameters: Record<string, any>
  ) => { valid: boolean; errors: string[] };
  clearExecutions: () => void;
  getExecutionById: (id: string) => ToolExecution | undefined;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useTools(): UseToolsReturn {
  const [tools, setTools] = useState<ToolDto[]>([]);
  const [toolsByCategory, setToolsByCategory] = useState<Record<string, ToolDto[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);

  // ============================================================================
  // LOAD TOOLS
  // ============================================================================

  const loadTools = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      console.log('[useTools] Using mock tools in offline mode');
      setTools(MOCK_TOOLS);

      // Group by category
      const byCategory = MOCK_TOOLS.reduce((acc, tool) => {
        const category = tool.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tool);
        return acc;
      }, {} as Record<string, ToolDto[]>);

      setToolsByCategory(byCategory);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const loadedTools = await toolsService.getAvailableTools();
      setTools(loadedTools);

      // Group by category
      const byCategory = loadedTools.reduce((acc, tool) => {
        const category = tool.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tool);
        return acc;
      }, {} as Record<string, ToolDto[]>);

      setToolsByCategory(byCategory);
      console.log('[useTools] Loaded tools:', loadedTools.length);
    } catch (err) {
      console.error('[useTools] Failed to load tools:', err);
      setError('Failed to load available tools');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tools on mount
  useEffect(() => {
    loadTools();
  }, [loadTools]);

  // ============================================================================
  // GET TOOL
  // ============================================================================

  const getTool = useCallback(
    (name: string): ToolDto | undefined => {
      return tools.find((t) => t.name === name);
    },
    [tools]
  );

  // ============================================================================
  // SEARCH TOOLS
  // ============================================================================

  const searchTools = useCallback(
    (query: string): ToolDto[] => {
      const lowerQuery = query.toLowerCase();
      return tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery) ||
          tool.category.toLowerCase().includes(lowerQuery)
      );
    },
    [tools]
  );

  // ============================================================================
  // EXECUTE TOOL
  // ============================================================================

  const executeTool = useCallback(
    async (
      request: ToolExecutionRequest,
      options?: { conversationId?: string; messageId?: string }
    ): Promise<ToolExecutionResponse> => {
      const executionId = `exec-${Date.now()}`;
      const startedAt = new Date().toISOString();

      // Add to executions list
      const execution: ToolExecution = {
        id: executionId,
        tool: request.tool,
        parameters: request.parameters,
        status: 'executing',
        startedAt,
      };
      setExecutions((prev) => [...prev, execution]);

      if (AppConfig.isOfflineMode()) {
        // Simulate tool execution in offline mode
        console.log('[useTools] Simulating tool execution in offline mode:', request.tool);

        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        const mockResult = generateMockToolResult(request);
        const completedAt = new Date().toISOString();
        const executionTime = new Date(completedAt).getTime() - new Date(startedAt).getTime();

        // Update execution status
        setExecutions((prev) =>
          prev.map((e) =>
            e.id === executionId
              ? {
                  ...e,
                  status: 'success',
                  result: mockResult.result,
                  completedAt,
                  executionTime,
                }
              : e
          )
        );

        return mockResult;
      }

      try {
        const result = await toolsService.executeTool(request, {
          conversationId: options?.conversationId,
          messageId: options?.messageId,
        });

        const completedAt = new Date().toISOString();

        // Update execution status
        setExecutions((prev) =>
          prev.map((e) =>
            e.id === executionId
              ? {
                  ...e,
                  status: result.success ? 'success' : 'error',
                  result: result.result,
                  error: result.success ? undefined : 'Tool execution failed',
                  completedAt,
                  executionTime: result.executionTime,
                }
              : e
          )
        );

        console.log('[useTools] Tool executed:', request.tool, result);
        return result;
      } catch (err) {
        console.error('[useTools] Tool execution failed:', err);
        const completedAt = new Date().toISOString();

        // Update execution status
        setExecutions((prev) =>
          prev.map((e) =>
            e.id === executionId
              ? {
                  ...e,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Unknown error',
                  completedAt,
                }
              : e
          )
        );

        throw err;
      }
    },
    []
  );

  // ============================================================================
  // VALIDATE PARAMETERS
  // ============================================================================

  const validateParameters = useCallback(
    (tool: ToolDto, parameters: Record<string, any>): { valid: boolean; errors: string[] } => {
      return toolsService.validateToolParameters(tool, parameters);
    },
    []
  );

  // ============================================================================
  // CLEAR EXECUTIONS
  // ============================================================================

  const clearExecutions = useCallback(() => {
    setExecutions([]);
  }, []);

  // ============================================================================
  // GET EXECUTION BY ID
  // ============================================================================

  const getExecutionById = useCallback(
    (id: string): ToolExecution | undefined => {
      return executions.find((e) => e.id === id);
    },
    [executions]
  );

  return {
    // State
    tools,
    toolsByCategory,
    loading,
    error,
    executions,

    // Actions
    loadTools,
    getTool,
    searchTools,
    executeTool,
    validateParameters,
    clearExecutions,
    getExecutionById,
  };
}

// ============================================================================
// MOCK RESULT GENERATOR
// ============================================================================

function generateMockToolResult(request: ToolExecutionRequest): ToolExecutionResponse {
  const timestamp = new Date().toISOString();

  switch (request.tool) {
    case 'web_search':
      return {
        success: true,
        toolName: 'web_search',
        result: {
          query: request.parameters.query,
          results: [
            {
              title: `Result 1 for "${request.parameters.query}"`,
              url: 'https://example.com/1',
              snippet: 'This is a mock search result with relevant information...',
            },
            {
              title: `Result 2 for "${request.parameters.query}"`,
              url: 'https://example.com/2',
              snippet: 'Another mock search result with more details...',
            },
          ],
        },
        executionTime: 850,
        timestamp,
      };

    case 'get_weather':
      return {
        success: true,
        toolName: 'get_weather',
        result: {
          location: request.parameters.location,
          temperature: 18,
          conditions: 'Partly cloudy',
          humidity: 65,
          wind: '15 km/h NW',
        },
        executionTime: 320,
        timestamp,
      };

    case 'calculate':
      return {
        success: true,
        toolName: 'calculate',
        result: {
          expression: request.parameters.expression,
          result: '42', // The answer to everything
        },
        executionTime: 50,
        timestamp,
      };

    case 'generate_image':
      return {
        success: true,
        toolName: 'generate_image',
        result: {
          prompt: request.parameters.prompt,
          imageUrl: 'https://via.placeholder.com/512x512?text=Generated+Image',
          style: request.parameters.style || 'realistic',
        },
        executionTime: 2500,
        timestamp,
      };

    case 'read_url':
      return {
        success: true,
        toolName: 'read_url',
        result: {
          url: request.parameters.url,
          title: 'Mock Page Title',
          content: 'This is mock content extracted from the URL. In production, this would contain the actual page content.',
          wordCount: 150,
        },
        executionTime: 1200,
        timestamp,
      };

    default:
      return {
        success: true,
        toolName: request.tool,
        result: { message: `Mock result for tool: ${request.tool}` },
        executionTime: 500,
        timestamp,
      };
  }
}

export default useTools;
