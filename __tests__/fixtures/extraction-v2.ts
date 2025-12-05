/**
 * Version 2 Extraction Fixture (Epic 8/9)
 *
 * Represents extraction data from Epic 8/9 with some but not all Epic 10 fields.
 * Used to test backward compatibility with partially-enhanced extractions.
 *
 * Story 10.11: AC-10.11.1
 */

import type { QuoteExtraction } from '@/types/compare';

/**
 * V2 extraction - Epic 8/9 schema (partial Epic 10 fields)
 *
 * Notable differences from v3:
 * - May have some but not all Epic 10 fields populated
 * - CoverageItem enhanced fields may be present but incomplete
 */
export const v2Extraction: QuoteExtraction = {
  carrierName: 'Liberty Mutual',
  policyNumber: 'LM-2024-ABC',
  namedInsured: 'Tech Startup Inc',
  effectiveDate: '2024-06-01',
  expirationDate: '2025-06-01',
  annualPremium: 25000,
  coverages: [
    {
      type: 'general_liability',
      name: 'Commercial General Liability',
      limit: 2000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 2500,
      description: 'CGL with broad form coverage',
      sourcePages: [1, 2, 3],
      // V3 enhanced fields - partially populated
      aggregateLimit: 4000000,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'professional_liability',
      name: 'Errors & Omissions',
      limit: 1000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 5000,
      description: 'E&O coverage for professional services',
      sourcePages: [4, 5],
      aggregateLimit: 2000000,
      selfInsuredRetention: 10000,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'cyber',
      name: 'Cyber Liability',
      limit: 1000000,
      sublimit: 250000,
      limitType: 'aggregate',
      deductible: 10000,
      description: 'Comprehensive cyber coverage including breach response',
      sourcePages: [6, 7],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: '24 hours',
      indemnityPeriod: null,
    },
  ],
  exclusions: [
    {
      name: 'Prior Acts Exclusion',
      description: 'Excludes claims arising from acts before the retroactive date',
      category: 'other',
      sourcePages: [8],
    },
    {
      name: 'Intentional Acts',
      description: 'Excludes intentional wrongful acts',
      category: 'other',
      sourcePages: [8],
    },
  ],
  deductibles: [
    {
      type: 'Per Claim',
      amount: 5000,
      appliesTo: 'All Coverages',
      sourcePages: [3],
    },
  ],
  extractedAt: '2024-12-02T14:00:00Z',
  modelUsed: 'gpt-4o-mini',

  // Epic 10 fields - partially populated for v2
  policyMetadata: {
    formType: 'iso',
    formNumbers: ['CG 0001'],
    policyType: 'claims-made',
    retroactiveDate: '2022-01-01',
    extendedReportingPeriod: null,
    auditType: 'annual',
    sourcePages: [1],
  },
  endorsements: [], // Empty in v2
  carrierInfo: null, // Not extracted in v2
  premiumBreakdown: null, // Not extracted in v2
};

/**
 * V2 extraction with different carriers for comparison testing
 */
export const v2ExtractionAlternate: QuoteExtraction = {
  carrierName: 'Chubb',
  policyNumber: 'CHB-2024-XYZ',
  namedInsured: 'Tech Startup Inc',
  effectiveDate: '2024-06-01',
  expirationDate: '2025-06-01',
  annualPremium: 28000,
  coverages: [
    {
      type: 'general_liability',
      name: 'Commercial General Liability',
      limit: 2000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 1000,
      description: 'CGL coverage',
      sourcePages: [1, 2],
      aggregateLimit: 4000000,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
    {
      type: 'umbrella',
      name: 'Umbrella Liability',
      limit: 5000000,
      sublimit: null,
      limitType: 'aggregate',
      deductible: null,
      description: 'Excess umbrella coverage',
      sourcePages: [3],
      aggregateLimit: null,
      selfInsuredRetention: 10000,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
  ],
  exclusions: [],
  deductibles: [],
  extractedAt: '2024-12-02T15:00:00Z',
  modelUsed: 'gpt-4o',
  policyMetadata: {
    formType: 'proprietary',
    formNumbers: [],
    policyType: 'occurrence',
    retroactiveDate: null,
    extendedReportingPeriod: null,
    auditType: null,
    sourcePages: [1],
  },
  endorsements: [
    {
      formNumber: 'CG 20 10',
      name: 'Additional Insured - Owners, Lessees or Contractors',
      type: 'broadening',
      description: 'Adds additional insured coverage for ongoing operations',
      affectedCoverage: 'General Liability',
      sourcePages: [10],
    },
  ],
  carrierInfo: null,
  premiumBreakdown: null,
};

/**
 * V2 extraction with all fields null (edge case)
 */
export const v2ExtractionSparse: QuoteExtraction = {
  carrierName: 'Unknown Carrier',
  policyNumber: 'UNK-001',
  namedInsured: null,
  effectiveDate: null,
  expirationDate: null,
  annualPremium: 12000,
  coverages: [
    {
      type: 'other',
      name: 'Miscellaneous Coverage',
      limit: 100000,
      sublimit: null,
      limitType: null,
      deductible: null,
      description: 'Unspecified coverage',
      sourcePages: [],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    },
  ],
  exclusions: [],
  deductibles: [],
  extractedAt: '2024-12-02T16:00:00Z',
  modelUsed: 'gpt-4o',
  policyMetadata: null,
  endorsements: [],
  carrierInfo: null,
  premiumBreakdown: null,
};
