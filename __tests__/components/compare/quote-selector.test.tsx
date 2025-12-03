/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteSelector } from '@/components/compare/quote-selector';

// Mock the date utility
vi.mock('@/lib/utils/date', () => ({
  formatRelativeDate: vi.fn(() => '2 hours ago'),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock UploadZone component
vi.mock('@/components/documents/upload-zone', () => ({
  UploadZone: ({ onFilesAccepted }: { onFilesAccepted: (files: File[]) => void }) => (
    <div data-testid="mock-upload-zone">Upload Zone Mock</div>
  ),
}));

describe('QuoteSelector', () => {
  const mockDocuments = [
    {
      id: 'doc-1',
      filename: 'insurance-quote-1.pdf',
      display_name: null,
      status: 'ready',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-2',
      filename: 'insurance-quote-2.pdf',
      display_name: 'Custom Quote Name',
      status: 'ready',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-3',
      filename: 'processing-doc.pdf',
      display_name: null,
      status: 'processing',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-4',
      filename: 'failed-doc.pdf',
      display_name: null,
      status: 'failed',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-5',
      filename: 'ready-doc-3.pdf',
      display_name: null,
      status: 'ready',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-6',
      filename: 'ready-doc-4.pdf',
      display_name: null,
      status: 'ready',
      created_at: new Date().toISOString(),
    },
    {
      id: 'doc-7',
      filename: 'ready-doc-5.pdf',
      display_name: null,
      status: 'ready',
      created_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    documents: mockDocuments,
    selectedIds: [] as string[],
    onSelectionChange: vi.fn(),
    onDocumentUploaded: vi.fn(),
    maxSelections: 4,
    minSelections: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-7.1.1: Document cards with selection checkboxes', () => {
    it('renders document cards in a grid layout', () => {
      render(<QuoteSelector {...defaultProps} />);

      // Should have quote cards for ready documents
      const cards = screen.getAllByTestId('quote-card');
      expect(cards.length).toBeGreaterThanOrEqual(5); // 5 ready docs
    });

    it('renders document filename on card', () => {
      render(<QuoteSelector {...defaultProps} />);

      expect(screen.getByText('insurance-quote-1.pdf')).toBeInTheDocument();
    });

    it('renders display_name when provided instead of filename', () => {
      render(<QuoteSelector {...defaultProps} />);

      expect(screen.getByText('Custom Quote Name')).toBeInTheDocument();
      // filename should not be shown when display_name exists
    });

    it('renders selection checkbox on each card', () => {
      render(<QuoteSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(5);
    });

    it('applies selected styling when card is selected', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={['doc-1']} />);

      const card = screen.getAllByTestId('quote-card')[0];
      expect(card).toHaveClass('border-primary');
      expect(card).toHaveClass('bg-blue-50');
    });
  });

  describe('AC-7.1.2: Only status=ready documents are selectable', () => {
    it('shows ready documents as selectable', () => {
      render(<QuoteSelector {...defaultProps} />);

      // Ready documents section should exist
      expect(screen.getByText(/Ready for Comparison/)).toBeInTheDocument();
    });

    it('shows processing documents as disabled', () => {
      render(<QuoteSelector {...defaultProps} />);

      // Processing section should exist
      expect(screen.getByText(/Processing \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('shows failed documents as disabled', () => {
      render(<QuoteSelector {...defaultProps} />);

      // Failed section should exist
      expect(screen.getByText(/Failed \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Processing failed')).toBeInTheDocument();
    });

    it('does not call onSelectionChange when clicking processing document', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector {...defaultProps} onSelectionChange={onSelectionChange} />
      );

      // Find processing card and click it
      const processingCard = screen
        .getAllByTestId('quote-card')
        .find((card) => card.textContent?.includes('Processing...'));
      if (processingCard) {
        fireEvent.click(processingCard);
      }

      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('AC-7.1.3: Selection count display', () => {
    it('shows selection counter with 0 selected initially', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={[]} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });

    it('shows selection counter with correct count when documents selected', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={['doc-1', 'doc-2']} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows helper text when no documents selected', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={[]} />);

      expect(screen.getByText(/Select at least 2 documents to compare/)).toBeInTheDocument();
    });
  });

  describe('AC-7.1.4 & AC-7.1.5: Maximum selection enforcement', () => {
    it('calls onSelectionChange with new ID when selecting', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      // Click first ready document card
      const firstCard = screen.getAllByTestId('quote-card')[0];
      fireEvent.click(firstCard);

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-1']);
    });

    it('calls onSelectionChange to remove ID when deselecting', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={['doc-1', 'doc-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      // Click first card to deselect
      const firstCard = screen.getAllByTestId('quote-card')[0];
      fireEvent.click(firstCard);

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-2']);
    });

    it('does not allow selecting more than maxSelections', async () => {
      const { toast } = await import('sonner');
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={['doc-1', 'doc-2', 'doc-5', 'doc-6']} // 4 already selected
          onSelectionChange={onSelectionChange}
        />
      );

      // Try to select 5th document (doc-7 is not in selectedIds)
      const unselectedCard = screen.getByText('ready-doc-5.pdf').closest('[data-testid="quote-card"]');
      if (unselectedCard) {
        // The card should be disabled, clicking it should trigger toggleSelection
        // but the guard should prevent adding to selection
        fireEvent.click(unselectedCard);
      }

      // The card is disabled when max is reached, so onSelectionChange won't be called
      // because the click handler checks isDisabled first
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('disables unselected cards when max is reached', () => {
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={['doc-1', 'doc-2', 'doc-5', 'doc-6']} // 4 selected
        />
      );

      // Find an unselected card (doc-7)
      const unselectedCard = screen.getByText('ready-doc-5.pdf').closest('[data-testid="quote-card"]');
      expect(unselectedCard).toHaveAttribute('aria-disabled', 'true');
    });

    it('allows deselecting when at max', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={['doc-1', 'doc-2', 'doc-5', 'doc-6']} // 4 selected
          onSelectionChange={onSelectionChange}
        />
      );

      // Click selected card to deselect
      const selectedCard = screen.getByText('insurance-quote-1.pdf').closest('[data-testid="quote-card"]');
      if (selectedCard) {
        fireEvent.click(selectedCard);
      }

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-2', 'doc-5', 'doc-6']);
    });
  });

  describe('AC-7.1.6: Upload new quotes', () => {
    it('renders upload button', () => {
      render(<QuoteSelector {...defaultProps} />);

      expect(screen.getByText('Upload new quotes')).toBeInTheDocument();
    });

    it('opens upload dialog when button clicked', () => {
      render(<QuoteSelector {...defaultProps} />);

      const uploadButton = screen.getByText('Upload new quotes');
      fireEvent.click(uploadButton);

      expect(screen.getByText('Upload Quote Documents')).toBeInTheDocument();
      expect(screen.getByTestId('mock-upload-zone')).toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('shows empty state when no documents', () => {
      render(<QuoteSelector {...defaultProps} documents={[]} />);

      expect(screen.getByText('No documents yet')).toBeInTheDocument();
      expect(
        screen.getByText('Upload some quote documents to get started with comparison.')
      ).toBeInTheDocument();
    });

    it('shows "no documents ready" when only processing/failed documents exist', () => {
      const onlyProcessingDocs = [
        {
          id: 'doc-1',
          filename: 'processing.pdf',
          display_name: null,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ];
      render(<QuoteSelector {...defaultProps} documents={onlyProcessingDocs} />);

      expect(screen.getByText('No documents ready')).toBeInTheDocument();
    });
  });

  describe('Keyboard accessibility', () => {
    it('allows selecting with Enter key', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      const firstCard = screen.getAllByTestId('quote-card')[0];
      fireEvent.keyDown(firstCard, { key: 'Enter' });

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-1']);
    });

    it('allows selecting with Space key', () => {
      const onSelectionChange = vi.fn();
      render(
        <QuoteSelector
          {...defaultProps}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      const firstCard = screen.getAllByTestId('quote-card')[0];
      fireEvent.keyDown(firstCard, { key: ' ' });

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-1']);
    });

    it('cards have role="checkbox"', () => {
      render(<QuoteSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(5);
    });

    it('selected cards have aria-checked="true"', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={['doc-1']} />);

      const selectedCard = screen.getByText('insurance-quote-1.pdf').closest('[role="checkbox"]');
      expect(selectedCard).toHaveAttribute('aria-checked', 'true');
    });

    it('unselected cards have aria-checked="false"', () => {
      render(<QuoteSelector {...defaultProps} selectedIds={[]} />);

      const unselectedCard = screen.getByText('insurance-quote-1.pdf').closest('[role="checkbox"]');
      expect(unselectedCard).toHaveAttribute('aria-checked', 'false');
    });
  });
});
