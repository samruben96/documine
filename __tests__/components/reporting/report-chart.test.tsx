/**
 * @vitest-environment happy-dom
 *
 * ReportChart Component Tests
 * Epic 23: Flexible AI Reports - Story 23.5
 *
 * Tests for the chart rendering component.
 * AC-23.5.1: AI-recommended chart types rendered correctly
 * AC-23.5.2: Recharts library with proper data binding
 * AC-23.5.3: Interactive with hover tooltips
 * AC-23.5.5: Responsive on mobile (ResponsiveContainer)
 * AC-23.5.6: Accessible labels and ARIA attributes
 * AC-23.5.7: Graceful fallback for empty/invalid configs
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportChart } from '@/components/reporting/report-chart';
import type { ChartConfig } from '@/types/reporting';

// Mock ResizeObserver which Recharts uses
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Sample chart configs for testing
const createBarChartConfig = (): ChartConfig => ({
  id: 'bar-chart-1',
  type: 'bar',
  title: 'Revenue by Region',
  description: 'Comparison of total revenue across regions',
  xKey: 'region',
  yKey: 'revenue',
  data: [
    { region: 'North', revenue: 5000 },
    { region: 'South', revenue: 3000 },
    { region: 'East', revenue: 4000 },
    { region: 'West', revenue: 3500 },
  ],
});

const createLineChartConfig = (): ChartConfig => ({
  id: 'line-chart-1',
  type: 'line',
  title: 'Revenue Over Time',
  description: 'Monthly revenue trend',
  xKey: 'month',
  yKey: 'revenue',
  data: [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 4500 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4800 },
  ],
});

const createPieChartConfig = (): ChartConfig => ({
  id: 'pie-chart-1',
  type: 'pie',
  title: 'Regional Distribution',
  description: 'Percentage breakdown by region',
  xKey: 'region',
  yKey: 'revenue',
  data: [
    { region: 'North', revenue: 5000 },
    { region: 'South', revenue: 3000 },
    { region: 'East', revenue: 4000 },
    { region: 'West', revenue: 3500 },
  ],
});

const createAreaChartConfig = (): ChartConfig => ({
  id: 'area-chart-1',
  type: 'area',
  title: 'Revenue Trend',
  description: 'Cumulative revenue over time',
  xKey: 'month',
  yKey: 'revenue',
  data: [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 4500 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4800 },
  ],
});

const createMultiSeriesConfig = (): ChartConfig => ({
  id: 'multi-series-1',
  type: 'bar',
  title: 'Revenue vs Cost',
  xKey: 'region',
  yKey: ['revenue', 'cost'],
  data: [
    { region: 'North', revenue: 5000, cost: 2000 },
    { region: 'South', revenue: 3000, cost: 1500 },
    { region: 'East', revenue: 4000, cost: 1800 },
  ],
});

describe('ReportChart Component', () => {
  describe('chart type rendering (AC-23.5.1)', () => {
    it('renders bar chart correctly', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} index={0} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
    });

    it('renders line chart correctly', () => {
      const config = createLineChartConfig();
      render(<ReportChart config={config} index={1} />);

      expect(screen.getByTestId('report-chart-1')).toBeInTheDocument();
      expect(screen.getByText('Revenue Over Time')).toBeInTheDocument();
    });

    it('renders pie chart correctly', () => {
      const config = createPieChartConfig();
      render(<ReportChart config={config} index={2} />);

      expect(screen.getByTestId('report-chart-2')).toBeInTheDocument();
      expect(screen.getByText('Regional Distribution')).toBeInTheDocument();
    });

    it('renders area chart correctly', () => {
      const config = createAreaChartConfig();
      render(<ReportChart config={config} index={3} />);

      expect(screen.getByTestId('report-chart-3')).toBeInTheDocument();
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });
  });

  describe('data binding (AC-23.5.2)', () => {
    it('renders with single series data', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });

    it('renders with multi-series data', () => {
      const config = createMultiSeriesConfig();
      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });

    it('displays chart description when provided', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      expect(
        screen.getByText('Comparison of total revenue across regions')
      ).toBeInTheDocument();
    });
  });

  describe('responsive container (AC-23.5.5)', () => {
    it('renders chart wrapper successfully', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      // Chart card renders
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });

    it('uses provided height prop', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} height={400} />);

      // Chart should render (height affects internal sizing)
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });
  });

  describe('accessibility (AC-23.5.6)', () => {
    it('has role="img" attribute', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      const chartCard = screen.getByTestId('report-chart-0');
      expect(chartCard).toHaveAttribute('role', 'img');
    });

    it('has aria-label describing chart content', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      const chartCard = screen.getByTestId('report-chart-0');
      expect(chartCard).toHaveAttribute('aria-label');
      const ariaLabel = chartCard.getAttribute('aria-label');
      expect(ariaLabel).toContain('bar chart');
      expect(ariaLabel).toContain('Revenue by Region');
    });

    it('aria-label includes yKey information', () => {
      const config = createMultiSeriesConfig();
      render(<ReportChart config={config} />);

      const chartCard = screen.getByTestId('report-chart-0');
      const ariaLabel = chartCard.getAttribute('aria-label');
      expect(ariaLabel).toContain('revenue');
      expect(ariaLabel).toContain('cost');
    });
  });

  describe('error handling and fallback (AC-23.5.7)', () => {
    it('shows error for empty data array', () => {
      const config: ChartConfig = {
        type: 'bar',
        xKey: 'region',
        yKey: 'revenue',
        title: 'Empty Chart',
        data: [],
      };

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });

    it('shows error for missing xKey', () => {
      const config = {
        type: 'bar',
        xKey: '',
        yKey: 'revenue',
        title: 'Invalid Chart',
        data: [{ revenue: 100 }],
      } as ChartConfig;

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      expect(screen.getByText(/Missing x-axis key/i)).toBeInTheDocument();
    });

    it('shows error for missing yKey', () => {
      const config = {
        type: 'bar',
        xKey: 'region',
        yKey: '',
        title: 'Invalid Chart',
        data: [{ region: 'North' }],
      } as ChartConfig;

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      expect(screen.getByText(/Missing y-axis key/i)).toBeInTheDocument();
    });

    it('shows error for invalid chart type', () => {
      const config = {
        type: 'invalid' as ChartConfig['type'],
        xKey: 'region',
        yKey: 'revenue',
        title: 'Invalid Type',
        data: [{ region: 'North', revenue: 100 }],
      };

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
    });

    it('logs error to console for invalid config', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config: ChartConfig = {
        type: 'bar',
        xKey: 'region',
        yKey: 'revenue',
        title: 'Empty Chart',
        data: [],
      };

      render(<ReportChart config={config} />);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles null data gracefully', () => {
      const config = {
        type: 'bar',
        xKey: 'region',
        yKey: 'revenue',
        title: 'Null Data Chart',
        data: null as unknown as unknown[],
      } as ChartConfig;

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
    });

    it('handles undefined config gracefully', () => {
      const config = undefined as unknown as ChartConfig;

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
    });
  });

  describe('chart title and description', () => {
    it('displays title in card header', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
    });

    it('displays description below title', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      expect(
        screen.getByText('Comparison of total revenue across regions')
      ).toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      const config = createBarChartConfig();
      delete config.description;

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
    });
  });

  describe('pie chart specific', () => {
    it('renders pie chart without errors', () => {
      const config = createPieChartConfig();
      render(<ReportChart config={config} />);

      // Chart card renders successfully
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Regional Distribution')).toBeInTheDocument();
    });

    it('handles pie chart with array yKey (uses first)', () => {
      const config: ChartConfig = {
        type: 'pie',
        xKey: 'region',
        yKey: ['revenue', 'cost'],
        title: 'Multi-key Pie',
        data: [
          { region: 'North', revenue: 5000, cost: 2000 },
          { region: 'South', revenue: 3000, cost: 1500 },
        ],
      };

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });
  });

  describe('line chart specific', () => {
    it('renders line chart without errors', () => {
      const config = createLineChartConfig();
      render(<ReportChart config={config} />);

      // Chart card renders successfully
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue Over Time')).toBeInTheDocument();
    });

    it('supports multi-line charts', () => {
      const config: ChartConfig = {
        type: 'line',
        xKey: 'month',
        yKey: ['revenue', 'cost'],
        title: 'Multi-line Chart',
        data: [
          { month: 'Jan', revenue: 4000, cost: 2000 },
          { month: 'Feb', revenue: 4500, cost: 2200 },
        ],
      };

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Multi-line Chart')).toBeInTheDocument();
    });
  });

  describe('area chart specific', () => {
    it('renders area chart without errors', () => {
      const config = createAreaChartConfig();
      render(<ReportChart config={config} />);

      // Chart card renders successfully
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('supports stacked area charts', () => {
      const config: ChartConfig = {
        type: 'area',
        xKey: 'month',
        yKey: ['revenue', 'cost'],
        title: 'Stacked Area',
        data: [
          { month: 'Jan', revenue: 4000, cost: 2000 },
          { month: 'Feb', revenue: 4500, cost: 2200 },
        ],
      };

      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });
  });

  describe('bar chart specific', () => {
    it('renders bar chart without errors', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      // Chart card renders successfully
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
    });

    it('supports grouped bar charts', () => {
      const config = createMultiSeriesConfig();
      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByText('Revenue vs Cost')).toBeInTheDocument();
    });
  });

  describe('index prop', () => {
    it('uses index for test ID', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} index={5} />);

      expect(screen.getByTestId('report-chart-5')).toBeInTheDocument();
    });

    it('defaults to 0 when index not provided', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} className="custom-class" />);

      const chartCard = screen.getByTestId('report-chart-0');
      expect(chartCard).toHaveClass('custom-class');
    });
  });

  describe('chart internals', () => {
    it('renders chart container for single-series', () => {
      const config = createBarChartConfig();
      render(<ReportChart config={config} />);

      // Chart wrapper renders
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });

    it('renders chart container for multi-series', () => {
      const config = createMultiSeriesConfig();
      render(<ReportChart config={config} />);

      // Chart wrapper renders with multi-series config
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });
  });
});
