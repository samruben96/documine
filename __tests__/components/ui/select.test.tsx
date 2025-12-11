/**
 * @vitest-environment happy-dom
 */
/**
 * Select Component Unit Tests
 * Story DR.6: Form Input Refinement
 *
 * Tests the Select UI components for consistent styling patterns.
 * AC-DR.6.6: Select dropdowns match input styling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

// Helper to render SelectTrigger within Select context
function renderSelectTrigger(props: Record<string, unknown> = {}) {
  return render(
    <Select>
      <SelectTrigger data-testid="select-trigger" {...props}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
    </Select>
  );
}

describe('SelectTrigger Component - Story DR.6', () => {
  /**
   * Test AC-DR.6.6: Border and border-radius (matching Input)
   */
  describe('AC-DR.6.6: Border styling (matching Input)', () => {
    it('renders with border class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('border');
    });

    it('renders with border-slate-200 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('border-slate-200');
    });

    it('renders with rounded-lg class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test AC-DR.6.6: Padding and text size (matching Input)
   */
  describe('AC-DR.6.6: Padding and text styling', () => {
    it('renders with px-3 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('px-3');
    });

    it('renders with py-2 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('py-2');
    });

    it('renders with text-sm class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('text-sm');
    });
  });

  /**
   * Test AC-DR.6.6: Focus state styling (matching Input)
   */
  describe('AC-DR.6.6: Focus state', () => {
    it('renders with focus:outline-none class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('focus:outline-none');
    });

    it('renders with focus:ring-2 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('focus:ring-2');
    });

    it('renders with focus:ring-primary/20 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('focus:ring-primary/20');
    });

    it('renders with focus:border-primary class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('focus:border-primary');
    });
  });

  /**
   * Test dark mode variants
   */
  describe('Dark mode variants', () => {
    it('renders with dark:border-slate-700 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('dark:border-slate-700');
    });

    it('renders with dark:focus:border-primary class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('dark:focus:border-primary');
    });

    it('renders with dark:bg-input/30 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('dark:bg-input/30');
    });
  });

  /**
   * Test transition
   */
  describe('Transition', () => {
    it('renders with transition-colors class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('transition-colors');
    });
  });

  /**
   * Test disabled state
   */
  describe('Disabled state', () => {
    it('renders with disabled:opacity-50 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('disabled:opacity-50');
    });

    it('renders with disabled:cursor-not-allowed class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  /**
   * Test size variants
   */
  describe('Size variants', () => {
    it('renders with data-[size=default]:h-9 class (default size)', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('data-[size=default]:h-9');
    });

    it('renders with data-[size=sm]:h-8 class for small size', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('data-[size=sm]:h-8');
    });

    it('has data-size="default" attribute by default', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('data-size', 'default');
    });

    it('has data-size="sm" attribute when size="sm"', () => {
      renderSelectTrigger({ size: 'sm' });
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('data-size', 'sm');
    });
  });

  /**
   * Test aria-invalid state
   */
  describe('Invalid state', () => {
    it('renders with aria-invalid:border-destructive class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('aria-invalid:border-destructive');
    });

    it('renders with aria-invalid:ring-destructive/20 class', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('aria-invalid:ring-destructive/20');
    });
  });

  /**
   * Test custom className merge
   */
  describe('Custom className', () => {
    it('allows custom className to be passed', () => {
      renderSelectTrigger({ className: 'custom-class' });
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('custom-class');
    });

    it('preserves default classes when custom className is added', () => {
      renderSelectTrigger({ className: 'custom-class' });
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('border-slate-200');
      expect(trigger).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test data-slot attribute
   */
  describe('Data attributes', () => {
    it('renders with data-slot="select-trigger" attribute', () => {
      renderSelectTrigger();
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
    });
  });
});

describe('SelectContent Component - Story DR.6', () => {
  /**
   * Note: SelectContent uses a portal and is harder to test directly.
   * These tests verify the component renders without errors.
   */
  describe('Render tests', () => {
    it('SelectContent can be rendered in Select context', () => {
      // This test verifies SelectContent doesn't throw
      expect(() => {
        render(
          <Select defaultOpen>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
        );
      }).not.toThrow();
    });
  });
});
