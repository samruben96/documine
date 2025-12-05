/**
 * Coverage Types
 *
 * Standard insurance coverage types and related definitions.
 * Epic 10: Extended from 9 to 21 coverage types (AC-10.1.1)
 *
 * @module @/types/compare/coverage
 */

/**
 * Standard insurance coverage types.
 * Per Tech Spec: Maps to industry standard coverage categories.
 * Epic 10: Extended from 9 to 21 types (AC-10.1.1)
 */
export type CoverageType =
  | 'general_liability'
  | 'property'
  | 'auto_liability'
  | 'auto_physical_damage'
  | 'umbrella'
  | 'workers_comp'
  | 'professional_liability'
  | 'cyber'
  | 'other'
  // Epic 10: 12 new coverage types
  | 'epli'                    // Employment Practices Liability
  | 'd_and_o'                 // Directors & Officers
  | 'crime'                   // Crime / Fidelity
  | 'pollution'               // Pollution Liability
  | 'inland_marine'           // Inland Marine / Equipment
  | 'builders_risk'           // Builders Risk
  | 'business_interruption'   // Business Interruption / Loss of Income
  | 'product_liability'       // Product Liability
  | 'garage_liability'        // Garage Liability
  | 'liquor_liability'        // Liquor Liability
  | 'medical_malpractice'     // Medical Malpractice
  | 'fiduciary';              // Fiduciary Liability

/**
 * Array of all coverage types for iteration/validation.
 * AC-10.1.5: Includes all 21 types.
 */
export const COVERAGE_TYPES: CoverageType[] = [
  'general_liability',
  'property',
  'auto_liability',
  'auto_physical_damage',
  'umbrella',
  'workers_comp',
  'professional_liability',
  'cyber',
  'other',
  // Epic 10: 12 new coverage types
  'epli',
  'd_and_o',
  'crime',
  'pollution',
  'inland_marine',
  'builders_risk',
  'business_interruption',
  'product_liability',
  'garage_liability',
  'liquor_liability',
  'medical_malpractice',
  'fiduciary',
];

/**
 * Display names and icons for coverage types.
 * AC-10.1.6: For UI rendering in comparison tables and one-pagers.
 */
export const COVERAGE_TYPE_DISPLAY: Record<CoverageType, { label: string; icon: string }> = {
  general_liability: { label: 'General Liability', icon: 'Shield' },
  property: { label: 'Property', icon: 'Building' },
  auto_liability: { label: 'Auto Liability', icon: 'Car' },
  auto_physical_damage: { label: 'Auto Physical Damage', icon: 'CarFront' },
  umbrella: { label: 'Umbrella', icon: 'Umbrella' },
  workers_comp: { label: 'Workers Compensation', icon: 'HardHat' },
  professional_liability: { label: 'Professional Liability', icon: 'Briefcase' },
  cyber: { label: 'Cyber', icon: 'Lock' },
  other: { label: 'Other', icon: 'FileQuestion' },
  // Epic 10: New types
  epli: { label: 'Employment Practices', icon: 'Users' },
  d_and_o: { label: 'Directors & Officers', icon: 'Crown' },
  crime: { label: 'Crime / Fidelity', icon: 'AlertTriangle' },
  pollution: { label: 'Pollution', icon: 'Leaf' },
  inland_marine: { label: 'Inland Marine', icon: 'Truck' },
  builders_risk: { label: 'Builders Risk', icon: 'Hammer' },
  business_interruption: { label: 'Business Interruption', icon: 'Clock' },
  product_liability: { label: 'Product Liability', icon: 'Package' },
  garage_liability: { label: 'Garage Liability', icon: 'Warehouse' },
  liquor_liability: { label: 'Liquor Liability', icon: 'Wine' },
  medical_malpractice: { label: 'Medical Malpractice', icon: 'Stethoscope' },
  fiduciary: { label: 'Fiduciary', icon: 'Scale' },
};

/**
 * Coverage limit types.
 * Per Tech Spec: How limits are applied.
 */
export type LimitType = 'per_occurrence' | 'aggregate' | 'per_person' | 'combined_single';

export const LIMIT_TYPES: LimitType[] = [
  'per_occurrence',
  'aggregate',
  'per_person',
  'combined_single',
];

/**
 * Coverage item extracted from a quote document.
 * AC-7.2.2: Each coverage includes type, limit, deductible, sourceRef.
 * Story 10.3: Enhanced with aggregate limits, SIR, coinsurance, waiting periods.
 */
export interface CoverageItem {
  /** Coverage type classification */
  type: CoverageType;
  /** Coverage name as it appears in document */
  name: string;
  /** Coverage limit in USD (null if not specified) */
  limit: number | null;
  /** Sub-limit if applicable */
  sublimit: number | null;
  /** How the limit applies */
  limitType: LimitType | null;
  /** Deductible amount in USD (null if not specified) */
  deductible: number | null;
  /** Brief description of what's covered */
  description: string;
  /** Pages where this coverage is referenced */
  sourcePages: number[];

  // Epic 10 Story 10.3: Enhanced Limits & Deductibles
  /** Aggregate limit (policy-period maximum) */
  aggregateLimit: number | null;
  /** Self-Insured Retention (different from deductible - insured pays first) */
  selfInsuredRetention: number | null;
  /** Coinsurance percentage (80, 90, 100) - property coverage */
  coinsurance: number | null;
  /** Waiting period before coverage applies (business interruption) */
  waitingPeriod: string | null;
  /** Maximum indemnity period for loss of income */
  indemnityPeriod: string | null;
}
