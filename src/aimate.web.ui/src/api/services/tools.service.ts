/**
 * Tools Service
 *
 * Handles MCP tool discovery, validation, and execution
 */

import { apiClient } from '../client';
import { ToolDto, ToolExecutionRequest, ToolExecutionResponse, ToolParameter } from '../types';
import { AppConfig } from '../../utils/config';
import JSZip from 'jszip';

// Mock tools for offline development
const MOCK_TOOLS: Record<string, ToolDto[]> = {
  // Core MCP server - built-in file tools
  'core': [
    {
      name: 'create_file',
      description: 'Create a text file with the specified content. Returns the file for download.',
      category: 'files',
      parameters: {
        filename: {
          type: 'string',
          description: 'Name of the file to create (e.g., "report.md", "data.json")',
          required: true,
        },
        content: {
          type: 'string',
          description: 'Content of the file',
          required: true,
        },
        mimeType: {
          type: 'string',
          description: 'MIME type of the file (auto-detected if not specified)',
          required: false,
        },
      },
    },
    {
      name: 'create_zip',
      description: 'Create a ZIP archive containing multiple files. Returns the archive for download.',
      category: 'files',
      parameters: {
        filename: {
          type: 'string',
          description: 'Name of the ZIP file to create (e.g., "project.zip")',
          required: true,
        },
        files: {
          type: 'array',
          description: 'Array of files to include: [{path: "folder/file.txt", content: "..."}]',
          required: true,
        },
      },
    },
    {
      name: 'create_csv',
      description: 'Create a CSV file from structured data. Returns the file for download.',
      category: 'files',
      parameters: {
        filename: {
          type: 'string',
          description: 'Name of the CSV file (e.g., "data.csv")',
          required: true,
        },
        headers: {
          type: 'array',
          description: 'Column headers',
          required: true,
        },
        rows: {
          type: 'array',
          description: 'Array of row arrays containing cell values',
          required: true,
        },
        delimiter: {
          type: 'string',
          description: 'Field delimiter (default: ",")',
          required: false,
          default: ',',
        },
      },
    },
  ],
  'mcp-1': [
    {
      name: 'weather_lookup',
      description: 'Get current weather for a location',
      category: 'utilities',
      parameters: {
        location: {
          type: 'string',
          description: 'City name or coordinates',
          required: true,
        },
        units: {
          type: 'string',
          description: 'Temperature units (celsius/fahrenheit)',
          required: false,
          default: 'celsius',
        },
      },
    },
    {
      name: 'web_search',
      description: 'Search the web for information',
      category: 'search',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query',
          required: true,
        },
        limit: {
          type: 'integer',
          description: 'Number of results to return',
          required: false,
          default: 5,
        },
      },
    },
  ],
  'mcp-2': [
    {
      name: 'code_execute',
      description: 'Execute code in a sandboxed environment',
      category: 'code',
      parameters: {
        language: {
          type: 'string',
          description: 'Programming language (python, javascript, etc.)',
          required: true,
        },
        code: {
          type: 'string',
          description: 'Code to execute',
          required: true,
        },
        timeout: {
          type: 'integer',
          description: 'Execution timeout in seconds',
          required: false,
          default: 30,
        },
      },
    },
    {
      name: 'file_read',
      description: 'Read contents of a file',
      category: 'filesystem',
      parameters: {
        path: {
          type: 'string',
          description: 'File path to read',
          required: true,
        },
        encoding: {
          type: 'string',
          description: 'File encoding (utf-8, base64, etc.)',
          required: false,
          default: 'utf-8',
        },
      },
    },
  ],
};

class ToolsService {
  // ============================================================================
  // CONNECTION TESTING
  // ============================================================================

  /**
   * Test connection to an MCP server
   */
  async testConnection(url: string, auth: string, authToken: string): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    const startTime = Date.now();

