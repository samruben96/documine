/**
 * Coverage Type Tests - Story 10.1, Epic 10 Stories 10.2-10.6
 *
 * Verifies all 21 coverage types are properly defined and validated.
 * Also tests Epic 10 extended schemas: PolicyMetadata, Endorsements, CarrierInfo, PremiumBreakdown.
 * AC-10.1.7: Unit tests verify all 21 coverage types are recognized.
 */

import { describe, it, expect } from 'vitest';
import {
  COVERAGE_TYPES,
  CoverageType,
  coverageItemSchema,
  COVERAGE_TYPE_DISPLAY,
  policyMetadataSchema,
  endorsementSchema,
  carrierInfoSchema,
  premiumBreakdownSchema,
  coveragePremiumSchema,
  quoteExtractionSchema,
  EXTRACTION_VERSION,
  CRITICAL_ENDORSEMENTS,
} from '@/types/compare';

describe('CoverageType', () => {
  const ORIGINAL_TYPES = [
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

  const NEW_TYPES = [
    'epli',
    'd_and_o',
    'crime',
    'pollution',
    'inland_marine',
    'builders_risk',
    'business_interruption',
    'product_liability',
    'garage_liability',
    'liquor_liability',
    'medical_malpractice',
    'fiduciary',
  ] as const;

  describe('COVERAGE_TYPES array', () => {
    it('should have exactly 21 coverage types (AC-10.1.5)', () => {
      expect(COVERAGE_TYPES).toHaveLength(21);
    });

    it('should include all 9 original coverage types (AC-10.1.4)', () => {
      ORIGINAL_TYPES.forEach((type) => {
        expect(COVERAGE_TYPES).toContain(type);
      });
    });

    it('should include all 12 new coverage types (AC-10.1.1)', () => {
      NEW_TYPES.forEach((type) => {
        expect(COVERAGE_TYPES).toContain(type);
      });
    });

    it('should have no duplicate types', () => {
      const uniqueTypes = new Set(COVERAGE_TYPES);
      expect(uniqueTypes.size).toBe(COVERAGE_TYPES.length);
    });
  });

  describe('coverageItemSchema Zod validation (AC-10.1.2)', () => {
    it('should validate all 21 coverage types', () => {
      COVERAGE_TYPES.forEach((type) => {
        const result = coverageItemSchema.safeParse({
          type,
          name: 'Test Coverage',
          description: 'Test description',
          sourcePages: [1],
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid coverage types', () => {
      const result = coverageItemSchema.safeParse({
        type: 'invalid_coverage_type',
        name: 'Test Coverage',
        description: 'Test description',
        sourcePages: [1],
      });
      expect(result.success).toBe(false);
    });

    it('should accept null for optional fields', () => {
      const result = coverageItemSchema.safeParse({
        type: 'general_liability',
        name: 'Test Coverage',
        description: 'Test description',
        sourcePages: [1],
        limit: null,
        sublimit: null,
        limitType: null,
        deductible: null,
      });
      expect(result.success).toBe(true);
    });

    it('should default optional fields to null', () => {
      const result = coverageItemSchema.safeParse({
        type: 'epli',
        name: 'Employment Practices Liability',
        description: 'EPL coverage',
        sourcePages: [2, 5],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBeNull();
        expect(result.data.sublimit).toBeNull();
        expect(result.data.limitType).toBeNull();
        expect(result.data.deductible).toBeNull();
      }
    });
  });

  describe('COVERAGE_TYPE_DISPLAY (AC-10.1.6)', () => {
    it('should have display names for all 21 coverage types', () => {
      COVERAGE_TYPES.forEach((type) => {
        expect(COVERAGE_TYPE_DISPLAY[type]).toBeDefined();
        expect(COVERAGE_TYPE_DISPLAY[type].label).toBeTruthy();
        expect(COVERAGE_TYPE_DISPLAY[type].icon).toBeTruthy();
      });
    });

    it('should have unique labels for each type', () => {
      const labels = Object.values(COVERAGE_TYPE_DISPLAY).map((d) => d.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it('should have proper display names for new types', () => {
      expect(COVERAGE_TYPE_DISPLAY.epli.label).toBe('Employment Practices');
      expect(COVERAGE_TYPE_DISPLAY.d_and_o.label).toBe('Directors & Officers');
      expect(COVERAGE_TYPE_DISPLAY.crime.label).toBe('Crime / Fidelity');
      expect(COVERAGE_TYPE_DISPLAY.pollution.label).toBe('Pollution');
      expect(COVERAGE_TYPE_DISPLAY.inland_marine.label).toBe('Inland Marine');
      expect(COVERAGE_TYPE_DISPLAY.builders_risk.label).toBe('Builders Risk');
      expect(COVERAGE_TYPE_DISPLAY.business_interruption.label).toBe('Business Interruption');
      expect(COVERAGE_TYPE_DISPLAY.product_liability.label).toBe('Product Liability');
      expect(COVERAGE_TYPE_DISPLAY.garage_liability.label).toBe('Garage Liability');
      expect(COVERAGE_TYPE_DISPLAY.liquor_liability.label).toBe('Liquor Liability');
      expect(COVERAGE_TYPE_DISPLAY.medical_malpractice.label).toBe('Medical Malpractice');
      expect(COVERAGE_TYPE_DISPLAY.fiduciary.label).toBe('Fiduciary');
    });

    it('should have icons for all original types', () => {
      expect(COVERAGE_TYPE_DISPLAY.general_liability.icon).toBe('Shield');
      expect(COVERAGE_TYPE_DISPLAY.property.icon).toBe('Building');
      expect(COVERAGE_TYPE_DISPLAY.auto_liability.icon).toBe('Car');
      expect(COVERAGE_TYPE_DISPLAY.umbrella.icon).toBe('Umbrella');
      expect(COVERAGE_TYPE_DISPLAY.cyber.icon).toBe('Lock');
    });
  });

  describe('Type safety', () => {
    it('should enforce CoverageType type at compile time', () => {
      // This test mainly ensures TypeScript types are correct
      const validType: CoverageType = 'epli';
      expect(COVERAGE_TYPES.includes(validType)).toBe(true);
    });

    it('should have consistent ordering in COVERAGE_TYPES and COVERAGE_TYPE_DISPLAY', () => {
      // All types in array should be in display map
      COVERAGE_TYPES.forEach((type) => {
        expect(Object.keys(COVERAGE_TYPE_DISPLAY)).toContain(type);
      });

      // All types in display map should be in array
      Object.keys(COVERAGE_TYPE_DISPLAY).forEach((type) => {
        expect(COVERAGE_TYPES).toContain(type as CoverageType);
      });
    });
  });

  describe('New coverage type specific tests', () => {
    it('should accept d_and_o with underscore notation', () => {
      const result = coverageItemSchema.safeParse({
        type: 'd_and_o',
        name: 'Directors and Officers Liability',
        description: 'D&O coverage for corporate officers',
        sourcePages: [1, 3, 5],
        limit: 5000000,
        deductible: 50000,
      });
      expect(result.success).toBe(true);
    });

    it('should accept business_interruption with all fields', () => {
      const result = coverageItemSchema.safeParse({
        type: 'business_interruption',
        name: 'Business Income Coverage',
        description: 'Covers lost income during covered perils',
        sourcePages: [8, 9],
        limit: 1000000,
        sublimit: 250000,
        limitType: 'aggregate',
        deductible: 24, // 24-hour waiting period often expressed as deductible
      });
      expect(result.success).toBe(true);
    });

    it('should accept medical_malpractice for healthcare policies', () => {
      const result = coverageItemSchema.safeParse({
        type: 'medical_malpractice',
        name: 'Medical Professional Liability',
        description: 'Coverage for healthcare providers',
        sourcePages: [2, 4, 6],
        limit: 2000000,
        limitType: 'per_occurrence',
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Epic 10 Story 10.3: Enhanced CoverageItem Fields
// ============================================================================

describe('Enhanced CoverageItem (Story 10.3)', () => {
  it('should accept all enhanced limit fields', () => {
    const result = coverageItemSchema.safeParse({
      type: 'business_interruption',
      name: 'Business Income Coverage',
      description: 'Covers lost income during business interruption',
      sourcePages: [8, 9],
      limit: 500000,
      aggregateLimit: 1000000,
      selfInsuredRetention: 10000,
      coinsurance: 80,
      waitingPeriod: '72 hours',
      indemnityPeriod: '12 months',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aggregateLimit).toBe(1000000);
      expect(result.data.selfInsuredRetention).toBe(10000);
      expect(result.data.coinsurance).toBe(80);
      expect(result.data.waitingPeriod).toBe('72 hours');
      expect(result.data.indemnityPeriod).toBe('12 months');
    }
  });

  it('should default enhanced fields to null', () => {
    const result = coverageItemSchema.safeParse({
      type: 'property',
      name: 'Property Coverage',
      description: 'Building and contents coverage',
      sourcePages: [1, 2],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aggregateLimit).toBeNull();
      expect(result.data.selfInsuredRetention).toBeNull();
      expect(result.data.coinsurance).toBeNull();
      expect(result.data.waitingPeriod).toBeNull();
      expect(result.data.indemnityPeriod).toBeNull();
    }
  });

  it('should distinguish SIR from deductible', () => {
    const result = coverageItemSchema.safeParse({
      type: 'professional_liability',
      name: 'E&O Coverage',
      description: 'Errors and Omissions liability',
      sourcePages: [5],
      deductible: 5000,
      selfInsuredRetention: 25000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deductible).toBe(5000);
      expect(result.data.selfInsuredRetention).toBe(25000);
    }
  });
});

// ============================================================================
// Epic 10 Story 10.2: Policy Metadata Schema
// ============================================================================

describe('PolicyMetadata Schema (Story 10.2)', () => {
  it('should validate complete policy metadata', () => {
    const result = policyMetadataSchema.safeParse({
      formType: 'iso',
      formNumbers: ['CG 0001', 'CP 0010'],
      policyType: 'occurrence',
      retroactiveDate: null,
      extendedReportingPeriod: null,
      auditType: 'annual',
      sourcePages: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it('should accept all form types', () => {
    const formTypes = ['iso', 'proprietary', 'manuscript'] as const;
    formTypes.forEach((formType) => {
      const result = policyMetadataSchema.safeParse({
        formType,
        formNumbers: [],
        sourcePages: [],
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept all policy types', () => {
    const policyTypes = ['occurrence', 'claims-made'] as const;
    policyTypes.forEach((policyType) => {
      const result = policyMetadataSchema.safeParse({
        policyType,
        formNumbers: [],
        sourcePages: [],
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept all audit types', () => {
    const auditTypes = ['annual', 'monthly', 'final', 'none'] as const;
    auditTypes.forEach((auditType) => {
      const result = policyMetadataSchema.safeParse({
        auditType,
        formNumbers: [],
        sourcePages: [],
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept claims-made policy with retroactive date', () => {
    const result = policyMetadataSchema.safeParse({
      formType: 'iso',
      formNumbers: ['CG 0001'],
      policyType: 'claims-made',
      retroactiveDate: '2020-01-01',
      extendedReportingPeriod: '60 days',
      auditType: 'annual',
      sourcePages: [1],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.retroactiveDate).toBe('2020-01-01');
      expect(result.data.extendedReportingPeriod).toBe('60 days');
    }
  });

  it('should default all optional fields to null or empty', () => {
    const result = policyMetadataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formType).toBeNull();
      expect(result.data.formNumbers).toEqual([]);
      expect(result.data.policyType).toBeNull();
      expect(result.data.retroactiveDate).toBeNull();
      expect(result.data.sourcePages).toEqual([]);
    }
  });
});

// ============================================================================
// Epic 10 Story 10.4: Endorsement Schema
// ============================================================================

describe('Endorsement Schema (Story 10.4)', () => {
  it('should validate complete endorsement', () => {
    const result = endorsementSchema.safeParse({
      formNumber: 'CG 20 10',
      name: 'Additional Insured - Owners, Lessees or Contractors',
      type: 'broadening',
      description: 'Extends coverage to scheduled additional insureds for ongoing operations',
      affectedCoverage: 'General Liability',
      sourcePages: [15, 16],
    });
    expect(result.success).toBe(true);
  });

  it('should accept all endorsement types', () => {
    const endorsementTypes = ['broadening', 'restricting', 'conditional'] as const;
    endorsementTypes.forEach((type) => {
      const result = endorsementSchema.safeParse({
        formNumber: 'CG TEST',
        name: 'Test Endorsement',
        type,
        description: 'Test description',
      });
      expect(result.success).toBe(true);
    });
  });

  it('should require formNumber, name, type, and description', () => {
    const incompleteEndorsement = {
      formNumber: 'CG 20 10',
      name: 'Additional Insured',
      // missing type and description
    };
    const result = endorsementSchema.safeParse(incompleteEndorsement);
    expect(result.success).toBe(false);
  });

  it('should default affectedCoverage to null', () => {
    const result = endorsementSchema.safeParse({
      formNumber: 'CG 24 04',
      name: 'Waiver of Subrogation',
      type: 'conditional',
      description: 'Waives transfer of rights of recovery',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.affectedCoverage).toBeNull();
      expect(result.data.sourcePages).toEqual([]);
    }
  });

  it('should validate critical endorsement form numbers', () => {
    CRITICAL_ENDORSEMENTS.forEach((endorsement) => {
      const result = endorsementSchema.safeParse({
        formNumber: endorsement.formNumber,
        name: endorsement.name,
        type: 'broadening',
        description: `Critical endorsement: ${endorsement.name}`,
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Epic 10 Story 10.5: Carrier Info Schema
// ============================================================================

describe('CarrierInfo Schema (Story 10.5)', () => {
  it('should validate complete carrier info', () => {
    const result = carrierInfoSchema.safeParse({
      amBestRating: 'A+',
      amBestFinancialSize: 'XV',
      naicCode: '12345',
      admittedStatus: 'admitted',
      claimsPhone: '1-800-CLAIMS',
      underwriter: 'John Smith',
      sourcePages: [1],
    });
    expect(result.success).toBe(true);
  });

  it('should accept all admitted status values', () => {
    const statuses = ['admitted', 'non-admitted', 'surplus'] as const;
    statuses.forEach((admittedStatus) => {
      const result = carrierInfoSchema.safeParse({
        admittedStatus,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept all AM Best rating formats', () => {
    const ratings = ['A++', 'A+', 'A', 'A-', 'B++', 'B+', 'B', 'B-', 'C++', 'C+', 'C', 'C-'];
    ratings.forEach((amBestRating) => {
      const result = carrierInfoSchema.safeParse({
        amBestRating,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should default all fields to null or empty', () => {
    const result = carrierInfoSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amBestRating).toBeNull();
      expect(result.data.amBestFinancialSize).toBeNull();
      expect(result.data.naicCode).toBeNull();
      expect(result.data.admittedStatus).toBeNull();
      expect(result.data.claimsPhone).toBeNull();
      expect(result.data.underwriter).toBeNull();
      expect(result.data.sourcePages).toEqual([]);
    }
  });
});

// ============================================================================
// Epic 10 Story 10.6: Premium Breakdown Schema
// ============================================================================

describe('PremiumBreakdown Schema (Story 10.6)', () => {
  it('should validate complete premium breakdown', () => {
    const result = premiumBreakdownSchema.safeParse({
      basePremium: 10000,
      coveragePremiums: [
        { coverage: 'General Liability', premium: 5000 },
        { coverage: 'Property', premium: 3000 },
        { coverage: 'Auto', premium: 2000 },
      ],
      taxes: 500,
      fees: 150,
      brokerFee: 250,
      surplusLinesTax: null,
      totalPremium: 10900,
      paymentPlan: 'Annual',
      sourcePages: [2, 3],
    });
    expect(result.success).toBe(true);
  });

  it('should require totalPremium', () => {
    const result = premiumBreakdownSchema.safeParse({
      basePremium: 10000,
      coveragePremiums: [],
      // missing totalPremium
    });
    expect(result.success).toBe(false);
  });

  it('should validate coverage premium items', () => {
    const result = coveragePremiumSchema.safeParse({
      coverage: 'General Liability',
      premium: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('should require coverage and premium in coverage premium', () => {
    const result = coveragePremiumSchema.safeParse({
      coverage: 'General Liability',
      // missing premium
    });
    expect(result.success).toBe(false);
  });

  it('should accept surplus lines tax for non-admitted carriers', () => {
    const result = premiumBreakdownSchema.safeParse({
      basePremium: 10000,
      coveragePremiums: [],
      surplusLinesTax: 300,
      totalPremium: 10300,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.surplusLinesTax).toBe(300);
    }
  });

  it('should default optional fields to null or empty', () => {
    const result = premiumBreakdownSchema.safeParse({
      totalPremium: 10000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.basePremium).toBeNull();
      expect(result.data.coveragePremiums).toEqual([]);
      expect(result.data.taxes).toBeNull();
      expect(result.data.fees).toBeNull();
      expect(result.data.brokerFee).toBeNull();
      expect(result.data.surplusLinesTax).toBeNull();
      expect(result.data.paymentPlan).toBeNull();
      expect(result.data.sourcePages).toEqual([]);
    }
  });
});

// ============================================================================
// Epic 10: Extended QuoteExtraction Schema
// ============================================================================

describe('Extended QuoteExtraction Schema (Epic 10)', () => {
  it('should validate extraction with all Epic 10 fields', () => {
    const result = quoteExtractionSchema.safeParse({
      carrierName: 'Hartford Insurance',
      policyNumber: 'POL-2024-12345',
      namedInsured: 'ACME Corporation',
      effectiveDate: '2024-01-01',
      expirationDate: '2025-01-01',
      annualPremium: 25000,
      coverages: [
        {
          type: 'general_liability',
          name: 'Commercial General Liability',
          description: 'CGL coverage',
          sourcePages: [1, 2],
          limit: 1000000,
          aggregateLimit: 2000000,
          selfInsuredRetention: null,
          coinsurance: null,
          waitingPeriod: null,
          indemnityPeriod: null,
        },
      ],
      exclusions: [],
      deductibles: [],
      policyMetadata: {
        formType: 'iso',
        formNumbers: ['CG 0001'],
        policyType: 'occurrence',
        retroactiveDate: null,
        extendedReportingPeriod: null,
        auditType: 'annual',
        sourcePages: [1],
      },
      endorsements: [
        {
          formNumber: 'CG 20 10',
          name: 'Additional Insured',
          type: 'broadening',
          description: 'Adds additional insured coverage',
          affectedCoverage: 'General Liability',
          sourcePages: [15],
        },
      ],
      carrierInfo: {
        amBestRating: 'A+',
        amBestFinancialSize: 'XV',
        naicCode: '12345',
        admittedStatus: 'admitted',
        claimsPhone: '1-800-123-4567',
        underwriter: 'John Smith',
        sourcePages: [1],
      },
      premiumBreakdown: {
        basePremium: 20000,
        coveragePremiums: [
          { coverage: 'General Liability', premium: 20000 },
        ],
        taxes: 1000,
        fees: 500,
        brokerFee: null,
        surplusLinesTax: null,
        totalPremium: 21500,
        paymentPlan: 'Annual',
        sourcePages: [2, 3],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should default Epic 10 fields to null or empty', () => {
    const result = quoteExtractionSchema.safeParse({
      carrierName: 'Test Carrier',
      coverages: [],
      exclusions: [],
      deductibles: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.policyMetadata).toBeNull();
      expect(result.data.endorsements).toEqual([]);
      expect(result.data.carrierInfo).toBeNull();
      expect(result.data.premiumBreakdown).toBeNull();
    }
  });

  it('should have EXTRACTION_VERSION >= 3 for Epic 10', () => {
    expect(EXTRACTION_VERSION).toBeGreaterThanOrEqual(3);
  });
});
