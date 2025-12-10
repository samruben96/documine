/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for UsageTrendChart Component
 * Story 20.3: Usage Analytics Dashboard
 *
 * Tests:
 * - Renders chart with data correctly
 * - Shows loading skeleton when isLoading=true
 * - Shows empty state when no data
 * - Displays title and description
 * - Custom tooltip renders with expected content
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageTrendChart } from '@/components/ai-buddy/admin/analytics/usage-trend-chart';
import type { UsageTrend } from '@/types/ai-buddy';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: { content: React.ReactNode }) => (
    <div data-testid="tooltip">{content}</div>
  ),
  Legend: () => <div data-testid="legend" />,
}));

describe('UsageTrendChart', () => {
  const mockData: UsageTrend[] = [
    { date: '2024-01-01', activeUsers: 5, conversations: 12, messages: 45 },
    { date: '2024-01-02', activeUsers: 8, conversations: 20, messages: 78 },
    { date: '2024-01-03', activeUsers: 6, conversations: 15, messages: 55 },
    { date: '2024-01-04', activeUsers: 10, conversations: 25, messages: 92 },
    { date: '2024-01-05', activeUsers: 7, conversations: 18, messages: 63 },
  ];

  it('renders chart with data correctly', () => {
    render(<UsageTrendChart data={mockData} />);

    // Chart should be rendered (not loading or empty state)
    expect(screen.getByTestId('usage-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();

    // Lines should be present
    expect(screen.getByTestId('line-activeUsers')).toBeInTheDocument();
    expect(screen.getByTestId('line-conversations')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <UsageTrendChart
        data={mockData}
        title="Custom Title"
        description="Custom description text"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('renders with default title and description', () => {
    render(<UsageTrendChart data={mockData} />);

    expect(screen.getByText('Usage Trends')).toBeInTheDocument();
    expect(
      screen.getByText('Daily active users and conversations over time')
    ).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading=true', () => {
    render(<UsageTrendChart data={[]} isLoading testId="trend-chart" />);

    expect(screen.getByTestId('trend-chart-loading')).toBeInTheDocument();
    // Should not render the actual chart
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('shows empty state when data is empty array', () => {
    render(<UsageTrendChart data={[]} testId="trend-chart" />);

    expect(screen.getByTestId('trend-chart-empty')).toBeInTheDocument();
    expect(
      screen.getByText('No data available for the selected period')
    ).toBeInTheDocument();
    // Should not render the actual chart
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('shows empty state when data is undefined', () => {
    // @ts-expect-error - testing undefined data
    render(<UsageTrendChart data={undefined} testId="trend-chart" />);

    expect(screen.getByTestId('trend-chart-empty')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<UsageTrendChart data={mockData} className="custom-class" />);

    expect(screen.getByTestId('usage-trend-chart')).toHaveClass('custom-class');
  });

  it('uses custom testId', () => {
    render(<UsageTrendChart data={mockData} testId="custom-chart" />);

    expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
  });

  it('renders chart axes and grid', () => {
    render(<UsageTrendChart data={mockData} />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('renders chart legend', () => {
    render(<UsageTrendChart data={mockData} />);

    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('renders tooltip component', () => {
    render(<UsageTrendChart data={mockData} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('line names are correctly set', () => {
    render(<UsageTrendChart data={mockData} />);

    const activeUsersLine = screen.getByTestId('line-activeUsers');
    const conversationsLine = screen.getByTestId('line-conversations');

    expect(activeUsersLine).toHaveAttribute('data-name', 'Active Users');
    expect(conversationsLine).toHaveAttribute('data-name', 'Conversations');
  });
});
