/**
 * Auto-Tagging Utility
 *
 * Analyzes conversation content to suggest topic tags for evaluation re-ranking
 */

interface TagPattern {
  tag: string;
  patterns: RegExp[];
  keywords: string[];
  weight: number;  // Higher weight = more confidence needed
}

// Topic detection patterns
const TAG_PATTERNS: TagPattern[] = [
  // Coding/Technical
  {
    tag: 'coding',
    patterns: [
      /```[\w]*\n/,           // Code blocks
      /function\s+\w+/,       // Function definitions
      /const\s+\w+\s*=/,      // Variable declarations
      /import\s+.*from/,      // Import statements
      /class\s+\w+/,          // Class definitions
      /\.(js|ts|py|java|cpp|go|rs|rb)\b/,  // File extensions
    ],
    keywords: ['code', 'programming', 'function', 'variable', 'debug', 'error', 'compile', 'build', 'api', 'endpoint', 'database', 'query'],
    weight: 2,
  },
  {
    tag: 'python',
    patterns: [
      /```python\b/,
      /def\s+\w+\s*\(/,
      /import\s+(numpy|pandas|tensorflow|torch|django|flask)/,
    ],
    keywords: ['python', 'pip', 'pytest', 'django', 'flask', 'pandas', 'numpy'],
    weight: 3,
  },
  {
    tag: 'javascript',
    patterns: [
      /```(javascript|typescript|jsx|tsx)\b/,
      /const\s+\w+\s*=\s*\(/,
      /import\s+.*from\s+['"]react/,
    ],
    keywords: ['javascript', 'typescript', 'react', 'node', 'npm', 'webpack', 'eslint'],
    weight: 3,
  },

  // Creative
  {
    tag: 'creative-writing',
    patterns: [
      /write\s+(a\s+)?(story|poem|essay|article)/i,
      /creative\s+writing/i,
      /"[^"]{50,}"/,          // Long quoted text (dialogue)
    ],
    keywords: ['story', 'poem', 'creative', 'fiction', 'narrative', 'character', 'plot', 'dialogue', 'writing'],
    weight: 2,
  },
  {
    tag: 'poetry',
    patterns: [
      /write\s+(a\s+)?poem/i,
      /haiku|sonnet|limerick|verse/i,
    ],
    keywords: ['poem', 'poetry', 'verse', 'rhyme', 'stanza', 'haiku', 'sonnet'],
    weight: 3,
  },

  // Analysis/Research
  {
    tag: 'analysis',
    patterns: [
      /analyze|analysis/i,
      /compare\s+(and\s+)?contrast/i,
      /evaluate|assessment/i,
    ],
    keywords: ['analyze', 'analysis', 'compare', 'evaluate', 'assessment', 'review', 'examine', 'investigate'],
    weight: 2,
  },
  {
    tag: 'research',
    patterns: [
      /research\s+(on|about|into)/i,
      /what\s+(is|are)\s+the\s+(benefits|effects|causes)/i,
    ],
    keywords: ['research', 'study', 'findings', 'evidence', 'data', 'statistics', 'scientific'],
    weight: 2,
  },

  // Education/Learning
  {
    tag: 'education',
    patterns: [
      /explain\s+(to\s+me|how|what|why)/i,
      /teach\s+me/i,
      /learn\s+(about|how)/i,
    ],
    keywords: ['explain', 'teach', 'learn', 'understand', 'concept', 'lesson', 'tutorial', 'guide'],
    weight: 2,
  },
  {
    tag: 'math',
    patterns: [
      /\b\d+\s*[\+\-\*\/\^]\s*\d+/,  // Math expressions
      /solve\s+(for|the\s+equation)/i,
      /calculate|computation/i,
    ],
    keywords: ['math', 'calculate', 'equation', 'algebra', 'calculus', 'geometry', 'statistics', 'probability'],
    weight: 2,
  },

  // Professional
  {
    tag: 'business',
    patterns: [
      /business\s+(plan|strategy|model)/i,
      /market(ing)?\s+(analysis|strategy)/i,
    ],
    keywords: ['business', 'marketing', 'sales', 'strategy', 'revenue', 'profit', 'startup', 'company'],
    weight: 2,
  },
  {
    tag: 'legal',
    patterns: [
      /legal\s+(advice|document|contract)/i,
      /terms\s+(and\s+)?conditions/i,
    ],
    keywords: ['legal', 'law', 'contract', 'agreement', 'terms', 'liability', 'compliance', 'regulation'],
    weight: 3,
  },

  // Communication
  {
    tag: 'email',
    patterns: [
      /write\s+(a|an)?\s*email/i,
      /draft\s+(a|an)?\s*(professional|formal)?\s*email/i,
    ],
    keywords: ['email', 'message', 'correspondence', 'reply', 'subject line'],
    weight: 3,
  },
  {
    tag: 'translation',
    patterns: [
      /translate\s+(to|into|from)/i,
      /in\s+(spanish|french|german|chinese|japanese)/i,
    ],
    keywords: ['translate', 'translation', 'language', 'spanish', 'french', 'german', 'chinese', 'japanese'],
    weight: 3,
  },

  // Technical/Specialized
  {
    tag: 'data-science',
    patterns: [
      /machine\s+learning/i,
      /neural\s+network/i,
      /data\s+(analysis|visualization)/i,
    ],
    keywords: ['ml', 'ai', 'machine learning', 'neural network', 'data science', 'model', 'training', 'prediction'],
    weight: 2,
  },
  {
    tag: 'devops',
    patterns: [
      /docker|kubernetes/i,
      /ci\/cd|deployment|pipeline/i,
    ],
    keywords: ['docker', 'kubernetes', 'devops', 'deployment', 'pipeline', 'aws', 'cloud', 'terraform'],
    weight: 3,
  },

  // Conversational
  {
    tag: 'general-chat',
    patterns: [
      /^(hi|hello|hey|thanks|thank you)/i,
      /how\s+are\s+you/i,
    ],
    keywords: ['chat', 'conversation', 'talk', 'casual'],
    weight: 1,
  },
  {
    tag: 'advice',
    patterns: [
      /what\s+should\s+i/i,
      /advice\s+(on|about|for)/i,
      /recommend(ation)?/i,
    ],
    keywords: ['advice', 'recommend', 'suggest', 'should', 'help me decide'],
    weight: 2,
  },
];

interface TagScore {
  tag: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Analyze content and return suggested tags with confidence scores
 */
export function analyzeContentForTags(content: string): TagScore[] {
  const scores: Map<string, number> = new Map();
  const contentLower = content.toLowerCase();

  for (const tagPattern of TAG_PATTERNS) {
    let tagScore = 0;

    // Check regex patterns
    for (const pattern of tagPattern.patterns) {
      if (pattern.test(content)) {
        tagScore += 3;  // Pattern matches are strong signals
      }
    }

    // Check keywords
    for (const keyword of tagPattern.keywords) {
      const keywordLower = keyword.toLowerCase();
      // Count occurrences
      const matches = contentLower.split(keywordLower).length - 1;
      if (matches > 0) {
        tagScore += Math.min(matches, 3);  // Cap keyword contribution
      }
    }

    // Apply weight (higher weight = need more evidence)
    tagScore = tagScore / tagPattern.weight;

    if (tagScore > 0) {
      scores.set(tagPattern.tag, tagScore);
    }
  }

  // Convert to array and sort by score
  const results: TagScore[] = [];
  for (const [tag, score] of scores) {
    const confidence = score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low';
    results.push({ tag, score, confidence });
  }

  results.sort((a, b) => b.score - a.score);

  // Return top 5 tags
  return results.slice(0, 5);
}

/**
 * Get auto-suggested tags for a conversation (user + assistant messages)
 */
export function suggestTagsForConversation(
  userMessage: string,
  assistantResponse: string
): string[] {
  const combined = `${userMessage}\n${assistantResponse}`;
  const tagScores = analyzeContentForTags(combined);

  // Only return high and medium confidence tags
  return tagScores
    .filter(t => t.confidence !== 'low')
    .map(t => t.tag);
}

/**
 * Extract topic category from tags for grouping
 */
export function getTopicCategory(tag: string): string {
  const categories: Record<string, string[]> = {
    'technical': ['coding', 'python', 'javascript', 'data-science', 'devops'],
    'creative': ['creative-writing', 'poetry'],
    'academic': ['analysis', 'research', 'education', 'math'],
    'professional': ['business', 'legal', 'email'],
    'communication': ['translation', 'advice'],
    'general': ['general-chat'],
  };

  for (const [category, tags] of Object.entries(categories)) {
    if (tags.includes(tag)) {
      return category;
    }
  }

  return 'other';
}

/**
 * Format tag for display
 */
export function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default {
  analyzeContentForTags,
  suggestTagsForConversation,
  getTopicCategory,
  formatTagLabel,
};
