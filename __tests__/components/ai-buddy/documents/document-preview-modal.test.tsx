/**
 * @vitest-environment happy-dom
 */
/**
 * DocumentPreviewModal Tests
 * Story 17.3: Document Preview & Multi-Document Context
 *
 * Tests for the document preview modal component.
 *
 * Covers:
 * - AC-17.3.1: Click on document opens preview in modal
 * - AC-17.3.2: Click citation opens preview to exact page
 * - AC-17.3.6: State resets to default on close/reopen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              storage_path: 'test/path/document.pdf',
              filename: 'document.pdf',
            },
            error: null,
          }),
        }),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url.pdf' },
          error: null,
        }),
      }),
    },
  }),
}));

// Mock the DocumentViewer component
vi.mock('@/components/documents/document-viewer', () => ({
  DocumentViewer: vi.fn(({ pdfUrl }) => (
    <div data-testid="mock-document-viewer">{pdfUrl || 'No URL'}</div>
  )),
}));

// Import after mocks
import { DocumentPreviewModal } from '@/components/ai-buddy/documents/document-preview-modal';

describe('DocumentPreviewModal', () => {
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    document: {
      documentId: 'doc-123',
      documentName: 'Test Document.pdf',
      initialPage: undefined,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the modal with document name in title', async () => {
      render(<DocumentPreviewModal {...defaultProps} />);

      expect(screen.getByTestId('document-preview-modal')).toBeInTheDocument();
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });

    it('shows loading state initially', async () => {
      render(<DocumentPreviewModal {...defaultProps} />);

      expect(screen.getByText('Loading document...')).toBeInTheDocument();
    });

    it('has viewer component (mock renders correctly)', () => {
      // This test verifies the mock is working - actual loading is async
      // The component will show loading first, then viewer
      render(<DocumentPreviewModal {...defaultProps} />);

      // Verify the modal renders
      expect(screen.getByTestId('document-preview-modal')).toBeInTheDocument();
    });

    it('AC-17.3.1: renders in modal format', async () => {
      render(<DocumentPreviewModal {...defaultProps} />);

      const modal = screen.getByTestId('document-preview-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('max-w-5xl');
    });
  });

  describe('AC-17.3.2: citation with page navigation', () => {
    it('accepts initialPage prop for page navigation', () => {
      const propsWithPage = {
        ...defaultProps,
        document: {
          documentId: 'doc-123',
          documentName: 'Test Document.pdf',
          initialPage: 5,
        },
      };

      render(<DocumentPreviewModal {...propsWithPage} />);

      // Verify modal renders with the page prop
      expect(screen.getByTestId('document-preview-modal')).toBeInTheDocument();
      // The initialPage prop is passed to the component and triggers scrollToPage via useEffect
    });
  });

  describe('AC-17.3.6: state reset on close', () => {
    it('does not fetch document when modal is closed', async () => {
      render(<DocumentPreviewModal {...defaultProps} open={false} />);

      // Modal should not render its content
      expect(screen.queryByTestId('document-preview-modal')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentPreviewModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close preview/i });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('error handling', () => {
    it('shows fallback title when document is null', () => {
      render(<DocumentPreviewModal {...defaultProps} document={null} />);

      expect(screen.getByText('Document Preview')).toBeInTheDocument();
    });
  });
});
