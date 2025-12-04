/**
 * Gap and Conflict Detection Tests
 *
 * Story 7.4: AC-7.4.1, AC-7.4.3, AC-7.4.6
 * Tests for detectGaps, detectConflicts, and row annotation.
 */

import { describe, it, expect } from 'vitest';
import {
  detectGaps,
  detectConflicts,
  buildComparisonRows,
  COVERAGE_SEVERITY,
  type GapWarning,
  type ConflictWarning,
} from '@/lib/compare/diff';
import type { QuoteExtraction, CoverageItem, ExclusionItem } from '@/types/compare';

// ============================================================================
// Test Fixtures
// ============================================================================

function createCoverage(
  type: CoverageItem['type'],
  limit: number | null = 1000000,
  deductible: number | null = 1000
): CoverageItem {
  return {
    type,
    name: `${type} Coverage`,
    limit,
    sublimit: null,
    limitType: 'per_occurrence',
    deductible,
    description: 'Test coverage',
    sourcePages: [1],
  };
}

function createExclusion(category: ExclusionItem['category']): ExclusionItem {
  return {
    name: `${category} Exclusion`,
    description: `Excludes ${category} damage`,
    category,
    sourcePages: [5],
  };
}

function createExtraction(
  carrierName: string,
  coverages: CoverageItem[],
  exclusions: ExclusionItem[] = []
): QuoteExtraction {
  return {
    carrierName,
    policyNumber: 'POL-001',
    namedInsured: 'Test Corp',
    effectiveDate: '2024-01-01',
    expirationDate: '2025-01-01',
    annualPremium: 10000,
    coverages,
    exclusions,
    deductibles: [],
    extractedAt: new Date().toISOString(),
    modelUsed: 'gpt-5.1',
  };
}

// ============================================================================
// Gap Detection Tests
// ============================================================================

describe('detectGaps', () => {
  it('returns empty array when less than 2 extractions', () => {
    const extraction = createExtraction('Hartford', [
      createCoverage('general_liability'),
    ]);
    expect(detectGaps([extraction])).toEqual([]);
    expect(detectGaps([])).toEqual([]);
  });

  it('AC-7.4.1: detects coverage present in some quotes but missing in others', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'),
      createCoverage('property'),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability'),
      // Missing property coverage
    ]);

    const gaps = detectGaps([quote1, quote2]);

    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.field).toBe('Property');
    expect(gaps[0]!.coverageType).toBe('property');
    expect(gaps[0]!.documentsPresent).toEqual([0]);
    expect(gaps[0]!.documentsMissing).toEqual([1]);
  });

  it('detects multiple gaps across quotes', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'),
      createCoverage('cyber'),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability'),
      createCoverage('property'),
    ]);

    const gaps = detectGaps([quote1, quote2]);

    expect(gaps).toHaveLength(2);
    const gapTypes = gaps.map((g) => g.coverageType);
    expect(gapTypes).toContain('property');
    expect(gapTypes).toContain('cyber');
  });

  it('returns no gaps when all quotes have same coverages', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'),
      createCoverage('property'),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability'),
      createCoverage('property'),
    ]);

    const gaps = detectGaps([quote1, quote2]);
    expect(gaps).toEqual([]);
  });

  it('AC-7.4.6: sorts gaps by severity (high → medium → low)', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'), // high
      createCoverage('cyber'), // low
      createCoverage('property'), // high
      createCoverage('auto_liability'), // medium
    ]);
    const quote2 = createExtraction('Travelers', [
      // All coverages missing - should detect 4 gaps
    ]);

    const gaps = detectGaps([quote1, quote2]);

    // Should be sorted: high (GL, Property), medium (Auto), low (Cyber)
    expect(gaps.length).toBeGreaterThanOrEqual(4);
    const severities = gaps.map((g) => g.severity);
    const highIndex = severities.indexOf('high');
    const mediumIndex = severities.indexOf('medium');
    const lowIndex = severities.indexOf('low');

    // High should come before medium, medium before low
    if (highIndex >= 0 && mediumIndex >= 0) {
      expect(highIndex).toBeLessThan(mediumIndex);
    }
    if (mediumIndex >= 0 && lowIndex >= 0) {
      expect(mediumIndex).toBeLessThan(lowIndex);
    }
  });

  it('assigns correct severity based on coverage type', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'),
      createCoverage('workers_comp'),
      createCoverage('umbrella'),
      createCoverage('cyber'),
    ]);
    const quote2 = createExtraction('Travelers', []);

    const gaps = detectGaps([quote1, quote2]);

    const glGap = gaps.find((g) => g.coverageType === 'general_liability');
    const wcGap = gaps.find((g) => g.coverageType === 'workers_comp');
    const umbrellaGap = gaps.find((g) => g.coverageType === 'umbrella');
    const cyberGap = gaps.find((g) => g.coverageType === 'cyber');

    expect(glGap?.severity).toBe('high');
    expect(wcGap?.severity).toBe('high');
    expect(umbrellaGap?.severity).toBe('medium');
    expect(cyberGap?.severity).toBe('low');
  });

  it('handles 4 documents with varied coverage', () => {
    const quotes = [
      createExtraction('Hartford', [
        createCoverage('general_liability'),
        createCoverage('property'),
      ]),
      createExtraction('Travelers', [createCoverage('general_liability')]),
      createExtraction('Liberty', [
        createCoverage('general_liability'),
        createCoverage('property'),
        createCoverage('cyber'),
      ]),
      createExtraction('Chubb', [createCoverage('property')]),
    ];

    const gaps = detectGaps(quotes);

    // Property gap: missing in [1] (Travelers)
    const propertyGap = gaps.find((g) => g.coverageType === 'property');
    expect(propertyGap).toBeDefined();
    expect(propertyGap?.documentsMissing).toContain(1);

    // Cyber gap: only in [2] (Liberty)
    const cyberGap = gaps.find((g) => g.coverageType === 'cyber');
    expect(cyberGap).toBeDefined();
    expect(cyberGap?.documentsPresent).toEqual([2]);
  });
});

