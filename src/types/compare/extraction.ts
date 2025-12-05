/**
 * Extraction Types
 *
 * Quote extraction and extraction service types.
 * Story 7.2: AC-7.2.1, AC-7.2.4, AC-7.2.8
 *
 * @module @/types/compare/extraction
 */

import type { CoverageItem } from './coverage';
import type { ExclusionItem } from './exclusion';
import type { PolicyMetadata, Endorsement, CarrierInfo, PremiumBreakdown } from './policy-metadata';

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
// Deductible Item
// ============================================================================

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
