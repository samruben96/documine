/**
 * Quote Sessions Hook
 * Story Q2.1: Quote Sessions List Page
 *
 * Hook for fetching and mutating the quote sessions list.
 * Follows useState/useCallback pattern from use-projects.ts
 *
 * AC-Q2.1-1: Sessions sorted by most recently updated first
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { QuoteSession, QuoteSessionStatus } from '@/types/quoting';

export interface UseQuoteSessionsOptions {
  /** Auto-fetch sessions on mount (default: true) */
  autoFetch?: boolean;
  /** Filter by status (optional) */
  status?: QuoteSessionStatus | QuoteSessionStatus[];
  /** Search by prospect name (optional) */
  search?: string;
}

export interface UseQuoteSessionsReturn {
  /** List of sessions, sorted by updated_at DESC */
  sessions: QuoteSession[];
  /** Loading state for list fetch */
  isLoading: boolean;
  /** Loading state for mutations */
  isMutating: boolean;
  /** Error state */
  error: Error | null;
  /** Fetch/refresh sessions list */
  fetchSessions: () => Promise<void>;
  /** Delete a session */
  deleteSession: (id: string) => Promise<void>;
  /** Duplicate a session */
  duplicateSession: (id: string) => Promise<QuoteSession | null>;
  /** Refresh sessions list */
  refresh: () => Promise<void>;
}

/**
 * API Response types
 */
interface SessionsListResponse {
  data: QuoteSession[] | null;
  error: { message: string; code?: string } | null;
}

interface SessionMutationResponse {
  data: QuoteSession | null;
  error: { message: string; code?: string } | null;
}

interface DeleteResponse {
  data: { deleted: boolean } | null;
  error: { message: string; code?: string } | null;
}

/**
 * Quote sessions management hook
 *
 * AC-Q2.1-1: Sessions sorted by most recently updated first
 */
export function useQuoteSessions(
  options: UseQuoteSessionsOptions = {}
): UseQuoteSessionsReturn {
  const { autoFetch = true, status, search } = options;

  const [sessions, setSessions] = useState<QuoteSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch sessions list from API
   */
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (status) {
        const statusValues = Array.isArray(status) ? status.join(',') : status;
        params.set('status', statusValues);
      }

      if (search) {
        params.set('search', search);
      }

      const url = `/api/quoting${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result: SessionsListResponse = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch quote sessions');
      }

      setSessions(result.data ?? []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch quote sessions');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  /**
   * Delete a session with optimistic update
   *
   * AC-Q2.5-3: Session removed from list after deletion
   */
  const deleteSession = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);

      // Optimistic update - remove from list
      const previousSessions = [...sessions];
      setSessions((prev) => prev.filter((s) => s.id !== id));

      try {
        const response = await fetch(`/api/quoting/${id}`, {
          method: 'DELETE',
        });

        const result: DeleteResponse = await response.json();

        if (!response.ok || result.error) {
          // Revert on failure
          setSessions(previousSessions);
          throw new Error(result.error?.message ?? 'Failed to delete session');
        }
      } catch (err) {
        // Revert on error
        setSessions(previousSessions);
        const error = err instanceof Error ? err : new Error('Failed to delete session');
        setError(error);
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [sessions]
  );

  /**
   * Duplicate a session
   *
   * AC-Q2.5-4: New session created with "(Copy)" suffix
   * AC-Q2.5-5: Redirect to new session after duplication
   */
  const duplicateSession = useCallback(
    async (id: string): Promise<QuoteSession | null> => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await fetch(`/api/quoting/${id}/duplicate`, {
          method: 'POST',
        });

        const result: SessionMutationResponse = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to duplicate session');
        }

        // Add new session to list (at the top since it's most recently updated)
        if (result.data) {
          setSessions((prev) => [result.data!, ...prev]);
          return result.data;
        }

        return null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to duplicate session');
        setError(error);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  /**
   * Refresh sessions list
   */
  const refresh = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSessions();
    }
  }, [autoFetch, fetchSessions]);

  return {
    sessions,
    isLoading,
    isMutating,
    error,
    fetchSessions,
    deleteSession,
    duplicateSession,
    refresh,
  };
}
