/**
 * Chat Service
 * 
 * Handles OpenAI-compatible chat completions with streaming support
 */

import { apiClient } from '../client';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
} from '../types';

class ChatService {
  /**
   * Send a chat completion request (non-streaming)
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return apiClient.post<ChatCompletionResponse>('/chat/completions', {
      ...request,
      stream: false,
    });
  }

  /**
   * Send a chat completion request with streaming (SSE)
   * 
   * @param request - Chat completion request
   * @param onChunk - Callback for each chunk received
   * @param onComplete - Callback when stream completes
   * @param onError - Callback for errors
   */
  async createChatCompletionStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    await apiClient.streamSSE(
      '/chat/completions',
      {
        ...request,
        stream: true,
      },
      onChunk,
      onComplete,
      onError
    );
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    return apiClient.get<string[]>('/chat/models');
  }

  /**
   * Validate a chat request before sending
   */
  validateRequest(request: ChatCompletionRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.model) {
      errors.push('Model is required');
    }

    if (!request.messages || request.messages.length === 0) {
      errors.push('At least one message is required');
    }

    if (request.messages) {
      request.messages.forEach((msg, index) => {
        if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
          errors.push(`Invalid role at message ${index}`);
        }
        if (!msg.content) {
          errors.push(`Empty content at message ${index}`);
        }
      });
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (request.top_p !== undefined && (request.top_p < 0 || request.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }

    if (request.max_tokens !== undefined && request.max_tokens < 1) {
      errors.push('max_tokens must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const chatService = new ChatService();
export default chatService;
