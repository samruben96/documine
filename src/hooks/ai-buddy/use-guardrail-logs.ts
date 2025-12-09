/**
 * AI Buddy Guardrail Logs Hook
 * Story 19.2: Enforcement Logging
 *
 * Hook for fetching and filtering guardrail enforcement logs.
 * Provides date filtering, pagination, and refetch capabilities.
 *
 * AC-19.2.4: Supports table display with logs data
 * AC-19.2.6: Supports date range filtering
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GuardrailEnforcementEvent, GuardrailEnforcementLogsResponse } from '@/types/ai-buddy';

export interface UseGuardrailLogsParams {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface UseGuardrailLogsReturn {
  logs: GuardrailEnforcementEvent[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface ApiResponse {
  data?: GuardrailEnforcementLogsResponse;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Hook for fetching guardrail enforcement logs
 *
 * @param params - Optional filtering parameters
 * @returns Logs data, loading state, error, and pagination helpers
 *
 * @example
 * ```tsx
 * const { logs, isLoading, error, totalCount, hasMore, loadMore } = useGuardrailLogs({
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-01-31'),
 *   limit: 20,
 * });
 *
 * // Load more logs
 * if (hasMore) {
 *   await loadMore();
 * }
 * ```
 */
export function useGuardrailLogs(params?: UseGuardrailLogsParams): UseGuardrailLogsReturn {
  const [logs, setLogs] = useState<GuardrailEnforcementEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const limit = params?.limit ?? 20;

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  // Track params for comparison
  const paramsRef = useRef(params);

  /**
   * Build query string from params
   */
  const buildQueryString = useCallback(
    (currentOffset: number): string => {
      const searchParams = new URLSearchParams();

      if (params?.startDate) {
        searchParams.set('startDate', params.startDate.toISOString());
      }

      if (params?.endDate) {
        searchParams.set('endDate', params.endDate.toISOString());
      }

      searchParams.set('limit', limit.toString());
      searchParams.set('offset', currentOffset.toString());

      return searchParams.toString();
    },
    [params?.startDate, params?.endDate, limit]
  );

  /**
   * Fetch logs from API
   */
  const fetchLogs = useCallback(
    async (append: boolean = false): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const currentOffset = append ? offset : 0;

      try {
        const queryString = buildQueryString(currentOffset);
        const response = await fetch(`/api/ai-buddy/admin/guardrails/logs?${queryString}`);

        if (!response.ok) {
          const errorData: ApiResponse = await response.json().catch(() => ({}));
          throw new Error(errorData?.error?.message || `Failed to fetch logs: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (!result.data) {
          throw new Error('No data returned from API');
        }

        const { logs: newLogs, total, hasMore: more } = result.data;

        if (append) {
          setLogs((prev) => [...prev, ...newLogs]);
        } else {
          setLogs(newLogs);
        }

        setTotalCount(total);
        setHasMore(more);

        if (append) {
          setOffset((prev) => prev + newLogs.length);
        } else {
          setOffset(newLogs.length);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch logs');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString, offset]
  );

  /**
   * Load more logs (pagination)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchLogs(true);
  }, [fetchLogs, hasMore, isLoading]);

  /**
   * Refetch logs from the beginning
   */
  const refetch = useCallback(async (): Promise<void> => {
    setOffset(0);
    await fetchLogs(false);
  }, [fetchLogs]);

  // Check if params changed
  const paramsChanged = useCallback(() => {
    const prev = paramsRef.current;
    const curr = params;

    if (!prev && !curr) return false;
    if (!prev || !curr) return true;

    return (
      prev.startDate?.getTime() !== curr.startDate?.getTime() ||
      prev.endDate?.getTime() !== curr.endDate?.getTime() ||
      prev.limit !== curr.limit
    );
  }, [params]);

  // Fetch logs on mount and when params change
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchLogs(false);
    } else if (paramsChanged()) {
      paramsRef.current = params;
      setOffset(0);
      fetchLogs(false);
    }
  }, [fetchLogs, params, paramsChanged]);

  return {
    logs,
    isLoading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refetch,
  };
}
