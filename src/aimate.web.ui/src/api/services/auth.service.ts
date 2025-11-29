/**
 * Authentication & API Key Service
 * 
 * Handles user authentication, JWT tokens, and API key management
 */

import { apiClient } from '../client';
import {
  ApiKeyDto,
  CreateApiKeyDto,
  ApiKeyResponseDto,
  ApiSuccessResponse,
} from '../types';

class AuthService {
  /**
   * Login with username/password
   */
  async login(username: string, password: string): Promise<{ token: string; refreshToken: string }> {
    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      '/auth/login',
      { username, password }
    );
    
    // Store tokens
    apiClient.setAuthToken(response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    
    return response;
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuthToken();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    // Update stored tokens
    apiClient.setAuthToken(response.token);
    localStorage.setItem('refresh_token', response.refreshToken);

    return response;
  }

  /**
   * Register new user
   */
  async register(username: string, email: string, password: string): Promise<{ token: string; refreshToken: string }> {
    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      '/auth/register',
      { username, email, password }
    );

    // Store tokens
    apiClient.setAuthToken(response.token);
    localStorage.setItem('refresh_token', response.refreshToken);

    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  // ============================================================================
  // API KEY MANAGEMENT
  // ============================================================================

  /**
   * Get all API keys for current user
   */
  async getApiKeys(): Promise<ApiKeyDto[]> {
    return apiClient.get<ApiKeyDto[]>('/api-keys');
  }

  /**
   * Get specific API key by ID
   */
  async getApiKey(id: string): Promise<ApiKeyDto> {
    return apiClient.get<ApiKeyDto>(`/api-keys/${id}`);
  }

  /**
   * Create new API key
   * IMPORTANT: The actual key is only returned once!
   */
  async createApiKey(data: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    return apiClient.post<ApiKeyResponseDto>('/api-keys', data);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/api-keys/${id}/revoke`);
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/api-keys/${id}`);
  }
}

export const authService = new AuthService();
export default authService;
