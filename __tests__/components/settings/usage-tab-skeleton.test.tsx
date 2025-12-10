/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageTabSkeleton } from '@/components/settings/usage-tab-skeleton';

/**
 * Story 22.1: AC-22.1.2, AC-22.1.4
 * Tests for UsageTabSkeleton component
 */
describe('UsageTabSkeleton', () => {
  it('renders the skeleton container', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Main container should have space-y-6 and mt-6
    const mainContainer = container.querySelector('.space-y-6.mt-6');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders 4 stat card skeletons in grid', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Grid should have 2x2 = 4 cards
    const grid = container.querySelector('.grid.gap-4');
    expect(grid).toBeInTheDocument();

    // Each card has CardHeader and CardContent
    const cards = grid?.children;
    expect(cards?.length).toBe(4);
  });

  it('renders skeleton elements with animate-pulse', () => {
    const { container } = render(<UsageTabSkeleton />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(10);

    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  it('renders icon placeholders in card headers', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Icon skeletons: h-5 w-5
    const iconSkeletons = container.querySelectorAll('.h-5.w-5');
    expect(iconSkeletons.length).toBe(4); // One per card
  });

  it('renders title and description skeletons', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Should have title skeletons (h-5 various widths)
    const titleSkeletons = container.querySelectorAll('.h-5');
    expect(titleSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders large value skeletons for stat cards', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Two cards should have large value skeletons (h-9)
    const largeValueSkeletons = container.querySelectorAll('.h-9');
    expect(largeValueSkeletons.length).toBe(2);
  });

  it('renders responsive grid classes', () => {
    const { container } = render(<UsageTabSkeleton />);

    // Grid should have md:grid-cols-2
    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });
});
