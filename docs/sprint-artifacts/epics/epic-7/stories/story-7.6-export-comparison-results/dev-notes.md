# Dev Notes

## Export Button Component

```tsx
// src/components/compare/export-button.tsx

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';

interface ExportButtonProps {
  onExportPdf: () => void;
  onExportCsv: () => void;
  isExporting: boolean;
  exportType?: 'pdf' | 'csv' | null;
}

export function ExportButton({
  onExportPdf,
  onExportCsv,
  isExporting,
  exportType,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {exportType === 'pdf' ? 'Generating PDF...' : 'Exporting...'}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPdf}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCsv}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## CSV Export Implementation

```typescript
// src/lib/compare/export.ts

import { ComparisonResult, ComparisonRow } from '@/types/compare';
import { saveAs } from 'file-saver';

/**
 * Escapes a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generates CSV content from comparison result
 */
export function generateCsvContent(result: ComparisonResult): string {
  const lines: string[] = [];

  // Header row
  const headers = ['Field', ...result.documents.map(d => d.carrierName || d.name)];
  lines.push(headers.map(escapeCSV).join(','));

  // Data rows
  result.rows.forEach(row => {
    const values = [
      row.field,
      ...row.values.map(v => v.displayValue || '—')
    ];
    lines.push(values.map(escapeCSV).join(','));
  });

  // Gap summary
  if (result.gaps.length > 0) {
    lines.push('');
    lines.push('GAPS IDENTIFIED');
    result.gaps.forEach(gap => {
      const missing = gap.documentsMissing.map(i => result.documents[i]?.name || `Doc ${i+1}`).join(', ');
      lines.push(escapeCSV(`${gap.field}: Missing in ${missing} (${gap.severity} severity)`));
    });
  }

  // Conflict summary
  if (result.conflicts.length > 0) {
    lines.push('');
    lines.push('CONFLICTS IDENTIFIED');
    result.conflicts.forEach(conflict => {
      lines.push(escapeCSV(`${conflict.field}: ${conflict.description}`));
    });
  }

  return lines.join('\n');
}

/**
 * Downloads CSV file
 */
export function downloadCsv(result: ComparisonResult): void {
  const content = generateCsvContent(result);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const filename = `docuMINE-comparison-${formatDate(new Date())}.csv`;
  saveAs(blob, filename);
}

