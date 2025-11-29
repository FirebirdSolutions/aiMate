/**
 * Workspaces Service
 * 
 * Handles workspace management and organization
 */

import { apiClient } from '../client';
import { WorkspaceDto, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types';

class WorkspacesService {
  /**
   * Get all workspaces for the current user
   */
  async getWorkspaces(): Promise<WorkspaceDto[]> {
    return apiClient.get<WorkspaceDto[]>('/workspaces');
  }

  /**
   * Get a specific workspace
   */
  async getWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.get<WorkspaceDto>(`/workspaces/${workspaceId}`);
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: CreateWorkspaceDto): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>('/workspaces', data);
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(
    workspaceId: string,
    data: Partial<UpdateWorkspaceDto>
  ): Promise<WorkspaceDto> {
    return apiClient.patch<WorkspaceDto>(`/workspaces/${workspaceId}`, data);
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    return apiClient.delete(`/workspaces/${workspaceId}`);
  }

  /**
   * Set default workspace
   */
  async setDefaultWorkspace(workspaceId: string): Promise<void> {
    return apiClient.post(`/workspaces/${workspaceId}/set-default`);
  }

  /**
   * Duplicate a workspace
   */
  async duplicateWorkspace(workspaceId: string): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(`/workspaces/${workspaceId}/duplicate`);
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    conversationCount: number;
    projectCount: number;
    documentCount: number;
    memberCount: number;
    totalMessages: number;
    totalTokens: number;
  }> {
    return apiClient.get(`/workspaces/${workspaceId}/stats`);
  }

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    return apiClient.post(`/workspaces/${workspaceId}/members`, { userId, role });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }
}

export const workspacesService = new WorkspacesService();
