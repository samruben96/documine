/**
 * Export Button Component
 * Story 20.4: Audit Log Interface
 *
 * Dropdown button for exporting audit logs.
 * AC-20.4.7: Export format selection (PDF or CSV), PDF option includes checkbox for full transcripts
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLogFilters } from './audit-filters';

export interface ExportButtonProps {
  /** Current filter values to apply to export */
  filters: AuditLogFilters;
  /** Callback to trigger PDF export */
  onExportPdf?: (includeTranscripts: boolean) => Promise<void>;
  /** Callback to trigger CSV export */
  onExportCsv?: () => Promise<void>;
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Export Button component with format selection
 *
 * @example
 * ```tsx
 * <ExportButton
 *   filters={currentFilters}
 *   onExportPdf={handlePdfExport}
 *   onExportCsv={handleCsvExport}
 *   isExporting={isExporting}
 * />
 * ```
 */
export function ExportButton({
  filters,
  onExportPdf,
  onExportCsv,
  isExporting = false,
  className,
}: ExportButtonProps) {
  const [includeTranscripts, setIncludeTranscripts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Handle CSV export
  const handleCsvExport = useCallback(async () => {
    setIsOpen(false);
    if (onExportCsv) {
      try {
        await onExportCsv();
        toast.success('CSV export started');
      } catch (error) {
        toast.error('Failed to export CSV', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [onExportCsv]);

  // Handle PDF export
  const handlePdfExport = useCallback(async () => {
    setIsOpen(false);
    if (onExportPdf) {
      try {
        await onExportPdf(includeTranscripts);
        toast.success('PDF export started');
      } catch (error) {
        toast.error('Failed to export PDF', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [onExportPdf, includeTranscripts]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting}
          className={className}
          data-testid="export-button"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" data-testid="export-dropdown">
        {/* CSV Export Option (AC-20.4.7) */}
        <DropdownMenuItem
          onClick={handleCsvExport}
          disabled={isExporting}
          data-testid="export-csv-option"
        >
          <Table className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Export as CSV</span>
            <span className="text-xs text-muted-foreground">
              Spreadsheet format for data analysis
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* PDF Export Section (AC-20.4.7) */}
        <div className="px-2 py-1.5">
          <div
            className="flex items-start gap-2 cursor-pointer hover:bg-accent rounded-sm p-2 -mx-1"
            onClick={handlePdfExport}
            data-testid="export-pdf-option"
          >
            <FileText className="h-4 w-4 mt-0.5" />
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">Export as PDF</span>
              <span className="text-xs text-muted-foreground">
                Formatted report with compliance header
              </span>
            </div>
          </div>

          {/* Include transcripts checkbox (AC-20.4.7) */}
          <div
            className="flex items-center gap-2 ml-6 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              id="includeTranscripts"
              checked={includeTranscripts}
              onCheckedChange={(checked) => setIncludeTranscripts(checked === true)}
              disabled={isExporting}
              data-testid="include-transcripts-checkbox"
            />
            <Label
              htmlFor="includeTranscripts"
              className="text-xs cursor-pointer"
            >
              Include full transcripts
            </Label>
          </div>

          {includeTranscripts && (
            <p className="text-xs text-amber-600 dark:text-amber-400 ml-6 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              May take longer for large exports
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
