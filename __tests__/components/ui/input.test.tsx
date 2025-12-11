/**
 * @vitest-environment happy-dom
 */
/**
 * Input Component Unit Tests
 * Story DR.6: Form Input Refinement
 *
 * Tests the Input UI component for consistent styling patterns.
 * AC-DR.6.1: border border-slate-200 rounded-lg
 * AC-DR.6.2: px-3 py-2 text-sm
 * AC-DR.6.3: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component - Story DR.6', () => {
  /**
   * Test AC-DR.6.1: Border and border-radius
   */
  describe('AC-DR.6.1: Border styling', () => {
    it('renders with border class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border');
    });

    it('renders with border-slate-200 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-slate-200');
    });

    it('renders with rounded-lg class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test AC-DR.6.2: Padding and text size
   */
  describe('AC-DR.6.2: Padding and text styling', () => {
    it('renders with px-3 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('px-3');
    });

    it('renders with py-2 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('py-2');
    });

    it('renders with text-sm class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('text-sm');
    });
  });

  /**
   * Test AC-DR.6.3: Focus state styling
   */
  describe('AC-DR.6.3: Focus state', () => {
    it('renders with focus:outline-none class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:outline-none');
    });

    it('renders with focus:ring-2 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('renders with focus:ring-primary/20 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:ring-primary/20');
    });

    it('renders with focus:border-primary class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:border-primary');
    });
  });

  /**
   * Test dark mode variants
   */
  describe('Dark mode variants', () => {
    it('renders with dark:border-slate-700 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('dark:border-slate-700');
    });

    it('renders with dark:focus:border-primary class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('dark:focus:border-primary');
    });

    it('renders with dark:bg-input/30 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('dark:bg-input/30');
    });
  });

  /**
   * Test transition
   */
  describe('Transition', () => {
    it('renders with transition-colors class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('transition-colors');
    });
  });

  /**
   * Test disabled state
   */
  describe('Disabled state', () => {
    it('renders with disabled:opacity-50 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('renders with disabled:cursor-not-allowed class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  /**
   * Test aria-invalid state
   */
  describe('Invalid state', () => {
    it('renders with aria-invalid:border-destructive class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('aria-invalid:border-destructive');
    });

    it('renders with aria-invalid:ring-destructive/20 class', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('aria-invalid:ring-destructive/20');
    });
  });

  /**
   * Test custom className merge
   */
  describe('Custom className', () => {
    it('allows custom className to be passed', () => {
      render(<Input data-testid="input" className="custom-class" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
    });

    it('preserves default classes when custom className is added', () => {
      render(<Input data-testid="input" className="custom-class" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-slate-200');
      expect(input).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test data-slot attribute
   */
  describe('Data attributes', () => {
    it('renders with data-slot="input" attribute', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('data-slot', 'input');
    });
  });
});
