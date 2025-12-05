/**
 * Diff Engine Constants
 *
 * Coverage type labels, severity mappings, and thresholds.
 *
 * @module @/lib/compare/diff/constants
 */

import type { CoverageType, ExclusionCategory } from '@/types/compare';
import type { Severity } from './types';

/**
 * Coverage type display labels.
 */
export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  // Original 9 types
  general_liability: 'General Liability',
  property: 'Property',
  auto_liability: 'Auto Liability',
  auto_physical_damage: 'Auto Physical Damage',
  umbrella: 'Umbrella/Excess',
  workers_comp: "Workers' Compensation",
  professional_liability: 'Professional Liability (E&O)',
  cyber: 'Cyber Liability',
  other: 'Other Coverage',
  // Epic 10: 12 new types
  epli: 'Employment Practices Liability',
  d_and_o: 'Directors & Officers',
  crime: 'Crime / Fidelity',
  pollution: 'Pollution Liability',
  inland_marine: 'Inland Marine',
  builders_risk: "Builder's Risk",
  business_interruption: 'Business Interruption',
  product_liability: 'Product Liability',
  garage_liability: 'Garage Liability',
  liquor_liability: 'Liquor Liability',
  medical_malpractice: 'Medical Malpractice',
  fiduciary: 'Fiduciary Liability',
};

/**
 * Coverage severity mapping.
 * AC-7.4.6: High severity for GL, Property, Workers' Comp.
 * Epic 10: Extended for 12 new coverage types.
 */
export const COVERAGE_SEVERITY: Record<CoverageType, Severity> = {
  // Core commercial coverages - high severity
  general_liability: 'high',
  property: 'high',
  workers_comp: 'high',
  // Important commercial coverages - medium severity
  auto_liability: 'medium',
  professional_liability: 'medium',
  umbrella: 'medium',
  product_liability: 'medium',
  business_interruption: 'medium',
  // Specialty coverages - medium severity
  d_and_o: 'medium',
  epli: 'medium',
  medical_malpractice: 'medium',
  pollution: 'medium',
  // Lower priority coverages - low severity
  auto_physical_damage: 'low',
  cyber: 'low',
  crime: 'low',
  inland_marine: 'low',
  builders_risk: 'low',
  garage_liability: 'low',
  liquor_liability: 'low',
  fiduciary: 'low',
  other: 'low',
};

/**
 * Numeric order for severity (lower = more severe).
 */
export const SEVERITY_ORDER: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Exclusion category labels for display.
 */
export const EXCLUSION_CATEGORY_LABELS: Record<ExclusionCategory, string> = {
  flood: 'Flood',
  earthquake: 'Earthquake',
  pollution: 'Pollution',
  mold: 'Mold',
  cyber: 'Cyber',
  employment: 'Employment Practices',
  other: 'Other',
};

/**
 * Exclusion category severity mapping.
 * High: flood, earthquake (critical coverage gaps)
 * Medium: pollution, mold, cyber
 * Low: employment, other
 */
export const EXCLUSION_SEVERITY: Record<ExclusionCategory, Severity> = {
  flood: 'high',
  earthquake: 'high',
  pollution: 'medium',
  mold: 'medium',
  cyber: 'medium',
  employment: 'low',
  other: 'low',
};

/**
 * Conflict detection thresholds.
 * AC-7.4.3: Limit variance >50%, deductible variance >100%.
 */
export const CONFLICT_THRESHOLDS = {
  /** Limit variance threshold (50% difference from highest) */
  limitVariance: 0.5,
  /** Deductible variance threshold (100% difference from lowest) */
  deductibleVariance: 1.0,
};
