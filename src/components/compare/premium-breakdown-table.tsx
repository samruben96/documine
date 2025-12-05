'use client';

/**
 * PremiumBreakdownTable - Premium component comparison
 *
 * Story 10.8: AC-10.8.5
 * Displays premium breakdown across quotes.
 *
 * @module @/components/compare/premium-breakdown-table
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/compare/diff';
import type { QuoteExtraction, DocumentSummary, PremiumBreakdown } from '@/types/compare';

// ============================================================================
// Props
// ============================================================================

export interface PremiumBreakdownTableProps {
  /** Quote extractions to compare */
  extractions: QuoteExtraction[];
  /** Optional document summaries for header fallbacks */
  documents?: DocumentSummary[];
  /** Optional className */
  className?: string;
}

// ============================================================================
// Types
// ============================================================================

interface PremiumRow {
  /** Row identifier */
  id: string;
  /** Display label */
  label: string;
  /** Values per quote (null if not available) */
  values: (number | null)[];
  /** Whether this is a sub-row (indented) */
  isSubRow?: boolean;
  /** Whether this is the total row */
  isTotal?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Find the index of the best (lowest) value.
 */
function findLowestIndex(values: (number | null)[]): number | null {
  const validEntries = values
    .map((v, i) => ({ value: v, index: i }))
    .filter((e): e is { value: number; index: number } => e.value !== null);

  if (validEntries.length < 2) return null;

  // Check if all values are the same
  const firstValue = validEntries[0]!.value;
  if (validEntries.every((e) => e.value === firstValue)) return null;

  // Find lowest
  let lowest = validEntries[0]!;
  for (const entry of validEntries) {
    if (entry.value < lowest.value) {
      lowest = entry;
    }
  }

  return lowest.index;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PremiumBreakdownTable Component
 * AC-10.8.5: Premium breakdown comparison.
 * - Rows: Base, Coverage Premiums (sub-rows), Taxes, Fees, Surplus Tax, Total
 * - Highlight lowest total with green indicator
 */
export function PremiumBreakdownTable({
  extractions,
  documents,
  className,
}: PremiumBreakdownTableProps) {
  // Build headers
  const headers = useMemo(() => {
    return extractions.map((e, i) => {
      if (e.carrierName) return e.carrierName;
      if (documents?.[i]?.filename) return documents[i].filename;
      return `Quote ${i + 1}`;
    });
  }, [extractions, documents]);

  // Build premium breakdown rows
  const rows = useMemo(() => {
    const result: PremiumRow[] = [];

    // Collect all unique coverage names for per-coverage breakdown
    const allCoverages = new Set<string>();
    for (const extraction of extractions) {
      if (extraction.premiumBreakdown?.coveragePremiums) {
        for (const cp of extraction.premiumBreakdown.coveragePremiums) {
          allCoverages.add(cp.coverage);
        }
      }
    }
    const sortedCoverages = Array.from(allCoverages).sort();

    // Base Premium row
    result.push({
      id: 'base-premium',
      label: 'Base Premium',
      values: extractions.map((e) => e.premiumBreakdown?.basePremium ?? null),
    });

    // Per-coverage premium rows (sub-rows)
    for (const coverage of sortedCoverages) {
      result.push({
        id: `coverage-${coverage}`,
        label: coverage,
        values: extractions.map((e) => {
          const cp = e.premiumBreakdown?.coveragePremiums?.find((c) => c.coverage === coverage);
          return cp?.premium ?? null;
        }),
        isSubRow: true,
      });
    }

    // Taxes row
    result.push({
      id: 'taxes',
      label: 'Taxes',
      values: extractions.map((e) => e.premiumBreakdown?.taxes ?? null),
    });

    // Fees row
    result.push({
      id: 'fees',
      label: 'Fees',
      values: extractions.map((e) => e.premiumBreakdown?.fees ?? null),
    });

    // Broker Fee row (if any exist)
    const hasBrokerFee = extractions.some((e) => e.premiumBreakdown?.brokerFee !== null);
    if (hasBrokerFee) {
      result.push({
        id: 'broker-fee',
        label: 'Broker Fee',
        values: extractions.map((e) => e.premiumBreakdown?.brokerFee ?? null),
      });
    }

    // Surplus Lines Tax row (if any exist)
    const hasSurplusTax = extractions.some((e) => e.premiumBreakdown?.surplusLinesTax !== null);
    if (hasSurplusTax) {
      result.push({
        id: 'surplus-lines-tax',
        label: 'Surplus Lines Tax',
        values: extractions.map((e) => e.premiumBreakdown?.surplusLinesTax ?? null),
      });
    }

    // Total Premium row
    result.push({
      id: 'total-premium',
      label: 'Total Premium',
      values: extractions.map((e) => e.premiumBreakdown?.totalPremium ?? e.annualPremium ?? null),
      isTotal: true,
    });

    return result;
  }, [extractions]);

  // Payment plan info
  const paymentPlans = useMemo(() => {
    return extractions.map((e) => e.premiumBreakdown?.paymentPlan ?? null);
  }, [extractions]);
  const hasPaymentPlans = paymentPlans.some((p) => p !== null);

  // Find lowest total index for highlighting
  const totalRow = rows.find((r) => r.isTotal);
  const lowestTotalIndex = totalRow ? findLowestIndex(totalRow.values) : null;

  // Check if any premium breakdown data exists
  const hasData = rows.some((row) => row.values.some((v) => v !== null));

  if (!hasData) {
    return (
      <div className={cn('p-4 text-center text-slate-500', className)}>
        No premium breakdown data available.
      </div>
    );
  }

  return (
    <div
      className={cn('overflow-x-auto', className)}
      data-testid="premium-breakdown-table"
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            {/* Label header */}
            <th
              className={cn(
                'sticky left-0 z-10 bg-slate-50 dark:bg-slate-800',
                'px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400',
                'border-b border-r border-slate-200 dark:border-slate-700',
                'min-w-[180px]'
              )}
            >
              Component
            </th>

            {/* Quote headers */}
            {headers.map((header, index) => (
              <th
                key={index}
                className={cn(
                  'px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-400',
                  'border-b border-slate-200 dark:border-slate-700',
                  'min-w-[140px]'
                )}
              >
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                      'bg-primary/10 text-primary'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate max-w-[100px]">{header}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                row.isTotal && 'bg-slate-50 dark:bg-slate-800 font-semibold',
                row.isTotal && 'border-t-2 border-t-slate-300 dark:border-t-slate-600'
              )}
            >
              {/* Label cell (sticky) */}
              <td
                className={cn(
                  'sticky left-0 z-10 bg-white dark:bg-slate-900',
                  'px-4 py-2 border-b border-r border-slate-200 dark:border-slate-700',
                  'text-slate-700 dark:text-slate-300',
                  row.isSubRow && 'pl-8 text-slate-600 dark:text-slate-400',
                  row.isTotal && 'bg-slate-50 dark:bg-slate-800 font-semibold'
                )}
              >
                {row.label}
              </td>

              {/* Value cells */}
              {row.values.map((value, index) => {
                const isLowest = row.isTotal && lowestTotalIndex === index;
                return (
                  <td
                    key={index}
                    className={cn(
                      'px-4 py-2 text-right border-b border-slate-200 dark:border-slate-700',
                      value === null && 'text-slate-400 italic',
                      isLowest && 'text-green-600 dark:text-green-400',
                      row.isTotal && 'font-semibold'
                    )}
                    aria-label={value !== null ? formatCurrency(value) : 'Not available'}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {value !== null ? formatCurrency(value) : '—'}
                      {isLowest && (
                        <span
                          className="text-green-600 dark:text-green-400 font-bold"
                          aria-label="Best value"
                        >
                          ●
                        </span>
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment plan info */}
      {hasPaymentPlans && (
        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700">
          <strong>Payment Plans:</strong>{' '}
          {headers.map((header, index) => (
            <span key={index}>
              {header}: {paymentPlans[index] || 'Not specified'}
              {index < headers.length - 1 && ' | '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
