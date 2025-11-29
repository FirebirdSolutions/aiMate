/**
 * Connections Service (BYOK)
 * 
 * Handles Bring Your Own Key (BYOK) connections to AI providers
 */

import { apiClient } from '../client';
import {
  ConnectionDto,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionTestResponse,
  ApiSuccessResponse,
} from '../types';

class ConnectionsService {
  /**
   * Get all connections for current user
   */
  async getConnections(): Promise<ConnectionDto[]> {
    return apiClient.get<ConnectionDto[]>('/connections');
  }

  /**
   * Get connection by ID
   */
  async getConnection(id: string): Promise<ConnectionDto> {
    return apiClient.get<ConnectionDto>(`/connections/${id}`);
  }

  /**
   * Create new connection
   */
  async createConnection(data: CreateConnectionDto): Promise<ConnectionDto> {
    return apiClient.post<ConnectionDto>('/connections', data);
  }

  /**
   * Update connection
   */
  async updateConnection(id: string, data: UpdateConnectionDto): Promise<ConnectionDto> {
    return apiClient.put<ConnectionDto>(`/connections/${id}`, data);
  }

  /**
   * Delete connection
   */
  async deleteConnection(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/connections/${id}`);
  }

  /**
   * Test connection to verify API key and fetch available models
   */
  async testConnection(id: string): Promise<ConnectionTestResponse> {
    return apiClient.post<ConnectionTestResponse>(`/connections/${id}/test`);
  }

  /**
   * Test connection with credentials (before creating)
   */
  async testConnectionWithCredentials(
    provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Azure' | 'Custom',
    apiKey: string,
    baseUrl?: string
  ): Promise<ConnectionTestResponse> {
    return apiClient.post<ConnectionTestResponse>('/connections/test', {
      provider,
      apiKey,
      baseUrl,
    });
  }

  /**
   * Activate connection
   */
  async activateConnection(id: string): Promise<ConnectionDto> {
    return apiClient.post<ConnectionDto>(`/connections/${id}/activate`);
  }

  /**
   * Deactivate connection
   */
  async deactivateConnection(id: string): Promise<ConnectionDto> {
    return apiClient.post<ConnectionDto>(`/connections/${id}/deactivate`);
  }

  /**
   * Refresh models for connection
   */
  async refreshModels(id: string): Promise<ConnectionDto> {
    return apiClient.post<ConnectionDto>(`/connections/${id}/refresh-models`);
  }

  /**
   * Get active connections only
   */
  async getActiveConnections(): Promise<ConnectionDto[]> {
    const connections = await this.getConnections();
    return connections.filter(conn => conn.isActive);
  }

  /**
   * Get connections by provider
   */
  async getConnectionsByProvider(provider: string): Promise<ConnectionDto[]> {
    const connections = await this.getConnections();
    return connections.filter(conn => conn.provider === provider);
  }

  /**
   * Validate API key format
   */
  validateApiKeyFormat(provider: string, apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: 'API key is required' };
    }

    switch (provider) {
      case 'OpenAI':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
        }
        break;
      case 'Anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' };
        }
        break;
      case 'Google':
        // Google API keys have various formats
        if (apiKey.length < 30) {
          return { valid: false, error: 'Google API key appears too short' };
        }
        break;
      // Azure and Custom can have various formats
    }

    return { valid: true };
  }
}

export const connectionsService = new ConnectionsService();
export default connectionsService;
