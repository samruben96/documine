'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { FileText, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import { DocumentTypeBadge } from './document-type-badge';
import type { DocumentType } from '@/types';

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
}

interface DocumentTableProps {
  documents: DocumentTableRow[];
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
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
export function DocumentTable({ documents, onRename, onDelete }: DocumentTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }, // Default: newest first
  ]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<DocumentTableRow>[]>(
    () => [
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
        cell: ({ row }) => (
          <DocumentStatusBadge status={row.original.status as DocumentStatusType} />
        ),
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
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
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
    [hoveredRowId, router, onRename, onDelete]
  );

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
