/**
 * Diff Engine Type Definitions
 *
 * Story 7.3: AC-7.3.3, AC-7.3.4, AC-7.3.5
 * Types for comparison table data processing.
 *
 * @module @/lib/compare/diff/types
 */

import type { CoverageType, GapAnalysis } from '@/types/compare';

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
 * Severity levels for gap/conflict warnings.
 * AC-7.4.6: High for core coverages, Medium for others.
 */
export type Severity = 'high' | 'medium' | 'low';

/**
 * Conflict type categories.
 * AC-7.4.3: Limit variance, deductible variance, exclusion mismatch.
 */
export type ConflictType = 'limit_variance' | 'deductible_variance' | 'exclusion_mismatch';

/**
 * Gap warning for coverage present in some quotes but missing in others.
 * AC-7.4.1: Identifies coverage gaps between quotes.
 */
export interface GapWarning {
  /** Display name for the gap (e.g., "General Liability") */
  field: string;
  /** Coverage type for styling and row lookup */
  coverageType: CoverageType;
  /** Indices of documents missing this coverage */
  documentsMissing: number[];
  /** Indices of documents with this coverage */
  documentsPresent: number[];
  /** Severity based on coverage type */
  severity: Severity;
}

/**
 * Conflict warning for significant term differences.
 * AC-7.4.3: Identifies conflicts in limits, deductibles, exclusions.
 */
export interface ConflictWarning {
  /** Display name for the conflict field */
  field: string;
  /** Type of conflict detected */
  conflictType: ConflictType;
  /** Human-readable description of the conflict */
  description: string;
  /** Indices of documents involved in the conflict */
  affectedDocuments: number[];
  /** Severity based on coverage type or conflict type */
  severity: Severity;
  /** Coverage type if applicable */
  coverageType?: CoverageType;
}

/**
 * Individual cell value in the comparison table.
 * AC-7.3.5: Tracks "not found" status.
 * AC-7.5.1: Includes sourcePages for view source functionality.
 */
export interface CellValue {
  /** Formatted value for display */
  displayValue: string;
  /** Raw value for comparison (null if not found) */
  rawValue: number | string | null;
  /** Value status */
  status: 'found' | 'not_found';
  /** AC-7.5.1: Page numbers where this value appears (for view source) */
  sourcePages?: number[];
}

/**
 * A single row in the comparison table.
 * AC-7.3.3, AC-7.3.4: Includes best/worst indices and difference flag.
 * AC-7.4.2: Includes gap detection fields.
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
  /** AC-7.4.2: Whether this row represents a coverage gap */
  isGap?: boolean;
  /** AC-7.4.2: Gap severity for styling */
  gapSeverity?: Severity;
  /** AC-7.4.2: Whether this row represents a conflict */
  isConflict?: boolean;
  /** AC-7.4.2: Conflict severity for styling */
  conflictSeverity?: Severity;
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
  /** AC-7.4.1: Detected coverage gaps */
  gaps: GapWarning[];
  /** AC-7.4.3: Detected conflicts */
  conflicts: ConflictWarning[];
  /** AC-10.7.5: Comprehensive gap analysis */
  gapAnalysis: GapAnalysis;
}
