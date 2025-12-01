/**
 * Plugin System Hook
 *
 * Provides a plugin architecture for extending aiMate functionality.
 * Plugins can intercept request/response cycles, modify messages, and add UI actions.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAdminSettings } from '../context/AdminSettingsContext';

// ============================================================================
// TYPES
// ============================================================================

export type PluginHookPoint =
  | 'beforeRequest'    // Before message is sent to LM
  | 'afterResponse'    // After response received from LM
  | 'messageRender'    // When rendering a message
  | 'inputRender'      // When rendering chat input
  | 'sidebarRender';   // When rendering sidebar

export interface PluginAction {
  id: string;
  label: string;
  icon?: string;
  onClick: (context: PluginContext) => void | Promise<void>;
  condition?: (context: PluginContext) => boolean;
}

export interface PluginContext {
  messageId?: string;
  messageContent?: string;
  messageRole?: 'user' | 'assistant' | 'system';
  conversationId?: string;
  workspaceId?: string;
  [key: string]: any;
}

export interface PluginMessageActions {
  pluginId: string;
  actions: PluginAction[];
}

export interface PluginHook<T = any, R = T> {
  pluginId: string;
  priority: number;  // Lower = runs first
  handler: (input: T, context: PluginContext) => R | Promise<R>;
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;

  // Hook registrations
  hooks?: {
    beforeRequest?: Array<(request: any, ctx: PluginContext) => any | Promise<any>>;
    afterResponse?: Array<(response: any, ctx: PluginContext) => any | Promise<any>>;
    messageRender?: Array<(message: any, ctx: PluginContext) => PluginAction[]>;
  };

  // Message actions this plugin provides
  messageActions?: PluginAction[];

  // Plugin settings/configuration
  settings?: Record<string, any>;
}

// ============================================================================
// BUILT-IN PLUGINS
// ============================================================================

const messageActionsPlugin: PluginDefinition = {
  id: 'message-actions',
  name: 'Message Actions',
  version: '1.0.0',
  description: 'Core message actions like copy, regenerate, and feedback',
  author: 'aiMate',
  enabled: true,
  messageActions: [
    {
      id: 'copy',
      label: 'Copy',
      icon: 'Copy',
      onClick: async (ctx) => {
        if (ctx.messageContent) {
          await navigator.clipboard.writeText(ctx.messageContent);
        }
      },
    },
    {
      id: 'feedback-good',
      label: 'Good response',
      icon: 'ThumbsUp',
      onClick: (ctx) => {
        console.log('[Plugin] Feedback: good', ctx.messageId);
        // In a real implementation, this would send feedback to the server
      },
      condition: (ctx) => ctx.messageRole === 'assistant',
    },
    {
      id: 'feedback-bad',
      label: 'Bad response',
      icon: 'ThumbsDown',
      onClick: (ctx) => {
        console.log('[Plugin] Feedback: bad', ctx.messageId);
        // In a real implementation, this would send feedback to the server
      },
      condition: (ctx) => ctx.messageRole === 'assistant',
    },
    {
      id: 'regenerate',
      label: 'Regenerate',
      icon: 'RefreshCw',
      onClick: (ctx) => {
        console.log('[Plugin] Regenerate', ctx.messageId);
        // This would trigger regeneration - handled by parent component
        if (ctx.onRegenerate) ctx.onRegenerate();
      },
      condition: (ctx) => ctx.messageRole === 'assistant' && !!ctx.onRegenerate,
    },
    {
      id: 'continue',
      label: 'Continue',
      icon: 'ArrowRight',
      onClick: (ctx) => {
        console.log('[Plugin] Continue', ctx.messageId);
        // This would trigger continue - handled by parent component
        if (ctx.onContinue) ctx.onContinue();
      },
      condition: (ctx) => ctx.messageRole === 'assistant' && !!ctx.onContinue,
    },
  ],
};

const codeHighlightPlugin: PluginDefinition = {
  id: 'code-highlight',
  name: 'Code Highlighting',
  version: '1.0.0',
  description: 'Syntax highlighting for code blocks in messages',
  author: 'aiMate',
  enabled: true,
  messageActions: [
    {
      id: 'copy-code',
      label: 'Copy code',
      icon: 'Clipboard',
      onClick: async (ctx) => {
        if (ctx.codeContent) {
          await navigator.clipboard.writeText(ctx.codeContent);
        }
      },
      condition: (ctx) => !!ctx.codeContent,
    },
  ],
};

const textToSpeechPlugin: PluginDefinition = {
  id: 'text-to-speech',
  name: 'Text to Speech',
  version: '1.0.0',
  description: 'Read messages aloud using browser speech synthesis',
  author: 'aiMate',
  enabled: true,
  settings: {
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
  },
  messageActions: [
    {
      id: 'speak',
      label: 'Read aloud',
      icon: 'Volume2',
      onClick: (ctx) => {
        if (ctx.messageContent && 'speechSynthesis' in window) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(ctx.messageContent);
          utterance.rate = ctx.settings?.rate || 1.0;
          utterance.pitch = ctx.settings?.pitch || 1.0;

          // Try to find a good voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') && v.name.includes('Natural')
          ) || voices.find(v => v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          window.speechSynthesis.speak(utterance);
        }
      },
    },
    {
      id: 'stop-speech',
      label: 'Stop reading',
      icon: 'VolumeX',
      onClick: () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      },
      condition: () => 'speechSynthesis' in window,
    },
  ],
};

const exportPlugin: PluginDefinition = {
  id: 'export',
  name: 'Export',
  version: '1.0.0',
  description: 'Export messages in various formats',
  author: 'aiMate',
  enabled: true,
  messageActions: [
    {
      id: 'export-markdown',
      label: 'Copy as Markdown',
      icon: 'FileText',
      onClick: async (ctx) => {
        if (ctx.messageContent) {
          const markdown = `**${ctx.messageRole === 'user' ? 'You' : 'Assistant'}:**\n\n${ctx.messageContent}`;
          await navigator.clipboard.writeText(markdown);
        }
      },
    },
    {
      id: 'share',
      label: 'Share',
      icon: 'Share2',
      onClick: async (ctx) => {
        if (ctx.messageContent && navigator.share) {
          try {
            await navigator.share({
              title: 'aiMate Conversation',
              text: ctx.messageContent,
            });
          } catch (err) {
            // User cancelled or share failed
            console.log('[Export Plugin] Share cancelled or failed');
          }
        } else if (ctx.messageContent) {
          // Fallback: copy link
          await navigator.clipboard.writeText(ctx.messageContent);
        }
      },
      condition: () => typeof navigator.share === 'function' || true, // Always show, with fallback
    },
  ],
};

const translationPlugin: PluginDefinition = {
  id: 'translation',
  name: 'Translation',
  version: '1.0.0',
  description: 'Translate messages to different languages (coming soon)',
  author: 'aiMate',
  enabled: false, // Disabled by default - needs API key
  settings: {
    targetLanguage: 'es',
    apiKey: '',
  },
  messageActions: [
    {
      id: 'translate',
      label: 'Translate',
      icon: 'Languages',
      onClick: (ctx) => {
        // This would call a translation API
        console.log('[Translation Plugin] Would translate:', ctx.messageContent);
        // In a real implementation:
        // const translated = await translateAPI(ctx.messageContent, ctx.settings.targetLanguage);
      },
    },
  ],
};

const searchPlugin: PluginDefinition = {
  id: 'web-search',
  name: 'Web Search',
  version: '1.0.0',
  description: 'Search the web for information related to messages',
  author: 'aiMate',
  enabled: false, // Disabled by default
  settings: {
    searchEngine: 'google',
    maxResults: 5,
  },
  messageActions: [
    {
      id: 'search-web',
      label: 'Search web',
      icon: 'Search',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          // Extract key terms and open search
          const query = encodeURIComponent(ctx.messageContent.slice(0, 200));
          window.open(`https://www.google.com/search?q=${query}`, '_blank');
        }
      },
    },
  ],
  hooks: {
    // Could inject search results into context before request
    beforeRequest: [
      async (request, ctx) => {
        // In a real implementation, this would:
        // 1. Extract search query from user message
        // 2. Call search API
        // 3. Inject results into system context
        return request;
      },
    ],
  },
};

const bookmarkPlugin: PluginDefinition = {
  id: 'bookmarks',
  name: 'Bookmarks',
  version: '1.0.0',
  description: 'Save important messages for later reference',
  author: 'aiMate',
  enabled: true,
  messageActions: [
    {
      id: 'bookmark',
      label: 'Save to Knowledge',
      icon: 'Brain',
      onClick: (ctx) => {
        // This would save to the knowledge base
        console.log('[Bookmark Plugin] Saving to knowledge:', ctx.messageId);
        // In a real implementation, this would call the knowledge service
        if (ctx.onSaveToKnowledge) {
          ctx.onSaveToKnowledge(ctx.messageContent);
        }
      },
      condition: (ctx) => ctx.messageRole === 'assistant',
    },
  ],
};

/**
 * Structured Content Plugin
 *
 * Parses and processes structured content blocks in AI responses.
 * Supports: tables, key-value lists, cards, charts, code blocks, file trees.
 *
 * Format: ```structuredcontent { ... } ```
 */
