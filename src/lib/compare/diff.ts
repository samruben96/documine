/**
 * DiffEngine - Comparison Table Data Processor
 *
 * Story 7.3: AC-7.3.3, AC-7.3.4, AC-7.3.5
 * Transforms QuoteExtraction[] into ComparisonRow[] for table rendering.
 *
 * @module @/lib/compare/diff
 */

import type {
  QuoteExtraction,
  CoverageItem,
  CoverageType,
  DocumentSummary,
} from '@/types/compare';

// ============================================================================
// Types
// ============================================================================

/**
 * Field type determines best/worst comparison logic.
 * AC-7.3.3: Best/worst logic per field type.
 */
export type FieldType =
  | 'coverage_limit' // Higher is better
  | 'deductible' // Lower is better
  | 'premium' // Lower is better
  | 'date' // N/A for best/worst
  | 'text' // N/A for best/worst
  | 'count'; // Higher is better

/**
 * Individual cell value in the comparison table.
 * AC-7.3.5: Tracks "not found" status.
 */
export interface CellValue {
  /** Formatted value for display */
  displayValue: string;
  /** Raw value for comparison (null if not found) */
  rawValue: number | string | null;
  /** Value status */
  status: 'found' | 'not_found';
}

/**
 * A single row in the comparison table.
 * AC-7.3.3, AC-7.3.4: Includes best/worst indices and difference flag.
 */
export interface ComparisonRow {
  /** Row identifier for React keys */
  id: string;
  /** Display label for the field */
  field: string;
  /** Field category for grouping */
  category: 'basic' | 'coverage' | 'exclusion' | 'summary';
  /** Field type for best/worst logic */
  fieldType: FieldType;
  /** One value per quote document */
  values: CellValue[];
  /** Whether values differ across quotes */
  hasDifference: boolean;
  /** Index of best value (null if N/A or all same) */
  bestIndex: number | null;
  /** Index of worst value (null if N/A or all same) */
  worstIndex: number | null;
  /** Coverage type for coverage rows (for styling/grouping) */
  coverageType?: CoverageType;
  /** Whether this is a sub-row (indented) */
  isSubRow?: boolean;
}

/**
 * Output from buildComparisonRows.
 */
export interface ComparisonTableData {
  /** Header row with carrier names */
  headers: string[];
  /** Data rows for the table */
  rows: ComparisonRow[];
  /** Document count */
  documentCount: number;
}

// ============================================================================
// Coverage Type Labels
// ============================================================================

export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  general_liability: 'General Liability',
  property: 'Property',
  auto_liability: 'Auto Liability',
  auto_physical_damage: 'Auto Physical Damage',
  umbrella: 'Umbrella/Excess',
  workers_comp: "Workers' Compensation",
  professional_liability: 'Professional Liability (E&O)',
  cyber: 'Cyber Liability',
  other: 'Other Coverage',
};

// ============================================================================
// Value Formatting
// ============================================================================

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

/**
 * Determine if a field type supports best/worst comparison.
 */
function supportsBestWorst(fieldType: FieldType): boolean {
  return ['coverage_limit', 'deductible', 'premium', 'count'].includes(fieldType);
}

/**
 * Determine if higher is better for a field type.
 */
function isHigherBetter(fieldType: FieldType): boolean {
  return fieldType === 'coverage_limit' || fieldType === 'count';
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
// Row Builders
// ============================================================================

/**
 * Build a cell value from a value.
 */
function buildCell(
  value: number | string | null | undefined,
  fieldType: FieldType
): CellValue {
  const isFound = value !== null && value !== undefined;
  return {
    displayValue: isFound ? formatValue(value, fieldType) : '—',
    rawValue: isFound ? value : null,
    status: isFound ? 'found' : 'not_found',
  };
}

/**
 * Build carrier name row.
 */
function buildCarrierRow(extractions: QuoteExtraction[]): ComparisonRow {
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
function buildPremiumRow(extractions: QuoteExtraction[]): ComparisonRow {
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
function buildDateRow(
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
function buildNamedInsuredRow(extractions: QuoteExtraction[]): ComparisonRow {
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
function buildPolicyNumberRow(extractions: QuoteExtraction[]): ComparisonRow {
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

/**
 * Collect all unique coverage types across all quotes.
 */
function collectAllCoverageTypes(extractions: QuoteExtraction[]): CoverageType[] {
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
 */
function buildCoverageLimitRow(
  coverageType: CoverageType,
  extractions: QuoteExtraction[]
): ComparisonRow {
  const label = COVERAGE_TYPE_LABELS[coverageType];
  const values = extractions.map((e) => {
    const coverage = findCoverage(e, coverageType);
    return buildCell(coverage?.limit ?? null, 'coverage_limit');
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
 */
function buildCoverageDeductibleRow(
  coverageType: CoverageType,
  extractions: QuoteExtraction[]
): ComparisonRow {
  const label = COVERAGE_TYPE_LABELS[coverageType];
  const values = extractions.map((e) => {
    const coverage = findCoverage(e, coverageType);
    return buildCell(coverage?.deductible ?? null, 'deductible');
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

/**
 * Build exclusion count row.
 */
function buildExclusionCountRow(extractions: QuoteExtraction[]): ComparisonRow {
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
function buildCoverageCountRow(extractions: QuoteExtraction[]): ComparisonRow {
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
// Main Entry Point
// ============================================================================

/**
 * Build comparison table data from extractions.
 * AC-7.3.1, AC-7.3.2: Transforms QuoteExtraction[] into table structure.
 *
 * @param extractions - Array of quote extractions
 * @param documents - Optional document summaries for headers
 * @returns ComparisonTableData with headers and rows
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

  // Coverage section
  const allCoverageTypes = collectAllCoverageTypes(extractions);
  for (const coverageType of allCoverageTypes) {
    rows.push(buildCoverageLimitRow(coverageType, extractions));
    rows.push(buildCoverageDeductibleRow(coverageType, extractions));
  }

  // Summary section
  rows.push(buildCoverageCountRow(extractions));
  rows.push(buildExclusionCountRow(extractions));

  return {
    headers,
    rows,
    documentCount: extractions.length,
  };
}
