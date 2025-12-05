/**
 * Version 1 Extraction Fixture (Epic 7)
 *
 * Represents extraction data from Epic 7 before Epic 10 enhancements.
 * Used to test backward compatibility with old extractions.
 *
 * Story 10.11: AC-10.11.1
 */

import type { QuoteExtraction } from '@/types/compare';

/**
 * V1 extraction - Epic 7 schema (before Epic 10 enhancements)
 *
 * Notable differences from v3:
 * - No policyMetadata, endorsements, carrierInfo, premiumBreakdown
 * - CoverageItem has no aggregateLimit, selfInsuredRetention, coinsurance, waitingPeriod, indemnityPeriod
 */
export const v1Extraction: QuoteExtraction = {
  carrierName: 'Hartford Insurance',
  policyNumber: 'POL-2024-001',
  namedInsured: 'ACME Corporation',
  effectiveDate: '2024-01-01',
  expirationDate: '2025-01-01',
  annualPremium: 15000,
  coverages: [
    {
      type: 'general_liability',
      name: 'Commercial General Liability',
      limit: 1000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 1000,
      description: 'CGL coverage including products and completed operations',
      sourcePages: [1, 2],
      // V3 fields - set to null for backward compatibility testing
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'property',
      name: 'Building and Contents',
      limit: 500000,
      sublimit: 50000,
      limitType: 'aggregate',
      deductible: 2500,
      description: 'Property coverage for building and business personal property',
      sourcePages: [3, 4],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
  ],
  exclusions: [
    {
      name: 'Flood Exclusion',
      description: 'Excludes damage caused by flood',
      category: 'flood',
      sourcePages: [5],
    },
    {
      name: 'Pollution Exclusion',
      description: 'Excludes pollution liability',
      category: 'pollution',
      sourcePages: [5],
    },
  ],
  deductibles: [
    {
      type: 'Per Occurrence',
      amount: 1000,
      appliesTo: 'General Liability',
      sourcePages: [2],
    },
  ],
  extractedAt: '2024-12-01T10:00:00Z',
  modelUsed: 'gpt-4o',

  // Epic 10 fields - null/empty for v1 compatibility
  policyMetadata: null,
  endorsements: [],
  carrierInfo: null,
  premiumBreakdown: null,
};

/**
 * V1 extraction with minimal data (all nullable fields are null)
 * Tests handling of sparse extraction data
 */
export const v1ExtractionMinimal: QuoteExtraction = {
  carrierName: null,
  policyNumber: null,
  namedInsured: null,
  effectiveDate: null,
  expirationDate: null,
  annualPremium: null,
  coverages: [],
  exclusions: [],
  deductibles: [],
  extractedAt: '2024-12-01T10:00:00Z',
  modelUsed: 'gpt-4o',
  policyMetadata: null,
  endorsements: [],
  carrierInfo: null,
  premiumBreakdown: null,
};

/**
 * V1 extraction with only 9 original coverage types (pre-Epic 10)
 */
export const v1ExtractionOriginalCoverages: QuoteExtraction = {
  carrierName: 'Travelers',
  policyNumber: 'TRV-001',
  namedInsured: 'Test Company',
  effectiveDate: '2024-01-01',
  expirationDate: '2025-01-01',
  annualPremium: 20000,
  coverages: [
    {
      type: 'general_liability',
      name: 'General Liability',
      limit: 1000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 1000,
      description: 'GL',
      sourcePages: [1],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'property',
      name: 'Property',
      limit: 500000,
      sublimit: null,
      limitType: 'aggregate',
      deductible: 2500,
      description: 'Property coverage',
      sourcePages: [2],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'umbrella',
      name: 'Umbrella/Excess',
      limit: 2000000,
      sublimit: null,
      limitType: 'aggregate',
      deductible: null,
      description: 'Umbrella coverage',
      sourcePages: [3],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'cyber',
      name: 'Cyber Liability',
      limit: 500000,
      sublimit: null,
      limitType: 'aggregate',
      deductible: 10000,
      description: 'Cyber coverage',
      sourcePages: [4],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
  ],
  exclusions: [],
  deductibles: [],
  extractedAt: '2024-12-01T12:00:00Z',
  modelUsed: 'gpt-4o',
  policyMetadata: null,
  endorsements: [],
  carrierInfo: null,
  premiumBreakdown: null,
};
