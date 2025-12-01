/**
 * Stale Job Detection Service
 *
 * Detects and marks processing jobs that have been running too long.
 * Jobs in 'processing' state for >10 minutes are considered stale.
 *
 * Implements AC-4.7.5: Stale Job Detection
 *
 * @module @/lib/documents/stale-detection
 */

import { createServiceClient } from '@/lib/supabase/server';

/** Stale threshold in minutes */
const STALE_THRESHOLD_MINUTES = 10;

export interface StaleJobResult {
  markedFailed: number;
  success: boolean;
  error?: string;
}

/**
 * Mark stale jobs as failed.
 *
 * Calls the database function that:
 * 1. Finds jobs in 'processing' state for >10 minutes
 * 2. Updates their status to 'failed' with timeout message
 * 3. Updates associated documents to 'failed' status
 *
 * @returns Number of jobs marked as failed
 */
export async function markStaleJobsAsFailed(): Promise<StaleJobResult> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc('mark_stale_jobs_failed');

  if (error) {
    console.error('Failed to mark stale jobs:', { error: error.message });
    return {
      markedFailed: 0,
      success: false,
      error: error.message,
    };
  }

  const count = (data as number) ?? 0;

  if (count > 0) {
    console.log(`Marked ${count} stale job(s) as failed`);
  }

  return {
    markedFailed: count,
    success: true,
  };
}

/**
 * Get list of currently stale jobs (for monitoring).
 *
 * Returns jobs that are in 'processing' state and started more than
 * STALE_THRESHOLD_MINUTES ago.
 *
 * @returns List of stale job IDs and their details
 */
export async function getStaleJobs(): Promise<{
  jobs: Array<{
    id: string;
    documentId: string;
    startedAt: string;
    minutesStale: number;
  }>;
  error?: string;
}> {
  const serviceClient = createServiceClient();

  const staleTime = new Date(
    Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await serviceClient
    .from('processing_jobs')
    .select('id, document_id, started_at')
    .eq('status', 'processing')
    .lt('started_at', staleTime);

  if (error) {
    return { jobs: [], error: error.message };
  }

  const jobs = (data ?? []).map((job) => {
    const startedAt = new Date(job.started_at ?? '');
    const minutesStale = Math.floor(
      (Date.now() - startedAt.getTime()) / (60 * 1000)
    );

    return {
      id: job.id,
      documentId: job.document_id,
      startedAt: job.started_at ?? '',
      minutesStale,
    };
  });

  return { jobs };
}

/**
 * Get stale detection configuration.
 *
 * @returns Current threshold configuration
 */
export function getStaleConfig(): { thresholdMinutes: number } {
  return {
    thresholdMinutes: STALE_THRESHOLD_MINUTES,
  };
}
