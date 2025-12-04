/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentTypeBadge } from '@/components/documents/document-type-badge';

describe('DocumentTypeBadge', () => {
  describe('rendering', () => {
    it('renders quote type with correct label', () => {
      render(<DocumentTypeBadge type="quote" />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('renders general type with correct label', () => {
      render(<DocumentTypeBadge type="general" />);
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('defaults to quote when type is null', () => {
      render(<DocumentTypeBadge type={null} />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('defaults to quote when type is undefined', () => {
      render(<DocumentTypeBadge type={undefined} />);
      expect(screen.getByText('Quote')).toBeInTheDocument();
    });

    it('has correct data-testid', () => {
      render(<DocumentTypeBadge type="quote" />);
      expect(screen.getByTestId('document-type-badge')).toBeInTheDocument();
    });

    it('has correct data-type attribute', () => {
      render(<DocumentTypeBadge type="general" />);
      expect(screen.getByTestId('document-type-badge')).toHaveAttribute('data-type', 'general');
    });
  });

  describe('icon display', () => {
    it('shows icon by default', () => {
      const { container } = render(<DocumentTypeBadge type="quote" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(<DocumentTypeBadge type="quote" showIcon={false} />);
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies blue styling for quote type', () => {
      render(<DocumentTypeBadge type="quote" />);
      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('applies gray styling for general type', () => {
      render(<DocumentTypeBadge type="general" />);
      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('applies custom className', () => {
      render(<DocumentTypeBadge type="quote" className="custom-class" />);
      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('click behavior', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<DocumentTypeBadge type="quote" onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('document-type-badge'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has cursor-pointer class when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<DocumentTypeBadge type="quote" onClick={handleClick} />);

      const badge = screen.getByTestId('document-type-badge');
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('does not have cursor-pointer class when no onClick', () => {
      render(<DocumentTypeBadge type="quote" />);

      const badge = screen.getByTestId('document-type-badge');
      expect(badge).not.toHaveClass('cursor-pointer');
    });
  });
});
