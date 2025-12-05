/**
 * Diff Engine Row Builders
 *
 * Functions for building comparison table rows from quote extractions.
 *
 * @module @/lib/compare/diff/row-builders
 */

import type { QuoteExtraction, CoverageItem, CoverageType } from '@/types/compare';
import type { FieldType, CellValue, ComparisonRow } from './types';
import { COVERAGE_TYPE_LABELS } from './constants';
import { formatValue } from './formatters';
import {
  formatPolicyType,
  formatAdmittedStatus,
  formatRating,
} from '../carrier-utils';

// ============================================================================
// Best/Worst Calculation
// ============================================================================

/**
 * Calculate best and worst value indices.
 * AC-7.3.3: Best/worst logic varies by field type.
 *
 * @param values - Raw numeric values (null = not found)
 * @param higherIsBetter - True for limits, false for deductibles/premium
 * @returns Object with bestIndex and worstIndex (null if N/A)
 */
export function calculateBestWorst(
  values: (number | null)[],
  higherIsBetter: boolean
): { bestIndex: number | null; worstIndex: number | null } {
  // Filter to only valid (non-null) values with their indices
  const validEntries = values
    .map((v, i) => ({ value: v, index: i }))
    .filter((e): e is { value: number; index: number } => e.value !== null);

  // Need at least 2 valid values to compare
  if (validEntries.length < 2) {
    return { bestIndex: null, worstIndex: null };
  }

  // Check if all values are the same
  const firstEntry = validEntries[0]!;
  const allSame = validEntries.every((e) => e.value === firstEntry.value);
  if (allSame) {
    return { bestIndex: null, worstIndex: null };
  }

  // Find best and worst
  let bestEntry = validEntries[0]!;
  let worstEntry = validEntries[0]!;

  for (const entry of validEntries) {
    if (higherIsBetter) {
      if (entry.value > bestEntry.value) bestEntry = entry;
      if (entry.value < worstEntry.value) worstEntry = entry;
    } else {
      if (entry.value < bestEntry.value) bestEntry = entry;
      if (entry.value > worstEntry.value) worstEntry = entry;
    }
  }

  return {
    bestIndex: bestEntry.index,
    worstIndex: worstEntry.index,
  };
}

// ============================================================================
// Difference Detection
// ============================================================================

/**
 * Detect if values differ across quotes.
 * AC-7.3.4: Row highlighting for differences.
 *
 * @param values - Cell values to compare
 * @returns True if values differ
 */
export function detectDifference(values: CellValue[]): boolean {
  // Get all found values
  const foundValues = values
    .filter((v) => v.status === 'found')
    .map((v) => v.rawValue);

  // Need at least 2 found values to have a difference
  if (foundValues.length < 2) {
    return false;
  }

  // Check if all values are the same
  const firstValue = foundValues[0];
  return foundValues.some((v) => v !== firstValue);
}

// ============================================================================
// Cell Building
// ============================================================================

/**
 * Build a cell value from a value.
 * AC-7.5.1: Optionally includes sourcePages for view source functionality.
 */
function buildCell(
  value: number | string | null | undefined,
  fieldType: FieldType,
  sourcePages?: number[]
): CellValue {
  const isFound = value !== null && value !== undefined;
  return {
    displayValue: isFound ? formatValue(value, fieldType) : '—',
    rawValue: isFound ? value : null,
    status: isFound ? 'found' : 'not_found',
    sourcePages: isFound && sourcePages && sourcePages.length > 0 ? sourcePages : undefined,
  };
}

// ============================================================================
// Basic Info Row Builders
// ============================================================================

/**
 * Build carrier name row.
 */
export function buildCarrierRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => buildCell(e.carrierName, 'text'));
  return {
    id: 'carrier',
    field: 'Carrier',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build premium row.
 */
export function buildPremiumRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => buildCell(e.annualPremium, 'premium'));
  const rawValues = values.map((v) => v.rawValue as number | null);
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, false); // Lower is better
  return {
    id: 'premium',
    field: 'Annual Premium',
    category: 'basic',
    fieldType: 'premium',
    values,
    hasDifference: detectDifference(values),
    bestIndex,
    worstIndex,
  };
}

/**
 * Build a date row (effective or expiration).
 */
