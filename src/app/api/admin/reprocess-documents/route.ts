/**
 * Admin API Route: Document Re-processing
 *
 * POST /api/admin/reprocess-documents - Re-process documents with new chunking algorithm
 *
 * Story 5.9 (AC-5.9.7, AC-5.9.8): Batch re-processing with A/B testing support.
 *
 * Options:
 * - documentIds: Specific document IDs to re-process (optional)
 * - embeddingVersion: Target version (1=old, 2=new table-aware) - default 1
 * - deleteExisting: Whether to delete existing chunks before re-processing
 * - limit: Max documents to process (for testing/batching)
 *
 * Security: Requires authenticated user with 'admin' role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

interface ReprocessRequest {
  documentIds?: string[];
  filterByVersion?: number; // Filter documents by current embedding version (1=old, 2=new)
  deleteExisting?: boolean; // Delete ALL chunks for document before re-processing
  limit?: number;
}

interface DocumentInfo {
  id: string;
  filename: string;
  status: string;
  storage_path: string;
  agency_id: string;
}

/**
 * POST /api/admin/reprocess-documents
 *
 * Triggers re-processing of documents with new chunking algorithm.
 * Requires admin authentication.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body: ReprocessRequest = await request.json();
    const {
      documentIds,
      filterByVersion = 1,
      deleteExisting = true,
      limit = 10,
    } = body;

    const supabase = await createClient();

    // Get documents to re-process
    let query = supabase
      .from('documents')
      .select('id, filename, status, storage_path, agency_id')
      .eq('status', 'ready')
      .limit(limit);

    if (documentIds && documentIds.length > 0) {
      query = query.in('id', documentIds);
    } else {
      // Filter by embedding version if no specific IDs provided
      // Find documents that have chunks with the specified version
      const { data: chunkData } = await supabase
        .from('document_chunks')
        .select('document_id')
        .eq('embedding_version', filterByVersion)
        .limit(limit * 10);

      if (chunkData && chunkData.length > 0) {
        const uniqueDocIds = [...new Set(chunkData.map((c) => c.document_id))].slice(0, limit);
        query = query.in('id', uniqueDocIds);
      }
    }

    const { data: documents, error: docError } = await query;

    if (docError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch documents: ${docError.message}` },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents found to re-process',
        processed: 0,
      });
    }

    const results: Array<{
      documentId: string;
      filename: string;
      status: 'queued' | 'error';
      error?: string;
    }> = [];

    // Process each document
    for (const doc of documents as DocumentInfo[]) {
      try {
        // Delete ALL existing chunks for document before re-processing
        // This ensures clean slate and prevents duplicate chunks across versions
        if (deleteExisting) {
          const { error: deleteError } = await supabase
            .from('document_chunks')
            .delete()
            .eq('document_id', doc.id);

          if (deleteError) {
            results.push({
              documentId: doc.id,
              filename: doc.filename,
              status: 'error',
              error: `Failed to delete chunks: ${deleteError.message}`,
            });
            continue;
          }
        }

        // Update document status to trigger re-processing
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'processing' })
          .eq('id', doc.id);

        if (updateError) {
          results.push({
            documentId: doc.id,
            filename: doc.filename,
            status: 'error',
            error: `Failed to update status: ${updateError.message}`,
          });
          continue;
        }

        // Create processing job
        const { error: jobError } = await supabase.from('processing_jobs').insert({
          document_id: doc.id,
          status: 'pending',
        });

        if (jobError) {
          results.push({
            documentId: doc.id,
            filename: doc.filename,
            status: 'error',
            error: `Failed to create job: ${jobError.message}`,
          });
          continue;
        }

        // Trigger Edge Function
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/process-document`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              documentId: doc.id,
              storagePath: doc.storage_path,
              agencyId: doc.agency_id,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          results.push({
            documentId: doc.id,
            filename: doc.filename,
            status: 'error',
            error: `Edge function error: ${errorText}`,
          });
          continue;
        }

        results.push({
          documentId: doc.id,
          filename: doc.filename,
          status: 'queued',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          documentId: doc.id,
          filename: doc.filename,
          status: 'error',
          error: message,
        });
      }
    }

    const successful = results.filter((r) => r.status === 'queued').length;
    const failed = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Queued ${successful} document(s) for re-processing${failed > 0 ? `, ${failed} failed` : ''}`,
      results,
      summary: {
        total: results.length,
        queued: successful,
        failed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reprocess-documents
 *
 * Get stats on documents by embedding version (for A/B testing).
 */
export async function GET(): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const supabase = await createClient();

    // Get chunk counts by embedding version
    const { count: v1ChunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('embedding_version', 1);

    const { count: v2ChunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('embedding_version', 2);

    // Get unique document counts by version
    const { data: v1Docs } = await supabase
      .from('document_chunks')
      .select('document_id')
      .eq('embedding_version', 1);

    const { data: v2Docs } = await supabase
      .from('document_chunks')
      .select('document_id')
      .eq('embedding_version', 2);

    const v1DocIds = v1Docs ? [...new Set(v1Docs.map((d) => d.document_id))] : [];
    const v2DocIds = v2Docs ? [...new Set(v2Docs.map((d) => d.document_id))] : [];

    // Get table chunk counts for v2
    const { count: tableChunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('embedding_version', 2)
      .eq('chunk_type', 'table');

    // Get text chunk counts for v2
    const { count: textChunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('embedding_version', 2)
      .eq('chunk_type', 'text');

    return NextResponse.json({
      success: true,
      stats: {
        version1: {
          documents: v1DocIds.length,
          chunks: v1ChunkCount || 0,
          description: 'Original chunking (500 tokens, paragraph-based)',
        },
        version2: {
          documents: v2DocIds.length,
          chunks: v2ChunkCount || 0,
          textChunks: textChunkCount || 0,
          tableChunks: tableChunkCount || 0,
          description: 'Table-aware chunking (recursive splitter, preserved tables)',
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
