/**
 * Diff Engine Gap Detection
 *
 * Identifies coverage gaps across quote comparisons.
 *
 * @module @/lib/compare/diff/gap-detection
 */

import type { QuoteExtraction, CoverageType } from '@/types/compare';
import type { GapWarning } from './types';
import { COVERAGE_TYPE_LABELS, COVERAGE_SEVERITY, SEVERITY_ORDER } from './constants';

/**
 * Detect coverage gaps across quotes.
 * AC-7.4.1: Identifies coverage present in some quotes but missing in others.
 * AC-7.4.6: Sorts by severity (high → medium → low).
 *
 * @param extractions - Array of quote extractions
 * @returns Array of gap warnings sorted by severity
 */
export function detectGaps(extractions: QuoteExtraction[]): GapWarning[] {
  if (extractions.length < 2) {
    return [];
  }

  const gaps: GapWarning[] = [];
  const allCoverageTypes = new Set<CoverageType>();

  // Collect all coverage types across all quotes
  for (const extraction of extractions) {
    for (const coverage of extraction.coverages) {
      allCoverageTypes.add(coverage.type);
    }
  }

  // Check each type for gaps
  for (const coverageType of allCoverageTypes) {
    const present: number[] = [];
    const missing: number[] = [];

    extractions.forEach((extraction, index) => {
      const hasCoverage = extraction.coverages.some((c) => c.type === coverageType);
      if (hasCoverage) {
        present.push(index);
      } else {
        missing.push(index);
      }
    });

    // Gap exists if some have it and some don't
    if (missing.length > 0 && present.length > 0) {
      gaps.push({
        field: COVERAGE_TYPE_LABELS[coverageType],
        coverageType,
        documentsMissing: missing,
        documentsPresent: present,
        severity: COVERAGE_SEVERITY[coverageType],
      });
    }
  }

  // Sort by severity: high → medium → low
  return gaps.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
