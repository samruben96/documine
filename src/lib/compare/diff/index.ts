/**
 * DiffEngine - Comparison Table Data Processor
 *
 * Story 7.3: AC-7.3.3, AC-7.3.4, AC-7.3.5
 * Transforms QuoteExtraction[] into ComparisonRow[] for table rendering.
 *
 * @module @/lib/compare/diff
 */

import type { QuoteExtraction, CoverageType, DocumentSummary } from '@/types/compare';
import type { ComparisonRow, ComparisonTableData, GapWarning, ConflictWarning, Severity } from './types';
import { COVERAGE_SEVERITY, SEVERITY_ORDER } from './constants';
import { analyzeGaps } from '../gap-analysis';
import { detectGaps } from './gap-detection';
import { detectConflicts } from './conflict-detection';
import {
  buildCarrierRow,
  buildPolicyNumberRow,
  buildNamedInsuredRow,
  buildPremiumRow,
  buildDateRow,
  buildPolicyTypeRow,
  buildRetroactiveDateRow,
  buildAmBestRatingRow,
  buildAdmittedStatusRow,
  buildFormNumbersRow,
  collectAllCoverageTypes,
  buildCoverageLimitRow,
  buildCoverageDeductibleRow,
  buildCoverageCountRow,
  buildEndorsementCountRow,
  buildExclusionCountRow,
} from './row-builders';

// Re-export all types
export type {
  FieldType,
  Severity,
  ConflictType,
  GapWarning,
  ConflictWarning,
  CellValue,
  ComparisonRow,
  ComparisonTableData,
} from './types';

// Re-export constants
export { COVERAGE_TYPE_LABELS, COVERAGE_SEVERITY, SEVERITY_ORDER } from './constants';

// Re-export formatters
export { formatCurrency, formatDate, formatValue } from './formatters';

// Re-export row builders for direct use
export {
  calculateBestWorst,
  detectDifference,
  buildPolicyTypeRow,
  buildAmBestRatingRow,
  buildAdmittedStatusRow,
  buildFormNumbersRow,
  buildRetroactiveDateRow,
  buildEndorsementCountRow,
} from './row-builders';

// Re-export detection functions
export { detectGaps } from './gap-detection';
export { detectConflicts } from './conflict-detection';

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Build comparison table data from extractions.
 * AC-7.3.1, AC-7.3.2: Transforms QuoteExtraction[] into table structure.
 * AC-7.4.1, AC-7.4.2: Includes gap/conflict detection and row annotation.
 *
 * @param extractions - Array of quote extractions
 * @param documents - Optional document summaries for headers
 * @returns ComparisonTableData with headers, rows, gaps, and conflicts
 */
export function buildComparisonRows(
  extractions: QuoteExtraction[],
  documents?: DocumentSummary[]
): ComparisonTableData {
  if (extractions.length === 0) {
    return {
      headers: [],
      rows: [],
      documentCount: 0,
      gaps: [],
      conflicts: [],
      gapAnalysis: {
        missingCoverages: [],
        limitConcerns: [],
        endorsementGaps: [],
        overallRiskScore: 0,
      },
    };
  }

  // Build headers from carrier names or document filenames
  const headers = extractions.map((e, i) => {
    if (e.carrierName) return e.carrierName;
    if (documents?.[i]?.filename) return documents[i].filename;
    return `Quote ${i + 1}`;
  });

  const rows: ComparisonRow[] = [];

  // Basic info section
  rows.push(buildCarrierRow(extractions));
  rows.push(buildPolicyNumberRow(extractions));
  rows.push(buildNamedInsuredRow(extractions));
  rows.push(buildPremiumRow(extractions));
  rows.push(buildDateRow('effective', extractions));
  rows.push(buildDateRow('expiration', extractions));

  // Story 10.8: Policy metadata and carrier info rows
  rows.push(buildPolicyTypeRow(extractions));
  const retroRow = buildRetroactiveDateRow(extractions);
  if (retroRow) {
    rows.push(retroRow);
  }
  rows.push(buildAmBestRatingRow(extractions));
  rows.push(buildAdmittedStatusRow(extractions));
  rows.push(buildFormNumbersRow(extractions));

  // Coverage section
  const allCoverageTypes = collectAllCoverageTypes(extractions);
  for (const coverageType of allCoverageTypes) {
    rows.push(buildCoverageLimitRow(coverageType, extractions));
    rows.push(buildCoverageDeductibleRow(coverageType, extractions));
  }

  // Summary section
  rows.push(buildCoverageCountRow(extractions));
  rows.push(buildEndorsementCountRow(extractions));
  rows.push(buildExclusionCountRow(extractions));

  // AC-7.4.1, AC-7.4.3: Detect gaps and conflicts
  const gaps = detectGaps(extractions);
  const conflicts = detectConflicts(extractions);

  // AC-10.7.5: Perform comprehensive gap analysis
  const gapAnalysis = analyzeGaps(extractions);

  // AC-7.4.2: Annotate rows with gap/conflict info
  annotateRowsWithIssues(rows, gaps, conflicts);

  return {
    headers,
    rows,
    documentCount: extractions.length,
    gaps,
    conflicts,
    gapAnalysis,
  };
}

/**
 * Annotate rows with gap and conflict information for styling.
 * AC-7.4.2: Adds isGap/isConflict flags to affected rows.
 */
function annotateRowsWithIssues(
  rows: ComparisonRow[],
  gaps: GapWarning[],
  conflicts: ConflictWarning[]
): void {
  // Create a map of coverage types to gaps
  const gapsByCoverage = new Map<CoverageType, GapWarning>();
  for (const gap of gaps) {
    gapsByCoverage.set(gap.coverageType, gap);
  }

  // Create a map of coverage types to conflicts
  const conflictsByCoverage = new Map<CoverageType, ConflictWarning[]>();
  for (const conflict of conflicts) {
    if (conflict.coverageType) {
      const existing = conflictsByCoverage.get(conflict.coverageType) || [];
      existing.push(conflict);
      conflictsByCoverage.set(conflict.coverageType, existing);
    }
  }

  // Annotate each row
  for (const row of rows) {
    if (row.coverageType) {
      // Check for gaps
      const gap = gapsByCoverage.get(row.coverageType);
      if (gap) {
        row.isGap = true;
        row.gapSeverity = gap.severity;
      }

      // Check for conflicts (only for limit rows, not deductible sub-rows)
      const coverageConflicts = conflictsByCoverage.get(row.coverageType);
      if (coverageConflicts && coverageConflicts.length > 0 && !row.isSubRow) {
        row.isConflict = true;
        // Use highest severity from conflicts
        row.conflictSeverity = coverageConflicts.reduce(
          (highest, c) =>
            SEVERITY_ORDER[c.severity] < SEVERITY_ORDER[highest]
              ? c.severity
              : highest,
          coverageConflicts[0]!.severity
        );
      }
    }
  }
}
