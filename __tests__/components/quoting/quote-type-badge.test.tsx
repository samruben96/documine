/**
 * @vitest-environment happy-dom
 */
/**
 * QuoteTypeBadge Component Tests
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-2: Quote type badge displayed on session cards
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteTypeBadge } from '@/components/quoting/quote-type-badge';

describe('QuoteTypeBadge', () => {
  it('renders home type with correct label', () => {
    render(<QuoteTypeBadge type="home" />);

    const badge = screen.getByTestId('quote-type-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Home');
    expect(badge).toHaveAttribute('data-type', 'home');
  });

  it('renders auto type with correct label', () => {
    render(<QuoteTypeBadge type="auto" />);

    const badge = screen.getByTestId('quote-type-badge');
    expect(badge).toHaveTextContent('Auto');
    expect(badge).toHaveAttribute('data-type', 'auto');
  });

  it('renders bundle type with correct label', () => {
    render(<QuoteTypeBadge type="bundle" />);

    const badge = screen.getByTestId('quote-type-badge');
    expect(badge).toHaveTextContent('Bundle');
    expect(badge).toHaveAttribute('data-type', 'bundle');
  });

  it('renders icon by default', () => {
    render(<QuoteTypeBadge type="home" />);

    const badge = screen.getByTestId('quote-type-badge');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<QuoteTypeBadge type="home" showIcon={false} />);

    const badge = screen.getByTestId('quote-type-badge');
    const svg = badge.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<QuoteTypeBadge type="bundle" className="custom-class" />);

    const badge = screen.getByTestId('quote-type-badge');
    expect(badge).toHaveClass('custom-class');
  });
});
