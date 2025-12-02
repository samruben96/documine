/**
 * Tests for confidence calculation module
 *
 * Story 5.8 AC-5.8.7: Verifies new thresholds (0.75/0.50)
 *
 * @module __tests__/lib/chat/confidence.test
 */

import { describe, it, expect } from 'vitest';
import { calculateConfidence, getThresholds } from '@/lib/chat/confidence';

describe('calculateConfidence', () => {
  describe('high confidence (>= 0.75)', () => {
    it('returns high for score exactly at threshold (0.75)', () => {
      expect(calculateConfidence(0.75)).toBe('high');
    });

    it('returns high for score above threshold', () => {
      expect(calculateConfidence(0.85)).toBe('high');
      expect(calculateConfidence(0.95)).toBe('high');
      expect(calculateConfidence(1.0)).toBe('high');
    });

    it('returns high for typical reranker high scores', () => {
      expect(calculateConfidence(0.78)).toBe('high');
      expect(calculateConfidence(0.82)).toBe('high');
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

  describe('edge cases', () => {
    it('handles negative scores (should be not_found)', () => {
      expect(calculateConfidence(-0.1)).toBe('not_found');
    });

    it('handles scores above 1.0 (can happen with reranker)', () => {
      // Reranker scores are 0-1, but just in case
      expect(calculateConfidence(1.1)).toBe('high');
    });

    it('handles very small positive numbers', () => {
      expect(calculateConfidence(0.001)).toBe('not_found');
    });
  });
});

describe('getThresholds', () => {
  it('returns correct threshold values for Story 5.8', () => {
    const thresholds = getThresholds();
    expect(thresholds.high).toBe(0.75);
    expect(thresholds.needsReview).toBe(0.50);
  });
});

describe('Story 5.8 threshold changes', () => {
  // These tests document the threshold change from Story 5.3 to Story 5.8
  // Old thresholds: high >= 0.85, needs_review >= 0.60
  // New thresholds: high >= 0.75, needs_review >= 0.50

  it('score 0.80 is now high (was needs_review)', () => {
    // Before Story 5.8: 0.80 < 0.85 → needs_review
    // After Story 5.8: 0.80 >= 0.75 → high
    expect(calculateConfidence(0.80)).toBe('high');
  });

  it('score 0.55 is now needs_review (was not_found)', () => {
    // Before Story 5.8: 0.55 < 0.60 → not_found
    // After Story 5.8: 0.55 >= 0.50 → needs_review
    expect(calculateConfidence(0.55)).toBe('needs_review');
  });

  it('score 0.45 is still not_found', () => {
    // Both before and after: < 0.50 → not_found
    expect(calculateConfidence(0.45)).toBe('not_found');
  });
});
