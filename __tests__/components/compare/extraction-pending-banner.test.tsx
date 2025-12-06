/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for ExtractionPendingBanner Component
 *
 * Story 11.7: AC-11.7.2, AC-11.7.3 - Pending Extraction Banner
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ExtractionPendingBanner,
  ExtractionFailedBanner,
} from '@/components/compare/extraction-pending-banner';
import type { DocumentWithExtraction } from '@/lib/compare/extraction-readiness';

// Helper to create test documents
function createDoc(
  id: string,
  overrides: Partial<DocumentWithExtraction> = {}
): DocumentWithExtraction {
  return {
    id,
    filename: `doc-${id}.pdf`,
    display_name: null,
    status: 'ready',
    extraction_status: null,
    extraction_data: null,
    page_count: 10,
    created_at: new Date().toISOString(),
    document_type: 'quote',
    ...overrides,
  };
}

describe('ExtractionPendingBanner', () => {
  const pendingDocs = [
    createDoc('1', { extraction_status: 'pending', display_name: 'Quote A' }),
    createDoc('2', { extraction_status: 'pending', display_name: 'Quote B' }),
  ];

  const extractingDocs = [
    createDoc('3', { extraction_status: 'extracting', display_name: 'Quote C' }),
  ];

  it('should render the banner with pending documents', () => {
    render(
      <ExtractionPendingBanner
        pendingDocs={pendingDocs}
        extractingDocs={[]}
        selectedDocIds={['1', '2']}
      />
    );

    expect(screen.getByTestId('extraction-pending-banner')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Quote Details')).toBeInTheDocument();
    expect(screen.getByText('Quote A')).toBeInTheDocument();
    expect(screen.getByText('Quote B')).toBeInTheDocument();
  });

  it('should show extracting documents with spinner', () => {
    render(
      <ExtractionPendingBanner
        pendingDocs={[]}
        extractingDocs={extractingDocs}
        selectedDocIds={['3']}
      />
    );

    expect(screen.getByTestId('extraction-pending-banner')).toBeInTheDocument();
    expect(screen.getByText('Quote C')).toBeInTheDocument();
    // Document should be listed as pending doc with spinner
    expect(screen.getByTestId('extraction-pending-doc')).toBeInTheDocument();
  });

  it('should show estimated time based on page count', () => {
    render(
      <ExtractionPendingBanner
        pendingDocs={pendingDocs} // 20 pages total
        extractingDocs={[]}
        selectedDocIds={['1', '2']}
      />
    );

    // 20 pages * 2 seconds = 40 seconds
    expect(screen.getByTestId('extraction-estimate')).toHaveTextContent('40s');
  });

  it('should provide link to chat with documents (AC-11.7.3)', () => {
    render(
      <ExtractionPendingBanner
        pendingDocs={pendingDocs}
        extractingDocs={[]}
        selectedDocIds={['1', '2']}
      />
    );

    const chatLink = screen.getByTestId('chat-while-waiting-link');
    expect(chatLink).toBeInTheDocument();
    expect(chatLink).toHaveAttribute('href', '/chat-docs/1');
  });

  it('should show retry button for failed documents', () => {
    const onRetry = vi.fn();
    const failedDocs = [
      createDoc('4', { extraction_status: 'failed', display_name: 'Failed Quote' }),
    ];

    render(
      <ExtractionPendingBanner
        pendingDocs={pendingDocs}
        extractingDocs={[]}
        selectedDocIds={['1', '2', '4']}
        failedDocs={failedDocs}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByTestId('extraction-retry-button');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledWith('4');
  });

  it('should return null when no pending or failed documents', () => {
    const { container } = render(
      <ExtractionPendingBanner
        pendingDocs={[]}
        extractingDocs={[]}
        selectedDocIds={['1']}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ExtractionFailedBanner', () => {
  const failedDocs = [
    createDoc('1', { extraction_status: 'failed', display_name: 'Failed Quote' }),
  ];

  const readyDocs = [
    createDoc('2', { extraction_status: 'complete', display_name: 'Ready Quote A' }),
    createDoc('3', { extraction_status: 'complete', display_name: 'Ready Quote B' }),
  ];

  it('should render the failed banner with documents', () => {
    render(
      <ExtractionFailedBanner failedDocs={failedDocs} readyDocs={readyDocs} />
    );

    expect(screen.getByTestId('extraction-failed-banner')).toBeInTheDocument();
    expect(screen.getByText(/Some Documents Couldn't Be Analyzed/)).toBeInTheDocument();
    expect(screen.getByText('Failed Quote')).toBeInTheDocument();
  });

  it('should show retry button and call onRetry', () => {
    const onRetry = vi.fn();

    render(
      <ExtractionFailedBanner
        failedDocs={failedDocs}
        readyDocs={readyDocs}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByTestId('extraction-retry-button');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledWith('1');
  });

  it('should show proceed anyway option when 2+ ready docs (AC-11.7.6)', () => {
    const onProceedAnyway = vi.fn();

    render(
      <ExtractionFailedBanner
        failedDocs={failedDocs}
        readyDocs={readyDocs}
        onProceedAnyway={onProceedAnyway}
      />
    );

    const proceedButton = screen.getByText('Proceed with Available Data');
    expect(proceedButton).toBeInTheDocument();

    fireEvent.click(proceedButton);
    expect(onProceedAnyway).toHaveBeenCalled();
  });

  it('should not show proceed option when less than 2 ready docs', () => {
    const onProceedAnyway = vi.fn();

    render(
      <ExtractionFailedBanner
        failedDocs={failedDocs}
        readyDocs={[readyDocs[0]]} // Only 1 ready doc
        onProceedAnyway={onProceedAnyway}
      />
    );

    expect(screen.queryByText('Proceed with Available Data')).not.toBeInTheDocument();
  });
});
