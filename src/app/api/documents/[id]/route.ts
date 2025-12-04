import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import { z } from 'zod';
import type { DocumentType } from '@/types';

/**
 * Document API Endpoint (by ID)
 *
 * Story F2-2: Update document type (quote | general)
 *
 * PATCH: Update document_type field
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod schema for PATCH request body
const updateDocumentTypeSchema = z.object({
  document_type: z.enum(['quote', 'general']),
});

/**
 * Update document type
 *
 * AC-F2-2.4: Type change persists immediately
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }

    const parseResult = updateDocumentTypeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { document_type } = parseResult.data;

    // Update document type - RLS ensures agency scope
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({ document_type, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('agency_id', agencyId)
      .select('id, document_type')
      .single();

    if (updateError) {
      // Check if it's a constraint violation
      if (updateError.code === '23514') {
        return NextResponse.json(
          {
            data: null,
            error: { code: 'INVALID_TYPE', message: 'Invalid document type. Must be "quote" or "general".' },
          },
          { status: 400 }
        );
      }

      log.warn('Failed to update document type', {
        documentId,
        error: updateError.message,
      });
      return NextResponse.json(
        { data: null, error: { code: 'DATABASE_ERROR', message: 'Failed to update document' } },
        { status: 500 }
      );
    }

    if (!updatedDoc) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    log.info('Document type updated', {
      documentId,
      documentType: document_type,
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        id: updatedDoc.id,
        document_type: updatedDoc.document_type as DocumentType,
      },
      error: null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Document PATCH error', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
