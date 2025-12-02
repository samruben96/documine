/**
 * Vector Search Service
 *
 * Performs semantic similarity search on document chunks using pgvector.
 * Story 5.8: Updated to support hybrid search (vector + FTS) with configurable candidates.
 *
 * @module @/lib/chat/vector-search
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { RetrievedChunk, BoundingBox } from './types';
import { log } from '@/lib/utils/logger';

/** Default number of chunks for final results (after reranking) */
const TOP_K_FINAL = 5;

/** Number of candidates to retrieve for reranking (Story 5.8) */
const TOP_K_CANDIDATES = 20;

/** Default vector weight for hybrid search (AC-5.8.5: 70% vector, 30% keyword) */
const DEFAULT_VECTOR_WEIGHT = 0.7;

/**
 * Hybrid search result from database
 */
type HybridSearchResult = {
  id: string;
  content: string;
  page_number: number;
  bounding_box: unknown;
  vector_score: number;
  fts_score: number;
  combined_score: number;
};

/**
 * Vector-only search result from database
 */
type VectorSearchResult = {
  id: string;
  content: string;
  page_number: number;
  bounding_box: unknown;
  similarity: number;
};

/**
 * Search for similar document chunks using hybrid search (vector + FTS)
 *
 * Story 5.8 AC-5.8.5: Combines vector similarity with PostgreSQL full-text search.
 * Returns top 20 candidates for reranking by default.
 *
 * @param supabase - Supabase client (with user auth context)
 * @param documentId - The document to search within
 * @param queryEmbedding - The query embedding vector (1536 dimensions)
 * @param queryText - Original query text for FTS matching
 * @param options - Search options
 * @returns Top chunks sorted by combined score descending
 */
export async function searchSimilarChunks(
  supabase: SupabaseClient<Database>,
  documentId: string,
  queryEmbedding: number[],
  queryText?: string,
  options: {
    /** Number of results to return (default: 20 for reranking) */
    limit?: number;
    /** Vector weight for hybrid fusion (default: 0.7) */
    vectorWeight?: number;
    /** Use hybrid search with FTS (default: true if queryText provided) */
    useHybridSearch?: boolean;
  } = {}
): Promise<RetrievedChunk[]> {
  const startTime = Date.now();
  const limit = options.limit ?? TOP_K_CANDIDATES;
  const vectorWeight = options.vectorWeight ?? DEFAULT_VECTOR_WEIGHT;
  const useHybridSearch = options.useHybridSearch ?? (queryText !== undefined && queryText.trim().length > 0);

  // Use hybrid search if query text is available
  if (useHybridSearch && queryText) {
    return searchHybrid(supabase, documentId, queryEmbedding, queryText, limit, vectorWeight, startTime);
  }

  // Fall back to vector-only search
  return searchVectorOnly(supabase, documentId, queryEmbedding, limit, startTime);
}

/**
 * Perform hybrid search combining vector similarity and full-text search
 */
async function searchHybrid(
  supabase: SupabaseClient<Database>,
  documentId: string,
  queryEmbedding: number[],
  queryText: string,
  limit: number,
  vectorWeight: number,
  startTime: number
): Promise<RetrievedChunk[]> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: {
      query_embedding: number[];
      query_text: string;
      match_document_id: string;
      match_count: number;
      vector_weight: number;
    }
  ) => Promise<{ data: HybridSearchResult[] | null; error: { message: string } | null }>)(
    'hybrid_search_document_chunks',
    {
      query_embedding: queryEmbedding,
      query_text: queryText,
      match_document_id: documentId,
      match_count: limit,
      vector_weight: vectorWeight,
    }
  );

  if (error) {
    log.warn('Hybrid search failed, falling back to vector-only', { error: error.message, documentId });
    // Fall back to vector-only search on hybrid failure
    return searchVectorOnly(supabase, documentId, queryEmbedding, limit, startTime);
  }

  const duration = Date.now() - startTime;
  log.info('Hybrid search complete', {
    documentId,
    chunksRetrieved: data?.length ?? 0,
    topCombinedScore: data?.[0]?.combined_score ?? 0,
    topVectorScore: data?.[0]?.vector_score ?? 0,
    topFtsScore: data?.[0]?.fts_score ?? 0,
    searchType: 'hybrid',
    duration,
  });

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    boundingBox: parseBoundingBox(chunk.bounding_box),
    similarityScore: chunk.combined_score,
    vectorScore: chunk.vector_score,
    ftsScore: chunk.fts_score,
  }));
}

/**
 * Perform vector-only similarity search
 */
async function searchVectorOnly(
  supabase: SupabaseClient<Database>,
  documentId: string,
  queryEmbedding: number[],
  limit: number,
  startTime: number
): Promise<RetrievedChunk[]> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: { query_embedding: number[]; match_document_id: string; match_count: number }
  ) => Promise<{ data: VectorSearchResult[] | null; error: { message: string } | null }>)(
    'match_document_chunks',
    {
      query_embedding: queryEmbedding,
      match_document_id: documentId,
      match_count: limit,
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
    searchType: 'vector-only',
    duration,
  });

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    boundingBox: parseBoundingBox(chunk.bounding_box),
    similarityScore: chunk.similarity,
  }));
}

/**
 * Get the final top K chunks after reranking
 *
 * @param chunks - All retrieved chunks (typically 20)
 * @param limit - Number of final results (default: 5)
 * @returns Top K chunks by similarity score
 */
export function getTopKChunks(chunks: RetrievedChunk[], limit: number = TOP_K_FINAL): RetrievedChunk[] {
  return chunks.slice(0, limit);
}

/**
 * Fuse vector and FTS scores with configurable weight
 *
 * AC-5.8.5: alpha=0.7 means 70% vector, 30% keyword
 *
 * @param vectorScore - Vector similarity score (0-1)
 * @param ftsScore - Full-text search score (can be > 1 from ts_rank)
 * @param vectorWeight - Weight for vector score (default: 0.7)
 * @returns Combined score
 */
export function fuseScores(
  vectorScore: number,
  ftsScore: number | null | undefined,
  vectorWeight: number = DEFAULT_VECTOR_WEIGHT
): number {
  const ftsWeight = 1 - vectorWeight;
  const normalizedFtsScore = ftsScore ?? 0;
  return vectorWeight * vectorScore + ftsWeight * normalizedFtsScore;
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
