import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from './types';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000';

export class ChatStreamClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  async createCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const token = this.getToken();

    const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}

export const chatStreamClient = new ChatStreamClient();