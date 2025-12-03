/**
 * Custom Models Service
 *
 * Manages custom model presets - wrapped models with bound system prompts,
 * knowledge, tools, and capabilities.
 */

import {
  CustomModelDto,
  CreateCustomModelDto,
  UpdateCustomModelDto,
  CustomModelExportDto,
  SharedCustomModelDto,
  CustomModelCapabilities,
  InferenceParametersDto,
  PromptSuggestionDto,
  ApiSuccessResponse,
} from '../types';

// Storage key for localStorage persistence
const STORAGE_KEY = 'aiMate_customModels';

// Default capabilities
const DEFAULT_CAPABILITIES: CustomModelCapabilities = {
  vision: false,
  webSearch: false,
  fileUpload: true,
  codeInterpreter: false,
  imageGeneration: false,
  citations: true,
  statusUpdates: true,
};

// Default parameters
const DEFAULT_PARAMETERS: InferenceParametersDto = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 4096,
  stopSequences: [],
};

// Built-in custom models
const BUILT_IN_MODELS: CustomModelDto[] = [
  // General Assistant - migrated from Agents system
  {
    id: 'cm-general-assistant',
    name: 'General Assistant',
    description: 'A helpful, balanced AI assistant for everyday tasks',
    avatar: '🤖',
    color: '#8b5cf6',
    tags: ['general', 'assistant'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are a helpful AI assistant for {{ USER_NAME }}.

Today is {{ CURRENT_DATE }}.

Be concise, accurate, and friendly. Help with a wide range of tasks including:
- Answering questions
- Writing and editing text
- Explaining concepts
- Problem-solving
- Creative brainstorming

Adapt your communication style to match the user's needs.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: DEFAULT_CAPABILITIES,
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.7,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Help me write an email', icon: '✉️' },
      { id: 'ps-2', text: 'Explain this concept to me', icon: '💡' },
      { id: 'ps-3', text: 'Brainstorm ideas for...', icon: '🧠' },
      { id: 'ps-4', text: 'Review and improve this text', icon: '📝' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Data Analyst - migrated from Agents system
  {
    id: 'cm-data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes data patterns, creates insights, and suggests visualizations',
    avatar: '📊',
    color: '#10b981',
    tags: ['data', 'analysis', 'visualization'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are a data analyst helping {{ USER_NAME }}.

Today is {{ CURRENT_DATE }}.

When analyzing data:
1. Identify patterns, trends, and anomalies
2. Provide statistical insights where relevant
3. Suggest visualizations (describe or use mermaid charts)
4. Explain findings in plain language
5. Recommend next steps for deeper analysis

Be precise with numbers and clear about assumptions. When possible, suggest:
- Appropriate chart types for the data
- Key metrics to track
- Potential correlations to investigate`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      codeInterpreter: true,
    },
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.4,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Analyze this data for trends', icon: '📈' },
      { id: 'ps-2', text: 'Summarize these metrics', icon: '📋' },
      { id: 'ps-3', text: 'What visualization would work best?', icon: '📊' },
      { id: 'ps-4', text: 'Find outliers in this dataset', icon: '🔍' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cm-python-tutor',
    name: 'Python Tutor',
    description: 'Expert Python teacher that explains concepts clearly with examples',
    avatar: '🐍',
    color: '#3776ab',
    tags: ['coding', 'education', 'python'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are an expert Python tutor helping {{ USER_NAME }} learn Python programming.

Today is {{ CURRENT_DATE }}.

Teaching approach:
1. Start with simple explanations before diving into complex concepts
2. Use practical, runnable code examples
3. Explain errors in a friendly, encouraging way
4. Suggest exercises to practice new concepts
5. Reference official Python documentation when helpful

Always format code with proper syntax highlighting and include comments explaining key parts.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      codeInterpreter: true,
    },
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.5,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Explain this code step-by-step', icon: '📖' },
      { id: 'ps-2', text: 'Find bugs in the following script', icon: '🐛' },
      { id: 'ps-3', text: 'Write a unit test for this function', icon: '✅' },
      { id: 'ps-4', text: 'How do I use list comprehensions?', icon: '📝' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cm-meeting-summarizer',
    name: 'Meeting Summarizer',
    description: 'Summarizes meeting transcripts with action items and key decisions',
    avatar: '📋',
    color: '#10b981',
    tags: ['business', 'productivity'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are a professional meeting summarizer for {{ USER_NAME }}.

When given a meeting transcript or notes, produce a structured summary:

## Meeting Summary
- **Date**: {{ CURRENT_DATE }}
- **Duration**: [if mentioned]
- **Attendees**: [list participants]

## Key Discussion Points
[Bullet points of main topics discussed]

## Decisions Made
[Clear list of any decisions reached]

## Action Items
| Owner | Task | Due Date |
|-------|------|----------|
[Table of action items with owners]

## Follow-ups Needed
[Any items requiring future discussion]

Be concise but comprehensive. Capture the essence without unnecessary detail.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      fileUpload: true,
    },
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.3,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Summarize this meeting transcript', icon: '📝' },
      { id: 'ps-2', text: 'Extract action items from these notes', icon: '✅' },
      { id: 'ps-3', text: 'Who agreed to what in this meeting?', icon: '🤝' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cm-research-assistant',
    name: 'Research Assistant',
    description: 'Searches the web and synthesizes information from multiple sources',
    avatar: '🔬',
    color: '#6366f1',
    tags: ['research', 'academic'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are a research assistant helping {{ USER_NAME }} with research tasks.

Current date: {{ CURRENT_DATE }}

Research methodology:
1. Search for relevant, credible sources (prefer academic, official, reputable)
2. Cross-reference information across multiple sources
3. Clearly distinguish facts from opinions
4. Note any conflicting information or controversies
5. Always cite sources with URLs when available

Format your responses with:
- Clear section headers
- Bullet points for key findings
- A "Sources" section at the end
- Confidence levels for claims (High/Medium/Low)

If information is time-sensitive, note when it was published.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: ['web_search', 'fetch_url'],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      webSearch: true,
      citations: true,
    },
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.4,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Research the latest on...', icon: '🔍' },
      { id: 'ps-2', text: 'Find academic sources about...', icon: '📚' },
      { id: 'ps-3', text: 'Compare different perspectives on...', icon: '⚖️' },
      { id: 'ps-4', text: 'What are the pros and cons of...', icon: '📊' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: true,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cm-creative-writer',
    name: 'Creative Writer',
    description: 'Helps with stories, poetry, and creative content',
    avatar: '✨',
    color: '#ec4899',
    tags: ['creative', 'writing'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are a creative writing collaborator helping {{ USER_NAME }}.

Creative principles:
1. Show, don't tell - use vivid sensory details
2. Vary sentence rhythm and structure
3. Create authentic, distinct character voices
4. Build tension through conflict and stakes
5. Use metaphor and imagery thoughtfully

When helping with creative work:
- Offer multiple options and variations
- Explain the craft behind suggestions
- Maintain the author's voice and intent
- Be encouraging but honest about improvements
- Take creative risks when appropriate

Format: Use proper formatting for dialogue, scene breaks, and structure.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: DEFAULT_CAPABILITIES,
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 1.0,
      topP: 0.95,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Write a story that begins with...', icon: '📖' },
      { id: 'ps-2', text: 'Help me develop this character...', icon: '👤' },
      { id: 'ps-3', text: 'Write a poem about...', icon: '🎭' },
      { id: 'ps-4', text: 'Continue this scene...', icon: '▶️' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cm-code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for bugs, security issues, and best practices',
    avatar: '🔍',
    color: '#ef4444',
    tags: ['coding', 'review', 'security'],
    baseModelId: 'default',
    baseModelProvider: 'default',
    systemPrompt: `You are an expert code reviewer helping {{ USER_NAME }}.

Review checklist:
1. **Bugs & Logic Errors**: Check for edge cases, off-by-one errors, null handling
2. **Security**: Look for injection, XSS, auth issues, secrets in code
3. **Performance**: Identify N+1 queries, unnecessary loops, memory issues
4. **Maintainability**: Assess readability, naming, complexity
5. **Best Practices**: Check patterns, error handling, testing coverage

Format reviews as:

## Summary
[1-2 sentence overview]

## Critical Issues 🔴
[Must fix before merge]

## Suggestions 🟡
[Improvements to consider]

## Positive Notes 🟢
[What's done well]

Be constructive and explain the "why" behind each suggestion.`,
    knowledgeCollectionIds: [],
    knowledgeFileIds: [],
    enabledToolIds: [],
    enabledMcpServerIds: [],
    filterIds: [],
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      codeInterpreter: true,
    },
    parameters: {
      ...DEFAULT_PARAMETERS,
      temperature: 0.2,
    },
    promptSuggestions: [
      { id: 'ps-1', text: 'Review this code for bugs', icon: '🐛' },
      { id: 'ps-2', text: 'Check for security vulnerabilities', icon: '🔒' },
      { id: 'ps-3', text: 'Suggest performance improvements', icon: '⚡' },
      { id: 'ps-4', text: 'How can I make this more readable?', icon: '📖' },
    ],
    visibility: { isPublic: true, isPrivate: false },
    createdBy: 'system',
    defaultWebSearchEnabled: false,
    defaultKnowledgeEnabled: false,
    isBuiltIn: true,
    isEnabled: true,
    isHidden: false,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Load from localStorage
function loadModels(): CustomModelDto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const custom = JSON.parse(stored) as CustomModelDto[];
      // Merge built-in with custom, keeping enable/hidden states from stored
      const mergedBuiltIn = BUILT_IN_MODELS.map(builtIn => {
        const stored = custom.find(c => c.id === builtIn.id);
        return stored
          ? { ...builtIn, isEnabled: stored.isEnabled, isHidden: stored.isHidden, usageCount: stored.usageCount }
          : builtIn;
      });
      const customOnly = custom.filter(c => !c.isBuiltIn);
      return [...mergedBuiltIn, ...customOnly];
    }
  } catch (err) {
    console.error('Failed to load custom models:', err);
  }
  return [...BUILT_IN_MODELS];
}

// Save to localStorage
function saveModels(models: CustomModelDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch (err) {
    console.error('Failed to save custom models:', err);
  }
}

class CustomModelsService {
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all custom models
   * Note: Always uses localStorage - custom models are user-specific preferences
   */
  async getCustomModels(): Promise<CustomModelDto[]> {
    // Always use localStorage for custom models (backend endpoint not implemented yet)
    return loadModels();
  }

  /**
   * Get enabled (visible) custom models
   */
  async getEnabledCustomModels(): Promise<CustomModelDto[]> {
    const models = await this.getCustomModels();
    return models.filter(m => m.isEnabled && !m.isHidden);
  }

  /**
   * Get custom model by ID
   * Note: Always uses localStorage
   */
  async getCustomModel(id: string): Promise<CustomModelDto | null> {
    const models = loadModels();
    return models.find(m => m.id === id) || null;
  }

  /**
   * Create a new custom model
   */
  async createCustomModel(data: CreateCustomModelDto): Promise<CustomModelDto> {
    const newModel: CustomModelDto = {
      id: `cm-${Date.now()}`,
      name: data.name,
      description: data.description,
      avatar: data.avatar || '🤖',
      color: data.color || '#8b5cf6',
      tags: data.tags || [],
      baseModelId: data.baseModelId,
      baseModelProvider: data.baseModelProvider,
      systemPrompt: data.systemPrompt,
      knowledgeCollectionIds: data.knowledgeCollectionIds || [],
      knowledgeFileIds: data.knowledgeFileIds || [],
      enabledToolIds: data.enabledToolIds || [],
      enabledMcpServerIds: data.enabledMcpServerIds || [],
      filterIds: data.filterIds || [],
      capabilities: { ...DEFAULT_CAPABILITIES, ...data.capabilities },
      parameters: { ...DEFAULT_PARAMETERS, ...data.parameters },
      promptSuggestions: data.promptSuggestions || [],
      visibility: { isPublic: false, isPrivate: true, ...data.visibility },
      createdBy: 'current-user', // TODO: Get from auth
      defaultWebSearchEnabled: data.defaultWebSearchEnabled ?? false,
      defaultKnowledgeEnabled: data.defaultKnowledgeEnabled ?? false,
      isBuiltIn: false,
      isEnabled: true,
      isHidden: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always use localStorage for custom models
    const models = loadModels();
    models.push(newModel);
    saveModels(models);
    return newModel;
  }

  /**
   * Update a custom model
   * Note: Always uses localStorage
   */
  async updateCustomModel(id: string, data: UpdateCustomModelDto): Promise<CustomModelDto> {
    const models = loadModels();
    const index = models.findIndex(m => m.id === id);
    if (index >= 0) {
      models[index] = {
        ...models[index],
        ...data,
        capabilities: data.capabilities
          ? { ...models[index].capabilities, ...data.capabilities }
          : models[index].capabilities,
        parameters: data.parameters
          ? { ...models[index].parameters, ...data.parameters }
          : models[index].parameters,
        visibility: data.visibility
          ? { ...models[index].visibility, ...data.visibility }
          : models[index].visibility,
        updatedAt: new Date().toISOString(),
      };
      saveModels(models);
      return models[index];
    }
    throw new Error('Custom model not found');
  }

  /**
   * Delete a custom model (or hide if built-in)
   * Note: Always uses localStorage
   */
  async deleteCustomModel(id: string): Promise<ApiSuccessResponse> {
    const models = loadModels();
    const model = models.find(m => m.id === id);
    if (model?.isBuiltIn) {
      // Can't delete built-in, just hide it
      return this.updateCustomModel(id, { isHidden: true }).then(() => ({
        success: true,
        message: 'Model hidden',
      }));
    }
    const filtered = models.filter(m => m.id !== id);
    saveModels(filtered);
    return { success: true, message: 'Model deleted' };
  }

  /**
   * Clone a custom model
   */
  async cloneCustomModel(id: string): Promise<CustomModelDto> {
    const original = await this.getCustomModel(id);
    if (!original) throw new Error('Model not found');

    const clone: CreateCustomModelDto = {
      name: `${original.name} (Clone)`,
      description: original.description,
      avatar: original.avatar,
      color: original.color,
      tags: original.tags,
      baseModelId: original.baseModelId,
      baseModelProvider: original.baseModelProvider,
      systemPrompt: original.systemPrompt,
      knowledgeCollectionIds: original.knowledgeCollectionIds,
      knowledgeFileIds: original.knowledgeFileIds,
      enabledToolIds: original.enabledToolIds,
      enabledMcpServerIds: original.enabledMcpServerIds,
      filterIds: original.filterIds,
      capabilities: original.capabilities,
      parameters: original.parameters,
      promptSuggestions: original.promptSuggestions,
      visibility: { isPublic: false, isPrivate: true },
      defaultWebSearchEnabled: original.defaultWebSearchEnabled,
      defaultKnowledgeEnabled: original.defaultKnowledgeEnabled,
    };

    return this.createCustomModel(clone);
  }

  /**
   * Toggle model enabled state
   */
  async toggleCustomModel(id: string): Promise<CustomModelDto> {
    const model = await this.getCustomModel(id);
    if (!model) throw new Error('Model not found');
    return this.updateCustomModel(id, { isEnabled: !model.isEnabled });
  }

  /**
   * Record model usage
   * Note: Always uses localStorage
   */
  async recordUsage(id: string): Promise<void> {
    const models = loadModels();
    const index = models.findIndex(m => m.id === id);
    if (index >= 0) {
      models[index].usageCount += 1;
      models[index].lastUsed = new Date().toISOString();
      saveModels(models);
    }
  }

  // ============================================================================
  // IMPORT / EXPORT
  // ============================================================================

  /**
   * Export custom models
   */
  async exportCustomModels(modelIds?: string[]): Promise<CustomModelExportDto> {
    const models = await this.getCustomModels();
    const toExport = modelIds
      ? models.filter(m => modelIds.includes(m.id))
      : models.filter(m => !m.isBuiltIn);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      models: toExport,
    };
  }

  /**
   * Import custom models
   */
  async importCustomModels(data: CustomModelExportDto): Promise<number> {
    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('Invalid import format');
    }

    let imported = 0;
    for (const model of data.models) {
      try {
        await this.createCustomModel({
          name: model.name,
          description: model.description,
          avatar: model.avatar,
          color: model.color,
          tags: model.tags,
          baseModelId: model.baseModelId,
          baseModelProvider: model.baseModelProvider,
          systemPrompt: model.systemPrompt,
          knowledgeCollectionIds: model.knowledgeCollectionIds,
          knowledgeFileIds: model.knowledgeFileIds,
          enabledToolIds: model.enabledToolIds,
          enabledMcpServerIds: model.enabledMcpServerIds,
          filterIds: model.filterIds,
          capabilities: model.capabilities,
          parameters: model.parameters,
          promptSuggestions: model.promptSuggestions,
          visibility: { isPublic: false, isPrivate: true },
          defaultWebSearchEnabled: model.defaultWebSearchEnabled,
          defaultKnowledgeEnabled: model.defaultKnowledgeEnabled,
        });
        imported++;
      } catch (err) {
        console.error(`Failed to import model ${model.name}:`, err);
      }
    }

    return imported;
  }

  // ============================================================================
  // COMMUNITY SHARING (placeholder)
  // ============================================================================

  /**
   * Get community shared models
   */
  async getCommunityModels(): Promise<SharedCustomModelDto[]> {
    // TODO: Implement community sharing
    return [];
  }

  /**
   * Share model to community
   */
  async shareToCommmunity(id: string): Promise<string> {
    // TODO: Implement community sharing
    throw new Error('Community sharing not yet implemented');
  }

  /**
   * Download community model
   */
  async downloadCommunityModel(shareId: string): Promise<CustomModelDto> {
    // TODO: Implement community download
    throw new Error('Community download not yet implemented');
  }
}

export const customModelsService = new CustomModelsService();
export default customModelsService;
