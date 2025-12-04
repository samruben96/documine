import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import { z } from 'zod';
import type { DocumentType } from '@/types';

/**
 * Document API Endpoint (by ID)
 *
 * Story F2-2: Update document type (quote | general)
 * Story F2-5: Update ai_tags
 *
 * PATCH: Update document_type or ai_tags fields
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod schema for PATCH request body
// At least one field must be provided
const updateDocumentSchema = z.object({
  document_type: z.enum(['quote', 'general']).optional(),
  ai_tags: z.array(z.string().max(30)).max(10).optional(),
}).refine(
  (data) => data.document_type !== undefined || data.ai_tags !== undefined,
  { message: 'At least one field (document_type or ai_tags) must be provided' }
);

/**
 * Update document (type and/or tags)
 *
 * AC-F2-2.4: Type change persists immediately
 * AC-F2-5.4: Tags save automatically on change
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

    const parseResult = updateDocumentSchema.safeParse(body);
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

    const { document_type, ai_tags } = parseResult.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (document_type !== undefined) {
      updateData.document_type = document_type;
    }
    if (ai_tags !== undefined) {
      updateData.ai_tags = ai_tags;
    }

    // Update document - RLS ensures agency scope
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('agency_id', agencyId)
      .select('id, document_type, ai_tags')
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

      log.warn('Failed to update document', {
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

    log.info('Document updated', {
      documentId,
      updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at'),
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        id: updatedDoc.id,
        document_type: updatedDoc.document_type as DocumentType | null,
        ai_tags: updatedDoc.ai_tags as string[] | null,
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
