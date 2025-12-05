import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

/**
 * Document Retry API Endpoint
 *
 * Story 11.3 (AC-11.3.3): Manual Retry for failed documents
 *
 * POST: Retry processing a failed document
 * - Validates user permissions (must be in same agency)
 * - Resets existing failed job or creates new job
 * - Updates document status to 'processing'
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/[id]/retry
 *
 * AC-11.3.3: Manual retry for failed documents
 * - "Retry" button shown for failed documents in UI
 * - Clicking retry creates new processing_job with retry_count from previous
 * - Admin can retry any failed document in their agency
 * - Retry resets document status to 'processing'
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('Retry attempt without authentication', { documentId });
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return NextResponse.json(
        { data: null, error: { code: 'NO_AGENCY', message: 'User not associated with an agency' } },
        { status: 403 }
      );
    }

    const agencyId = userData.agency_id;

    // Get document and verify agency ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, agency_id, status, filename')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      log.warn('Retry attempted for non-existent document', {
        documentId,
        userId: user.id,
        error: docError?.message,
      });
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    // Verify user's agency owns this document
    if (document.agency_id !== agencyId) {
      log.warn('Retry attempted for document in different agency', {
        documentId,
        userAgencyId: agencyId,
        documentAgencyId: document.agency_id,
        userId: user.id,
      });
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Document not found' } },
        { status: 404 }
      );
    }

    // Get the latest processing job for this document
    const { data: existingJob, error: jobError } = await supabase
      .from('processing_jobs')
      .select('id, status, retry_count, error_message')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobError) {
      log.error('Failed to fetch existing job', jobError, {
        documentId,
        userId: user.id,
      });
      return NextResponse.json(
        { data: null, error: { code: 'DATABASE_ERROR', message: 'Failed to check job status' } },
        { status: 500 }
      );
    }

    // Can only retry failed jobs (or no job at all)
    if (existingJob && existingJob.status !== 'failed') {
      log.warn('Retry attempted for non-failed job', {
        documentId,
        jobStatus: existingJob.status,
        userId: user.id,
      });
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot retry document in '${existingJob.status}' state. Only failed documents can be retried.`,
          },
        },
        { status: 400 }
      );
    }

    // Carry forward retry count from previous job
    const previousRetryCount = existingJob?.retry_count ?? 0;

    // Log the retry attempt
    log.info('Document retry initiated', {
      documentId,
      documentName: document.filename,
      userId: user.id,
      agencyId,
      previousRetryCount,
      previousError: existingJob?.error_message,
    });

    if (existingJob && existingJob.status === 'failed') {
      // Reset the existing failed job
      const { error: resetError } = await supabase
        .from('processing_jobs')
        .update({
          status: 'pending',
          stage: 'queued',
          progress_percent: 0,
          error_message: null,
          started_at: null,
          completed_at: null,
          updated_at: new Date().toISOString(),
          // Note: Don't increment retry_count here - that happens in stuck job detector
        })
        .eq('id', existingJob.id);

      if (resetError) {
        log.error('Failed to reset failed job', resetError, {
          documentId,
          jobId: existingJob.id,
        });
        return NextResponse.json(
          { data: null, error: { code: 'DATABASE_ERROR', message: 'Failed to retry processing' } },
          { status: 500 }
        );
      }

      log.info('Existing job reset for retry', {
        documentId,
        jobId: existingJob.id,
        previousRetryCount,
      });
    } else {
      // No existing job - create new one
      const { error: insertError } = await supabase.from('processing_jobs').insert({
        document_id: documentId,
        agency_id: agencyId,
        status: 'pending',
        stage: 'queued',
        progress_percent: 0,
        retry_count: 0,
      });

      if (insertError) {
        log.error('Failed to create new processing job', insertError, {
          documentId,
          agencyId,
        });
        return NextResponse.json(
          { data: null, error: { code: 'DATABASE_ERROR', message: 'Failed to create processing job' } },
          { status: 500 }
        );
      }

      log.info('New processing job created for retry', {
        documentId,
        agencyId,
      });
    }

    // Update document status to 'processing'
    const { error: docUpdateError } = await supabase
      .from('documents')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (docUpdateError) {
      log.warn('Failed to update document status', {
        documentId,
        error: docUpdateError.message,
      });
      // Don't fail the request - the job was created successfully
    }

    return NextResponse.json({
      data: { success: true, documentId },
      error: null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Document retry error', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
