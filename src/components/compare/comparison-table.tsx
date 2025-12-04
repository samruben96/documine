'use client';

/**
 * ComparisonTable - Side-by-side Quote Comparison
 *
 * Story 7.3: AC-7.3.1 through AC-7.3.8
 * Story 7.5: AC-7.5.1, AC-7.5.5 - Source citations and inferred values
 *
 * Displays extracted quote data in a comparison table with:
 * - Sticky header row and first column
 * - Best/worst value indicators
 * - Difference highlighting
 * - Not found handling
 * - View source links (AC-7.5.1)
 * - Inferred value indicators (AC-7.5.5)
 *
 * @module @/components/compare/comparison-table
 */

import { useMemo } from 'react';
import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildComparisonRows,
  type ComparisonRow,
  type CellValue,
  type ComparisonTableData,
} from '@/lib/compare/diff';
import type { QuoteExtraction, DocumentSummary } from '@/types/compare';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Props
// ============================================================================

/**
 * Callback for when a source link is clicked.
 * AC-7.5.1: Opens document viewer modal to the source page.
 */
export interface SourceClickHandler {
  (documentId: string, pageNumber: number, documentIndex: number): void;
}

export interface ComparisonTableProps {
  /** Extracted quote data */
  extractions: QuoteExtraction[];
  /** Optional document info for fallback headers */
  documents?: DocumentSummary[];
  /** Optional className for container */
  className?: string;
  /** AC-7.5.1: Callback when "View source" is clicked */
  onSourceClick?: SourceClickHandler;
}

// ============================================================================
// Value Indicator Component
// ============================================================================

interface ValueIndicatorProps {
  /** 'best' or 'worst' */
  type: 'best' | 'worst';
}

