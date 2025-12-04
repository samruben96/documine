'use client';

/**
 * Export Button Component
 *
 * Story 7.6: AC-7.6.1 - Export dropdown with PDF and CSV options
 * AC-7.6.6 - Loading state during export generation
 *
 * @module @/components/compare/export-button
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';

export interface ExportButtonProps {
  /** Callback when PDF export is clicked */
  onExportPdf: () => void;
  /** Callback when CSV export is clicked */
  onExportCsv: () => void;
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Which export type is in progress (for loading message) */
  exportType?: 'pdf' | 'csv' | null;
}

/**
 * Dropdown button for exporting comparison results.
 * AC-7.6.1: Dropdown with PDF and CSV options, styled consistently.
 * AC-7.6.6: Shows loading spinner and "Generating PDF..." during export.
 */
export function ExportButton({
  onExportPdf,
  onExportCsv,
  isExporting,
  exportType,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting}
          data-testid="export-button"
        >
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
      <DropdownMenuContent align="end" data-testid="export-dropdown">
        <DropdownMenuItem onClick={onExportPdf} data-testid="export-pdf-option">
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCsv} data-testid="export-csv-option">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
