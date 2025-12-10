/**
 * Audit Log Table Component
 * Story 20.4: Audit Log Interface
 *
 * Table component displaying audit log entries with pagination.
 * AC-20.4.1: Columns: date/time, user, project, conversation title, message count, guardrail badge
 * AC-20.4.3: Paginated at 25 per page with total count displayed
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, ShieldAlert, AlertCircle } from 'lucide-react';
import type { AuditLogTableEntry } from '@/app/api/admin/audit-logs/route';

export interface AuditLogTableProps {
  /** Audit log entries to display */
  entries: AuditLogTableEntry[];
  /** Total number of entries (for pagination) */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Callback when row is clicked */
  onRowClick: (entry: AuditLogTableEntry) => void;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback to retry on error */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format timestamp for table display
 */
function formatDateTime(isoString: string): string {
  try {
    return format(new Date(isoString), 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
}

/**
 * Truncate text for display
 */
function truncateText(text: string | null, maxLength: number = 30): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Time</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Conversation</TableHead>
          <TableHead className="text-center">Messages</TableHead>
          <TableHead className="text-center">Guardrails</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="audit-log-empty"
    >
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No audit log entries</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Audit log entries will appear here when activity occurs.
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="audit-log-error"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium">Failed to load audit logs</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {error.message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Pagination controls component
 */
function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className="flex items-center justify-between px-2 py-4"
      data-testid="pagination-controls"
    >
      <p className="text-sm text-muted-foreground" data-testid="pagination-info">
        Showing {start} to {end} of {total} entries
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          data-testid="prev-page-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="page-indicator">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          data-testid="next-page-btn"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Audit Log Table component
 *
 * @example
 * ```tsx
 * <AuditLogTable
 *   entries={logs}
 *   total={100}
 *   page={1}
 *   pageSize={25}
 *   totalPages={4}
 *   isLoading={false}
 *   error={null}
 *   onRowClick={(entry) => setSelectedEntry(entry)}
 *   onPageChange={(page) => setPage(page)}
 * />
 * ```
 */
export function AuditLogTable({
  entries,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRowClick,
  onPageChange,
  onRetry,
  className,
}: AuditLogTableProps) {
  // Loading state
  if (isLoading && entries.length === 0) {
    return (
      <div className={className} data-testid="audit-log-table-loading">
        <TableSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={className} data-testid="audit-log-table">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead>Conversation</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Messages</TableHead>
              <TableHead className="text-center">Guardrails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(entry)}
                data-testid={`audit-log-row-${entry.id}`}
              >
                {/* Date/Time */}
                <TableCell className="text-muted-foreground">
                  {formatDateTime(entry.loggedAt)}
                </TableCell>

                {/* User */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium" title={entry.userEmail}>
                      {truncateText(entry.userName || entry.userEmail, 25)}
                    </span>
                    {entry.userName && (
                      <span className="text-xs text-muted-foreground" title={entry.userEmail}>
                        {truncateText(entry.userEmail, 20)}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Project */}
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {truncateText(entry.projectName, 20)}
                </TableCell>

                {/* Conversation Title */}
                <TableCell>
                  <span title={entry.conversationTitle || undefined}>
                    {truncateText(entry.conversationTitle, 30)}
                  </span>
                </TableCell>

                {/* Message Count */}
                <TableCell className="text-center hidden sm:table-cell">
                  {entry.messageCount > 0 ? (
                    <Badge variant="secondary" className="min-w-[2rem]">
                      {entry.messageCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Guardrail Events Badge */}
                <TableCell className="text-center">
                  {entry.guardrailEventCount > 0 ? (
                    <Badge
                      variant="destructive"
                      className="gap-1"
                      data-testid="guardrail-badge"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      {entry.guardrailEventCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (AC-20.4.3) */}
      {total > pageSize && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
