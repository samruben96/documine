/**
 * Vector Search Service
 *
 * Performs semantic similarity search on document chunks using pgvector.
 * Implements AC-5.3.6: Retrieves top 5 chunks with similarity scores.
 *
 * @module @/lib/chat/vector-search
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { RetrievedChunk, BoundingBox } from './types';
import { log } from '@/lib/utils/logger';

const TOP_K_CHUNKS = 5;

/**
 * Search for similar document chunks using cosine similarity
 *
 * @param supabase - Supabase client (with user auth context)
 * @param documentId - The document to search within
 * @param queryEmbedding - The query embedding vector (1536 dimensions)
 * @returns Top 5 chunks sorted by similarity descending
 */
export async function searchSimilarChunks(
  supabase: SupabaseClient<Database>,
  documentId: string,
  queryEmbedding: number[]
): Promise<RetrievedChunk[]> {
  const startTime = Date.now();

  // Use Supabase RPC to call pgvector similarity search
  // The RPC function uses: 1 - (embedding <=> query_embedding) AS similarity
  // Note: We use type assertion as the function was created after types were generated
  type MatchResult = {
    id: string;
    content: string;
    page_number: number;
    bounding_box: unknown;
    similarity: number;
  };

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: { query_embedding: number[]; match_document_id: string; match_count: number }
  ) => Promise<{ data: MatchResult[] | null; error: { message: string } | null }>)(
    'match_document_chunks',
    {
      query_embedding: queryEmbedding,
      match_document_id: documentId,
      match_count: TOP_K_CHUNKS,
    }
  );

  if (error) {
    log.error('Vector search failed', new Error(error.message), { documentId });
    throw new Error(`Vector search failed: ${error.message}`);
  }

  const duration = Date.now() - startTime;
  log.info('Vector search complete', {
    documentId,
    chunksRetrieved: data?.length ?? 0,
    topScore: data?.[0]?.similarity ?? 0,
    duration,
  });

  if (!data || data.length === 0) {
    return [];
  }

  // Map database results to RetrievedChunk type
  return data.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    boundingBox: parseBoundingBox(chunk.bounding_box),
    similarityScore: chunk.similarity,
  }));
}

/**
 * Parse bounding box from JSON
 */
function parseBoundingBox(json: unknown): BoundingBox | null {
  if (!json || typeof json !== 'object') {
    return null;
  }

  const box = json as Record<string, unknown>;
  if (
    typeof box.x === 'number' &&
    typeof box.y === 'number' &&
    typeof box.width === 'number' &&
    typeof box.height === 'number'
  ) {
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  }

  return null;
}
