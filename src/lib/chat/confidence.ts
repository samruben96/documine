/**
 * Confidence Level Utilities
 *
 * Server-compatible module for confidence calculations.
 * Used by both server-side RAG pipeline and client-side UI components.
 *
 * Story 5.8: Adjusted thresholds for reranked results.
 *
 * @module @/lib/chat/confidence
 */

/**
 * Confidence levels for AI responses
 *
 * Story 5.8 AC-5.8.7: Updated thresholds for hybrid search + reranking:
 * - high: >= 0.75 similarity (green badge)
 * - needs_review: 0.50 - 0.74 similarity (amber badge)
 * - not_found: < 0.50 or no relevant chunks (gray badge)
 */
export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found';

/** Threshold for high confidence (Story 5.8: lowered from 0.85) */
const HIGH_CONFIDENCE_THRESHOLD = 0.75;

/** Threshold for needs review (Story 5.8: lowered from 0.60) */
const NEEDS_REVIEW_THRESHOLD = 0.50;

/**
 * Calculate confidence level from similarity score
 *
 * Story 5.8 AC-5.8.7:
 * - >= 0.75 similarity = High Confidence (green badge)
 * - 0.50 - 0.74 similarity = Needs Review (amber badge)
 * - < 0.50 or no relevant chunks = Not Found (gray badge)
 *
 * @param topScore - The similarity score of the top retrieved chunk (0-1)
 * @returns The confidence level
 */
export function calculateConfidence(topScore: number | null | undefined): ConfidenceLevel {
  if (topScore === null || topScore === undefined) {
    return 'not_found';
  }
  if (topScore >= HIGH_CONFIDENCE_THRESHOLD) {
    return 'high';
  }
  if (topScore >= NEEDS_REVIEW_THRESHOLD) {
    return 'needs_review';
  }
  return 'not_found';
}

/**
 * Get threshold values (for testing/debugging)
 */
export function getThresholds(): { high: number; needsReview: number } {
  return {
    high: HIGH_CONFIDENCE_THRESHOLD,
    needsReview: NEEDS_REVIEW_THRESHOLD,
  };
}
