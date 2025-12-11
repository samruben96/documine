'use client';

/**
 * ReportDataTable Component
 * Epic 23: Flexible AI Reports - Story 23.6
 *
 * Interactive data table with sorting, filtering, and pagination.
 * AC-23.6.1: Data table displays all rows from uploaded file
 * AC-23.6.2: Columns are sortable (click header to toggle)
 * AC-23.6.3: Global filter/search with debounced input
 * AC-23.6.4: Pagination for large datasets
 * AC-23.6.5: Column-specific filters (numeric range, date range, text)
 * AC-23.6.6: "No results found" when filter matches zero rows
 * AC-23.6.7: Proper ARIA labels and keyboard navigation
 */

import { useState, useMemo, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { useDebouncedCallback } from 'use-debounce';
import {
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ReportDataTableProps {
  /** Column names from the report */
  columns: string[];
  /** Row data from the report */
  rows: Record<string, unknown>[];
  /** Enable sorting on columns */
  sortable?: boolean;
  /** Enable filtering on columns */
  filterable?: boolean;
}

type ColumnType = 'text' | 'number' | 'date';

interface ColumnMeta {
  type: ColumnType;
  name: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Infer column type from first non-null value
 */
function inferColumnType(
  rows: Record<string, unknown>[],
  columnName: string
): ColumnType {
  for (const row of rows) {
    const value = row[columnName];
    if (value === null || value === undefined) continue;

    // Check if number
    if (typeof value === 'number') return 'number';

    // Check if string that looks like a date
    if (typeof value === 'string') {
      // ISO date pattern or common date formats
      const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
      if (datePattern.test(value)) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return 'date';
      }

      // Check if it's a number string (e.g., currency)
      const numValue = parseFloat(value.replace(/[$,]/g, ''));
      if (!isNaN(numValue) && value.match(/^[$\d,.-]+$/)) return 'number';
    }

    return 'text';
  }
  return 'text';
}

/**
 * Format cell value for display.
 * AC-23.9.7: Null/undefined show "N/A" not "—", numbers with locale formatting
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    // Format with thousand separators and reasonable precision
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  // Handle currency strings - ensure they have proper formatting
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // If it looks like a currency value without formatting, format it
    if (/^\$?[\d,]+\.?\d*$/.test(trimmed)) {
      const num = parseFloat(trimmed.replace(/[$,]/g, ''));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(num);
      }
    }
    return trimmed;
  }
  return String(value);
}

/**
 * Get numeric value from cell (handles currency strings)
 */
function getNumericValue(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[$,]/g, ''));
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Sortable column header with sort indicator
 */
function SortableHeader({
  column,
  title,
  sortable,
}: {
  column: {
    getIsSorted: () => false | 'asc' | 'desc';
    toggleSorting: (desc?: boolean) => void;
  };
  title: string;
  sortable: boolean;
}) {
  const sorted = column.getIsSorted();

  if (!sortable) {
    return <span>{title}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          column.toggleSorting(sorted === 'asc');
        }
      }}
      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors -ml-2 px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Sort by ${title}${sorted ? ` (currently ${sorted === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Column filter popover
 */
function ColumnFilter({
  columnName,
  columnType,
  filterValue,
  onFilterChange,
}: {
  columnName: string;
  columnType: ColumnType;
  filterValue: unknown;
  onFilterChange: (value: unknown) => void;
}) {
  const hasFilter = filterValue !== undefined && filterValue !== '';
  const [localValue, setLocalValue] = useState<string>(
    typeof filterValue === 'string' ? filterValue : ''
  );
  const [minValue, setMinValue] = useState<string>(
    (filterValue as { min?: string })?.min ?? ''
  );
  const [maxValue, setMaxValue] = useState<string>(
    (filterValue as { max?: string })?.max ?? ''
  );

  const handleTextFilter = useDebouncedCallback((value: string) => {
    onFilterChange(value || undefined);
  }, 300);

  const handleRangeFilter = useCallback(() => {
    if (!minValue && !maxValue) {
      onFilterChange(undefined);
    } else {
      onFilterChange({ min: minValue, max: maxValue });
    }
  }, [minValue, maxValue, onFilterChange]);

  const clearFilter = () => {
    setLocalValue('');
    setMinValue('');
    setMaxValue('');
    onFilterChange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'ml-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            hasFilter && 'text-primary'
          )}
          aria-label={`Filter ${columnName}`}
        >
          <Filter className="h-3 w-3" aria-hidden="true" />
          {hasFilter && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-[8px]"
            >
              1
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Filter {columnName}</h4>

          {columnType === 'text' && (
            <Input
              type="text"
              placeholder="Contains..."
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                handleTextFilter(e.target.value);
              }}
              className="h-8 text-sm"
              data-testid={`filter-input-${columnName}`}
            />
          )}

          {columnType === 'number' && (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                onBlur={handleRangeFilter}
                className="h-8 text-sm"
                data-testid={`filter-min-${columnName}`}
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                onBlur={handleRangeFilter}
                className="h-8 text-sm"
                data-testid={`filter-max-${columnName}`}
              />
            </div>
          )}

          {columnType === 'date' && (
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Start date"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                onBlur={handleRangeFilter}
                className="h-8 text-sm"
                data-testid={`filter-date-start-${columnName}`}
              />
              <Input
                type="date"
                placeholder="End date"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                onBlur={handleRangeFilter}
                className="h-8 text-sm"
                data-testid={`filter-date-end-${columnName}`}
              />
            </div>
          )}

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="w-full text-xs"
            >
              Clear filter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReportDataTable displays interactive data from generated reports.
 *
 * AC-23.6.1: Displays all rows from uploaded file
 * AC-23.6.2: Sortable columns
 * AC-23.6.3: Global search with debounce
 * AC-23.6.4: Pagination for large datasets
 * AC-23.6.5: Column-specific filters
 * AC-23.6.6: No results state
 * AC-23.6.7: Accessibility
 */
export function ReportDataTable({
  columns,
  rows,
  sortable = true,
  filterable = true,
}: ReportDataTableProps) {
  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Debounced global search
  const debouncedSetGlobalFilter = useDebouncedCallback((value: string) => {
    setGlobalFilter(value);
  }, 300);

  const [searchInput, setSearchInput] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSetGlobalFilter(value);
  };

  const clearSearch = () => {
    setSearchInput('');
    setGlobalFilter('');
  };

  const clearAllFilters = () => {
    clearSearch();
    setColumnFilters([]);
  };

  // Infer column types
  const columnTypes = useMemo(() => {
    const types: Record<string, ColumnType> = {};
    for (const col of columns) {
      types[col] = inferColumnType(rows, col);
    }
    return types;
  }, [columns, rows]);

  // Build column definitions
  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((col) => ({
      accessorKey: col,
      header: ({ column }) => (
        <div className="flex items-center">
          <SortableHeader column={column} title={col} sortable={sortable} />
          {filterable && (
            <ColumnFilter
              columnName={col}
              columnType={columnTypes[col] ?? 'text'}
              filterValue={columnFilters.find((f) => f.id === col)?.value}
              onFilterChange={(value) => {
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== col);
                  if (value !== undefined) {
                    return [...filtered, { id: col, value }];
                  }
                  return filtered;
                });
              }}
            />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{formatCellValue(row.getValue(col))}</span>
      ),
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        const colType = columnTypes[columnId];

        // Text filter (substring match)
        if (typeof filterValue === 'string') {
          const cellStr = formatCellValue(value).toLowerCase();
          return cellStr.includes(filterValue.toLowerCase());
        }

        // Range filter (min/max)
        if (typeof filterValue === 'object' && filterValue !== null) {
          const { min, max } = filterValue as { min?: string; max?: string };

          if (colType === 'number') {
            const numValue = getNumericValue(value);
            if (numValue === null) return false;
            if (min && numValue < parseFloat(min)) return false;
            if (max && numValue > parseFloat(max)) return false;
            return true;
          }

          if (colType === 'date') {
            const dateValue = new Date(value as string);
            if (isNaN(dateValue.getTime())) return false;
            if (min && dateValue < new Date(min)) return false;
            if (max && dateValue > new Date(max)) return false;
            return true;
          }
        }

        return true;
      },
      meta: {
        type: columnTypes[col],
        name: col,
      } as ColumnMeta,
    }));
  }, [columns, columnTypes, sortable, filterable, columnFilters]);

  // Table instance
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // Search across all columns
      const searchStr = filterValue.toLowerCase();
      for (const col of columns) {
        const cellValue = formatCellValue(row.getValue(col)).toLowerCase();
        if (cellValue.includes(searchStr)) return true;
      }
      return false;
    },
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const totalRowCount = rows.length;
  const hasActiveFilters =
    globalFilter !== '' || columnFilters.length > 0;
  const showPagination = totalRowCount > pagination.pageSize;

  // Empty data state
  if (rows.length === 0) {
    return (
      <Card data-testid="report-data-table">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Data Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center h-32 text-slate-500"
            role="status"
            aria-label="No data available"
          >
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="report-data-table">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Data Table
          <span className="text-sm font-normal text-slate-500">
            {filteredRowCount === totalRowCount
              ? `${totalRowCount.toLocaleString()} rows`
              : `${filteredRowCount.toLocaleString()} of ${totalRowCount.toLocaleString()} rows`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global search (AC-23.6.3) */}
        {filterable && (
          <div className="relative max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search all columns..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
              data-testid="global-search-input"
              aria-label="Search all columns"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto"
          role="grid"
          aria-label="Report data table"
          aria-rowcount={filteredRowCount}
        >
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      aria-sort={
                        header.column.getIsSorted()
                          ? header.column.getIsSorted() === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                // No results state (AC-23.6.6)
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm text-slate-500">No results found</p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                          data-testid="clear-all-filters-button"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-testid="data-row"
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination (AC-23.6.4, AC-23.8.4: Mobile-friendly with touch targets) */}
        {showPagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            {/* Page size selector - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <span>Rows per page:</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  setPagination((prev) => ({
                    ...prev,
                    pageSize: Number(value),
                    pageIndex: 0,
                  }))
                }
              >
                <SelectTrigger
                  className="h-10 sm:h-8 w-16 min-h-[44px] sm:min-h-0"
                  data-testid="page-size-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="min-h-[44px] sm:min-h-0">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination controls - AC-23.8.4: 44px min touch targets on mobile */}
            <div className="flex items-center gap-1 sm:gap-1">
              <span className="text-sm text-slate-500 mr-2 whitespace-nowrap">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>

              {/* First/Last buttons hidden on mobile for simplicity */}
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
                data-testid="first-page-button"
              >
                <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] sm:min-h-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
                data-testid="previous-page-button"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] sm:min-h-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
                data-testid="next-page-button"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
                data-testid="last-page-button"
              >
                <ChevronsRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
