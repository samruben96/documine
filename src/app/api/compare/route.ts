import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { extractQuoteData } from '@/lib/compare/extraction';
import { log } from '@/lib/utils/logger';
import type { ComparisonData, DocumentSummary } from '@/types/compare';
import type { Json } from '@/types/database.types';

/**
 * Compare API Endpoint
 *
 * Story 7.1: AC-7.1.7 - Create comparison and navigate
 * Story 7.2: AC-7.2.1, AC-7.2.7, AC-7.2.8 - Trigger extraction and handle results
 *
 * Creates a new comparison record, triggers parallel extraction for all documents,
 * and returns the comparison ID. Extraction happens asynchronously after response.
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
      .select('id, status, filename')
      .in('id', documentIds)
      .eq('agency_id', agencyId);

    if (docError) {
      log.warn('Failed to fetch documents', { error: docError.message });
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

    // Build initial comparison data
    const documentSummaries: DocumentSummary[] = documents.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      carrierName: null,
      extractedAt: '',
      extracted: false,
    }));

    const initialComparisonData: ComparisonData = {
      status: 'processing',
      documents: documentSummaries,
      createdAt: new Date().toISOString(),
    };

    // Create comparison record
    const { data: comparison, error: insertError } = await supabase
      .from('comparisons')
      .insert({
        agency_id: agencyId,
        user_id: user.id,
        document_ids: documentIds,
        comparison_data: initialComparisonData as unknown as Json,
      })
      .select('id')
      .single();

    if (insertError) {
      log.warn('Failed to create comparison', { error: insertError.message });
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create comparison' } },
        { status: 500 }
      );
    }

    const comparisonId = comparison.id;

    log.info('Comparison created, starting extraction', {
      comparisonId,
      documentCount: documentIds.length,
    });

    // Start extraction asynchronously (don't await - let it run in background)
    // The comparison page will poll for status updates
    runExtractionAsync(supabase, comparisonId, agencyId, documentIds, documents);

    return NextResponse.json({
      comparisonId,
      status: 'processing',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Compare API error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * Run extraction for all documents in parallel.
 * Updates comparison_data as each extraction completes.
 *
 * AC-7.2.7: Parallel extraction for performance
 * AC-7.2.8: Handle partial failures gracefully
 */
async function runExtractionAsync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comparisonId: string,
  agencyId: string,
  documentIds: string[],
  documents: { id: string; filename: string; status: string }[]
): Promise<void> {
  const startTime = Date.now();

  log.info('Starting parallel extraction', {
    comparisonId,
    documentCount: documentIds.length,
  });

  // Run all extractions in parallel
  const extractionPromises = documentIds.map(async (documentId) => {
    try {
      return await extractQuoteData(supabase, documentId, agencyId);
    } catch (error) {
      log.warn('Extraction failed for document', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        cached: false,
        error: {
          code: 'API_ERROR' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
          documentId,
        },
      };
    }
  });

  const results = await Promise.all(extractionPromises);

  // Build updated comparison data
  const updatedDocuments: DocumentSummary[] = documents.map((doc, index) => {
    const result = results[index];
    if (result?.success && result.extraction) {
      return {
        id: doc.id,
        filename: doc.filename,
        carrierName: result.extraction.carrierName,
        extractedAt: result.extraction.extractedAt,
        extracted: true,
      };
    } else {
      return {
        id: doc.id,
        filename: doc.filename,
        carrierName: null,
        extractedAt: '',
        extracted: false,
        error: result?.error?.message ?? 'Extraction failed',
      };
    }
  });

  // Collect successful extractions
  const extractions = results
    .filter((r) => r?.success && r.extraction)
    .map((r) => r.extraction!);

  // Determine overall status
  const successCount = results.filter((r) => r?.success).length;
  let status: ComparisonData['status'];
  if (successCount === documentIds.length) {
    status = 'complete';
  } else if (successCount > 0) {
    status = 'partial';
  } else {
    status = 'failed';
  }

  const updatedComparisonData: ComparisonData = {
    status,
    documents: updatedDocuments,
    extractions,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  // Update comparison record
  const { error: updateError } = await supabase
    .from('comparisons')
    .update({
      comparison_data: updatedComparisonData as unknown as Json,
    })
    .eq('id', comparisonId);

  const duration = Date.now() - startTime;

  if (updateError) {
    log.warn('Failed to update comparison after extraction', {
      comparisonId,
      error: updateError.message,
    });
  } else {
    log.info('Extraction complete', {
      comparisonId,
      status,
      successCount,
      totalCount: documentIds.length,
      duration,
    });
  }
}
