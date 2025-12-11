/**
 * Single Quote Session Hook
 * Story Q2.3: Quote Session Detail Page
 *
 * Hook for fetching a single quote session by ID.
 * Follows useState/useCallback pattern from use-quote-sessions.ts
 *
 * AC-Q2.3-1: Fetch session data for display
 * AC-Q2.3-6: Handle not-found case with redirect and toast
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { QuoteSession } from '@/types/quoting';

export interface UseQuoteSessionOptions {
  /** Auto-fetch session on mount (default: true) */
  autoFetch?: boolean;
  /** Redirect to list on not found (default: true) */
  redirectOnNotFound?: boolean;
}

export interface UseQuoteSessionReturn {
  /** The fetched session */
  session: QuoteSession | null;
  /** Loading state for fetch */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Fetch/refresh session */
  fetchSession: () => Promise<void>;
  /** Refresh session */
  refresh: () => Promise<void>;
}

/**
 * API Response types
 */
interface SessionResponse {
  data: QuoteSession | null;
  error: { message: string; code?: string } | null;
}

/**
 * Single quote session hook
 *
 * AC-Q2.3-1: Fetches session data for display
 * AC-Q2.3-6: Redirects to /quoting with error toast on not found
 */
export function useQuoteSession(
  sessionId: string,
  options: UseQuoteSessionOptions = {}
): UseQuoteSessionReturn {
  const { autoFetch = true, redirectOnNotFound = true } = options;
  const router = useRouter();

  const [session, setSession] = useState<QuoteSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch session from API
   */
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError(new Error('Session ID is required'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quoting/${sessionId}`);
      const result: SessionResponse = await response.json();

      if (response.status === 404) {
        // AC-Q2.3-6: Redirect on not found
        if (redirectOnNotFound) {
          toast.error('Quote session not found');
          router.push('/quoting');
        }
        setError(new Error('Quote session not found'));
        return;
      }

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch quote session');
      }

      setSession(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch quote session');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, redirectOnNotFound, router]);

  /**
   * Refresh session
   */
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current && sessionId) {
      hasFetchedRef.current = true;
      fetchSession();
    }
  }, [autoFetch, sessionId, fetchSession]);

  return {
    session,
    isLoading,
    error,
    fetchSession,
    refresh,
  };
}
