/**
 * @vitest-environment happy-dom
 */
/**
 * SourceCitation Component Tests
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for citation display components.
 * AC1-AC6: Source citation rendering and interaction
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SourceCitation, CitationList } from '@/components/ai-buddy/source-citation';
import type { Citation } from '@/types/ai-buddy';

// Mock citation data
const mockCitation: Citation = {
  documentId: 'doc-123',
  documentName: 'Policy.pdf',
  page: 5,
  text: 'The liability limit is $1,000,000 per occurrence.',
};

const mockCitationNoPage: Citation = {
  documentId: 'doc-456',
  documentName: 'Coverage Summary.pdf',
  text: 'Summary of all coverages included.',
};

const mockCitationNoText: Citation = {
  documentId: 'doc-789',
  documentName: 'Endorsement.pdf',
  page: 2,
};

describe('SourceCitation', () => {
  describe('Rendering (AC1-AC2)', () => {
    it('should render citation in format [📄 Document Name pg. X]', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toBeInTheDocument();
      expect(citation).toHaveTextContent('Policy.pdf pg. 5');
    });

    it('should render citation without page number when not provided', () => {
      render(<SourceCitation citation={mockCitationNoPage} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveTextContent('Coverage Summary.pdf');
      expect(citation).not.toHaveTextContent('pg.');
    });

    it('should be styled in blue (AC2)', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveClass('text-blue-500');
    });

    it('should include FileText icon', () => {
      render(<SourceCitation citation={mockCitation} />);

      // The icon is rendered as an SVG
      const citation = screen.getByTestId('source-citation');
      const svg = citation.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have underlined text', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      const underlinedText = citation.querySelector('.underline');
      expect(underlinedText).toBeInTheDocument();
    });

    it('should include data attributes for document and page', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveAttribute('data-document-id', 'doc-123');
      expect(citation).toHaveAttribute('data-page', '5');
    });
  });

  describe('Compact mode', () => {
    it('should render smaller text when compact=true', () => {
      render(<SourceCitation citation={mockCitation} compact />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveClass('text-xs');
    });

    it('should render normal text when compact=false', () => {
      render(<SourceCitation citation={mockCitation} compact={false} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveClass('text-sm');
    });
  });

  describe('Click handling (AC4)', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<SourceCitation citation={mockCitation} onClick={handleClick} />);

      const citation = screen.getByTestId('source-citation');
      await user.click(citation);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockCitation);
    });

    it('should call onClick on Enter key press', () => {
      const handleClick = vi.fn();

      render(<SourceCitation citation={mockCitation} onClick={handleClick} />);

      const citation = screen.getByTestId('source-citation');
      fireEvent.keyDown(citation, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockCitation);
    });

    it('should call onClick on Space key press', () => {
      const handleClick = vi.fn();

      render(<SourceCitation citation={mockCitation} onClick={handleClick} />);

      const citation = screen.getByTestId('source-citation');
      fireEvent.keyDown(citation, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not error when onClick is not provided', async () => {
      const user = userEvent.setup();

      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      // Should not throw
      await user.click(citation);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label with document name', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveAttribute(
        'aria-label',
        'View citation from Policy.pdf page 5'
      );
    });

    it('should have accessible label without page when not provided', () => {
      render(<SourceCitation citation={mockCitationNoPage} />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveAttribute(
        'aria-label',
        'View citation from Coverage Summary.pdf'
      );
    });

    it('should be focusable', () => {
      render(<SourceCitation citation={mockCitation} />);

      const citation = screen.getByTestId('source-citation');
      citation.focus();
      expect(document.activeElement).toBe(citation);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<SourceCitation citation={mockCitation} className="custom-class" />);

      const citation = screen.getByTestId('source-citation');
      expect(citation).toHaveClass('custom-class');
    });
  });
});

describe('CitationList', () => {
  const mockCitations: Citation[] = [
    mockCitation,
    mockCitationNoPage,
    mockCitationNoText,
  ];

  describe('Rendering', () => {
    it('should render list of citations', () => {
      render(<CitationList citations={mockCitations} />);

      const list = screen.getByTestId('citation-list');
      expect(list).toBeInTheDocument();

      const citations = screen.getAllByTestId('source-citation');
      expect(citations).toHaveLength(3);
    });

    it('should display "Sources:" label', () => {
      render(<CitationList citations={mockCitations} />);

      expect(screen.getByText('Sources:')).toBeInTheDocument();
    });

    it('should render citations in compact mode', () => {
      render(<CitationList citations={mockCitations} />);

      const citations = screen.getAllByTestId('source-citation');
      citations.forEach((citation) => {
        expect(citation).toHaveClass('text-xs');
      });
    });
  });

  describe('Empty state (AC6)', () => {
    it('should return null when citations array is empty', () => {
      const { container } = render(<CitationList citations={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should not display "Sources:" label when empty', () => {
      render(<CitationList citations={[]} />);

      expect(screen.queryByText('Sources:')).not.toBeInTheDocument();
    });
  });

  describe('Click handling', () => {
    it('should call onCitationClick with correct citation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <CitationList citations={mockCitations} onCitationClick={handleClick} />
      );

      const citations = screen.getAllByTestId('source-citation');
      await user.click(citations[1]); // Click second citation

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockCitationNoPage);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(
        <CitationList citations={mockCitations} className="custom-list-class" />
      );

      const list = screen.getByTestId('citation-list');
      expect(list).toHaveClass('custom-list-class');
    });
  });
});

describe('AC Requirements', () => {
  it('AC1: Citations display in format [📄 Document Name pg. X]', () => {
    render(<SourceCitation citation={mockCitation} />);

    const citation = screen.getByTestId('source-citation');
    // Should contain brackets, document name, and page number
    expect(citation).toHaveTextContent('[');
    expect(citation).toHaveTextContent('Policy.pdf pg. 5');
    expect(citation).toHaveTextContent(']');
  });

  it('AC2: Citations styled in blue', () => {
    render(<SourceCitation citation={mockCitation} />);

    const citation = screen.getByTestId('source-citation');
    expect(citation).toHaveClass('text-blue-500');
  });

  it('AC4: Citation is clickable', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SourceCitation citation={mockCitation} onClick={handleClick} />);

    const citation = screen.getByTestId('source-citation');
    await user.click(citation);

    expect(handleClick).toHaveBeenCalled();
  });

  it('AC6: No citations displayed when array is empty', () => {
    const { container } = render(<CitationList citations={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
