import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { extractQuoteData } from '@/lib/compare/extraction';
import { log } from '@/lib/utils/logger';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import type { ComparisonData, DocumentSummary, QuoteExtraction, EXTRACTION_VERSION } from '@/types/compare';
import type { Json } from '@/types/database.types';
// Story 21.4: Audit logging for comparison actions
import { logComparisonCreated } from '@/lib/admin';

// Import extraction version to validate cached data
import { EXTRACTION_VERSION as CURRENT_EXTRACTION_VERSION } from '@/types/compare';

/**
 * Compare API Endpoint
 *
 * Story 7.1: AC-7.1.7 - Create comparison and navigate
 * Story 7.2: AC-7.2.1, AC-7.2.7, AC-7.2.8 - Trigger extraction and handle results
 * Story 7.7: AC-7.7.1, AC-7.7.4, AC-7.7.6, AC-7.7.7 - List and bulk delete comparisons
 *
 * GET: List comparisons with pagination, search, and date filtering
 * POST: Create a new comparison record with async extraction
 * DELETE: Bulk delete comparisons by IDs
 */

// ============================================================================
// Types
// ============================================================================

/** Summary of a comparison for history listing */
export interface ComparisonSummary {
  id: string;
  createdAt: string;
  status: 'processing' | 'complete' | 'partial' | 'failed';
  documentCount: number;
  documentNames: string[];
}

