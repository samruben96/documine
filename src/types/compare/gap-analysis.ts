/**
 * Gap Analysis Types
 *
 * Epic 10 Story 10.7: Automated Gap Analysis Types
 *
 * @module @/types/compare/gap-analysis
 */

import type { CoverageType } from './coverage';

/**
 * Importance level for gap analysis findings.
 * AC-10.7.1, AC-10.7.3: Critical for core coverages, recommended for others.
 */
export type GapImportance = 'critical' | 'recommended' | 'optional';

/**
 * Missing coverage identified during gap analysis.
 * AC-10.7.1: Identify coverages present in some quotes but missing in others.
 */
export interface MissingCoverage {
  /** Coverage type that is missing */
  coverageType: CoverageType;
  /** Importance level based on coverage type */
  importance: GapImportance;
  /** Reason why this coverage is important */
  reason: string;
  /** Carrier names that have this coverage */
  presentIn: string[];
}

/**
 * Limit concern identified during gap analysis.
 * AC-10.7.2: Compare limits against industry minimum thresholds.
 */
export interface LimitConcern {
  /** Coverage type with inadequate limit */
  coverage: string;
  /** Current limit in USD */
  currentLimit: number;
  /** Recommended minimum limit in USD */
  recommendedMinimum: number;
  /** Reason why this limit is concerning */
  reason: string;
  /** Which quote has the inadequate limit */
  documentIndex: number;
  /** Carrier name for display */
  carrierName: string;
}

/**
 * Endorsement gap identified during gap analysis.
 * AC-10.7.3: Compare quotes against critical endorsements list.
 */
export interface EndorsementGap {
  /** Endorsement name */
  endorsement: string;
  /** ISO form number (e.g., CG 20 10) */
  formNumber: string | null;
  /** Importance level */
  importance: GapImportance;
  /** Reason why this endorsement is important */
  reason: string;
  /** Carrier names that have this endorsement */
  presentIn: string[];
}

/**
 * Complete gap analysis result.
 * AC-10.7.4: Includes overall risk score.
 * AC-10.7.5: All analysis data in one interface.
 */
export interface GapAnalysis {
  /** Missing coverages found */
  missingCoverages: MissingCoverage[];
  /** Limit adequacy concerns */
  limitConcerns: LimitConcern[];
  /** Endorsement gaps found */
  endorsementGaps: EndorsementGap[];
  /** Overall risk score 0-100 (higher = more risk) */
  overallRiskScore: number;
}

/**
 * Minimum recommended limits for common coverage types.
 * AC-10.7.2: Industry standard minimums for gap analysis.
 */
export const MINIMUM_LIMITS: Partial<Record<CoverageType, number>> = {
  general_liability: 1000000,      // $1M per occurrence
  property: 500000,                // $500K
  umbrella: 1000000,               // $1M
  professional_liability: 1000000, // $1M
  cyber: 500000,                   // $500K
};

/**
 * Coverage types considered critical for business operations.
 * AC-10.7.1: Used for importance classification.
 */
export const CRITICAL_COVERAGES: CoverageType[] = [
  'general_liability',
  'property',
  'workers_comp',
];

/**
 * Coverage types recommended for most businesses.
 */
export const RECOMMENDED_COVERAGES: CoverageType[] = [
  'umbrella',
  'professional_liability',
  'auto_liability',
  'business_interruption',
];
