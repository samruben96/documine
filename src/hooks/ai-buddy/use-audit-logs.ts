/**
 * AI Buddy Audit Logs Hook
 * Story 20.4: Audit Log Interface
 *
 * Hook for fetching, filtering, and paginating audit logs.
 * Provides state management for the audit log interface.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AuditLogTableEntry } from '@/app/api/admin/audit-logs/route';
import type { TranscriptData } from '@/app/api/admin/audit-logs/[conversationId]/transcript/route';

/**
 * Filter options for audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  hasGuardrailEvents?: boolean;
}

/**
 * Options for the useAuditLogs hook
 */
export interface UseAuditLogsOptions {
  /** Initial filter values */
  initialFilters?: AuditLogFilters;
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Page size (default 25) */
  pageSize?: number;
}

/**
 * Return type for the useAuditLogs hook
 */
export interface UseAuditLogsReturn {
  /** Audit log entries */
  logs: AuditLogTableEntry[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Total count of entries */
  totalCount: number;
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Current filters */
  filters: AuditLogFilters;
  /** Update filters */
  setFilters: (filters: AuditLogFilters) => void;
  /** Update current page */
  setPage: (page: number) => void;
  /** Fetch transcript for a conversation */
  fetchTranscript: (conversationId: string) => Promise<TranscriptData>;
  /** Export logs as PDF or CSV */
  exportLogs: (format: 'pdf' | 'csv', includeTranscripts?: boolean) => Promise<string>;
  /** Refetch current data */
  refetch: () => Promise<void>;
}

/**
 * API response structure
 */
interface ApiResponse {
  data?: {
    entries: AuditLogTableEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Hook for managing audit logs data
 *
 * @example
 * ```tsx
 * const {
 *   logs,
 *   isLoading,
 *   error,
 *   totalCount,
 *   page,
 *   setPage,
 *   filters,
 *   setFilters,
 * } = useAuditLogs({ pageSize: 25 });
 * ```
 */
export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const {
    initialFilters = {},
    initialPage = 1,
    pageSize: initialPageSize = 25,
  } = options;

  // State
  const [logs, setLogs] = useState<AuditLogTableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  // Track filters/page for comparison
  const filtersRef = useRef(filters);
  const pageRef = useRef(page);

  /**
   * Build query string from filters and pagination
   */
  const buildQueryString = useCallback(
    (currentFilters: AuditLogFilters, currentPage: number): string => {
      const params = new URLSearchParams();

      if (currentFilters.userId) {
        params.set('userId', currentFilters.userId);
      }

      if (currentFilters.startDate) {
        params.set('startDate', currentFilters.startDate.toISOString());
      }

      if (currentFilters.endDate) {
        params.set('endDate', currentFilters.endDate.toISOString());
      }

      if (currentFilters.search) {
        params.set('search', currentFilters.search);
      }

      if (currentFilters.hasGuardrailEvents) {
        params.set('hasGuardrailEvents', 'true');
      }

      params.set('page', currentPage.toString());
      params.set('limit', pageSize.toString());

      return params.toString();
    },
    [pageSize]
  );

  /**
   * Fetch audit logs from API
   */
  const fetchLogs = useCallback(
    async (currentFilters: AuditLogFilters, currentPage: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(currentFilters, currentPage);
        const response = await fetch(`/api/admin/audit-logs?${queryString}`);

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

        setLogs(result.data.entries);
        setTotalCount(result.data.total);
        setTotalPages(result.data.totalPages);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch logs');
        setError(error);
        setLogs([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString]
  );

  /**
   * Refetch current data
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchLogs(filters, page);
  }, [fetchLogs, filters, page]);

  /**
   * Update filters and reset to page 1
   */
  const handleSetFilters = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  /**
   * Fetch transcript for a conversation
   */
  const fetchTranscript = useCallback(async (conversationId: string): Promise<TranscriptData> => {
    const response = await fetch(`/api/admin/audit-logs/${conversationId}/transcript`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Failed to fetch transcript: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }, []);

  /**
   * Export logs as PDF or CSV
   */
  const exportLogs = useCallback(async (
    format: 'pdf' | 'csv',
    includeTranscripts: boolean = false
  ): Promise<string> => {
    const response = await fetch('/api/admin/audit-logs/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        filters: {
          userId: filters.userId,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          search: filters.search,
          hasGuardrailEvents: filters.hasGuardrailEvents,
        },
        includeTranscripts,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Failed to export: ${response.status}`);
    }

    if (format === 'csv') {
      // For CSV, response is the file itself
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      return url;
    } else {
      // For PDF, response is JSON data for client-side generation
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return JSON.stringify(result.data);
    }
  }, [filters]);

  // Check if filters or page changed
  const filtersChanged = useCallback(() => {
    const prev = filtersRef.current;
    const curr = filters;

    return (
      prev.userId !== curr.userId ||
      prev.startDate?.getTime() !== curr.startDate?.getTime() ||
      prev.endDate?.getTime() !== curr.endDate?.getTime() ||
      prev.search !== curr.search ||
      prev.hasGuardrailEvents !== curr.hasGuardrailEvents
    );
  }, [filters]);

  // Fetch logs on mount and when filters/page change
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchLogs(filters, page);
    } else if (filtersChanged() || pageRef.current !== page) {
      filtersRef.current = filters;
      pageRef.current = page;
      fetchLogs(filters, page);
    }
  }, [fetchLogs, filters, page, filtersChanged]);

  return {
    logs,
    isLoading,
    error,
    totalCount,
    page,
    pageSize,
    totalPages,
    filters,
    setFilters: handleSetFilters,
    setPage,
    fetchTranscript,
    exportLogs,
    refetch,
  };
}
