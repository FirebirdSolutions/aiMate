# Context Management Design Specification

## Overview

This document specifies the context management system for aiMate, including:
- Context meter (visual token usage indicator)
- Smart compression (automatic context optimization)
- User preferences and controls
- Integration with existing RAG/Knowledge system

## Goals

1. **Transparency** - Users can see how much context is being used
2. **Control** - Users can enable/disable compression per their use case
3. **Efficiency** - Maximize useful context within token limits
4. **Compatibility** - Work seamlessly with existing Knowledge/RAG features

---

## 1. Context Meter UI

### Location
Display in `ChatHeader.tsx`, near the model selector.

### Visual Design

```
Standard state:
┌─────────────────────────────┐
│ [████████░░] 78%  ⓘ        │
└─────────────────────────────┘

Compressed state:
┌─────────────────────────────┐
│ [████████░░] 78% ↓142%  ⓘ  │
└─────────────────────────────┘
         └── "compressed from 142%"

Warning state (>90%):
┌─────────────────────────────┐
│ [█████████░] 94%  ⚠️        │
└─────────────────────────────┘
```

### Tooltip Content

```typescript
interface ContextMeterTooltip {
  totalTokens: number;        // Current context size
  contextLimit: number;       // Model's max context
  breakdown: {
    systemPrompt: number;     // System prompt tokens
    knowledge: number;        // RAG/attached docs
    memories: number;         // User memories
    conversation: number;     // Chat history
  };
  compression?: {
    enabled: boolean;
    originalTokens: number;   // Before compression
    savedTokens: number;      // Tokens saved
    strategy: string;         // Active strategy
  };
}
```

### Component Structure

```typescript
// src/components/ContextMeter.tsx

interface ContextMeterProps {
  usedTokens: number;
  maxTokens: number;
  breakdown?: TokenBreakdown;
  compression?: CompressionInfo;
  compact?: boolean;  // For mobile
}

export function ContextMeter({
  usedTokens,
  maxTokens,
  breakdown,
  compression,
  compact = false
}: ContextMeterProps) {
  const percentage = Math.round((usedTokens / maxTokens) * 100);
  const isWarning = percentage > 90;
  const isCritical = percentage > 98;

  // ... render
}
```

---

## 2. Token Counting

### Approach

Use `tiktoken` (or `gpt-tokenizer` for browser) to count tokens client-side.

```typescript
// src/utils/tokenCounter.ts

import { encode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  return encode(text).length;
}

export function countMessageTokens(messages: ChatMessage[]): number {
  // Account for message overhead (~4 tokens per message for role, delimiters)
  const overhead = messages.length * 4;
  const content = messages.reduce((sum, m) => sum + countTokens(m.content), 0);
  return overhead + content;
}

export interface TokenBreakdown {
  systemPrompt: number;
  knowledge: number;
  memories: number;
  conversation: number;
  total: number;
}

export function calculateTokenBreakdown(
  systemPrompt: string,
  knowledgeContext: string,
  memoryContext: string,
  messages: ChatMessage[]
): TokenBreakdown {
  return {
    systemPrompt: countTokens(systemPrompt),
    knowledge: countTokens(knowledgeContext),
    memories: countTokens(memoryContext),
    conversation: countMessageTokens(messages),
    get total() {
      return this.systemPrompt + this.knowledge + this.memories + this.conversation;
    }
  };
}
```

### Model Context Limits

```typescript
// src/utils/modelLimits.ts

export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // OpenAI
  'gpt-4': 8192,
  'gpt-4-turbo': 128000,
  'gpt-4o': 128000,
  'gpt-3.5-turbo': 16385,

  // Anthropic
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,

  // Local/Other
  'llama-3': 8192,
  'mistral': 32768,

  // Default fallback
  'default': 8192,
};

export function getContextLimit(modelId: string): number {
  // Check exact match
  if (MODEL_CONTEXT_LIMITS[modelId]) {
    return MODEL_CONTEXT_LIMITS[modelId];
  }

  // Check partial match (e.g., "gpt-4-turbo-preview" matches "gpt-4-turbo")
  for (const [key, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (modelId.toLowerCase().includes(key.toLowerCase())) {
      return limit;
    }
  }

  return MODEL_CONTEXT_LIMITS['default'];
}
```

---

## 3. Compression Settings

### User Settings Location

Add to `SettingsModal.tsx` under "Personalisation" tab.

### Settings Interface

