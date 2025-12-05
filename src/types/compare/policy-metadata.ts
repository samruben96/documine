/**
 * Policy Metadata Types
 *
 * Epic 10: Policy form, endorsement, carrier, and premium types.
 * Stories 10.2, 10.4, 10.5, 10.6
 *
 * @module @/types/compare/policy-metadata
 */

// ============================================================================
// Epic 10 Story 10.2: Policy Form & Structure Metadata
// ============================================================================

/**
 * Policy form type classification.
 * AC-10.2.1: Identify ISO vs proprietary vs manuscript forms.
 */
export type FormType = 'iso' | 'proprietary' | 'manuscript';

/**
 * Policy type (occurrence vs claims-made).
 * AC-10.2.2: Critical for liability comparison.
 */
export type PolicyType = 'occurrence' | 'claims-made';

/**
 * Audit provision type.
 * AC-10.2.4: How premium audits are conducted.
 */
export type AuditType = 'annual' | 'monthly' | 'final' | 'none';

/**
 * Carrier admitted status.
 * AC-10.2.5: Regulatory status affects guaranty fund protection.
 */
export type AdmittedStatus = 'admitted' | 'non-admitted' | 'surplus';

/**
 * Policy form and structure metadata.
 * Story 10.2: AC-10.2.1 through AC-10.2.7
 */
export interface PolicyMetadata {
  /** Form type classification (ISO, proprietary, manuscript) */
  formType: FormType | null;
  /** ISO form numbers (CG 0001, CP 0010, CA 0001, etc.) */
  formNumbers: string[];
  /** Occurrence vs claims-made policy */
  policyType: PolicyType | null;
  /** Retroactive date for claims-made policies (YYYY-MM-DD) */
  retroactiveDate: string | null;
  /** Extended reporting period options */
  extendedReportingPeriod: string | null;
  /** Premium audit provision type */
  auditType: AuditType | null;
  /** Pages where metadata was found */
  sourcePages: number[];
}

// ============================================================================
// Epic 10 Story 10.4: Endorsements
// ============================================================================

/**
 * Endorsement type classification.
 * AC-10.4.2: Classify endorsement impact on coverage.
 */
export type EndorsementType = 'broadening' | 'restricting' | 'conditional';

/**
 * Endorsement extracted from policy documents.
 * Story 10.4: AC-10.4.1 through AC-10.4.6
 */
export interface Endorsement {
  /** Form number as it appears (CG 20 10, not CG2010) */
  formNumber: string;
  /** Endorsement name/title */
  name: string;
  /** Impact type on coverage */
  type: EndorsementType;
  /** Brief description of what the endorsement does */
  description: string;
  /** Coverage this endorsement affects (null if policy-wide) */
  affectedCoverage: string | null;
  /** Pages where this endorsement is referenced */
  sourcePages: number[];
}

/**
 * Critical endorsements to prioritize in extraction.
 * Per Tech Spec: Common contract requirements.
 */
export const CRITICAL_ENDORSEMENTS = [
  { formNumber: 'CG 20 10', name: 'Additional Insured - Owners, Lessees or Contractors', importance: 'critical' as const },
  { formNumber: 'CG 20 37', name: 'Additional Insured - Owners, Lessees or Contractors - Completed Operations', importance: 'critical' as const },
  { formNumber: 'CG 24 04', name: 'Waiver of Transfer of Rights (Waiver of Subrogation)', importance: 'critical' as const },
  { formNumber: 'CG 20 01', name: 'Primary and Non-Contributory', importance: 'recommended' as const },
] as const;

// ============================================================================
// Epic 10 Story 10.5: Carrier Information
// ============================================================================

/**
 * Carrier financial and contact information.
 * Story 10.5: AC-10.5.1 through AC-10.5.6
 */
export interface CarrierInfo {
  /** AM Best rating (A++, A+, A, A-, B++, etc.) */
  amBestRating: string | null;
  /** AM Best Financial Size Class (I-XV in Roman numerals) */
  amBestFinancialSize: string | null;
  /** NAIC code for carrier identification */
  naicCode: string | null;
  /** Admitted vs non-admitted/surplus lines status */
  admittedStatus: AdmittedStatus | null;
  /** Claims department phone number */
  claimsPhone: string | null;
  /** Underwriter name */
  underwriter: string | null;
  /** Pages where carrier info is referenced */
  sourcePages: number[];
}

// ============================================================================
// Epic 10 Story 10.6: Premium Breakdown
// ============================================================================

/**
 * Per-coverage premium allocation.
 * AC-10.6.2: Itemized premium by coverage type.
 */
export interface CoveragePremium {
  /** Coverage name as it appears */
  coverage: string;
  /** Premium for this coverage in USD */
  premium: number;
}

/**
 * Detailed premium breakdown.
 * Story 10.6: AC-10.6.1 through AC-10.6.6
 */
export interface PremiumBreakdown {
  /** Base premium before taxes/fees */
  basePremium: number | null;
  /** Per-coverage premium itemization */
  coveragePremiums: CoveragePremium[];
  /** State/local taxes */
  taxes: number | null;
  /** Policy fees */
  fees: number | null;
  /** Broker/agent fee */
  brokerFee: number | null;
  /** Surplus lines tax (for non-admitted carriers) */
  surplusLinesTax: number | null;
  /** Total premium including all components */
  totalPremium: number;
  /** Payment plan description */
  paymentPlan: string | null;
  /** Pages where premium info is referenced */
  sourcePages: number[];
}
