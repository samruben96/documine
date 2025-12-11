/**
 * @vitest-environment happy-dom
 *
 * Excel Export Service Tests
 * Epic 23: Flexible AI Reports - Story 23.7
 *
 * Tests for Excel export functionality.
 * AC-23.7.2: Excel export includes original data rows plus a summary sheet with insights
 * AC-23.7.4: Downloads start immediately on click (client-side generation)
 * AC-23.7.5: Export filenames follow pattern: docuMINE-report-YYYY-MM-DD.xlsx
 * AC-23.7.7: Excel summary sheet includes all insights with type and severity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import type { GeneratedReport } from '@/types/reporting';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Import after mocks
import { downloadReportExcel, _testing } from '@/lib/reporting/excel-export';
import { saveAs } from 'file-saver';

const mockSaveAs = saveAs as ReturnType<typeof vi.fn>;

// Sample report data
const createSampleReport = (): GeneratedReport => ({
  title: 'Quarterly Commission Report',
  summary: 'Commission totals for Q4 2024. Overall performance up 12% from previous quarter.',
  insights: [
    {
      type: 'finding',
      title: 'Top Performer',
      description: 'Agent Smith exceeded quota by 150%.',
      severity: 'info',
      relatedColumns: ['Agent', 'Commission'],
    },
    {
      type: 'trend',
      title: 'Growth Trend',
      description: 'Consistent month-over-month growth observed.',
      severity: 'info',
    },
    {
      type: 'anomaly',
      title: 'Unusual Activity',
      description: 'December showed unexpected spike in renewals.',
      severity: 'warning',
    },
    {
      type: 'recommendation',
      title: 'Review Pricing',
      description: 'Consider adjusting commission rates for new policies.',
      severity: 'critical',
    },
  ],
  charts: [
    {
      id: 'chart-1',
      type: 'bar',
      data: [{ month: 'Oct', value: 100 }],
      xKey: 'month',
      yKey: 'value',
      title: 'Monthly Commissions',
    },
  ],
  dataTable: {
    columns: ['Agent', 'Policy', 'Premium', 'Commission'],
    rows: [
      { Agent: 'Smith', Policy: 'POL001', Premium: 5000, Commission: 500 },
      { Agent: 'Jones', Policy: 'POL002', Premium: 3500, Commission: 350 },
      { Agent: 'Brown', Policy: 'POL003', Premium: 4200, Commission: 420 },
    ],
    sortable: true,
    filterable: true,
  },
  generatedAt: '2025-12-10T10:00:00Z',
  promptUsed: 'Analyze Q4 commission data',
});

describe('Excel Export Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock date for consistent filename testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-10T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createDataSheet', () => {
    it('includes all columns from dataTable (AC-23.7.2)', () => {
      const report = createSampleReport();
      const sheet = _testing.createDataSheet(report);

      // First row should be headers
      expect(sheet.data[0]).toEqual(['Agent', 'Policy', 'Premium', 'Commission']);
    });

    it('includes all data rows (AC-23.7.2)', () => {
      const report = createSampleReport();
      const sheet = _testing.createDataSheet(report);

      // Should have header + 3 data rows
      expect(sheet.data.length).toBe(4);

      // Check data values
      expect(sheet.data[1]).toEqual(['Smith', 'POL001', 5000, 500]);
      expect(sheet.data[2]).toEqual(['Jones', 'POL002', 3500, 350]);
      expect(sheet.data[3]).toEqual(['Brown', 'POL003', 4200, 420]);
    });

    it('handles empty cell values', () => {
      const report = createSampleReport();
      report.dataTable.rows[0].Premium = null;
      const sheet = _testing.createDataSheet(report);

      expect(sheet.data[1][2]).toBe('');
    });

    it('generates column widths', () => {
      const report = createSampleReport();
      const sheet = _testing.createDataSheet(report);

      expect(sheet.colWidths).toBeDefined();
      expect(sheet.colWidths!.length).toBe(4);
    });

    it('has sheet name "Data"', () => {
      const report = createSampleReport();
      const sheet = _testing.createDataSheet(report);

      expect(sheet.name).toBe('Data');
    });
  });

  describe('createSummarySheet', () => {
    it('includes report title (AC-23.7.2)', () => {
      const report = createSampleReport();
      const sheet = _testing.createSummarySheet(report);

      // Find title row
      const titleRow = sheet.data.find((row) => row[0] === 'Title');
      expect(titleRow).toBeDefined();
      expect(titleRow![1]).toBe('Quarterly Commission Report');
    });

    it('includes summary text (AC-23.7.2)', () => {
      const report = createSampleReport();
      const sheet = _testing.createSummarySheet(report);

      const summaryText = sheet.data.flat().find(
        (cell) => typeof cell === 'string' && cell.includes('Commission totals')
      );
      expect(summaryText).toBeDefined();
    });

    it('includes generated timestamp (AC-23.7.2)', () => {
      const report = createSampleReport();
      const sheet = _testing.createSummarySheet(report);

      const generatedRow = sheet.data.find((row) => row[0] === 'Generated');
      expect(generatedRow).toBeDefined();
      expect(generatedRow![1]).toContain('2025'); // Contains year
    });

    it('includes data overview metrics', () => {
      const report = createSampleReport();
      const sheet = _testing.createSummarySheet(report);

      const rowCountRow = sheet.data.find((row) => row[0] === 'Total Rows');
      expect(rowCountRow).toBeDefined();
      expect(rowCountRow![1]).toBe(3);

      const colCountRow = sheet.data.find((row) => row[0] === 'Total Columns');
      expect(colCountRow).toBeDefined();
      expect(colCountRow![1]).toBe(4);
    });

    it('has sheet name "Summary"', () => {
      const report = createSampleReport();
      const sheet = _testing.createSummarySheet(report);

      expect(sheet.name).toBe('Summary');
    });
  });

  describe('createInsightsSheet', () => {
    it('has correct column headers (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      expect(sheet.data[0]).toEqual([
        'Type',
        'Title',
        'Description',
        'Severity',
        'Related Columns',
      ]);
    });

    it('includes all insights (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      // Header + 4 insights
      expect(sheet.data.length).toBe(5);
    });

    it('includes insight types with capitalization (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      const types = sheet.data.slice(1).map((row) => row[0]);
      expect(types).toContain('Finding');
      expect(types).toContain('Trend');
      expect(types).toContain('Anomaly');
      expect(types).toContain('Recommendation');
    });

    it('includes insight titles (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      const titles = sheet.data.slice(1).map((row) => row[1]);
      expect(titles).toContain('Top Performer');
      expect(titles).toContain('Growth Trend');
    });

    it('includes insight descriptions (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      const descriptions = sheet.data.slice(1).map((row) => row[2]);
      expect(descriptions).toContain('Agent Smith exceeded quota by 150%.');
    });

    it('includes severity levels with capitalization (AC-23.7.7)', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      const severities = sheet.data.slice(1).map((row) => row[3]);
      expect(severities).toContain('Info');
      expect(severities).toContain('Warning');
      expect(severities).toContain('Critical');
    });

    it('includes related columns when available', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      // First insight has related columns
      expect(sheet.data[1][4]).toBe('Agent, Commission');
    });

    it('handles missing related columns', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      // Second insight has no related columns
      expect(sheet.data[2][4]).toBe('');
    });

    it('has sheet name "Insights"', () => {
      const report = createSampleReport();
      const sheet = _testing.createInsightsSheet(report);

      expect(sheet.name).toBe('Insights');
    });
  });

  describe('buildWorkbook', () => {
    it('creates workbook with all sheets', () => {
      const report = createSampleReport();
      const sheets = [
        _testing.createDataSheet(report),
        _testing.createSummarySheet(report),
        _testing.createInsightsSheet(report),
      ];

      const workbook = _testing.buildWorkbook(sheets);

      expect(workbook.SheetNames).toContain('Data');
      expect(workbook.SheetNames).toContain('Summary');
      expect(workbook.SheetNames).toContain('Insights');
    });

    it('preserves sheet order', () => {
      const report = createSampleReport();
      const sheets = [
        _testing.createDataSheet(report),
        _testing.createSummarySheet(report),
        _testing.createInsightsSheet(report),
      ];

      const workbook = _testing.buildWorkbook(sheets);

      expect(workbook.SheetNames[0]).toBe('Data');
      expect(workbook.SheetNames[1]).toBe('Summary');
      expect(workbook.SheetNames[2]).toBe('Insights');
    });
  });

  describe('downloadReportExcel Function', () => {
    it('generates Excel and triggers download (AC-23.7.4)', async () => {
      const report = createSampleReport();
      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/^docuMINE-report-\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });

    it('uses correct filename format (AC-23.7.5)', async () => {
      const report = createSampleReport();
      await downloadReportExcel(report);

      const [, filename] = mockSaveAs.mock.calls[0];
      expect(filename).toBe('docuMINE-report-2025-12-10.xlsx');
    });

    it('creates blob with correct MIME type', async () => {
      const report = createSampleReport();
      await downloadReportExcel(report);

      const [blob] = mockSaveAs.mock.calls[0];
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('handles report with empty data table', async () => {
      const report = createSampleReport();
      report.dataTable.rows = [];
      report.dataTable.columns = [];

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });

    it('handles report with no insights', async () => {
      const report = createSampleReport();
      report.insights = [];

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });

    it('handles report with many rows', async () => {
      const report = createSampleReport();
      report.dataTable.rows = Array.from({ length: 1000 }, (_, i) => ({
        Agent: `Agent ${i}`,
        Policy: `POL${i.toString().padStart(5, '0')}`,
        Premium: Math.random() * 10000,
        Commission: Math.random() * 1000,
      }));

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });
  });

  describe('Column Width Calculations', () => {
    it('calculates widths based on content', () => {
      const report = createSampleReport();
      const sheet = _testing.createDataSheet(report);

      // Column widths should be at least 10 (minimum)
      sheet.colWidths!.forEach((width) => {
        expect(width).toBeGreaterThanOrEqual(10);
      });
    });

    it('caps maximum width at 50', () => {
      const report = createSampleReport();
      // Add a row with very long content
      report.dataTable.rows.push({
        Agent: 'A'.repeat(100),
        Policy: 'POL999',
        Premium: 0,
        Commission: 0,
      });

      const sheet = _testing.createDataSheet(report);

      sheet.colWidths!.forEach((width) => {
        expect(width).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in data', async () => {
      const report = createSampleReport();
      report.dataTable.rows[0].Agent = 'Smith, John "Jr."';
      report.dataTable.rows[0].Policy = 'POL-001\nMulti-line';

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });

    it('handles numeric strings', async () => {
      const report = createSampleReport();
      report.dataTable.rows[0].Policy = '12345'; // Numeric string

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });

    it('handles undefined/null in insights', async () => {
      const report = createSampleReport();
      report.insights[0].severity = undefined;
      report.insights[0].relatedColumns = undefined;

      await downloadReportExcel(report);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });
  });
});
