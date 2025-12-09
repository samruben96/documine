/**
 * Guardrail Enforcement Log Component
 * Story 19.2: Enforcement Logging
 *
 * Table component displaying guardrail enforcement events.
 * Shows User, Triggered Topic, Message Preview, and Date/Time.
 *
 * AC-19.2.3: Enforcement Log section in Guardrails admin
 * AC-19.2.4: Table with columns: User, Triggered Topic, Message Preview, Date/Time
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter, type DateRange } from './date-range-filter';
import { GuardrailLogDetail } from './guardrail-log-detail';
import { useGuardrailLogs } from '@/hooks/ai-buddy';
import type { GuardrailEnforcementEvent } from '@/types/ai-buddy';
import { format } from 'date-fns';
import { AlertCircle, ChevronDown, ShieldAlert } from 'lucide-react';

export interface GuardrailEnforcementLogProps {
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
 * Truncate email for display
 */
function truncateEmail(email: string, maxLength: number = 25): string {
  if (email.length <= maxLength) return email;
  return email.slice(0, maxLength - 3) + '...';
}

/**
 * Truncate message preview
 */
function truncateMessage(message: string, maxLength: number = 40): string {
  if (!message) return '-';
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 3) + '...';
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Triggered Topic</TableHead>
          <TableHead>Message Preview</TableHead>
          <TableHead>Date/Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
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
      data-testid="enforcement-log-empty"
    >
      <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No enforcement events</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Guardrail enforcement events will appear here when triggered.
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="enforcement-log-error"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium">Failed to load logs</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {error.message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

/**
 * Guardrail Enforcement Log component
 *
 * @example
 * ```tsx
 * <GuardrailEnforcementLog />
 * ```
 */
export function GuardrailEnforcementLog({ className }: GuardrailEnforcementLogProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: undefined,
    endDate: undefined,
  });

  // Selected log for detail view
  const [selectedEvent, setSelectedEvent] = useState<GuardrailEnforcementEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch logs with current filters
  const { logs, isLoading, error, totalCount, hasMore, loadMore, refetch } = useGuardrailLogs({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 20,
  });

  /**
   * Handle row click to show details
   */
  const handleRowClick = useCallback((event: GuardrailEnforcementEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  }, []);

  /**
   * Handle date range change
   */
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <div className={className} data-testid="guardrail-enforcement-log">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Enforcement Log</h3>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${totalCount} event${totalCount !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Content */}
      {isLoading && logs.length === 0 ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : logs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Triggered Topic</TableHead>
                  <TableHead className="hidden md:table-cell">Message Preview</TableHead>
                  <TableHead>Date/Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(event)}
                    data-testid={`log-row-${event.id}`}
                  >
                    <TableCell className="font-medium" title={event.userEmail}>
                      {truncateEmail(event.userEmail)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs font-medium">
                        {event.triggeredTopic}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground" title={event.messagePreview}>
                      {truncateMessage(event.messagePreview)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(event.loggedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
                data-testid="load-more-button"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail dialog */}
      <GuardrailLogDetail
        event={selectedEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