const structuredContentPlugin: PluginDefinition = {
  id: 'structured-content',
  name: 'Structured Content',
  version: '1.0.0',
  description: 'Parse and render rich structured content from AI responses (tables, cards, charts)',
  author: 'aiMate',
  enabled: true,
  settings: {
    enabledTypes: ['table', 'keyValueList', 'card', 'chart', 'codeBlock', 'fileTree'],
    defaultTemplate: 'default',
    maxDataRows: 1000,
  },
  hooks: {
    // Process responses to detect and parse structured content
    afterResponse: [
      (response, ctx) => {
        if (!response?.content) return response;

        // Look for structured content blocks
        const structuredContentPattern = /```structuredcontent\s*([\s\S]*?)```/g;
        let match;
        const structuredBlocks: any[] = [];

        while ((match = structuredContentPattern.exec(response.content)) !== null) {
          try {
            const parsed = JSON.parse(match[1].trim());

            // Validate basic structure
            if (parsed.type && parsed.data) {
              structuredBlocks.push({
                raw: match[0],
                parsed,
                startIndex: match.index,
                endIndex: match.index + match[0].length,
              });
            }
          } catch (err) {
            console.warn('[Structured Content Plugin] Failed to parse block:', err);
          }
        }

        // Add metadata to response for rendering
        if (structuredBlocks.length > 0) {
          return {
            ...response,
            structuredContent: structuredBlocks,
            hasStructuredContent: true,
          };
        }

        return response;
      },
    ],
  },
  messageActions: [
    {
      id: 'export-structured',
      label: 'Export Data',
      icon: 'Download',
      onClick: async (ctx) => {
        if (ctx.structuredContent) {
          // Export first structured content block as JSON
          const data = ctx.structuredContent[0]?.parsed?.data;
          if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      },
      condition: (ctx) => ctx.hasStructuredContent === true,
    },
    {
      id: 'export-csv',
      label: 'Export as CSV',
      icon: 'FileSpreadsheet',
      onClick: async (ctx) => {
        if (ctx.structuredContent) {
          const content = ctx.structuredContent[0]?.parsed;
          if (content?.type === 'table' && Array.isArray(content.data)) {
            // Convert table data to CSV
            const columns = content.schema?.columns || [];
            const headers = columns.map((c: any) => c.label || c.key).join(',');
            const rows = content.data.map((row: any) =>
              columns.map((c: any) => {
                const val = row[c.key];
                // Escape commas and quotes
                const str = String(val ?? '');
                return str.includes(',') || str.includes('"')
                  ? `"${str.replace(/"/g, '""')}"`
                  : str;
              }).join(',')
            );

            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      },
      condition: (ctx) =>
        ctx.hasStructuredContent === true &&
        ctx.structuredContent?.[0]?.parsed?.type === 'table',
    },
    {
      id: 'view-raw',
      label: 'View Raw JSON',
      icon: 'Code',
      onClick: (ctx) => {
        if (ctx.structuredContent) {
          const json = JSON.stringify(ctx.structuredContent[0]?.parsed, null, 2);
          navigator.clipboard.writeText(json);
          console.log('[Structured Content] Raw JSON:', json);
        }
      },
      condition: (ctx) => ctx.hasStructuredContent === true,
    },
  ],
};

// All built-in plugins
const BUILTIN_PLUGINS: PluginDefinition[] = [
  messageActionsPlugin,
  codeHighlightPlugin,
  textToSpeechPlugin,
  exportPlugin,
  bookmarkPlugin,
  structuredContentPlugin,
  translationPlugin,  // Disabled by default
  searchPlugin,       // Disabled by default
];

// ============================================================================
// HOOK
// ============================================================================

export function usePlugins() {
  const { settings } = useAdminSettings();

  // Merge built-in plugins with user-configured plugins from settings
  const [plugins, setPlugins] = useState<PluginDefinition[]>(() => {
    const builtins = [...BUILTIN_PLUGINS];
    // In the future, load custom plugins from settings.plugins
    return builtins;
  });

  // Get all enabled plugins
  const enabledPlugins = useMemo(() => {
    return plugins.filter(p => p.enabled);
  }, [plugins]);

  // ============================================================================
  // PLUGIN MANAGEMENT
  // ============================================================================

  const enablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, enabled: true } : p
    ));
  }, []);

  const disablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, enabled: false } : p
    ));
  }, []);

  const updatePluginSettings = useCallback((pluginId: string, settings: Record<string, any>) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, settings: { ...p.settings, ...settings } } : p
    ));
  }, []);

  // ============================================================================
  // HOOK EXECUTION
  // ============================================================================

  /**
   * Run all beforeRequest hooks in sequence
   */
  const runBeforeRequest = useCallback(async (request: any, context: PluginContext) => {
    let result = request;

    for (const plugin of enabledPlugins) {
      if (plugin.hooks?.beforeRequest) {
        for (const handler of plugin.hooks.beforeRequest) {
          try {
            result = await handler(result, context);
          } catch (err) {
            console.error(`[Plugin ${plugin.id}] beforeRequest error:`, err);
          }
        }
      }
    }

    return result;
  }, [enabledPlugins]);

  /**
   * Run all afterResponse hooks in sequence
   */
  const runAfterResponse = useCallback(async (response: any, context: PluginContext) => {
    let result = response;

    for (const plugin of enabledPlugins) {
      if (plugin.hooks?.afterResponse) {
        for (const handler of plugin.hooks.afterResponse) {
          try {
            result = await handler(result, context);
          } catch (err) {
            console.error(`[Plugin ${plugin.id}] afterResponse error:`, err);
          }
        }
      }
    }

    return result;
  }, [enabledPlugins]);

  // ============================================================================
  // MESSAGE ACTIONS
  // ============================================================================

  /**
   * Get all message actions for a given context
   */
  const getMessageActions = useCallback((context: PluginContext): PluginAction[] => {
    const actions: PluginAction[] = [];

    for (const plugin of enabledPlugins) {
      if (plugin.messageActions) {
        for (const action of plugin.messageActions) {
          // Check if action should be shown based on condition
          if (!action.condition || action.condition(context)) {
            actions.push({
              ...action,
              id: `${plugin.id}:${action.id}`,
            });
          }
        }
      }

      // Also check messageRender hooks
      if (plugin.hooks?.messageRender) {
        for (const handler of plugin.hooks.messageRender) {
          try {
            const hookActions = handler(context, context);
            actions.push(...hookActions.map(a => ({
              ...a,
              id: `${plugin.id}:${a.id}`,
            })));
          } catch (err) {
            console.error(`[Plugin ${plugin.id}] messageRender error:`, err);
          }
        }
      }
    }

    return actions;
  }, [enabledPlugins]);

  /**
   * Execute a message action
   */
  const executeAction = useCallback(async (actionId: string, context: PluginContext) => {
    const [pluginId, ...actionIdParts] = actionId.split(':');
    const actualActionId = actionIdParts.join(':');

    const plugin = enabledPlugins.find(p => p.id === pluginId);
    if (!plugin) {
      console.warn(`[Plugins] Plugin not found: ${pluginId}`);
      return;
    }

    const action = plugin.messageActions?.find(a => a.id === actualActionId);
    if (!action) {
      console.warn(`[Plugins] Action not found: ${actionId}`);
      return;
    }

    try {
      await action.onClick(context);
    } catch (err) {
      console.error(`[Plugin ${pluginId}] Action error:`, err);
    }
  }, [enabledPlugins]);

  return {
    // State
    plugins,
    enabledPlugins,

    // Plugin management
    enablePlugin,
    disablePlugin,
    updatePluginSettings,

    // Hook execution
    runBeforeRequest,
    runAfterResponse,

    // Message actions
    getMessageActions,
    executeAction,
  };
}

export default usePlugins;
