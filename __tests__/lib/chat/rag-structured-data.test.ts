/**
 * Tests for RAG Structured Data Integration
 *
 * Story 10.12: Tests for formatStructuredContext and structured data retrieval
 * AC-10.12.6: Verify structured data is properly formatted for chat context
 */

import { describe, it, expect } from 'vitest';
import { formatStructuredContext } from '@/lib/chat/rag';
import type { QuoteExtraction } from '@/types/compare';

describe('formatStructuredContext', () => {
  it('should format basic policy info', () => {
    const extraction: QuoteExtraction = {
      carrierName: 'Test Insurance Co',
      policyNumber: 'POL-12345',
      namedInsured: 'Acme Corp',
      effectiveDate: '2024-01-01',
      expirationDate: '2025-01-01',
      annualPremium: 15000,
      coverages: [],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('STRUCTURED POLICY DATA');
    expect(result).toContain('Carrier: Test Insurance Co');
    expect(result).toContain('Policy Number: POL-12345');
    expect(result).toContain('Named Insured: Acme Corp');
    expect(result).toContain('Effective: 2024-01-01');
    expect(result).toContain('Expires: 2025-01-01');
    expect(result).toContain('Annual Premium: $15,000');
  });

  it('should format coverages with source pages', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [
        {
          type: 'general_liability',
          name: 'Commercial General Liability',
          limit: 1000000,
          limitType: 'per_occurrence',
          deductible: 5000,
          description: 'CGL coverage',
          sourcePages: [3, 4],
          aggregateLimit: null,
          selfInsuredRetention: null,
          coinsurance: null,
          waitingPeriod: null,
          indemnityPeriod: null,
        },
      ],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('Coverages:');
    expect(result).toContain('Commercial General Liability: $1,000,000');
    expect(result).toContain('(Ded: $5,000)');
    expect(result).toContain('[Page 3, 4]');
  });

  it('should format exclusions', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [
        {
          name: 'Flood Exclusion',
          description: 'Excludes flood damage',
          category: 'flood',
          sourcePages: [10],
        },
      ],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('Key Exclusions:');
    expect(result).toContain('Flood Exclusion');
    expect(result).toContain('[Page 10]');
  });

  it('should format deductibles', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [],
      deductibles: [
        {
          type: 'per_occurrence',
          amount: 2500,
          appliesTo: 'Property coverage',
          sourcePages: [5],
        },
      ],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('Deductibles:');
    expect(result).toContain('per_occurrence: $2,500');
    expect(result).toContain('[Page 5]');
  });

  it('should format premium breakdown', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: {
        basePremium: 12500,
        coveragePremiums: [],
        taxes: 625,
        fees: 150,
        brokerFee: null,
        surplusLinesTax: null,
        totalPremium: 13275,
        paymentPlan: 'Annual',
        sourcePages: [2],
      },
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('Base Premium: $12,500');
    expect(result).toContain('Taxes: $625');
    expect(result).toContain('Fees: $150');
    expect(result).toContain('Payment Plan: Annual');
  });

  it('should format carrier info', () => {
    const extraction: QuoteExtraction = {
      carrierName: 'Test Insurance',
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: {
        amBestRating: 'A+',
        financialSizeClass: 'XV',
        naicCode: '12345',
        admittedStatus: 'admitted',
        claimsPhone: '1-800-CLAIMS',
        underwriter: 'John Smith',
        sourcePages: [1],
      },
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('AM Best Rating: A+');
    expect(result).toContain('Carrier Status: admitted');
  });

  it('should format endorsements', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [
        {
          formNumber: 'CG 20 10',
          name: 'Additional Insured - Owners, Lessees or Contractors',
          type: 'broadening',
          description: 'Extends coverage to additional insureds',
          affectedCoverage: 'General Liability',
          sourcePages: [15, 16],
        },
      ],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    expect(result).toContain('Endorsements:');
    expect(result).toContain('CG 20 10');
    expect(result).toContain('Additional Insured');
    expect(result).toContain('(broadening)');
    expect(result).toContain('[Page 15, 16]');
  });

  it('should limit coverages to 10 items with overflow message', () => {
    const coverages = Array.from({ length: 15 }, (_, i) => ({
      type: 'general_liability' as const,
      name: `Coverage ${i + 1}`,
      limit: 1000000,
      limitType: 'per_occurrence' as const,
      deductible: null,
      description: `Coverage ${i + 1} description`,
      sourcePages: [i + 1],
      aggregateLimit: null,
      selfInsuredRetention: null,
      coinsurance: null,
      waitingPeriod: null,
      indemnityPeriod: null,
    }));

    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages,
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    // Should show 10 coverages
    expect(result).toContain('Coverage 1');
    expect(result).toContain('Coverage 10');
    // Should NOT show coverage 11
    expect(result).not.toContain('Coverage 11');
    // Should show overflow message
    expect(result).toContain('... and 5 more coverages');
  });

  it('should handle empty extraction gracefully', () => {
    const extraction: QuoteExtraction = {
      carrierName: null,
      policyNumber: null,
      namedInsured: null,
      effectiveDate: null,
      expirationDate: null,
      annualPremium: null,
      coverages: [],
      exclusions: [],
      deductibles: [],
      extractedAt: '2024-01-01T00:00:00Z',
      modelUsed: 'gpt-5.1',
      policyMetadata: null,
      endorsements: [],
      carrierInfo: null,
      premiumBreakdown: null,
    };

    const result = formatStructuredContext(extraction);

    // Should still have header but minimal content
    expect(result).toContain('STRUCTURED POLICY DATA');
    // Should not have section headers for empty sections
    expect(result).not.toContain('Coverages:');
    expect(result).not.toContain('Key Exclusions:');
    expect(result).not.toContain('Deductibles:');
  });
});
