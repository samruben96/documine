/**
 * Compare Module Types
 *
 * TypeScript types for quote extraction and comparison.
 * Story 7.2: AC-7.2.1, AC-7.2.2, AC-7.2.3, AC-7.2.4
 *
 * @module @/types/compare
 */

import { z } from 'zod';

// ============================================================================
// Coverage Types
// ============================================================================

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

// ============================================================================
// Exclusion Types
// ============================================================================

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

// ============================================================================
// Source Reference
// ============================================================================

/**
 * Source reference for extracted data.
 * AC-7.2.4: Every extracted value includes source reference.
 */
export interface SourceReference {
  /** Page number where the value appears (1-indexed) */
  pageNumber: number;
  /** Text excerpt from the source (100-200 chars) */
  textExcerpt?: string;
  /** Reference to document_chunks.id for navigation */
  chunkId?: string;
}

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

// ============================================================================
// Extracted Data Items
// ============================================================================

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

/**
 * Deductible item extracted from a quote document.
 */
export interface DeductibleItem {
  /** Deductible type (e.g., "Per Occurrence", "Annual Aggregate") */
  type: string;
  /** Deductible amount in USD */
  amount: number;
  /** What coverage this deductible applies to */
  appliesTo: string;
  /** Pages where this deductible is referenced */
  sourcePages: number[];
}

// ============================================================================
// Quote Extraction
// ============================================================================

/**
 * Complete extraction result from a quote document.
 * AC-7.2.1: GPT-5.1 structured output schema.
 * Epic 10: Extended with policyMetadata, endorsements, carrierInfo, premiumBreakdown.
 */
export interface QuoteExtraction {
  /** Insurance carrier/company name */
  carrierName: string | null;
  /** Policy or quote number */
  policyNumber: string | null;
  /** Named insured (policyholder) */
  namedInsured: string | null;
  /** Policy effective date (ISO format YYYY-MM-DD) */
  effectiveDate: string | null;
  /** Policy expiration date (ISO format YYYY-MM-DD) */
  expirationDate: string | null;
  /** Total annual premium in USD */
  annualPremium: number | null;
  /** Extracted coverage items */
  coverages: CoverageItem[];
  /** Extracted exclusion items */
  exclusions: ExclusionItem[];
  /** Extracted deductible items */
  deductibles: DeductibleItem[];
  /** When extraction was performed (ISO timestamp) */
  extractedAt: string;
  /** Model used for extraction (e.g., 'gpt-5.1') */
  modelUsed: string;

  // Epic 10: Enhanced extraction fields (Stories 10.2, 10.4, 10.5, 10.6)
  /** Policy form and structure metadata (Story 10.2) */
  policyMetadata: PolicyMetadata | null;
  /** Endorsements attached to the policy (Story 10.4) */
  endorsements: Endorsement[];
  /** Carrier financial and contact information (Story 10.5) */
  carrierInfo: CarrierInfo | null;
  /** Detailed premium breakdown (Story 10.6) */
  premiumBreakdown: PremiumBreakdown | null;
}

// ============================================================================
// Extraction Service Types
// ============================================================================

/** Current extraction schema version for cache invalidation.
 * Epic 10: Bumped to 3 for Stories 10.2-10.6 (policy metadata, endorsements, carrier info, premium breakdown).
 */
export const EXTRACTION_VERSION = 3;

/**
 * Result from extraction service.
 * AC-7.2.8: Supports partial results with error indicator.
 */
export interface ExtractionResult {
  /** Whether extraction succeeded */
  success: boolean;
  /** Extraction data if successful */
  extraction?: QuoteExtraction;
  /** Whether result came from cache */
  cached: boolean;
  /** Error details if extraction failed */
  error?: {
    code: 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'NO_CHUNKS' | 'VALIDATION_ERROR';
    message: string;
    documentId: string;
  };
}

/**
 * Options for extraction service.
 */
