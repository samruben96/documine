'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ComparisonHistoryFilters, type HistoryFilters } from './comparison-history-filters';
import { ComparisonEmptyState } from './comparison-empty-state';
import type { ComparisonSummary, ListComparisonResponse } from '@/app/api/compare/route';

/**
 * Comparison History Component
 *
 * Story 7.7: AC-7.7.1, AC-7.7.2, AC-7.7.3, AC-7.7.6, AC-7.7.7, AC-7.7.8
 *
 * Displays history of user's comparisons with:
 * - Checkbox selection for bulk actions
 * - Date, documents, status columns
 * - Individual and bulk delete functionality
 * - Pagination (20 per page)
 * - Search and date range filtering
 */

interface ComparisonHistoryProps {
  /** Callback when user wants to create new comparison */
  onNewComparison: () => void;
}

type SortDirection = 'asc' | 'desc';

export function ComparisonHistory({ onNewComparison }: ComparisonHistoryProps) {
  const router = useRouter();

  // Data state
  const [comparisons, setComparisons] = useState<ComparisonSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    fromDate: '',
    toDate: '',
    preset: 'all',
  });
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selection state - AC-7.7.8
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete state - AC-7.7.3, AC-7.7.7
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  // Fetch comparisons
  const fetchComparisons = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');

      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.fromDate) {
        params.set('from', filters.fromDate);
      }
      if (filters.toDate) {
        params.set('to', filters.toDate);
      }

      const response = await fetch(`/api/compare?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comparisons');
      }

      const data: ListComparisonResponse = await response.json();

      // Client-side sort (API returns most recent first)
      let sorted = [...data.comparisons];
      if (sortDirection === 'asc') {
        sorted = sorted.reverse();
      }

      setComparisons(sorted);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparisons');
      toast.error('Failed to load comparison history');
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, sortDirection]);

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filters]);

  // Handle row click - AC-7.7.2
  const handleRowClick = (comparisonId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or delete button
    const target = event.target as HTMLElement;
    if (
      target.closest('[data-checkbox]') ||
      target.closest('[data-delete-button]') ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }
    router.push(`/compare/${comparisonId}`);
  };

  // Handle checkbox change - AC-7.7.8
  const handleCheckboxChange = (comparisonId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(comparisonId);
      } else {
        next.delete(comparisonId);
      }
      return next;
    });
  };

  // Handle select all - AC-7.7.8
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(comparisons.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Check if all visible rows are selected
  const allSelected = comparisons.length > 0 && comparisons.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Handle individual delete click - AC-7.7.3
  const handleDeleteClick = (comparisonId: string) => {
    setPendingDeleteIds([comparisonId]);
    setDeleteDialogOpen(true);
  };

  // Handle bulk delete click - AC-7.7.7
  const handleBulkDeleteClick = () => {
    setPendingDeleteIds(Array.from(selectedIds));
    setDeleteDialogOpen(true);
  };

  // Confirm delete - AC-7.7.3, AC-7.7.7
  const handleConfirmDelete = async () => {
    if (pendingDeleteIds.length === 0) return;

    setIsDeleting(true);
    // Optimistic UI: fade out rows immediately
    setFadingIds(new Set(pendingDeleteIds));

    try {
      let response: Response;

      if (pendingDeleteIds.length === 1) {
        // Single delete
        response = await fetch(`/api/compare/${pendingDeleteIds[0]}`, {
          method: 'DELETE',
        });
      } else {
        // Bulk delete
        response = await fetch('/api/compare', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: pendingDeleteIds }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to delete comparison(s)');
      }

      // Remove deleted items from state
      setComparisons((prev) => prev.filter((c) => !pendingDeleteIds.includes(c.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingDeleteIds.forEach((id) => next.delete(id));
        return next;
      });
      setTotalCount((prev) => prev - pendingDeleteIds.length);

      toast.success(
        pendingDeleteIds.length === 1
          ? 'Comparison deleted'
          : `${pendingDeleteIds.length} comparisons deleted`
      );
    } catch (err) {
      // Rollback: show rows again
      setFadingIds(new Set());
      toast.error('Failed to delete comparison(s)');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPendingDeleteIds([]);
      setFadingIds(new Set());
    }
  };

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // Get status badge - AC-7.7.1
  const getStatusBadge = (status: ComparisonSummary['status']) => {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="default" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="default" className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'processing':
      default:
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
    }
  };

  // Format document names with truncation - AC-7.7.1
  const formatDocumentNames = (names: string[]) => {
    const display = names.join(', ');
    if (display.length > 50) {
      return display.slice(0, 47) + '...';
    }
    return display;
  };

  // Loading state
  if (isLoading && comparisons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error && comparisons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="mt-4 text-slate-600">{error}</p>
        <Button onClick={fetchComparisons} variant="outline" className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  // Empty state - AC-7.7.5
  if (comparisons.length === 0 && !filters.search && !filters.fromDate && !filters.toDate) {
    return <ComparisonEmptyState onCreateComparison={onNewComparison} />;
  }

  return (
    <div className="space-y-4" data-testid="comparison-history">
      {/* Filters - AC-7.7.4 */}
      <ComparisonHistoryFilters filters={filters} onFilterChange={setFilters} />

      {/* Bulk action bar - AC-7.7.7 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected ({selectedIds.size})
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-slate-500">
        Showing {comparisons.length} of {totalCount} comparison{totalCount !== 1 ? 's' : ''}
      </div>

      {/* Table - AC-7.7.1 */}
      <div className="border rounded-lg overflow-hidden dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="w-10 px-3 py-3">
                <Checkbox
                  data-checkbox
                  checked={allSelected}
                  // Note: indeterminate handled via CSS or ref
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={handleToggleSort}
                  className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Date
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Documents
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="w-12 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {comparisons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No comparisons found matching your filters
                </td>
              </tr>
            ) : (
              comparisons.map((comparison) => {
                const isSelected = selectedIds.has(comparison.id);
                const isFading = fadingIds.has(comparison.id);

                return (
                  <tr
                    key={comparison.id}
                    onClick={(e) => handleRowClick(comparison.id, e)}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all',
                      isSelected && 'bg-primary/5',
                      isFading && 'opacity-50 pointer-events-none'
                    )}
                    aria-selected={isSelected}
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        data-checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(comparison.id, checked === true)
                        }
                        aria-label={`Select comparison from ${comparison.createdAt}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-sm text-slate-900 dark:text-slate-100"
                        title={new Date(comparison.createdAt).toLocaleString()}
                      >
                        {formatDistanceToNow(new Date(comparison.createdAt), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-sm text-slate-700 dark:text-slate-300"
                        title={comparison.documentNames.join(', ')}
                      >
                        {formatDocumentNames(comparison.documentNames)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(comparison.status)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        data-delete-button
                        onClick={() => handleDeleteClick(comparison.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete comparison"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - AC-7.7.6 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog - AC-7.7.3, AC-7.7.7 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comparison{pendingDeleteIds.length > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteIds.length === 1
                ? "Are you sure you want to delete this comparison? You'll need to re-run extraction to recreate it."
                : `Are you sure you want to delete ${pendingDeleteIds.length} comparisons? You'll need to re-run extraction to recreate them.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
