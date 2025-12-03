/**
 * Cohere Reranker Service
 *
 * Cross-encoder reranking for improved retrieval quality.
 * Story 5.8 AC-5.8.3: Cohere Rerank 3.5 API integration.
 *
 * @module @/lib/chat/reranker
 */

import { CohereClient, CohereTimeoutError, CohereError } from 'cohere-ai';
import type { RetrievedChunk } from './types';
import { log } from '@/lib/utils/logger';

/** Reranker timeout in milliseconds (AC-5.8.3: 5s timeout) */
const RERANKER_TIMEOUT_MS = 5000;

/** Default number of top results after reranking */
const DEFAULT_TOP_N = 5;

/** Cohere Rerank model (v3.5 - latest multilingual model) */
const RERANK_MODEL = 'rerank-v3.5';

/**
 * Reranked document with relevance score
 */
export interface RerankedDocument {
  /** Original chunk */
  chunk: RetrievedChunk;
  /** Cohere relevance score (0-1) */
  relevanceScore: number;
  /** Original index in the input array */
  originalIndex: number;
}

/**
 * Rerank retrieved chunks using Cohere Rerank API
 *
 * AC-5.8.3: Reorders results by relevance using cross-encoder model.
 * AC-5.8.4: Falls back to original order on API failure.
 *
 * @param query - User query
 * @param chunks - Retrieved chunks to rerank (typically 20)
 * @param apiKey - Cohere API key
 * @param options - Reranking options
 * @returns Reranked chunks sorted by relevance
 */
export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  apiKey: string,
  options: {
    /** Number of top results to return (default: 5) */
    topN?: number;
    /** Timeout in milliseconds (default: 5000) */
    timeoutMs?: number;
  } = {}
): Promise<RetrievedChunk[]> {
  const topN = options.topN ?? DEFAULT_TOP_N;
  const timeoutMs = options.timeoutMs ?? RERANKER_TIMEOUT_MS;

  // Return empty if no chunks
  if (chunks.length === 0) {
    return [];
  }

  // Return original chunks if only a few (no reranking benefit)
  if (chunks.length <= topN) {
    log.info('Skipping reranking - fewer chunks than topN', {
      chunksCount: chunks.length,
      topN,
    });
    return chunks;
  }

  const startTime = Date.now();

  try {
    const cohere = new CohereClient({
      token: apiKey,
    });

    // Extract content for reranking
    const documents = chunks.map((c) => c.content);

    // Call Cohere Rerank API
    const response = await Promise.race([
      cohere.rerank({
        model: RERANK_MODEL,
        query,
        documents,
        topN,
        returnDocuments: false, // We already have the documents
      }),
      createTimeoutPromise(timeoutMs),
    ]);

    // Handle timeout
    if (response === null) {
      log.warn('Reranker timeout', { timeoutMs, query: query.slice(0, 50) });
      return fallbackToTopK(chunks, topN);
    }

    const duration = Date.now() - startTime;

    // Map results back to chunks with reranker scores
    const rerankedChunks: RetrievedChunk[] = [];
    for (const result of response.results) {
      const chunk = chunks[result.index];
      if (chunk) {
        rerankedChunks.push({
          ...chunk,
          rerankerScore: result.relevanceScore,
          // Story 6.2: Preserve original similarityScore from vector search
          // The rerankerScore is now stored separately and used by confidence.ts
        });
      }
    }

    log.info('Reranking complete', {
      inputChunks: chunks.length,
      outputChunks: rerankedChunks.length,
      topRerankerScore: rerankedChunks[0]?.rerankerScore ?? 0,
      duration,
    });

    return rerankedChunks;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof CohereTimeoutError) {
      log.warn('Reranker timeout error', { duration, query: query.slice(0, 50) });
    } else if (error instanceof CohereError) {
      log.error('Reranker API error', error, {
        statusCode: error.statusCode,
        query: query.slice(0, 50),
      });
    } else {
      log.error('Reranker unexpected error', error as Error, { query: query.slice(0, 50) });
    }

    // AC-5.8.4: Fall back to vector-only results on API failure
    return fallbackToTopK(chunks, topN);
  }
}

/**
 * Fall back to top K chunks by original similarity score
 *
 * @param chunks - Original chunks
 * @param topK - Number of chunks to return
 * @returns Top K chunks by similarity
 */
function fallbackToTopK(chunks: RetrievedChunk[], topK: number): RetrievedChunk[] {
  log.warn('Using fallback - returning top K by similarity', { topK });
  return chunks.slice(0, topK);
}

/**
 * Create a timeout promise that resolves to null
 */
function createTimeoutPromise(timeoutMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });
}

/**
 * Check if reranking is enabled (API key available)
 */
export function isRerankerEnabled(): boolean {
  return !!process.env.COHERE_API_KEY;
}

/**
 * Get Cohere API key from environment
 * @throws Error if API key is not set
 */
export function getCohereApiKey(): string {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error('COHERE_API_KEY environment variable is not set');
  }
  return apiKey;
}
