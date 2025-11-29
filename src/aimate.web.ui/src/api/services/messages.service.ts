/**
 * Messages Service
 * 
 * Handles message CRUD and streaming
 */

import { apiClient } from '../client';
import { MessageDto, SendMessageDto, UpdateMessageDto } from '../types';

class MessagesService {
  /**
   * Get all messages for a conversation
   */
  async getMessages(conversationId: string): Promise<MessageDto[]> {
    return apiClient.get<MessageDto[]>(`/conversations/${conversationId}/messages`);
  }

  /**
   * Get a specific message
   */
  async getMessage(messageId: string): Promise<MessageDto> {
    return apiClient.get<MessageDto>(`/messages/${messageId}`);
  }

  /**
   * Send a message (with optional streaming)
   */
  async sendMessage(
    data: SendMessageDto,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<MessageDto> {
    if (data.stream && onChunk) {
      // Streaming mode
      return this.sendMessageStream(data, onChunk, signal);
    }

    // Non-streaming mode
    return apiClient.post<MessageDto>('/messages', data);
  }

  /**
   * Send a message with streaming (SSE)
   */
  private async sendMessageStream(
    data: SendMessageDto,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<MessageDto> {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      let messageId = '';

      apiClient.streamSSE(
        '/messages/stream',
        data,
        (chunk: any) => {
          // Handle different chunk types
          if (chunk.type === 'content') {
            fullContent += chunk.data;
            onChunk(chunk.data);
          } else if (chunk.type === 'metadata') {
            messageId = chunk.messageId;
          }
        },
        () => {
          // Stream complete
          resolve({
            id: messageId || `msg-${Date.now()}`,
            conversationId: data.conversationId || '',
            role: 'assistant',
            content: fullContent,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            metadata: {},
          });
        },
        (error: Error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, data: UpdateMessageDto): Promise<MessageDto> {
    return apiClient.patch<MessageDto>(`/messages/${messageId}`, data);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    return apiClient.delete(`/messages/${messageId}`);
  }

  /**
   * Regenerate a message
   */
  async regenerateMessage(messageId: string): Promise<MessageDto> {
    return apiClient.post<MessageDto>(`/messages/${messageId}/regenerate`);
  }

  /**
   * Submit feedback for a message
   */
  async submitFeedback(
    messageId: string,
    rating: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    return apiClient.post(`/messages/${messageId}/feedback`, {
      rating,
      comment,
    });
  }

  /**
   * Get message statistics
   */
  async getMessageStats(messageId: string): Promise<{
    tokenCount: number;
    cost: number;
    model: string;
    latency: number;
  }> {
    return apiClient.get(`/messages/${messageId}/stats`);
  }
}

export const messagesService = new MessagesService();
