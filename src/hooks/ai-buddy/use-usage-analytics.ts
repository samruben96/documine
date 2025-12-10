/**
 * Usage Analytics Hook
 * Story 20.3: Usage Analytics Dashboard
 *
 * Provides state management for fetching and managing usage analytics data.
 * AC-20.3.1 through AC-20.3.8
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  UsageAnalyticsResponse,
  UsageSummary,
  UserUsageStats,
  UsageTrend,
  AnalyticsPeriod,
} from '@/types/ai-buddy';

export interface AnalyticsDateRange {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
}

interface UseUsageAnalyticsOptions {
  /** Initial period (default: '30days') */
  initialPeriod?: AnalyticsPeriod;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseUsageAnalyticsReturn {
  // Data
  summary: UsageSummary | null;
  byUser: UserUsageStats[];
  trends: UsageTrend[];

  // State
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;

  // Date range
  dateRange: AnalyticsDateRange;
  setDateRange: (range: AnalyticsDateRange) => void;

  // Actions
  refetch: () => Promise<void>;
  exportCsv: () => Promise<void>;
}

/**
 * Calculate default date range based on period
 */
function getDefaultDateRange(period: AnalyticsPeriod): AnalyticsDateRange {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case '30days':
    default:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      break;
  }

  startDate.setHours(0, 0, 0, 0);

  return { period, startDate, endDate: today };
}

/**
 * Hook for managing usage analytics data
 *
 * @example
 * ```tsx
 * const {
 *   summary,
 *   byUser,
 *   trends,
 *   isLoading,
 *   error,
 *   dateRange,
 *   setDateRange,
 *   exportCsv,
 * } = useUsageAnalytics();
 * ```
 */
export function useUsageAnalytics(
  options: UseUsageAnalyticsOptions = {}
): UseUsageAnalyticsReturn {
  const { initialPeriod = '30days', autoFetch = true } = options;

  // State
  const [data, setData] = useState<UsageAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRangeState] = useState<AnalyticsDateRange>(() =>
    getDefaultDateRange(initialPeriod)
  );

  /**
   * Fetch analytics data from API
   */
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: dateRange.period,
      });

      if (dateRange.period === 'custom') {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      const response = await fetch(`/api/ai-buddy/admin/analytics?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const result: UsageAnalyticsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  /**
   * Set date range and trigger refetch
   */
  const setDateRange = useCallback((range: AnalyticsDateRange) => {
    setDateRangeState(range);
  }, []);

  /**
   * Export data as CSV (AC-20.3.6)
   */
  const exportCsv = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        period: dateRange.period,
      });

      if (dateRange.period === 'custom') {
        params.set('startDate', dateRange.startDate.toISOString());
        params.set('endDate', dateRange.endDate.toISOString());
      }

      const response = await fetch(`/api/ai-buddy/admin/analytics/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export analytics');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'usage_analytics.csv';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to export CSV');
    }
  }, [dateRange]);

  // Initial fetch and refetch on date range change
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, autoFetch]);

  // Derived state
  const isEmpty = useMemo(() => {
    if (!data) return true;
    return (
      data.summary.totalConversations === 0 &&
      data.summary.activeUsers === 0 &&
      data.byUser.length === 0
    );
  }, [data]);

  return {
    // Data
    summary: data?.summary || null,
    byUser: data?.byUser || [],
    trends: data?.trends || [],

    // State
    isLoading,
    error,
    isEmpty,

    // Date range
    dateRange,
    setDateRange,

    // Actions
    refetch: fetchAnalytics,
    exportCsv,
  };
}
