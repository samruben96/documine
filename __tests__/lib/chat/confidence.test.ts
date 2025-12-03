/**
 * Tests for confidence calculation module
 *
 * Story 5.8 AC-5.8.7: Verifies thresholds (0.75/0.50 for vector)
 * Story 6.2: Verifies dual-score logic and conversational intent
 *
 * @module __tests__/lib/chat/confidence.test
 */

import { describe, it, expect } from 'vitest';
import { calculateConfidence, getThresholds } from '@/lib/chat/confidence';
import type { QueryIntent } from '@/lib/chat/intent';

describe('calculateConfidence', () => {
  describe('vector-only mode (no reranker score)', () => {
    describe('high confidence (>= 0.75)', () => {
      it('returns high for score exactly at threshold (0.75)', () => {
        expect(calculateConfidence(0.75)).toBe('high');
      });

      it('returns high for score above threshold', () => {
        expect(calculateConfidence(0.85)).toBe('high');
        expect(calculateConfidence(0.95)).toBe('high');
        expect(calculateConfidence(1.0)).toBe('high');
      });
    });

    describe('needs_review (0.50 - 0.74)', () => {
      it('returns needs_review for score exactly at threshold (0.50)', () => {
        expect(calculateConfidence(0.50)).toBe('needs_review');
      });

      it('returns needs_review for score just below high threshold', () => {
        expect(calculateConfidence(0.74)).toBe('needs_review');
        expect(calculateConfidence(0.749)).toBe('needs_review');
      });

      it('returns needs_review for mid-range scores', () => {
        expect(calculateConfidence(0.55)).toBe('needs_review');
        expect(calculateConfidence(0.60)).toBe('needs_review');
        expect(calculateConfidence(0.65)).toBe('needs_review');
        expect(calculateConfidence(0.70)).toBe('needs_review');
      });
    });

    describe('not_found (< 0.50)', () => {
      it('returns not_found for score just below threshold', () => {
        expect(calculateConfidence(0.49)).toBe('not_found');
        expect(calculateConfidence(0.499)).toBe('not_found');
      });

      it('returns not_found for low scores', () => {
        expect(calculateConfidence(0.30)).toBe('not_found');
        expect(calculateConfidence(0.10)).toBe('not_found');
        expect(calculateConfidence(0.0)).toBe('not_found');
      });

      it('returns not_found for null score', () => {
        expect(calculateConfidence(null)).toBe('not_found');
      });

      it('returns not_found for undefined score', () => {
        expect(calculateConfidence(undefined)).toBe('not_found');
      });
    });
  });

  describe('reranker mode (Cohere scores)', () => {
    // AC-6.2.3: Cohere thresholds: >= 0.30 High, 0.10-0.29 Review, < 0.10 Not Found

    describe('high confidence (rerankerScore >= 0.30)', () => {
      it('returns high for score exactly at threshold (0.30)', () => {
        expect(calculateConfidence(0.5, 0.30, 'document_query')).toBe('high');
      });

      it('returns high for score above threshold', () => {
        expect(calculateConfidence(0.5, 0.35, 'document_query')).toBe('high');
        expect(calculateConfidence(0.5, 0.50, 'document_query')).toBe('high');
        expect(calculateConfidence(0.5, 0.80, 'document_query')).toBe('high');
      });

      it('uses reranker score even when vector score is low', () => {
        // Vector score is 0.2 (would be not_found), but reranker says high
        expect(calculateConfidence(0.2, 0.35, 'document_query')).toBe('high');
      });
    });

    describe('needs_review (rerankerScore 0.10 - 0.29)', () => {
      it('returns needs_review for score exactly at threshold (0.10)', () => {
        expect(calculateConfidence(0.5, 0.10, 'document_query')).toBe('needs_review');
      });

      it('returns needs_review for score just below high threshold', () => {
        expect(calculateConfidence(0.5, 0.29, 'document_query')).toBe('needs_review');
        expect(calculateConfidence(0.5, 0.25, 'document_query')).toBe('needs_review');
      });

      it('returns needs_review for mid-range scores', () => {
        expect(calculateConfidence(0.5, 0.15, 'document_query')).toBe('needs_review');
        expect(calculateConfidence(0.5, 0.20, 'document_query')).toBe('needs_review');
      });
    });

    describe('not_found (rerankerScore < 0.10)', () => {
      it('returns not_found for score just below threshold', () => {
        expect(calculateConfidence(0.5, 0.09, 'document_query')).toBe('not_found');
        expect(calculateConfidence(0.5, 0.05, 'document_query')).toBe('not_found');
      });

      it('returns not_found for very low scores', () => {
        expect(calculateConfidence(0.5, 0.01, 'document_query')).toBe('not_found');
        expect(calculateConfidence(0.5, 0.0, 'document_query')).toBe('not_found');
      });

      it('returns not_found even when vector score is high', () => {
        // Vector score is 0.85 (would be high), but reranker says not relevant
        expect(calculateConfidence(0.85, 0.05, 'document_query')).toBe('not_found');
      });
    });
  });

  describe('conversational intent (AC-6.2.5)', () => {
    const conversationalIntents: QueryIntent[] = ['greeting', 'gratitude', 'farewell', 'meta'];

    conversationalIntents.forEach((intent) => {
      it(`returns conversational for ${intent} intent`, () => {
        expect(calculateConfidence(0.5, null, intent)).toBe('conversational');
      });

      it(`returns conversational for ${intent} even with high reranker score`, () => {
        // Intent takes precedence over scores
        expect(calculateConfidence(0.95, 0.80, intent)).toBe('conversational');
      });

      it(`returns conversational for ${intent} even with null scores`, () => {
        expect(calculateConfidence(null, null, intent)).toBe('conversational');
      });
    });

    it('returns score-based result for document_query intent', () => {
      expect(calculateConfidence(0.85, null, 'document_query')).toBe('high');
      expect(calculateConfidence(0.60, null, 'document_query')).toBe('needs_review');
      expect(calculateConfidence(0.30, null, 'document_query')).toBe('not_found');
    });
  });

  describe('edge cases', () => {
    it('handles negative scores (should be not_found)', () => {
      expect(calculateConfidence(-0.1)).toBe('not_found');
      expect(calculateConfidence(0.5, -0.1, 'document_query')).toBe('not_found');
    });

    it('handles scores above 1.0 (can happen with reranker)', () => {
      // Reranker scores are 0-1, but just in case
      expect(calculateConfidence(1.1)).toBe('high');
      expect(calculateConfidence(0.5, 1.1, 'document_query')).toBe('high');
    });

    it('handles very small positive numbers', () => {
      expect(calculateConfidence(0.001)).toBe('not_found');
      expect(calculateConfidence(0.5, 0.001, 'document_query')).toBe('not_found');
    });

    it('handles undefined reranker score (falls back to vector)', () => {
      expect(calculateConfidence(0.80, undefined, 'document_query')).toBe('high');
      expect(calculateConfidence(0.60, undefined, 'document_query')).toBe('needs_review');
      expect(calculateConfidence(0.30, undefined, 'document_query')).toBe('not_found');
    });

    it('handles null reranker score (falls back to vector)', () => {
      expect(calculateConfidence(0.80, null, 'document_query')).toBe('high');
    });

    it('handles undefined query intent (uses score-based logic)', () => {
      expect(calculateConfidence(0.80, undefined, undefined)).toBe('high');
      expect(calculateConfidence(0.80, 0.35, undefined)).toBe('high');
    });
  });

  describe('backward compatibility', () => {
    // These tests ensure the single-argument form still works
    it('works with single argument (vector score only)', () => {
      expect(calculateConfidence(0.80)).toBe('high');
      expect(calculateConfidence(0.60)).toBe('needs_review');
      expect(calculateConfidence(0.30)).toBe('not_found');
      expect(calculateConfidence(null)).toBe('not_found');
    });
  });
});