export interface ExtractionOptions {
  /** Force re-extraction even if cached */
  forceRefresh?: boolean;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Zod schema for GPT-5.1 structured output extraction.
 * Used with OpenAI SDK's zodResponseFormat for guaranteed schema compliance.
 * Fields use .default(null) to ensure consistent null handling.
 */
export const coverageItemSchema = z.object({
  type: z.enum([
    'general_liability',
    'property',
    'auto_liability',
    'auto_physical_damage',
    'umbrella',
    'workers_comp',
    'professional_liability',
    'cyber',
    'other',
    // Epic 10: 12 new coverage types (AC-10.1.2)
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
  ]),
  name: z.string(),
  limit: z.number().nullable().default(null),
  sublimit: z.number().nullable().default(null),
  limitType: z
    .enum(['per_occurrence', 'aggregate', 'per_person', 'combined_single'])
    .nullable()
    .default(null),
  deductible: z.number().nullable().default(null),
  description: z.string(),
  sourcePages: z.array(z.number().int()),
  // Story 10.3: Enhanced Limits & Deductibles
  aggregateLimit: z.number().nullable().default(null),
  selfInsuredRetention: z.number().nullable().default(null),
  coinsurance: z.number().nullable().default(null),
  waitingPeriod: z.string().nullable().default(null),
  indemnityPeriod: z.string().nullable().default(null),
});

export const exclusionItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'flood',
    'earthquake',
    'pollution',
    'mold',
    'cyber',
    'employment',
    'other',
  ]),
  sourcePages: z.array(z.number().int()),
});

export const deductibleItemSchema = z.object({
  type: z.string(),
  amount: z.number(),
  appliesTo: z.string(),
  sourcePages: z.array(z.number().int()),
});

// Epic 10 Story 10.2: Policy Metadata Schema
export const policyMetadataSchema = z.object({
  formType: z.enum(['iso', 'proprietary', 'manuscript']).nullable().default(null),
  formNumbers: z.array(z.string()).default([]),
  policyType: z.enum(['occurrence', 'claims-made']).nullable().default(null),
  retroactiveDate: z.string().nullable().default(null),
  extendedReportingPeriod: z.string().nullable().default(null),
  auditType: z.enum(['annual', 'monthly', 'final', 'none']).nullable().default(null),
  sourcePages: z.array(z.number().int()).default([]),
});

// Epic 10 Story 10.4: Endorsement Schema
export const endorsementSchema = z.object({
  formNumber: z.string(),
  name: z.string(),
  type: z.enum(['broadening', 'restricting', 'conditional']),
  description: z.string(),
  affectedCoverage: z.string().nullable().default(null),
  sourcePages: z.array(z.number().int()).default([]),
});

// Epic 10 Story 10.5: Carrier Info Schema
export const carrierInfoSchema = z.object({
  amBestRating: z.string().nullable().default(null),
  amBestFinancialSize: z.string().nullable().default(null),
  naicCode: z.string().nullable().default(null),
  admittedStatus: z.enum(['admitted', 'non-admitted', 'surplus']).nullable().default(null),
  claimsPhone: z.string().nullable().default(null),
  underwriter: z.string().nullable().default(null),
  sourcePages: z.array(z.number().int()).default([]),
});

// Epic 10 Story 10.6: Coverage Premium Schema
export const coveragePremiumSchema = z.object({
  coverage: z.string(),
  premium: z.number(),
});

// Epic 10 Story 10.6: Premium Breakdown Schema
export const premiumBreakdownSchema = z.object({
  basePremium: z.number().nullable().default(null),
  coveragePremiums: z.array(coveragePremiumSchema).default([]),
  taxes: z.number().nullable().default(null),
  fees: z.number().nullable().default(null),
  brokerFee: z.number().nullable().default(null),
  surplusLinesTax: z.number().nullable().default(null),
  totalPremium: z.number(),
  paymentPlan: z.string().nullable().default(null),
  sourcePages: z.array(z.number().int()).default([]),
});

export const quoteExtractionSchema = z.object({
  carrierName: z.string().nullable().default(null),
  policyNumber: z.string().nullable().default(null),
  namedInsured: z.string().nullable().default(null),
  effectiveDate: z.string().nullable().default(null),
  expirationDate: z.string().nullable().default(null),
  annualPremium: z.number().nullable().default(null),
  coverages: z.array(coverageItemSchema),
  exclusions: z.array(exclusionItemSchema),
  deductibles: z.array(deductibleItemSchema),
  // Epic 10: Stories 10.2, 10.4, 10.5, 10.6
  policyMetadata: policyMetadataSchema.nullable().default(null),
  endorsements: z.array(endorsementSchema).default([]),
  carrierInfo: carrierInfoSchema.nullable().default(null),
  premiumBreakdown: premiumBreakdownSchema.nullable().default(null),
});

