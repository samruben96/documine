'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { FileText, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Note: Using native button for dropdown trigger to avoid shadcn Button/Radix conflict
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import { DocumentTypeBadge } from './document-type-badge';
import { ExtractionStatusBadge } from './extraction-status-badge';
import { ProcessingProgress } from './processing-progress';
import type { DocumentType, ExtractionStatus } from '@/types';
import type { ProgressData } from '@/hooks/use-processing-progress';

export interface DocumentTableRow {
  id: string;
  filename: string;
  display_name: string | null;
  status: string;
  page_count: number | null;
  created_at: string;
  document_type: DocumentType | null;
  ai_tags: string[] | null;
  ai_summary: string | null;
  /** Story 10.12: Carrier name from extraction_data */
  carrier_name: string | null;
  /** Story 10.12: Annual premium from extraction_data */
  annual_premium: number | null;
  /** Story 11.5: Error message for failed documents */
  error_message?: string | null;
  /** Story 11.8: Extraction status for quote analysis */
  extraction_status?: ExtractionStatus | null;
}

interface DocumentTableProps {
  documents: DocumentTableRow[];
  /** Story 11.2: Progress data map for processing documents (documentId -> ProgressData) */
  progressMap?: Map<string, ProgressData>;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Story 11.8: Retry extraction for failed documents */
  onRetryExtraction?: (id: string) => void;
  /** Story 11.8: Set of document IDs currently retrying extraction */
  retryingExtractionIds?: Set<string>;
  /** Enable row selection with checkboxes */
  enableSelection?: boolean;
  /** Callback when selected rows change (provides array of selected document IDs) */
  onSelectionChange?: (selectedIds: string[]) => void;
}

/**
 * Document Table Component
 *
 * Story F2-6: Document Library Table View
 * Implements:
 * - AC-F2-6.1: Table with columns: Name, Type, Status, Tags, Date, Pages
 * - AC-F2-6.2: Sortable columns
 * - AC-F2-6.3: Tags with overflow indicator
 * - AC-F2-6.4: Row hover reveals actions
 * - AC-F2-6.5: Row click navigates to viewer
 * - AC-F2-6.6: Sticky header
 */