export function buildDateRow(
  type: 'effective' | 'expiration',
  extractions: QuoteExtraction[]
): ComparisonRow {
  const fieldName = type === 'effective' ? 'effectiveDate' : 'expirationDate';
  const displayName = type === 'effective' ? 'Effective Date' : 'Expiration Date';

  const values = extractions.map((e) => buildCell(e[fieldName], 'date'));
  return {
    id: `date-${type}`,
    field: displayName,
    category: 'basic',
    fieldType: 'date',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build named insured row.
 */
export function buildNamedInsuredRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => buildCell(e.namedInsured, 'text'));
  return {
    id: 'named-insured',
    field: 'Named Insured',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build policy number row.
 */
export function buildPolicyNumberRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => buildCell(e.policyNumber, 'text'));
  return {
    id: 'policy-number',
    field: 'Policy Number',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

// ============================================================================
// Coverage Row Builders
// ============================================================================

/**
 * Collect all unique coverage types across all quotes.
 */
export function collectAllCoverageTypes(extractions: QuoteExtraction[]): CoverageType[] {
  const typeSet = new Set<CoverageType>();
  for (const extraction of extractions) {
    for (const coverage of extraction.coverages) {
      typeSet.add(coverage.type);
    }
  }
  // Return in consistent order (per COVERAGE_TYPE_LABELS)
  const orderedTypes: CoverageType[] = [
    'general_liability',
    'property',
    'auto_liability',
    'auto_physical_damage',
    'umbrella',
    'workers_comp',
    'professional_liability',
    'cyber',
    'other',
  ];
  return orderedTypes.filter((t) => typeSet.has(t));
}

/**
 * Find coverage by type in an extraction.
 */
function findCoverage(
  extraction: QuoteExtraction,
  coverageType: CoverageType
): CoverageItem | undefined {
  return extraction.coverages.find((c) => c.type === coverageType);
}

/**
 * Build a coverage limit row.
 * AC-7.5.1: Includes sourcePages from coverage items.
 */
export function buildCoverageLimitRow(
  coverageType: CoverageType,
  extractions: QuoteExtraction[]
): ComparisonRow {
  const label = COVERAGE_TYPE_LABELS[coverageType];
  const values = extractions.map((e) => {
    const coverage = findCoverage(e, coverageType);
    return buildCell(coverage?.limit ?? null, 'coverage_limit', coverage?.sourcePages);
  });
  const rawValues = values.map((v) => v.rawValue as number | null);
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, true); // Higher is better

  return {
    id: `coverage-${coverageType}-limit`,
    field: `${label} - Limit`,
    category: 'coverage',
    fieldType: 'coverage_limit',
    values,
    hasDifference: detectDifference(values),
    bestIndex,
    worstIndex,
    coverageType,
  };
}

/**
 * Build a coverage deductible row.
 * AC-7.5.1: Includes sourcePages from coverage items.
 */
export function buildCoverageDeductibleRow(
  coverageType: CoverageType,
  extractions: QuoteExtraction[]
): ComparisonRow {
  const label = COVERAGE_TYPE_LABELS[coverageType];
  const values = extractions.map((e) => {
    const coverage = findCoverage(e, coverageType);
    return buildCell(coverage?.deductible ?? null, 'deductible', coverage?.sourcePages);
  });
  const rawValues = values.map((v) => v.rawValue as number | null);
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, false); // Lower is better

  return {
    id: `coverage-${coverageType}-deductible`,
    field: `${label} - Deductible`,
    category: 'coverage',
    fieldType: 'deductible',
    values,
    hasDifference: detectDifference(values),
    bestIndex,
    worstIndex,
    coverageType,
    isSubRow: true,
  };
}

// ============================================================================
// Summary Row Builders
// ============================================================================

/**
 * Build exclusion count row.
 */
export function buildExclusionCountRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) =>
    buildCell(e.exclusions.length, 'count')
  );
  const rawValues = values.map((v) => v.rawValue as number | null);
  // Fewer exclusions is better (inverted logic)
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, false);

  return {
    id: 'exclusion-count',
    field: 'Exclusions Count',
    category: 'summary',
    fieldType: 'count',
    values,
    hasDifference: detectDifference(values),
    // Swap best/worst since fewer exclusions is better
    bestIndex: worstIndex,
    worstIndex: bestIndex,
  };
}

