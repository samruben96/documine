import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Compare API Endpoint
 *
 * Story 7.1: AC-7.1.7 - Create comparison and navigate
 * Creates a new comparison record and validates document selection.
 */

// Request validation schema
const compareRequestSchema = z.object({
  documentIds: z
    .array(z.string().uuid())
    .min(2, 'Select at least 2 documents')
    .max(4, 'Maximum 4 documents can be compared'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
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
        { error: { code: 'NO_AGENCY', message: 'User not associated with an agency' } },
        { status: 403 }
      );
    }

    const agencyId = userData.agency_id;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = compareRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid request',
          },
        },
        { status: 400 }
      );
    }

    const { documentIds } = parseResult.data;

    // Validate all documents exist and belong to user's agency
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, status')
      .in('id', documentIds)
      .eq('agency_id', agencyId);

    if (docError) {
      console.error('Failed to fetch documents:', docError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to validate documents' } },
        { status: 500 }
      );
    }

    // Check all documents were found
    if (!documents || documents.length !== documentIds.length) {
      return NextResponse.json(
        {
          error: {
            code: 'DOCUMENTS_NOT_FOUND',
            message: 'One or more documents not found or not accessible',
          },
        },
        { status: 404 }
      );
    }

    // Check all documents are ready - AC-7.1.2
    const notReady = documents.filter((doc) => doc.status !== 'ready');
    if (notReady.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'DOCUMENTS_NOT_READY',
            message: 'All documents must be fully processed before comparison',
          },
        },
        { status: 400 }
      );
    }

    // Create comparison record
    const { data: comparison, error: insertError } = await supabase
      .from('comparisons')
      .insert({
        agency_id: agencyId,
        user_id: user.id,
        document_ids: documentIds,
        comparison_data: {
          status: 'processing',
          documents: documentIds.map((id) => ({ id, extracted: false })),
          createdAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create comparison:', insertError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create comparison' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comparisonId: comparison.id,
      status: 'processing',
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
