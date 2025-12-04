/**
 * SourceViewerModal Component Unit Tests
 *
 * Story 7.5: AC-7.5.2, AC-7.5.3
 * Tests for modal rendering and document viewer integration.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceViewerModal } from '@/components/compare/source-viewer-modal';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { storage_path: 'docs/test.pdf', filename: 'test.pdf' },
              error: null,
            }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve({
            data: { signedUrl: 'https://example.com/test.pdf' },
            error: null,
          }),
      }),
    },
  }),
}));

// Mock DocumentViewer since it requires pdf.js which doesn't work in jsdom
vi.mock('@/components/documents/document-viewer', () => ({
  DocumentViewer: vi.fn(({ pdfUrl, className }) => (
    <div data-testid="document-viewer" data-pdf-url={pdfUrl} className={className}>
      Mock Document Viewer
    </div>
  )),
}));

describe('SourceViewerModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    documentId: 'doc-123',
    pageNumber: 5,
    carrierName: 'Hartford',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering (AC-7.5.2)', () => {
    it('renders modal with correct title', async () => {
      render(<SourceViewerModal {...defaultProps} />);

      expect(screen.getByText('Source Document')).toBeInTheDocument();
      expect(screen.getByText('— Hartford')).toBeInTheDocument();
      expect(screen.getByText('(Page 5)')).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(<SourceViewerModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Source Document')).not.toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<SourceViewerModal {...defaultProps} />);

      expect(screen.getByText('Loading document...')).toBeInTheDocument();
    });

    it('shows document viewer after loading', async () => {
      render(<SourceViewerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('document loading', () => {
    it('does not show document viewer when documentId is null', () => {
      render(<SourceViewerModal {...defaultProps} documentId={null} />);

      // Should not show document viewer
      expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument();
      // Should not show loading either since we early return
      expect(screen.queryByText('Loading document...')).not.toBeInTheDocument();
    });

    it('does not show document viewer when modal is closed', () => {
      render(<SourceViewerModal {...defaultProps} open={false} />);

      // Modal is closed, nothing should render
      expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('calls onOpenChange when closed', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<SourceViewerModal {...defaultProps} onOpenChange={onOpenChange} />);

      // The close button is in the DialogContent
      // We need to wait for the modal to fully render
      await waitFor(() => {
        expect(screen.getByText('Source Document')).toBeInTheDocument();
      });

      // Press Escape to close
      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    it('has aria-describedby for screen readers', async () => {
      render(<SourceViewerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('View the source document for the selected value')).toBeInTheDocument();
      });
    });

    it('has proper dialog role', async () => {
      render(<SourceViewerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('page navigation (AC-7.5.3)', () => {
    it('displays page number in modal title', async () => {
      render(<SourceViewerModal {...defaultProps} pageNumber={7} />);

      // The page number is shown in the title
      expect(screen.getByText('(Page 7)')).toBeInTheDocument();
    });

    it('displays carrier name in modal title', async () => {
      render(<SourceViewerModal {...defaultProps} carrierName="Travelers" />);

      expect(screen.getByText('— Travelers')).toBeInTheDocument();
    });
  });
});
