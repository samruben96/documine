/**
 * @vitest-environment happy-dom
 */
/**
 * Textarea Component Unit Tests
 * Story DR.6: Form Input Refinement
 *
 * Tests the Textarea UI component for consistent styling patterns.
 * AC-DR.6.1: border border-slate-200 rounded-lg
 * AC-DR.6.2: px-3 py-2 text-sm
 * AC-DR.6.3: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea Component - Story DR.6', () => {
  /**
   * Test AC-DR.6.1: Border and border-radius
   */
  describe('AC-DR.6.1: Border styling', () => {
    it('renders with border class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('border');
    });

    it('renders with border-slate-200 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('border-slate-200');
    });

    it('renders with rounded-lg class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test AC-DR.6.2: Padding and text size
   */
  describe('AC-DR.6.2: Padding and text styling', () => {
    it('renders with px-3 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('px-3');
    });

    it('renders with py-2 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('py-2');
    });

    it('renders with text-sm class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('text-sm');
    });
  });

  /**
   * Test AC-DR.6.3: Focus state styling
   */
  describe('AC-DR.6.3: Focus state', () => {
    it('renders with focus:outline-none class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('focus:outline-none');
    });

    it('renders with focus:ring-2 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('focus:ring-2');
    });

    it('renders with focus:ring-primary/20 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('focus:ring-primary/20');
    });

    it('renders with focus:border-primary class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('focus:border-primary');
    });
  });

  /**
   * Test dark mode variants
   */
  describe('Dark mode variants', () => {
    it('renders with dark:border-slate-700 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('dark:border-slate-700');
    });

    it('renders with dark:focus:border-primary class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('dark:focus:border-primary');
    });

    it('renders with dark:bg-input/30 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('dark:bg-input/30');
    });
  });

  /**
   * Test transition
   */
  describe('Transition', () => {
    it('renders with transition-colors class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('transition-colors');
    });
  });

  /**
   * Test disabled state
   */
  describe('Disabled state', () => {
    it('renders with disabled:opacity-50 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('disabled:opacity-50');
    });

    it('renders with disabled:cursor-not-allowed class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  /**
   * Test aria-invalid state
   */
  describe('Invalid state', () => {
    it('renders with aria-invalid:border-destructive class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('aria-invalid:border-destructive');
    });

    it('renders with aria-invalid:ring-destructive/20 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('aria-invalid:ring-destructive/20');
    });
  });

  /**
   * Test custom className merge
   */
  describe('Custom className', () => {
    it('allows custom className to be passed', () => {
      render(<Textarea data-testid="textarea" className="custom-class" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('custom-class');
    });

    it('preserves default classes when custom className is added', () => {
      render(<Textarea data-testid="textarea" className="custom-class" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('border-slate-200');
      expect(textarea).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test data-slot attribute
   */
  describe('Data attributes', () => {
    it('renders with data-slot="textarea" attribute', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });
  });

  /**
   * Test min-height
   */
  describe('Minimum height', () => {
    it('renders with min-h-16 class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('min-h-16');
    });
  });
});
