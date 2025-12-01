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

// All built-in plugins
const BUILTIN_PLUGINS: PluginDefinition[] = [
  messageActionsPlugin,
  codeHighlightPlugin,
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
