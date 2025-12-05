'use client';

/**
 * EndorsementMatrix - Endorsement comparison grid
 *
 * Story 10.8: AC-10.8.4
 * Displays endorsements across quotes in a matrix format.
 *
 * @module @/components/compare/endorsement-matrix
 */

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { QuoteExtraction, Endorsement, DocumentSummary } from '@/types/compare';
import { CRITICAL_ENDORSEMENTS } from '@/types/compare';

// ============================================================================
// Props
// ============================================================================

export interface EndorsementMatrixProps {
  /** Quote extractions to compare */
  extractions: QuoteExtraction[];
  /** Optional document summaries for header fallbacks */
  documents?: DocumentSummary[];
  /** Optional className */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if an endorsement is critical.
 * AC-10.8.4: Highlight CG 20 10, CG 20 37, CG 24 04.
 */
export function isCriticalEndorsement(endorsement: Endorsement): boolean {
  const normalizedForm = endorsement.formNumber.replace(/\s+/g, ' ').trim().toUpperCase();
  return CRITICAL_ENDORSEMENTS.some((ce) => {
    const criticalForm = ce.formNumber.replace(/\s+/g, ' ').trim().toUpperCase();
    return (
      normalizedForm === criticalForm ||
      normalizedForm.replace(/\s/g, '').includes(criticalForm.replace(/\s/g, ''))
    );
  });
}

/**
 * Get endorsement type badge variant.
 */
function getEndorsementTypeBadge(type: Endorsement['type']): {
  variant: 'default' | 'secondary' | 'outline';
  label: string;
} {
  switch (type) {
    case 'broadening':
      return { variant: 'default', label: 'Broadening' };
    case 'restricting':
      return { variant: 'secondary', label: 'Restricting' };
    case 'conditional':
      return { variant: 'outline', label: 'Conditional' };
    default:
      return { variant: 'outline', label: 'Unknown' };
  }
}

// ============================================================================
// Types
// ============================================================================

interface EndorsementRow {
  /** Unique key for this endorsement */
  key: string;
  /** Display name */
  name: string;
  /** Form number */
  formNumber: string;
  /** Whether this is a critical endorsement */
  isCritical: boolean;
  /** Endorsement type (from first occurrence) */
  type: Endorsement['type'];
  /** Which quotes have this endorsement (by index) */
  presentInQuotes: Set<number>;
  /** Full endorsement data per quote (for tooltips) */
  endorsementsByQuote: Map<number, Endorsement>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * EndorsementMatrix Component
 * AC-10.8.4: Matrix of endorsements across quotes.
 * - Rows: Each unique endorsement
 * - Columns: One per quote
 * - Cells: Check/X with form number
 * - Critical endorsements badged and sorted first
 */
export function EndorsementMatrix({
  extractions,
  documents,
  className,
}: EndorsementMatrixProps) {
  // Build headers from carrier names or fallbacks
  const headers = useMemo(() => {
    return extractions.map((e, i) => {
      if (e.carrierName) return e.carrierName;
      if (documents?.[i]?.filename) return documents[i].filename;
      return `Quote ${i + 1}`;
    });
  }, [extractions, documents]);

  // Build endorsement rows
  const endorsementRows = useMemo(() => {
    const endorsementMap = new Map<string, EndorsementRow>();

    // Collect all endorsements across all quotes
    extractions.forEach((extraction, quoteIndex) => {
      const endorsements = extraction.endorsements || [];
      for (const endorsement of endorsements) {
        // Use form number as key, or name if no form number
        const key = endorsement.formNumber || endorsement.name;
        const normalizedKey = key.replace(/\s+/g, ' ').trim().toUpperCase();

        if (!endorsementMap.has(normalizedKey)) {
          endorsementMap.set(normalizedKey, {
            key: normalizedKey,
            name: endorsement.name,
            formNumber: endorsement.formNumber,
            isCritical: isCriticalEndorsement(endorsement),
            type: endorsement.type,
            presentInQuotes: new Set([quoteIndex]),
            endorsementsByQuote: new Map([[quoteIndex, endorsement]]),
          });
        } else {
          const existing = endorsementMap.get(normalizedKey)!;
          existing.presentInQuotes.add(quoteIndex);
          existing.endorsementsByQuote.set(quoteIndex, endorsement);
        }
      }
    });

    // Convert to array and sort: critical first, then alphabetical
    const rows = Array.from(endorsementMap.values());
    rows.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [extractions]);

  // Empty state
  if (endorsementRows.length === 0) {
    return (
      <div className={cn('p-4 text-center text-slate-500', className)}>
        No endorsements found in any quote.
      </div>
    );
  }

  return (
    <div
      className={cn('overflow-x-auto', className)}
      data-testid="endorsement-matrix"
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            {/* Endorsement name header */}
            <th
              className={cn(
                'sticky left-0 z-10 bg-slate-50 dark:bg-slate-800',
                'px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400',
                'border-b border-r border-slate-200 dark:border-slate-700',
                'min-w-[250px]'
              )}
            >
              Endorsement
            </th>

            {/* Quote headers */}
            {headers.map((header, index) => (
              <th
                key={index}
                className={cn(
                  'px-4 py-2 text-center font-medium text-slate-600 dark:text-slate-400',
                  'border-b border-slate-200 dark:border-slate-700',
                  'min-w-[120px]'
                )}
              >
                <div className="flex items-center justify-center gap-2">
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
          {endorsementRows.map((row) => {
            const typeBadge = getEndorsementTypeBadge(row.type);

            return (
              <tr
                key={row.key}
                className={cn(
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  row.isCritical && 'bg-amber-50/30 dark:bg-amber-900/10'
                )}
              >
                {/* Endorsement name cell (sticky) */}
                <td
                  className={cn(
                    'sticky left-0 z-10 bg-white dark:bg-slate-900',
                    'px-4 py-2 border-b border-r border-slate-200 dark:border-slate-700',
                    row.isCritical && 'bg-amber-50/30 dark:bg-amber-900/10'
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {row.name}
                      </span>
                      {row.isCritical && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {row.formNumber && <span>{row.formNumber}</span>}
                      <Badge variant={typeBadge.variant} className="text-xs px-1.5 py-0">
                        {typeBadge.label}
                      </Badge>
                    </div>
                  </div>
                </td>

                {/* Presence cells for each quote */}
                {extractions.map((_, quoteIndex) => {
                  const isPresent = row.presentInQuotes.has(quoteIndex);
                  const endorsement = row.endorsementsByQuote.get(quoteIndex);

                  return (
                    <td
                      key={quoteIndex}
                      className={cn(
                        'px-4 py-2 text-center border-b border-slate-200 dark:border-slate-700',
                        isPresent
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-400 dark:text-red-500'
                      )}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center">
                              {isPresent ? (
                                <Check className="h-5 w-5" aria-label="Present" />
                              ) : (
                                <X className="h-5 w-5" aria-label="Missing" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isPresent && endorsement ? (
                              <div className="max-w-xs">
                                <p className="font-medium">{endorsement.name}</p>
                                {endorsement.formNumber && (
                                  <p className="text-xs text-slate-400">{endorsement.formNumber}</p>
                                )}
                                {endorsement.description && (
                                  <p className="text-xs mt-1">{endorsement.description}</p>
                                )}
                              </div>
                            ) : (
                              <p>Endorsement not found in this quote</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
