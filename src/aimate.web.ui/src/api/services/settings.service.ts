/**
 * Settings Service
 * 
 * Handles user settings and preferences
 */

import { apiClient } from '../client';
import { UserSettingsDto, UpdateSettingsDto } from '../types';

class SettingsService {
  /**
   * Get current user settings
   */
  async getSettings(): Promise<UserSettingsDto> {
    return apiClient.get<UserSettingsDto>('/settings');
  }

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsDto): Promise<UserSettingsDto> {
    return apiClient.put<UserSettingsDto>('/settings', data);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<UserSettingsDto> {
    return apiClient.post<UserSettingsDto>('/settings/reset');
  }

  /**
   * Update theme only
   */
  async updateTheme(theme: 'light' | 'dark' | 'auto'): Promise<UserSettingsDto> {
    return this.updateSettings({ theme });
  }

  /**
   * Update default model
   */
  async updateDefaultModel(modelId: string): Promise<UserSettingsDto> {
    return this.updateSettings({ defaultModel: modelId });
  }

  /**
   * Update default personality
   */
  async updateDefaultPersonality(personality: string): Promise<UserSettingsDto> {
    return this.updateSettings({ defaultPersonality: personality });
  }

  /**
   * Update notification settings
   */
  async updateNotifications(notifications: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  }): Promise<UserSettingsDto> {
    const current = await this.getSettings();
    return this.updateSettings({
      notifications: {
        ...current.notifications,
        ...notifications,
      },
    });
  }

  /**
   * Update editor preferences
   */
  async updateEditorPreferences(prefs: {
    showLineNumbers?: boolean;
    fontSize?: number;
    fontFamily?: string;
  }): Promise<UserSettingsDto> {
    return this.updateSettings(prefs);
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<UserSettingsDto> {
    return this.getSettings();
  }

  /**
   * Import settings from JSON
   */
  async importSettings(settings: UpdateSettingsDto): Promise<UserSettingsDto> {
    return this.updateSettings(settings);
  }
}

export const settingsService = new SettingsService();
export default settingsService;
