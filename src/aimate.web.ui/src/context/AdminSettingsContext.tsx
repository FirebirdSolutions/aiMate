import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// General Settings
interface GeneralSettings {
  adminEnabled: boolean;
  userRegistration: boolean;
  apiAccess: boolean;
}

// Interface Settings
interface InterfaceSettings {
  localTaskModel: string;
  externalTaskModel: string;
  titleGeneration: boolean;
  titleGenerationPrompt: string;
  followUpGeneration: boolean;
  tagsGeneration: boolean;
  retrievalQueryGeneration: boolean;
  webSearchQueryGeneration: boolean;
  queryGenerationPrompt: string;
  autocompleteGeneration: boolean;
  imagePromptGenerationPrompt: string;
  toolsFunctionCallingPrompt: string;
  banners: Array<{ id: string; type: string; text: string; enabled: boolean }>;
  promptSuggestions: Array<{ id: string; title: string; subtitle: string; prompt: string }>;
  showCustomModels: boolean; // Show custom models in model selector
}

// Connection type
interface Connection {
  id: string;
  name: string;
  type?: string;
  url: string;
  enabled: boolean;
  isGroup?: boolean;
  hasLayer?: boolean;
  apiKey?: string;
}

// Model type
interface Model {
  id: string;
  name: string;
  color: string;
  description: string;
  connection: string;
  isEnabled?: boolean; // Whether model is active/visible (defaults to true)
}

// Plugin type
interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  parameters: Array<{ name: string; type: string; value: string; required: boolean }>;
}

// Tool permission levels
type ToolPermission = 'never' | 'ask' | 'always';

// Tool with permission settings
interface MCPTool {
  name: string;
  description: string;
  permission: ToolPermission;
}

// MCP Connector type
interface MCPConnector {
  id: string;
  name: string;
  type: string;
  url: string;
  auth: string;
  authToken: string;
  mcpId: string;
  description: string;
  visibility: 'private' | 'public';
  groups: string[];
  enabled: boolean;
  // Tool-related fields
  tools?: MCPTool[];
  lastTested?: string;
  connectionStatus?: 'unknown' | 'connected' | 'failed';
}


// Documents Settings
interface DocumentsSettings {
  contentExtractionEngine: string;
  pdfExtractImages: boolean;
  bypassEmbedding: boolean;
  textSplitter: string;
  chunkSize: string;
  chunkOverlap: string;
  embeddingModelEngine: string;
  embeddingModel: string;
  fullContextMode: boolean;
  hybridSearch: boolean;
  rerankingEngine: string;
  rerankingModel: string;
  topKReranker: string;
  relevanceThreshold: string;
  bm25Weight: number[];
  ragTemplate: string;
}

// Web Search Settings
interface WebSearchSettings {
  webSearchEnabled: boolean;
  searchEngine: string;
  enableQuerySuggestions: boolean;
  enableWebLoader: boolean;
  resultCount: string;
  searxngUrl: string;
  serpApiKey: string;
  googleSearchApiKey: string;
  googleSearchEngineId: string;
  braveSearchApiKey: string;
  serperApiKey: string;
  serplyApiKey: string;
  tavityApiKey: string;
  searchapiApiKey: string;
}

// Audio Settings
interface AudioSettings {
  voiceInputEnabled: boolean;
  textToSpeechEnabled: boolean;
  voiceModel: string;
}

// Image Provider Types
export type ImageProviderType = 'openai' | 'stability' | 'comfyui' | 'automatic1111' | 'sora' | 'midjourney' | 'replicate' | 'custom';

export interface ImageProvider {
  id: string;
  name: string;
  type: ImageProviderType;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  isDefault: boolean;
  // Provider-specific settings
  settings: {
    model?: string;
    size?: string;
    quality?: string;
    style?: string;
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    workflow?: string; // For ComfyUI
    negativePrompt?: string;
  };
  // BYOK settings
  allowUserKeys: boolean;
  requiresAuth: boolean;
}

// Images Settings
interface ImagesSettings {
  imageGenerationEnabled: boolean;
  defaultProvider: string;
  providers: ImageProvider[];
  // Global settings
  maxImagesPerRequest: number;
  allowNsfw: boolean;
  defaultSize: string;
  defaultQuality: string;
}

