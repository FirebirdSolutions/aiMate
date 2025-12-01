/**
 * PromptSuggestions Component
 *
 * Displays clickable "starter chips" for a custom model.
 * These appear above the chat input when starting a new conversation.
 */

import { Button } from './ui/button';
import { PromptSuggestionDto } from '../api/types';

interface PromptSuggestionsProps {
  suggestions: PromptSuggestionDto[];
  onSelect: (text: string) => void;
  className?: string;
  maxVisible?: number;
}

export function PromptSuggestions({
  suggestions,
  onSelect,
  className = '',
  maxVisible = 4,
}: PromptSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.slice(0, maxVisible);

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {visibleSuggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          className="text-sm hover:bg-primary/10 hover:border-primary/50 transition-colors"
          onClick={() => onSelect(suggestion.text)}
        >
          {suggestion.icon && (
            <span className="mr-1.5">{suggestion.icon}</span>
          )}
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
}

/**
 * Compact version for sidebar or model cards
 */
interface PromptSuggestionsCompactProps {
  suggestions: PromptSuggestionDto[];
  maxVisible?: number;
}

export function PromptSuggestionsCompact({
  suggestions,
  maxVisible = 3,
}: PromptSuggestionsCompactProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.slice(0, maxVisible);
  const remaining = suggestions.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleSuggestions.map((suggestion) => (
        <span
          key={suggestion.id}
          className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
        >
          {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
          {suggestion.text.length > 20 ? suggestion.text.substring(0, 20) + '...' : suggestion.text}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

export default PromptSuggestions;
