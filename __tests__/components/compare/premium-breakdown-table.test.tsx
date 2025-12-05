/**
 * PremiumBreakdownTable Component Tests
 *
 * Story 10.8: AC-10.8.5
 * Tests for premium comparison table.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremiumBreakdownTable } from '@/components/compare/premium-breakdown-table';
import type { QuoteExtraction, PremiumBreakdown } from '@/types/compare';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockPremiumBreakdown(overrides: Partial<PremiumBreakdown> = {}): PremiumBreakdown {
  return {
    basePremium: 10000,
    coveragePremiums: [],
    taxes: 500,
    fees: 100,
    brokerFee: null,
    surplusLinesTax: null,
    totalPremium: 10600,
    paymentPlan: null,
    sourcePages: [],
    ...overrides,
  };
}

function createMockExtraction(overrides: Partial<QuoteExtraction> = {}): QuoteExtraction {
  return {
    carrierName: 'Test Carrier',
    policyNumber: 'POL-001',
    namedInsured: 'Test Insured',
    effectiveDate: '2024-01-01',
    expirationDate: '2025-01-01',
    annualPremium: null, // Null by default so empty state tests work
    coverages: [],
    exclusions: [],
    deductibles: [],
    extractedAt: '2024-12-03T12:00:00Z',
    modelUsed: 'gpt-5.1',
    policyMetadata: null,
    endorsements: [],
    carrierInfo: null,
    premiumBreakdown: null,
    ...overrides,
  };
}

// ============================================================================
// PremiumBreakdownTable Component Tests
// ============================================================================

describe('PremiumBreakdownTable', () => {
  describe('empty state', () => {
    it('shows empty message when no premium breakdown data', () => {
      render(<PremiumBreakdownTable extractions={[createMockExtraction()]} />);
      expect(screen.getByText('No premium breakdown data available.')).toBeInTheDocument();
    });

    it('shows empty message when premium breakdown is null', () => {
      const extractions = [
        createMockExtraction({ premiumBreakdown: null }),
        createMockExtraction({ premiumBreakdown: null }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('No premium breakdown data available.')).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('renders premium breakdown table with testid', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown(),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByTestId('premium-breakdown-table')).toBeInTheDocument();
    });

    it('displays carrier name in header', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown(),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Hartford')).toBeInTheDocument();
    });

    it('displays Base Premium row', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ basePremium: 8000 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Base Premium')).toBeInTheDocument();
      expect(screen.getByText('$8,000')).toBeInTheDocument();
    });

    it('displays Taxes row', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ taxes: 750 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Taxes')).toBeInTheDocument();
      expect(screen.getByText('$750')).toBeInTheDocument();
    });

    it('displays Fees row', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ fees: 150 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Fees')).toBeInTheDocument();
      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('displays Total Premium row', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 15000 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Total Premium')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });
  });

  describe('coverage premium sub-rows', () => {
    it('displays per-coverage premiums as sub-rows', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({
            coveragePremiums: [
              { coverage: 'General Liability', premium: 5000 },
              { coverage: 'Property', premium: 3000 },
            ],
          }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('General Liability')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
      expect(screen.getByText('Property')).toBeInTheDocument();
      expect(screen.getByText('$3,000')).toBeInTheDocument();
    });

    it('collects coverage premiums from all quotes', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown({
            coveragePremiums: [{ coverage: 'General Liability', premium: 5000 }],
          }),
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          premiumBreakdown: createMockPremiumBreakdown({
            coveragePremiums: [
              { coverage: 'General Liability', premium: 4500 },
              { coverage: 'Cyber', premium: 2000 },
            ],
          }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('General Liability')).toBeInTheDocument();
      expect(screen.getByText('Cyber')).toBeInTheDocument();
    });
  });

  describe('optional rows', () => {
    it('shows Broker Fee row when present', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ brokerFee: 250 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Broker Fee')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });

    it('hides Broker Fee row when null in all quotes', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ brokerFee: null }),
        }),
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ brokerFee: null }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.queryByText('Broker Fee')).not.toBeInTheDocument();
    });

    it('shows Surplus Lines Tax row when present', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ surplusLinesTax: 300 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Surplus Lines Tax')).toBeInTheDocument();
      expect(screen.getByText('$300')).toBeInTheDocument();
    });

    it('hides Surplus Lines Tax row when null in all quotes', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ surplusLinesTax: null }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.queryByText('Surplus Lines Tax')).not.toBeInTheDocument();
    });
  });

  describe('best value highlighting (AC-10.8.5)', () => {
    it('highlights lowest total premium with green indicator', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 12000 }),
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 10000 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByLabelText('Best value')).toBeInTheDocument();
    });

    it('does not highlight when all totals are equal', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 10000 }),
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 10000 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.queryByLabelText('Best value')).not.toBeInTheDocument();
    });

    it('does not highlight with single quote', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ totalPremium: 10000 }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.queryByLabelText('Best value')).not.toBeInTheDocument();
    });
  });

  describe('payment plan info', () => {
    it('shows payment plan section when present', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown({ paymentPlan: 'Annual' }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Payment Plans:')).toBeInTheDocument();
      expect(screen.getByText(/Annual/)).toBeInTheDocument();
    });

    it('shows Not specified for quotes without payment plan', () => {
      // Need at least one quote WITH a payment plan to render the section
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          premiumBreakdown: createMockPremiumBreakdown({ paymentPlan: 'Annual' }),
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          premiumBreakdown: createMockPremiumBreakdown({ paymentPlan: null }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText(/Not specified/)).toBeInTheDocument();
    });
  });

  describe('null value handling', () => {
    it('shows dash for null values', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown({ basePremium: null }),
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('uses annualPremium as fallback for totalPremium', () => {
      const extractions = [
        createMockExtraction({
          annualPremium: 15000,
          premiumBreakdown: {
            basePremium: 12000,
            coveragePremiums: [],
            taxes: 500,
            fees: 100,
            brokerFee: null,
            surplusLinesTax: null,
            totalPremium: null,
            paymentPlan: null,
            sourcePages: [],
          } as PremiumBreakdown,
        }),
      ];
      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });
  });

  describe('document fallback headers', () => {
    it('uses document filename when carrier is null', () => {
      const extractions = [
        createMockExtraction({
          carrierName: null,
          premiumBreakdown: createMockPremiumBreakdown(),
        }),
      ];
      const documents = [{ id: '1', filename: 'quote.pdf', carrierName: null, extractedAt: '', extracted: true }];

      render(<PremiumBreakdownTable extractions={extractions} documents={documents} />);
      expect(screen.getByText('quote.pdf')).toBeInTheDocument();
    });

    it('uses Quote N fallback when no carrier or document', () => {
      const extractions = [
        createMockExtraction({
          carrierName: null,
          premiumBreakdown: createMockPremiumBreakdown(),
        }),
      ];

      render(<PremiumBreakdownTable extractions={extractions} />);
      expect(screen.getByText('Quote 1')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const extractions = [
        createMockExtraction({
          premiumBreakdown: createMockPremiumBreakdown(),
        }),
      ];
      const { container } = render(
        <PremiumBreakdownTable extractions={extractions} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
