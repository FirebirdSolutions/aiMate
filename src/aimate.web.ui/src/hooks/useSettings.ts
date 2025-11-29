/**
 * User Settings Hook
 * 
 * Manages user settings fetching, caching, and updates
 */

import { useState, useEffect, useCallback } from 'react';
import { settingsService, UserSettingsDto, UpdateSettingsDto } from '../api/services';
import { AppConfig } from '../utils/config';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // LOAD SETTINGS
  // ============================================================================

  const loadSettings = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock settings in offline mode
      setSettings({
        username: 'Rich',
        email: 'rich@example.com',
        userTier: 'BYOK',
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          inApp: true,
        },
        language: 'en-NZ',
        timezone: 'Pacific/Auckland',
        defaultModel: 'gpt-4-turbo',
        defaultPersonality: 'Helpful and friendly',
        autoSaveInterval: 30,
        showLineNumbers: true,
        fontSize: 14,
        fontFamily: 'monospace',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('[useSettings] Failed to load settings:', err);
      setError('Failed to load settings');
      // Fallback to mock settings on error
      setSettings({
        username: 'User',
        email: 'user@example.com',
        userTier: 'Free',
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          inApp: true,
        },
        language: 'en-NZ',
        timezone: 'Pacific/Auckland',
        defaultModel: 'gpt-3.5-turbo',
        defaultPersonality: 'Helpful',
        autoSaveInterval: 30,
        showLineNumbers: true,
        fontSize: 14,
        fontFamily: 'monospace',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // UPDATE SETTINGS
  // ============================================================================

  const updateSettings = useCallback(async (updates: UpdateSettingsDto) => {
    // Optimistic update
    setSettings(prev => prev ? { ...prev, ...updates } : null);

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      const updated = await settingsService.updateSettings(updates);
      setSettings(updated);
    } catch (err) {
      console.error('[useSettings] Failed to update settings:', err);
      // Revert optimistic update
      await loadSettings();
      throw err;
    }
  }, [loadSettings]);

  // ============================================================================
  // SPECIFIC UPDATES
  // ============================================================================

  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'auto') => {
    await updateSettings({ theme });
  }, [updateSettings]);

  const updateDefaultModel = useCallback(async (modelId: string) => {
    await updateSettings({ defaultModel: modelId });
  }, [updateSettings]);

  const updateDefaultPersonality = useCallback(async (personality: string) => {
    await updateSettings({ defaultPersonality: personality });
  }, [updateSettings]);

  const updateNotifications = useCallback(async (notifications: Partial<{
    email: boolean;
    push: boolean;
    inApp: boolean;
  }>) => {
    setSettings(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        notifications: {
          ...prev.notifications,
          ...notifications,
        },
      };
      // Call updateSettings asynchronously
      updateSettings(updated).catch(err => {
        console.error('[useSettings] Failed to update notifications:', err);
      });
      return updated;
    });
  }, [updateSettings]);

  const resetSettings = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      await loadSettings();
      return;
    }

    try {
      const reset = await settingsService.resetSettings();
      setSettings(reset);
    } catch (err) {
      console.error('[useSettings] Failed to reset settings:', err);
      throw err;
    }
  }, [loadSettings]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateTheme,
    updateDefaultModel,
    updateDefaultPersonality,
    updateNotifications,
    resetSettings,
    refresh: loadSettings,
  };
}
