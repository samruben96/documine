/**
 * Diff Engine Formatters
 *
 * Value formatting utilities for currency, dates, and display values.
 *
 * @module @/lib/compare/diff/formatters
 */

import type { FieldType } from './types';

/**
 * Format a numeric value as currency.
 */
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date string for display.
 * Handles ISO date strings (YYYY-MM-DD) correctly regardless of timezone.
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    // Parse as local date to avoid timezone offset issues
    // ISO date strings like "2024-01-15" get parsed in UTC which can shift the day
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]!, 10);
      const month = parseInt(parts[1]!, 10) - 1; // JS months are 0-indexed
      const day = parseInt(parts[2]!, 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    // Fallback for non-ISO formats
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a value based on its field type.
 */
export function formatValue(
  value: number | string | null,
  fieldType: FieldType
): string {
  if (value === null || value === undefined) return '—';

  switch (fieldType) {
    case 'coverage_limit':
    case 'deductible':
    case 'premium':
      return formatCurrency(value as number);
    case 'date':
      return formatDate(value as string);
    case 'count':
      return String(value);
    default:
      return String(value);
  }
}