function ValueIndicator({ type }: ValueIndicatorProps) {
  if (type === 'best') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="ml-1.5 text-green-600 dark:text-green-400 font-bold"
              aria-label="Best value"
            >
              ●
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Best value in this category</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="ml-1.5 text-red-500 dark:text-red-400"
            aria-label="Highest cost/lowest coverage"
          >
            ○
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Highest cost or lowest coverage</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Table Cell Component
// ============================================================================

interface TableCellProps {
  value: CellValue;
  isBest: boolean;
  isWorst: boolean;
  isFirstColumn?: boolean;
  /** AC-7.5.1: Document ID for source navigation */
  documentId?: string;
  /** AC-7.5.1: Document index in the comparison */
  documentIndex?: number;
  /** AC-7.5.1: Callback when "View source" is clicked */
  onSourceClick?: SourceClickHandler;
}

function TableCell({
  value,
  isBest,
  isWorst,
  isFirstColumn,
  documentId,
  documentIndex,
  onSourceClick,
}: TableCellProps) {
  const isNotFound = value.status === 'not_found';
  // AC-7.5.1: Show source link if we have source pages
  const hasSource = value.sourcePages && value.sourcePages.length > 0;
  // AC-7.5.5: Inferred value has data but no source
  const isInferred = value.status === 'found' && !hasSource;

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const firstPage = value.sourcePages?.[0];
    if (hasSource && documentId && documentIndex !== undefined && onSourceClick && firstPage !== undefined) {
      onSourceClick(documentId, firstPage, documentIndex);
    }
  };

  return (
    <td
      className={cn(
        'px-4 py-3 text-sm border-b border-r border-slate-200 dark:border-slate-700',
        isFirstColumn &&
          'sticky left-0 z-10 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 min-w-[180px]',
        !isFirstColumn && 'text-right min-w-[140px]',
        isNotFound && 'text-slate-400 dark:text-slate-500 italic'
      )}
    >
      <span className="flex items-center justify-end gap-1">
        {isFirstColumn ? (
          <span className="text-left w-full">{value.displayValue}</span>
        ) : (
          <>
            <span>{value.displayValue}</span>
            {isBest && <ValueIndicator type="best" />}
            {isWorst && <ValueIndicator type="worst" />}

            {/* AC-7.5.1: View source link */}
            {hasSource && onSourceClick && (
              <button
                onClick={handleSourceClick}
                className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="View source in document"
                title={`View on page ${value.sourcePages?.[0] ?? 1}`}
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </button>
            )}

            {/* AC-7.5.5: Inferred value indicator */}
            {isInferred && !isNotFound && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 opacity-40">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Value inferred from document context</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
      </span>
    </td>
  );
}

// ============================================================================
// Table Row Component
// ============================================================================

interface TableRowProps {
  row: ComparisonRow;
  /** Whether this is the first row in a category */
  isFirstInCategory?: boolean;
  /** AC-7.5.1: Document IDs for source navigation */
  documentIds?: string[];
  /** AC-7.5.1: Callback when "View source" is clicked */
  onSourceClick?: SourceClickHandler;
}

function TableRow({
  row,
  isFirstInCategory,
  documentIds,
  onSourceClick,
}: TableRowProps) {
  // AC-7.4.2: Gap/conflict styling
  const isGap = row.isGap;
  const isConflict = row.isConflict;
  const hasIssue = isGap || isConflict;

  return (
    <tr
      className={cn(
        // Difference highlighting
        row.hasDifference && 'bg-amber-50/50 dark:bg-amber-900/10',
        // AC-7.4.2: Gap row styling - amber background
        isGap && 'bg-amber-100/70 dark:bg-amber-900/30',
        // AC-7.4.2: Conflict row styling - red tint
        isConflict && 'bg-red-50/50 dark:bg-red-900/20',
        // Category spacing
        isFirstInCategory && 'border-t-2 border-t-slate-300 dark:border-t-slate-600',
        // Sub-row indentation
        row.isSubRow && 'text-slate-600 dark:text-slate-400'
      )}
      // AC-7.4.5: Data attribute for scroll targeting
      data-field={row.coverageType || row.id}
    >
      {/* Field name (sticky first column) */}
      <td
        className={cn(
          'px-4 py-3 text-sm border-b border-r border-slate-200 dark:border-slate-700',
          'sticky left-0 z-10 bg-white dark:bg-slate-900',
          'font-medium text-slate-700 dark:text-slate-300 min-w-[200px]',
          row.hasDifference && 'bg-amber-50/50 dark:bg-amber-900/10',
          // AC-7.4.2: Gap row first column styling
          isGap && 'bg-amber-100/70 dark:bg-amber-900/30',
          // AC-7.4.2: Conflict row first column styling
          isConflict && 'bg-red-50/50 dark:bg-red-900/20',
          row.isSubRow && 'pl-8'
        )}
      >
        <span className="flex items-center gap-2">
          {/* AC-7.4.2: Gap/conflict warning icon */}
          {hasIssue && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isGap && 'text-amber-600',
                      isConflict && 'text-red-500'
                    )}
                    aria-label={isGap ? 'Coverage gap' : 'Coverage conflict'}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isGap ? 'Coverage gap detected' : 'Conflict detected'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row.field}
        </span>
      </td>

      {/* Value cells - AC-7.5.1: Pass document info for source links */}
      {row.values.map((value, index) => (
        <TableCell
          key={`${row.id}-${index}`}
          value={value}
          isBest={row.bestIndex === index}
          isWorst={row.worstIndex === index}
          documentId={documentIds?.[index]}
          documentIndex={index}
          onSourceClick={onSourceClick}
        />
      ))}
    </tr>
  );
}

// ============================================================================
// Category Header Component
// ============================================================================

interface CategoryHeaderProps {
  category: ComparisonRow['category'];
  colSpan: number;
}

function CategoryHeader({ category, colSpan }: CategoryHeaderProps) {
  const labels: Record<ComparisonRow['category'], string> = {
    basic: 'Policy Details',
    coverage: 'Coverage Limits & Deductibles',
    exclusion: 'Exclusions',
    summary: 'Summary',
  };

  return (
    <tr className="bg-slate-100 dark:bg-slate-800">
      <th
        colSpan={colSpan}
        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
      >
        {labels[category]}
      </th>
    </tr>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ComparisonTable({
  extractions,
  documents,
  className,
  onSourceClick,
}: ComparisonTableProps) {
  // Build comparison data
  const tableData: ComparisonTableData = useMemo(
    () => buildComparisonRows(extractions, documents),
    [extractions, documents]
  );

  // AC-7.5.1: Extract document IDs for source navigation
  const documentIds = useMemo(
    () => documents?.map((d) => d.id) ?? [],
    [documents]
  );

  // Group rows by category for section headers
  const rowsWithCategories = useMemo(() => {
    const result: { row: ComparisonRow; isFirstInCategory: boolean }[] = [];
    let lastCategory: ComparisonRow['category'] | null = null;

    for (const row of tableData.rows) {
      const isFirstInCategory = row.category !== lastCategory;
      result.push({ row, isFirstInCategory });
      lastCategory = row.category;
    }

    return result;
  }, [tableData.rows]);

  if (tableData.rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No comparison data available
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700',
        className
      )}
    >
      <table className="w-full border-collapse">
        {/* Sticky header */}
        <thead className="sticky top-0 z-20 bg-white dark:bg-slate-900">
          <tr>
            {/* Field column header */}
            <th
              scope="col"
              className={cn(
                'sticky left-0 z-30 bg-slate-50 dark:bg-slate-800',
                'px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300',
                'border-b-2 border-r border-slate-300 dark:border-slate-600 min-w-[200px]'
              )}
            >
              Field
            </th>

            {/* Carrier/quote headers */}
            {tableData.headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  'px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300',
                  'border-b-2 border-r border-slate-300 dark:border-slate-600 min-w-[140px]',
                  'bg-slate-50 dark:bg-slate-800'
                )}
              >
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                      'bg-primary/10 text-primary'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate max-w-[120px]">{header}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowsWithCategories.map(({ row, isFirstInCategory }) => (
            <TableRow
              key={row.id}
              row={row}
              isFirstInCategory={isFirstInCategory}
              documentIds={documentIds}
              onSourceClick={onSourceClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

