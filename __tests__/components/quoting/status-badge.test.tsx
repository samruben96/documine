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

  /**
   * Variant Color Tests
   * Story Q2.4: Quote Session Status Management
   *
   * AC-Q2.4-1: Draft status with gray badge (status-default)
   * AC-Q2.4-2: In Progress status with amber badge (status-progress)
   * AC-Q2.4-3: Quotes Received status with blue badge (status-info)
   * AC-Q2.4-4: Complete status with green badge (status-success)
   */
  describe('variant colors', () => {
    it('AC-Q2.4-1: draft status has gray variant (status-default)', () => {
      render(<StatusBadge status="draft" />);

      const badge = screen.getByTestId('status-badge');
      // status-default applies: bg-slate-100 text-slate-600
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-600');
    });

    it('AC-Q2.4-2: in_progress status has amber variant (status-progress)', () => {
      render(<StatusBadge status="in_progress" />);

      const badge = screen.getByTestId('status-badge');
      // status-progress applies: bg-amber-100 text-amber-700
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('AC-Q2.4-3: quotes_received status has blue variant (status-info)', () => {
      render(<StatusBadge status="quotes_received" />);

      const badge = screen.getByTestId('status-badge');
      // status-info applies: bg-blue-100 text-blue-700
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('AC-Q2.4-4: complete status has green variant (status-success)', () => {
      render(<StatusBadge status="complete" />);

      const badge = screen.getByTestId('status-badge');
      // status-success applies: bg-green-100 text-green-700
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });
  });
});
