/**
 * Backward Compatibility Tests
 *
 * Story 10.11: AC-10.11.1
 *
 * Verifies that old extraction data (v1, v2) renders correctly in
 * components built with v3 (Epic 10) schema expectations.
 */

import { describe, it, expect } from 'vitest';
import {
  quoteExtractionSchema,
  coverageItemSchema,
  policyMetadataSchema,
  endorsementSchema,
  carrierInfoSchema,
  premiumBreakdownSchema,
  EXTRACTION_VERSION,
} from '@/types/compare';
import { analyzeGaps, calculateRiskScore, getRiskLevel } from '@/lib/compare/gap-analysis';

// Import test fixtures
import { v1Extraction, v1ExtractionMinimal, v1ExtractionOriginalCoverages } from '../../fixtures/extraction-v1';
import { v2Extraction, v2ExtractionAlternate, v2ExtractionSparse } from '../../fixtures/extraction-v2';
import { v3Extraction, v3ExtractionAlternate, v3ExtractionNewCoverages } from '../../fixtures/extraction-v3';

describe('Backward Compatibility', () => {
  // ===========================================================================
  // Schema Version Validation (AC-10.11.1)
  // ===========================================================================

  describe('extraction version', () => {
    it('should have EXTRACTION_VERSION >= 3 for Epic 10', () => {
      expect(EXTRACTION_VERSION).toBeGreaterThanOrEqual(3);
    });
  });

  // ===========================================================================
  // V1 Extraction Compatibility (Epic 7 Schema)
  // ===========================================================================

  describe('v1 extraction (Epic 7 schema)', () => {
    it('validates complete v1 extraction against current schema', () => {
      const result = quoteExtractionSchema.safeParse(v1Extraction);
      expect(result.success).toBe(true);
    });

    it('validates minimal v1 extraction (all nullable fields null)', () => {
      const result = quoteExtractionSchema.safeParse(v1ExtractionMinimal);
      expect(result.success).toBe(true);
    });

    it('validates v1 extraction with original 9 coverage types', () => {
      const result = quoteExtractionSchema.safeParse(v1ExtractionOriginalCoverages);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.coverages.length).toBe(4);
        // All should be original coverage types
        const types = result.data.coverages.map((c) => c.type);
        expect(types).toContain('general_liability');
        expect(types).toContain('property');
        expect(types).toContain('umbrella');
        expect(types).toContain('cyber');
      }
    });

    it('gap analysis handles v1 extraction (no Epic 10 fields)', () => {
      const result = analyzeGaps([v1Extraction]);

      expect(result).toHaveProperty('missingCoverages');
      expect(result).toHaveProperty('limitConcerns');
      expect(result).toHaveProperty('endorsementGaps');
      expect(result).toHaveProperty('overallRiskScore');

      // Single extraction should have empty missing coverages and endorsement gaps
      expect(result.missingCoverages).toEqual([]);
      expect(result.endorsementGaps).toEqual([]);
    });

    it('gap analysis can compare v1 and v3 extractions', () => {
      const result = analyzeGaps([v1Extraction, v3Extraction]);

      // Should detect differences (v3 has more coverages and endorsements)
      expect(result.missingCoverages.length).toBeGreaterThan(0);
      expect(result.overallRiskScore).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // V2 Extraction Compatibility (Epic 8/9 Schema)
  // ===========================================================================

  describe('v2 extraction (Epic 8/9 schema)', () => {
    it('validates complete v2 extraction against current schema', () => {
      const result = quoteExtractionSchema.safeParse(v2Extraction);
      expect(result.success).toBe(true);

      if (result.success) {
        // Should have policyMetadata populated
        expect(result.data.policyMetadata).not.toBeNull();
        expect(result.data.policyMetadata?.formType).toBe('iso');

        // Other Epic 10 fields should be null/empty
        expect(result.data.carrierInfo).toBeNull();
        expect(result.data.premiumBreakdown).toBeNull();
      }
    });

    it('validates v2 extraction with partial endorsements', () => {
      const result = quoteExtractionSchema.safeParse(v2ExtractionAlternate);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.endorsements.length).toBe(1);
        expect(result.data.endorsements[0]?.formNumber).toBe('CG 20 10');
      }
    });

    it('validates sparse v2 extraction', () => {
      const result = quoteExtractionSchema.safeParse(v2ExtractionSparse);
      expect(result.success).toBe(true);
    });

    it('gap analysis handles v2 extraction', () => {
      const result = analyzeGaps([v2Extraction, v2ExtractionAlternate]);

      expect(result).toHaveProperty('missingCoverages');
      expect(result).toHaveProperty('endorsementGaps');

      // v2ExtractionAlternate has CG 20 10, v2Extraction doesn't
      expect(result.endorsementGaps.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // V3 Extraction Validation (Full Epic 10)
  // ===========================================================================

  describe('v3 extraction (Epic 10 schema)', () => {
    it('validates full v3 extraction with all fields', () => {
      const result = quoteExtractionSchema.safeParse(v3Extraction);
      if (!result.success) {
        console.log('V3 validation errors:', JSON.stringify(result.error.issues, null, 2));
      }
      expect(result.success).toBe(true);

      if (result.success) {
        // All Epic 10 fields should be populated
        expect(result.data.policyMetadata).not.toBeNull();
        expect(result.data.endorsements.length).toBeGreaterThan(0);
        expect(result.data.carrierInfo).not.toBeNull();
        expect(result.data.premiumBreakdown).not.toBeNull();

        // Carrier info should have AM Best rating
        expect(result.data.carrierInfo?.amBestRating).toBe('A+');

        // Premium breakdown should have itemized costs
        expect(result.data.premiumBreakdown?.basePremium).toBe(60000);
        expect(result.data.premiumBreakdown?.totalPremium).toBe(75000);
      }
    });

    it('validates v3 extraction with new coverage types', () => {
      const result = quoteExtractionSchema.safeParse(v3ExtractionNewCoverages);
      if (!result.success) {
        console.log('V3 new coverages validation errors:', JSON.stringify(result.error.issues, null, 2));
      }
      expect(result.success).toBe(true);

      if (result.success) {
        const types = result.data.coverages.map((c) => c.type);
        // Should have new Epic 10 coverage types
        expect(types).toContain('builders_risk');
        expect(types).toContain('inland_marine');
        expect(types).toContain('pollution');
        expect(types).toContain('fiduciary');
        expect(types).toContain('product_liability');
        expect(types).toContain('garage_liability');
        expect(types).toContain('liquor_liability');
        expect(types).toContain('medical_malpractice');
      }
    });

    it('validates enhanced coverage fields', () => {
      const biCoverage = v3Extraction.coverages.find((c) => c.type === 'business_interruption');
      const result = coverageItemSchema.safeParse(biCoverage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.waitingPeriod).toBe('72 hours');
        expect(result.data.indemnityPeriod).toBe('12 months');
        expect(result.data.coinsurance).toBe(80);
      }
    });
  });

  // ===========================================================================
  // Mixed Version Comparison (Cross-Version Compatibility)
  // ===========================================================================

  describe('cross-version comparison', () => {
    it('can compare v1 with v2 extraction', () => {
      const result = analyzeGaps([v1Extraction, v2Extraction]);

      // Should work without errors
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('can compare v1 with v3 extraction', () => {
      const result = analyzeGaps([v1Extraction, v3Extraction]);

      // v3 has more coverages, so should detect missing coverages
      expect(result.missingCoverages.length).toBeGreaterThan(0);

      // v3 has endorsements, so should detect endorsement gaps
      expect(result.endorsementGaps.length).toBeGreaterThan(0);
    });

    it('can compare v2 with v3 extraction', () => {
      const result = analyzeGaps([v2Extraction, v3Extraction]);

      // Should work and detect differences
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it('can compare all three versions together', () => {
      const result = analyzeGaps([v1Extraction, v2Extraction, v3Extraction]);

      // Should handle multi-version comparison
      expect(result).toHaveProperty('missingCoverages');
      expect(result).toHaveProperty('limitConcerns');
      expect(result).toHaveProperty('endorsementGaps');
      expect(typeof result.overallRiskScore).toBe('number');
    });
  });

  // ===========================================================================
  // Risk Score Calculation with Mixed Versions
  // ===========================================================================

  describe('risk scoring with mixed versions', () => {
    it('calculates consistent risk levels', () => {
      // Low risk
      expect(getRiskLevel(0)).toBe('low');
      expect(getRiskLevel(29)).toBe('low');

      // Medium risk
      expect(getRiskLevel(30)).toBe('medium');
      expect(getRiskLevel(59)).toBe('medium');

      // High risk
      expect(getRiskLevel(60)).toBe('high');
      expect(getRiskLevel(100)).toBe('high');
    });

    it('risk score handles empty data gracefully', () => {
      const score = calculateRiskScore([], [], []);
      expect(score).toBe(0);
    });

    it('risk score is capped at 100', () => {
      const manyIssues = Array(20).fill({
        coverageType: 'general_liability' as const,
        importance: 'critical' as const,
        reason: '',
        presentIn: [],
      });

      const score = calculateRiskScore(manyIssues, [], []);
      expect(score).toBe(100);
    });
  });

  // ===========================================================================
  // Sub-Schema Validation
  // ===========================================================================

  describe('sub-schema backward compatibility', () => {
    it('policyMetadata accepts empty/null fields', () => {
      const result = policyMetadataSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('endorsementSchema requires core fields', () => {
      const valid = endorsementSchema.safeParse({
        formNumber: 'CG 20 10',
        name: 'Additional Insured',
        type: 'broadening',
        description: 'AI coverage',
      });
      expect(valid.success).toBe(true);

      const invalid = endorsementSchema.safeParse({
        formNumber: 'CG 20 10',
        // missing required fields
      });
      expect(invalid.success).toBe(false);
    });

    it('carrierInfoSchema accepts empty object', () => {
      const result = carrierInfoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('premiumBreakdownSchema requires totalPremium', () => {
      const valid = premiumBreakdownSchema.safeParse({
        totalPremium: 10000,
      });
      expect(valid.success).toBe(true);

      const invalid = premiumBreakdownSchema.safeParse({
        basePremium: 8000,
        // missing totalPremium
      });
      expect(invalid.success).toBe(false);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles extraction with empty coverages array', () => {
      const extraction = { ...v1Extraction, coverages: [] };
      const result = quoteExtractionSchema.safeParse(extraction);
      expect(result.success).toBe(true);
    });

    it('handles null carrier name', () => {
      const extraction = { ...v1Extraction, carrierName: null };
      const result = quoteExtractionSchema.safeParse(extraction);
      expect(result.success).toBe(true);
    });

    it('handles extraction with undefined fields (coerced to null)', () => {
      // When parsing from JSON, undefined becomes null
      const extraction = {
        carrierName: 'Test',
        coverages: [],
        exclusions: [],
        deductibles: [],
      };
      const result = quoteExtractionSchema.safeParse(extraction);
      expect(result.success).toBe(true);
    });

    it('gap analysis handles extractions with no common coverages', () => {
      const extractionA = {
        ...v1Extraction,
        coverages: [v1Extraction.coverages[0]!], // Only GL
      };
      const extractionB = {
        ...v1Extraction,
        carrierName: 'Other Carrier',
        coverages: [
          {
            type: 'cyber' as const,
            name: 'Cyber',
            limit: 500000,
            sublimit: null,
            limitType: null,
            deductible: null,
            description: '',
            sourcePages: [],
            aggregateLimit: null,
            selfInsuredRetention: null,
            coinsurance: null,
            waitingPeriod: null,
            indemnityPeriod: null,
          },
        ],
      };

      const result = analyzeGaps([extractionA, extractionB]);
      // Both coverages should be flagged as missing from one quote
      expect(result.missingCoverages.length).toBe(2);
    });
  });
});
