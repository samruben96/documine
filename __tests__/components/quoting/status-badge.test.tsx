/**
 * @vitest-environment happy-dom
 */
/**
 * StatusBadge Component Tests
 * Story Q2.1: Quote Sessions List Page
 *
 * Tests for:
 * - AC-Q2.4-1: Draft status with gray variant
 * - AC-Q2.4-2: In Progress status with amber variant
 * - AC-Q2.4-3: Quotes Received status with blue variant
 * - AC-Q2.4-4: Complete status with green variant
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/quoting/status-badge';

describe('StatusBadge', () => {
  it('renders draft status with correct label', () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Draft');
    expect(badge).toHaveAttribute('data-status', 'draft');
  });

  it('renders in_progress status with correct label', () => {
    render(<StatusBadge status="in_progress" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('In Progress');
    expect(badge).toHaveAttribute('data-status', 'in_progress');
  });

  it('renders quotes_received status with correct label', () => {
    render(<StatusBadge status="quotes_received" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Quotes Received');
    expect(badge).toHaveAttribute('data-status', 'quotes_received');
  });

  it('renders complete status with correct label', () => {
    render(<StatusBadge status="complete" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Complete');
    expect(badge).toHaveAttribute('data-status', 'complete');
  });

  it('renders icon by default', () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByTestId('status-badge');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<StatusBadge status="draft" showIcon={false} />);

    const badge = screen.getByTestId('status-badge');
    const svg = badge.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusBadge status="draft" className="custom-class" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('custom-class');
  });
});