// Code Execution Settings
interface CodeExecutionSettings {
  codeExecutionEnabled: boolean;
}

// Combined Admin Settings
interface AdminSettings {
  general: GeneralSettings;
  interface: InterfaceSettings;
  connections: Connection[];
  models: Model[];
  plugins: Plugin[];
  mcpConnectors: MCPConnector[];
  documents: DocumentsSettings;
  webSearch: WebSearchSettings;
  audio: AudioSettings;
  images: ImagesSettings;
  codeExecution: CodeExecutionSettings;
}

// Default values
const defaultSettings: AdminSettings = {
  general: {
    adminEnabled: true,
    userRegistration: true,
    apiAccess: false,
  },
  interface: {
    localTaskModel: 'Current Model',
    externalTaskModel: 'Current Model',
    titleGeneration: true,
    titleGenerationPrompt: 'Leave empty to use the default prompt, or enter a custom prompt',
    followUpGeneration: false,
    tagsGeneration: false,
    retrievalQueryGeneration: false,
    webSearchQueryGeneration: false,
    queryGenerationPrompt: 'Leave empty to use the default prompt, or enter a custom prompt',
    autocompleteGeneration: false,
    imagePromptGenerationPrompt: 'Leave empty to use the default prompt, or enter a custom prompt',
    toolsFunctionCallingPrompt: 'Leave empty to use the default prompt, or enter a custom prompt',
    banners: [{ id: '1', type: 'Type', text: 'Test', enabled: true }],
    promptSuggestions: [{
      id: '1',
      title: 'Title (e.g. Tell me a fun fact)',
      subtitle: 'Subtitle (e.g. about the Roman Empire)',
      prompt: 'Prompt (e.g. Tell me a fun fact about the Roman Empire)'
    }],
    showCustomModels: true, // Show custom models in model selector by default
  },
  connections: [
    {
      id: '1',
      name: 'OpenAI API',
      type: 'OpenAI',
      url: 'https://chat.firebird.co.nz/lmstudio/v1',
      enabled: true,
      isGroup: false,
    },
    {
      id: '2',
      name: 'Anthropic API',
      url: 'https://api.anthropic.com/v1',
      enabled: false,
      isGroup: false,
    },
    {
      id: '3',
      name: 'Local Docker',
      url: 'http://host.docker.internal:9099',
      enabled: false,
      isGroup: false,
      hasLayer: true,
    },
    {
      id: '4',
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1',
      enabled: false,
      isGroup: false,
    },
  ],
  models: [
    // Empty by default - add models from your LM server via Admin > Connections > Fetch > Add to Models
  ],
  plugins: [
    { id: 'web-search', name: 'Web Search', description: 'Search the web for real-time information', enabled: false, parameters: [{ name: 'api_key', type: 'string', value: '', required: true }, { name: 'max_results', type: 'number', value: '10', required: false }] },
    { id: 'code-interpreter', name: 'Code Interpreter', description: 'Execute Python code and analyze data', enabled: true, parameters: [{ name: 'timeout', type: 'number', value: '30', required: false }] },
    { id: 'file-management', name: 'Supreme File Management', description: 'Advanced file operations and management', enabled: false, parameters: [] },
    { id: 'weather-forecast', name: 'Weather Forecast', description: 'Get weather forecasts and conditions', enabled: false, parameters: [{ name: 'api_key', type: 'string', value: '', required: true }, { name: 'units', type: 'string', value: 'metric', required: false }] },
    { id: 'echo-mcp', name: 'EchoMCP', description: 'Model Context Protocol integration', enabled: true, parameters: [] },
  ],
  mcpConnectors: [
    {
      id: '1',
      name: 'EchoMCP',
      type: 'MCP Streamable HTTP',
      url: 'https://echo.firebird.co.nz',
      auth: 'Bearer',
      authToken: '••••••••••••••••••••',
      mcpId: 'EchoMCP',
      description: 'Echo MCP Connector',
      visibility: 'private',
      groups: [],
      enabled: true,
    },
  ],
  documents: {
    contentExtractionEngine: 'Default',
    pdfExtractImages: false,
    bypassEmbedding: false,
    textSplitter: 'RecursiveCharacter',
    chunkSize: '1500',
    chunkOverlap: '100',
    embeddingModelEngine: 'Default',
    embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
    fullContextMode: false,
    hybridSearch: true,
    rerankingEngine: 'Default',
    rerankingModel: 'ms-marco-TinyBERT-L-2-v2',
    topKReranker: '5',
    relevanceThreshold: '0',
    bm25Weight: [0.5],
    ragTemplate: 'Use the following context to answer the question:\n\nContext: {{CONTEXT}}\n\nQuestion: {{QUERY}}',
  },
  webSearch: {
    webSearchEnabled: true,
    searchEngine: 'google',
    enableQuerySuggestions: true,
    enableWebLoader: false,
    resultCount: '5',
    searxngUrl: '',
    serpApiKey: '',
    googleSearchApiKey: '',
    googleSearchEngineId: '',
    braveSearchApiKey: '',
    serperApiKey: '',
    serplyApiKey: '',
    tavityApiKey: '',
    searchapiApiKey: '',
  },
  audio: {
    voiceInputEnabled: true,
    textToSpeechEnabled: true,
    voiceModel: 'alloy',
  },
  images: {
    imageGenerationEnabled: true,
    defaultProvider: 'openai',
    maxImagesPerRequest: 4,
    allowNsfw: false,
    defaultSize: '1024x1024',
    defaultQuality: 'standard',
    providers: [
      {
        id: 'openai',
        name: 'OpenAI DALL-E',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        enabled: true,
        isDefault: true,
        settings: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
        },
        allowUserKeys: true,
        requiresAuth: true,
      },
      {
        id: 'stability',
        name: 'Stability AI',
        type: 'stability',
        baseUrl: 'https://api.stability.ai/v1',
        enabled: false,
        isDefault: false,
        settings: {
          model: 'stable-diffusion-xl-1024-v1-0',
          size: '1024x1024',
          steps: 30,
          cfgScale: 7,
        },
        allowUserKeys: true,
        requiresAuth: true,
      },
      {
        id: 'comfyui',
        name: 'ComfyUI (Local)',
        type: 'comfyui',
        baseUrl: 'http://localhost:8188',
        enabled: false,
        isDefault: false,
        settings: {
          workflow: 'default',
          steps: 20,
          cfgScale: 7,
          sampler: 'euler',
        },
        allowUserKeys: false,
        requiresAuth: false,
      },
      {
        id: 'automatic1111',
        name: 'Automatic1111 (Local)',
        type: 'automatic1111',
        baseUrl: 'http://localhost:7860',
        enabled: false,
        isDefault: false,
        settings: {
          model: 'v1-5-pruned-emaonly',
          size: '512x512',
          steps: 20,
          cfgScale: 7,
          sampler: 'Euler a',
        },
        allowUserKeys: false,
        requiresAuth: false,
      },
      {
        id: 'sora',
        name: 'OpenAI Sora',
        type: 'sora',
        baseUrl: 'https://api.openai.com/v1',
        enabled: false,
        isDefault: false,
        settings: {
          model: 'sora',
          quality: 'standard',
        },
        allowUserKeys: true,
        requiresAuth: true,
      },
      {
        id: 'replicate',
        name: 'Replicate',
        type: 'replicate',
        baseUrl: 'https://api.replicate.com/v1',
        enabled: false,
        isDefault: false,
        settings: {
          model: 'stability-ai/sdxl',
        },
        allowUserKeys: true,
        requiresAuth: true,
      },
    ],
  },
  codeExecution: {
    codeExecutionEnabled: false,
  },
};

