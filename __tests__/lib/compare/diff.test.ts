/**
 * DiffEngine Unit Tests
 *
 * Story 7.3: AC-7.3.3, AC-7.3.4, AC-7.3.5
 * Tests for comparison logic, best/worst calculation, and difference detection.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBestWorst,
  detectDifference,
  buildComparisonRows,
  formatCurrency,
  formatDate,
  formatValue,
  COVERAGE_TYPE_LABELS,
  type CellValue,
} from '@/lib/compare/diff';
import type { QuoteExtraction } from '@/types/compare';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockExtraction(overrides: Partial<QuoteExtraction> = {}): QuoteExtraction {
  return {
    carrierName: 'Test Carrier',
    policyNumber: 'POL-001',
    namedInsured: 'Test Insured',
    effectiveDate: '2024-01-01',
    expirationDate: '2025-01-01',
    annualPremium: 10000,
    coverages: [],
    exclusions: [],
    deductibles: [],
    extractedAt: '2024-12-03T12:00:00Z',
    modelUsed: 'gpt-4o',
    ...overrides,
  };
}

function createCellValue(
  displayValue: string,
  rawValue: number | string | null,
  status: 'found' | 'not_found' = 'found'
): CellValue {
  return { displayValue, rawValue, status };
}

// ============================================================================
// formatCurrency Tests
// ============================================================================

describe('formatCurrency', () => {
  it('formats positive numbers as USD currency', () => {
    expect(formatCurrency(10000)).toBe('$10,000');
    expect(formatCurrency(1500000)).toBe('$1,500,000');
    expect(formatCurrency(500)).toBe('$500');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('returns dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });
});

// ============================================================================
// formatDate Tests
// ============================================================================

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
    expect(formatDate('2024-12-25')).toBe('Dec 25, 2024');
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns original string for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('Invalid Date');
  });
});

// ============================================================================
// formatValue Tests
// ============================================================================

describe('formatValue', () => {
  it('formats currency types', () => {
    expect(formatValue(5000, 'premium')).toBe('$5,000');
    expect(formatValue(100000, 'coverage_limit')).toBe('$100,000');
    expect(formatValue(2500, 'deductible')).toBe('$2,500');
  });

  it('formats dates', () => {
    expect(formatValue('2024-06-15', 'date')).toBe('Jun 15, 2024');
  });

  it('formats text and count', () => {
    expect(formatValue('Test', 'text')).toBe('Test');
    expect(formatValue(5, 'count')).toBe('5');
  });

  it('returns dash for null', () => {
    expect(formatValue(null, 'premium')).toBe('—');
    expect(formatValue(null, 'text')).toBe('—');
  });
});

// ============================================================================
// calculateBestWorst Tests
// ============================================================================

describe('calculateBestWorst', () => {
  describe('when higher is better (limits)', () => {
    it('identifies highest value as best, lowest as worst', () => {
      const result = calculateBestWorst([500000, 1000000, 750000], true);
      expect(result.bestIndex).toBe(1); // 1,000,000
      expect(result.worstIndex).toBe(0); // 500,000
    });

    it('handles more than 3 values', () => {
      const result = calculateBestWorst([100, 400, 200, 300], true);
      expect(result.bestIndex).toBe(1); // 400
      expect(result.worstIndex).toBe(0); // 100
    });
  });

  describe('when lower is better (premium, deductibles)', () => {
    it('identifies lowest value as best, highest as worst', () => {
      const result = calculateBestWorst([5000, 6000, 4500], false);
      expect(result.bestIndex).toBe(2); // 4,500
      expect(result.worstIndex).toBe(1); // 6,000
    });

    it('handles more than 3 values', () => {
      const result = calculateBestWorst([100, 400, 200, 300], false);
      expect(result.bestIndex).toBe(0); // 100
      expect(result.worstIndex).toBe(1); // 400
    });
  });

  describe('edge cases', () => {
    it('returns null indices when all values are the same', () => {
      const result = calculateBestWorst([5000, 5000, 5000], true);
      expect(result.bestIndex).toBeNull();
      expect(result.worstIndex).toBeNull();
    });

    it('returns null indices when less than 2 valid values', () => {
      const result = calculateBestWorst([5000], true);
      expect(result.bestIndex).toBeNull();
      expect(result.worstIndex).toBeNull();
    });

    it('returns null indices for empty array', () => {
      const result = calculateBestWorst([], true);
      expect(result.bestIndex).toBeNull();
      expect(result.worstIndex).toBeNull();
    });

    it('excludes null values from comparison', () => {
      const result = calculateBestWorst([null, 5000, 6000, null], false);
      expect(result.bestIndex).toBe(1); // 5,000 (lower is better)
      expect(result.worstIndex).toBe(2); // 6,000
    });

    it('returns null when only one non-null value', () => {
      const result = calculateBestWorst([null, 5000, null], false);
      expect(result.bestIndex).toBeNull();
      expect(result.worstIndex).toBeNull();
    });

    it('handles all null values', () => {
      const result = calculateBestWorst([null, null, null], true);
      expect(result.bestIndex).toBeNull();
      expect(result.worstIndex).toBeNull();
    });
  });
});

// ============================================================================
// detectDifference Tests
// ============================================================================

describe('detectDifference', () => {
  it('returns true when values differ', () => {
    const values: CellValue[] = [
      createCellValue('$5,000', 5000),
      createCellValue('$6,000', 6000),
      createCellValue('$5,500', 5500),
    ];
    expect(detectDifference(values)).toBe(true);
  });

  it('returns false when all values are the same', () => {
    const values: CellValue[] = [
      createCellValue('$5,000', 5000),
      createCellValue('$5,000', 5000),
      createCellValue('$5,000', 5000),
    ];
    expect(detectDifference(values)).toBe(false);
  });

  it('returns false when less than 2 found values', () => {
    const values: CellValue[] = [
      createCellValue('$5,000', 5000),
      createCellValue('—', null, 'not_found'),
      createCellValue('—', null, 'not_found'),
    ];
    expect(detectDifference(values)).toBe(false);
  });

  it('ignores not_found values in comparison', () => {
    const values: CellValue[] = [
      createCellValue('$5,000', 5000),
      createCellValue('—', null, 'not_found'),
      createCellValue('$5,000', 5000),
    ];
    expect(detectDifference(values)).toBe(false);
  });

  it('detects differences even with some not_found values', () => {
    const values: CellValue[] = [
      createCellValue('$5,000', 5000),
      createCellValue('—', null, 'not_found'),
      createCellValue('$6,000', 6000),
    ];
    expect(detectDifference(values)).toBe(true);
  });

  it('handles string comparisons', () => {
    const values: CellValue[] = [
      createCellValue('Carrier A', 'Carrier A'),
      createCellValue('Carrier B', 'Carrier B'),
    ];
    expect(detectDifference(values)).toBe(true);
  });

  it('returns false for identical strings', () => {
    const values: CellValue[] = [
      createCellValue('Same Carrier', 'Same Carrier'),
      createCellValue('Same Carrier', 'Same Carrier'),
    ];
    expect(detectDifference(values)).toBe(false);
  });
});

// ============================================================================
// buildComparisonRows Tests
// ============================================================================

describe('buildComparisonRows', () => {
  it('returns empty data for empty extractions', () => {
    const result = buildComparisonRows([]);
    expect(result.headers).toHaveLength(0);
    expect(result.rows).toHaveLength(0);
    expect(result.documentCount).toBe(0);
  });

  it('builds correct headers from carrier names', () => {
    const extractions = [
      createMockExtraction({ carrierName: 'Hartford' }),
      createMockExtraction({ carrierName: 'Travelers' }),
    ];
    const result = buildComparisonRows(extractions);
    expect(result.headers).toEqual(['Hartford', 'Travelers']);
  });

  it('falls back to Quote N when carrier name is null', () => {
    const extractions = [
      createMockExtraction({ carrierName: null }),
      createMockExtraction({ carrierName: 'Travelers' }),
    ];
    const result = buildComparisonRows(extractions);
    expect(result.headers).toEqual(['Quote 1', 'Travelers']);
  });

  it('uses document filename as fallback header', () => {
    const extractions = [createMockExtraction({ carrierName: null })];
    const documents = [
      {
        id: '1',
        filename: 'quote-doc.pdf',
        carrierName: null,
        extractedAt: '',
        extracted: true,
      },
    ];
    const result = buildComparisonRows(extractions, documents);
    expect(result.headers).toEqual(['quote-doc.pdf']);
  });

  it('includes basic info rows', () => {
    const extractions = [createMockExtraction()];
    const result = buildComparisonRows(extractions);

    const basicRows = result.rows.filter((r) => r.category === 'basic');
    const fieldNames = basicRows.map((r) => r.field);

    expect(fieldNames).toContain('Carrier');
    expect(fieldNames).toContain('Policy Number');
    expect(fieldNames).toContain('Named Insured');
    expect(fieldNames).toContain('Annual Premium');
    expect(fieldNames).toContain('Effective Date');
    expect(fieldNames).toContain('Expiration Date');
  });

  it('includes coverage rows when coverages exist', () => {
    const extractions = [
      createMockExtraction({
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 1000000,
            sublimit: null,
            limitType: 'per_occurrence',
            deductible: 5000,
            description: 'General Liability',
            sourcePages: [1],
          },
        ],
      }),
    ];
    const result = buildComparisonRows(extractions);

    const coverageRows = result.rows.filter((r) => r.category === 'coverage');
    expect(coverageRows.length).toBeGreaterThan(0);

    const limitRow = coverageRows.find((r) => r.field.includes('Limit'));
    expect(limitRow).toBeDefined();
    expect(limitRow?.fieldType).toBe('coverage_limit');

    const deductibleRow = coverageRows.find((r) => r.field.includes('Deductible'));
    expect(deductibleRow).toBeDefined();
    expect(deductibleRow?.fieldType).toBe('deductible');
    expect(deductibleRow?.isSubRow).toBe(true);
  });

  it('marks best premium (lowest)', () => {
    const extractions = [
      createMockExtraction({ carrierName: 'A', annualPremium: 5000 }),
      createMockExtraction({ carrierName: 'B', annualPremium: 6000 }),
      createMockExtraction({ carrierName: 'C', annualPremium: 4500 }),
    ];
    const result = buildComparisonRows(extractions);

    const premiumRow = result.rows.find((r) => r.field === 'Annual Premium');
    expect(premiumRow?.bestIndex).toBe(2); // $4,500 (index 2)
    expect(premiumRow?.worstIndex).toBe(1); // $6,000 (index 1)
  });

  it('marks best limit (highest)', () => {
    const extractions = [
      createMockExtraction({
        carrierName: 'A',
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 1000000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
      }),
      createMockExtraction({
        carrierName: 'B',
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 2000000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
      }),
      createMockExtraction({
        carrierName: 'C',
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 500000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
      }),
    ];
    const result = buildComparisonRows(extractions);

    const limitRow = result.rows.find((r) => r.id === 'coverage-general_liability-limit');
    expect(limitRow?.bestIndex).toBe(1); // $2M (index 1)
    expect(limitRow?.worstIndex).toBe(2); // $500K (index 2)
  });

  it('handles null values (not found)', () => {
    const extractions = [
      createMockExtraction({ annualPremium: 5000 }),
      createMockExtraction({ annualPremium: null }),
    ];
    const result = buildComparisonRows(extractions);

    const premiumRow = result.rows.find((r) => r.field === 'Annual Premium');
    expect(premiumRow?.values[0]?.status).toBe('found');
    expect(premiumRow?.values[1]?.status).toBe('not_found');
    expect(premiumRow?.values[1]?.displayValue).toBe('—');
  });

  it('detects differences in rows', () => {
    const extractions = [
      createMockExtraction({ annualPremium: 5000 }),
      createMockExtraction({ annualPremium: 6000 }),
    ];
    const result = buildComparisonRows(extractions);

    const premiumRow = result.rows.find((r) => r.field === 'Annual Premium');
    expect(premiumRow?.hasDifference).toBe(true);
  });

  it('marks no difference when values are the same', () => {
    const extractions = [
      createMockExtraction({ annualPremium: 5000 }),
      createMockExtraction({ annualPremium: 5000 }),
    ];
    const result = buildComparisonRows(extractions);

    const premiumRow = result.rows.find((r) => r.field === 'Annual Premium');
    expect(premiumRow?.hasDifference).toBe(false);
    expect(premiumRow?.bestIndex).toBeNull();
    expect(premiumRow?.worstIndex).toBeNull();
  });

  it('includes summary rows', () => {
    const extractions = [
      createMockExtraction({
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 1000000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
        exclusions: [
          { name: 'Flood', description: '', category: 'flood', sourcePages: [] },
          { name: 'Earthquake', description: '', category: 'earthquake', sourcePages: [] },
        ],
      }),
    ];
    const result = buildComparisonRows(extractions);

    const summaryRows = result.rows.filter((r) => r.category === 'summary');
    expect(summaryRows.length).toBeGreaterThan(0);

    const coverageCountRow = summaryRows.find((r) => r.field === 'Coverages Count');
    expect(coverageCountRow?.values[0]?.rawValue).toBe(1);

    const exclusionCountRow = summaryRows.find((r) => r.field === 'Exclusions Count');
    expect(exclusionCountRow?.values[0]?.rawValue).toBe(2);
  });

  it('collects coverage types from all extractions', () => {
    const extractions = [
      createMockExtraction({
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            limit: 1000000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
      }),
      createMockExtraction({
        coverages: [
          {
            type: 'property',
            name: 'Property',
            limit: 500000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
          },
        ],
      }),
    ];
    const result = buildComparisonRows(extractions);

    // Should have rows for both GL and Property
    const glRow = result.rows.find((r) => r.id === 'coverage-general_liability-limit');
    const propertyRow = result.rows.find((r) => r.id === 'coverage-property-limit');

    expect(glRow).toBeDefined();
    expect(propertyRow).toBeDefined();

    // GL should be not_found for second quote
    expect(glRow?.values[1]?.status).toBe('not_found');
    // Property should be not_found for first quote
    expect(propertyRow?.values[0]?.status).toBe('not_found');
  });
});

// ============================================================================
// COVERAGE_TYPE_LABELS Tests
// ============================================================================

describe('COVERAGE_TYPE_LABELS', () => {
  it('has labels for all coverage types', () => {
    const coverageTypes = [
      'general_liability',
      'property',
      'auto_liability',
      'auto_physical_damage',
      'umbrella',
      'workers_comp',
      'professional_liability',
      'cyber',
      'other',
    ] as const;

    for (const type of coverageTypes) {
      expect(COVERAGE_TYPE_LABELS[type]).toBeDefined();
      expect(typeof COVERAGE_TYPE_LABELS[type]).toBe('string');
    }
  });

  it('has human-readable labels', () => {
    expect(COVERAGE_TYPE_LABELS.general_liability).toBe('General Liability');
    expect(COVERAGE_TYPE_LABELS.workers_comp).toBe("Workers' Compensation");
    expect(COVERAGE_TYPE_LABELS.professional_liability).toBe('Professional Liability (E&O)');
  });
});
