/**
 * @vitest-environment happy-dom
 *
 * Badge Component Tests
 * Story DR.7: Badge & Status Indicator System
 *
 * Tests the Badge component and its variants including the new
 * status variants (DR.7.1-DR.7.7) and StatusBadge convenience component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge, badgeVariants } from '@/components/ui/badge';

describe('Badge', () => {
  describe('base styling (AC: DR.7.1)', () => {
    it('has rounded border radius (not rounded-full)', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('rounded');
      expect(badge).not.toHaveClass('rounded-full');
    });

    it('has correct base padding px-2 py-0.5', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
    });

    it('has text-xs font-medium', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-medium');
    });

    it('has data-slot="badge"', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });
  });

  describe('status-default variant (AC: DR.7.2)', () => {
    it('applies slate background and text colors', () => {
      render(<Badge variant="status-default" data-testid="badge">Draft</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-600');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-default" data-testid="badge">Draft</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-slate-800');
      expect(badge).toHaveClass('dark:text-slate-400');
    });
  });

  describe('status-progress variant (AC: DR.7.3)', () => {
    it('applies amber background and text colors', () => {
      render(<Badge variant="status-progress" data-testid="badge">In Progress</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-progress" data-testid="badge">In Progress</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-amber-900/30');
      expect(badge).toHaveClass('dark:text-amber-400');
    });
  });

  describe('status-success variant (AC: DR.7.4)', () => {
    it('applies green background and text colors', () => {
      render(<Badge variant="status-success" data-testid="badge">Complete</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-success" data-testid="badge">Complete</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-green-900/30');
      expect(badge).toHaveClass('dark:text-green-400');
    });
  });

  describe('status-info variant (AC: DR.7.5)', () => {
    it('applies blue background and text colors', () => {
      render(<Badge variant="status-info" data-testid="badge">Quote</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-info" data-testid="badge">Quote</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-blue-900/30');
      expect(badge).toHaveClass('dark:text-blue-400');
    });
  });

  describe('status-special variant (AC: DR.7.6)', () => {
    it('applies purple background and text colors', () => {
      render(<Badge variant="status-special" data-testid="badge">Bundle</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-700');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-special" data-testid="badge">Bundle</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-purple-900/30');
      expect(badge).toHaveClass('dark:text-purple-400');
    });
  });

  describe('status-error variant (AC: DR.7.7)', () => {
    it('applies red background and text colors', () => {
      render(<Badge variant="status-error" data-testid="badge">Failed</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });

    it('includes dark mode classes', () => {
      render(<Badge variant="status-error" data-testid="badge">Failed</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-red-900/30');
      expect(badge).toHaveClass('dark:text-red-400');
    });
  });

  describe('existing variants preserved', () => {
    it('default variant still works', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-primary');
    });

    it('secondary variant still works', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('destructive variant still works', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-destructive');
    });

    it('outline variant still works', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-foreground');
    });
  });

  describe('custom className', () => {
    it('merges custom className with variant classes', () => {
      render(<Badge variant="status-success" className="custom-class" data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('asChild prop', () => {
    it('renders as span by default', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge.tagName.toLowerCase()).toBe('span');
    });
  });
});

describe('StatusBadge', () => {
  describe('status prop mapping', () => {
    it('maps "draft" to status-default variant', () => {
      render(<StatusBadge status="draft" data-testid="badge">Draft</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-600');
    });

    it('maps "progress" to status-progress variant', () => {
      render(<StatusBadge status="progress" data-testid="badge">In Progress</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('maps "success" to status-success variant', () => {
      render(<StatusBadge status="success" data-testid="badge">Complete</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('maps "info" to status-info variant', () => {
      render(<StatusBadge status="info" data-testid="badge">Info</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('maps "special" to status-special variant', () => {
      render(<StatusBadge status="special" data-testid="badge">Special</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-700');
    });

    it('maps "error" to status-error variant', () => {
      render(<StatusBadge status="error" data-testid="badge">Error</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });
  });

  describe('data-status attribute', () => {
    it('sets data-status attribute to status value', () => {
      render(<StatusBadge status="success" data-testid="badge">Complete</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-status', 'success');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(<StatusBadge status="success" className="custom-class" data-testid="badge">Test</StatusBadge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('badgeVariants', () => {
  it('generates correct class string for status variants', () => {
    const statusDefaultClasses = badgeVariants({ variant: 'status-default' });
    expect(statusDefaultClasses).toContain('bg-slate-100');
    expect(statusDefaultClasses).toContain('text-slate-600');

    const statusProgressClasses = badgeVariants({ variant: 'status-progress' });
    expect(statusProgressClasses).toContain('bg-amber-100');
    expect(statusProgressClasses).toContain('text-amber-700');

    const statusSuccessClasses = badgeVariants({ variant: 'status-success' });
    expect(statusSuccessClasses).toContain('bg-green-100');
    expect(statusSuccessClasses).toContain('text-green-700');

    const statusInfoClasses = badgeVariants({ variant: 'status-info' });
    expect(statusInfoClasses).toContain('bg-blue-100');
    expect(statusInfoClasses).toContain('text-blue-700');

    const statusSpecialClasses = badgeVariants({ variant: 'status-special' });
    expect(statusSpecialClasses).toContain('bg-purple-100');
    expect(statusSpecialClasses).toContain('text-purple-700');

    const statusErrorClasses = badgeVariants({ variant: 'status-error' });
    expect(statusErrorClasses).toContain('bg-red-100');
    expect(statusErrorClasses).toContain('text-red-700');
  });
});
