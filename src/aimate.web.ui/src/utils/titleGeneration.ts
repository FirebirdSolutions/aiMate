/**
 * Title Generation Utility
 *
 * Generates conversation titles using the LLM based on initial messages
 */

const DEFAULT_TITLE_PROMPT = `Generate a short, descriptive title (3-6 words) for this conversation based on the user's question.
Return ONLY the title, no quotes, no explanation, no punctuation at the end.
Examples of good titles:
- Setting up React Router
- Python list comprehensions
- Debugging API authentication
- Planning a trip to Japan`;

/**
 * Generate a title for a conversation using the LLM
 */
export async function generateTitle(
  userMessage: string,
  assistantMessage: string,
  connectionUrl: string,
  apiKey?: string,
  model?: string,
  customPrompt?: string
): Promise<string | null> {
  try {
    const prompt = customPrompt && customPrompt.trim()
      ? customPrompt
      : DEFAULT_TITLE_PROMPT;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const chatUrl = connectionUrl.replace(/\/$/, '') + '/chat/completions';

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `User: ${userMessage.substring(0, 500)}\n\nAssistant: ${assistantMessage.substring(0, 300)}`,
          },
        ],
        max_tokens: 30,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error('[generateTitle] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim();

    if (!title || title.length < 3 || title.length > 100) {
      return null;
    }

    // Clean up the title
    return title
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[.!?]$/, '')       // Remove trailing punctuation
      .trim();
  } catch (err) {
    console.error('[generateTitle] Failed:', err);
    return null;
  }
}

/**
 * Generate a title from the first user message (fallback when no LLM available)
 */
export function generateFallbackTitle(userMessage: string): string {
  // Take first sentence or first 50 chars
  const firstSentence = userMessage.split(/[.!?\n]/)[0].trim();

  if (firstSentence.length <= 50) {
    return firstSentence;
  }

  // Truncate at word boundary
  const truncated = firstSentence.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Check if a conversation needs a title generated
 */
export function needsTitleGeneration(currentTitle: string): boolean {
  const defaultTitles = [
    'new conversation',
    'new chat',
    'untitled',
    'untitled conversation',
  ];

  return defaultTitles.includes(currentTitle.toLowerCase().trim());
}
