/**
 * @vitest-environment jsdom
 */

/**
 * OnePagerButton Component Tests
 *
 * Story 9.5: AC-9.5.4 - Consistent button styling
 *
 * Tests cover:
 * - Rendering with different props
 * - Correct href generation for comparison vs document entry
 * - Icon-only mode
 * - Accessibility attributes
 */

import { render, screen } from '@testing-library/react';
import { OnePagerButton } from '@/components/one-pager/one-pager-button';

describe('OnePagerButton', () => {
  describe('rendering', () => {
    it('renders with default text and icon', () => {
      render(<OnePagerButton />);

      const button = screen.getByTestId('one-pager-button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Generate One-Pager')).toBeInTheDocument();
    });

    it('renders as a link element', () => {
      render(<OnePagerButton />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('href generation', () => {
    it('links to /one-pager with no params when neither ID provided', () => {
      render(<OnePagerButton />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/one-pager');
    });

    it('links to /one-pager?comparisonId=xxx when comparisonId provided', () => {
      render(<OnePagerButton comparisonId="comp-123" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/one-pager?comparisonId=comp-123');
    });

    it('links to /one-pager?documentId=xxx when documentId provided', () => {
      render(<OnePagerButton documentId="doc-456" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/one-pager?documentId=doc-456');
    });

    it('prefers comparisonId over documentId when both provided', () => {
      render(<OnePagerButton comparisonId="comp-123" documentId="doc-456" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/one-pager?comparisonId=comp-123');
    });
  });

  describe('variants and sizes', () => {
    it('applies default variant (outline)', () => {
      render(<OnePagerButton />);

      const button = screen.getByTestId('one-pager-button');
      // Button should have outline variant class
      expect(button.className).toContain('border');
    });

    it('accepts size prop', () => {
      render(<OnePagerButton size="sm" />);

      const button = screen.getByTestId('one-pager-button');
      expect(button).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(<OnePagerButton className="custom-class" />);

      const button = screen.getByTestId('one-pager-button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('icon-only mode', () => {
    it('hides text when iconOnly is true', () => {
      render(<OnePagerButton iconOnly />);

      expect(screen.queryByText('Generate One-Pager')).not.toBeInTheDocument();
    });

    it('still renders icon in iconOnly mode', () => {
      render(<OnePagerButton iconOnly />);

      const button = screen.getByTestId('one-pager-button');
      // Icon should be present (FileText icon rendered as SVG)
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has data-testid for testing', () => {
      render(<OnePagerButton />);

      expect(screen.getByTestId('one-pager-button')).toBeInTheDocument();
    });

    it('is keyboard accessible as a link', () => {
      render(<OnePagerButton />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });
});
