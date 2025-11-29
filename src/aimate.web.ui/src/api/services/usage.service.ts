/**
 * Usage Analytics Service
 * 
 * Handles usage tracking, billing, and analytics
 */

import { apiClient } from '../client';
import { UsageStatsDto } from '../types';

class UsageService {
  /**
   * Get usage statistics for current billing period
   */
  async getUsageStats(): Promise<UsageStatsDto> {
    return apiClient.get<UsageStatsDto>('/usage');
  }

  /**
   * Get usage statistics for specific date range
   */
  async getUsageByDateRange(startDate: string, endDate: string): Promise<UsageStatsDto> {
    return apiClient.get<UsageStatsDto>(
      `/usage?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
  }

  /**
   * Get usage by model
   */
  async getUsageByModel(modelId: string): Promise<{
    model: string;
    messages: number;
    tokens: number;
    cost: number;
  }> {
    return apiClient.get(`/usage/models/${modelId}`);
  }

  /**
   * Get daily usage breakdown
   */
  async getDailyUsage(days: number = 30): Promise<
    Array<{
      date: string;
      messages: number;
      tokens: number;
      cost: number;
    }>
  > {
    return apiClient.get(`/usage/daily?days=${days}`);
  }

  /**
   * Get hourly usage for today
   */
  async getHourlyUsage(): Promise<
    Array<{
      hour: number;
      messages: number;
      tokens: number;
    }>
  > {
    return apiClient.get('/usage/hourly');
  }

  /**
   * Export usage data as CSV
   */
  async exportUsage(startDate: string, endDate: string): Promise<Blob> {
    return apiClient.downloadFile(
      `/usage/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
  }

  /**
   * Get cost projection for current month
   */
  async getCostProjection(): Promise<{
    currentCost: number;
    projectedCost: number;
    daysRemaining: number;
  }> {
    return apiClient.get('/usage/projection');
  }

  /**
   * Check if approaching usage limits
   */
  async checkUsageLimits(): Promise<{
    nearLimit: boolean;
    percentUsed: number;
    limit: number;
    current: number;
  }> {
    return apiClient.get('/usage/limits');
  }
}

export const usageService = new UsageService();
export default usageService;
