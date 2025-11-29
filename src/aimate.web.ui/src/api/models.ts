import apiClient from './client';
import { Model } from './types';
import { AppConfig } from '../utils/config';

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  color: string;
  isAvailable: boolean;
  contextWindow?: number;
  maxTokens?: number;
}

// The simulated model that's always available
export const SIMULATED_MODEL: AvailableModel = {
  id: 'simulated',
  name: 'Simulated',
  provider: 'Local',
  color: 'text-gray-400',
  isAvailable: true,
};

// Map provider names to Tailwind color classes
const providerColors: Record<string, string> = {
  'OpenAI': 'text-purple-500',
  'Anthropic': 'text-orange-500',
  'Azure': 'text-blue-500',
  'Google': 'text-green-500',
  'Local': 'text-gray-400',
  'Custom': 'text-cyan-500',
};

function getColorForProvider(provider: string): string {
  return providerColors[provider] || 'text-gray-500';
}

/**
 * Fetch available models from the backend
 * Returns simulated model + real models from configured connections
 */
export async function getAvailableModels(): Promise<AvailableModel[]> {
  // If in offline mode, only return simulated model
  if (AppConfig.isOfflineMode()) {
    console.log('[Models API] Offline mode enabled, using simulated model only');
    return [SIMULATED_MODEL];
  }

  // Online mode - try to fetch from backend
  try {
    const models = await apiClient.get<Model[]>('/admin/models');

    const availableModels: AvailableModel[] = models
      .filter(m => m.isAvailable)
      .map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        color: getColorForProvider(m.provider),
        isAvailable: m.isAvailable,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
      }));

    return [SIMULATED_MODEL, ...availableModels];
  } catch (error) {
    // Silently fall back to simulated model when backend is unavailable
    // This is expected behavior during local development
    return [SIMULATED_MODEL];
  }
}

/**
 * Check if a model is the simulated model
 */
export function isSimulatedModel(modelId: string): boolean {
  return modelId === 'simulated';
}