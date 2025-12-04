/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from '@/components/documents/document-card';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the date utility
vi.mock('@/lib/utils/date', () => ({
  formatRelativeDate: vi.fn(() => 'Just now'),
}));

// Mock tooltip provider
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
}));

describe('DocumentCard', () => {
  const defaultProps = {
    id: 'doc-123',
    filename: 'test-document.pdf',
    status: 'ready',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with required props', () => {
      render(<DocumentCard {...defaultProps} />);

      expect(screen.getByTestId('document-card')).toBeInTheDocument();
      // Text appears in both title and tooltip, so use getAllByText
      expect(screen.getAllByText('test-document.pdf').length).toBeGreaterThan(0);
    });

    it('displays displayName when provided instead of filename', () => {
      render(
        <DocumentCard
          {...defaultProps}
          displayName="Custom Document Name"
        />
      );

      // Text appears in both title and tooltip, so use getAllByText
      expect(screen.getAllByText('Custom Document Name').length).toBeGreaterThan(0);
      expect(screen.queryByText('test-document.pdf')).not.toBeInTheDocument();
    });

    it('shows page count when provided', () => {
      render(<DocumentCard {...defaultProps} pageCount={15} />);

      expect(screen.getByText('15 pages')).toBeInTheDocument();
    });

    it('shows singular "page" for single page documents', () => {
      render(<DocumentCard {...defaultProps} pageCount={1} />);

      expect(screen.getByText('1 page')).toBeInTheDocument();
    });

    it('does not show page count when null', () => {
      render(<DocumentCard {...defaultProps} pageCount={null} />);

      expect(screen.queryByText(/page/)).not.toBeInTheDocument();
    });

    it('shows document type badge', () => {
      render(<DocumentCard {...defaultProps} documentType="general" />);

      expect(screen.getByText('general')).toBeInTheDocument();
    });

    it('defaults to "quote" type when not provided', () => {
      render(<DocumentCard {...defaultProps} />);

      expect(screen.getByText('quote')).toBeInTheDocument();
    });

    it('shows labels when provided', () => {
      const labels = [
        { id: '1', name: 'Important', color: '#ff0000' },
        { id: '2', name: 'Review', color: '#00ff00' },
      ];

      render(<DocumentCard {...defaultProps} labels={labels} />);

      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('shows +N indicator when more than 3 labels', () => {
      const labels = [
        { id: '1', name: 'Label1', color: '#ff0000' },
        { id: '2', name: 'Label2', color: '#00ff00' },
        { id: '3', name: 'Label3', color: '#0000ff' },
        { id: '4', name: 'Label4', color: '#ffff00' },
      ];

      render(<DocumentCard {...defaultProps} labels={labels} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('navigation (AC-F2-1.4)', () => {
    it('navigates to /chat-docs/[id] on click', async () => {
      const user = userEvent.setup();
      render(<DocumentCard {...defaultProps} />);

      await user.click(screen.getByTestId('document-card'));

      expect(mockPush).toHaveBeenCalledWith('/chat-docs/doc-123');
    });

    it('navigates on Enter key press', async () => {
      render(<DocumentCard {...defaultProps} />);

      const card = screen.getByTestId('document-card');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/chat-docs/doc-123');
    });

    it('navigates on Space key press', async () => {
      render(<DocumentCard {...defaultProps} />);

      const card = screen.getByTestId('document-card');
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockPush).toHaveBeenCalledWith('/chat-docs/doc-123');
    });

    it('has correct aria-label for accessibility', () => {
      render(<DocumentCard {...defaultProps} displayName="My Document" />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Open document: My Document'
      );
    });
  });

  describe('status display (AC-F2-1.3)', () => {
    it('renders with ready status', () => {
      render(<DocumentCard {...defaultProps} status="ready" />);

      // DocumentStatusBadge should render
      expect(screen.getByTestId('document-card')).toBeInTheDocument();
    });

    it('renders with processing status', () => {
      render(<DocumentCard {...defaultProps} status="processing" />);

      expect(screen.getByTestId('document-card')).toBeInTheDocument();
    });

    it('renders with failed status', () => {
      render(<DocumentCard {...defaultProps} status="failed" />);

      expect(screen.getByTestId('document-card')).toBeInTheDocument();
    });
  });
});
