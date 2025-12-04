/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentTypeToggle } from '@/components/documents/document-type-toggle';

describe('DocumentTypeToggle', () => {
  const defaultProps = {
    type: 'quote' as const,
    onTypeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the toggle trigger', () => {
      render(<DocumentTypeToggle {...defaultProps} />);
      expect(screen.getByTestId('document-type-toggle')).toBeInTheDocument();
    });

    it('displays current type as quote', () => {
      render(<DocumentTypeToggle {...defaultProps} type="quote" />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('displays current type as general', () => {
      render(<DocumentTypeToggle {...defaultProps} type="general" />);
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('defaults to quote when type is null', () => {
      render(<DocumentTypeToggle {...defaultProps} type={null} />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('defaults to quote when type is undefined', () => {
      render(<DocumentTypeToggle {...defaultProps} type={undefined} />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('opens dropdown menu on click', async () => {
      const user = userEvent.setup();
      render(<DocumentTypeToggle {...defaultProps} />);

      await user.click(screen.getByTestId('document-type-toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('type-option-quote')).toBeInTheDocument();
        expect(screen.getByTestId('type-option-general')).toBeInTheDocument();
      });
    });

    it('calls onTypeChange when selecting a different type', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<DocumentTypeToggle {...defaultProps} onTypeChange={handleChange} type="quote" />);

      await user.click(screen.getByTestId('document-type-toggle'));
      await waitFor(() => {
        expect(screen.getByTestId('type-option-general')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('type-option-general'));

      expect(handleChange).toHaveBeenCalledWith('general');
    });

    it('calls onTypeChange when selecting the same type', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<DocumentTypeToggle {...defaultProps} onTypeChange={handleChange} type="quote" />);

      await user.click(screen.getByTestId('document-type-toggle'));
      await waitFor(() => {
        expect(screen.getByTestId('type-option-quote')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('type-option-quote'));

      expect(handleChange).toHaveBeenCalledWith('quote');
    });
  });

  describe('disabled state', () => {
    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<DocumentTypeToggle {...defaultProps} disabled />);

      const trigger = screen.getByTestId('document-type-toggle');
      expect(trigger).toBeDisabled();

      await user.click(trigger);

      expect(screen.queryByTestId('type-option-quote')).not.toBeInTheDocument();
    });

    it('is disabled when isLoading is true', () => {
      render(<DocumentTypeToggle {...defaultProps} isLoading />);

      const trigger = screen.getByTestId('document-type-toggle');
      expect(trigger).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('applies opacity when loading', () => {
      render(<DocumentTypeToggle {...defaultProps} isLoading />);

      // The badge should have opacity-50 class when loading
      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('opacity-50');
    });

    it('does not apply opacity when not loading', () => {
      render(<DocumentTypeToggle {...defaultProps} isLoading={false} />);

      const badge = screen.getByTestId('document-type-badge');
      expect(badge).not.toHaveClass('opacity-50');
    });
  });

  describe('accessibility', () => {
    it('has focus ring on trigger', () => {
      render(<DocumentTypeToggle {...defaultProps} />);

      const trigger = screen.getByTestId('document-type-toggle');
      expect(trigger).toHaveClass('focus:ring-2');
    });

    it('shows descriptions for each option', async () => {
      const user = userEvent.setup();
      render(<DocumentTypeToggle {...defaultProps} />);

      await user.click(screen.getByTestId('document-type-toggle'));

      await waitFor(() => {
        expect(screen.getByText('Insurance quote document')).toBeInTheDocument();
        expect(screen.getByText('General document (not a quote)')).toBeInTheDocument();
      });
    });
  });
});
