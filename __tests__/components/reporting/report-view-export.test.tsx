/**
 * @vitest-environment happy-dom
 *
 * ReportView Export Button Tests
 * Epic 23: Flexible AI Reports - Story 23.7
 *
 * Tests for export buttons in the report view component.
 * AC-23.7.3: Export buttons (PDF/Excel) are visible and accessible in the report view header
 * AC-23.7.8: Export buttons disabled during report generation (loading state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GeneratedReport } from '@/types/reporting';

// Mock the export functions
vi.mock('@/lib/reporting/pdf-export', () => ({
  downloadReportPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/reporting/excel-export', () => ({
  downloadReportExcel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/reporting/chart-capture', () => ({
  captureChartsBySelector: vi.fn().mockResolvedValue([]),
}));

// Import after mocks
import { ReportView } from '@/components/reporting/report-view';
import { downloadReportPdf } from '@/lib/reporting/pdf-export';
import { downloadReportExcel } from '@/lib/reporting/excel-export';
import { captureChartsBySelector } from '@/lib/reporting/chart-capture';

const mockDownloadReportPdf = downloadReportPdf as ReturnType<typeof vi.fn>;
const mockDownloadReportExcel = downloadReportExcel as ReturnType<typeof vi.fn>;
const mockCaptureChartsBySelector = captureChartsBySelector as ReturnType<typeof vi.fn>;

// Sample report data
const createSampleReport = (): GeneratedReport => ({
  title: 'Test Report',
  summary: 'This is a test report summary.',
  insights: [
    {
      type: 'finding',
      title: 'Test Finding',
      description: 'A test finding description.',
      severity: 'info',
    },
  ],
  charts: [
    {
      id: 'chart-1',
      type: 'bar',
      data: [{ month: 'Jan', value: 100 }],
      xKey: 'month',
      yKey: 'value',
      title: 'Test Chart',
    },
  ],
  dataTable: {
    columns: ['A', 'B'],
    rows: [{ A: 1, B: 2 }],
    sortable: true,
    filterable: true,
  },
  generatedAt: '2025-12-10T10:00:00Z',
  promptUsed: 'Test prompt',
});

describe('ReportView Export Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Visibility (AC-23.7.3)', () => {
    it('renders PDF export button', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      expect(pdfButton).toBeInTheDocument();
    });

    it('renders Excel export button', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      expect(excelButton).toBeInTheDocument();
    });

    it('PDF button has correct text', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      expect(pdfButton).toHaveTextContent('PDF');
    });

    it('Excel button has correct text', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      expect(excelButton).toHaveTextContent('Excel');
    });

    it('buttons are positioned in header area', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      // Both buttons should be in the same container as the title
      const title = screen.getByTestId('report-title');
      const pdfButton = screen.getByTestId('export-pdf-button');
      const excelButton = screen.getByTestId('export-excel-button');

      // All should be within the report-view container
      const reportView = screen.getByTestId('report-view');
      expect(reportView).toContainElement(title);
      expect(reportView).toContainElement(pdfButton);
      expect(reportView).toContainElement(excelButton);
    });
  });

  describe('Accessibility (AC-23.7.3)', () => {
    it('PDF button has aria-label', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      expect(pdfButton).toHaveAttribute('aria-label', 'Export report as PDF');
    });

    it('Excel button has aria-label', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      expect(excelButton).toHaveAttribute('aria-label', 'Export report as Excel');
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');

      // Focus the button directly and press Enter
      pdfButton.focus();
      await user.keyboard('{Enter}');

      // Should trigger export
      await waitFor(() => {
        expect(mockDownloadReportPdf).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled State During Generation (AC-23.7.8)', () => {
    it('PDF button disabled when isGenerating is true', () => {
      const report = createSampleReport();
      render(<ReportView report={report} isGenerating={true} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      expect(pdfButton).toBeDisabled();
    });

    it('Excel button disabled when isGenerating is true', () => {
      const report = createSampleReport();
      render(<ReportView report={report} isGenerating={true} />);

      const excelButton = screen.getByTestId('export-excel-button');
      expect(excelButton).toBeDisabled();
    });

    it('buttons enabled when isGenerating is false', () => {
      const report = createSampleReport();
      render(<ReportView report={report} isGenerating={false} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      const excelButton = screen.getByTestId('export-excel-button');

      expect(pdfButton).not.toBeDisabled();
      expect(excelButton).not.toBeDisabled();
    });

    it('buttons enabled by default (isGenerating undefined)', () => {
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      const excelButton = screen.getByTestId('export-excel-button');

      expect(pdfButton).not.toBeDisabled();
      expect(excelButton).not.toBeDisabled();
    });
  });

  describe('Export Click Handlers', () => {
    it('clicking PDF button triggers PDF download', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDownloadReportPdf).toHaveBeenCalledWith(report, expect.any(Array));
      });
    });

    it('clicking Excel button triggers Excel download', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      await user.click(excelButton);

      await waitFor(() => {
        expect(mockDownloadReportExcel).toHaveBeenCalledWith(report);
      });
    });

    it('PDF export captures chart images when charts exist', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockCaptureChartsBySelector).toHaveBeenCalledWith(
          '[data-testid^="report-chart-"]'
        );
      });
    });

    it('PDF export skips chart capture when no charts', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();
      report.charts = [];
      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDownloadReportPdf).toHaveBeenCalled();
      });

      // Chart capture should not have been called
      expect(mockCaptureChartsBySelector).not.toHaveBeenCalled();
    });

    it('prevents double-click during export', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      // Make the export take some time
      mockDownloadReportPdf.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');

      // Click twice quickly
      await user.click(pdfButton);
      await user.click(pdfButton);

      // Wait for first export to complete
      await waitFor(() => {
        expect(mockDownloadReportPdf).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State During Export', () => {
    it('shows loading spinner on PDF button during export', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      // Make export take time
      let resolveExport: () => void;
      mockDownloadReportPdf.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExport = resolve;
          })
      );

      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      // Check for loading state (button should be disabled during export)
      await waitFor(() => {
        expect(pdfButton).toBeDisabled();
      });

      // Resolve the export
      resolveExport!();

      // Button should be enabled again
      await waitFor(() => {
        expect(pdfButton).not.toBeDisabled();
      });
    });

    it('shows loading spinner on Excel button during export', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      let resolveExport: () => void;
      mockDownloadReportExcel.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExport = resolve;
          })
      );

      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      await user.click(excelButton);

      await waitFor(() => {
        expect(excelButton).toBeDisabled();
      });

      resolveExport!();

      await waitFor(() => {
        expect(excelButton).not.toBeDisabled();
      });
    });

    it('disables both buttons when one is exporting', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      let resolveExport: () => void;
      mockDownloadReportPdf.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExport = resolve;
          })
      );

      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      const excelButton = screen.getByTestId('export-excel-button');

      await user.click(pdfButton);

      // Both buttons should be disabled
      await waitFor(() => {
        expect(pdfButton).toBeDisabled();
        expect(excelButton).toBeDisabled();
      });

      resolveExport!();

      await waitFor(() => {
        expect(pdfButton).not.toBeDisabled();
        expect(excelButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles PDF export error gracefully', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDownloadReportPdf.mockRejectedValue(new Error('Export failed'));

      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'PDF export failed:',
          expect.any(Error)
        );
      });

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(pdfButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });

    it('handles Excel export error gracefully', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDownloadReportExcel.mockRejectedValue(new Error('Export failed'));

      render(<ReportView report={report} />);

      const excelButton = screen.getByTestId('export-excel-button');
      await user.click(excelButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Excel export failed:',
          expect.any(Error)
        );
      });

      await waitFor(() => {
        expect(excelButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });

    it('handles chart capture error but still exports PDF', async () => {
      const user = userEvent.setup();
      const report = createSampleReport();

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockCaptureChartsBySelector.mockRejectedValue(new Error('Capture failed'));

      render(<ReportView report={report} />);

      const pdfButton = screen.getByTestId('export-pdf-button');
      await user.click(pdfButton);

      await waitFor(() => {
        // PDF export should still be called even if chart capture fails
        expect(mockDownloadReportPdf).toHaveBeenCalledWith(report, []);
      });

      consoleWarn.mockRestore();
    });
  });
});
