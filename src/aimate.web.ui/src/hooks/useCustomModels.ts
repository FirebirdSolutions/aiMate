/**
 * useCustomModels Hook
 *
 * Manages custom model presets - wrapped models with system prompts,
 * bound knowledge/tools, and capabilities.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { customModelsService } from '../api/services/customModels.service';
import {
  CustomModelDto,
  CreateCustomModelDto,
  UpdateCustomModelDto,
  CustomModelExportDto,
  PromptSuggestionDto,
} from '../api/types';
import { injectDynamicVariables, DynamicVariableContext } from '../utils/dynamicVariables';

interface UseCustomModelsOptions {
  autoLoad?: boolean;
  persistSelection?: boolean; // Persist selected model ID to localStorage
}

const SELECTED_MODEL_KEY = 'aiMate_activeCustomModelId';
const RECENT_MODELS_KEY = 'aiMate_recentCustomModelIds';
const MODELS_CHANGED_EVENT = 'aiMate_customModelsChanged';

interface UseCustomModelsReturn {
  // State
  customModels: CustomModelDto[];
  enabledModels: CustomModelDto[];
  recentModels: CustomModelDto[];
  isLoading: boolean;
  selectedModelId: string | null;
  selectedModel: CustomModelDto | null;

  // CRUD
  loadModels: () => Promise<void>;
  createModel: (data: CreateCustomModelDto) => Promise<CustomModelDto>;
  updateModel: (id: string, data: UpdateCustomModelDto) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  cloneModel: (id: string) => Promise<CustomModelDto>;
  toggleModel: (id: string) => Promise<void>;

  // Selection
  selectModel: (id: string | null) => void;

  // Usage
  recordUsage: (id: string) => Promise<void>;

  // Import/Export
  exportModels: (ids?: string[]) => Promise<string>;
  importModels: (json: string) => Promise<number>;

  // System Prompt
  getInjectedSystemPrompt: (modelId: string, context?: DynamicVariableContext) => Promise<string | null>;

  // Prompt Suggestions
  getPromptSuggestions: (modelId: string) => PromptSuggestionDto[];

  // For model selector - merge custom models with base models
  getModelSelectorOptions: () => Array<{
    id: string;
    name: string;
    isCustom: boolean;
    avatar?: string;
    color?: string;
    provider?: string;
  }>;
}

export function useCustomModels(options: UseCustomModelsOptions = {}): UseCustomModelsReturn {
  const { autoLoad = true, persistSelection = true } = options;

  const [customModels, setCustomModels] = useState<CustomModelDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentModelIds, setRecentModelIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_MODELS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    if (!persistSelection) return null;
    try {
      return localStorage.getItem(SELECTED_MODEL_KEY);
    } catch {
      return null;
    }
  });

  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const models = await customModelsService.getCustomModels();
      setCustomModels(models);
    } catch (error) {
      console.error('Failed to load custom models:', error);
      toast.error('Failed to load custom models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load models on mount and listen for changes from other instances
  useEffect(() => {
    if (autoLoad) {
      loadModels();
    }

    // Listen for model changes from other hook instances
    const handleModelsChanged = () => {
      loadModels();
    };
    window.addEventListener(MODELS_CHANGED_EVENT, handleModelsChanged);

    return () => {
      window.removeEventListener(MODELS_CHANGED_EVENT, handleModelsChanged);
    };
  }, [autoLoad, loadModels]);

  // Persist selection to localStorage
  useEffect(() => {
    if (persistSelection) {
      if (selectedModelId) {
        localStorage.setItem(SELECTED_MODEL_KEY, selectedModelId);
      } else {
        localStorage.removeItem(SELECTED_MODEL_KEY);
      }
    }
  }, [selectedModelId, persistSelection]);

  // Persist recent models to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(recentModelIds.slice(0, 10)));
    } catch {
      // Ignore storage errors
    }
  }, [recentModelIds]);

  const enabledModels = useMemo(
    () => customModels.filter(m => m.isEnabled && !m.isHidden),
    [customModels]
  );

  const recentModels = useMemo(
    () => recentModelIds
      .map(id => customModels.find(m => m.id === id))
      .filter((m): m is CustomModelDto => m !== undefined && m.isEnabled && !m.isHidden)
      .slice(0, 5),
    [customModels, recentModelIds]
  );

  const selectedModel = useMemo(
    () => customModels.find(m => m.id === selectedModelId) || null,
    [customModels, selectedModelId]
  );

  const createModel = useCallback(async (data: CreateCustomModelDto): Promise<CustomModelDto> => {
    try {
      setIsLoading(true);
      const newModel = await customModelsService.createCustomModel(data);
      setCustomModels(prev => [...prev, newModel]);
      toast.success('Custom model created');
      // Notify other instances
      window.dispatchEvent(new Event(MODELS_CHANGED_EVENT));
      return newModel;
    } catch (error) {
      console.error('Failed to create custom model:', error);
      toast.error('Failed to create custom model');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateModel = useCallback(async (id: string, data: UpdateCustomModelDto) => {
    try {
      setIsLoading(true);
      const updated = await customModelsService.updateCustomModel(id, data);
      setCustomModels(prev => prev.map(m => m.id === id ? updated : m));
      toast.success('Custom model updated');
      // Notify other instances
      window.dispatchEvent(new Event(MODELS_CHANGED_EVENT));
    } catch (error) {
      console.error('Failed to update custom model:', error);
      toast.error('Failed to update custom model');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteModel = useCallback(async (id: string) => {
    try {
      await customModelsService.deleteCustomModel(id);
      setCustomModels(prev => prev.filter(m => m.id !== id));
      if (selectedModelId === id) {
        setSelectedModelId(null);
      }
      toast.success('Custom model deleted');
      // Notify other instances
      window.dispatchEvent(new Event(MODELS_CHANGED_EVENT));
    } catch (error) {
      console.error('Failed to delete custom model:', error);
      toast.error('Failed to delete custom model');
    }
  }, [selectedModelId]);

  const cloneModel = useCallback(async (id: string): Promise<CustomModelDto> => {
    try {
      setIsLoading(true);
      const cloned = await customModelsService.cloneCustomModel(id);
      setCustomModels(prev => [...prev, cloned]);
      toast.success('Custom model cloned');
      // Notify other instances
      window.dispatchEvent(new Event(MODELS_CHANGED_EVENT));
      return cloned;
    } catch (error) {
      console.error('Failed to clone custom model:', error);
      toast.error('Failed to clone custom model');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleModel = useCallback(async (id: string) => {
    try {
      const updated = await customModelsService.toggleCustomModel(id);
      setCustomModels(prev => prev.map(m => m.id === id ? updated : m));
      // Notify other instances
      window.dispatchEvent(new Event(MODELS_CHANGED_EVENT));
    } catch (error) {
      console.error('Failed to toggle custom model:', error);
      toast.error('Failed to toggle custom model');
    }
  }, []);

  const selectModel = useCallback((id: string | null) => {
    setSelectedModelId(id);
    // Track in recent models
    if (id) {
      setRecentModelIds(prev => [id, ...prev.filter(rid => rid !== id)].slice(0, 10));
    }
  }, []);

  const recordUsage = useCallback(async (id: string) => {
    try {
      await customModelsService.recordUsage(id);
      // Update local state
      setCustomModels(prev => prev.map(m =>
        m.id === id
          ? { ...m, usageCount: m.usageCount + 1, lastUsed: new Date().toISOString() }
          : m
      ));
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }, []);

  const exportModels = useCallback(async (ids?: string[]): Promise<string> => {
    try {
      const exported = await customModelsService.exportCustomModels(ids);
      return JSON.stringify(exported, null, 2);
    } catch (error) {
      console.error('Failed to export custom models:', error);
      toast.error('Failed to export custom models');
      throw error;
    }
  }, []);

  const importModels = useCallback(async (json: string): Promise<number> => {
    try {
      const data = JSON.parse(json) as CustomModelExportDto;
      const count = await customModelsService.importCustomModels(data);
      await loadModels(); // Refresh the list
      toast.success(`Imported ${count} custom model(s)`);
      return count;
    } catch (error) {
      console.error('Failed to import custom models:', error);
      toast.error('Failed to import custom models');
      throw error;
    }
  }, [loadModels]);

  const getInjectedSystemPrompt = useCallback(async (
    modelId: string,
    context?: DynamicVariableContext
  ): Promise<string | null> => {
    const model = customModels.find(m => m.id === modelId);
    if (!model) return null;

    // Inject dynamic variables
    return injectDynamicVariables(model.systemPrompt, context);
  }, [customModels]);

  const getPromptSuggestions = useCallback((modelId: string): PromptSuggestionDto[] => {
    const model = customModels.find(m => m.id === modelId);
    return model?.promptSuggestions || [];
  }, [customModels]);

  const getModelSelectorOptions = useCallback(() => {
    return enabledModels.map(m => ({
      id: m.id,
      name: m.name,
      isCustom: true,
      avatar: m.avatar,
      color: m.color,
      provider: m.baseModelProvider,
    }));
  }, [enabledModels]);

  return {
    // State
    customModels,
    enabledModels,
    recentModels,
    isLoading,
    selectedModelId,
    selectedModel,

    // CRUD
    loadModels,
    createModel,
    updateModel,
    deleteModel,
    cloneModel,
    toggleModel,

    // Selection
    selectModel,

    // Usage
    recordUsage,

    // Import/Export
    exportModels,
    importModels,

    // System Prompt
    getInjectedSystemPrompt,

    // Prompt Suggestions
    getPromptSuggestions,

    // Model selector
    getModelSelectorOptions,
  };
}

export default useCustomModels;
