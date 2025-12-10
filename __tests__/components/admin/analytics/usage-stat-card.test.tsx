/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for UsageStatCard Component
 * Story 20.3: Usage Analytics Dashboard
 *
 * Tests:
 * - Renders value and title correctly
 * - Shows loading skeleton when isLoading=true
 * - Shows positive/negative trend indicators
 * - Handles null changePercent gracefully
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageStatCard } from '@/components/admin/analytics/usage-stat-card';
import { MessageSquare } from 'lucide-react';

describe('UsageStatCard', () => {
  const defaultProps = {
    title: 'Total Conversations',
    value: 125,
    icon: <MessageSquare data-testid="icon" />,
  };

  it('renders value and title correctly', () => {
    render(<UsageStatCard {...defaultProps} />);

    expect(screen.getByText('Total Conversations')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('formats large numbers with K/M suffix', () => {
    render(<UsageStatCard {...defaultProps} value={1234567} />);

    // Should be formatted as "1.2M" (millions)
    expect(screen.getByText('1.2M')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading=true', () => {
    render(<UsageStatCard {...defaultProps} isLoading testId="stat-card" />);

    expect(screen.getByTestId('stat-card-loading')).toBeInTheDocument();
    // Should not show the value
    expect(screen.queryByText('125')).not.toBeInTheDocument();
  });

  it('shows positive trend indicator with green color', () => {
    render(
      <UsageStatCard
        {...defaultProps}
        changePercent={15.5}
        changeLabel="vs last period"
        testId="stat-card"
      />
    );

    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last period')).toBeInTheDocument();
    // Check for green styling (TrendingUp icon)
    expect(screen.getByTestId('stat-card').querySelector('[class*="text-green"]')).toBeInTheDocument();
  });

  it('shows negative trend indicator with red color', () => {
    render(
      <UsageStatCard
        {...defaultProps}
        changePercent={-8.2}
        changeLabel="vs last period"
        testId="stat-card"
      />
    );

    expect(screen.getByText('-8.2%')).toBeInTheDocument();
    // Check for red styling (TrendingDown icon)
    expect(screen.getByTestId('stat-card').querySelector('[class*="text-red"]')).toBeInTheDocument();
  });

  it('shows zero trend as neutral with "No change" text', () => {
    render(
      <UsageStatCard
        {...defaultProps}
        changePercent={0}
        changeLabel="vs last period"
        testId="stat-card"
      />
    );

    expect(screen.getByText('No change')).toBeInTheDocument();
    expect(screen.getByText('vs last period')).toBeInTheDocument();
  });

  it('handles undefined changePercent gracefully - no trend section shown', () => {
    render(<UsageStatCard {...defaultProps} testId="stat-card" />);

    // Should not show any trend indicator
    expect(screen.queryByTestId('stat-card-change')).not.toBeInTheDocument();
    // But should still show the value
    expect(screen.getByText('125')).toBeInTheDocument();
  });
});
