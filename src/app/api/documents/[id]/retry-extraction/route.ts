import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

/**
 * Extraction Retry API Endpoint
 *
 * Story 11.8: Retry failed extraction for ready documents
 *
 * POST: Retry extraction for a document with failed extraction_status
 * - Validates user permissions (must be in same agency)
 * - Invokes extract-quote-data edge function
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/[id]/retry-extraction
 *
 * AC-11.8.6: Retry extraction for documents that are ready but have failed extraction
 * - Document must be in 'ready' status (chat works)
 * - extraction_status must be 'failed'
 * - Invokes the extract-quote-data edge function
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
      log.warn('Extraction retry attempt without authentication', { documentId });
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
      .select('id, agency_id, status, extraction_status, filename, document_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      log.warn('Extraction retry attempted for non-existent document', {
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
      log.warn('Extraction retry attempted for document in different agency', {
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

    // Verify document is ready (chat works) but extraction failed
    if (document.status !== 'ready') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot retry extraction for document in '${document.status}' status. Use the document retry for failed processing.`,
          },
        },
        { status: 400 }
      );
    }

    if (document.extraction_status !== 'failed') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot retry extraction in '${document.extraction_status}' state. Only failed extractions can be retried.`,
          },
        },
        { status: 400 }
      );
    }

    // Skip general documents
    if (document.document_type === 'general') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: 'General documents do not require extraction.',
          },
        },
        { status: 400 }
      );
    }

    // Log the retry attempt
    log.info('Extraction retry initiated', {
      documentId,
      documentName: document.filename,
      userId: user.id,
      agencyId,
    });

    // Reset extraction status to pending before invoking
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extraction_status: 'pending',
        extraction_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      log.error('Failed to reset extraction status', updateError as Error, { documentId });
      return NextResponse.json(
        { data: null, error: { code: 'DATABASE_ERROR', message: 'Failed to reset extraction status' } },
        { status: 500 }
      );
    }

    // Invoke the extract-quote-data edge function
    const { error: invokeError } = await supabase.functions.invoke('extract-quote-data', {
      body: {
        documentId,
        agencyId,
      },
    });

    if (invokeError) {
      log.error('Failed to invoke extraction function', invokeError as Error, { documentId });
      // Revert status to failed
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: 'Failed to invoke extraction function',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return NextResponse.json(
        { data: null, error: { code: 'FUNCTION_ERROR', message: 'Failed to start extraction retry' } },
        { status: 500 }
      );
    }

    log.info('Extraction retry invoked successfully', {
      documentId,
      agencyId,
    });

    return NextResponse.json({
      data: { success: true, documentId },
      error: null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Extraction retry error', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
