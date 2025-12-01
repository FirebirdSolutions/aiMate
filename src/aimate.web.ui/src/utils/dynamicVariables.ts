/**
 * Dynamic Variables Utility
 *
 * Injects dynamic values into system prompts using Jinja2-style {{ VARIABLE }} syntax.
 * Used by Custom Models to make prompts context-aware.
 */

export interface DynamicVariableContext {
  userName?: string;
  userEmail?: string;
  workspaceName?: string;
  modelName?: string;
  customVariables?: Record<string, string>;
}

/**
 * All supported dynamic variables
 */
export const DYNAMIC_VARIABLES = {
  CURRENT_DATE: {
    pattern: /\{\{\s*CURRENT_DATE\s*\}\}/g,
    description: 'Current date in YYYY-MM-DD format',
    example: '2024-10-27',
    getValue: () => new Date().toISOString().split('T')[0],
  },
  CURRENT_TIME: {
    pattern: /\{\{\s*CURRENT_TIME\s*\}\}/g,
    description: 'Current time in HH:MM:SS format (24hr)',
    example: '14:30:05',
    getValue: () => new Date().toTimeString().split(' ')[0],
  },
  CURRENT_DATETIME: {
    pattern: /\{\{\s*CURRENT_DATETIME\s*\}\}/g,
    description: 'Full date and time',
    example: '2024-10-27 14:30:05',
    getValue: () => {
      const now = new Date();
      return `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    },
  },
  CURRENT_DAY: {
    pattern: /\{\{\s*CURRENT_DAY\s*\}\}/g,
    description: 'Day of the week',
    example: 'Monday',
    getValue: () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  },
  CURRENT_MONTH: {
    pattern: /\{\{\s*CURRENT_MONTH\s*\}\}/g,
    description: 'Current month name',
    example: 'October',
    getValue: () => new Date().toLocaleDateString('en-US', { month: 'long' }),
  },
  CURRENT_YEAR: {
    pattern: /\{\{\s*CURRENT_YEAR\s*\}\}/g,
    description: 'Current year',
    example: '2024',
    getValue: () => new Date().getFullYear().toString(),
  },
  USER_NAME: {
    pattern: /\{\{\s*USER_NAME\s*\}\}/g,
    description: 'Display name of the current user',
    example: 'Alice',
    getValue: (ctx?: DynamicVariableContext) => ctx?.userName || 'User',
  },
  USER_EMAIL: {
    pattern: /\{\{\s*USER_EMAIL\s*\}\}/g,
    description: 'Email of the current user',
    example: 'alice@example.com',
    getValue: (ctx?: DynamicVariableContext) => ctx?.userEmail || '',
  },
  WORKSPACE_NAME: {
    pattern: /\{\{\s*WORKSPACE_NAME\s*\}\}/g,
    description: 'Name of the current workspace',
    example: 'Personal',
    getValue: (ctx?: DynamicVariableContext) => ctx?.workspaceName || 'Default Workspace',
  },
  MODEL_NAME: {
    pattern: /\{\{\s*MODEL_NAME\s*\}\}/g,
    description: 'Name of the base model',
    example: 'GPT-4',
    getValue: (ctx?: DynamicVariableContext) => ctx?.modelName || 'AI Assistant',
  },
} as const;

/**
 * Inject dynamic variables into a text string
 */
export function injectDynamicVariables(
  text: string,
  context?: DynamicVariableContext
): string {
  let result = text;

  // Inject built-in variables
  for (const [name, config] of Object.entries(DYNAMIC_VARIABLES)) {
    result = result.replace(config.pattern, config.getValue(context));
  }

  // Inject custom variables if provided
  if (context?.customVariables) {
    for (const [key, value] of Object.entries(context.customVariables)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
  }

  return result;
}

/**
 * Extract variable names from a text string
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{\s*(\w+)\s*\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Validate that all variables in a text are supported
 */
export function validateVariables(text: string): {
  valid: boolean;
  unknown: string[];
  known: string[];
} {
  const found = extractVariables(text);
  const knownNames = Object.keys(DYNAMIC_VARIABLES);

  const known: string[] = [];
  const unknown: string[] = [];

  for (const variable of found) {
    if (knownNames.includes(variable)) {
      known.push(variable);
    } else {
      unknown.push(variable);
    }
  }

  return {
    valid: unknown.length === 0,
    unknown,
    known,
  };
}

/**
 * Get a preview of what a variable will resolve to
 */
export function previewVariables(context?: DynamicVariableContext): Record<string, string> {
  const preview: Record<string, string> = {};

  for (const [name, config] of Object.entries(DYNAMIC_VARIABLES)) {
    preview[name] = config.getValue(context);
  }

  return preview;
}

/**
 * Format a variable for insertion
 */
export function formatVariable(name: string): string {
  return `{{ ${name} }}`;
}

/**
 * Get documentation for all variables
 */
export function getVariableDocumentation(): Array<{
  name: string;
  description: string;
  example: string;
}> {
  return Object.entries(DYNAMIC_VARIABLES).map(([name, config]) => ({
    name,
    description: config.description,
    example: config.example,
  }));
}

export default {
  injectDynamicVariables,
  extractVariables,
  validateVariables,
  previewVariables,
  formatVariable,
  getVariableDocumentation,
  DYNAMIC_VARIABLES,
};
