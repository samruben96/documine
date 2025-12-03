/**
 * Confidence Level Utilities
 *
 * Server-compatible module for confidence calculations.
 * Used by both server-side RAG pipeline and client-side UI components.
 *
 * Story 5.8: Adjusted thresholds for reranked results.
 * Story 6.2: Separate thresholds for vector vs reranker scores,
 *            added 'conversational' level for greetings/meta queries.
 *
 * @module @/lib/chat/confidence
 */

import type { QueryIntent } from './intent';

/**
 * Confidence levels for AI responses
 *
 * Story 6.2: Added 'conversational' level for non-document queries
 * - high: High confidence answer (green badge)
 * - needs_review: Answer found but may need verification (amber badge)
 * - not_found: No relevant content found (gray badge)
 * - conversational: Response to greeting/meta query (blue badge, no RAG needed)
 */
export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found' | 'conversational';

/**
 * Thresholds calibrated for vector similarity scores (cosine similarity 0-1)
 * Story 5.8: 0.75/0.50 for hybrid search results
 */
const VECTOR_THRESHOLDS = {
  high: 0.75,
  needsReview: 0.50,
};

/**
 * Thresholds calibrated for Cohere reranker relevance scores
 * Story 6.2: Cohere rerank-english-v3.5 outputs scores in different distribution
 * - Highly relevant: 0.30+ (equivalent to vector >= 0.75)
 * - Somewhat relevant: 0.10-0.29 (equivalent to vector 0.50-0.74)
 * - Not relevant: < 0.10
 */
const COHERE_THRESHOLDS = {
  high: 0.30,
  needsReview: 0.10,
};

/**
 * Calculate confidence level from retrieval scores
 *
 * Story 6.2: Updated to handle both vector and reranker scores separately
 *
 * Logic:
 * 1. For conversational queries (greetings, meta), return 'conversational'
 * 2. If rerankerScore is available, use Cohere-calibrated thresholds
 * 3. Otherwise, use vector similarity thresholds
 *
 * @param vectorScore - Vector similarity score from hybrid search (0-1)
 * @param rerankerScore - Cohere reranker relevance score (if reranking was used)
 * @param queryIntent - Classified intent of the user's query
 * @returns The confidence level
 */
export function calculateConfidence(
  vectorScore: number | null | undefined,
  rerankerScore?: number | null,
  queryIntent?: QueryIntent
): ConfidenceLevel {
  // For conversational queries, return 'conversational' regardless of scores
  if (
    queryIntent === 'greeting' ||
    queryIntent === 'gratitude' ||
    queryIntent === 'farewell' ||
    queryIntent === 'meta'
  ) {
    return 'conversational';
  }

  // If reranker score is available, use Cohere-calibrated thresholds
  if (rerankerScore != null) {
    if (rerankerScore >= COHERE_THRESHOLDS.high) {
      return 'high';
    }
    if (rerankerScore >= COHERE_THRESHOLDS.needsReview) {
      return 'needs_review';
    }
    return 'not_found';
  }

  // Fall back to vector similarity thresholds
  if (vectorScore == null) {
    return 'not_found';
  }
  if (vectorScore >= VECTOR_THRESHOLDS.high) {
    return 'high';
  }
  if (vectorScore >= VECTOR_THRESHOLDS.needsReview) {
    return 'needs_review';
  }
  return 'not_found';
}

/**
 * Get threshold values (for testing/debugging)
 */
export function getThresholds(): {
  vector: { high: number; needsReview: number };
  cohere: { high: number; needsReview: number };
} {
  return {
    vector: VECTOR_THRESHOLDS,
    cohere: COHERE_THRESHOLDS,
  };
}
