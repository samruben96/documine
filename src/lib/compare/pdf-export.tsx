/**
 * PDF Export Service
 *
 * Story 7.6: AC-7.6.2, AC-7.6.3
 * Generates professional PDF with React PDF/renderer.
 *
 * @module @/lib/compare/pdf-export
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { ComparisonTableData, ComparisonRow, GapWarning, ConflictWarning } from './diff';
import { formatDateForFilename } from './export';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Header section
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  brandName: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  // Table styles
  table: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowGap: {
    backgroundColor: '#fef3c7',
  },
  tableRowDiff: {
    backgroundColor: '#fefce8',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  tableCellHeader: {
    padding: 8,
    flex: 1,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#475569',
  },
  fieldCell: {
    flex: 1.5,
  },
  valueCell: {
    flex: 1,
  },
  // Value styles
  bestValue: {
    color: '#16a34a',
  },
  worstValue: {
    color: '#dc2626',
  },
  notFound: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Indicator prefixes
  bestIndicator: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  worstIndicator: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  gapIndicator: {
    color: '#d97706',
    fontWeight: 'bold',
  },
  // Summary sections
  summarySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  sectionTitleGap: {
    color: '#d97706',
  },
  sectionTitleConflict: {
    color: '#dc2626',
  },
  warningItem: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 12,
    color: '#475569',
  },
  severityHigh: {
    color: '#dc2626',
  },
  severityMedium: {
    color: '#d97706',
  },
  severityLow: {
    color: '#64748b',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// ============================================================================
// PDF Document Component
// ============================================================================

interface ComparisonPDFProps {
  tableData: ComparisonTableData;
  generatedAt: Date;
}

/**
 * PDF Document component for comparison results.
 * AC-7.6.2: Header, date, carrier names, full table, gaps/conflicts summary.
 * AC-7.6.3: Best/worst indicators, gap styling, professional formatting.
 */
function ComparisonPDFDocument({ tableData, generatedAt }: ComparisonPDFProps) {
  // Split rows for pagination (roughly 25 rows per page)
  const ROWS_PER_PAGE = 25;
  const rowPages = chunkArray(tableData.rows, ROWS_PER_PAGE);

  return (
    <Document>
      {rowPages.map((pageRows, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <View style={styles.header}>
              <Text style={styles.brandName}>docuMINE</Text>
              <Text style={styles.title}>Quote Comparison</Text>
              <Text style={styles.subtitle}>
                Generated on {generatedAt.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} at {generatedAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.subtitle}>
                Comparing {tableData.documentCount} quote{tableData.documentCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Table */}
          <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.fieldCell]}>Field</Text>
              {tableData.headers.map((header, i) => (
                <Text key={i} style={[styles.tableCellHeader, styles.valueCell]}>
                  {header}
                </Text>
              ))}
            </View>

            {/* Data Rows */}
            {pageRows.map((row) => (
              <TableRow key={row.id} row={row} />
            ))}
          </View>

          {/* Gaps & Conflicts Summary - only on last page */}
          {pageIndex === rowPages.length - 1 && (
            <>
              {tableData.gaps.length > 0 && (
                <GapsSummary gaps={tableData.gaps} headers={tableData.headers} />
              )}
              {tableData.conflicts.length > 0 && (
                <ConflictsSummary conflicts={tableData.conflicts} />
              )}
            </>
          )}

          {/* Footer */}
          <Text style={styles.footer}>
            Generated by docuMINE • Page {pageIndex + 1} of {rowPages.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
}

// ============================================================================
// Table Row Component
// ============================================================================

function TableRow({ row }: { row: ComparisonRow }) {
  const rowStyles = [
    styles.tableRow,
    row.isGap && styles.tableRowGap,
    row.hasDifference && !row.isGap && styles.tableRowDiff,
  ].filter(Boolean);

  return (
    <View style={rowStyles as any}>
      {/* Field name with gap indicator */}
      <Text style={[styles.tableCell, styles.fieldCell]}>
        {row.isGap && (
          <Text style={styles.gapIndicator}>⚠ </Text>
        )}
        {row.field}
      </Text>

      {/* Values */}
      {row.values.map((value, valIndex) => {
        const cellStyles = [
          styles.tableCell,
          styles.valueCell,
          row.bestIndex === valIndex && styles.bestValue,
          row.worstIndex === valIndex && styles.worstValue,
          value.status === 'not_found' && styles.notFound,
        ].filter(Boolean);

        return (
          <Text key={valIndex} style={cellStyles as any}>
            {row.bestIndex === valIndex && (
              <Text style={styles.bestIndicator}>● </Text>
            )}
            {row.worstIndex === valIndex && (
              <Text style={styles.worstIndicator}>○ </Text>
            )}
            {value.displayValue || '—'}
          </Text>
        );
      })}
    </View>
  );
}

// ============================================================================
// Summary Components
// ============================================================================

function GapsSummary({
  gaps,
  headers,
}: {
  gaps: GapWarning[];
  headers: string[];
}) {
  return (
    <View style={styles.summarySection}>
      <Text style={[styles.sectionTitle, styles.sectionTitleGap]}>
        Potential Gaps ({gaps.length})
      </Text>
      {gaps.map((gap, i) => {
        const missingDocs = gap.documentsMissing
          .map((idx) => headers[idx] || `Doc ${idx + 1}`)
          .join(', ');
        const severityStyle =
          gap.severity === 'high'
            ? styles.severityHigh
            : gap.severity === 'medium'
              ? styles.severityMedium
              : styles.severityLow;

        return (
          <Text key={i} style={styles.warningItem}>
            • {gap.field}: Missing in {missingDocs}{' '}
            <Text style={severityStyle}>({gap.severity})</Text>
          </Text>
        );
      })}
    </View>
  );
}

function ConflictsSummary({ conflicts }: { conflicts: ConflictWarning[] }) {
  return (
    <View style={styles.summarySection}>
      <Text style={[styles.sectionTitle, styles.sectionTitleConflict]}>
        Conflicts ({conflicts.length})
      </Text>
      {conflicts.map((conflict, i) => {
        const severityStyle =
          conflict.severity === 'high'
            ? styles.severityHigh
            : conflict.severity === 'medium'
              ? styles.severityMedium
              : styles.severityLow;

        return (
          <Text key={i} style={styles.warningItem}>
            • {conflict.description}{' '}
            <Text style={severityStyle}>({conflict.severity})</Text>
          </Text>
        );
      })}
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Splits an array into chunks of specified size.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

// ============================================================================
// Export Function
// ============================================================================

/**
 * Generates and downloads PDF.
 * AC-7.6.5: docuMINE-comparison-YYYY-MM-DD.pdf format.
 *
 * @param tableData - ComparisonTableData to export
 */
export async function downloadPdf(tableData: ComparisonTableData): Promise<void> {
  const generatedAt = new Date();
  const doc = <ComparisonPDFDocument tableData={tableData} generatedAt={generatedAt} />;
  const blob = await pdf(doc).toBlob();
  const filename = `docuMINE-comparison-${formatDateForFilename(generatedAt)}.pdf`;
  saveAs(blob, filename);
}
