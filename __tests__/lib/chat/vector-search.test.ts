/**
 * Tests for vector search module with hybrid search support
 * @module __tests__/lib/chat/vector-search.test
 */

import { describe, it, expect } from 'vitest';
import { fuseScores, getTopKChunks } from '@/lib/chat/vector-search';
import type { RetrievedChunk } from '@/lib/chat/types';

describe('fuseScores', () => {
  it('fuses scores with default alpha=0.7', () => {
    // 0.7 * 0.8 + 0.3 * 0.6 = 0.56 + 0.18 = 0.74
    const fused = fuseScores(0.8, 0.6);
    expect(fused).toBeCloseTo(0.74, 5);
  });

  it('handles custom vector weight', () => {
    // 0.5 * 0.8 + 0.5 * 0.6 = 0.4 + 0.3 = 0.7
    const fused = fuseScores(0.8, 0.6, 0.5);
    expect(fused).toBeCloseTo(0.7, 5);
  });

  it('handles null FTS score', () => {
    // 0.7 * 0.9 + 0.3 * 0 = 0.63
    const fused = fuseScores(0.9, null, 0.7);
    expect(fused).toBeCloseTo(0.63, 5);
  });

  it('handles undefined FTS score', () => {
    // 0.7 * 0.9 + 0.3 * 0 = 0.63
    const fused = fuseScores(0.9, undefined, 0.7);
    expect(fused).toBeCloseTo(0.63, 5);
  });

  it('handles zero vector weight (FTS only)', () => {
    // 0 * 0.8 + 1 * 0.6 = 0.6
    const fused = fuseScores(0.8, 0.6, 0);
    expect(fused).toBeCloseTo(0.6, 5);
  });

  it('handles full vector weight (vector only)', () => {
    // 1 * 0.8 + 0 * 0.6 = 0.8
    const fused = fuseScores(0.8, 0.6, 1);
    expect(fused).toBeCloseTo(0.8, 5);
  });

  it('handles FTS scores greater than 1', () => {
    // ts_rank can return values > 1
    // 0.7 * 0.5 + 0.3 * 1.5 = 0.35 + 0.45 = 0.8
    const fused = fuseScores(0.5, 1.5, 0.7);
    expect(fused).toBeCloseTo(0.8, 5);
  });
});

describe('getTopKChunks', () => {
  const mockChunks: RetrievedChunk[] = [
    { id: '1', content: 'chunk 1', pageNumber: 1, boundingBox: null, similarityScore: 0.95 },
    { id: '2', content: 'chunk 2', pageNumber: 2, boundingBox: null, similarityScore: 0.85 },
    { id: '3', content: 'chunk 3', pageNumber: 3, boundingBox: null, similarityScore: 0.75 },
    { id: '4', content: 'chunk 4', pageNumber: 4, boundingBox: null, similarityScore: 0.65 },
    { id: '5', content: 'chunk 5', pageNumber: 5, boundingBox: null, similarityScore: 0.55 },
    { id: '6', content: 'chunk 6', pageNumber: 6, boundingBox: null, similarityScore: 0.45 },
  ];

  it('returns default top 5 chunks', () => {
    const result = getTopKChunks(mockChunks);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe('1');
    expect(result[4].id).toBe('5');
  });

  it('returns custom number of chunks', () => {
    const result = getTopKChunks(mockChunks, 3);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('1');
    expect(result[2].id).toBe('3');
  });

  it('returns all chunks if limit exceeds available', () => {
    const result = getTopKChunks(mockChunks, 10);
    expect(result).toHaveLength(6);
  });

  it('handles empty array', () => {
    const result = getTopKChunks([], 5);
    expect(result).toHaveLength(0);
  });

  it('preserves chunk order (assumes already sorted)', () => {
    const result = getTopKChunks(mockChunks, 3);
    expect(result[0].similarityScore).toBe(0.95);
    expect(result[1].similarityScore).toBe(0.85);
    expect(result[2].similarityScore).toBe(0.75);
  });
});
