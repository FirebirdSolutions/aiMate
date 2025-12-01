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
          const timestamp = new Date().toLocaleString();
          const role = ctx.messageRole === 'user' ? 'You' : 'Assistant';
          const markdown = `## ${role}\n*${timestamp}*\n\n${ctx.messageContent}`;
          await navigator.clipboard.writeText(markdown);
          console.log('[Export Plugin] Copied as Markdown');
        }
      },
    },
    {
      id: 'export-txt',
      label: 'Copy as Plain Text',
      icon: 'FileType',
      onClick: async (ctx) => {
        if (ctx.messageContent) {
          const role = ctx.messageRole === 'user' ? 'You' : 'Assistant';
          const text = `[${role}]\n${ctx.messageContent}`;
          await navigator.clipboard.writeText(text);
          console.log('[Export Plugin] Copied as plain text');
        }
      },
    },
    {
      id: 'download-txt',
      label: 'Download as .txt',
      icon: 'Download',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          const role = ctx.messageRole === 'user' ? 'You' : 'Assistant';
          const timestamp = new Date().toISOString().split('T')[0];
          const text = `[${role}] - ${new Date().toLocaleString()}\n\n${ctx.messageContent}`;

          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `aimate-message-${timestamp}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('[Export Plugin] Downloaded as .txt');
        }
      },
    },
    {
      id: 'download-md',
      label: 'Download as .md',
      icon: 'FileDown',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          const role = ctx.messageRole === 'user' ? 'You' : 'Assistant';
          const timestamp = new Date().toISOString().split('T')[0];
          const markdown = `# aiMate Message Export\n\n**Role:** ${role}  \n**Date:** ${new Date().toLocaleString()}\n\n---\n\n${ctx.messageContent}`;

          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `aimate-message-${timestamp}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('[Export Plugin] Downloaded as .md');
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
          // Fallback: copy content
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

/**
 * Web Search Plugin
 *
 * Search the web for information and optionally inject into context.
 * Note: The "Attach Webpage" feature in ChatInput is for fetching full page content
 * as context, while this plugin is for quick web searches from message content.
 */
const searchPlugin: PluginDefinition = {
  id: 'web-search',
  name: 'Web Search',
  version: '1.0.0',
  description: 'Search the web for information related to messages',
  author: 'aiMate',
  enabled: true, // Enabled by default
  settings: {
    searchEngine: 'duckduckgo', // 'google' | 'duckduckgo' | 'bing'
    maxResults: 5,
    injectSearchHint: true, // Add hint to assistant about outdated info
  },
  messageActions: [
    {
      id: 'search-web',
      label: 'Search web',
      icon: 'Search',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          // Extract first meaningful sentence or first 150 chars as search query
          const content = ctx.messageContent.trim();
          const firstSentence = content.split(/[.!?]/)[0] || content;
          const query = encodeURIComponent(firstSentence.slice(0, 150).trim());

          // Get search engine from settings
          const engine = ctx.settings?.searchEngine || 'duckduckgo';
          const searchUrls: Record<string, string> = {
            google: `https://www.google.com/search?q=${query}`,
            duckduckgo: `https://duckduckgo.com/?q=${query}`,
            bing: `https://www.bing.com/search?q=${query}`,
          };

          const url = searchUrls[engine] || searchUrls.duckduckgo;
          window.open(url, '_blank');

          console.log('[Web Search] Opening search:', url);
        }
      },
    },
    {
      id: 'search-selection',
      label: 'Search selected text',
      icon: 'TextSearch',
      onClick: (ctx) => {
        // Get selected text from the page
        const selection = window.getSelection()?.toString();
        if (selection) {
          const engine = ctx.settings?.searchEngine || 'duckduckgo';
          const query = encodeURIComponent(selection.slice(0, 150).trim());
          const searchUrls: Record<string, string> = {
            google: `https://www.google.com/search?q=${query}`,
            duckduckgo: `https://duckduckgo.com/?q=${query}`,
            bing: `https://www.bing.com/search?q=${query}`,
          };
          window.open(searchUrls[engine] || searchUrls.duckduckgo, '_blank');
        }
      },
      condition: () => {
        const selection = window.getSelection()?.toString();
        return !!selection && selection.trim().length > 0;
      },
    },
    {
      id: 'copy-search-url',
      label: 'Copy search URL',
      icon: 'Link',
      onClick: async (ctx) => {
        if (ctx.messageContent) {
          const content = ctx.messageContent.trim();
          const firstSentence = content.split(/[.!?]/)[0] || content;
          const query = encodeURIComponent(firstSentence.slice(0, 150).trim());
          const engine = ctx.settings?.searchEngine || 'duckduckgo';
          const searchUrls: Record<string, string> = {
            google: `https://www.google.com/search?q=${query}`,
            duckduckgo: `https://duckduckgo.com/?q=${query}`,
            bing: `https://www.bing.com/search?q=${query}`,
          };
          const url = searchUrls[engine] || searchUrls.duckduckgo;
          await navigator.clipboard.writeText(url);
          console.log('[Web Search] Copied search URL:', url);
        }
      },
    },
  ],
  hooks: {
    // Detect search intent and add helpful context
    beforeRequest: [
      async (request, ctx) => {
        if (!ctx.settings?.injectSearchHint) return request;

        // Detect search intent in user message
        const lastMessage = request.messages?.[request.messages.length - 1];
        if (lastMessage?.role !== 'user') return request;

        const content = lastMessage.content?.toLowerCase() || '';
        const searchIntents = [
          'search for', 'look up', 'find information', 'what is the latest',
          'current news', 'recent updates', 'what happened'
        ];

        const hasSearchIntent = searchIntents.some(intent => content.includes(intent));

        if (hasSearchIntent) {
          console.log('[Web Search] Search intent detected');

          // Add system hint about potential need for web search
          return {
            ...request,
            messages: [
              {
                role: 'system',
                content: '[Context: User may be asking for current/recent information. If your knowledge seems outdated, suggest they use web search for the latest data.]'
              },
              ...(request.messages || []),
            ]
          };
        }

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

/**
 * Voice Input Plugin
 *
 * Speech-to-text using Web Speech API for dictation.
 */
const voiceInputPlugin: PluginDefinition = {
  id: 'voice-input',
  name: 'Voice Input',
  version: '1.0.0',
  description: 'Dictate messages using speech recognition',
  author: 'aiMate',
  enabled: true,
  settings: {
    language: 'en-NZ',  // Default to NZ English
    continuous: false,
    interimResults: true,
  },
  messageActions: [
    {
      id: 'start-dictation',
      label: 'Start dictation',
      icon: 'Mic',
      onClick: (ctx) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          console.warn('[Voice Input] Speech recognition not supported');
          return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = ctx.settings?.language || 'en-NZ';
        recognition.continuous = ctx.settings?.continuous || false;
        recognition.interimResults = ctx.settings?.interimResults || true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');

          console.log('[Voice Input] Transcript:', transcript);

          // Call the onTranscript callback if provided
          if (ctx.onTranscript) {
            ctx.onTranscript(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('[Voice Input] Error:', event.error);
        };

        recognition.start();

        // Store recognition instance for stopping
        (window as any).__aiMateVoiceRecognition = recognition;
      },
      condition: () =>
        'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    },
    {
      id: 'stop-dictation',
      label: 'Stop dictation',
      icon: 'MicOff',
      onClick: () => {
        const recognition = (window as any).__aiMateVoiceRecognition;
        if (recognition) {
          recognition.stop();
          (window as any).__aiMateVoiceRecognition = null;
        }
      },
      condition: () => !!(window as any).__aiMateVoiceRecognition,
    },
  ],
};

/**
 * Memory Extraction Plugin
 *
 * Automatically extracts key facts, entities, and preferences from conversations.
 */
const memoryExtractionPlugin: PluginDefinition = {
  id: 'memory-extraction',
  name: 'Memory Extraction',
  version: '1.0.0',
  description: 'Auto-extract and save important facts from conversations',
  author: 'aiMate',
  enabled: true,
  settings: {
    autoExtract: true,
    extractTypes: ['facts', 'preferences', 'entities', 'dates'],
    minConfidence: 0.7,
  },
  hooks: {
    // Process responses to extract memories
    afterResponse: [
      (response, ctx) => {
        if (!response?.content || !ctx.settings?.autoExtract) return response;

        // Simple extraction patterns (in production, use NLP/LLM)
        const memories: Array<{ type: string; content: string; confidence: number }> = [];

        // Extract dates mentioned
        const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
        const dates = response.content.match(datePattern);
        if (dates) {
          dates.forEach((date: string) => {
            memories.push({ type: 'date', content: date, confidence: 0.9 });
          });
        }

        // Extract "I am/I'm" statements (preferences/facts about user)
        const preferencePattern = /(?:I am|I'm|I prefer|I like|I want|I need|My name is|I work|I live)\s+([^.!?]+)/gi;
        let match;
        while ((match = preferencePattern.exec(response.content)) !== null) {
          memories.push({
            type: 'preference',
            content: match[0].trim(),
            confidence: 0.8,
          });
        }

        // Extract email addresses
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = response.content.match(emailPattern);
        if (emails) {
          emails.forEach((email: string) => {
            memories.push({ type: 'email', content: email, confidence: 0.95 });
          });
        }

        // Extract URLs
        const urlPattern = /https?:\/\/[^\s]+/g;
        const urls = response.content.match(urlPattern);
        if (urls) {
          urls.forEach((url: string) => {
            memories.push({ type: 'url', content: url, confidence: 0.95 });
          });
        }

        // Add extracted memories to response
        if (memories.length > 0) {
          console.log('[Memory Extraction] Found memories:', memories);
          return {
            ...response,
            extractedMemories: memories,
            hasExtractedMemories: true,
          };
        }

        return response;
      },
    ],
  },
  messageActions: [
    {
      id: 'extract-memories',
      label: 'Extract memories',
      icon: 'Brain',
      onClick: (ctx) => {
        console.log('[Memory Extraction] Manual extraction for:', ctx.messageId);
        // Would trigger memory extraction and saving
        if (ctx.onExtractMemories) {
          ctx.onExtractMemories(ctx.messageContent);
        }
      },
      condition: (ctx) => ctx.messageRole === 'assistant',
    },
    {
      id: 'view-memories',
      label: 'View extracted',
      icon: 'List',
      onClick: (ctx) => {
        if (ctx.extractedMemories) {
          console.log('[Memory Extraction] Extracted:', ctx.extractedMemories);
        }
      },
      condition: (ctx) => ctx.hasExtractedMemories === true,
    },
  ],
};

/**
 * Summarization Plugin
 *
 * Summarize long messages or conversations.
 */
const summarizationPlugin: PluginDefinition = {
  id: 'summarization',
  name: 'Summarization',
  version: '1.0.0',
  description: 'Summarize long messages and conversations',
  author: 'aiMate',
  enabled: true,
  settings: {
    maxLength: 200,
    style: 'bullet',  // 'bullet' | 'paragraph' | 'tldr'
  },
  messageActions: [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: 'AlignLeft',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          // Simple extractive summarization (first sentences)
          // In production, use an LLM for better results
          const sentences = ctx.messageContent.split(/[.!?]+/).filter(s => s.trim());
          const summary = sentences.slice(0, 3).join('. ').trim();

          console.log('[Summarization] Summary:', summary);

          if (ctx.onShowSummary) {
            ctx.onShowSummary(summary);
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`Summary:\n${summary}`);
          }
        }
      },
      condition: (ctx) =>
        ctx.messageContent && ctx.messageContent.length > 500,
    },
    {
      id: 'tldr',
      label: 'TL;DR',
      icon: 'Zap',
      onClick: (ctx) => {
        if (ctx.messageContent) {
          // Very short summary - just first sentence or first 100 chars
          const firstSentence = ctx.messageContent.split(/[.!?]/)[0]?.trim() || '';
          const tldr = firstSentence.length > 100
            ? firstSentence.slice(0, 100) + '...'
            : firstSentence;

          console.log('[Summarization] TL;DR:', tldr);
          navigator.clipboard.writeText(`TL;DR: ${tldr}`);
        }
      },
      condition: (ctx) =>
        ctx.messageContent && ctx.messageContent.length > 300,
    },
  ],
};

/**
 * Keyboard Shortcuts Plugin
 *
 * Provides customizable keyboard shortcuts for common actions.
 */
const keyboardShortcutsPlugin: PluginDefinition = {
  id: 'keyboard-shortcuts',
  name: 'Keyboard Shortcuts',
  version: '1.0.0',
  description: 'Customizable keyboard shortcuts for quick actions',
  author: 'aiMate',
  enabled: true,
  settings: {
    shortcuts: {
      'copy': 'Ctrl+Shift+C',
      'regenerate': 'Ctrl+Shift+R',
      'newChat': 'Ctrl+N',
      'search': 'Ctrl+K',
      'settings': 'Ctrl+,',
    },
  },
  // Note: Actual keyboard handling is done at the app level
  // This plugin provides configuration and the action registry
  messageActions: [
    {
      id: 'show-shortcuts',
      label: 'Keyboard shortcuts',
      icon: 'Keyboard',
      onClick: (ctx) => {
        const shortcuts = ctx.settings?.shortcuts || {};
        const text = Object.entries(shortcuts)
          .map(([action, key]) => `${action}: ${key}`)
          .join('\n');

        console.log('[Keyboard Shortcuts] Available:\n', text);

        if (ctx.onShowShortcuts) {
          ctx.onShowShortcuts(shortcuts);
        }
      },
    },
  ],
};

/**
 * Reading Time Plugin
 *
 * Estimates reading time for messages.
 */
const readingTimePlugin: PluginDefinition = {
  id: 'reading-time',
  name: 'Reading Time',
  version: '1.0.0',
  description: 'Show estimated reading time for messages',
  author: 'aiMate',
  enabled: true,
  settings: {
    wordsPerMinute: 200,
    showForMinLength: 100,  // Only show for messages > 100 words
  },
  hooks: {
    afterResponse: [
      (response, ctx) => {
        if (!response?.content) return response;

        const words = response.content.split(/\s+/).length;
        const wpm = ctx.settings?.wordsPerMinute || 200;
        const minutes = Math.ceil(words / wpm);

        if (words >= (ctx.settings?.showForMinLength || 100)) {
          return {
            ...response,
            readingTime: {
              words,
              minutes,
              formatted: minutes === 1 ? '1 min read' : `${minutes} min read`,
            },
          };
        }

        return response;
      },
    ],
  },
};

/**
 * Sentiment Analysis Plugin
 *
 * Enhanced sentiment detection for messages using keyword scoring.
 * Detects positive, negative, and neutral tones plus specific emotions.
 */
const sentimentPlugin: PluginDefinition = {
  id: 'sentiment',
  name: 'Sentiment Analysis',
  version: '1.0.0',
  description: 'Detect emotional tone of messages',
  author: 'aiMate',
  enabled: true, // Now enabled by default
  settings: {
    showIndicator: true, // Show sentiment indicator on messages
    detectEmotions: true, // Detect specific emotions beyond positive/negative
  },
  hooks: {
    afterResponse: [
      (response, ctx) => {
        if (!response?.content) return response;

        const content = response.content.toLowerCase();
        const words = content.split(/\W+/);

        // Expanded sentiment lexicons with weights
        const positiveTerms: Record<string, number> = {
          // Strong positive
          'excellent': 3, 'amazing': 3, 'wonderful': 3, 'fantastic': 3, 'outstanding': 3,
          'brilliant': 3, 'perfect': 3, 'incredible': 3, 'superb': 3,
          // Moderate positive
          'great': 2, 'good': 2, 'nice': 2, 'helpful': 2, 'useful': 2, 'love': 2,
          'enjoy': 2, 'happy': 2, 'pleased': 2, 'glad': 2, 'delighted': 2,
          // Mild positive
          'thanks': 1, 'thank': 1, 'appreciate': 1, 'like': 1, 'fine': 1, 'okay': 1,
          'interesting': 1, 'works': 1, 'correct': 1, 'right': 1, 'yes': 1,
        };

        const negativeTerms: Record<string, number> = {
          // Strong negative
          'terrible': 3, 'awful': 3, 'horrible': 3, 'worst': 3, 'hate': 3,
          'disaster': 3, 'catastrophe': 3, 'devastating': 3,
          // Moderate negative
          'bad': 2, 'wrong': 2, 'error': 2, 'fail': 2, 'failed': 2, 'broken': 2,
          'problem': 2, 'issue': 2, 'bug': 2, 'crash': 2, 'frustrating': 2,
          // Mild negative
          'unfortunately': 1, 'sorry': 1, 'difficult': 1, 'confusing': 1,
          'unclear': 1, 'missing': 1, 'cannot': 1, "can't": 1, 'no': 1, 'not': 1,
        };

        // Calculate sentiment score
        let positiveScore = 0;
        let negativeScore = 0;

        words.forEach(word => {
          if (positiveTerms[word]) positiveScore += positiveTerms[word];
          if (negativeTerms[word]) negativeScore += negativeTerms[word];
        });

        const totalScore = positiveScore - negativeScore;
        const magnitude = positiveScore + negativeScore;

        // Determine sentiment label
        let label: 'positive' | 'negative' | 'neutral' | 'mixed';
        if (magnitude < 2) {
          label = 'neutral';
        } else if (positiveScore > negativeScore * 2) {
          label = 'positive';
        } else if (negativeScore > positiveScore * 2) {
          label = 'negative';
        } else if (magnitude > 4 && Math.abs(totalScore) < magnitude * 0.3) {
          label = 'mixed';
        } else {
          label = totalScore > 0 ? 'positive' : totalScore < 0 ? 'negative' : 'neutral';
        }

        // Detect specific emotions if enabled
        let emotions: string[] = [];
        if (ctx.settings?.detectEmotions) {
          const emotionPatterns: Record<string, RegExp[]> = {
            'excited': [/excited/i, /can't wait/i, /thrilled/i, /eager/i],
            'grateful': [/thank/i, /appreciate/i, /grateful/i],
            'confused': [/confused/i, /don't understand/i, /unclear/i, /what do you mean/i],
            'frustrated': [/frustrat/i, /annoyed/i, /stuck/i, /not working/i],
            'curious': [/wondering/i, /curious/i, /how does/i, /what if/i],
            'confident': [/certain/i, /sure/i, /definitely/i, /absolutely/i],
            'uncertain': [/maybe/i, /perhaps/i, /not sure/i, /might/i],
          };

          for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
            if (patterns.some(pattern => pattern.test(content))) {
              emotions.push(emotion);
            }
          }
        }

        // Emoji mapping
        const emojiMap: Record<string, string> = {
          'positive': '😊',
          'negative': '😟',
          'neutral': '😐',
          'mixed': '🤔',
        };

        return {
          ...response,
          sentiment: {
            score: totalScore,
            magnitude,
            label,
            emotions,
            emoji: emojiMap[label] || '😐',
            breakdown: {
              positive: positiveScore,
              negative: negativeScore,
            },
          },
        };
      },
    ],
  },
  messageActions: [
    {
      id: 'show-sentiment',
      label: 'Show sentiment',
      icon: 'Activity',
      onClick: (ctx) => {
        if (ctx.sentiment) {
          const { label, score, emotions, breakdown } = ctx.sentiment;
          const info = [
            `Sentiment: ${label} (score: ${score})`,
            `Breakdown: +${breakdown.positive} / -${breakdown.negative}`,
            emotions.length > 0 ? `Detected emotions: ${emotions.join(', ')}` : null,
          ].filter(Boolean).join('\n');

          console.log('[Sentiment Analysis]', info);
          navigator.clipboard.writeText(info);
        }
      },
      condition: (ctx) => !!ctx.sentiment,
    },
  ],
};

// All built-in plugins
const BUILTIN_PLUGINS: PluginDefinition[] = [
  // Core plugins (always enabled)
  messageActionsPlugin,
  codeHighlightPlugin,
  textToSpeechPlugin,
  exportPlugin,
  bookmarkPlugin,

  // Content processing
  structuredContentPlugin,
  readingTimePlugin,
  sentimentPlugin,     // Now enabled by default

  // Input/output plugins
  voiceInputPlugin,
  memoryExtractionPlugin,
  summarizationPlugin,
  searchPlugin,        // Now enabled by default

  // Utility plugins
  keyboardShortcutsPlugin,

  // Optional plugins (disabled by default - need configuration)
  translationPlugin,   // Needs API key
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
