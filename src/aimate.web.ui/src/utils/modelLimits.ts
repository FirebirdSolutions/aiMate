/**
 * Model context window limits
 */

export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // OpenAI
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-turbo': 128000,
  'gpt-4-turbo-preview': 128000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-3.5-turbo': 16385,
  'gpt-3.5-turbo-16k': 16385,
  'o1': 200000,
  'o1-mini': 128000,
  'o1-preview': 128000,

  // Anthropic
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'claude-3.5-sonnet': 200000,
  'claude-3.5-haiku': 200000,
  'claude-2': 100000,
  'claude-instant': 100000,

  // Google
  'gemini-pro': 32768,
  'gemini-1.5-pro': 1000000,
  'gemini-1.5-flash': 1000000,

  // Meta Llama
  'llama-3': 8192,
  'llama-3.1': 128000,
  'llama-3.2': 128000,
  'llama-2': 4096,

  // Mistral
  'mistral': 32768,
  'mistral-7b': 32768,
  'mistral-large': 128000,
  'mixtral': 32768,

  // Cohere
  'command': 4096,
  'command-r': 128000,
  'command-r-plus': 128000,

  // Local/Other common
  'qwen': 32768,
  'phi': 4096,
  'deepseek': 32768,

  // Default fallback
  'default': 8192,
};

/**
 * Get context limit for a model
 * Handles exact matches and partial matches (e.g., "gpt-4-turbo-2024" matches "gpt-4-turbo")
 */
export function getContextLimit(modelId: string): number {
  if (!modelId) return MODEL_CONTEXT_LIMITS['default'];

  const normalizedId = modelId.toLowerCase();

  // Check exact match first
  if (MODEL_CONTEXT_LIMITS[normalizedId]) {
    return MODEL_CONTEXT_LIMITS[normalizedId];
  }

  // Check partial matches (sorted by key length descending for best match)
  const sortedKeys = Object.keys(MODEL_CONTEXT_LIMITS)
    .filter(k => k !== 'default')
    .sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (normalizedId.includes(key.toLowerCase())) {
      return MODEL_CONTEXT_LIMITS[key];
    }
  }

  return MODEL_CONTEXT_LIMITS['default'];
}

/**
 * Get a human-readable context limit string
 */
export function formatContextLimit(limit: number): string {
  if (limit >= 1000000) {
    return `${(limit / 1000000).toFixed(1)}M`;
  }
  if (limit >= 1000) {
    return `${(limit / 1000).toFixed(0)}k`;
  }
  return limit.toString();
}

/**
 * Check if a model has a large context window (>32k)
 */
export function isLargeContextModel(modelId: string): boolean {
  return getContextLimit(modelId) > 32768;
}