/** Response for listing comparisons */
export interface ListComparisonResponse {
  comparisons: ComparisonSummary[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ============================================================================
// GET - List Comparisons (Story 7.7)
// ============================================================================

/**
 * List comparisons with pagination, search, and date filtering.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search document filenames
 * - from: Date range start (ISO date)
 * - to: Date range end (ISO date)
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    // Build query - fetch all comparisons for this agency
    let query = supabase
      .from('comparisons')
      .select('id, document_ids, comparison_data, created_at', { count: 'exact' })
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    // Date range filter
    if (fromDate) {
      query = query.gte('created_at', `${fromDate}T00:00:00.000Z`);
    }
    if (toDate) {
      query = query.lte('created_at', `${toDate}T23:59:59.999Z`);
    }

    const { data: comparisons, error: fetchError, count } = await query;

    if (fetchError) {
      log.warn('Failed to fetch comparisons', { error: fetchError.message });
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch comparisons' } },
        { status: 500 }
      );
    }

    if (!comparisons || comparisons.length === 0) {
      return NextResponse.json({
        comparisons: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
      } satisfies ListComparisonResponse);
    }

    // Get all unique document IDs to fetch filenames
    const allDocIds = new Set<string>();
    for (const comp of comparisons) {
      for (const docId of comp.document_ids || []) {
        allDocIds.add(docId);
      }
    }

    // Fetch document filenames
    const { data: documents } = await supabase
      .from('documents')
      .select('id, filename, display_name')
      .in('id', Array.from(allDocIds));

    const docNameMap = new Map<string, string>();
    for (const doc of documents || []) {
      docNameMap.set(doc.id, doc.display_name || doc.filename);
    }

    // Build summaries
    let summaries: ComparisonSummary[] = comparisons.map((comp) => {
      const data = comp.comparison_data as unknown as ComparisonData;
      const docNames = (comp.document_ids || []).map(
        (id: string) => docNameMap.get(id) || 'Unknown'
      );

      return {
        id: comp.id,
        createdAt: comp.created_at || new Date().toISOString(),
        status: data?.status || 'processing',
        documentCount: (comp.document_ids || []).length,
        documentNames: docNames,
      };
    });

    // Client-side search filter (search in document names)
    if (search) {
      summaries = summaries.filter((s) =>
        s.documentNames.some((name) => name.toLowerCase().includes(search))
      );
    }

    // Pagination
    const totalCount = summaries.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedSummaries = summaries.slice(offset, offset + limit);

    return NextResponse.json({
      comparisons: paginatedSummaries,
      totalCount,
      page,
      totalPages,
    } satisfies ListComparisonResponse);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Compare list API error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

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

    // Check rate limit - AC-8.5.1: 10 comparisons per hour per agency
    const rateLimit = await checkRateLimit({
      entityType: RATE_LIMITS.compare.entityType,
      entityId: agencyId,
      endpoint: '/api/compare',
      limit: RATE_LIMITS.compare.limit,
      windowMs: RATE_LIMITS.compare.windowMs,
    });

    if (!rateLimit.allowed) {
      log.warn('Compare rate limit exceeded', {
        agencyId,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt.toISOString(),
      });
      return rateLimitExceededResponse(
        rateLimit,
        `Your agency has reached the comparison limit (${RATE_LIMITS.compare.limit} per hour). Please try again later.`
      );
    }

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
    // Story 10.12: Also fetch extraction_data for cache optimization
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, status, filename, extraction_data, extraction_version')
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

    // Story 21.4 (AC-21.4.2): Log comparison creation to audit trail
    await logComparisonCreated(
      agencyId,
      user.id,
      comparisonId,
      documentIds
    );

    // Start extraction asynchronously (don't await - let it run in background)
    // The comparison page will poll for status updates
    // Story 10.12: Pass extraction_data for cache optimization
    runExtractionAsync(supabase, comparisonId, agencyId, documentIds, documents as DocumentWithExtraction[]);

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

/** Document with optional pre-extracted data from upload processing (Story 10.12) */
interface DocumentWithExtraction {
  id: string;
  filename: string;
  status: string;
  extraction_data: Json | null;
  extraction_version: number | null;
}

/**
 * Run extraction for all documents in parallel.
 * Updates comparison_data as each extraction completes.
 *
 * AC-7.2.7: Parallel extraction for performance
 * AC-7.2.8: Handle partial failures gracefully
 * AC-10.12.5: Use pre-extracted data when available (cache hit optimization)
 */
async function runExtractionAsync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comparisonId: string,
  agencyId: string,
  documentIds: string[],
  documents: DocumentWithExtraction[]
): Promise<void> {
  const startTime = Date.now();

  // Story 10.12: Count cache hits vs misses for logging
  let cacheHits = 0;
  let cacheMisses = 0;

  log.info('Starting parallel extraction', {
    comparisonId,
    documentCount: documentIds.length,
  });

  // Run all extractions in parallel
  const extractionPromises = documentIds.map(async (documentId) => {
    // Story 10.12: Check for pre-extracted data first (cache hit)
    const doc = documents.find((d) => d.id === documentId);
    if (
      doc?.extraction_data &&
      doc.extraction_version === CURRENT_EXTRACTION_VERSION
    ) {
      cacheHits++;
      log.info('Using pre-extracted data (cache hit)', { documentId });
      return {
        success: true,
        cached: true,
        extraction: doc.extraction_data as unknown as QuoteExtraction,
      };
    }

    // Cache miss - run extraction
    cacheMisses++;
    log.info('Running extraction (cache miss)', {
      documentId,
      hasExtractionData: !!doc?.extraction_data,
      extractionVersion: doc?.extraction_version,
      currentVersion: CURRENT_EXTRACTION_VERSION,
    });

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
      cacheHits,
      cacheMisses,
    });
  }
}

// ============================================================================
// DELETE - Bulk Delete Comparisons (Story 7.7)
// ============================================================================

// Request validation schema for bulk delete
const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required').max(100, 'Maximum 100 IDs'),
});

/**
 * Bulk delete comparisons by IDs.
 *
 * AC-7.7.7: Delete multiple comparisons at once
 *
 * Request body: { ids: string[] }
 * Response: { success: true, deletedCount: number }
 */
export async function DELETE(request: NextRequest) {
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
    const parseResult = bulkDeleteSchema.safeParse(body);

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

    const { ids } = parseResult.data;

    // Delete comparisons - RLS ensures user can only delete their own
    const { error: deleteError, count } = await supabase
      .from('comparisons')
      .delete({ count: 'exact' })
      .in('id', ids)
      .eq('agency_id', agencyId)
      .eq('user_id', user.id);

    if (deleteError) {
      log.warn('Failed to delete comparisons', { error: deleteError.message, ids });
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to delete comparisons' } },
        { status: 500 }
      );
    }

    log.info('Bulk delete comparisons', {
      requestedCount: ids.length,
      deletedCount: count || 0,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      deletedCount: count || 0,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Compare bulk delete API error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
