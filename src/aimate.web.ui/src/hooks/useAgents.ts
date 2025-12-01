/**
 * Agent Presets Hook
 *
 * Manages AI agent presets - predefined configurations combining
 * system prompts, tools, and parameters for quick persona switching.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

export interface AgentPreset {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;

  // Configuration
  systemPrompt: string;
  enabledToolIds: string[];
  knowledgeIds: string[];

  // Parameters
  temperature?: number;
  maxTokens?: number;

  // Behavior
  autoApproveTools: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isBuiltIn: boolean;
  isEnabled: boolean;
}

interface AgentState {
  presets: AgentPreset[];
  activePresetId: string;
  recentPresetIds: string[];
}

const STORAGE_KEY = 'aimate-agent-presets';

// Built-in agent presets
const BUILT_IN_PRESETS: AgentPreset[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'A helpful, balanced AI assistant for everyday tasks',
    icon: '🤖',
    color: '#8b5cf6',
    systemPrompt: 'You are a helpful AI assistant. Be concise, accurate, and friendly.',
    enabledToolIds: [], // Empty means all enabled tools
    knowledgeIds: [],
    temperature: 0.7,
    autoApproveTools: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isBuiltIn: true,
    isEnabled: true,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for bugs, style issues, and security vulnerabilities',
    icon: '🔍',
    color: '#ef4444',
    systemPrompt: `You are an expert code reviewer. When reviewing code:
1. Check for bugs, logic errors, and edge cases
2. Identify security vulnerabilities (injection, XSS, etc.)
3. Suggest performance improvements
4. Comment on code style and readability
5. Recommend best practices

Be thorough but constructive. Explain why changes are needed.`,
    enabledToolIds: [],
    knowledgeIds: [],
    temperature: 0.3,
    autoApproveTools: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isBuiltIn: true,
    isEnabled: true,
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Searches and summarizes information from various sources',
    icon: '📚',
    color: '#3b82f6',
    systemPrompt: `You are a research assistant. When helping with research:
1. Search for relevant, credible sources
2. Summarize findings clearly and objectively
3. Cite sources when possible
4. Identify gaps in available information
5. Suggest follow-up questions

Present balanced viewpoints and note any controversies.`,
    enabledToolIds: ['web_search', 'fetch_url'],
    knowledgeIds: [],
    temperature: 0.5,
    autoApproveTools: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isBuiltIn: true,
    isEnabled: true,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes data patterns and creates insights',
    icon: '📊',
    color: '#10b981',
    systemPrompt: `You are a data analyst. When analyzing data:
1. Identify patterns, trends, and anomalies
2. Provide statistical insights where relevant
3. Suggest visualizations (describe or use mermaid charts)
4. Explain findings in plain language
5. Recommend next steps for deeper analysis

Be precise with numbers and clear about assumptions.`,
    enabledToolIds: [],
    knowledgeIds: [],
    temperature: 0.4,
    autoApproveTools: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isBuiltIn: true,
    isEnabled: true,
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'Helps with creative writing, storytelling, and content',
    icon: '✍️',
    color: '#f59e0b',
    systemPrompt: `You are a creative writing assistant. When helping with writing:
1. Use vivid, engaging language
2. Vary sentence structure and rhythm
3. Show don't tell - use concrete details
4. Maintain consistent tone and voice
5. Offer alternatives and variations

Be imaginative and don't be afraid to take creative risks.`,
    enabledToolIds: [],
    knowledgeIds: [],
    temperature: 1.0,
    autoApproveTools: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isBuiltIn: true,
    isEnabled: true,
  },
];

function loadState(): AgentState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge built-in presets with saved custom presets
      const savedIds = new Set(parsed.presets?.map((p: AgentPreset) => p.id) || []);
      const mergedPresets = [
        ...BUILT_IN_PRESETS.map(bp => {
          // Check if there's a saved version with isEnabled state
          const saved = parsed.presets?.find((p: AgentPreset) => p.id === bp.id);
          return saved ? { ...bp, isEnabled: saved.isEnabled ?? true } : bp;
        }),
        ...(parsed.presets?.filter((p: AgentPreset) => !p.isBuiltIn) || []),
      ];
      return {
        presets: mergedPresets,
        activePresetId: parsed.activePresetId || 'general-assistant',
        recentPresetIds: parsed.recentPresetIds || ['general-assistant'],
      };
    }
  } catch (err) {
    console.error('Failed to load agent presets:', err);
  }
  return {
    presets: BUILT_IN_PRESETS,
    activePresetId: 'general-assistant',
    recentPresetIds: ['general-assistant'],
  };
}

function saveState(state: AgentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save agent presets:', err);
  }
}

export function useAgents() {
  const [state, setState] = useState<AgentState>(loadState);

  // Persist to localStorage on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const activePreset = useMemo(
    () => state.presets.find(p => p.id === state.activePresetId) || state.presets[0],
    [state.presets, state.activePresetId]
  );

  const enabledPresets = useMemo(
    () => state.presets.filter(p => p.isEnabled),
    [state.presets]
  );

  const recentPresets = useMemo(
    () => state.recentPresetIds
      .map(id => state.presets.find(p => p.id === id))
      .filter((p): p is AgentPreset => p !== undefined && p.isEnabled)
      .slice(0, 5),
    [state.presets, state.recentPresetIds]
  );

  const setActivePreset = useCallback((presetId: string) => {
    setState(prev => ({
      ...prev,
      activePresetId: presetId,
      recentPresetIds: [
        presetId,
        ...prev.recentPresetIds.filter(id => id !== presetId),
      ].slice(0, 10),
    }));
  }, []);

  const createPreset = useCallback((preset: Omit<AgentPreset, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) => {
    const newPreset: AgentPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false,
    };
    setState(prev => ({
      ...prev,
      presets: [...prev.presets, newPreset],
    }));
    return newPreset;
  }, []);

  const updatePreset = useCallback((presetId: string, updates: Partial<AgentPreset>) => {
    setState(prev => ({
      ...prev,
      presets: prev.presets.map(p =>
        p.id === presetId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setState(prev => {
      const preset = prev.presets.find(p => p.id === presetId);
      if (preset?.isBuiltIn) {
        // Can't delete built-in, just disable
        return {
          ...prev,
          presets: prev.presets.map(p =>
            p.id === presetId ? { ...p, isEnabled: false } : p
          ),
        };
      }
      return {
        ...prev,
        presets: prev.presets.filter(p => p.id !== presetId),
        activePresetId: prev.activePresetId === presetId
          ? 'general-assistant'
          : prev.activePresetId,
        recentPresetIds: prev.recentPresetIds.filter(id => id !== presetId),
      };
    });
  }, []);

  const togglePreset = useCallback((presetId: string) => {
    setState(prev => ({
      ...prev,
      presets: prev.presets.map(p =>
        p.id === presetId ? { ...p, isEnabled: !p.isEnabled } : p
      ),
    }));
  }, []);

  const duplicatePreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return null;

    const newPreset: AgentPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      name: `${preset.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false,
    };
    setState(prev => ({
      ...prev,
      presets: [...prev.presets, newPreset],
    }));
    return newPreset;
  }, [state.presets]);

  const exportPresets = useCallback(() => {
    const customPresets = state.presets.filter(p => !p.isBuiltIn);
    return JSON.stringify(customPresets, null, 2);
  }, [state.presets]);

  const importPresets = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json) as AgentPreset[];
      if (!Array.isArray(imported)) throw new Error('Invalid format');

      const newPresets = imported.map(p => ({
        ...p,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setState(prev => ({
        ...prev,
        presets: [...prev.presets, ...newPresets],
      }));
      return newPresets.length;
    } catch (err) {
      console.error('Failed to import presets:', err);
      return 0;
    }
  }, []);

  return {
    presets: state.presets,
    enabledPresets,
    recentPresets,
    activePreset,
    activePresetId: state.activePresetId,
    setActivePreset,
    createPreset,
    updatePreset,
    deletePreset,
    togglePreset,
    duplicatePreset,
    exportPresets,
    importPresets,
  };
}

export type UseAgentsReturn = ReturnType<typeof useAgents>;
