/**
 * CSV Export Service
 *
 * Story 7.6: AC-7.6.4, AC-7.6.5
 * Generates CSV content from comparison data and triggers download.
 *
 * @module @/lib/compare/export
 */

import { saveAs } from 'file-saver';
import type { ComparisonTableData, GapWarning, ConflictWarning } from './diff';

// ============================================================================
// CSV Escaping
// ============================================================================

/**
 * Escapes a value for CSV format.
 * AC-7.6.4: Proper escaping for commas, quotes, newlines.
 *
 * @param value - The string value to escape
 * @returns Properly escaped CSV value
 */
export function escapeCSV(value: string): string {
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================================================
// CSV Generation
// ============================================================================

/**
 * Generates CSV content from comparison table data.
 * AC-7.6.4: Header row with Field + carrier names, data rows, gap/conflict summaries.
 *
 * @param tableData - ComparisonTableData from buildComparisonRows()
 * @returns CSV string content
 */
export function generateCsvContent(tableData: ComparisonTableData): string {
  const lines: string[] = [];

  // Header row: Field, Carrier1, Carrier2, ...
  const headers = ['Field', ...tableData.headers];
  lines.push(headers.map(escapeCSV).join(','));

  // Data rows
  for (const row of tableData.rows) {
    const values = [
      row.field,
      ...row.values.map((v) => v.displayValue || '—'),
    ];
    lines.push(values.map(escapeCSV).join(','));
  }

  // Gap summary section
  if (tableData.gaps.length > 0) {
    lines.push('');
    lines.push('GAPS IDENTIFIED');
    for (const gap of tableData.gaps) {
      const missingDocs = gap.documentsMissing
        .map((i) => tableData.headers[i] || `Doc ${i + 1}`)
        .join(', ');
      const line = `${gap.field}: Missing in ${missingDocs} (${gap.severity} severity)`;
      lines.push(escapeCSV(line));
    }
  }

  // Conflict summary section
  if (tableData.conflicts.length > 0) {
    lines.push('');
    lines.push('CONFLICTS IDENTIFIED');
    for (const conflict of tableData.conflicts) {
      lines.push(escapeCSV(`${conflict.field}: ${conflict.description}`));
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats date for filename.
 * AC-7.6.5: YYYY-MM-DD format.
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

// ============================================================================
// Download Functions
// ============================================================================

/**
 * Downloads CSV file with timestamped filename.
 * AC-7.6.5: docuMINE-comparison-YYYY-MM-DD.csv format.
 *
 * @param tableData - ComparisonTableData to export
 */
export function downloadCsv(tableData: ComparisonTableData): void {
  const content = generateCsvContent(tableData);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const filename = `docuMINE-comparison-${formatDateForFilename(new Date())}.csv`;
  saveAs(blob, filename);
}
