/**
 * Excel Export Service for Reports
 *
 * Story 23.7: AC-23.7.2, AC-23.7.4, AC-23.7.5, AC-23.7.7
 * Generates Excel workbooks with Data, Summary, and Insights sheets.
 *
 * @module @/lib/reporting/excel-export
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { GeneratedReport, ReportInsight } from '@/types/reporting';
import { formatDateForFilename } from '@/lib/compare/export';

// ============================================================================
// Types
// ============================================================================

interface SheetData {
  name: string;
  data: unknown[][];
  colWidths?: number[];
}

// ============================================================================
// Sheet Generators
// ============================================================================

/**
 * Creates the Data sheet with all rows from report.dataTable
 * AC-23.7.2: Excel export includes original data rows
 */
function createDataSheet(report: GeneratedReport): SheetData {
  const { columns, rows } = report.dataTable;

  // Header row
  const data: unknown[][] = [columns];

  // Data rows
  for (const row of rows) {
    const rowData = columns.map((col) => row[col] ?? '');
    data.push(rowData);
  }

  // Auto-calculate column widths based on content
  const colWidths = columns.map((col, index) => {
    const maxContentLength = Math.max(
      col.length,
      ...rows.slice(0, 100).map((r) => String(r[col] ?? '').length)
    );
    return Math.min(Math.max(maxContentLength + 2, 10), 50);
  });

  return {
    name: 'Data',
    data,
    colWidths,
  };
}

/**
 * Creates the Summary sheet with report metadata
 * AC-23.7.2: Summary sheet with report title, summary, and generatedAt
 */
function createSummarySheet(report: GeneratedReport): SheetData {
  const data: unknown[][] = [
    ['Report Summary'],
    [],
    ['Title', report.title],
    ['Generated', new Date(report.generatedAt).toLocaleString()],
    ['Analysis Prompt', report.promptUsed || '(Auto-generated)'],
    [],
    ['Executive Summary'],
    [report.summary],
    [],
    ['Data Overview'],
    ['Total Rows', report.dataTable.rows.length],
    ['Total Columns', report.dataTable.columns.length],
    ['Number of Insights', report.insights.length],
    ['Number of Charts', report.charts.length],
  ];

  return {
    name: 'Summary',
    data,
    colWidths: [20, 80],
  };
}

/**
 * Creates the Insights sheet with all insights
 * AC-23.7.7: Excel summary sheet includes all insights with type and severity
 */
function createInsightsSheet(report: GeneratedReport): SheetData {
  // Header row
  const data: unknown[][] = [
    ['Type', 'Title', 'Description', 'Severity', 'Related Columns'],
  ];

  // Insight rows
  for (const insight of report.insights) {
    data.push([
      insight.type.charAt(0).toUpperCase() + insight.type.slice(1),
      insight.title,
      insight.description,
      (insight.severity || 'info').charAt(0).toUpperCase() +
        (insight.severity || 'info').slice(1),
      insight.relatedColumns?.join(', ') || '',
    ]);
  }

  return {
    name: 'Insights',
    data,
    colWidths: [15, 30, 60, 12, 30],
  };
}

// ============================================================================
// Workbook Builder
// ============================================================================

/**
 * Builds an XLSX workbook from sheet data
 */
function buildWorkbook(sheets: SheetData[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);

    // Apply column widths
    if (sheet.colWidths) {
      worksheet['!cols'] = sheet.colWidths.map((wch) => ({ wch }));
    }

    // Style header row (bold) - Note: xlsx doesn't support styling in free version
    // Headers are distinguished by being in the first row

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return workbook;
}

// ============================================================================
// Export Function
// ============================================================================

/**
 * Generates and downloads Excel report.
 * AC-23.7.4: Downloads start immediately (client-side)
 * AC-23.7.5: docuMINE-report-YYYY-MM-DD.xlsx format
 *
 * @param report - GeneratedReport to export
 */
export async function downloadReportExcel(report: GeneratedReport): Promise<void> {
  // Create sheets
  const sheets: SheetData[] = [
    createDataSheet(report),
    createSummarySheet(report),
    createInsightsSheet(report),
  ];

  // Build workbook
  const workbook = buildWorkbook(sheets);

  // Generate buffer and create blob
  const buffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Download with timestamped filename
  const filename = `docuMINE-report-${formatDateForFilename(new Date())}.xlsx`;
  saveAs(blob, filename);
}

// ============================================================================
// Utility Exports for Testing
// ============================================================================

export const _testing = {
  createDataSheet,
  createSummarySheet,
  createInsightsSheet,
  buildWorkbook,
};
