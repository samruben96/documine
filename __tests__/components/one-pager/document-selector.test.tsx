/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentSelector } from '@/components/one-pager/document-selector';
import type { SelectableDocument } from '@/hooks/use-one-pager-data';

/**
 * DocumentSelector Component Tests
 * Story 9.3: AC-9.3.4 - Document selection for direct access mode
 */

const mockDocuments: SelectableDocument[] = [
  {
    id: 'doc-1',
    filename: 'Progressive-Quote.pdf',
    carrierName: 'Progressive',
    status: 'ready',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'doc-2',
    filename: 'Geico-Quote.pdf',
    carrierName: 'Geico',
    status: 'ready',
    createdAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'doc-3',
    filename: 'State-Farm-Quote.pdf',
    carrierName: 'State Farm',
    status: 'ready',
    createdAt: '2024-01-13T10:00:00Z',
  },
  {
    id: 'doc-4',
    filename: 'Allstate-Quote.pdf',
    carrierName: 'Allstate',
    status: 'ready',
    createdAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'doc-5',
    filename: 'Liberty-Quote.pdf',
    carrierName: 'Liberty Mutual',
    status: 'ready',
    createdAt: '2024-01-11T10:00:00Z',
  },
];

describe('DocumentSelector', () => {
  const mockOnGenerate = vi.fn();
  const mockOnUseComparison = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('AC-9.3.4: renders document list correctly', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      expect(screen.getByText('Select Documents')).toBeInTheDocument();
      expect(screen.getByText('Progressive-Quote.pdf')).toBeInTheDocument();
      expect(screen.getByText('Geico-Quote.pdf')).toBeInTheDocument();
    });

    it('shows selection counter with 0 selected initially', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      render(
        <DocumentSelector
          documents={[]}
          isLoading={true}
          onGenerate={mockOnGenerate}
        />
      );

      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
    });

    it('shows empty state when no documents available', () => {
      render(
        <DocumentSelector
          documents={[]}
          onGenerate={mockOnGenerate}
        />
      );

      expect(screen.getByText('No documents available')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to documents/i })).toHaveAttribute('href', '/documents');
    });

    it('shows "Use Existing Comparison" button when callback provided', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
          onUseComparison={mockOnUseComparison}
        />
      );

      expect(screen.getByText('Use Existing Comparison')).toBeInTheDocument();
    });
  });

  describe('Document Selection', () => {
    it('allows selecting a document', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      const doc1 = screen.getByTestId('document-item-doc-1');
      fireEvent.click(doc1);

      expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
    });

    it('allows deselecting a selected document', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      const doc1 = screen.getByTestId('document-item-doc-1');
      fireEvent.click(doc1);
      expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();

      fireEvent.click(doc1);
      expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
    });

    it('allows selecting multiple documents up to max', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          maxSelections={4}
          onGenerate={mockOnGenerate}
        />
      );

      fireEvent.click(screen.getByTestId('document-item-doc-1'));
      fireEvent.click(screen.getByTestId('document-item-doc-2'));
      fireEvent.click(screen.getByTestId('document-item-doc-3'));
      fireEvent.click(screen.getByTestId('document-item-doc-4'));

      expect(screen.getByText('4 of 4 selected')).toBeInTheDocument();
      expect(screen.getByText('Maximum reached')).toBeInTheDocument();
    });

    it('prevents selecting more than maxSelections', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          maxSelections={2}
          onGenerate={mockOnGenerate}
        />
      );

      fireEvent.click(screen.getByTestId('document-item-doc-1'));
      fireEvent.click(screen.getByTestId('document-item-doc-2'));
      fireEvent.click(screen.getByTestId('document-item-doc-3'));

      // Should still show 2 selected (3rd click should be ignored)
      expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
    });
  });

  describe('Generate Button', () => {
    it('generate button is disabled when no documents selected', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      const generateBtn = screen.getByTestId('generate-button');
      expect(generateBtn).toBeDisabled();
    });

    it('generate button is enabled when at least 1 document selected', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      fireEvent.click(screen.getByTestId('document-item-doc-1'));

      const generateBtn = screen.getByTestId('generate-button');
      expect(generateBtn).not.toBeDisabled();
    });

    it('calls onGenerate with selected document IDs', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
        />
      );

      fireEvent.click(screen.getByTestId('document-item-doc-1'));
      fireEvent.click(screen.getByTestId('document-item-doc-3'));
      fireEvent.click(screen.getByTestId('generate-button'));

      expect(mockOnGenerate).toHaveBeenCalledWith(['doc-1', 'doc-3']);
    });
  });

  describe('Use Existing Comparison', () => {
    it('calls onUseComparison when button clicked', () => {
      render(
        <DocumentSelector
          documents={mockDocuments}
          onGenerate={mockOnGenerate}
          onUseComparison={mockOnUseComparison}
        />
      );

      fireEvent.click(screen.getByText('Use Existing Comparison'));
      expect(mockOnUseComparison).toHaveBeenCalledTimes(1);
    });
  });
});
