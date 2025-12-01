/**
 * useContextCompression Hook
 *
 * Implements context compression strategies to optimize token usage
 */

import { useMemo } from 'react';
import type { ChatMessage } from './useChat';
import { countTokens, countMessageTokens } from '../utils/tokenCounter';
import type { CompressionStrategy, ContextManagementSettings } from '../context/UserSettingsContext';

// Low-value message patterns (acknowledgments, short responses)
const LOW_VALUE_PATTERNS = [
  /^(ok|okay|sure|thanks|thank you|got it|understood|right|yes|no|yep|nope|k|kk)\.?$/i,
  /^(sounds good|perfect|great|awesome|cool|nice|good|fine|alright)\.?$/i,
  /^(i see|ah|oh|hmm|hm|mhm|uh huh)\.?$/i,
  /^(👍|👌|✅|🙏|😊|🤔|💯)$/,
];

export interface CompressionResult {
  messages: ChatMessage[];
  originalTokens: number;
  compressedTokens: number;
  droppedCount: number;
  compressionApplied: boolean;
  summary?: string;
}

interface UseContextCompressionOptions {
  messages: ChatMessage[];
  contextLimit: number;
  settings: ContextManagementSettings;
  systemPromptTokens?: number;
  knowledgeTokens?: number;
  memoryTokens?: number;
}

/**
 * Check if a message is low-value (short acknowledgment)
 */
function isLowValueMessage(content: string): boolean {
  const trimmed = content.trim();
  // Short messages under 20 chars that match patterns
  if (trimmed.length > 50) return false;
  return LOW_VALUE_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Drop low-value messages while preserving recent ones
 */
function dropLowValueMessages(
  messages: ChatMessage[],
  preserveCount: number
): CompressionResult {
  const originalTokens = countMessageTokens(messages);

  if (messages.length <= preserveCount) {
    return {
      messages,
      originalTokens,
      compressedTokens: originalTokens,
      droppedCount: 0,
      compressionApplied: false,
    };
  }

  const preserved = messages.slice(-preserveCount);
  const compressible = messages.slice(0, -preserveCount);

  // Filter out low-value messages, but keep pairs (if user says "ok", keep the assistant response before it)
  const filtered: ChatMessage[] = [];
  for (let i = 0; i < compressible.length; i++) {
    const msg = compressible[i];
    const isLowValue = msg.role === 'user' && isLowValueMessage(msg.content);

    if (!isLowValue) {
      filtered.push(msg);
    }
  }

  const result = [...filtered, ...preserved];
  const compressedTokens = countMessageTokens(result);

  return {
    messages: result,
    originalTokens,
    compressedTokens,
    droppedCount: messages.length - result.length,
    compressionApplied: result.length < messages.length,
  };
}

/**
 * Sliding window - keep only recent messages
 */
function slidingWindowCompression(
  messages: ChatMessage[],
  targetTokens: number,
  preserveCount: number
): CompressionResult {
  const originalTokens = countMessageTokens(messages);

  if (originalTokens <= targetTokens) {
    return {
      messages,
      originalTokens,
      compressedTokens: originalTokens,
      droppedCount: 0,
      compressionApplied: false,
    };
  }

  let result = [...messages];

  // Keep removing oldest messages until under target (but preserve minimum)
  while (
    countMessageTokens(result) > targetTokens &&
    result.length > preserveCount
  ) {
    result = result.slice(1);
  }

  const compressedTokens = countMessageTokens(result);

  return {
    messages: result,
    originalTokens,
    compressedTokens,
    droppedCount: messages.length - result.length,
    compressionApplied: result.length < messages.length,
  };
}

/**
 * Hybrid compression - drop low-value first, then sliding window
 */
function hybridCompression(
  messages: ChatMessage[],
  targetTokens: number,
  preserveCount: number
): CompressionResult {
  // Step 1: Drop low-value messages
  let result = dropLowValueMessages(messages, preserveCount);

  // Step 2: If still over target, apply sliding window
  if (result.compressedTokens > targetTokens) {
    const windowResult = slidingWindowCompression(
      result.messages,
      targetTokens,
      preserveCount
    );

    return {
      messages: windowResult.messages,
      originalTokens: result.originalTokens,
      compressedTokens: windowResult.compressedTokens,
      droppedCount: messages.length - windowResult.messages.length,
      compressionApplied: true,
    };
  }

  return result;
}

/**
 * Main hook for context compression
 */
export function useContextCompression({
  messages,
  contextLimit,
  settings,
  systemPromptTokens = 0,
  knowledgeTokens = 0,
  memoryTokens = 0,
}: UseContextCompressionOptions): CompressionResult {
  return useMemo(() => {
    // Calculate available budget for conversation
    const reservedTokens = systemPromptTokens + knowledgeTokens + memoryTokens;
    const conversationBudget = contextLimit - reservedTokens;
    const thresholdTokens = Math.floor(conversationBudget * (settings.threshold / 100));

    const currentTokens = countMessageTokens(messages);

    // No compression needed if disabled or under threshold
    if (!settings.enabled || currentTokens <= thresholdTokens) {
      return {
        messages,
        originalTokens: currentTokens,
        compressedTokens: currentTokens,
        droppedCount: 0,
        compressionApplied: false,
      };
    }

    // Apply compression based on strategy
    switch (settings.strategy) {
      case 'drop-low-value':
        return dropLowValueMessages(messages, settings.preserveRecentMessages);

      case 'sliding-window':
        return slidingWindowCompression(
          messages,
          thresholdTokens,
          settings.preserveRecentMessages
        );

      case 'summarize':
        // For now, fall back to hybrid (summarize requires async LLM call)
        // TODO: Implement async summarization
        return hybridCompression(
          messages,
          thresholdTokens,
          settings.preserveRecentMessages
        );

      case 'hybrid':
      default:
        return hybridCompression(
          messages,
          thresholdTokens,
          settings.preserveRecentMessages
        );
    }
  }, [
    messages,
    contextLimit,
    settings.enabled,
    settings.threshold,
    settings.strategy,
    settings.preserveRecentMessages,
    systemPromptTokens,
    knowledgeTokens,
    memoryTokens,
  ]);
}

/**
 * Get compression info for display
 */
export function getCompressionInfo(result: CompressionResult, strategy: CompressionStrategy) {
  if (!result.compressionApplied) return null;

  return {
    enabled: true,
    originalTokens: result.originalTokens,
    compressedTokens: result.compressedTokens,
    strategy: strategy === 'hybrid' ? 'Hybrid' :
              strategy === 'drop-low-value' ? 'Drop Low-Value' :
              strategy === 'sliding-window' ? 'Sliding Window' :
              strategy === 'summarize' ? 'Summarize' : 'Unknown',
  };
}
