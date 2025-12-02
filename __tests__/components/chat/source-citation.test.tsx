/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceCitationList, truncateExcerpt } from '@/components/chat/source-citation';
import type { SourceCitation } from '@/lib/chat/types';

// Mock source data for tests
const mockSourceSingle: SourceCitation = {
  pageNumber: 3,
  text: 'The liability limit is $1,000,000 per occurrence.',
  chunkId: 'chunk-1',
  similarityScore: 0.92,
};

const mockSourcesMultiple: SourceCitation[] = [
  {
    pageNumber: 7,
    text: 'Flood damage is excluded from this policy.',
    chunkId: 'chunk-2',
    similarityScore: 0.78,
  },
  {
    pageNumber: 3,
    text: 'The liability limit is $1,000,000 per occurrence.',
    chunkId: 'chunk-1',
    similarityScore: 0.92,
  },
  {
    pageNumber: 12,
    text: 'Coverage begins on the effective date.',
    chunkId: 'chunk-3',
    similarityScore: 0.65,
  },
];

const mockSourcesMany: SourceCitation[] = [
  { pageNumber: 5, text: 'Text 1', chunkId: 'chunk-1' },
  { pageNumber: 2, text: 'Text 2', chunkId: 'chunk-2' },
  { pageNumber: 8, text: 'Text 3', chunkId: 'chunk-3' },
  { pageNumber: 15, text: 'Text 4', chunkId: 'chunk-4' },
  { pageNumber: 22, text: 'Text 5', chunkId: 'chunk-5' },
];