const STORAGE_KEY = 'aimate-admin-settings';

interface AdminSettingsContextType {
  settings: AdminSettings;
  updateGeneral: (updates: Partial<GeneralSettings>) => void;
  updateInterface: (updates: Partial<InterfaceSettings>) => void;
  updateConnections: (connections: Connection[]) => void;
  updateModels: (models: Model[]) => void;
  updatePlugins: (plugins: Plugin[]) => void;
  updateMCPConnectors: (connectors: MCPConnector[]) => void;
  updateDocuments: (updates: Partial<DocumentsSettings>) => void;
  updateWebSearch: (updates: Partial<WebSearchSettings>) => void;
  updateAudio: (updates: Partial<AudioSettings>) => void;
  updateImages: (updates: Partial<ImagesSettings>) => void;
  updateImageProviders: (providers: ImageProvider[]) => void;
  updateImageProvider: (providerId: string, updates: Partial<ImageProvider>) => void;
  updateCodeExecution: (updates: Partial<CodeExecutionSettings>) => void;
  resetSettings: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle any new fields
        return {
          ...defaultSettings,
          ...parsed,
          general: { ...defaultSettings.general, ...parsed.general },
          interface: { ...defaultSettings.interface, ...parsed.interface },
          documents: { ...defaultSettings.documents, ...parsed.documents },
          webSearch: { ...defaultSettings.webSearch, ...parsed.webSearch },
          audio: { ...defaultSettings.audio, ...parsed.audio },
          images: { ...defaultSettings.images, ...parsed.images },
          codeExecution: { ...defaultSettings.codeExecution, ...parsed.codeExecution },
        };
      }
    } catch (e) {
      console.error('Failed to load admin settings:', e);
    }
    return defaultSettings;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save admin settings:', e);
    }
  }, [settings]);

  const updateGeneral = useCallback((updates: Partial<GeneralSettings>) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, ...updates },
    }));
  }, []);

  const updateInterface = useCallback((updates: Partial<InterfaceSettings>) => {
    setSettings(prev => ({
      ...prev,
      interface: { ...prev.interface, ...updates },
    }));
  }, []);

  const updateConnections = useCallback((connections: Connection[]) => {
    setSettings(prev => ({
      ...prev,
      connections,
    }));
  }, []);

  const updateModels = useCallback((models: Model[]) => {
    setSettings(prev => ({
      ...prev,
      models,
    }));
  }, []);

  const updatePlugins = useCallback((plugins: Plugin[]) => {
    setSettings(prev => ({
      ...prev,
      plugins,
    }));
  }, []);

  const updateMCPConnectors = useCallback((mcpConnectors: MCPConnector[]) => {
    setSettings(prev => ({
      ...prev,
      mcpConnectors,
    }));
  }, []);

  const updateDocuments = useCallback((updates: Partial<DocumentsSettings>) => {
    setSettings(prev => ({
      ...prev,
      documents: { ...prev.documents, ...updates },
    }));
  }, []);

  const updateWebSearch = useCallback((updates: Partial<WebSearchSettings>) => {
    setSettings(prev => ({
      ...prev,
      webSearch: { ...prev.webSearch, ...updates },
    }));
  }, []);

  const updateAudio = useCallback((updates: Partial<AudioSettings>) => {
    setSettings(prev => ({
      ...prev,
      audio: { ...prev.audio, ...updates },
    }));
  }, []);

  const updateImages = useCallback((updates: Partial<ImagesSettings>) => {
    setSettings(prev => ({
      ...prev,
      images: { ...prev.images, ...updates },
    }));
  }, []);

  const updateImageProviders = useCallback((providers: ImageProvider[]) => {
    setSettings(prev => ({
      ...prev,
      images: { ...prev.images, providers },
    }));
  }, []);

  const updateImageProvider = useCallback((providerId: string, updates: Partial<ImageProvider>) => {
    setSettings(prev => ({
      ...prev,
      images: {
        ...prev.images,
        providers: prev.images.providers.map(p =>
          p.id === providerId ? { ...p, ...updates } : p
        ),
      },
    }));
  }, []);

  const updateCodeExecution = useCallback((updates: Partial<CodeExecutionSettings>) => {
    setSettings(prev => ({
      ...prev,
      codeExecution: { ...prev.codeExecution, ...updates },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        updateGeneral,
        updateInterface,
        updateConnections,
        updateModels,
        updatePlugins,
        updateMCPConnectors,
        updateDocuments,
        updateWebSearch,
        updateAudio,
        updateImages,
        updateImageProviders,
        updateImageProvider,
        updateCodeExecution,
        resetSettings,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}

// Export types for use in components
export type {
  AdminSettings,
  GeneralSettings,
  InterfaceSettings,
  Connection,
  Model,
  Plugin,
  MCPConnector,
  MCPTool,
  ToolPermission,
  DocumentsSettings,
  WebSearchSettings,
  AudioSettings,
  ImagesSettings,
  CodeExecutionSettings,
};
