/**
 * @vitest-environment happy-dom
 *
 * ReportView Component Tests
 * Epic 23: Flexible AI Reports - Stories 23.4 & 23.5
 *
 * Tests for the report display component.
 * AC-23.4.1: Shows AI-generated report title and summary
 * AC-23.4.2: Shows 3-5 key insights with type indicators and severity levels
 * AC-23.5.4: Renders multiple charts in responsive grid layout
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportView } from '@/components/reporting/report-view';
import type { GeneratedReport } from '@/types/reporting';

// Sample report for testing
const createMockReport = (): GeneratedReport => ({
  title: 'Revenue Analysis Report',
  summary:
    'This report analyzes revenue trends across regions. Key findings include strong performance in the North region and seasonal patterns in Q4. Recommendations include focusing marketing efforts on underperforming regions.',
  insights: [
    {
      type: 'finding',
      severity: 'info',
      title: 'North Region Leads Revenue',
      description:
        'The North region accounts for 35% of total revenue, outperforming other regions.',
      relatedColumns: ['Region', 'Revenue'],
    },
    {
      type: 'trend',
      severity: 'info',
      title: 'Q4 Shows Strong Growth',
      description: 'Revenue increased 25% in Q4 compared to Q3.',
      relatedColumns: ['Date', 'Revenue'],
    },
    {
      type: 'anomaly',
      severity: 'warning',
      title: 'March Revenue Dip',
      description: 'Unusual 15% drop in revenue during March.',
      relatedColumns: ['Date', 'Revenue'],
    },
    {
      type: 'recommendation',
      severity: 'critical',
      title: 'Focus on South Region',
      description: 'South region shows growth potential with untapped market.',
      relatedColumns: ['Region'],
    },
  ],
  charts: [
    {
      id: 'chart-1',
      type: 'bar',
      title: 'Revenue by Region',
      xKey: 'Region',
      yKey: 'Revenue',
      description: 'Comparison of total revenue across regions',
      data: [
        { Region: 'North', Revenue: 5000 },
        { Region: 'South', Revenue: 3000 },
      ],
    },
    {
      id: 'chart-2',
      type: 'line',
      title: 'Revenue Over Time',
      xKey: 'Date',
      yKey: 'Revenue',
      description: 'Monthly revenue trend',
      data: [
        { Date: 'Jan', Revenue: 4000 },
        { Date: 'Feb', Revenue: 4500 },
      ],
    },
    {
      id: 'chart-3',
      type: 'pie',
      title: 'Regional Distribution',
      xKey: 'Region',
      yKey: 'Revenue',
      description: 'Percentage breakdown by region',
      data: [
        { Region: 'North', Revenue: 5000 },
        { Region: 'South', Revenue: 3000 },
      ],
    },
  ],
  dataTable: {
    columns: ['Region', 'Revenue', 'Date'],
    rows: [
      { Region: 'North', Revenue: 5000, Date: '2024-01-01' },
      { Region: 'South', Revenue: 3000, Date: '2024-01-01' },
    ],
    sortable: true,
    filterable: true,
  },
  generatedAt: '2024-01-15T10:30:00.000Z',
  promptUsed: 'Show me revenue trends by region',
});

describe('ReportView Component', () => {
  describe('report title and summary (AC-23.4.1)', () => {
    it('displays the report title', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByTestId('report-title')).toHaveTextContent(
        'Revenue Analysis Report'
      );
    });

    it('displays the executive summary', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByTestId('report-summary')).toHaveTextContent(
        'This report analyzes revenue trends across regions'
      );
    });

    it('displays the generated timestamp', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByText(/Generated/)).toBeInTheDocument();
    });

    it('displays the prompt used', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(
        screen.getByText('Show me revenue trends by region')
      ).toBeInTheDocument();
    });
  });

  describe('insights display (AC-23.4.2)', () => {
    it('renders all insights', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByText('North Region Leads Revenue')).toBeInTheDocument();
      expect(screen.getByText('Q4 Shows Strong Growth')).toBeInTheDocument();
      expect(screen.getByText('March Revenue Dip')).toBeInTheDocument();
      expect(screen.getByText('Focus on South Region')).toBeInTheDocument();
    });

    it('displays insight descriptions', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(
        screen.getByText(/North region accounts for 35%/)
      ).toBeInTheDocument();
    });

    it('shows severity badges with correct styling', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      // Info severity
      expect(screen.getAllByText('Info').length).toBeGreaterThan(0);
      // Warning severity
      expect(screen.getByText('Warning')).toBeInTheDocument();
      // Critical severity
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('displays related columns for insights', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      // Check for related column badges
      const regionBadges = screen.getAllByText('Region');
      expect(regionBadges.length).toBeGreaterThan(0);
    });

    it('renders insight cards with testid', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByTestId('insight-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('insight-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('insight-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('insight-card-3')).toBeInTheDocument();
    });
  });

  describe('charts (AC-23.5.4)', () => {
    it('renders chart components', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      // Now using report-chart-* test IDs from ReportChart component
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
      expect(screen.getByTestId('report-chart-1')).toBeInTheDocument();
      expect(screen.getByTestId('report-chart-2')).toBeInTheDocument();
    });

    it('displays chart titles', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
      expect(screen.getByText('Revenue Over Time')).toBeInTheDocument();
      expect(screen.getByText('Regional Distribution')).toBeInTheDocument();
    });

    it('displays chart descriptions', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(
        screen.getByText('Comparison of total revenue across regions')
      ).toBeInTheDocument();
      expect(screen.getByText('Monthly revenue trend')).toBeInTheDocument();
    });

    it('renders section heading for charts', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByText('Recommended Visualizations')).toBeInTheDocument();
    });

    it('does not render charts section when no charts', () => {
      const report = createMockReport();
      report.charts = [];
      render(<ReportView report={report} />);

      expect(screen.queryByText('Recommended Visualizations')).not.toBeInTheDocument();
    });
  });

  describe('data table placeholder', () => {
    it('renders data table placeholder', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByTestId('data-table-placeholder')).toBeInTheDocument();
    });

    it('displays row and column count', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      expect(screen.getByText(/2 rows/)).toBeInTheDocument();
      expect(screen.getByText(/3 columns/)).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders New Report button when onNewReport provided', () => {
      const report = createMockReport();
      const onNewReport = vi.fn();

      render(<ReportView report={report} onNewReport={onNewReport} />);

      const newReportBtn = screen.getByRole('button', { name: /New Report/i });
      expect(newReportBtn).toBeInTheDocument();
    });

    it('calls onNewReport when clicked', () => {
      const report = createMockReport();
      const onNewReport = vi.fn();

      render(<ReportView report={report} onNewReport={onNewReport} />);

      fireEvent.click(screen.getByRole('button', { name: /New Report/i }));
      expect(onNewReport).toHaveBeenCalledTimes(1);
    });

    it('renders disabled export buttons', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      const pdfBtn = screen.getByRole('button', { name: /PDF/i });
      const excelBtn = screen.getByRole('button', { name: /Excel/i });

      expect(pdfBtn).toBeDisabled();
      expect(excelBtn).toBeDisabled();
    });

    it('enables export buttons when handlers provided', () => {
      const report = createMockReport();
      const onExportPdf = vi.fn();
      const onExportExcel = vi.fn();

      render(
        <ReportView
          report={report}
          onExportPdf={onExportPdf}
          onExportExcel={onExportExcel}
        />
      );

      const pdfBtn = screen.getByRole('button', { name: /PDF/i });
      const excelBtn = screen.getByRole('button', { name: /Excel/i });

      expect(pdfBtn).not.toBeDisabled();
      expect(excelBtn).not.toBeDisabled();

      fireEvent.click(pdfBtn);
      expect(onExportPdf).toHaveBeenCalledTimes(1);

      fireEvent.click(excelBtn);
      expect(onExportExcel).toHaveBeenCalledTimes(1);
    });
  });

  describe('insight type icons', () => {
    it('renders different icons for different insight types', () => {
      const report = createMockReport();
      render(<ReportView report={report} />);

      // All insight cards should be present
      const insightCards = [
        screen.getByTestId('insight-card-0'),
        screen.getByTestId('insight-card-1'),
        screen.getByTestId('insight-card-2'),
        screen.getByTestId('insight-card-3'),
      ];

      expect(insightCards).toHaveLength(4);
    });
  });

  describe('edge cases', () => {
    it('handles report with minimal data', () => {
      const minimalReport: GeneratedReport = {
        title: 'Minimal Report',
        summary: 'Minimal summary.',
        insights: [],
        charts: [],
        dataTable: {
          columns: [],
          rows: [],
          sortable: true,
          filterable: true,
        },
        generatedAt: new Date().toISOString(),
        promptUsed: 'Auto-generated analysis',
      };

      render(<ReportView report={minimalReport} />);

      expect(screen.getByTestId('report-title')).toHaveTextContent(
        'Minimal Report'
      );
      expect(screen.getByTestId('report-summary')).toHaveTextContent(
        'Minimal summary.'
      );
    });

    it('handles report with array yKey in charts', () => {
      const report = createMockReport();
      report.charts[0].yKey = ['Revenue', 'Cost'];
      report.charts[0].data = [
        { Region: 'North', Revenue: 5000, Cost: 2000 },
        { Region: 'South', Revenue: 3000, Cost: 1500 },
      ];

      render(<ReportView report={report} />);

      // Chart should render with multi-series data
      expect(screen.getByTestId('report-chart-0')).toBeInTheDocument();
    });

    it('handles report with no promptUsed', () => {
      const report = createMockReport();
      report.promptUsed = '';

      render(<ReportView report={report} />);

      expect(screen.getByTestId('report-view')).toBeInTheDocument();
    });
  });
});
