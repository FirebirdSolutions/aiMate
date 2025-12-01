/**
 * Token counting utilities for context management
 */
console.log('[tokenCounter.ts] Loading...');

import { encode } from 'gpt-tokenizer';
console.log('[tokenCounter.ts] gpt-tokenizer loaded');
import type { ChatMessage } from '../hooks/useChat';

/**
 * Count tokens in a string using GPT tokenizer
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    // Fallback: rough estimate (4 chars per token average)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in an array of chat messages
 * Accounts for message overhead (~4 tokens per message for role, delimiters)
 */
export function countMessageTokens(messages: ChatMessage[]): number {
  if (!messages || messages.length === 0) return 0;

  const MESSAGE_OVERHEAD = 4; // Tokens for role, delimiters per message
  const overhead = messages.length * MESSAGE_OVERHEAD;
  const content = messages.reduce((sum, m) => sum + countTokens(m.content), 0);

  return overhead + content;
}

/**
 * Token breakdown by category
 */
export interface TokenBreakdown {
  systemPrompt: number;
  knowledge: number;
  memories: number;
  conversation: number;
  total: number;
}

/**
 * Calculate token breakdown for all context components
 */
export function calculateTokenBreakdown(
  systemPrompt: string,
  knowledgeContext: string,
  memoryContext: string,
  messages: ChatMessage[]
): TokenBreakdown {
  const systemPromptTokens = countTokens(systemPrompt);
  const knowledgeTokens = countTokens(knowledgeContext);
  const memoriesTokens = countTokens(memoryContext);
  const conversationTokens = countMessageTokens(messages);

  return {
    systemPrompt: systemPromptTokens,
    knowledge: knowledgeTokens,
    memories: memoriesTokens,
    conversation: conversationTokens,
    total: systemPromptTokens + knowledgeTokens + memoriesTokens + conversationTokens,
  };
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}