// ============================================================================
// Conflict Detection Tests
// ============================================================================

describe('detectConflicts', () => {
  it('returns empty array when less than 2 extractions', () => {
    const extraction = createExtraction('Hartford', [
      createCoverage('general_liability'),
    ]);
    expect(detectConflicts([extraction])).toEqual([]);
    expect(detectConflicts([])).toEqual([]);
  });

  it('AC-7.4.3: detects limit variance >50%', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 300000), // 70% difference
    ]);

    const conflicts = detectConflicts([quote1, quote2]);

    const limitConflict = conflicts.find((c) => c.conflictType === 'limit_variance');
    expect(limitConflict).toBeDefined();
    expect(limitConflict?.field).toBe('General Liability');
    expect(limitConflict?.severity).toBe('high'); // GL is high severity
  });

  it('does not flag limit variance <=50%', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 600000), // 40% difference - below threshold
    ]);

    const conflicts = detectConflicts([quote1, quote2]);
    const limitConflicts = conflicts.filter((c) => c.conflictType === 'limit_variance');
    expect(limitConflicts).toHaveLength(0);
  });

  it('AC-7.4.3: detects deductible variance >100%', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('property', 500000, 1000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('property', 500000, 5000), // 400% higher
    ]);

    const conflicts = detectConflicts([quote1, quote2]);

    const deductibleConflict = conflicts.find(
      (c) => c.conflictType === 'deductible_variance'
    );
    expect(deductibleConflict).toBeDefined();
    expect(deductibleConflict?.description).toContain('deductible');
  });

  it('does not flag deductible variance <=100%', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('property', 500000, 1000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('property', 500000, 1500), // 50% higher - below threshold
    ]);

    const conflicts = detectConflicts([quote1, quote2]);
    const deductibleConflicts = conflicts.filter(
      (c) => c.conflictType === 'deductible_variance'
    );
    expect(deductibleConflicts).toHaveLength(0);
  });

  it('AC-7.4.3: detects exclusion mismatches', () => {
    const quote1 = createExtraction(
      'Hartford',
      [createCoverage('property')],
      [createExclusion('flood')]
    );
    const quote2 = createExtraction('Travelers', [createCoverage('property')], []); // No flood exclusion

    const conflicts = detectConflicts([quote1, quote2]);

    const exclusionConflict = conflicts.find(
      (c) => c.conflictType === 'exclusion_mismatch'
    );
    expect(exclusionConflict).toBeDefined();
    expect(exclusionConflict?.field).toBe('Flood Exclusion');
    expect(exclusionConflict?.severity).toBe('high'); // Flood is high severity
  });

  it('AC-7.4.6: sorts conflicts by severity', () => {
    const quote1 = createExtraction(
      'Hartford',
      [
        createCoverage('general_liability', 1000000), // high
        createCoverage('cyber', 100000), // low
      ],
      [createExclusion('flood')] // high
    );
    const quote2 = createExtraction(
      'Travelers',
      [
        createCoverage('general_liability', 300000), // 70% variance
        createCoverage('cyber', 30000), // 70% variance
      ],
      [] // no flood exclusion
    );

    const conflicts = detectConflicts([quote1, quote2]);

    expect(conflicts.length).toBeGreaterThan(0);
    const severities = conflicts.map((c) => c.severity);
    const highIndices = severities
      .map((s, i) => (s === 'high' ? i : -1))
      .filter((i) => i >= 0);
    const lowIndices = severities
      .map((s, i) => (s === 'low' ? i : -1))
      .filter((i) => i >= 0);

    // High severity conflicts should come before low
    if (highIndices.length > 0 && lowIndices.length > 0) {
      expect(Math.max(...highIndices)).toBeLessThan(Math.min(...lowIndices));
    }
  });

  it('handles multiple exclusion categories', () => {
    const quote1 = createExtraction(
      'Hartford',
      [createCoverage('property')],
      [createExclusion('flood'), createExclusion('earthquake'), createExclusion('mold')]
    );
    const quote2 = createExtraction(
      'Travelers',
      [createCoverage('property')],
      [createExclusion('flood')] // Only flood, missing earthquake and mold
    );

    const conflicts = detectConflicts([quote1, quote2]);

    const exclusionMismatches = conflicts.filter(
      (c) => c.conflictType === 'exclusion_mismatch'
    );
    // Should detect earthquake and mold mismatches
    expect(exclusionMismatches.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// buildComparisonRows Integration Tests
// ============================================================================

describe('buildComparisonRows with gap/conflict detection', () => {
  it('includes gaps and conflicts in output', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000),
      createCoverage('property', 500000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 300000), // 70% variance - conflict
      // Missing property - gap
    ]);

    const result = buildComparisonRows([quote1, quote2]);

    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('annotates rows with isGap flag', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability'),
      createCoverage('property'),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability'),
      // Missing property
    ]);

    const result = buildComparisonRows([quote1, quote2]);

    // Find property limit row
    const propertyRow = result.rows.find(
      (r) => r.coverageType === 'property' && !r.isSubRow
    );
    expect(propertyRow).toBeDefined();
    expect(propertyRow?.isGap).toBe(true);
    expect(propertyRow?.gapSeverity).toBe('high');
  });

  it('annotates rows with isConflict flag for limit variance', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 300000),
    ]);

    const result = buildComparisonRows([quote1, quote2]);

    // Find GL limit row
    const glRow = result.rows.find(
      (r) => r.coverageType === 'general_liability' && !r.isSubRow
    );
    expect(glRow).toBeDefined();
    expect(glRow?.isConflict).toBe(true);
    expect(glRow?.conflictSeverity).toBe('high');
  });

  it('does not annotate deductible sub-rows with conflict', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000, 1000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 300000, 1000),
    ]);

    const result = buildComparisonRows([quote1, quote2]);

    // Find GL deductible row (sub-row)
    const glDeductibleRow = result.rows.find(
      (r) => r.coverageType === 'general_liability' && r.isSubRow
    );
    // Deductible rows should not be marked as conflict (only limit rows)
    expect(glDeductibleRow?.isConflict).toBeFalsy();
  });

  it('handles quotes with no gaps or conflicts', () => {
    const quote1 = createExtraction('Hartford', [
      createCoverage('general_liability', 1000000),
    ]);
    const quote2 = createExtraction('Travelers', [
      createCoverage('general_liability', 800000), // Within 50% variance
    ]);

    const result = buildComparisonRows([quote1, quote2]);

    expect(result.gaps).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
  });
});

// ============================================================================
// Coverage Severity Mapping Tests
// ============================================================================

describe('COVERAGE_SEVERITY', () => {
  it('maps high severity coverages correctly', () => {
    expect(COVERAGE_SEVERITY.general_liability).toBe('high');
    expect(COVERAGE_SEVERITY.property).toBe('high');
    expect(COVERAGE_SEVERITY.workers_comp).toBe('high');
  });

  it('maps medium severity coverages correctly', () => {
    expect(COVERAGE_SEVERITY.auto_liability).toBe('medium');
    expect(COVERAGE_SEVERITY.professional_liability).toBe('medium');
    expect(COVERAGE_SEVERITY.umbrella).toBe('medium');
  });

  it('maps low severity coverages correctly', () => {
    expect(COVERAGE_SEVERITY.auto_physical_damage).toBe('low');
    expect(COVERAGE_SEVERITY.cyber).toBe('low');
    expect(COVERAGE_SEVERITY.other).toBe('low');
  });
});
