import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { AppConfig } from '../utils/config';
import { ApiErrorResponse } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000';

// Retry configuration
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 60 seconds

// Rate limiting
const RATE_LIMIT_RETRY_DELAY = 60000; // 60 seconds default

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Add random jitter to prevent thundering herd problem
 */
function addJitter(delay: number): number {
  return delay + Math.random() * 1000;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, baseDelay: number = BASE_RETRY_DELAY): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), MAX_RETRY_DELAY);
  return addJitter(exponentialDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429;
}

/**
 * Parse API error response
 */
function parseApiError(error: AxiosError): ApiErrorResponse {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.error) {
      return data as ApiErrorResponse;
    }
  }

  // Fallback error format
  return {
    error: {
      message: error.message || 'An unexpected error occurred',
      type: 'network_error',
      code: 'NETWORK_ERROR',
    },
  };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request with retry logic
   */
  async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    // If offline mode, throw error immediately without retries
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode - no network requests');
    }

    const finalConfig = { ...config, params };
    return this.requestWithRetry<T>(() => this.client.get<T>(url, finalConfig));
  }

  /**
   * POST request with retry logic
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // If offline mode, throw error immediately without retries
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode - no network requests');
    }

    return this.requestWithRetry<T>(() => this.client.post<T>(url, data, config));
  }

  /**
   * PATCH request with retry logic
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // If offline mode, throw error immediately without retries
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode - no network requests');
    }

    return this.requestWithRetry<T>(() => this.client.patch<T>(url, data, config));
  }

  /**
   * PUT request with retry logic
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // If offline mode, throw error immediately without retries
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode - no network requests');
    }

    return this.requestWithRetry<T>(() => this.client.put<T>(url, data, config));
  }

  /**
   * DELETE request with retry logic
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // If offline mode, throw error immediately without retries
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode - no network requests');
    }

    return this.requestWithRetry<T>(() => this.client.delete<T>(url, config));
  }

  /**
   * Generic request with exponential backoff retry logic
   */
  private async requestWithRetry<T>(
    requestFn: () => Promise<any>,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Handle rate limiting
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_RETRY_DELAY;

        console.warn(`[API Client] Rate limited. Retrying in ${delay / 1000}s...`);
        await sleep(delay);

        if (attempt < MAX_RETRIES) {
          return this.requestWithRetry<T>(requestFn, attempt + 1);
        }
      }

      // Retry on retryable errors
      if (isRetryableError(axiosError) && attempt < MAX_RETRIES) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(
          `[API Client] Request failed (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${Math.round(delay / 1000)}s...`,
          parseApiError(axiosError).error.message
        );
        await sleep(delay);
        return this.requestWithRetry<T>(requestFn, attempt + 1);
      }

      // Non-retryable error or max retries exceeded
      throw axiosError;
    }
  }

  /**
   * Server-Sent Events (SSE) streaming for chat completions
   * 
   * @param url - API endpoint
   * @param data - Request body
   * @param onChunk - Callback for each SSE chunk
   * @param onComplete - Callback when stream completes
   * @param onError - Callback for errors
   */
  async streamSSE(
    url: string,
    data: any,
    onChunk: (chunk: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // If offline mode, throw error to trigger fallback
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode enabled');
    }

    const token = localStorage.getItem('auth_token');
    const fullUrl = `${API_BASE_URL}/api/v1${url}`;

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: ApiErrorResponse;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
              type: 'http_error',
              code: 'HTTP_ERROR',
            },
          };
        }

        throw new Error(errorData.error.message);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line === 'data: [DONE]') {
            onComplete();
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              onChunk(jsonData);
            } catch (parseError) {
              console.warn('[API Client] Failed to parse SSE chunk:', line);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    // If offline mode, throw error to trigger fallback
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode enabled');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add any additional form fields
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    const response = await this.client.post<T>(url, formData, config);
    return response.data;
  }

  /**
   * Download file as blob
   */
  async downloadFile(url: string): Promise<Blob> {
    // If offline mode, throw error to trigger fallback
    if (AppConfig.isOfflineMode()) {
      throw new Error('Offline mode enabled');
    }

    const response = await this.client.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return `${API_BASE_URL}/api/v1`;
  }

  /**
   * Get full URL for a path
   */
  getFullUrl(path: string): string {
    return `${this.getBaseUrl()}${path}`;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;