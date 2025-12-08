/**
 * ConversationSearch Component
 * Story 16.5: Conversation Search (FR4)
 *
 * Command palette dialog for searching across AI Buddy conversations.
 * Uses shadcn Command component (cmdk) for consistent UX.
 *
 * AC-16.5.1: Cmd/Ctrl+K opens search dialog
 * AC-16.5.3: Results show conversation title, matched text snippet (highlighted), project name, date
 * AC-16.5.4: Clicking result opens that conversation
 * AC-16.5.6: No results shows "No conversations found for '[query]'"
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatDistanceToNow } from 'date-fns';
import {
  useConversationSearch,
  type ConversationSearchResult,
} from '@/hooks/ai-buddy/use-conversation-search';
import { useAiBuddyContext } from '@/contexts/ai-buddy-context';
import { MessageSquare, Folder, Calendar, Loader2 } from 'lucide-react';

interface ConversationSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationSearch({ open, onOpenChange }: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const { results, isLoading, error } = useConversationSearch(query);
  const { setActiveConversation } = useAiBuddyContext();

  /**
   * Handle selecting a search result
   * AC-16.5.4: Clicking result opens that conversation
   */
  const handleSelect = useCallback(
    (conversationId: string) => {
      setActiveConversation(conversationId);
      onOpenChange(false);
      setQuery('');
    },
    [setActiveConversation, onOpenChange]
  );

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search conversations..."
        value={query}
        onValueChange={setQuery}
        data-testid="conversation-search-input"
      />
      <CommandList>
        {/* Loading state */}
        {isLoading && query.length >= 2 && (
          <div
            className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
            data-testid="search-loading"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="py-6 text-center text-sm text-destructive"
            data-testid="search-error"
          >
            Search failed. Please try again.
          </div>
        )}

        {/* No results - AC-16.5.6 */}
        {!isLoading && !error && query.length >= 2 && results.length === 0 && (
          <CommandEmpty data-testid="search-no-results">
            No conversations found for &quot;{query}&quot;
          </CommandEmpty>
        )}

        {/* Results - AC-16.5.3 */}
        {!isLoading && !error && results.length > 0 && (
          <CommandGroup heading="Conversations">
            {results.map((result) => (
              <SearchResultItem
                key={`${result.conversationId}-${result.messageId}`}
                result={result}
                onSelect={handleSelect}
              />
            ))}
          </CommandGroup>
        )}

        {/* Initial state - prompt user to type */}
        {query.length < 2 && (
          <div
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="search-prompt"
          >
            Type at least 2 characters to search
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Individual search result item
 */
interface SearchResultItemProps {
  result: ConversationSearchResult;
  onSelect: (conversationId: string) => void;
}

function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  return (
    <CommandItem
      value={result.conversationId}
      onSelect={() => onSelect(result.conversationId)}
      className="flex flex-col items-start gap-1 py-3"
      data-testid="search-result"
    >
      {/* Conversation title */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        {result.conversationTitle || 'Untitled conversation'}
      </div>

      {/* Highlighted text snippet - AC-16.5.3 */}
      <div
        className="line-clamp-2 text-xs text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: result.highlightedText }}
        data-testid="search-result-snippet"
      />

      {/* Metadata: project and date */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {result.projectName && (
          <span className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            {result.projectName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
        </span>
      </div>
    </CommandItem>
  );
}