describe('SourceCitationList', () => {
  describe('AC-5.4.1: Single source display', () => {
    it('renders "Page X" link for single source', () => {
      render(<SourceCitationList sources={[mockSourceSingle]} />);

      expect(screen.getByRole('button', { name: /page 3/i })).toBeInTheDocument();
    });

    it('does not show "Sources:" label for single source', () => {
      render(<SourceCitationList sources={[mockSourceSingle]} />);

      expect(screen.queryByText('Sources:')).not.toBeInTheDocument();
    });

    it('includes arrow icon (ChevronRight)', () => {
      render(<SourceCitationList sources={[mockSourceSingle]} />);

      // ChevronRight renders as an SVG - check the button contains an SVG
      const button = screen.getByRole('button', { name: /page 3/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('AC-5.4.2: Citation link styling', () => {
    it('applies subtle styling (small text, muted color)', () => {
      render(<SourceCitationList sources={[mockSourceSingle]} />);

      const button = screen.getByRole('button', { name: /page 3/i });
      // Check for text-xs and text-slate-500 classes
      expect(button).toHaveClass('text-xs', 'text-slate-500');
    });

    it('has hover state with underline', () => {
      render(<SourceCitationList sources={[mockSourceSingle]} />);

      const button = screen.getByRole('button', { name: /page 3/i });
      expect(button).toHaveClass('hover:underline', 'hover:text-slate-700');
    });
  });

  describe('AC-5.4.3: Multiple sources format', () => {
    it('displays "Sources:" label for multiple sources', () => {
      render(<SourceCitationList sources={mockSourcesMultiple} />);

      expect(screen.getByText('Sources:')).toBeInTheDocument();
    });

    it('shows all page numbers as links', () => {
      render(<SourceCitationList sources={mockSourcesMultiple} />);

      expect(screen.getByRole('button', { name: /page 3/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 7/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 12/i })).toBeInTheDocument();
    });

    it('sorts sources by page number ascending', () => {
      render(<SourceCitationList sources={mockSourcesMultiple} />);

      const buttons = screen.getAllByRole('button');
      // First button should be Page 3, then Page 7, then Page 12
      expect(buttons[0]).toHaveTextContent('Page 3');
      expect(buttons[1]).toHaveTextContent('Page 7');
      expect(buttons[2]).toHaveTextContent('Page 12');
    });

    it('makes each page number independently clickable', () => {
      const onSourceClick = vi.fn();
      render(<SourceCitationList sources={mockSourcesMultiple} onSourceClick={onSourceClick} />);

      // Click page 7
      fireEvent.click(screen.getByRole('button', { name: /page 7/i }));

      expect(onSourceClick).toHaveBeenCalledWith(
        expect.objectContaining({ pageNumber: 7 })
      );
    });
  });

  describe('AC-5.4.4: Expandable sources for many citations', () => {
    it('shows first 3 sources in collapsed state', () => {
      render(<SourceCitationList sources={mockSourcesMany} />);

      // Should show pages 2, 5, 8 (sorted order, first 3)
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 8/i })).toBeInTheDocument();
    });

    it('shows "and X more" when more than 3 sources', () => {
      render(<SourceCitationList sources={mockSourcesMany} />);

      expect(screen.getByRole('button', { name: /2 more/i })).toBeInTheDocument();
    });

    it('expands to show all sources when "and X more" clicked', () => {
      render(<SourceCitationList sources={mockSourcesMany} />);

      // Click expand button
      fireEvent.click(screen.getByRole('button', { name: /2 more/i }));

      // All 5 pages should now be visible - use exact aria-label match
      expect(screen.getByRole('button', { name: 'View page 2 in document' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View page 5 in document' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View page 8 in document' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View page 15 in document' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View page 22 in document' })).toBeInTheDocument();
    });

    it('shows "(show less)" button when expanded', () => {
      render(<SourceCitationList sources={mockSourcesMany} />);

      // Expand
      fireEvent.click(screen.getByRole('button', { name: /2 more/i }));

      expect(screen.getByRole('button', { name: /fewer sources/i })).toBeInTheDocument();
    });

    it('collapses when "(show less)" clicked', () => {
      render(<SourceCitationList sources={mockSourcesMany} />);

      // Expand then collapse
      fireEvent.click(screen.getByRole('button', { name: /2 more/i }));
      fireEvent.click(screen.getByRole('button', { name: /fewer sources/i }));

      // Should be back to collapsed state
      expect(screen.getByRole('button', { name: /2 more/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'View page 15 in document' })).not.toBeInTheDocument();
    });
  });

  describe('AC-5.4.1: Click handler for source navigation', () => {
    it('calls onSourceClick with source data when clicked', () => {
      const onSourceClick = vi.fn();
      render(<SourceCitationList sources={[mockSourceSingle]} onSourceClick={onSourceClick} />);

      fireEvent.click(screen.getByRole('button', { name: /page 3/i }));

      expect(onSourceClick).toHaveBeenCalledTimes(1);
      expect(onSourceClick).toHaveBeenCalledWith(mockSourceSingle);
    });

    it('supports keyboard navigation with Enter key', () => {
      const onSourceClick = vi.fn();
      render(<SourceCitationList sources={[mockSourceSingle]} onSourceClick={onSourceClick} />);

      const button = screen.getByRole('button', { name: /page 3/i });
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onSourceClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with Space key', () => {
      const onSourceClick = vi.fn();
      render(<SourceCitationList sources={[mockSourceSingle]} onSourceClick={onSourceClick} />);

      const button = screen.getByRole('button', { name: /page 3/i });
      fireEvent.keyDown(button, { key: ' ' });

      expect(onSourceClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('returns null when sources array is empty', () => {
      const { container } = render(<SourceCitationList sources={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when sources is undefined', () => {
      const { container } = render(
        <SourceCitationList sources={undefined as unknown as SourceCitation[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('deduplicates sources with same page number', () => {
      const duplicateSources: SourceCitation[] = [
        { pageNumber: 3, text: 'Text 1', chunkId: 'chunk-1' },
        { pageNumber: 3, text: 'Text 2', chunkId: 'chunk-2' },
        { pageNumber: 5, text: 'Text 3', chunkId: 'chunk-3' },
      ];

      render(<SourceCitationList sources={duplicateSources} />);

      // Should only show 2 unique page numbers
      const page3Buttons = screen.getAllByRole('button', { name: /page 3/i });
      expect(page3Buttons).toHaveLength(1);
      expect(screen.getByRole('button', { name: /page 5/i })).toBeInTheDocument();
    });
  });
});

describe('truncateExcerpt', () => {
  describe('AC-5.4.5: Text excerpt truncation', () => {
    it('returns full text if under limit', () => {
      const shortText = 'Short text';
      expect(truncateExcerpt(shortText, 100)).toBe(shortText);
    });

    it('truncates text at 100 characters by default', () => {
      const longText = 'A'.repeat(150);
      const result = truncateExcerpt(longText);

      expect(result).toHaveLength(103); // 100 chars + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('handles empty string', () => {
      expect(truncateExcerpt('')).toBe('');
    });

    it('handles exactly 100 characters', () => {
      const exactText = 'A'.repeat(100);
      expect(truncateExcerpt(exactText, 100)).toBe(exactText);
    });
  });
});
