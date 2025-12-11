/**
 * @vitest-environment happy-dom
 */
/**
 * Button Component Unit Tests
 * Story DR.5: Button Style Standardization
 *
 * Tests the Button UI component for consistent styling patterns.
 * AC-DR.5.1: Primary buttons: bg-primary hover:bg-primary/90 text-white rounded-lg
 * AC-DR.5.2: Secondary buttons: border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg
 * AC-DR.5.3: All buttons use px-4 py-2 text-sm font-medium
 * AC-DR.5.4: Icon buttons use p-2 rounded-lg (or rounded-full for circular)
 * AC-DR.5.5: All buttons include transition-colors for smooth hover
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button Component - Story DR.5', () => {
  /**
   * Test AC-DR.5.1: Primary buttons
   */
  describe('AC-DR.5.1: Primary (default) variant', () => {
    it('renders with bg-primary class', () => {
      render(<Button data-testid="button">Primary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('renders with text-white class', () => {
      render(<Button data-testid="button">Primary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-white');
    });

    it('renders with hover:bg-primary/90 class', () => {
      render(<Button data-testid="button">Primary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-primary/90');
    });

    it('renders with rounded-lg class', () => {
      render(<Button data-testid="button">Primary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test AC-DR.5.2: Secondary buttons
   */
  describe('AC-DR.5.2: Secondary variant', () => {
    it('renders with border class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('border');
    });

    it('renders with border-slate-200 class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('border-slate-200');
    });

    it('renders with bg-white class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-white');
    });

    it('renders with text-slate-700 class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-slate-700');
    });

    it('renders with hover:bg-slate-50 class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-slate-50');
    });

    it('renders with rounded-lg class', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-lg');
    });

    it('includes dark mode classes', () => {
      render(<Button data-testid="button" variant="secondary">Secondary</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('dark:border-slate-700');
      expect(button).toHaveClass('dark:bg-slate-900');
      expect(button).toHaveClass('dark:text-slate-300');
      expect(button).toHaveClass('dark:hover:bg-slate-800');
    });
  });

  /**
   * Test AC-DR.5.2: Outline variant (matches secondary pattern)
   */
  describe('AC-DR.5.2: Outline variant (same as secondary)', () => {
    it('renders with border-slate-200 class', () => {
      render(<Button data-testid="button" variant="outline">Outline</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('border-slate-200');
    });

    it('renders with text-slate-700 class', () => {
      render(<Button data-testid="button" variant="outline">Outline</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-slate-700');
    });

    it('renders with hover:bg-slate-50 class', () => {
      render(<Button data-testid="button" variant="outline">Outline</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-slate-50');
    });

    it('includes dark mode classes', () => {
      render(<Button data-testid="button" variant="outline">Outline</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('dark:border-slate-700');
      expect(button).toHaveClass('dark:hover:bg-slate-800');
    });
  });

  /**
   * Test AC-DR.5.3: Button sizing
   */
  describe('AC-DR.5.3: Default size', () => {
    it('renders with h-9 height', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-9');
    });

    it('renders with px-4 horizontal padding', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-4');
    });

    it('renders with py-2 vertical padding', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('py-2');
    });

    it('renders with text-sm class', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-sm');
    });

    it('renders with font-medium class', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('font-medium');
    });
  });

  /**
   * Test AC-DR.5.4: Icon button sizes
   */
  describe('AC-DR.5.4: Icon button sizes', () => {
    it('icon size renders with size-9 class', () => {
      render(<Button data-testid="button" size="icon">Icon</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('size-9');
    });

    it('icon-sm size renders with size-8 class', () => {
      render(<Button data-testid="button" size="icon-sm">Icon</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('size-8');
    });

    it('icon-lg size renders with size-10 class', () => {
      render(<Button data-testid="button" size="icon-lg">Icon</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('size-10');
    });

    it('icon buttons have rounded-lg by default', () => {
      render(<Button data-testid="button" size="icon">Icon</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-lg');
    });

    it('icon buttons can use rounded-full via className override', () => {
      render(<Button data-testid="button" size="icon" className="rounded-full">Icon</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-full');
    });
  });

  /**
   * Test AC-DR.5.5: Transition
   */
  describe('AC-DR.5.5: Transition', () => {
    it('default variant includes transition-colors class', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('secondary variant includes transition-colors class', () => {
      render(<Button data-testid="button" variant="secondary">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('outline variant includes transition-colors class', () => {
      render(<Button data-testid="button" variant="outline">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('ghost variant includes transition-colors class', () => {
      render(<Button data-testid="button" variant="ghost">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('destructive variant includes transition-colors class', () => {
      render(<Button data-testid="button" variant="destructive">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('transition-colors');
    });
  });

  /**
   * Test Ghost variant styling
   */
  describe('Ghost variant styling', () => {
    it('renders with hover:bg-slate-100 class', () => {
      render(<Button data-testid="button" variant="ghost">Ghost</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-slate-100');
    });

    it('renders with hover:text-slate-900 class', () => {
      render(<Button data-testid="button" variant="ghost">Ghost</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:text-slate-900');
    });

    it('includes dark mode classes', () => {
      render(<Button data-testid="button" variant="ghost">Ghost</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('dark:hover:bg-slate-800');
      expect(button).toHaveClass('dark:hover:text-slate-100');
    });
  });

  /**
   * Test Destructive variant styling
   */
  describe('Destructive variant styling', () => {
    it('renders with bg-destructive class', () => {
      render(<Button data-testid="button" variant="destructive">Delete</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('renders with text-white class', () => {
      render(<Button data-testid="button" variant="destructive">Delete</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-white');
    });

    it('renders with hover:bg-destructive/90 class', () => {
      render(<Button data-testid="button" variant="destructive">Delete</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-destructive/90');
    });
  });

  /**
   * Test Link variant styling
   */
  describe('Link variant styling', () => {
    it('renders with text-primary class', () => {
      render(<Button data-testid="button" variant="link">Link</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-primary');
    });

    it('renders with hover:underline class', () => {
      render(<Button data-testid="button" variant="link">Link</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:underline');
    });
  });

  /**
   * Test size variants
   */
  describe('Size variants', () => {
    it('sm size renders with h-8 class', () => {
      render(<Button data-testid="button" size="sm">Small</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-8');
    });

    it('sm size renders with px-3 class', () => {
      render(<Button data-testid="button" size="sm">Small</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-3');
    });

    it('lg size renders with h-10 class', () => {
      render(<Button data-testid="button" size="lg">Large</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-10');
    });

    it('lg size renders with px-6 class', () => {
      render(<Button data-testid="button" size="lg">Large</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-6');
    });

    it('size variants inherit rounded-lg from base', () => {
      render(<Button data-testid="button" size="sm">Small</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test disabled state
   */
  describe('Disabled state', () => {
    it('has disabled:opacity-50 class', () => {
      render(<Button data-testid="button" disabled>Disabled</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('has disabled:pointer-events-none class', () => {
      render(<Button data-testid="button" disabled>Disabled</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  /**
   * Test buttonVariants function
   */
  describe('buttonVariants function', () => {
    it('returns correct classes for default variant', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-white');
      expect(classes).toContain('rounded-lg');
    });

    it('returns correct classes for secondary variant', () => {
      const classes = buttonVariants({ variant: 'secondary' });
      expect(classes).toContain('border-slate-200');
      expect(classes).toContain('text-slate-700');
    });

    it('returns correct classes for ghost variant', () => {
      const classes = buttonVariants({ variant: 'ghost' });
      expect(classes).toContain('hover:bg-slate-100');
    });

    it('returns correct classes for icon size', () => {
      const classes = buttonVariants({ size: 'icon' });
      expect(classes).toContain('size-9');
    });
  });

  /**
   * Test custom className merging
   */
  describe('Custom className support', () => {
    it('allows custom className to be merged', () => {
      render(
        <Button data-testid="button" className="custom-class">
          Custom
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('custom-class');
      // Base classes should still be present
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('transition-colors');
    });

    it('allows className to override base classes', () => {
      render(
        <Button data-testid="button" className="rounded-full">
          Circular
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('rounded-full');
    });
  });

  /**
   * Test data-slot attribute
   */
  describe('Data attributes', () => {
    it('renders with data-slot="button" attribute', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  /**
   * Test asChild prop
   */
  describe('asChild prop', () => {
    it('renders as button by default', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
