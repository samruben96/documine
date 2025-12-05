/**
 * Exclusion Types
 *
 * Standard exclusion categories for insurance policies.
 *
 * @module @/types/compare/exclusion
 */

/**
 * Standard exclusion categories for insurance policies.
 * Per Tech Spec: Common exclusion classifications.
 */
export type ExclusionCategory =
  | 'flood'
  | 'earthquake'
  | 'pollution'
  | 'mold'
  | 'cyber'
  | 'employment'
  | 'other';

export const EXCLUSION_CATEGORIES: ExclusionCategory[] = [
  'flood',
  'earthquake',
  'pollution',
  'mold',
  'cyber',
  'employment',
  'other',
];

/**
 * Exclusion item extracted from a quote document.
 * AC-7.2.3: Exclusions extracted with category classification.
 */
export interface ExclusionItem {
  /** Exclusion name/title */
  name: string;
  /** Description of what's excluded */
  description: string;
  /** Exclusion category for grouping */
  category: ExclusionCategory;
  /** Pages where this exclusion is referenced */
  sourcePages: number[];
}
