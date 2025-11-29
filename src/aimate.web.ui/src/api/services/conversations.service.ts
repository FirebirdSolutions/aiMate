/**
 * Conversations Service
 * 
 * Handles conversation management
 */

import { apiClient } from '../client';
import { ConversationDto, CreateConversationDto, UpdateConversationDto } from '../types';

class ConversationsService {
  /**
   * Get all conversations for a workspace
   */
  async getConversations(workspaceId?: string, options?: { page?: number; pageSize?: number }): Promise<ConversationDto[]> {
    const params: any = workspaceId ? { workspaceId } : {};
    if (options?.page) params.page = options.page;
    if (options?.pageSize) params.pageSize = options.pageSize;
    return apiClient.get<ConversationDto[]>('/conversations', params);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<ConversationDto> {
    return apiClient.get<ConversationDto>(`/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationDto): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>('/conversations', data);
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    data: Partial<UpdateConversationDto>
  ): Promise<ConversationDto> {
    return apiClient.patch<ConversationDto>(`/conversations/${conversationId}`, data);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`/conversations/${conversationId}`);
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/archive`);
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/unarchive`);
  }

  /**
   * Pin a conversation
   */
  async pinConversation(conversationId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/pin`);
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(conversationId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/unpin`);
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string, workspaceId?: string): Promise<ConversationDto[]> {
    const params: any = { query };
    if (workspaceId) params.workspaceId = workspaceId;
    return apiClient.get<ConversationDto[]>('/conversations/search', params);
  }

  /**
   * Export a conversation
   */
  async exportConversation(
    conversationId: string,
    format: 'json' | 'markdown' | 'pdf' = 'json'
  ): Promise<Blob> {
    return apiClient.get<Blob>(
      `/conversations/${conversationId}/export`,
      { format },
      { responseType: 'blob' }
    );
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    tokenCount: number;
    totalCost: number;
    createdAt: string;
    lastMessageAt: string;
  }> {
    return apiClient.get(`/conversations/${conversationId}/stats`);
  }
}

export const conversationsService = new ConversationsService();
