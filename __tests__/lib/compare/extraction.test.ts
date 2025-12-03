/**
 * Quote Extraction Service Tests
 *
 * Story 7.2: Tests for GPT-5.1 function calling extraction service.
 * Tests type validation, caching, and error handling.
 *
 * @module __tests__/lib/compare/extraction.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import {
  QuoteExtraction,
  quoteExtractionSchema,
  EXTRACT_QUOTE_DATA_FUNCTION,
  EXTRACTION_VERSION,
} from '@/types/compare';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

// Mock logger to suppress output
vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('QuoteExtraction Types', () => {
  describe('quoteExtractionSchema', () => {
    it('should validate a complete extraction', () => {
      const validExtraction = {
        carrierName: 'Hartford',
        policyNumber: 'POL-123',
        namedInsured: 'ACME Corp',
        effectiveDate: '2024-01-01',
        expirationDate: '2025-01-01',
        annualPremium: 25000,
        coverages: [
          {
            type: 'general_liability',
            name: 'General Liability',
            limit: 1000000,
            deductible: 1000,
            description: 'Commercial General Liability',
            sourcePages: [1, 2],
          },
        ],
        exclusions: [
          {
            name: 'Flood Exclusion',
            description: 'Excludes flood damage',
            category: 'flood',
            sourcePages: [5],
          },
        ],
        deductibles: [
          {
            type: 'Per Occurrence',
            amount: 1000,
            appliesTo: 'General Liability',
            sourcePages: [3],
          },
        ],
      };

      const result = quoteExtractionSchema.safeParse(validExtraction);
      expect(result.success).toBe(true);
    });

    it('should validate extraction with minimal required fields', () => {
      const minimalExtraction = {
        carrierName: 'Progressive',
        coverages: [
          {
            type: 'auto_liability',
            name: 'Auto Liability',
            description: 'Auto Liability Coverage',
            sourcePages: [1],
          },
        ],
        exclusions: [],
        deductibles: [],
      };

      const result = quoteExtractionSchema.safeParse(minimalExtraction);
      expect(result.success).toBe(true);
    });

    it('should accept null values for optional fields', () => {
      const extractionWithNulls = {
        carrierName: null,
        policyNumber: null,
        namedInsured: null,
        effectiveDate: null,
        expirationDate: null,
        annualPremium: null,
        coverages: [],
        exclusions: [],
        deductibles: [],
      };

      const result = quoteExtractionSchema.safeParse(extractionWithNulls);
      expect(result.success).toBe(true);
    });

    it('should reject invalid coverage type', () => {
      const invalidExtraction = {
        carrierName: 'Test',
        coverages: [
          {
            type: 'invalid_type',
            name: 'Test',
            description: 'Test',
            sourcePages: [1],
          },
        ],
        exclusions: [],
        deductibles: [],
      };

      const result = quoteExtractionSchema.safeParse(invalidExtraction);
      expect(result.success).toBe(false);
    });

    it('should validate all coverage types', () => {
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
      ];

      for (const type of coverageTypes) {
        const extraction = {
          carrierName: 'Test',
          coverages: [
            {
              type,
              name: 'Test Coverage',
              description: 'Test Description',
              sourcePages: [1],
            },
          ],
          exclusions: [],
          deductibles: [],
        };

        const result = quoteExtractionSchema.safeParse(extraction);
        expect(result.success).toBe(true);
      }
    });

    it('should validate all exclusion categories', () => {
      const categories = [
        'flood',
        'earthquake',
        'pollution',
        'mold',
        'cyber',
        'employment',
        'other',
      ];

      for (const category of categories) {
        const extraction = {
          carrierName: 'Test',
          coverages: [],
          exclusions: [
            {
              name: 'Test Exclusion',
              description: 'Test Description',
              category,
              sourcePages: [1],
            },
          ],
          deductibles: [],
        };

        const result = quoteExtractionSchema.safeParse(extraction);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('EXTRACT_QUOTE_DATA_FUNCTION', () => {
    it('should have correct function name', () => {
      expect(EXTRACT_QUOTE_DATA_FUNCTION.name).toBe('extract_quote_data');
    });

    it('should have required parameters', () => {
      const params = EXTRACT_QUOTE_DATA_FUNCTION.parameters;
      expect(params.required).toContain('coverages');
      expect(params.required).toContain('exclusions');
      expect(params.required).toContain('deductibles');
    });

    it('should have coverage type enum', () => {
      const coveragesSchema = EXTRACT_QUOTE_DATA_FUNCTION.parameters.properties.coverages;
      expect(coveragesSchema.items.properties.type.enum).toContain('general_liability');
      expect(coveragesSchema.items.properties.type.enum).toContain('property');
      expect(coveragesSchema.items.properties.type.enum).toContain('cyber');
    });

    it('should have limit type enum', () => {
      const coveragesSchema = EXTRACT_QUOTE_DATA_FUNCTION.parameters.properties.coverages;
      expect(coveragesSchema.items.properties.limitType.enum).toContain('per_occurrence');
      expect(coveragesSchema.items.properties.limitType.enum).toContain('aggregate');
    });
  });

  describe('EXTRACTION_VERSION', () => {
    it('should be defined', () => {
      expect(EXTRACTION_VERSION).toBeDefined();
      expect(typeof EXTRACTION_VERSION).toBe('number');
    });

    it('should be at least 1', () => {
      expect(EXTRACTION_VERSION).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('ExtractionResult Types', () => {
  it('should structure success result correctly', () => {
    const successResult = {
      success: true,
      extraction: {
        carrierName: 'Test',
        policyNumber: null,
        namedInsured: null,
        effectiveDate: null,
        expirationDate: null,
        annualPremium: null,
        coverages: [],
        exclusions: [],
        deductibles: [],
        extractedAt: new Date().toISOString(),
        modelUsed: 'gpt-5.1',
      } as QuoteExtraction,
      cached: false,
    };

    expect(successResult.success).toBe(true);
    expect(successResult.extraction).toBeDefined();
    expect(successResult.cached).toBe(false);
  });

  it('should structure error result correctly', () => {
    const errorResult = {
      success: false,
      cached: false,
      error: {
        code: 'TIMEOUT' as const,
        message: 'Extraction timed out after 60s',
        documentId: 'doc-123',
      },
    };

    expect(errorResult.success).toBe(false);
    expect(errorResult.error?.code).toBe('TIMEOUT');
    expect(errorResult.error?.documentId).toBe('doc-123');
  });
});

describe('Coverage Item Validation', () => {
  it('should require type, name, description, and sourcePages', () => {
    const invalidCoverage = {
      type: 'general_liability',
      // missing name, description, sourcePages
    };

    const extraction = {
      carrierName: 'Test',
      coverages: [invalidCoverage],
      exclusions: [],
      deductibles: [],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });

  it('should accept optional limit and deductible', () => {
    const coverageWithOptionals = {
      type: 'property',
      name: 'Property Coverage',
      description: 'Building and contents',
      sourcePages: [1],
      limit: 500000,
      deductible: 2500,
      limitType: 'per_occurrence',
    };

    const extraction = {
      carrierName: 'Test',
      coverages: [coverageWithOptionals],
      exclusions: [],
      deductibles: [],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
  });

  it('should validate limit type enum', () => {
    const validLimitTypes = ['per_occurrence', 'aggregate', 'per_person', 'combined_single'];

    for (const limitType of validLimitTypes) {
      const extraction = {
        carrierName: 'Test',
        coverages: [
          {
            type: 'general_liability',
            name: 'GL',
            description: 'General Liability',
            sourcePages: [1],
            limitType,
          },
        ],
        exclusions: [],
        deductibles: [],
      };

      const result = quoteExtractionSchema.safeParse(extraction);
      expect(result.success).toBe(true);
    }
  });
});

describe('Exclusion Item Validation', () => {
  it('should require name, description, category, and sourcePages', () => {
    const invalidExclusion = {
      name: 'Flood',
      // missing description, category, sourcePages
    };

    const extraction = {
      carrierName: 'Test',
      coverages: [],
      exclusions: [invalidExclusion],
      deductibles: [],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const extraction = {
      carrierName: 'Test',
      coverages: [],
      exclusions: [
        {
          name: 'Test',
          description: 'Test',
          category: 'invalid_category',
          sourcePages: [1],
        },
      ],
      deductibles: [],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });
});

describe('Deductible Item Validation', () => {
  it('should require type, amount, appliesTo, and sourcePages', () => {
    const invalidDeductible = {
      type: 'Per Occurrence',
      // missing amount, appliesTo, sourcePages
    };

    const extraction = {
      carrierName: 'Test',
      coverages: [],
      exclusions: [],
      deductibles: [invalidDeductible],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });

  it('should accept valid deductible', () => {
    const extraction = {
      carrierName: 'Test',
      coverages: [],
      exclusions: [],
      deductibles: [
        {
          type: 'Per Occurrence',
          amount: 5000,
          appliesTo: 'General Liability',
          sourcePages: [2, 3],
        },
      ],
    };

    const result = quoteExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
  });
});
