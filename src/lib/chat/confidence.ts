/**
 * Confidence Level Utilities
 *
 * Server-compatible module for confidence calculations.
 * Used by both server-side RAG pipeline and client-side UI components.
 *
 * @module @/lib/chat/confidence
 */

/**
 * Confidence levels for AI responses
 * Based on similarity score thresholds from tech spec:
 * - high: >= 0.85 similarity
 * - needs_review: 0.60 - 0.84 similarity
 * - not_found: < 0.60 or no relevant chunks
 */
export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found';

/**
 * Calculate confidence level from similarity score
 *
 * Implements AC-5.3.6:
 * - >= 0.85 similarity = High Confidence
 * - 0.60 - 0.84 similarity = Needs Review
 * - < 0.60 or no relevant chunks = Not Found
 *
 * @param topScore - The similarity score of the top retrieved chunk (0-1)
 * @returns The confidence level
 */
export function calculateConfidence(topScore: number | null | undefined): ConfidenceLevel {
  if (topScore === null || topScore === undefined) {
    return 'not_found';
  }
  if (topScore >= 0.85) {
    return 'high';
  }
  if (topScore >= 0.60) {
    return 'needs_review';
  }
  return 'not_found';
}