/**
 * Build coverage count row.
 */
export function buildCoverageCountRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) =>
    buildCell(e.coverages.length, 'count')
  );
  const rawValues = values.map((v) => v.rawValue as number | null);
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, true); // More is better

  return {
    id: 'coverage-count',
    field: 'Coverages Count',
    category: 'summary',
    fieldType: 'count',
    values,
    hasDifference: detectDifference(values),
    bestIndex,
    worstIndex,
  };
}

// ============================================================================
// Story 10.8: Policy Metadata Row Builders
// ============================================================================

/**
 * Build policy type row.
 * AC-10.8.2: Display policy type (Occurrence/Claims-Made).
 */
export function buildPolicyTypeRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => {
    const policyType = e.policyMetadata?.policyType ?? null;
    return {
      displayValue: formatPolicyType(policyType),
      rawValue: policyType,
      status: policyType ? 'found' : 'not_found',
    } as CellValue;
  });

  return {
    id: 'policy-type',
    field: 'Policy Type',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build AM Best rating row.
 * AC-10.8.3: Display AM Best rating with color coding.
 */
export function buildAmBestRatingRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => {
    const rating = e.carrierInfo?.amBestRating ?? null;
    return {
      displayValue: formatRating(rating),
      rawValue: rating,
      status: rating ? 'found' : 'not_found',
    } as CellValue;
  });

  return {
    id: 'am-best-rating',
    field: 'AM Best Rating',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build admitted status row.
 * AC-10.8.2: Display admitted/non-admitted/surplus status.
 */
export function buildAdmittedStatusRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => {
    const status = e.carrierInfo?.admittedStatus ?? null;
    return {
      displayValue: formatAdmittedStatus(status),
      rawValue: status,
      status: status ? 'found' : 'not_found',
    } as CellValue;
  });

  return {
    id: 'admitted-status',
    field: 'Carrier Status',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build ISO form numbers row.
 * AC-10.8.2: Display ISO form numbers.
 */
export function buildFormNumbersRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) => {
    const formNumbers = e.policyMetadata?.formNumbers ?? [];
    const displayValue = formNumbers.length > 0 ? formNumbers.join(', ') : '—';
    return {
      displayValue,
      rawValue: formNumbers.length > 0 ? formNumbers.join(', ') : null,
      status: formNumbers.length > 0 ? 'found' : 'not_found',
    } as CellValue;
  });

  return {
    id: 'form-numbers',
    field: 'ISO Forms',
    category: 'basic',
    fieldType: 'text',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
  };
}

/**
 * Build retroactive date row (for claims-made policies).
 * AC-10.8.2: Display retroactive date.
 */
export function buildRetroactiveDateRow(extractions: QuoteExtraction[]): ComparisonRow | null {
  // Only show if at least one policy is claims-made
  const hasClaimsMade = extractions.some((e) => e.policyMetadata?.policyType === 'claims-made');
  if (!hasClaimsMade) {
    return null;
  }

  const values = extractions.map((e) => {
    const retroDate = e.policyMetadata?.retroactiveDate ?? null;
    return buildCell(retroDate, 'date');
  });

  return {
    id: 'retroactive-date',
    field: 'Retroactive Date',
    category: 'basic',
    fieldType: 'date',
    values,
    hasDifference: detectDifference(values),
    bestIndex: null,
    worstIndex: null,
    isSubRow: true,
  };
}

/**
 * Build endorsement count row.
 * AC-10.8.4: Summary of endorsement counts.
 */
export function buildEndorsementCountRow(extractions: QuoteExtraction[]): ComparisonRow {
  const values = extractions.map((e) =>
    buildCell((e.endorsements || []).length, 'count')
  );
  const rawValues = values.map((v) => v.rawValue as number | null);
  const { bestIndex, worstIndex } = calculateBestWorst(rawValues, true); // More is better

  return {
    id: 'endorsement-count',
    field: 'Endorsements Count',
    category: 'summary',
    fieldType: 'count',
    values,
    hasDifference: detectDifference(values),
    bestIndex,
    worstIndex,
  };
}
