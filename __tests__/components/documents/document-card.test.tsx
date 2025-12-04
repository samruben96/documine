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

    it('shows document type via toggle', () => {
      render(<DocumentCard {...defaultProps} documentType="general" />);

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('defaults to "Quote" type when not provided', () => {
      render(<DocumentCard {...defaultProps} />);

      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('renders document type toggle', () => {
      render(<DocumentCard {...defaultProps} />);

      expect(screen.getByTestId('document-type-toggle')).toBeInTheDocument();
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

      const card = screen.getByTestId('document-card');
      expect(card).toHaveAttribute('aria-label', 'Open document: My Document');
    });
  });

  describe('document type toggle (AC-F2-2.3)', () => {
    it('calls onTypeChange when type is changed', async () => {
      const handleTypeChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DocumentCard
          {...defaultProps}
          documentType="quote"
          onTypeChange={handleTypeChange}
        />
      );

      // Click the toggle to open dropdown
      await user.click(screen.getByTestId('document-type-toggle'));

      // Wait for dropdown and click general option
      const generalOption = await screen.findByTestId('type-option-general');
      await user.click(generalOption);

      expect(handleTypeChange).toHaveBeenCalledWith('doc-123', 'general');
    });

    it('shows loading state when isUpdatingType is true', () => {
      render(
        <DocumentCard
          {...defaultProps}
          documentType="quote"
          isUpdatingType
        />
      );

      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('opacity-50');
    });

    it('disables toggle when document is not ready', () => {
      render(
        <DocumentCard
          {...defaultProps}
          status="processing"
          documentType="quote"
        />
      );

      const toggle = screen.getByTestId('document-type-toggle');
      expect(toggle).toBeDisabled();
    });

    it('enables toggle when document is ready', () => {
      render(
        <DocumentCard
          {...defaultProps}
          status="ready"
          documentType="quote"
        />
      );

      const toggle = screen.getByTestId('document-type-toggle');
      expect(toggle).not.toBeDisabled();
    });

    it('does not navigate when clicking type toggle', async () => {
      const user = userEvent.setup();
      render(
        <DocumentCard
          {...defaultProps}
          onTypeChange={vi.fn()}
        />
      );

      // Click the toggle
      await user.click(screen.getByTestId('document-type-toggle'));

      // Should not navigate
      expect(mockPush).not.toHaveBeenCalled();
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

  describe('AI tags display (AC-F2-3.6)', () => {
    it('displays AI tags when provided', () => {
      const aiTags = ['Commercial Auto', 'Liability', 'Progressive'];
      render(<DocumentCard {...defaultProps} aiTags={aiTags} />);

      expect(screen.getByTestId('ai-tags')).toBeInTheDocument();
      expect(screen.getByText('Commercial Auto')).toBeInTheDocument();
      expect(screen.getByText('Liability')).toBeInTheDocument();
      expect(screen.getByText('Progressive')).toBeInTheDocument();
    });

    it('truncates to 3 tags with +N indicator', () => {
      const aiTags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5'];
      render(<DocumentCard {...defaultProps} aiTags={aiTags} />);

      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
      expect(screen.getByText('Tag3')).toBeInTheDocument();
      expect(screen.queryByText('Tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('Tag5')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('does not display tags section when aiTags is null', () => {
      render(<DocumentCard {...defaultProps} aiTags={null} />);

      expect(screen.queryByTestId('ai-tags')).not.toBeInTheDocument();
    });

    it('does not display tags section when aiTags is empty', () => {
      render(<DocumentCard {...defaultProps} aiTags={[]} />);

      expect(screen.queryByTestId('ai-tags')).not.toBeInTheDocument();
    });

    it('shows summary in tooltip when hovering over tags', () => {
      const aiTags = ['Coverage A'];
      const aiSummary = 'Commercial auto policy for fleet coverage.';
      render(<DocumentCard {...defaultProps} aiTags={aiTags} aiSummary={aiSummary} />);

      // Tooltip content should be rendered (our mock renders it directly)
      // Multiple tooltips exist (filename, tags) - check that summary text exists
      const tooltips = screen.getAllByTestId('tooltip');
      const summaryTooltip = tooltips.find(t => t.textContent?.includes(aiSummary));
      expect(summaryTooltip).toBeDefined();
    });

    it('does not show tooltip when no summary provided', () => {
      const aiTags = ['Coverage A'];
      render(<DocumentCard {...defaultProps} aiTags={aiTags} aiSummary={null} />);

      // Tooltip content should not have summary text
      const tooltips = screen.queryAllByTestId('tooltip');
      const hasCommercialText = tooltips.some(t => t.textContent?.includes('Commercial auto policy'));
      expect(hasCommercialText).toBe(false);
    });
  });
});
