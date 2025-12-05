'use client';

/**
 * PremiumBreakdownSection - Premium cost breakdown for one-pager
 *
 * Story 10.9: AC-10.9.4
 * Displays premium breakdown in the one-pager.
 *
 * @module @/components/one-pager/premium-breakdown-section
 */

import { useMemo } from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/compare/diff';
import type { QuoteExtraction } from '@/types/compare';

// ============================================================================
// Props
// ============================================================================

export interface PremiumBreakdownSectionProps {
  /** Quote extractions */
  extractions: QuoteExtraction[];
  /** Primary color for styling */
  primaryColor: string;
  /** Whether this is comparison mode */
  isComparison: boolean;
}

// ============================================================================
// Single Quote Mode
// ============================================================================

interface SingleQuotePremiumProps {
  extraction: QuoteExtraction;
  primaryColor: string;
}

function SingleQuotePremium({ extraction, primaryColor }: SingleQuotePremiumProps) {
  const breakdown = extraction.premiumBreakdown;
  const totalPremium = breakdown?.totalPremium ?? extraction.annualPremium;

  if (!totalPremium) {
    return null;
  }

  // Collect non-null breakdown items
  const items: { label: string; value: number }[] = [];

  if (breakdown?.basePremium) {
    items.push({ label: 'Base Premium', value: breakdown.basePremium });
  }

  // Per-coverage premiums
  if (breakdown?.coveragePremiums) {
    for (const cp of breakdown.coveragePremiums) {
      items.push({ label: cp.coverage, value: cp.premium });
    }
  }

  if (breakdown?.taxes) {
    items.push({ label: 'Taxes', value: breakdown.taxes });
  }

  if (breakdown?.fees) {
    items.push({ label: 'Fees', value: breakdown.fees });
  }

  if (breakdown?.brokerFee) {
    items.push({ label: 'Broker Fee', value: breakdown.brokerFee });
  }

  if (breakdown?.surplusLinesTax) {
    items.push({ label: 'Surplus Lines Tax', value: breakdown.surplusLinesTax });
  }

  return (
    <div className="space-y-3">
      {/* Total prominently displayed */}
      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Total Annual Premium
        </span>
        <span
          className="text-xl font-bold"
          style={{ color: primaryColor }}
        >
          {formatCurrency(totalPremium)}
        </span>
      </div>

      {/* Breakdown items */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-slate-500">{item.label}</span>
              <span className="text-slate-700 dark:text-slate-300">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Payment plan if available */}
      {breakdown?.paymentPlan && (
        <p className="text-xs text-slate-500">
          Payment Plan: {breakdown.paymentPlan}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Comparison Mode
// ============================================================================

interface ComparisonPremiumProps {
  extractions: QuoteExtraction[];
  primaryColor: string;
}

function ComparisonPremium({ extractions, primaryColor }: ComparisonPremiumProps) {
  // Find lowest total for highlighting
  const { lowestIndex, totals } = useMemo(() => {
    const totals = extractions.map(
      (e) => e.premiumBreakdown?.totalPremium ?? e.annualPremium ?? null
    );

    const validTotals = totals
      .map((v, i) => ({ value: v, index: i }))
      .filter((e): e is { value: number; index: number } => e.value !== null);

    if (validTotals.length < 2) {
      return { lowestIndex: null, totals };
    }

    // Check if all same
    const firstValue = validTotals[0]!.value;
    if (validTotals.every((e) => e.value === firstValue)) {
      return { lowestIndex: null, totals };
    }

    // Find lowest
    let lowest = validTotals[0]!;
    for (const entry of validTotals) {
      if (entry.value < lowest.value) {
        lowest = entry;
      }
    }

    return { lowestIndex: lowest.index, totals };
  }, [extractions]);

  // Savings calculation
  const savings = useMemo(() => {
    if (lowestIndex === null) return null;
    const lowestValue = totals[lowestIndex];
    if (lowestValue === null || lowestValue === undefined) return null;

    const otherTotals = totals.filter((t, i) => t !== null && i !== lowestIndex) as number[];
    if (otherTotals.length === 0) return null;

    const highestOther = Math.max(...otherTotals);
    return highestOther - lowestValue;
  }, [lowestIndex, totals]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">
              Quote
            </th>
            <th className="text-right p-2 font-medium text-slate-600 dark:text-slate-400">
              Total Premium
            </th>
            <th className="text-right p-2 font-medium text-slate-600 dark:text-slate-400">
              Base
            </th>
            <th className="text-right p-2 font-medium text-slate-600 dark:text-slate-400">
              Taxes & Fees
            </th>
          </tr>
        </thead>
        <tbody>
          {extractions.map((extraction, index) => {
            const breakdown = extraction.premiumBreakdown;
            const total = breakdown?.totalPremium ?? extraction.annualPremium;
            const isLowest = index === lowestIndex;
            const taxesAndFees =
              (breakdown?.taxes ?? 0) +
              (breakdown?.fees ?? 0) +
              (breakdown?.brokerFee ?? 0) +
              (breakdown?.surplusLinesTax ?? 0);

            return (
              <tr
                key={index}
                className={cn(
                  index % 2 === 1 && 'bg-slate-50/50 dark:bg-slate-800/50',
                  isLowest && 'bg-green-50/50 dark:bg-green-900/10'
                )}
              >
                <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {index + 1}
                    </span>
                    <span>{extraction.carrierName || `Quote ${index + 1}`}</span>
                    {isLowest && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                  </div>
                </td>
                <td
                  className={cn(
                    'p-2 text-right font-semibold',
                    isLowest
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-900 dark:text-slate-100'
                  )}
                >
                  {total !== null ? formatCurrency(total) : '—'}
                </td>
                <td className="p-2 text-right text-slate-600 dark:text-slate-400">
                  {breakdown?.basePremium ? formatCurrency(breakdown.basePremium) : '—'}
                </td>
                <td className="p-2 text-right text-slate-600 dark:text-slate-400">
                  {taxesAndFees > 0 ? formatCurrency(taxesAndFees) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Savings callout */}
      {savings !== null && savings > 0 && (
        <div
          className="mt-3 p-2 rounded-lg text-center text-sm"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          <span className="text-slate-600 dark:text-slate-400">Potential savings: </span>
          <span className="font-bold" style={{ color: primaryColor }}>
            {formatCurrency(savings)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PremiumBreakdownSection Component
 * AC-10.9.4: Premium breakdown display.
 * - Single-quote: Total + itemized breakdown
 * - Comparison: Side-by-side with "Best Value" badge
 * - Highlights potential savings
 */
export function PremiumBreakdownSection({
  extractions,
  primaryColor,
  isComparison,
}: PremiumBreakdownSectionProps) {
  // Check if any premium data exists
  const hasPremiumData = extractions.some(
    (e) => e.premiumBreakdown?.totalPremium || e.annualPremium
  );

  if (!hasPremiumData) {
    return null;
  }

  return (
    <div className="p-6 border-b" data-testid="premium-breakdown-section">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <DollarSign className="h-4 w-4" style={{ color: primaryColor }} />
          Premium Summary
        </h2>
      </div>

      {/* Content - single or comparison mode */}
      {isComparison && extractions.length > 1 ? (
        <ComparisonPremium extractions={extractions} primaryColor={primaryColor} />
      ) : (
        <SingleQuotePremium extraction={extractions[0]!} primaryColor={primaryColor} />
      )}
    </div>
  );
}
