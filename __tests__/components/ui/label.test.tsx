/**
 * @vitest-environment happy-dom
 */
/**
 * Label Component Unit Tests
 * Story DR.6: Form Input Refinement
 *
 * Tests the Label UI component for consistent styling patterns.
 * AC-DR.6.4: text-sm font-medium text-slate-700 mb-1
 * AC-DR.6.5: Required field indicator with text-red-500 asterisk
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label, RequiredIndicator } from '@/components/ui/label';

describe('Label Component - Story DR.6', () => {
  /**
   * Test AC-DR.6.4: Label styling
   */
  describe('AC-DR.6.4: Label base styling', () => {
    it('renders with text-sm class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('text-sm');
    });

    it('renders with font-medium class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('font-medium');
    });

    it('renders with text-slate-700 class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('text-slate-700');
    });

    it('renders with leading-none class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('leading-none');
    });

    it('renders with select-none class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('select-none');
    });
  });

  /**
   * Test AC-DR.6.5: Required field indicator
   */
  describe('AC-DR.6.5: Required prop', () => {
    it('does not render asterisk when required is false', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label.textContent).toBe('Name');
    });

    it('does not render asterisk when required is not specified', () => {
      render(<Label data-testid="label">Name</Label>);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders asterisk when required is true', () => {
      render(<Label data-testid="label" required>Name</Label>);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders asterisk with text-red-500 class', () => {
      render(<Label data-testid="label" required>Name</Label>);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('renders asterisk with aria-hidden for accessibility', () => {
      render(<Label data-testid="label" required>Name</Label>);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    });
  });

  /**
   * Test dark mode variants
   */
  describe('Dark mode variants', () => {
    it('renders with dark:text-slate-300 class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('dark:text-slate-300');
    });
  });

  /**
   * Test disabled state styling
   */
  describe('Disabled state', () => {
    it('renders with group-data-[disabled=true]:opacity-50 class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50');
    });

    it('renders with peer-disabled:opacity-50 class', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });
  });

  /**
   * Test custom className merge
   */
  describe('Custom className', () => {
    it('allows custom className to be passed', () => {
      render(<Label data-testid="label" className="custom-class">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('custom-class');
    });

    it('preserves default classes when custom className is added', () => {
      render(<Label data-testid="label" className="custom-class">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('text-slate-700');
      expect(label).toHaveClass('font-medium');
    });

    it('allows mb-1 to be added via className', () => {
      render(<Label data-testid="label" className="mb-1">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('mb-1');
    });
  });

  /**
   * Test data-slot attribute
   */
  describe('Data attributes', () => {
    it('renders with data-slot="label" attribute', () => {
      render(<Label data-testid="label">Name</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveAttribute('data-slot', 'label');
    });
  });

  /**
   * Test children rendering
   */
  describe('Children rendering', () => {
    it('renders children text', () => {
      render(<Label data-testid="label">Full Name</Label>);
      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('renders children with required indicator together', () => {
      render(<Label data-testid="label" required>Full Name</Label>);
      const label = screen.getByTestId('label');
      expect(label.textContent).toContain('Full Name');
      expect(label.textContent).toContain('*');
    });
  });
});

describe('RequiredIndicator Component - Story DR.6', () => {
  /**
   * Test AC-DR.6.5: Standalone required indicator
   */
  describe('AC-DR.6.5: RequiredIndicator styling', () => {
    it('renders an asterisk', () => {
      render(<RequiredIndicator />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with text-red-500 class', () => {
      render(<RequiredIndicator />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('renders with ml-1 class for spacing', () => {
      render(<RequiredIndicator />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('ml-1');
    });

    it('renders with aria-hidden for accessibility', () => {
      render(<RequiredIndicator />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
