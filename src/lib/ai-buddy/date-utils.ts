/**
 * Date Utilities for AI Buddy Analytics
 * Story 20.3: Usage Analytics Dashboard
 *
 * Shared date range calculation utilities for analytics API routes.
 */

import type { AnalyticsPeriod } from '@/types/ai-buddy';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculate date range based on period type
 *
 * @param period - The period type ('week', 'month', '30days', 'custom')
 * @param customStartDate - Optional custom start date (ISO string)
 * @param customEndDate - Optional custom end date (ISO string)
 * @returns Object with startDate and endDate
 *
 * @example
 * ```ts
 * const { startDate, endDate } = getDateRange('week');
 * // Returns last 7 days range
 *
 * const { startDate, endDate } = getDateRange('custom', '2024-01-01', '2024-01-31');
 * // Returns custom range
 * ```
 */
export function getDateRange(
  period: AnalyticsPeriod,
  customStartDate?: string,
  customEndDate?: string
): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

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
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      break;
    case 'custom':
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        const customEnd = new Date(customEndDate);
        customEnd.setHours(23, 59, 59, 999);
        return { startDate, endDate: customEnd };
      }
      // Default to last 30 days if custom but no dates provided
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
  }

  return { startDate, endDate };
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 *
 * @param date - Date to format
 * @returns ISO date string
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}