export function DocumentTable({
  documents,
  progressMap,
  onRename,
  onDelete,
  onRetryExtraction,
  retryingExtractionIds,
  enableSelection = false,
  onSelectionChange,
}: DocumentTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }, // Default: newest first
  ]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo<ColumnDef<DocumentTableRow>[]>(
    () => [
      // Checkbox column for row selection
      ...(enableSelection
        ? [
            {
              id: 'select',
              header: ({ table }: { table: ReturnType<typeof useReactTable<DocumentTableRow>> }) => (
                <Checkbox
                  checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                  }
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                  onClick={(e) => e.stopPropagation()}
                />
              ),
              cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value?: boolean) => void } }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Select row"
                  className="translate-y-[2px]"
                  onClick={(e) => e.stopPropagation()}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<DocumentTableRow>,
          ]
        : []),
      {
        accessorKey: 'filename',
        header: ({ column }) => (
          <SortableHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.original.display_name || row.original.filename;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
                    {name}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <p className="break-all">{name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.display_name || rowA.original.filename;
          const b = rowB.original.display_name || rowB.original.filename;
          return a.localeCompare(b);
        },
      },
      {
        accessorKey: 'document_type',
        header: ({ column }) => (
          <SortableHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <DocumentTypeBadge type={row.original.document_type} />
        ),
        sortingFn: (rowA, rowB) => {
          // Quote before General, null last
          const order = { quote: 0, general: 1, null: 2 };
          const a = order[rowA.original.document_type ?? 'null'] ?? 2;
          const b = order[rowB.original.document_type ?? 'null'] ?? 2;
          return a - b;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <SortableHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const progressData = progressMap?.get(row.original.id);

          // Story 11.2: Show detailed progress bar for processing documents
          if (status === 'processing' && progressData) {
            return <ProcessingProgress progressData={progressData} className="min-w-[140px]" />;
          }

          // Story 11.5 (AC-11.5.3, AC-11.5.5): Pass error message for user-friendly display
          return (
            <DocumentStatusBadge
              status={status as DocumentStatusType}
              errorMessage={row.original.error_message || undefined}
            />
          );
        },
      },
      // Story 11.8: Analysis column for extraction status (AC-11.8.5)
      {
        accessorKey: 'extraction_status',
        header: ({ column }) => (
          <SortableHeader column={column} title="Analysis" />
        ),
        cell: ({ row }) => {
          const doc = row.original;
          // Only show for ready quote documents
          if (doc.status !== 'ready' || doc.document_type === 'general') {
            return <span className="text-slate-400 text-xs">—</span>;
          }
          const isRetrying = retryingExtractionIds?.has(doc.id) ?? false;
          return (
            <ExtractionStatusBadge
              status={doc.extraction_status || null}
              documentType={doc.document_type}
              onRetry={onRetryExtraction ? () => onRetryExtraction(doc.id) : undefined}
              isRetrying={isRetrying}
            />
          );
        },
        sortingFn: (rowA, rowB) => {
          // Sort order: complete/skipped first, extracting, pending, failed last
          const order: Record<ExtractionStatus | 'null', number> = {
            complete: 0,
            skipped: 0,
            extracting: 1,
            pending: 2,
            failed: 3,
            null: 2, // Treat null as pending
          };
          const statusA = rowA.original.extraction_status || 'null';
          const statusB = rowB.original.extraction_status || 'null';
          const a = order[statusA as keyof typeof order] ?? 2;
          const b = order[statusB as keyof typeof order] ?? 2;
          return a - b;
        },
      },
      {
        accessorKey: 'ai_tags',
        header: 'Tags',
        enableSorting: false,
        cell: ({ row }) => {
          const tags = row.original.ai_tags || [];
          if (tags.length === 0) {
            return <span className="text-slate-400 text-xs">—</span>;
          }
          const visibleTags = tags.slice(0, 3);
          const remaining = tags.length - 3;
          const allTags = tags.join(', ');

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                  {visibleTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[80px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {remaining > 0 && (
                    <span className="text-[10px] text-slate-400">+{remaining}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{allTags}</p>
                {row.original.ai_summary && (
                  <p className="text-xs text-slate-400 mt-1 border-t pt-1">
                    {row.original.ai_summary}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      // Story 10.12: Carrier column from extraction_data
      {
        accessorKey: 'carrier_name',
        header: ({ column }) => (
          <SortableHeader column={column} title="Carrier" />
        ),
        cell: ({ row }) => {
          const carrier = row.original.carrier_name;
          const premium = row.original.annual_premium;

          if (!carrier && !premium) {
            return <span className="text-slate-400 text-xs">—</span>;
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0">
                  {carrier && (
                    <span className="truncate max-w-[120px] text-sm text-slate-700 dark:text-slate-300 block">
                      {carrier}
                    </span>
                  )}
                  {premium && (
                    <span className="text-xs text-slate-500">
                      ${premium.toLocaleString()}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {carrier && <span className="font-medium">{carrier}</span>}
                  {carrier && premium && ' — '}
                  {premium && <span>Premium: ${premium.toLocaleString()}/yr</span>}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.carrier_name || '';
          const b = rowB.original.carrier_name || '';
          return a.localeCompare(b);
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <SortableHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {formatRelativeDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: 'page_count',
        header: ({ column }) => (
          <SortableHeader column={column} title="Pages" />
        ),
        cell: ({ row }) => {
          const count = row.original.page_count;
          return (
            <span className="text-sm text-slate-500">
              {count !== null && count !== undefined ? count : '—'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isHovered = hoveredRowId === row.original.id;
          return (
            <div
              className={cn(
                'flex items-center justify-end gap-1 transition-opacity',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat-docs/${row.original.id}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  {onRename && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(row.original.id);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row.original.id);
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [hoveredRowId, router, progressMap, onRename, onDelete, onRetryExtraction, retryingExtractionIds, enableSelection]
  );

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting, rowSelection },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id, // Use document ID as row ID
  });

  // Track previous selection to avoid infinite loops
  const prevSelectedIdsRef = useRef<string[]>([]);

  // Notify parent when selection changes
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = useMemo(
    () => selectedRows.map((row) => row.original.id),
    [selectedRows]
  );

  // Notify parent when selection changes (after render, not during)
  // Only call if selection actually changed to avoid infinite loops
  useEffect(() => {
    if (!enableSelection || !onSelectionChange) return;

    const prev = prevSelectedIdsRef.current;
    const hasChanged =
      prev.length !== selectedIds.length ||
      prev.some((id, i) => id !== selectedIds[i]);

    if (hasChanged) {
      prevSelectedIdsRef.current = selectedIds;
      onSelectionChange(selectedIds);
    }
  }, [enableSelection, onSelectionChange, selectedIds]);

  const handleRowClick = (documentId: string) => {
    router.push(`/chat-docs/${documentId}`);
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <span className="text-slate-500">No documents found</span>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-testid="document-row"
                onClick={() => handleRowClick(row.original.id)}
                onMouseEnter={() => setHoveredRowId(row.original.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRowClick(row.original.id);
                  }
                }}
                tabIndex={0}
                className={cn(
                  'cursor-pointer transition-colors',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Sortable column header with sort indicator
 */
function SortableHeader({
  column,
  title,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void };
  title: string;
}) {
  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors -ml-2 px-2 py-1 rounded"
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}