    if (AppConfig.isOfflineMode()) {
      // Simulate connection test in offline mode
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      const latency = Date.now() - startTime;

      // Simulate some failures for testing
      if (url.includes('invalid') || url.includes('fail')) {
        return { success: false, message: 'Connection refused' };
      }

      return {
        success: true,
        message: 'Connected successfully',
        latency
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth === 'Bearer' && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else if (auth === 'API Key' && authToken) {
        headers['X-API-Key'] = authToken;
      }

      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { success: true, message: 'Connected successfully', latency };
      } else {
        return { success: false, message: `Server returned ${response.status}` };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection failed'
      };
    }
  }

  /**
   * Discover tools from an MCP server by URL
   */
  async discoverTools(url: string, auth: string, authToken: string): Promise<ToolDto[]> {
    if (AppConfig.isOfflineMode()) {
      console.log('[ToolsService] Discovering mock tools for URL:', url);
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

      // Return mock tools based on URL pattern
      if (url.includes('echo')) {
        return [
          {
            name: 'echo',
            description: 'Echo back the input message',
            category: 'utilities',
            parameters: {
              message: {
                type: 'string',
                description: 'Message to echo back',
                required: true,
              },
            },
          },
          {
            name: 'reverse',
            description: 'Reverse the input string',
            category: 'utilities',
            parameters: {
              text: {
                type: 'string',
                description: 'Text to reverse',
                required: true,
              },
            },
          },
        ];
      }

      // Default mock tools
      return MOCK_TOOLS['mcp-1'] || [];
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth === 'Bearer' && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else if (auth === 'API Key' && authToken) {
        headers['X-API-Key'] = authToken;
      }

      const response = await fetch(`${url}/tools`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[ToolsService] Failed to discover tools:', err);
      throw err;
    }
  }

  // ============================================================================
  // TOOL DISCOVERY
  // ============================================================================

  /**
   * Get all tools from an MCP server
   */
  async getToolsByServer(serverId: string): Promise<ToolDto[]> {
    if (AppConfig.isOfflineMode()) {
      console.log('[ToolsService] Returning mock tools for server:', serverId);
      return MOCK_TOOLS[serverId] || [];
    }

    return apiClient.get<ToolDto[]>(`/mcp/${serverId}/tools`);
  }

  /**
   * Get a specific tool's full schema
   */
  async getToolSchema(serverId: string, toolName: string): Promise<ToolDto> {
    if (AppConfig.isOfflineMode()) {
      const tools = MOCK_TOOLS[serverId] || [];
      const tool = tools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found on server ${serverId}`);
      }
      return tool;
    }

    return apiClient.get<ToolDto>(`/mcp/${serverId}/tools/${toolName}`);
  }

  /**
   * Get all tools from all enabled MCP servers
   */
  async getAllTools(serverIds: string[]): Promise<Record<string, ToolDto[]>> {
    const results: Record<string, ToolDto[]> = {};

    await Promise.all(
      serverIds.map(async (serverId) => {
        try {
          results[serverId] = await this.getToolsByServer(serverId);
        } catch (err) {
          console.error(`[ToolsService] Failed to get tools from ${serverId}:`, err);
          results[serverId] = [];
        }
      })
    );

    return results;
  }

  // ============================================================================
  // TOOL VALIDATION
  // ============================================================================

  /**
   * Validate tool parameters against schema
   */
  validateParameters(
    tool: ToolDto,
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required parameters
    for (const [name, param] of Object.entries(tool.parameters)) {
      if (param.required && !(name in parameters)) {
        errors.push(`Missing required parameter: ${name}`);
        continue;
      }

      // Type validation
      if (name in parameters) {
        const value = parameters[name];
        const expectedType = param.type;

        if (!this.validateType(value, expectedType)) {
          errors.push(`Invalid type for ${name}: expected ${expectedType}, got ${typeof value}`);
        }
      }
    }

    // Check for unknown parameters
    for (const name of Object.keys(parameters)) {
      if (!(name in tool.parameters)) {
        errors.push(`Unknown parameter: ${name}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateType(value: any, expectedType: ToolParameter['type']): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  // ============================================================================
  // TOOL EXECUTION
  // ============================================================================

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    serverId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResponse> {
    const startTime = Date.now();

    if (AppConfig.isOfflineMode()) {
      console.log('[ToolsService] Mock executing tool:', { serverId, toolName, parameters });

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

      // Return mock result based on tool name (async for zip creation)
      return await this.getMockExecutionResult(toolName, parameters, startTime);
    }

    const request: ToolExecutionRequest = {
      tool: toolName,
      parameters,
    };

    return apiClient.post<ToolExecutionResponse>(
      `/mcp/${serverId}/tools/${toolName}/execute`,
      request
    );
  }

  private async getMockExecutionResult(
    toolName: string,
    parameters: Record<string, any>,
    startTime: number
  ): Promise<ToolExecutionResponse> {
    const executionTime = Date.now() - startTime;

    switch (toolName) {
      case 'weather_lookup':
        return {
          success: true,
          toolName,
          result: {
            location: parameters.location,
            temperature: Math.round(15 + Math.random() * 15),
            conditions: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
            humidity: Math.round(40 + Math.random() * 40),
            wind: `${Math.round(5 + Math.random() * 20)} km/h`,
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      case 'web_search':
        return {
          success: true,
          toolName,
          result: {
            query: parameters.query,
            results: [
              { title: `Result 1 for "${parameters.query}"`, url: 'https://example.com/1', snippet: 'Sample search result...' },
              { title: `Result 2 for "${parameters.query}"`, url: 'https://example.com/2', snippet: 'Another relevant result...' },
              { title: `Result 3 for "${parameters.query}"`, url: 'https://example.com/3', snippet: 'More information about...' },
            ].slice(0, parameters.limit || 5),
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      case 'code_execute':
        return {
          success: true,
          toolName,
          result: {
            language: parameters.language,
            output: `Executed ${parameters.language} code successfully.\nOutput: Hello, World!`,
            exitCode: 0,
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      case 'file_read':
        return {
          success: true,
          toolName,
          result: {
            path: parameters.path,
            content: `Contents of ${parameters.path}:\n\nThis is sample file content...`,
            size: 1234,
            encoding: parameters.encoding || 'utf-8',
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      case 'create_file':
        return {
          success: true,
          toolName,
          result: {
            // File artifact structure - matches FileArtifactData interface
            filename: parameters.filename,
            content: parameters.content,
            mimeType: parameters.mimeType || this.inferMimeType(parameters.filename),
            encoding: 'utf-8',
            size: new Blob([parameters.content]).size,
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      case 'create_zip':
        // Actually create the zip client-side for the mock
        return await this.createZipResult(parameters.filename, parameters.files, executionTime);

      case 'create_csv':
        const csvContent = this.generateCsv(
          parameters.headers,
          parameters.rows,
          parameters.delimiter || ','
        );
        return {
          success: true,
          toolName,
          result: {
            filename: parameters.filename,
            content: csvContent,
            mimeType: 'text/csv',
            encoding: 'utf-8',
            size: new Blob([csvContent]).size,
          },
          executionTime,
          timestamp: new Date().toISOString(),
        };

      default:
        return {
          success: true,
          toolName,
          result: { message: `Tool ${toolName} executed successfully`, parameters },
          executionTime,
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * Infer MIME type from filename extension
   */
  private inferMimeType(filename: string): string {
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
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  /**
   * Generate CSV content from headers and rows
   */
  private generateCsv(headers: string[], rows: any[][], delimiter: string): string {
    const escapeField = (field: any): string => {
      const str = String(field ?? '');
      // Escape fields containing delimiter, quotes, or newlines
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeField).join(delimiter);
    const dataLines = rows.map(row => row.map(escapeField).join(delimiter));

    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Create a ZIP file result (client-side for mock, server-side for real)
   */
  private async createZipResult(
    filename: string,
    files: Array<{ path: string; content: string }>,
    executionTime: number
  ): Promise<ToolExecutionResponse> {
    try {
      const zip = new JSZip();

      for (const file of files) {
        zip.file(file.path, file.content);
      }

      // Generate base64 encoded zip
      const zipContent = await zip.generateAsync({ type: 'base64' });

      return {
        success: true,
        toolName: 'create_zip',
        result: {
          filename,
          content: zipContent,
          mimeType: 'application/zip',
          encoding: 'base64',
          size: Math.ceil(zipContent.length * 0.75), // Approximate decoded size
          fileCount: files.length,
        },
        executionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        toolName: 'create_zip',
        error: err instanceof Error ? err.message : 'Failed to create ZIP',
        executionTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================================================
  // TOOL SEARCH
  // ============================================================================

  /**
   * Search for tools matching a query across all servers
   */
  async searchTools(
    query: string,
    serverIds: string[]
  ): Promise<Array<{ serverId: string; tool: ToolDto; relevance: number }>> {
    const allTools = await this.getAllTools(serverIds);
    const results: Array<{ serverId: string; tool: ToolDto; relevance: number }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [serverId, tools] of Object.entries(allTools)) {
      for (const tool of tools) {
        let relevance = 0;

        // Check name match
        if (tool.name.toLowerCase().includes(lowerQuery)) {
          relevance += 10;
        }

        // Check description match
        if (tool.description.toLowerCase().includes(lowerQuery)) {
          relevance += 5;
        }

        // Check category match
        if (tool.category.toLowerCase().includes(lowerQuery)) {
          relevance += 3;
        }

        // Check parameter descriptions
        for (const param of Object.values(tool.parameters)) {
          if (param.description.toLowerCase().includes(lowerQuery)) {
            relevance += 1;
          }
        }

        if (relevance > 0) {
          results.push({ serverId, tool, relevance });
        }
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  }
}

export const toolsService = new ToolsService();
export default toolsService;
