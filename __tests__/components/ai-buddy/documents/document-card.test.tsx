/**
 * @vitest-environment happy-dom
 */
/**
 * Document Card Component Tests
 * Story 17.2: Project Document Management
 *
 * Tests for DocumentCard component rendering and interactions.
 *
 * AC-17.2.5: Remove button removes document from project
 * AC-17.2.7: Shows extraction context for quote documents
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentCard } from '@/components/ai-buddy/documents/document-card';
import type { ProjectDocument } from '@/types/ai-buddy';

const mockDocument: ProjectDocument = {
  document_id: 'doc-1',
  attached_at: '2024-01-01T00:00:00Z',
  document: {
    id: 'doc-1',
    name: 'Test Policy.pdf',
    file_type: 'pdf',
    status: 'ready',
    page_count: 10,
    created_at: '2024-01-01T00:00:00Z',
    extraction_data: null,
  },
};

const mockQuoteDocument: ProjectDocument = {
  document_id: 'doc-2',
  attached_at: '2024-01-01T00:00:00Z',
  document: {
    id: 'doc-2',
    name: 'Commercial Quote.pdf',
    file_type: 'pdf',
    status: 'ready',
    page_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    extraction_data: {
      carrier: 'Test Carrier',
      premium: 5000,
      coverages: ['GL', 'Property'],
    },
  },
};

describe('DocumentCard', () => {
  it('renders document name', () => {
    render(<DocumentCard document={mockDocument} onRemove={vi.fn()} />);

    expect(screen.getByText('Test Policy.pdf')).toBeInTheDocument();
  });

  it('shows page count when available', () => {
    render(<DocumentCard document={mockDocument} onRemove={vi.fn()} />);

    expect(screen.getByText('10 pages')).toBeInTheDocument();
  });

  it('shows file type indicator', () => {
    render(<DocumentCard document={mockDocument} onRemove={vi.fn()} />);

    expect(screen.getByText('pdf')).toBeInTheDocument();
  });

  // AC-17.2.5: Remove button
  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<DocumentCard document={mockDocument} onRemove={onRemove} />);

    const removeButton = screen.getByTestId('remove-document-button');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('doc-1');
  });

  it('disables remove button when isRemoving is true', () => {
    render(
      <DocumentCard document={mockDocument} onRemove={vi.fn()} isRemoving={true} />
    );

    const removeButton = screen.getByTestId('remove-document-button');
    expect(removeButton).toBeDisabled();
  });

  it('disables remove button when disabled prop is true', () => {
    render(
      <DocumentCard document={mockDocument} onRemove={vi.fn()} disabled={true} />
    );

    const removeButton = screen.getByTestId('remove-document-button');
    expect(removeButton).toBeDisabled();
  });

  // AC-17.2.7: Quote badge for extraction data
  it('shows Quote badge when document has extraction_data', () => {
    render(<DocumentCard document={mockQuoteDocument} onRemove={vi.fn()} />);

    expect(screen.getByText('Quote')).toBeInTheDocument();
  });

  it('does not show Quote badge when document has no extraction_data', () => {
    render(<DocumentCard document={mockDocument} onRemove={vi.fn()} />);

    expect(screen.queryByText('Quote')).not.toBeInTheDocument();
  });

  it('shows Processing status when processing', () => {
    const processingDoc: ProjectDocument = {
      ...mockDocument,
      document: {
        ...mockDocument.document,
        status: 'processing',
      },
    };

    render(<DocumentCard document={processingDoc} onRemove={vi.fn()} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows Failed status when failed', () => {
    const failedDoc: ProjectDocument = {
      ...mockDocument,
      document: {
        ...mockDocument.document,
        status: 'failed',
      },
    };

    render(<DocumentCard document={failedDoc} onRemove={vi.fn()} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('has document-card testid', () => {
    render(<DocumentCard document={mockDocument} onRemove={vi.fn()} />);

    expect(screen.getByTestId('document-card')).toBeInTheDocument();
  });

  it('handles null page_count gracefully', () => {
    const noPageCountDoc: ProjectDocument = {
      ...mockDocument,
      document: {
        ...mockDocument.document,
        page_count: null,
      },
    };

    render(<DocumentCard document={noPageCountDoc} onRemove={vi.fn()} />);

    // Should not show page count
    expect(screen.queryByText(/pages/)).not.toBeInTheDocument();
  });

  it('does not render remove button when onRemove not provided', () => {
    render(<DocumentCard document={mockDocument} />);

    expect(screen.queryByTestId('remove-document-button')).not.toBeInTheDocument();
  });
});
