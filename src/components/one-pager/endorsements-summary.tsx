'use client';

/**
 * EndorsementsSummary - Endorsements list/matrix for one-pager
 *
 * Story 10.9: AC-10.9.3
 * Displays endorsements in the one-pager.
 *
 * @module @/components/one-pager/endorsements-summary
 */

import { useMemo } from 'react';
import { FileCheck, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { QuoteExtraction, Endorsement } from '@/types/compare';
import { CRITICAL_ENDORSEMENTS } from '@/types/compare';

// ============================================================================
// Props
// ============================================================================

export interface EndorsementsSummaryProps {
  /** Quote extractions */
  extractions: QuoteExtraction[];
  /** Primary color for styling */
  primaryColor: string;
  /** Whether this is comparison mode */
  isComparison: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if an endorsement is critical.
 */
function isCriticalEndorsement(endorsement: Endorsement): boolean {
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
 * Get badge variant for endorsement type.
 */
function getTypeBadgeVariant(type: Endorsement['type']): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'broadening':
      return 'default';
    case 'restricting':
      return 'secondary';
    case 'conditional':
      return 'outline';
    default:
      return 'outline';
  }
}

// ============================================================================
// Single Quote Mode
// ============================================================================

interface SingleQuoteEndorsementsProps {
  extraction: QuoteExtraction;
  primaryColor: string;
}

function SingleQuoteEndorsements({ extraction, primaryColor }: SingleQuoteEndorsementsProps) {
  const endorsements = extraction.endorsements || [];

  // Sort: critical first, then alphabetical
  const sortedEndorsements = useMemo(() => {
    return [...endorsements].sort((a, b) => {
      const aIsCritical = isCriticalEndorsement(a);
      const bIsCritical = isCriticalEndorsement(b);
      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [endorsements]);

  const displayEndorsements = sortedEndorsements.slice(0, 8);
  const remaining = sortedEndorsements.length - 8;

  return (
    <div className="space-y-2">
      {displayEndorsements.map((endorsement, i) => {
        const isCritical = isCriticalEndorsement(endorsement);
        const typeBadgeVariant = getTypeBadgeVariant(endorsement.type);

        return (
          <div key={i} className="flex items-center gap-2 flex-wrap">
            {/* Form number badge */}
            <Badge variant={typeBadgeVariant} className="font-mono text-xs">
              {endorsement.formNumber || 'Custom'}
            </Badge>

            {/* Endorsement name */}
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {endorsement.name}
            </span>

            {/* Critical badge */}
            {isCritical && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                Critical
              </Badge>
            )}
          </div>
        );
      })}

      {/* "+N more" indicator */}
      {remaining > 0 && (
        <p className="text-sm text-slate-500 italic">
          +{remaining} more endorsement{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Comparison Mode (Mini Matrix)
// ============================================================================

interface ComparisonEndorsementsProps {
  extractions: QuoteExtraction[];
  primaryColor: string;
}

function ComparisonEndorsements({ extractions, primaryColor }: ComparisonEndorsementsProps) {
  // Build endorsement matrix data
  const { endorsementRows, headers } = useMemo(() => {
    const endorsementMap = new Map<string, {
      name: string;
      formNumber: string;
      isCritical: boolean;
      presentIn: Set<number>;
    }>();

    // Collect all endorsements
    extractions.forEach((extraction, index) => {
      const endorsements = extraction.endorsements || [];
      for (const endorsement of endorsements) {
        const key = (endorsement.formNumber || endorsement.name).replace(/\s+/g, ' ').trim().toUpperCase();
        if (!endorsementMap.has(key)) {
          endorsementMap.set(key, {
            name: endorsement.name,
            formNumber: endorsement.formNumber,
            isCritical: isCriticalEndorsement(endorsement),
            presentIn: new Set([index]),
          });
        } else {
          endorsementMap.get(key)!.presentIn.add(index);
        }
      }
    });

    // Sort: critical first, then alphabetical
    const rows = Array.from(endorsementMap.values()).sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return a.name.localeCompare(b.name);
    });

    // Limit to 8 rows
    const displayRows = rows.slice(0, 8);
    const remaining = rows.length - 8;

    const carrierHeaders = extractions.map((e, i) => e.carrierName || `Quote ${i + 1}`);

    return {
      endorsementRows: displayRows,
      headers: carrierHeaders,
      remaining,
    };
  }, [extractions]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400 min-w-[200px]">
              Endorsement
            </th>
            {headers.map((header, i) => (
              <th key={i} className="text-center p-2 font-medium text-slate-600 dark:text-slate-400 min-w-[80px]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {endorsementRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                rowIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/50' : '',
                row.isCritical && 'bg-amber-50/30 dark:bg-amber-900/10'
              )}
            >
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    {row.formNumber && (
                      <span className="font-mono text-slate-500 mr-1">{row.formNumber}</span>
                    )}
                    {row.name}
                  </span>
                  {row.isCritical && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs px-1 py-0">
                      !
                    </Badge>
                  )}
                </div>
              </td>
              {extractions.map((_, colIndex) => (
                <td key={colIndex} className="p-2 text-center">
                  {row.presentIn.has(colIndex) ? (
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * EndorsementsSummary Component
 * AC-10.9.3: Key endorsements section.
 * - Single-quote: List with form numbers and type badges
 * - Comparison: Mini endorsement matrix
 * - Limit to 8 with "+N more" indicator
 */
export function EndorsementsSummary({
  extractions,
  primaryColor,
  isComparison,
}: EndorsementsSummaryProps) {
  // Count total endorsements
  const totalEndorsements = useMemo(() => {
    const allEndorsements = new Set<string>();
    for (const extraction of extractions) {
      for (const endorsement of extraction.endorsements || []) {
        const key = (endorsement.formNumber || endorsement.name).toUpperCase();
        allEndorsements.add(key);
      }
    }
    return allEndorsements.size;
  }, [extractions]);

  // Don't render if no endorsements
  if (totalEndorsements === 0) {
    return null;
  }

  return (
    <div className="p-6 border-b" data-testid="endorsements-summary">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileCheck className="h-4 w-4" style={{ color: primaryColor }} />
          Key Endorsements
        </h2>
        <Badge variant="secondary" className="ml-2">
          {totalEndorsements}
        </Badge>
      </div>

      {/* Content - single or comparison mode */}
      {isComparison && extractions.length > 1 ? (
        <ComparisonEndorsements extractions={extractions} primaryColor={primaryColor} />
      ) : (
        <SingleQuoteEndorsements extraction={extractions[0]!} primaryColor={primaryColor} />
      )}
    </div>
  );
}
