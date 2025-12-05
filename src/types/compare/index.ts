/**
 * Compare Module Types
 *
 * TypeScript types for quote extraction and comparison.
 * Story 7.2: AC-7.2.1, AC-7.2.2, AC-7.2.3, AC-7.2.4
 *
 * @module @/types/compare
 */

// ============================================================================
// Coverage Types
// ============================================================================

export type {
  CoverageType,
  LimitType,
  CoverageItem,
} from './coverage';

export {
  COVERAGE_TYPES,
  COVERAGE_TYPE_DISPLAY,
  LIMIT_TYPES,
} from './coverage';

// ============================================================================
// Exclusion Types
// ============================================================================

export type {
  ExclusionCategory,
  ExclusionItem,
} from './exclusion';

export {
  EXCLUSION_CATEGORIES,
} from './exclusion';

// ============================================================================
// Policy Metadata Types (Epic 10)
// ============================================================================

export type {
  FormType,
  PolicyType,
  AuditType,
  AdmittedStatus,
  PolicyMetadata,
  EndorsementType,
  Endorsement,
  CarrierInfo,
  CoveragePremium,
  PremiumBreakdown,
} from './policy-metadata';

export {
  CRITICAL_ENDORSEMENTS,
} from './policy-metadata';

// ============================================================================
// Extraction Types
// ============================================================================

export type {
  SourceReference,
  DeductibleItem,
  QuoteExtraction,
  ExtractionResult,
  ExtractionOptions,
} from './extraction';

export {
  EXTRACTION_VERSION,
} from './extraction';

// ============================================================================
// Gap Analysis Types
// ============================================================================

export type {
  GapImportance,
  MissingCoverage,
  LimitConcern,
  EndorsementGap,
  GapAnalysis,
} from './gap-analysis';

export {
  MINIMUM_LIMITS,
  CRITICAL_COVERAGES,
  RECOMMENDED_COVERAGES,
} from './gap-analysis';

// ============================================================================
// Comparison Types
// ============================================================================

export type {
  DocumentSummary,
  ComparisonData,
} from './comparison';

// ============================================================================
// Zod Schemas
// ============================================================================

export {
  coverageItemSchema,
  exclusionItemSchema,
  deductibleItemSchema,
  policyMetadataSchema,
  endorsementSchema,
  carrierInfoSchema,
  coveragePremiumSchema,
  premiumBreakdownSchema,
  quoteExtractionSchema,
  missingCoverageSchema,
  limitConcernSchema,
  endorsementGapSchema,
  gapAnalysisSchema,
  EXTRACT_QUOTE_DATA_FUNCTION,
} from './schemas';
