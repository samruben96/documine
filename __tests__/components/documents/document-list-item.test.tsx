/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentListItem } from '@/components/documents/document-list-item';

// Mock the date utility
vi.mock('@/lib/utils/date', () => ({
  formatRelativeDate: vi.fn((date) => 'Just now'),
}));

describe('DocumentListItem', () => {
  const defaultProps = {
    id: 'test-id',
    filename: 'test-document.pdf',
    displayName: null,
    status: 'ready',
    createdAt: new Date().toISOString(),
    isSelected: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-4.3.1: Document List Item Structure', () => {
    it('renders document filename', () => {
      render(<DocumentListItem {...defaultProps} />);

      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    it('renders display_name when provided', () => {
      render(
        <DocumentListItem
          {...defaultProps}
          displayName="My Custom Name"
        />
      );

      expect(screen.getByText('My Custom Name')).toBeInTheDocument();
      expect(screen.queryByText('test-document.pdf')).not.toBeInTheDocument();
    });

    it('renders upload date', () => {
      render(<DocumentListItem {...defaultProps} />);

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });

  describe('AC-4.3.3: Status Indicator', () => {
    it('renders status badge for ready status', () => {
      render(<DocumentListItem {...defaultProps} status="ready" />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders status badge for processing status', () => {
      render(<DocumentListItem {...defaultProps} status="processing" />);

      expect(screen.getByText('Analyzing')).toBeInTheDocument();
    });

    it('renders status badge for failed status', () => {
      render(<DocumentListItem {...defaultProps} status="failed" />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('AC-4.3.8: Selected Document Styling', () => {
    it('applies selected styling when isSelected is true', () => {
      const { container } = render(
        <DocumentListItem {...defaultProps} isSelected={true} />
      );

      // Styling is on the wrapper div, not the button
      const wrapper = container.querySelector('.group');
      expect(wrapper).toHaveClass('bg-[#f1f5f9]');
      expect(wrapper).toHaveClass('border-l-[#475569]');
    });

    it('does not apply selected styling when isSelected is false', () => {
      const { container } = render(
        <DocumentListItem {...defaultProps} isSelected={false} />
      );

      // Styling is on the wrapper div, not the button
      const wrapper = container.querySelector('.group');
      expect(wrapper).not.toHaveClass('bg-[#f1f5f9]');
      expect(wrapper).toHaveClass('border-l-transparent');
    });

    it('sets aria-current="page" when selected', () => {
      render(<DocumentListItem {...defaultProps} isSelected={true} />);

      // The first button is the main document button
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current when not selected', () => {
      render(<DocumentListItem {...defaultProps} isSelected={false} />);

      // The first button is the main document button
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).not.toHaveAttribute('aria-current');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<DocumentListItem {...defaultProps} onClick={onClick} />);

      // The first button is the main document button
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('truncation', () => {
    it('shows full filename in title attribute for truncated names', () => {
      const longFilename =
        'this-is-a-very-long-document-filename-that-should-be-truncated.pdf';
      render(
        <DocumentListItem {...defaultProps} filename={longFilename} />
      );

      const filenameElement = screen.getByText(longFilename);
      expect(filenameElement).toHaveAttribute('title', longFilename);
    });
  });

  describe('AC-4.4.1: Delete Action', () => {
    it('renders delete button when onDeleteClick is provided', () => {
      const onDeleteClick = vi.fn();
      render(
        <DocumentListItem {...defaultProps} onDeleteClick={onDeleteClick} />
      );

      expect(screen.getByLabelText('Delete test-document.pdf')).toBeInTheDocument();
    });

    it('does not render delete button when onDeleteClick is not provided', () => {
      render(<DocumentListItem {...defaultProps} />);

      expect(screen.queryByLabelText(/Delete/)).not.toBeInTheDocument();
    });

    it('calls onDeleteClick when delete button is clicked', () => {
      const onDeleteClick = vi.fn();
      render(
        <DocumentListItem {...defaultProps} onDeleteClick={onDeleteClick} />
      );

      const deleteButton = screen.getByLabelText('Delete test-document.pdf');
      fireEvent.click(deleteButton);

      expect(onDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick when delete button is clicked', () => {
      const onClick = vi.fn();
      const onDeleteClick = vi.fn();
      render(
        <DocumentListItem
          {...defaultProps}
          onClick={onClick}
          onDeleteClick={onDeleteClick}
        />
      );

      const deleteButton = screen.getByLabelText('Delete test-document.pdf');
      fireEvent.click(deleteButton);

      expect(onDeleteClick).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('uses displayName in delete button label when available', () => {
      const onDeleteClick = vi.fn();
      render(
        <DocumentListItem
          {...defaultProps}
          displayName="Custom Name"
          onDeleteClick={onDeleteClick}
        />
      );

      expect(screen.getByLabelText('Delete Custom Name')).toBeInTheDocument();
    });

    it('renders context menu with delete option', () => {
      const onDeleteClick = vi.fn();
      render(
        <DocumentListItem {...defaultProps} onDeleteClick={onDeleteClick} />
      );

      // Check for the more options button (three-dot menu)
      expect(screen.getByLabelText('More options for test-document.pdf')).toBeInTheDocument();
    });
  });
});
