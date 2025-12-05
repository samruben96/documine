/**
 * Zod Schemas and GPT Function Definition
 *
 * Validation schemas for quote extraction.
 * Story 7.2: AC-7.2.1
 *
 * @module @/types/compare/schemas
 */

import { z } from 'zod';

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

// ============================================================================
// Gap Analysis Schemas
// ============================================================================

export const missingCoverageSchema = z.object({
  coverageType: z.enum([
    'general_liability', 'property', 'auto_liability', 'auto_physical_damage',
    'umbrella', 'workers_comp', 'professional_liability', 'cyber', 'other',
    'epli', 'd_and_o', 'crime', 'pollution', 'inland_marine', 'builders_risk',
    'business_interruption', 'product_liability', 'garage_liability',
    'liquor_liability', 'medical_malpractice', 'fiduciary',
  ]),
  importance: z.enum(['critical', 'recommended', 'optional']),
  reason: z.string(),
  presentIn: z.array(z.string()),
});

export const limitConcernSchema = z.object({
  coverage: z.string(),
  currentLimit: z.number(),
  recommendedMinimum: z.number(),
  reason: z.string(),
  documentIndex: z.number().int(),
  carrierName: z.string(),
});

export const endorsementGapSchema = z.object({
  endorsement: z.string(),
  formNumber: z.string().nullable(),
  importance: z.enum(['critical', 'recommended', 'optional']),
  reason: z.string(),
  presentIn: z.array(z.string()),
});

export const gapAnalysisSchema = z.object({
  missingCoverages: z.array(missingCoverageSchema),
  limitConcerns: z.array(limitConcernSchema),
  endorsementGaps: z.array(endorsementGapSchema),
  overallRiskScore: z.number().min(0).max(100),
});

// ============================================================================
// GPT Function Schema
// ============================================================================

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
