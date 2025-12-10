/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandingTabSkeleton } from '@/components/settings/branding-tab-skeleton';

/**
 * Story 22.1: AC-22.1.1, AC-22.1.4
 * Tests for BrandingTabSkeleton component
 */
describe('BrandingTabSkeleton', () => {
  it('renders the skeleton card', () => {
    render(<BrandingTabSkeleton />);

    // Check for Agency Branding title
    expect(screen.getByText('Agency Branding')).toBeInTheDocument();
  });

  it('renders skeleton elements with animate-pulse', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // All skeleton elements should have animate-pulse class
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(5);

    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  it('renders logo placeholder skeleton', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // Logo skeleton: h-24 w-24 rounded-lg
    const logoSkeleton = container.querySelector('.h-24.w-24');
    expect(logoSkeleton).toBeInTheDocument();
  });

  it('renders color picker placeholders', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // Should have multiple h-10 w-full skeletons for inputs
    const inputSkeletons = container.querySelectorAll('.h-10.w-full');
    expect(inputSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders in a Card component', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // Card should have mt-6 class
    const card = container.querySelector('.mt-6');
    expect(card).toBeInTheDocument();
  });

  it('renders contact information section placeholders', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // Should have address textarea placeholder (h-20)
    const textareaSkeleton = container.querySelector('.h-20');
    expect(textareaSkeleton).toBeInTheDocument();
  });

  it('renders save button placeholder', () => {
    const { container } = render(<BrandingTabSkeleton />);

    // Button skeleton: h-10 w-28
    const buttonSkeleton = container.querySelector('.h-10.w-28');
    expect(buttonSkeleton).toBeInTheDocument();
  });
});
