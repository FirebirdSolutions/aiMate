/**
 * Admin Service
 * 
 * Handles administrative operations, models, MCP servers, and system logs
 */

import { apiClient } from '../client';
import {
  AdminDashboardDto,
  ModelDto,
  McpServerDto,
  LogEntryDto,
  ApiSuccessResponse,
} from '../types';

class AdminService {
  // ============================================================================
  // DASHBOARD
  // ============================================================================

  /**
   * Get admin dashboard statistics
   */
  async getDashboard(): Promise<AdminDashboardDto> {
    return apiClient.get<AdminDashboardDto>('/admin/dashboard');
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'Healthy' | 'Degraded' | 'Critical';
    uptime: number;
    lastBackup: string;
    issues: string[];
  }> {
    return apiClient.get('/admin/health');
  }

  // ============================================================================
  // MODELS MANAGEMENT
  // ============================================================================

  /**
   * Get all available models
   */
  async getModels(): Promise<ModelDto[]> {
    return apiClient.get<ModelDto[]>('/admin/models');
  }

  /**
   * Get model by ID
   */
  async getModel(id: string): Promise<ModelDto> {
    return apiClient.get<ModelDto>(`/admin/models/${id}`);
  }

  /**
   * Create new model
   */
  async createModel(data: Partial<ModelDto>): Promise<ModelDto> {
    return apiClient.post<ModelDto>('/admin/models', data);
  }

  /**
   * Update model
   */
  async updateModel(id: string, data: Partial<ModelDto>): Promise<ModelDto> {
    return apiClient.put<ModelDto>(`/admin/models/${id}`, data);
  }

  /**
   * Delete model
   */
  async deleteModel(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/admin/models/${id}`);
  }

  /**
   * Toggle model active status
   */
  async toggleModel(id: string): Promise<ModelDto> {
    return apiClient.post<ModelDto>(`/admin/models/${id}/toggle`);
  }

  /**
   * Activate model
   */
  async activateModel(id: string): Promise<ModelDto> {
    return apiClient.post<ModelDto>(`/admin/models/${id}/activate`);
  }

  /**
   * Deactivate model
   */
  async deactivateModel(id: string): Promise<ModelDto> {
    return apiClient.post<ModelDto>(`/admin/models/${id}/deactivate`);
  }

  /**
   * Sync models from providers
   */
  async syncModels(): Promise<{ added: number; updated: number; removed: number }> {
    return apiClient.post('/admin/models/sync');
  }

  // ============================================================================
  // MCP SERVERS
  // ============================================================================

  /**
   * Get all MCP servers
   */
  async getMcpServers(): Promise<McpServerDto[]> {
    return apiClient.get<McpServerDto[]>('/admin/mcp-servers');
  }

  /**
   * Get MCP server by ID
   */
  async getMcpServer(id: string): Promise<McpServerDto> {
    return apiClient.get<McpServerDto>(`/admin/mcp-servers/${id}`);
  }

  /**
   * Create new MCP server
   */
  async createMcpServer(data: Partial<McpServerDto>): Promise<McpServerDto> {
    return apiClient.post<McpServerDto>('/admin/mcp-servers', data);
  }

  /**
   * Update MCP server
   */
  async updateMcpServer(id: string, data: Partial<McpServerDto>): Promise<McpServerDto> {
    return apiClient.put<McpServerDto>(`/admin/mcp-servers/${id}`, data);
  }

  /**
   * Delete MCP server
   */
  async deleteMcpServer(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/admin/mcp-servers/${id}`);
  }

  /**
   * Toggle MCP server active status
   */
  async toggleMcpServer(id: string): Promise<McpServerDto> {
    return apiClient.post<McpServerDto>(`/admin/mcp-servers/${id}/toggle`);
  }

  /**
   * Test MCP server connection
   */
  async testMcpServer(id: string): Promise<{
    success: boolean;
    status: 'Connected' | 'Disconnected' | 'Error';
    message: string;
    tools: string[];
  }> {
    return apiClient.post(`/admin/mcp-servers/${id}/test`);
  }

  /**
   * Reconnect MCP server
   */
  async reconnectMcpServer(id: string): Promise<McpServerDto> {
    return apiClient.post<McpServerDto>(`/admin/mcp-servers/${id}/reconnect`);
  }

  // ============================================================================
  // SYSTEM LOGS
  // ============================================================================

  /**
   * Get system logs
   */
  async getLogs(params?: {
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    source?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<LogEntryDto[]> {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get<LogEntryDto[]>(`/admin/logs${query ? `?${query}` : ''}`);
  }

  /**
   * Get error logs only
   */
  async getErrorLogs(limit: number = 100): Promise<LogEntryDto[]> {
    return this.getLogs({ level: 'ERROR', limit });
  }

  /**
   * Get critical logs only
   */
  async getCriticalLogs(limit: number = 50): Promise<LogEntryDto[]> {
    return this.getLogs({ level: 'CRITICAL', limit });
  }

  /**
   * Clear old logs
   */
  async clearLogs(olderThan: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/admin/logs?olderThan=${encodeURIComponent(olderThan)}`);
  }

  /**
   * Export logs as file
   */
  async exportLogs(startDate: string, endDate: string): Promise<Blob> {
    return apiClient.downloadFile(
      `/admin/logs/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
  }

  // ============================================================================
  // USERS MANAGEMENT
  // ============================================================================

  /**
   * Get all users
   */
  async getUsers(): Promise<Array<{
    id: string;
    username: string;
    email: string;
    userTier: string;
    isActive: boolean;
    createdAt: string;
  }>> {
    return apiClient.get('/admin/users');
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<any> {
    return apiClient.get(`/admin/users/${id}`);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: any): Promise<any> {
    return apiClient.put(`/admin/users/${id}`, data);
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/admin/users/${id}/activate`);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/admin/users/${id}/deactivate`);
  }

  // ============================================================================
  // SYSTEM OPERATIONS
  // ============================================================================

  /**
   * Trigger system backup
   */
  async createBackup(): Promise<{
    success: boolean;
    backupId: string;
    timestamp: string;
  }> {
    return apiClient.post('/admin/backup');
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/admin/backup/${backupId}/restore`);
  }

  /**
   * Clear system cache
   */
  async clearCache(): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>('/admin/cache/clear');
  }

  /**
   * Run database maintenance
   */
  async runMaintenance(): Promise<{
    success: boolean;
    operations: string[];
    duration: number;
  }> {
    return apiClient.post('/admin/maintenance');
  }
}

export const adminService = new AdminService();
export default adminService;
