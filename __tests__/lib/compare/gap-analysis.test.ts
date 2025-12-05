/**
 * Gap Analysis Service Tests
 *
 * Story 10.7: AC-10.7.1 through AC-10.7.6
 * Tests automated gap analysis for insurance quote comparisons.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeGaps,
  detectMissingCoverages,
  detectLimitConcerns,
  detectEndorsementGaps,
  calculateRiskScore,
  getRiskLevel,
} from '@/lib/compare/gap-analysis';
import type { QuoteExtraction, CoverageItem, Endorsement } from '@/types/compare';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockCoverage = (
  type: CoverageItem['type'],
  limit: number | null = null,
  deductible: number | null = null
): CoverageItem => ({
  type,
  name: type.replace(/_/g, ' '),
  limit,
  sublimit: null,
  limitType: 'per_occurrence',
  deductible,
  description: `Mock ${type} coverage`,
  sourcePages: [1],
  aggregateLimit: null,
  selfInsuredRetention: null,
  coinsurance: null,
  waitingPeriod: null,
  indemnityPeriod: null,
});

const createMockEndorsement = (
  formNumber: string,
  name: string,
  type: Endorsement['type'] = 'broadening'
): Endorsement => ({
  formNumber,
  name,
  type,
  description: `Mock endorsement ${formNumber}`,
  affectedCoverage: null,
  sourcePages: [1],
});

const createMockExtraction = (
  carrierName: string,
  coverages: CoverageItem[] = [],
  endorsements: Endorsement[] = []
): QuoteExtraction => ({
  carrierName,
  policyNumber: 'POL-12345',
  namedInsured: 'Test Company',
  effectiveDate: '2024-01-01',
  expirationDate: '2025-01-01',
  annualPremium: 10000,
  coverages,
  exclusions: [],
  deductibles: [],
  extractedAt: new Date().toISOString(),
  modelUsed: 'gpt-5.1',
  policyMetadata: null,
  endorsements,
  carrierInfo: null,
  premiumBreakdown: null,
});

// ============================================================================
// detectMissingCoverages Tests
// ============================================================================

describe('detectMissingCoverages', () => {
  it('returns empty array for single extraction', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 1000000)]),
    ];

    const result = detectMissingCoverages(extractions);
    expect(result).toEqual([]);
  });

  it('detects missing coverage when one quote has it and another does not', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 1000000)]),
      createMockExtraction('Carrier B', []),
    ];

    const result = detectMissingCoverages(extractions);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      coverageType: 'general_liability',
      importance: 'critical',
      presentIn: ['Carrier A'],
    });
  });

  it('classifies critical coverages correctly (AC-10.7.1)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [
        createMockCoverage('general_liability', 1000000),
        createMockCoverage('property', 500000),
        createMockCoverage('workers_comp', 100000),
      ]),
      createMockExtraction('Carrier B', []),
    ];

    const result = detectMissingCoverages(extractions);

    // All three are critical coverages
    expect(result).toHaveLength(3);
    result.forEach((gap) => {
      expect(gap.importance).toBe('critical');
    });
  });

  it('classifies recommended coverages correctly', () => {
    const extractions = [
      createMockExtraction('Carrier A', [
        createMockCoverage('umbrella', 1000000),
        createMockCoverage('professional_liability', 1000000),
      ]),
      createMockExtraction('Carrier B', []),
    ];

    const result = detectMissingCoverages(extractions);

    expect(result).toHaveLength(2);
    result.forEach((gap) => {
      expect(gap.importance).toBe('recommended');
    });
  });

  it('classifies optional coverages correctly', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('cyber', 500000)]),
      createMockExtraction('Carrier B', []),
    ];

    const result = detectMissingCoverages(extractions);

    expect(result).toHaveLength(1);
    expect(result[0]!.importance).toBe('optional');
  });

  it('sorts by importance (critical -> recommended -> optional)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [
        createMockCoverage('cyber', 500000), // optional
        createMockCoverage('umbrella', 1000000), // recommended
        createMockCoverage('general_liability', 1000000), // critical
      ]),
      createMockExtraction('Carrier B', []),
    ];

    const result = detectMissingCoverages(extractions);

    expect(result).toHaveLength(3);
    expect(result[0]!.importance).toBe('critical');
    expect(result[1]!.importance).toBe('recommended');
    expect(result[2]!.importance).toBe('optional');
  });

  it('does not flag coverage present in all quotes', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 1000000)]),
      createMockExtraction('Carrier B', [createMockCoverage('general_liability', 2000000)]),
    ];

    const result = detectMissingCoverages(extractions);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// detectLimitConcerns Tests
// ============================================================================

describe('detectLimitConcerns', () => {
  it('detects inadequate GL limit (AC-10.7.2)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 500000)]),
    ];

    const result = detectLimitConcerns(extractions);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      coverage: 'General Liability',
      currentLimit: 500000,
      recommendedMinimum: 1000000,
      carrierName: 'Carrier A',
    });
  });

  it('does not flag adequate limits', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 1000000)]),
    ];

    const result = detectLimitConcerns(extractions);
    expect(result).toEqual([]);
  });

  it('detects multiple inadequate limits across quotes', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 500000)]),
      createMockExtraction('Carrier B', [createMockCoverage('property', 100000)]),
    ];

    const result = detectLimitConcerns(extractions);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.carrierName)).toContain('Carrier A');
    expect(result.map((c) => c.carrierName)).toContain('Carrier B');
  });

  it('handles null limits gracefully', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', null)]),
    ];

    const result = detectLimitConcerns(extractions);
    expect(result).toEqual([]);
  });

  it('sorts by recommended minimum (highest first)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [
        createMockCoverage('cyber', 100000), // min 500k
        createMockCoverage('general_liability', 500000), // min 1M
        createMockCoverage('umbrella', 500000), // min 1M
      ]),
    ];

    const result = detectLimitConcerns(extractions);

    expect(result).toHaveLength(3);
    // General liability and umbrella both have 1M minimum, cyber has 500k
    expect(result[0]!.recommendedMinimum).toBeGreaterThanOrEqual(result[1]!.recommendedMinimum);
    expect(result[1]!.recommendedMinimum).toBeGreaterThanOrEqual(result[2]!.recommendedMinimum);
  });
});

// ============================================================================
// detectEndorsementGaps Tests
// ============================================================================

describe('detectEndorsementGaps', () => {
  it('returns empty array for single extraction', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [],
        [createMockEndorsement('CG 20 10', 'Additional Insured')]
      ),
    ];

    const result = detectEndorsementGaps(extractions);
    expect(result).toEqual([]);
  });

  it('detects missing critical endorsement (AC-10.7.3)', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [],
        [createMockEndorsement('CG 20 10', 'Additional Insured - Owners, Lessees or Contractors')]
      ),
      createMockExtraction('Carrier B', [], []),
    ];

    const result = detectEndorsementGaps(extractions);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      formNumber: 'CG 20 10',
      endorsement: 'Additional Insured - Owners, Lessees or Contractors',
      importance: 'critical',
      presentIn: ['Carrier A'],
    });
  });

  it('matches endorsements with different spacing', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [],
        [createMockEndorsement('CG  20  10', 'Additional Insured')] // Extra spaces
      ),
      createMockExtraction('Carrier B', [], []),
    ];

    const result = detectEndorsementGaps(extractions);

    // Should match CG 20 10 despite spacing differences
    expect(result).toHaveLength(1);
    expect(result[0]!.formNumber).toBe('CG 20 10');
  });

  it('does not flag endorsement present in all quotes', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [],
        [createMockEndorsement('CG 20 10', 'Additional Insured')]
      ),
      createMockExtraction(
        'Carrier B',
        [],
        [createMockEndorsement('CG 20 10', 'Additional Insured')]
      ),
    ];

    const result = detectEndorsementGaps(extractions);
    expect(result).toEqual([]);
  });

  it('sorts by importance (critical -> recommended)', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [],
        [
          createMockEndorsement('CG 20 01', 'Primary and Non-Contributory'), // recommended
          createMockEndorsement('CG 20 10', 'Additional Insured'), // critical
        ]
      ),
      createMockExtraction('Carrier B', [], []),
    ];

    const result = detectEndorsementGaps(extractions);

    expect(result).toHaveLength(2);
    expect(result[0]!.importance).toBe('critical');
    expect(result[1]!.importance).toBe('recommended');
  });
});

// ============================================================================
// calculateRiskScore Tests
// ============================================================================

describe('calculateRiskScore', () => {
  it('returns 0 for no gaps', () => {
    const score = calculateRiskScore([], [], []);
    expect(score).toBe(0);
  });

  it('adds 25 points per critical missing coverage (AC-10.7.4)', () => {
    const missingCoverages = [
      { coverageType: 'general_liability' as const, importance: 'critical' as const, reason: '', presentIn: [] },
    ];
    const score = calculateRiskScore(missingCoverages, [], []);
    expect(score).toBe(25);
  });

  it('adds 10 points per recommended missing coverage', () => {
    const missingCoverages = [
      { coverageType: 'umbrella' as const, importance: 'recommended' as const, reason: '', presentIn: [] },
    ];
    const score = calculateRiskScore(missingCoverages, [], []);
    expect(score).toBe(10);
  });

  it('adds 5 points per optional missing coverage', () => {
    const missingCoverages = [
      { coverageType: 'cyber' as const, importance: 'optional' as const, reason: '', presentIn: [] },
    ];
    const score = calculateRiskScore(missingCoverages, [], []);
    expect(score).toBe(5);
  });

  it('adds 15 points per limit concern', () => {
    const limitConcerns = [
      { coverage: 'GL', currentLimit: 500000, recommendedMinimum: 1000000, reason: '', documentIndex: 0, carrierName: 'A' },
    ];
    const score = calculateRiskScore([], limitConcerns, []);
    expect(score).toBe(15);
  });

  it('adds 20 points per critical endorsement gap', () => {
    const endorsementGaps = [
      { endorsement: 'AI', formNumber: 'CG 20 10', importance: 'critical' as const, reason: '', presentIn: [] },
    ];
    const score = calculateRiskScore([], [], endorsementGaps);
    expect(score).toBe(20);
  });

  it('adds 5 points per recommended endorsement gap', () => {
    const endorsementGaps = [
      { endorsement: 'Primary', formNumber: 'CG 20 01', importance: 'recommended' as const, reason: '', presentIn: [] },
    ];
    const score = calculateRiskScore([], [], endorsementGaps);
    expect(score).toBe(5);
  });

  it('caps score at 100', () => {
    // Create many issues to exceed 100
    const missingCoverages = Array(10).fill({
      coverageType: 'general_liability' as const,
      importance: 'critical' as const,
      reason: '',
      presentIn: [],
    });
    const score = calculateRiskScore(missingCoverages, [], []);
    expect(score).toBe(100);
  });

  it('calculates combined score correctly', () => {
    // 1 critical coverage (25) + 1 limit concern (15) + 1 critical endorsement (20) = 60
    const missingCoverages = [
      { coverageType: 'general_liability' as const, importance: 'critical' as const, reason: '', presentIn: [] },
    ];
    const limitConcerns = [
      { coverage: 'GL', currentLimit: 500000, recommendedMinimum: 1000000, reason: '', documentIndex: 0, carrierName: 'A' },
    ];
    const endorsementGaps = [
      { endorsement: 'AI', formNumber: 'CG 20 10', importance: 'critical' as const, reason: '', presentIn: [] },
    ];

    const score = calculateRiskScore(missingCoverages, limitConcerns, endorsementGaps);
    expect(score).toBe(60);
  });
});

// ============================================================================
// getRiskLevel Tests
// ============================================================================

describe('getRiskLevel', () => {
  it('returns low for score < 30 (AC-10.7.6)', () => {
    expect(getRiskLevel(0)).toBe('low');
    expect(getRiskLevel(15)).toBe('low');
    expect(getRiskLevel(29)).toBe('low');
  });

  it('returns medium for score 30-59', () => {
    expect(getRiskLevel(30)).toBe('medium');
    expect(getRiskLevel(45)).toBe('medium');
    expect(getRiskLevel(59)).toBe('medium');
  });

  it('returns high for score >= 60', () => {
    expect(getRiskLevel(60)).toBe('high');
    expect(getRiskLevel(80)).toBe('high');
    expect(getRiskLevel(100)).toBe('high');
  });
});

// ============================================================================
// analyzeGaps (Main Function) Tests
// ============================================================================

describe('analyzeGaps', () => {
  it('returns complete GapAnalysis object (AC-10.7.5)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 1000000)]),
      createMockExtraction('Carrier B', []),
    ];

    const result = analyzeGaps(extractions);

    expect(result).toHaveProperty('missingCoverages');
    expect(result).toHaveProperty('limitConcerns');
    expect(result).toHaveProperty('endorsementGaps');
    expect(result).toHaveProperty('overallRiskScore');
    expect(Array.isArray(result.missingCoverages)).toBe(true);
    expect(Array.isArray(result.limitConcerns)).toBe(true);
    expect(Array.isArray(result.endorsementGaps)).toBe(true);
    expect(typeof result.overallRiskScore).toBe('number');
  });

  it('integrates all detection functions', () => {
    const extractions = [
      createMockExtraction(
        'Carrier A',
        [createMockCoverage('general_liability', 500000)], // Inadequate limit
        [createMockEndorsement('CG 20 10', 'Additional Insured')]
      ),
      createMockExtraction('Carrier B', [], []), // Missing coverage and endorsement
    ];

    const result = analyzeGaps(extractions);

    expect(result.missingCoverages.length).toBeGreaterThan(0);
    expect(result.limitConcerns.length).toBeGreaterThan(0);
    expect(result.endorsementGaps.length).toBeGreaterThan(0);
    expect(result.overallRiskScore).toBeGreaterThan(0);
  });

  it('handles empty extractions array', () => {
    const result = analyzeGaps([]);

    expect(result.missingCoverages).toEqual([]);
    expect(result.limitConcerns).toEqual([]);
    expect(result.endorsementGaps).toEqual([]);
    expect(result.overallRiskScore).toBe(0);
  });

  it('handles single extraction (no comparison possible)', () => {
    const extractions = [
      createMockExtraction('Carrier A', [createMockCoverage('general_liability', 500000)]),
    ];

    const result = analyzeGaps(extractions);

    // Single extraction can't have missing coverages or endorsement gaps
    expect(result.missingCoverages).toEqual([]);
    expect(result.endorsementGaps).toEqual([]);
    // But can have limit concerns
    expect(result.limitConcerns.length).toBeGreaterThan(0);
  });
});