```typescript
// In UserSettingsContext or types

interface ContextCompressionSettings {
  enabled: boolean;                    // Master toggle
  threshold: number;                   // Trigger at X% (default: 80)
  strategy: CompressionStrategy;       // Which strategy to use
  preserveRecentMessages: number;      // Always keep last N (default: 5)
  showIndicator: boolean;              // Show compression indicator
}

type CompressionStrategy =
  | 'summarize'           // Summarize old messages (costs tokens)
  | 'drop-low-value'      // Drop "ok", "thanks", etc.
  | 'sliding-window'      // Simple truncation
  | 'hybrid';             // Summarize + drop (recommended)
```

### Settings UI

```
Context Management
─────────────────────────────────────────
☑ Enable smart context compression

When context reaches [80]% of limit:

Strategy: [Hybrid (Recommended)     ▼]
  ├─ Summarize & Drop Low-Value (Hybrid)
  ├─ Summarize Only
  ├─ Drop Low-Value Only
  └─ Sliding Window (Simple)

Always keep last [5] messages intact

☑ Show compression indicator in chat
─────────────────────────────────────────
```

---

## 4. Token Budget Allocation

### Budget Strategy

```
Total Context Window
├── Reserved: System Prompt (fixed)
├── Reserved: User Memories (fixed, up to 500 tokens)
├── Priority: Knowledge/RAG (up to 25% of remaining)
└── Flexible: Conversation (compressible)
```

### Implementation

```typescript
// src/utils/contextBudget.ts

export interface ContextBudget {
  total: number;
  systemPrompt: { allocated: number; used: number };
  memories: { allocated: number; used: number };
  knowledge: { allocated: number; used: number };
  conversation: { allocated: number; used: number };
  available: number;
}

export function calculateBudget(
  contextLimit: number,
  systemPromptTokens: number,
  memoryTokens: number,
  knowledgeTokens: number,
  conversationTokens: number
): ContextBudget {
  const systemAlloc = systemPromptTokens;
  const memoryAlloc = Math.min(memoryTokens, 500); // Cap memories
  const remaining = contextLimit - systemAlloc - memoryAlloc;

  // Knowledge gets up to 25% of remaining, conversation gets rest
  const knowledgeAlloc = Math.min(knowledgeTokens, remaining * 0.25);
  const conversationAlloc = remaining - knowledgeAlloc;

  return {
    total: contextLimit,
    systemPrompt: { allocated: systemAlloc, used: systemPromptTokens },
    memories: { allocated: memoryAlloc, used: memoryTokens },
    knowledge: { allocated: knowledgeAlloc, used: knowledgeTokens },
    conversation: { allocated: conversationAlloc, used: conversationTokens },
    available: conversationAlloc - conversationTokens,
  };
}
```

---

## 5. Compression Logic

### useContextCompression Hook

```typescript
// src/hooks/useContextCompression.ts

interface UseContextCompressionOptions {
  messages: ChatMessage[];
  contextLimit: number;
  settings: ContextCompressionSettings;
  systemPromptTokens: number;
  knowledgeTokens: number;
  memoryTokens: number;
}

interface CompressionResult {
  messages: ChatMessage[];              // Compressed messages
  summary?: string;                     // Generated summary (if any)
  droppedCount: number;                 // Messages removed
  originalTokens: number;
  compressedTokens: number;
  compressionApplied: boolean;
}

export function useContextCompression({
  messages,
  contextLimit,
  settings,
  systemPromptTokens,
  knowledgeTokens,
  memoryTokens,
}: UseContextCompressionOptions): CompressionResult {

  return useMemo(() => {
    const conversationBudget = contextLimit - systemPromptTokens - knowledgeTokens - memoryTokens;
    const currentTokens = countMessageTokens(messages);
    const thresholdTokens = conversationBudget * (settings.threshold / 100);

    // No compression needed
    if (currentTokens <= thresholdTokens || !settings.enabled) {
      return {
        messages,
        droppedCount: 0,
        originalTokens: currentTokens,
        compressedTokens: currentTokens,
        compressionApplied: false,
      };
    }

    // Apply compression based on strategy
    switch (settings.strategy) {
      case 'drop-low-value':
        return dropLowValueMessages(messages, thresholdTokens, settings);
      case 'sliding-window':
        return slidingWindowCompression(messages, thresholdTokens, settings);
      case 'summarize':
        return summarizeCompression(messages, thresholdTokens, settings);
      case 'hybrid':
      default:
        return hybridCompression(messages, thresholdTokens, settings);
    }
  }, [messages, contextLimit, settings, systemPromptTokens, knowledgeTokens, memoryTokens]);
}
```

### Compression Strategies

