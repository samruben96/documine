/**
 * EndorsementMatrix Component Tests
 *
 * Story 10.8: AC-10.8.4
 * Tests for endorsement comparison grid.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndorsementMatrix, isCriticalEndorsement } from '@/components/compare/endorsement-matrix';
import type { QuoteExtraction, Endorsement } from '@/types/compare';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockEndorsement(overrides: Partial<Endorsement> = {}): Endorsement {
  return {
    formNumber: 'CG 00 01',
    name: 'Test Endorsement',
    type: 'broadening',
    description: 'Test description',
    affectedCoverage: null,
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
    annualPremium: 10000,
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
// isCriticalEndorsement Helper Tests
// ============================================================================

describe('isCriticalEndorsement', () => {
  it('identifies CG 20 10 as critical', () => {
    const endorsement = createMockEndorsement({ formNumber: 'CG 20 10' });
    expect(isCriticalEndorsement(endorsement)).toBe(true);
  });

  it('identifies CG 20 37 as critical', () => {
    const endorsement = createMockEndorsement({ formNumber: 'CG 20 37' });
    expect(isCriticalEndorsement(endorsement)).toBe(true);
  });

  it('identifies CG 24 04 as critical', () => {
    const endorsement = createMockEndorsement({ formNumber: 'CG 24 04' });
    expect(isCriticalEndorsement(endorsement)).toBe(true);
  });

  it('handles spacing variations', () => {
    const endorsement = createMockEndorsement({ formNumber: 'CG  20  10' });
    expect(isCriticalEndorsement(endorsement)).toBe(true);
  });

  it('handles case insensitivity', () => {
    const endorsement = createMockEndorsement({ formNumber: 'cg 20 10' });
    expect(isCriticalEndorsement(endorsement)).toBe(true);
  });

  it('returns false for non-critical endorsements', () => {
    const endorsement = createMockEndorsement({ formNumber: 'CG 00 01' });
    expect(isCriticalEndorsement(endorsement)).toBe(false);
  });
});

// ============================================================================
// EndorsementMatrix Component Tests
// ============================================================================

describe('EndorsementMatrix', () => {
  describe('empty state', () => {
    it('shows empty message when no endorsements', () => {
      render(<EndorsementMatrix extractions={[createMockExtraction()]} />);
      expect(screen.getByText('No endorsements found in any quote.')).toBeInTheDocument();
    });

    it('shows empty message when extractions have no endorsements', () => {
      const extractions = [
        createMockExtraction({ endorsements: [] }),
        createMockExtraction({ endorsements: [] }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('No endorsements found in any quote.')).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('renders endorsement matrix with testid', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ name: 'Additional Insured' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByTestId('endorsement-matrix')).toBeInTheDocument();
    });

    it('displays endorsement name', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ name: 'Additional Insured Coverage' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Additional Insured Coverage')).toBeInTheDocument();
    });

    it('displays form number', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ formNumber: 'CG 20 10' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('CG 20 10')).toBeInTheDocument();
    });

    it('displays carrier name in header', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          endorsements: [createMockEndorsement()],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Hartford')).toBeInTheDocument();
    });
  });

  describe('endorsement type badges', () => {
    it('shows Broadening badge for broadening endorsements', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ type: 'broadening' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Broadening')).toBeInTheDocument();
    });

    it('shows Restricting badge for restricting endorsements', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ type: 'restricting' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Restricting')).toBeInTheDocument();
    });

    it('shows Conditional badge for conditional endorsements', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement({ type: 'conditional' })],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Conditional')).toBeInTheDocument();
    });
  });

  describe('critical endorsements (AC-10.8.4)', () => {
    it('marks CG 20 10 as critical with badge', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [
            createMockEndorsement({
              formNumber: 'CG 20 10',
              name: 'Additional Insured',
            }),
          ],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('sorts critical endorsements first', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [
            createMockEndorsement({
              formNumber: 'CG 00 01',
              name: 'ZZZ Regular Endorsement',
            }),
            createMockEndorsement({
              formNumber: 'CG 20 10',
              name: 'AAA Critical Endorsement',
            }),
          ],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);

      const rows = screen.getAllByRole('row');
      // Skip header row, first data row should be critical
      const firstDataRow = rows[1];
      expect(firstDataRow).toHaveTextContent('AAA Critical Endorsement');
    });
  });

  describe('presence indicators', () => {
    it('shows check icon for present endorsements', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement()],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByLabelText('Present')).toBeInTheDocument();
    });

    it('shows X icon for missing endorsements', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          endorsements: [createMockEndorsement({ formNumber: 'CG 20 10' })],
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          endorsements: [],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByLabelText('Missing')).toBeInTheDocument();
    });

    it('compares endorsements across multiple quotes', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          endorsements: [
            createMockEndorsement({ formNumber: 'CG 20 10', name: 'AI 1' }),
            createMockEndorsement({ formNumber: 'CG 24 04', name: 'WOS' }),
          ],
        }),
        createMockExtraction({
          carrierName: 'Travelers',
          endorsements: [
            createMockEndorsement({ formNumber: 'CG 20 10', name: 'AI 1' }),
          ],
        }),
      ];
      render(<EndorsementMatrix extractions={extractions} />);

      // Both have CG 20 10
      const presentIcons = screen.getAllByLabelText('Present');
      expect(presentIcons.length).toBeGreaterThanOrEqual(2);

      // Only Hartford has CG 24 04
      const missingIcons = screen.getAllByLabelText('Missing');
      expect(missingIcons.length).toBe(1);
    });
  });

  describe('document fallback headers', () => {
    it('uses document filename when carrier is null', () => {
      const extractions = [
        createMockExtraction({
          carrierName: null,
          endorsements: [createMockEndorsement()],
        }),
      ];
      const documents = [{ id: '1', filename: 'quote-doc.pdf', carrierName: null, extractedAt: '', extracted: true }];

      render(<EndorsementMatrix extractions={extractions} documents={documents} />);
      expect(screen.getByText('quote-doc.pdf')).toBeInTheDocument();
    });

    it('uses Quote N fallback when no carrier or document', () => {
      const extractions = [
        createMockExtraction({
          carrierName: null,
          endorsements: [createMockEndorsement()],
        }),
      ];

      render(<EndorsementMatrix extractions={extractions} />);
      expect(screen.getByText('Quote 1')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const extractions = [
        createMockExtraction({
          endorsements: [createMockEndorsement()],
        }),
      ];
      const { container } = render(
        <EndorsementMatrix extractions={extractions} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
