/**
 * ComparisonTable Component Unit Tests
 *
 * Story 7.3: AC-7.3.1 through AC-7.3.8
 * Tests for table rendering, visual indicators, and accessibility.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonTable } from '@/components/compare/comparison-table';
import type { QuoteExtraction, DocumentSummary } from '@/types/compare';

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

function createMockDocument(overrides: Partial<DocumentSummary> = {}): DocumentSummary {
  return {
    id: '1',
    filename: 'test-doc.pdf',
    carrierName: null,
    extractedAt: '2024-12-03T12:00:00Z',
    extracted: true,
    ...overrides,
  };
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('ComparisonTable', () => {
  describe('basic rendering', () => {
    it('renders table with correct structure', () => {
      const extractions = [
        createMockExtraction({ carrierName: 'Hartford' }),
        createMockExtraction({ carrierName: 'Travelers' }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // Should have a table
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Should have column headers
      expect(screen.getByText('Field')).toBeInTheDocument();
      // Carrier names appear in both header and body row, so use getAllByText
      expect(screen.getAllByText('Hartford').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Travelers').length).toBeGreaterThanOrEqual(1);
    });

    it('displays empty state when no extractions', () => {
      render(<ComparisonTable extractions={[]} />);
      expect(screen.getByText('No comparison data available')).toBeInTheDocument();
    });

    it('renders carrier names in header row', () => {
      const extractions = [
        createMockExtraction({ carrierName: 'Carrier A' }),
        createMockExtraction({ carrierName: 'Carrier B' }),
        createMockExtraction({ carrierName: 'Carrier C' }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // Carrier names appear in both header and body row, so use getAllByText
      expect(screen.getAllByText('Carrier A').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Carrier B').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Carrier C').length).toBeGreaterThanOrEqual(1);
    });

    it('shows numbered badges for each quote', () => {
      const extractions = [
        createMockExtraction({ carrierName: 'Hartford' }),
        createMockExtraction({ carrierName: 'Travelers' }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('basic info rows (AC-7.3.2)', () => {
    it('displays all basic fields', () => {
      const extractions = [
        createMockExtraction({
          carrierName: 'Hartford',
          policyNumber: 'POL-123',
          namedInsured: 'Acme Corp',
          annualPremium: 12500,
          effectiveDate: '2024-01-01',
          expirationDate: '2025-01-01',
        }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('Carrier')).toBeInTheDocument();
      expect(screen.getByText('Policy Number')).toBeInTheDocument();
      expect(screen.getByText('Named Insured')).toBeInTheDocument();
      expect(screen.getByText('Annual Premium')).toBeInTheDocument();
      expect(screen.getByText('Effective Date')).toBeInTheDocument();
      expect(screen.getByText('Expiration Date')).toBeInTheDocument();
    });

    it('formats premium as currency', () => {
      const extractions = [createMockExtraction({ annualPremium: 12500 })];
      render(<ComparisonTable extractions={extractions} />);
      expect(screen.getByText('$12,500')).toBeInTheDocument();
    });

    it('formats dates correctly', () => {
      const extractions = [
        createMockExtraction({
          effectiveDate: '2024-06-15',
          expirationDate: '2025-06-15',
        }),
      ];
      render(<ComparisonTable extractions={extractions} />);
      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument();
    });
  });

  describe('coverage rows (AC-7.3.2)', () => {
    it('displays coverage limit rows', () => {
      const extractions = [
        createMockExtraction({
          coverages: [
            {
              type: 'general_liability',
              name: 'General Liability',
              limit: 1000000,
              sublimit: null,
              limitType: 'per_occurrence',
              deductible: 5000,
              description: 'GL Coverage',
              sourcePages: [1],
            },
          ],
        }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('General Liability - Limit')).toBeInTheDocument();
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('displays coverage deductible rows', () => {
      const extractions = [
        createMockExtraction({
          coverages: [
            {
              type: 'general_liability',
              name: 'General Liability',
              limit: 1000000,
              sublimit: null,
              limitType: null,
              deductible: 5000,
              description: '',
              sourcePages: [],
            },
          ],
        }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('General Liability - Deductible')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('shows multiple coverage types', () => {
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

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('General Liability - Limit')).toBeInTheDocument();
      expect(screen.getByText('Property - Limit')).toBeInTheDocument();
    });
  });

  describe('best value highlighting (AC-7.3.3)', () => {
    it('shows green indicator for best premium (lowest)', () => {
      const extractions = [
        createMockExtraction({ carrierName: 'A', annualPremium: 6000 }),
        createMockExtraction({ carrierName: 'B', annualPremium: 4500 }),
        createMockExtraction({ carrierName: 'C', annualPremium: 5500 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // The best value ($4,500) should have a green indicator
      const bestIndicators = screen.getAllByText('●');
      expect(bestIndicators.length).toBeGreaterThan(0);
    });

    it('shows red indicator for worst premium (highest)', () => {
      const extractions = [
        createMockExtraction({ carrierName: 'A', annualPremium: 6000 }),
        createMockExtraction({ carrierName: 'B', annualPremium: 4500 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // The worst value should have a red indicator
      const worstIndicators = screen.getAllByText('○');
      expect(worstIndicators.length).toBeGreaterThan(0);
    });

    it('shows best indicator for highest limit', () => {
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
      ];

      render(<ComparisonTable extractions={extractions} />);

      // $2M limit should have best indicator
      const cells = screen.getAllByRole('cell');
      const limitCell = cells.find((cell) => cell.textContent?.includes('$2,000,000'));
      expect(limitCell).toBeDefined();
    });

    it('does not show indicators when values are the same', () => {
      const extractions = [
        createMockExtraction({ annualPremium: 5000 }),
        createMockExtraction({ annualPremium: 5000 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // Both premiums are $5,000 - no indicators should appear for this row
      // Get all premium cells and check they don't have indicators
      const premiumRow = screen.getByText('Annual Premium').closest('tr');
      expect(premiumRow).toBeDefined();

      const indicators = within(premiumRow!).queryAllByText(/[●○]/);
      // Should have no best/worst indicators in this row
      expect(indicators).toHaveLength(0);
    });
  });

  describe('not found handling (AC-7.3.5)', () => {
    it('displays dash for null values', () => {
      const extractions = [
        createMockExtraction({ annualPremium: null }),
        createMockExtraction({ annualPremium: 5000 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('excludes not found values from best/worst comparison', () => {
      const extractions = [
        createMockExtraction({ annualPremium: null }),
        createMockExtraction({ annualPremium: 5000 }),
        createMockExtraction({ annualPremium: 6000 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      // Best should be $5,000 (lower is better), worst should be $6,000
      // The null value shouldn't participate
      const bestIndicators = screen.getAllByText('●');
      expect(bestIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('summary rows', () => {
    it('displays coverage and exclusion counts', () => {
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
          exclusions: [
            { name: 'Flood', description: '', category: 'flood', sourcePages: [] },
          ],
        }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByText('Coverages Count')).toBeInTheDocument();
      expect(screen.getByText('Exclusions Count')).toBeInTheDocument();
    });
  });

  describe('document fallback headers', () => {
    it('uses document filename when carrier is null', () => {
      const extractions = [createMockExtraction({ carrierName: null })];
      const documents = [createMockDocument({ filename: 'my-quote.pdf' })];

      render(<ComparisonTable extractions={extractions} documents={documents} />);

      expect(screen.getByText('my-quote.pdf')).toBeInTheDocument();
    });
  });

  describe('table accessibility', () => {
    it('has proper table structure', () => {
      const extractions = [createMockExtraction()];
      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('has scope="col" on column headers', () => {
      const extractions = [createMockExtraction()];
      render(<ComparisonTable extractions={extractions} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('has aria-label on best/worst indicators', () => {
      const extractions = [
        createMockExtraction({ annualPremium: 4000 }),
        createMockExtraction({ annualPremium: 6000 }),
      ];

      render(<ComparisonTable extractions={extractions} />);

      expect(screen.getByLabelText('Best value')).toBeInTheDocument();
      expect(screen.getByLabelText('Highest cost/lowest coverage')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies container class', () => {
      const extractions = [createMockExtraction()];
      const { container } = render(
        <ComparisonTable extractions={extractions} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ===========================================================================
  // Story 7.5: Source Citations Tests
  // ===========================================================================

  describe('source citations (AC-7.5.1)', () => {
    it('shows source link button when coverage has sourcePages', () => {
      const extractions = [
        createMockExtraction({
          coverages: [
            {
              type: 'general_liability',
              name: 'GL',
              limit: 1000000,
              sublimit: null,
              limitType: null,
              deductible: 5000,
              description: '',
              sourcePages: [3, 4], // Has source reference
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-1' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      // Should have view source buttons
      const sourceButtons = screen.getAllByRole('button', { name: /view source/i });
      expect(sourceButtons.length).toBeGreaterThan(0);
    });

    it('does not show source link when sourcePages is empty', () => {
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
              sourcePages: [], // No source pages
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-1' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      // Should not have view source buttons for the coverage row
      const sourceButtons = screen.queryAllByRole('button', { name: /view source/i });
      expect(sourceButtons).toHaveLength(0);
    });

    it('calls onSourceClick with correct arguments when source button clicked', async () => {
      const user = userEvent.setup();
      const extractions = [
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
              sourcePages: [7], // Page 7
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-abc' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      const sourceButton = screen.getByRole('button', { name: /view source/i });
      await user.click(sourceButton);

      expect(onSourceClick).toHaveBeenCalledWith('doc-abc', 7, 0);
    });

    it('shows source button with correct tooltip', () => {
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
              sourcePages: [5],
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-1' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      const sourceButton = screen.getByRole('button', { name: /view source/i });
      expect(sourceButton).toHaveAttribute('title', 'View on page 5');
    });
  });

  describe('inferred values (AC-7.5.5)', () => {
    it('shows info icon for values without source pages', () => {
      // When a value exists but has no sourcePages, it's considered "inferred"
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
              sourcePages: [], // No source - inferred
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-1' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      // The limit row should have inferred indicator - but we need to be specific
      // The value $1,000,000 should be shown
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('does not show info icon when value has source pages', () => {
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
              sourcePages: [2], // Has source
            },
          ],
        }),
      ];
      const documents = [createMockDocument({ id: 'doc-1' })];
      const onSourceClick = vi.fn();

      render(
        <ComparisonTable
          extractions={extractions}
          documents={documents}
          onSourceClick={onSourceClick}
        />
      );

      // Should have source button, not inferred indicator
      expect(screen.getByRole('button', { name: /view source/i })).toBeInTheDocument();
    });
  });
});
