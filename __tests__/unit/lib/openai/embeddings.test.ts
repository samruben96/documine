import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateEmbedding,
  getEmbeddingModelInfo,
} from '@/lib/openai/embeddings';

// Mock logger to avoid console output in tests
vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('validateEmbedding', () => {
  it('should return true for valid 1536-dimension embedding', () => {
    const embedding = Array(1536).fill(0.1);
    expect(validateEmbedding(embedding)).toBe(true);
  });

  it('should return false for wrong dimension count', () => {
    expect(validateEmbedding(Array(1000).fill(0.1))).toBe(false);
    expect(validateEmbedding(Array(2000).fill(0.1))).toBe(false);
    expect(validateEmbedding([])).toBe(false);
  });

  it('should return false for non-array input', () => {
    expect(validateEmbedding('not an array' as unknown as number[])).toBe(false);
    expect(validateEmbedding(null as unknown as number[])).toBe(false);
    expect(validateEmbedding(undefined as unknown as number[])).toBe(false);
  });
});

describe('getEmbeddingModelInfo', () => {
  it('should return correct model information', () => {
    const info = getEmbeddingModelInfo();

    expect(info.model).toBe('text-embedding-3-small');
    expect(info.dimensions).toBe(1536);
  });
});
