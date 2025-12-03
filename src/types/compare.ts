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
  | 'other';

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
];

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
// Extracted Data Items
// ============================================================================

/**
 * Coverage item extracted from a quote document.
 * AC-7.2.2: Each coverage includes type, limit, deductible, sourceRef.
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
 * AC-7.2.1: GPT-4o function calling schema output.
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
  /** Model used for extraction (e.g., 'gpt-4o') */
  modelUsed: string;
}

// ============================================================================
// Extraction Service Types
// ============================================================================

/** Current extraction schema version for cache invalidation */
export const EXTRACTION_VERSION = 1;

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
});

/**
 * GPT-4o function calling schema for quote extraction.
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