/**
 * Formats date for filename
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
```

## PDF Export Implementation

```tsx
// src/lib/compare/pdf-export.tsx

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { ComparisonResult } from '@/types/compare';
import { saveAs } from 'file-saver';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  table: {
    marginTop: 20,
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
  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 10,
  },
  fieldCell: {
    fontWeight: 'bold',
    flex: 1.5,
  },
  bestValue: {
    color: '#16a34a',
  },
  worstValue: {
    color: '#dc2626',
  },
  notFound: {
    color: '#9ca3af',
  },
  gapRow: {
    backgroundColor: '#fef3c7',
  },
  gapsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  warning: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 8,
  },
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

interface PDFDocumentProps {
  result: ComparisonResult;
  generatedAt: Date;
}

function ComparisonPDFDocument({ result, generatedAt }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quote Comparison</Text>
          <Text style={styles.subtitle}>
            Generated on {generatedAt.toLocaleDateString()} at {generatedAt.toLocaleTimeString()}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.fieldCell]}>Field</Text>
            {result.documents.map((doc, i) => (
              <Text key={i} style={styles.tableCell}>
                {doc.carrierName || doc.name}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {result.rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[
                styles.tableRow,
                row.isGap && styles.gapRow
              ]}
            >
              <Text style={[styles.tableCell, styles.fieldCell]}>
                {row.isGap && '⚠ '}{row.field}
              </Text>
              {row.values.map((value, valIndex) => (
                <Text
                  key={valIndex}
                  style={[
                    styles.tableCell,
                    row.bestIndex === valIndex && styles.bestValue,
                    row.worstIndex === valIndex && styles.worstValue,
                    value.status === 'not_found' && styles.notFound,
                  ]}
                >
                  {row.bestIndex === valIndex && '● '}
                  {row.worstIndex === valIndex && '○ '}
                  {value.displayValue || '—'}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Gaps Summary */}
        {result.gaps.length > 0 && (
          <View style={styles.gapsSection}>
            <Text style={styles.sectionTitle}>
              Potential Gaps ({result.gaps.length})
            </Text>
            {result.gaps.map((gap, i) => {
              const missing = gap.documentsMissing
                .map(idx => result.documents[idx]?.name || `Doc ${idx + 1}`)
                .join(', ');
              return (
                <Text key={i} style={styles.warning}>
                  • {gap.field}: Missing in {missing} ({gap.severity} severity)
                </Text>
              );
            })}
          </View>
        )}

        {/* Conflicts Summary */}
        {result.conflicts.length > 0 && (
          <View style={styles.gapsSection}>
            <Text style={styles.sectionTitle}>
              Conflicts ({result.conflicts.length})
            </Text>
            {result.conflicts.map((conflict, i) => (
              <Text key={i} style={styles.warning}>
                • {conflict.field}: {conflict.description}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by docuMINE
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Generates and downloads PDF
 */
export async function downloadPdf(result: ComparisonResult): Promise<void> {
  const generatedAt = new Date();
  const doc = <ComparisonPDFDocument result={result} generatedAt={generatedAt} />;
  const blob = await pdf(doc).toBlob();
  const filename = `docuMINE-comparison-${formatDate(generatedAt)}.pdf`;
  saveAs(blob, filename);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

## Integration in Compare Page

```tsx
// In src/app/(dashboard)/compare/[id]/page.tsx

import { ExportButton } from '@/components/compare/export-button';
import { downloadCsv } from '@/lib/compare/export';
import { downloadPdf } from '@/lib/compare/pdf-export';

// Inside component:
const [isExporting, setIsExporting] = useState(false);
const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null);

async function handleExportPdf() {
  if (!result) return;
  setIsExporting(true);
  setExportType('pdf');
  try {
    await downloadPdf(result);
    toast.success('PDF exported successfully');
  } catch (error) {
    toast.error('Failed to generate PDF');
    console.error('PDF export error:', error);
  } finally {
    setIsExporting(false);
    setExportType(null);
  }
}

function handleExportCsv() {
  if (!result) return;
  setIsExporting(true);
  setExportType('csv');
  try {
    downloadCsv(result);
    toast.success('CSV exported successfully');
  } catch (error) {
    toast.error('Failed to generate CSV');
    console.error('CSV export error:', error);
  } finally {
    setIsExporting(false);
    setExportType(null);
  }
}

// In header area:
<ExportButton
  onExportPdf={handleExportPdf}
  onExportCsv={handleExportCsv}
  isExporting={isExporting}
  exportType={exportType}
/>
```

## Dependencies to Add

```json
// package.json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.4.4",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

## Project Structure Notes

```
src/components/compare/
├── quote-selector.tsx          # Selection interface (Story 7.1) ✅
├── selection-counter.tsx       # Selection count (Story 7.1) ✅
├── extraction-card.tsx         # Extraction display (Story 7.2) ✅
├── comparison-table.tsx        # Side-by-side table (Story 7.3-7.5) ✅
├── gap-conflict-banner.tsx     # Warning summary (Story 7.4) ✅
├── source-viewer-modal.tsx     # Document viewer modal (Story 7.5) ✅
├── export-button.tsx           # Export dropdown (NEW)
└── index.ts                    # Exports

src/lib/compare/
├── service.ts                  # Compare orchestration ✅
├── extraction.ts               # GPT extraction ✅
├── diff.ts                     # Diff engine ✅
├── export.ts                   # CSV export (NEW)
├── pdf-export.tsx              # PDF generation (NEW)
└── index.ts                    # Exports
```

## Testing Considerations

**CSV Edge Cases:**
- Values with commas: `"Value, with comma"`
- Values with quotes: `"Value ""with"" quotes"`
- Values with newlines: Should be escaped properly
- Empty values: Should output empty string, not "null"
- Unicode characters: Ensure proper encoding

**PDF Testing:**
- Generate with 2, 3, 4 documents (varying column counts)
- Long table that spans multiple pages
- Many gaps/conflicts in summary
- Long carrier names (text truncation)
- Special characters in field values

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Story-7.6]
- [Source: docs/epics.md#Story-7.6]
- [Source: docs/architecture.md#Export-Service]
- [react-pdf Documentation](https://react-pdf.org/)
- [file-saver Library](https://github.com/eligrey/FileSaver.js)

---
