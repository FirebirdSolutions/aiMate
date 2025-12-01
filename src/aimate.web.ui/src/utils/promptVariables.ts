/**
 * Prompt Variables Utility
 *
 * Expands template variables in user messages before sending to the LLM.
 * Supports system variables like {{DATE}}, {{TIME}}, {{USER_NAME}}, etc.
 *
 * Based on OpenWebUI's prompt variable system.
 */

export interface PromptVariableContext {
  userName?: string;
  userLanguage?: string;
  userLocation?: string | null; // null if not available/permitted
}

/**
 * Get all supported system variables with their current values
 */
export function getSystemVariables(context: PromptVariableContext = {}): Record<string, string> {
  const now = new Date();

  // Weekday names
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    // Date and Time
    'CURRENT_DATE': now.toLocaleDateString(),
    'CURRENT_DATETIME': now.toLocaleString(),
    'CURRENT_TIME': now.toLocaleTimeString(),
    'CURRENT_TIMEZONE': timezone,
    'CURRENT_WEEKDAY': weekdays[now.getDay()],

    // ISO formats (useful for APIs)
    'DATE_ISO': now.toISOString().split('T')[0],
    'DATETIME_ISO': now.toISOString(),

    // User info
    'USER_NAME': context.userName || 'User',
    'USER_LANGUAGE': context.userLanguage || navigator.language || 'en',
    'USER_LOCATION': context.userLocation || 'Location not available',

    // System info
    'PLATFORM': navigator.platform || 'Unknown',
    'BROWSER': getBrowserName(),

    // Clipboard - handled specially (async)
    // 'CLIPBOARD': handled in expandVariablesAsync
  };
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
}

/**
 * Expand prompt variables in a string (synchronous version)
 * Does not handle {{CLIPBOARD}} - use expandVariablesAsync for that
 */
export function expandVariables(text: string, context: PromptVariableContext = {}): string {
  const variables = getSystemVariables(context);

  // Match {{VARIABLE_NAME}} pattern
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const upperName = varName.toUpperCase();
    if (upperName in variables) {
      return variables[upperName];
    }
    // Unknown variable - leave as is (might be a custom variable)
    return match;
  });
}

/**
 * Expand prompt variables including async ones like clipboard
 */
export async function expandVariablesAsync(
  text: string,
  context: PromptVariableContext = {}
): Promise<string> {
  // Check if clipboard variable is used
  const hasClipboard = /\{\{CLIPBOARD\}\}/i.test(text);

  let clipboardContent = '';
  if (hasClipboard) {
    try {
      clipboardContent = await navigator.clipboard.readText();
    } catch (err) {
      console.warn('[promptVariables] Could not read clipboard:', err);
      clipboardContent = '[Clipboard access denied]';
    }
  }

  // Get all variables
  const variables = getSystemVariables(context);

  // Add clipboard
  variables['CLIPBOARD'] = clipboardContent;

  // Match {{VARIABLE_NAME}} pattern
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const upperName = varName.toUpperCase();
    if (upperName in variables) {
      return variables[upperName];
    }
    return match;
  });
}

/**
 * Check if text contains any known variables
 */
export function hasVariables(text: string): boolean {
  return /\{\{\w+\}\}/.test(text);
}

/**
 * Get list of variables used in text
 */
export function getUsedVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g);
  return [...matches].map(m => m[1].toUpperCase());
}

/**
 * Get list of all supported variable names
 */
export function getSupportedVariables(): string[] {
  return [
    'CURRENT_DATE',
    'CURRENT_DATETIME',
    'CURRENT_TIME',
    'CURRENT_TIMEZONE',
    'CURRENT_WEEKDAY',
    'DATE_ISO',
    'DATETIME_ISO',
    'USER_NAME',
    'USER_LANGUAGE',
    'USER_LOCATION',
    'PLATFORM',
    'BROWSER',
    'CLIPBOARD',
  ];
}

/**
 * Format variable for display (with description)
 */
export function getVariableInfo(): Array<{ name: string; description: string; example: string }> {
  const now = new Date();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return [
    { name: 'CURRENT_DATE', description: 'Current date in local format', example: now.toLocaleDateString() },
    { name: 'CURRENT_DATETIME', description: 'Current date and time', example: now.toLocaleString() },
    { name: 'CURRENT_TIME', description: 'Current time', example: now.toLocaleTimeString() },
    { name: 'CURRENT_TIMEZONE', description: 'User timezone', example: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { name: 'CURRENT_WEEKDAY', description: 'Day of the week', example: weekdays[now.getDay()] },
    { name: 'DATE_ISO', description: 'ISO date format', example: now.toISOString().split('T')[0] },
    { name: 'DATETIME_ISO', description: 'ISO datetime format', example: now.toISOString() },
    { name: 'USER_NAME', description: 'User display name', example: 'John' },
    { name: 'USER_LANGUAGE', description: 'Browser language', example: navigator.language },
    { name: 'USER_LOCATION', description: 'User location (if permitted)', example: 'Auckland, NZ' },
    { name: 'PLATFORM', description: 'Operating system', example: navigator.platform },
    { name: 'BROWSER', description: 'Browser name', example: getBrowserName() },
    { name: 'CLIPBOARD', description: 'Clipboard contents', example: '[clipboard text]' },
  ];
}

export default {
  expandVariables,
  expandVariablesAsync,
  hasVariables,
  getUsedVariables,
  getSupportedVariables,
  getVariableInfo,
  getSystemVariables,
};
