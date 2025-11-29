/**
 * Feedback Service
 * 
 * Handles user feedback, ratings, templates, and analytics
 */

import { apiClient } from '../client';
import {
  FeedbackDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackStatsDto,
  FeedbackTemplateDto,
  CreateFeedbackTemplateDto,
  ApiSuccessResponse,
} from '../types';

class FeedbackService {
  // ============================================================================
  // FEEDBACK CRUD
  // ============================================================================

  /**
   * Get all feedback (with optional filters)
   */
  async getFeedback(params?: {
    modelId?: string;
    userId?: string;
    minRating?: number;
    maxRating?: number;
  }): Promise<FeedbackDto[]> {
    const queryParams = new URLSearchParams();
    if (params?.modelId) queryParams.append('modelId', params.modelId);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params?.maxRating) queryParams.append('maxRating', params.maxRating.toString());

    const query = queryParams.toString();
    return apiClient.get<FeedbackDto[]>(`/feedback${query ? `?${query}` : ''}`);
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string): Promise<FeedbackDto> {
    return apiClient.get<FeedbackDto>(`/feedback/${id}`);
  }

  /**
   * Get feedback for a specific message
   */
  async getFeedbackByMessage(messageId: string): Promise<FeedbackDto> {
    return apiClient.get<FeedbackDto>(`/feedback/message/${messageId}`);
  }

  /**
   * Create feedback
   */
  async createFeedback(data: CreateFeedbackDto): Promise<FeedbackDto> {
    return apiClient.post<FeedbackDto>('/feedback', data);
  }

  /**
   * Update feedback
   */
  async updateFeedback(id: string, data: UpdateFeedbackDto): Promise<FeedbackDto> {
    return apiClient.put<FeedbackDto>(`/feedback/${id}`, data);
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/feedback/${id}`);
  }

  // ============================================================================
  // FEEDBACK ANALYTICS
  // ============================================================================

  /**
   * Get feedback statistics for all models or specific model
   */
  async getFeedbackStats(modelId?: string): Promise<FeedbackStatsDto> {
    const url = modelId ? `/feedback/stats?modelId=${modelId}` : '/feedback/stats';
    return apiClient.get<FeedbackStatsDto>(url);
  }

  /**
   * Get feedback statistics by model
   */
  async getFeedbackStatsByModel(modelId: string): Promise<FeedbackStatsDto> {
    return apiClient.get<FeedbackStatsDto>(`/feedback/stats/models/${modelId}`);
  }

  // ============================================================================
  // FEEDBACK TEMPLATES
  // ============================================================================

  /**
   * Get all feedback templates
   */
  async getFeedbackTemplates(): Promise<FeedbackTemplateDto[]> {
    return apiClient.get<FeedbackTemplateDto[]>('/feedback/templates');
  }

  /**
   * Get active feedback templates only
   */
  async getActiveFeedbackTemplates(): Promise<FeedbackTemplateDto[]> {
    return apiClient.get<FeedbackTemplateDto[]>('/feedback/templates?active=true');
  }

  /**
   * Get feedback template by ID
   */
  async getFeedbackTemplate(id: string): Promise<FeedbackTemplateDto> {
    return apiClient.get<FeedbackTemplateDto>(`/feedback/templates/${id}`);
  }

  /**
   * Create feedback template
   */
  async createFeedbackTemplate(data: CreateFeedbackTemplateDto): Promise<FeedbackTemplateDto> {
    return apiClient.post<FeedbackTemplateDto>('/feedback/templates', data);
  }

  /**
   * Update feedback template
   */
  async updateFeedbackTemplate(
    id: string,
    data: Partial<CreateFeedbackTemplateDto>
  ): Promise<FeedbackTemplateDto> {
    return apiClient.put<FeedbackTemplateDto>(`/feedback/templates/${id}`, data);
  }

  /**
   * Delete feedback template
   */
  async deleteFeedbackTemplate(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/feedback/templates/${id}`);
  }

  /**
   * Toggle template active status
   */
  async toggleTemplateActive(id: string): Promise<FeedbackTemplateDto> {
    return apiClient.post<FeedbackTemplateDto>(`/feedback/templates/${id}/toggle`);
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
