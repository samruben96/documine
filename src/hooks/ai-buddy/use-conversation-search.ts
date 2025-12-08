/**
 * useConversationSearch Hook
 * Story 16.5: Conversation Search (FR4)
 *
 * Full-text search across AI Buddy conversations with debouncing.
 * Uses PostgreSQL tsvector/ts_rank for ranked results with highlighted snippets.
 *
 * AC-16.5.2: Typing query searches across all user's conversations
 * AC-16.5.5: Search results return within 1 second
 */
'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

/**
 * Search result from PostgreSQL full-text search
 * AC-16.5.3: Results show conversation title, matched text snippet (highlighted), project name, date
 */
export interface ConversationSearchResult {
  conversationId: string;
  conversationTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  matchedText: string;
  highlightedText: string; // HTML with <mark> tags
  messageId: string;
  createdAt: string;
}

interface UseConversationSearchReturn {
  results: ConversationSearchResult[];
  isLoading: boolean;
  error: Error | null;
}

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 300;

/** Minimum query length before searching */
const MIN_QUERY_LENGTH = 2;

/**
 * Hook for searching conversations using PostgreSQL full-text search
 *
 * @param query - Search query string
 * @returns Search results, loading state, and error
 *
 * @example
 * const { results, isLoading, error } = useConversationSearch('liability');
 */
export function useConversationSearch(query: string): UseConversationSearchReturn {
  const [results, setResults] = useState<ConversationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce query to prevent excessive API calls
  const [debouncedQuery] = useDebounce(query, DEBOUNCE_MS);

  useEffect(() => {
    // Clear results and don't search for short queries
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    const searchConversations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/ai-buddy/conversations?search=${encodeURIComponent(debouncedQuery)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const { data, error: apiError } = await response.json();

        if (apiError) {
          throw new Error(apiError.message || 'Search failed');
        }

        setResults(data || []);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    searchConversations();

    // Cleanup: abort pending request on query change or unmount
    return () => {
      abortController.abort();
    };
  }, [debouncedQuery]);

  return { results, isLoading, error };
}
