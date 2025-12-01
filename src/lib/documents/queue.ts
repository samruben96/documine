/**
 * Queue Management Service
 *
 * Manages document processing queue with FIFO ordering per agency,
 * single active job constraint, and cross-agency parallelism.
 *
 * Implements AC-4.7.1 through AC-4.7.3
 *
 * @module @/lib/documents/queue
 */

import { createServiceClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

export type ProcessingJob = Tables<'processing_jobs'>;

export interface QueuePosition {
  position: number;
  isProcessing: boolean;
}

/**
 * Check if an agency can start processing a new job.
 *
 * Implements AC-4.7.2: Only one processing job per agency at a time.
 *
 * @param agencyId - Agency ID to check
 * @returns true if no active processing job exists for this agency
 */
export async function canProcessForAgency(agencyId: string): Promise<boolean> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc('has_active_processing_job', {
    p_agency_id: agencyId,
  });

  if (error) {
    console.error('Failed to check agency processing status:', {
      agencyId,
      error: error.message,
    });
    return false; // Fail safe - don't allow processing if check fails
  }

  // Returns true if there IS an active job, so we invert
  return data === false;
}

/**
 * Get the next pending job for an agency in FIFO order.
 *
 * Implements AC-4.7.1: FIFO Queue Processing per Agency
 * Uses FOR UPDATE SKIP LOCKED pattern via database function for concurrency safety.
 *
 * @param agencyId - Agency ID to get next job for
 * @returns Next pending job or null if none available
 */
export async function getNextPendingJob(
  agencyId: string
): Promise<ProcessingJob | null> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc('get_next_pending_job', {
    p_agency_id: agencyId,
  });

  if (error) {
    console.error('Failed to get next pending job:', {
      agencyId,
      error: error.message,
    });
    return null;
  }

  // RPC returns array, get first item
  const jobs = data as ProcessingJob[] | null;
  return jobs?.[0] ?? null;
}

/**
 * Get the queue position for a document's processing job.
 *
 * Implements AC-4.7.4: Queue Position Display
 *
 * @param documentId - Document ID to get queue position for
 * @returns Queue position info (-1 = not in queue, 0 = processing, 1+ = position)
 */
export async function getAgencyQueuePosition(
  documentId: string
): Promise<QueuePosition> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc('get_queue_position', {
    p_document_id: documentId,
  });

  if (error) {
    console.error('Failed to get queue position:', {
      documentId,
      error: error.message,
    });
    return { position: -1, isProcessing: false };
  }

  const position = data as number;
  return {
    position,
    isProcessing: position === 0,
  };
}

/**
 * Get all pending jobs for an agency in FIFO order.
 *
 * @param agencyId - Agency ID to get pending jobs for
 * @returns List of pending jobs ordered by created_at ASC
 */
export async function getPendingJobsForAgency(
  agencyId: string
): Promise<ProcessingJob[]> {
  const serviceClient = createServiceClient();

  // Use a join query to filter by agency
  const { data, error } = await serviceClient
    .from('processing_jobs')
    .select('*, documents!inner(agency_id)')
    .eq('status', 'pending')
    .eq('documents.agency_id', agencyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get pending jobs:', {
      agencyId,
      error: error.message,
    });
    return [];
  }

  // Extract just the processing_jobs fields (remove joined documents)
  return (data ?? []).map((item) => {
    const { documents: _documents, ...job } = item as ProcessingJob & {
      documents: unknown;
    };
    return job;
  });
}

/**
 * Claim a pending job for processing.
 *
 * Atomically updates job status from 'pending' to 'processing'.
 * Returns null if job is no longer pending (race condition).
 *
 * @param jobId - Job ID to claim
 * @returns Updated job or null if claim failed
 */
export async function claimJob(jobId: string): Promise<ProcessingJob | null> {
  const serviceClient = createServiceClient();

  // Use update with match on status to ensure atomic claim
  const { data, error } = await serviceClient
    .from('processing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'pending') // Only update if still pending
    .select()
    .single();

  if (error) {
    // No error logging - this is expected in race conditions
    return null;
  }

  return data;
}

/**
 * Get the agency ID for a document.
 *
 * @param documentId - Document ID
 * @returns Agency ID or null if not found
 */
export async function getDocumentAgencyId(
  documentId: string
): Promise<string | null> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('documents')
    .select('agency_id')
    .eq('id', documentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.agency_id;
}