describe('getThresholds', () => {
  it('returns correct threshold values for Story 6.2', () => {
    const thresholds = getThresholds();
    // Vector thresholds (Story 5.8)
    expect(thresholds.vector.high).toBe(0.75);
    expect(thresholds.vector.needsReview).toBe(0.50);
    // Cohere thresholds (Story 6.2)
    expect(thresholds.cohere.high).toBe(0.30);
    expect(thresholds.cohere.needsReview).toBe(0.10);
  });
});

describe('Story 6.2 - Real-world bug scenarios', () => {
  // These tests document the bug fix from Story 6.2
  // Bug: Reranker score of 0.35 was treated as < 0.50, resulting in "Not Found"

  it('reranker score 0.35 now shows High Confidence (was Not Found)', () => {
    // Before Story 6.2: 0.35 < 0.50 → not_found (WRONG - used vector thresholds)
    // After Story 6.2: 0.35 >= 0.30 → high (CORRECT - uses Cohere thresholds)
    expect(calculateConfidence(0.35, 0.35, 'document_query')).toBe('high');
  });

  it('reranker score 0.25 now shows Needs Review (was Not Found)', () => {
    // Before Story 6.2: 0.25 < 0.50 → not_found
    // After Story 6.2: 0.25 >= 0.10 → needs_review
    expect(calculateConfidence(0.25, 0.25, 'document_query')).toBe('needs_review');
  });

  it('greeting "Hello!" shows Conversational (was Not Found)', () => {
    // Before Story 6.2: Any low score → not_found
    // After Story 6.2: greeting intent → conversational
    expect(calculateConfidence(0.1, null, 'greeting')).toBe('conversational');
  });

  it('accurate answer with high reranker score shows High Confidence', () => {
    // Scenario: "What is the total annual premium?" with relevant context found
    // Reranker identifies highly relevant content with score 0.40
    expect(calculateConfidence(0.65, 0.40, 'document_query')).toBe('high');
  });
});
