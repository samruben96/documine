/**
 * @vitest-environment happy-dom
 */
/**
 * Card Component Unit Tests
 * Story DR.4: Card & Border Consistency
 *
 * Tests the Card UI component for consistent styling patterns.
 * AC-DR.4.1: bg-white background
 * AC-DR.4.2: border border-slate-200
 * AC-DR.4.3: rounded-lg corners
 * AC-DR.4.4: hoverable prop adds hover effects
 * AC-DR.4.5: Consistent padding (tested via CardContent)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

describe('Card Component - Story DR.4', () => {
  /**
   * Test AC-DR.4.1: Cards have bg-white background
   */
  describe('AC-DR.4.1: Background color', () => {
    it('renders with bg-white class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
    });

    it('includes dark mode background class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('dark:bg-slate-900');
    });
  });

  /**
   * Test AC-DR.4.2: Cards have border border-slate-200
   */
  describe('AC-DR.4.2: Border styling', () => {
    it('renders with border class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border');
    });

    it('renders with border-slate-200 class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-slate-200');
    });

    it('includes dark mode border class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('dark:border-slate-700');
    });
  });

  /**
   * Test AC-DR.4.3: Cards have rounded-lg corners
   */
  describe('AC-DR.4.3: Border radius', () => {
    it('renders with rounded-lg class', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  /**
   * Test AC-DR.4.4: Clickable cards have hover effects via hoverable prop
   */
  describe('AC-DR.4.4: Hoverable prop', () => {
    it('does not have hover classes by default', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('hover:border-slate-300');
      expect(card).not.toHaveClass('hover:shadow-sm');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('has hover classes when hoverable={true}', () => {
      render(<Card data-testid="card" hoverable>Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:border-slate-300');
      expect(card).toHaveClass('hover:shadow-sm');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has transition class when hoverable', () => {
      render(<Card data-testid="card" hoverable>Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('transition-all');
    });

    it('includes dark mode hover border class when hoverable', () => {
      render(<Card data-testid="card" hoverable>Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('dark:hover:border-slate-600');
    });
  });

  /**
   * Test AC-DR.4.5: Card padding - tested via CardContent
   */
  describe('AC-DR.4.5: Padding', () => {
    it('CardContent has p-6 padding class', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">Content</CardContent>
        </Card>
      );
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('p-6');
    });

    it('CardHeader has p-6 padding class', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">Header</CardHeader>
        </Card>
      );
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('p-6');
    });

    it('CardFooter has p-6 padding class', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('p-6');
    });
  });

  /**
   * Test sub-components render correctly
   */
  describe('Card sub-components', () => {
    it('CardHeader renders with correct slot', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">Header</CardHeader>
        </Card>
      );
      const header = screen.getByTestId('card-header');
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('CardTitle renders with text styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title">Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass('font-semibold');
    });

    it('CardDescription renders with muted color', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="card-desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const desc = screen.getByTestId('card-desc');
      expect(desc).toHaveClass('text-muted-foreground');
    });

    it('CardContent renders with correct slot', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">Content</CardContent>
        </Card>
      );
      const content = screen.getByTestId('card-content');
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('CardFooter renders with correct slot', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });
  });

  /**
   * Test custom className merging
   */
  describe('Custom className support', () => {
    it('allows custom className to be merged', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      // Base classes should still be present
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('border-slate-200');
    });

    it('allows custom className on hoverable card', () => {
      render(
        <Card data-testid="card" hoverable className="custom-hover">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-hover');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  /**
   * Test text color classes
   */
  describe('Text color styling', () => {
    it('Card has appropriate text color classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('text-slate-900');
      expect(card).toHaveClass('dark:text-slate-100');
    });
  });
});
