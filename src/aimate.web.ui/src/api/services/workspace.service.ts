/**
 * Workspace & Conversation Service
 * 
 * Handles workspace and conversation management
 */

import { apiClient } from '../client';
import {
  WorkspaceDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ConversationDto,
  CreateConversationDto,
  UpdateConversationDto,
  ApiSuccessResponse,
} from '../types';

class WorkspaceService {
  // ============================================================================
  // WORKSPACES
  // ============================================================================

  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<WorkspaceDto[]> {
    return apiClient.get<WorkspaceDto[]>('/workspaces');
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<WorkspaceDto> {
    return apiClient.get<WorkspaceDto>(`/workspaces/${id}`);
  }

  /**
   * Create new workspace
   */
  async createWorkspace(data: CreateWorkspaceDto): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>('/workspaces', data);
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, data: UpdateWorkspaceDto): Promise<WorkspaceDto> {
    return apiClient.put<WorkspaceDto>(`/workspaces/${id}`, data);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/workspaces/${id}`);
  }

  /**
   * Duplicate workspace
   */
  async duplicateWorkspace(id: string): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>(`/workspaces/${id}/duplicate`);
  }

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  /**
   * Get all conversations in a workspace
   */
  async getConversations(workspaceId: string): Promise<ConversationDto[]> {
    return apiClient.get<ConversationDto[]>(`/workspaces/${workspaceId}/conversations`);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.get<ConversationDto>(`/workspaces/${workspaceId}/conversations/${conversationId}`);
  }

  /**
   * Create new conversation in workspace
   */
  async createConversation(workspaceId: string, data: CreateConversationDto): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(`/workspaces/${workspaceId}/conversations`, data);
  }

  /**
   * Update conversation
   */
  async updateConversation(
    workspaceId: string,
    conversationId: string,
    data: UpdateConversationDto
  ): Promise<ConversationDto> {
    return apiClient.put<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}`,
      data
    );
  }

  /**
   * Delete conversation
   */
  async deleteConversation(workspaceId: string, conversationId: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(
      `/workspaces/${workspaceId}/conversations/${conversationId}`
    );
  }

  /**
   * Pin conversation
   */
  async pinConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}/pin`
    );
  }

  /**
   * Unpin conversation
   */
  async unpinConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}/unpin`
    );
  }

  /**
   * Archive conversation
   */
  async archiveConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}/archive`
    );
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}/unarchive`
    );
  }

  /**
   * Duplicate conversation
   */
  async duplicateConversation(workspaceId: string, conversationId: string): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>(
      `/workspaces/${workspaceId}/conversations/${conversationId}/duplicate`
    );
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;
