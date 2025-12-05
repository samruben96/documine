'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Story 11.4: Queue Summary for last 24 hours
 */
interface QueueSummary {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface ProcessingQueueSummaryProps {
  /** Optional CSS class name */
  className?: string;
  /** Agency ID to filter queue (optional, uses current user's agency if not provided) */
  agencyId?: string;
}

/**
 * Story 11.4 (AC-11.4.3): Processing Queue Summary Component
 *
 * Shows total documents in agency's queue with status breakdown:
 * - Pending (waiting in queue)
 * - Processing (actively being processed)
 * - Completed (last 24 hours)
 * - Failed (last 24 hours)
 *
 * Features:
 * - Realtime updates via Supabase postgres_changes
 * - Collapsible details section
 * - Only visible when there's activity (pending/processing/failed)
 */
export function ProcessingQueueSummary({ className, agencyId }: ProcessingQueueSummaryProps) {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    const supabase = createClient();

    // Get jobs from last 24 hours for this agency
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('processing_jobs')
      .select('status')
      .gte('created_at', twentyFourHoursAgo);

    // Filter by agency if provided
    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch queue summary:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      const counts = data.reduce(
        (acc, job) => {
          const status = job.status as keyof QueueSummary;
          if (status in acc) {
            acc[status]++;
          }
          return acc;
        },
        { pending: 0, processing: 0, completed: 0, failed: 0 }
      );
      setSummary(counts);
    }
    setIsLoading(false);
  }, [agencyId]);

  // Fetch summary and set up realtime subscription
  useEffect(() => {
    fetchSummary();

    const supabase = createClient();
    let channel: RealtimeChannel;

    // Subscribe to processing_jobs changes for realtime updates
    channel = supabase
      .channel('queue-summary')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
        },
        (payload: RealtimePostgresChangesPayload<{ status: string }>) => {
          // Refetch summary on any change
          // This ensures we catch inserts, updates, and deletes
          fetchSummary();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSummary]);

  // Don't render if loading or no activity
  if (isLoading) return null;
  if (!summary) return null;

  const activeCount = summary.pending + summary.processing;
  const hasActivity = activeCount > 0 || summary.failed > 0;

  // Hide if no processing activity
  if (!hasActivity) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3',
        className
      )}
      data-testid="queue-summary"
    >
      {/* Summary header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-sm"
        aria-expanded={isExpanded}
        aria-controls="queue-details"
      >
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Processing Queue
        </span>
        <div className="flex items-center gap-3">
          {/* Quick summary badges */}
          {summary.pending > 0 && (
            <span
              className="flex items-center gap-1 text-amber-600"
              data-testid="queue-pending-count"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{summary.pending}</span>
            </span>
          )}

          {summary.processing > 0 && (
            <span
              className="flex items-center gap-1 text-blue-600"
              data-testid="queue-processing-count"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{summary.processing}</span>
            </span>
          )}

          {summary.failed > 0 && (
            <span
              className="flex items-center gap-1 text-red-600"
              data-testid="queue-failed-count"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{summary.failed}</span>
            </span>
          )}

          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expandable details */}
      {isExpanded && (
        <div
          id="queue-details"
          className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3"
          data-testid="queue-details"
        >
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Pending */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">Waiting:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {summary.pending}
              </span>
            </div>

            {/* Processing */}
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-slate-600 dark:text-slate-400">Processing:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {summary.processing}
              </span>
            </div>

            {/* Completed (24h) */}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Completed (24h):</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {summary.completed}
              </span>
            </div>

            {/* Failed (24h) */}
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-slate-600 dark:text-slate-400">Failed:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {summary.failed}
              </span>
            </div>
          </div>

          {/* Estimated time hint */}
          {summary.pending > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2" data-testid="estimated-wait">
              Est. processing time: ~{summary.pending * 2} min for {summary.pending} document{summary.pending !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