```typescript
// Strategy 1: Drop Low-Value Messages
const LOW_VALUE_PATTERNS = [
  /^(ok|okay|sure|thanks|thank you|got it|understood|right|yes|no|yep|nope)\.?$/i,
  /^(sounds good|perfect|great|awesome|cool)\.?$/i,
];

function isLowValueMessage(content: string): boolean {
  const trimmed = content.trim();
  return LOW_VALUE_PATTERNS.some(pattern => pattern.test(trimmed));
}

function dropLowValueMessages(
  messages: ChatMessage[],
  targetTokens: number,
  settings: ContextCompressionSettings
): CompressionResult {
  const preserved = messages.slice(-settings.preserveRecentMessages);
  const compressible = messages.slice(0, -settings.preserveRecentMessages);

  // Filter out low-value messages from compressible section
  const filtered = compressible.filter(m => !isLowValueMessage(m.content));
  const result = [...filtered, ...preserved];

  return {
    messages: result,
    droppedCount: messages.length - result.length,
    originalTokens: countMessageTokens(messages),
    compressedTokens: countMessageTokens(result),
    compressionApplied: true,
  };
}

// Strategy 2: Sliding Window
function slidingWindowCompression(
  messages: ChatMessage[],
  targetTokens: number,
  settings: ContextCompressionSettings
): CompressionResult {
  let result = [...messages];

  // Keep removing oldest messages until under target
  while (countMessageTokens(result) > targetTokens && result.length > settings.preserveRecentMessages) {
    result = result.slice(1);
  }

  return {
    messages: result,
    droppedCount: messages.length - result.length,
    originalTokens: countMessageTokens(messages),
    compressedTokens: countMessageTokens(result),
    compressionApplied: true,
  };
}

// Strategy 3: Hybrid (Recommended)
function hybridCompression(
  messages: ChatMessage[],
  targetTokens: number,
  settings: ContextCompressionSettings
): CompressionResult {
  // Step 1: Drop low-value messages first
  let result = dropLowValueMessages(messages, targetTokens, settings);

  // Step 2: If still over, apply sliding window
  if (result.compressedTokens > targetTokens) {
    result = slidingWindowCompression(result.messages, targetTokens, settings);
  }

  // Step 3: If still over and summarize is available, summarize oldest chunk
  // (This would require an LLM call - implement as async)

  return result;
}
```

---

## 6. Integration Points

### useChat.ts Integration

```typescript
// In sendMessage function

const compression = useContextCompression({
  messages,
  contextLimit: getContextLimit(selectedModel),
  settings: userSettings.contextCompression,
  systemPromptTokens: countTokens(systemPrompt),
  knowledgeTokens: countTokens(knowledgeContext),
  memoryTokens: countTokens(memoryContext),
});

// Use compressed messages for API call
const chatMessages = [
  { role: 'system', content: buildSystemContext(systemPrompt, knowledgeContext, memoryContext, compression.summary) },
  ...compression.messages.map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: userMessage }
];
```

### ChatHeader.tsx Integration

```typescript
// Add ContextMeter to header

<ContextMeter
  usedTokens={tokenBreakdown.total}
  maxTokens={getContextLimit(selectedModel)}
  breakdown={tokenBreakdown}
  compression={compressionInfo}
/>
```

---

## 7. Future Enhancements

### Phase 2: Summarization
- Add async summarization using LLM
- Cache summaries for conversation segments
- "Expand" option to view original messages

### Phase 3: Semantic Retrieval
- Store conversation chunks in vector DB
- Retrieve relevant past context per query
- Unify with Knowledge/RAG system

### Phase 4: User Insights
- Show "context efficiency" metrics
- Suggest when to start new conversation
- Export conversation with compression history

---

## Implementation Priority

1. **MVP**: Context meter + token counting (visual only)
2. **V1**: Drop low-value + sliding window compression
3. **V2**: User settings UI + compression indicator
4. **V3**: Summarization (requires LLM call)
5. **V4**: Semantic retrieval integration

---

## Dependencies

- `gpt-tokenizer` - Browser-compatible token counting
- Existing: `useChat`, `UserSettingsContext`, `ChatHeader`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/ContextMeter.tsx` | Create | Context usage indicator |
| `src/utils/tokenCounter.ts` | Create | Token counting utilities |
| `src/utils/modelLimits.ts` | Create | Model context limits |
| `src/utils/contextBudget.ts` | Create | Budget allocation logic |
| `src/hooks/useContextCompression.ts` | Create | Compression hook |
| `src/context/UserSettingsContext.tsx` | Modify | Add compression settings |
| `src/components/SettingsModal.tsx` | Modify | Add compression UI |
| `src/components/ChatHeader.tsx` | Modify | Add ContextMeter |
| `src/hooks/useChat.ts` | Modify | Integrate compression |