/**
 * GPT-5.1 structured output schema for quote extraction.
 * AC-7.2.1: Used with OpenAI chat completions API.
 */
export const EXTRACT_QUOTE_DATA_FUNCTION = {
  name: 'extract_quote_data',
  description: 'Extract structured insurance quote data from document content',
  parameters: {
    type: 'object',
    properties: {
      carrierName: {
        type: ['string', 'null'],
        description: 'Insurance company/carrier name',
      },
      policyNumber: {
        type: ['string', 'null'],
        description: 'Policy or quote number/identifier',
      },
      namedInsured: {
        type: ['string', 'null'],
        description: 'Named insured (policyholder name)',
      },
      effectiveDate: {
        type: ['string', 'null'],
        description: 'Coverage start date in YYYY-MM-DD format',
      },
      expirationDate: {
        type: ['string', 'null'],
        description: 'Coverage end date in YYYY-MM-DD format',
      },
      annualPremium: {
        type: ['number', 'null'],
        description: 'Annual premium amount in dollars',
      },
      coverages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
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
              ],
              description: 'Coverage type category',
            },
            name: {
              type: 'string',
              description: 'Coverage name as it appears in the document',
            },
            limit: {
              type: ['number', 'null'],
              description: 'Coverage limit in dollars',
            },
            sublimit: {
              type: ['number', 'null'],
              description: 'Sub-limit if applicable',
            },
            limitType: {
              type: 'string',
              enum: ['per_occurrence', 'aggregate', 'per_person', 'combined_single'],
              description: 'How the limit is applied',
            },
            deductible: {
              type: ['number', 'null'],
              description: 'Deductible amount in dollars',
            },
            description: {
              type: 'string',
              description: 'Brief description of what is covered',
            },
            sourcePages: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Page numbers where this coverage is referenced',
            },
            // Story 10.3: Enhanced Limits & Deductibles
            aggregateLimit: {
              type: ['number', 'null'],
              description: 'Aggregate limit (policy-period maximum)',
            },
            selfInsuredRetention: {
              type: ['number', 'null'],
              description: 'Self-Insured Retention (SIR) amount - insured pays first before coverage',
            },
            coinsurance: {
              type: ['number', 'null'],
              description: 'Coinsurance percentage (80, 90, 100) for property coverage',
            },
            waitingPeriod: {
              type: ['string', 'null'],
              description: 'Waiting period before coverage applies (e.g., "72 hours")',
            },
            indemnityPeriod: {
              type: ['string', 'null'],
              description: 'Maximum indemnity period for loss of income (e.g., "12 months")',
            },
          },
          required: ['type', 'name', 'description', 'sourcePages'],
        },
      },
      exclusions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Exclusion name/title',
            },
            description: {
              type: 'string',
              description: 'Description of what is excluded',
            },
            category: {
              type: 'string',
              enum: ['flood', 'earthquake', 'pollution', 'mold', 'cyber', 'employment', 'other'],
              description: 'Exclusion category for grouping',
            },
            sourcePages: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Page numbers where this exclusion is referenced',
            },
          },
          required: ['name', 'description', 'category', 'sourcePages'],
        },
      },
      deductibles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Deductible type (e.g., Per Occurrence)',
            },
            amount: {
              type: 'number',
              description: 'Deductible amount in dollars',
            },
            appliesTo: {
              type: 'string',
              description: 'What coverage this deductible applies to',
            },
            sourcePages: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Page numbers where this deductible is referenced',
            },
          },
          required: ['type', 'amount', 'appliesTo', 'sourcePages'],
        },
      },
      // Epic 10 Story 10.2: Policy Metadata
      policyMetadata: {
        type: ['object', 'null'],
        properties: {
          formType: {
            type: ['string', 'null'],
            enum: ['iso', 'proprietary', 'manuscript'],
            description: 'Form type (ISO, proprietary, manuscript)',
          },
          formNumbers: {
            type: 'array',
            items: { type: 'string' },
            description: 'ISO form numbers (CG 0001, CP 0010, etc.)',
          },
          policyType: {
            type: ['string', 'null'],
            enum: ['occurrence', 'claims-made'],
            description: 'Occurrence vs claims-made policy',
          },
          retroactiveDate: {
            type: ['string', 'null'],
            description: 'Retroactive date for claims-made (YYYY-MM-DD)',
          },
          extendedReportingPeriod: {
            type: ['string', 'null'],
            description: 'Extended reporting period options (tail coverage)',
          },
          auditType: {
            type: ['string', 'null'],
            enum: ['annual', 'monthly', 'final', 'none'],
            description: 'Premium audit provision type',
          },
          sourcePages: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Page numbers where metadata is found',
          },
        },
      },
      // Epic 10 Story 10.4: Endorsements
      endorsements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            formNumber: {
              type: 'string',
              description: 'Form number (CG 20 10, not CG2010)',
            },
            name: {
              type: 'string',
              description: 'Endorsement name/title',
            },
            type: {
              type: 'string',
              enum: ['broadening', 'restricting', 'conditional'],
              description: 'Impact type on coverage',
            },
            description: {
              type: 'string',
              description: 'What the endorsement does',
            },
            affectedCoverage: {
              type: ['string', 'null'],
              description: 'Coverage affected (null if policy-wide)',
            },
            sourcePages: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Page numbers where this endorsement is referenced',
            },
          },
          required: ['formNumber', 'name', 'type', 'description'],
        },
      },
      // Epic 10 Story 10.5: Carrier Information
      carrierInfo: {
        type: ['object', 'null'],
        properties: {
          amBestRating: {
            type: ['string', 'null'],
            description: 'AM Best rating (A++, A+, A, A-, B++, etc.)',
          },
          amBestFinancialSize: {
            type: ['string', 'null'],
            description: 'AM Best Financial Size Class (I-XV)',
          },
          naicCode: {
            type: ['string', 'null'],
            description: 'NAIC code for carrier identification',
          },
          admittedStatus: {
            type: ['string', 'null'],
            enum: ['admitted', 'non-admitted', 'surplus'],
            description: 'Admitted vs non-admitted/surplus lines status',
          },
          claimsPhone: {
            type: ['string', 'null'],
            description: 'Claims department phone number',
          },
          underwriter: {
            type: ['string', 'null'],
            description: 'Underwriter name',
          },
          sourcePages: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Page numbers where carrier info is found',
          },
        },
      },
      // Epic 10 Story 10.6: Premium Breakdown
      premiumBreakdown: {
        type: ['object', 'null'],
        properties: {
          basePremium: {
            type: ['number', 'null'],
            description: 'Base premium before taxes/fees',
          },
          coveragePremiums: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                coverage: { type: 'string' },
                premium: { type: 'number' },
              },
              required: ['coverage', 'premium'],
            },
            description: 'Per-coverage premium itemization',
          },
          taxes: {
            type: ['number', 'null'],
            description: 'State/local taxes',
          },
          fees: {
            type: ['number', 'null'],
            description: 'Policy fees',
          },
          brokerFee: {
            type: ['number', 'null'],
            description: 'Broker/agent fee',
          },
          surplusLinesTax: {
            type: ['number', 'null'],
            description: 'Surplus lines tax (for non-admitted carriers)',
          },
          totalPremium: {
            type: 'number',
            description: 'Total premium including all components',
          },
          paymentPlan: {
            type: ['string', 'null'],
            description: 'Payment plan description',
          },
          sourcePages: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Page numbers where premium info is found',
          },
        },
      },
    },
    required: ['coverages', 'exclusions', 'deductibles'],
  },
} as const;

// ============================================================================
// Comparison Types (for Story 7.3+)
// ============================================================================

/**
 * Document summary in comparison.
 */
export interface DocumentSummary {
  id: string;
  filename: string;
  carrierName: string | null;
  extractedAt: string;
  extracted: boolean;
  error?: string;
}

/**
 * Comparison data stored in comparisons table.
 */
export interface ComparisonData {
  status: 'processing' | 'complete' | 'partial' | 'failed';
  documents: DocumentSummary[];
  extractions?: QuoteExtraction[];
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}
