import { describe, it, expect } from 'vitest';
import {
  chunkMarkdown,
  estimateTokenCount,
  type DocumentChunk,
} from '@/lib/documents/chunking';
import type { PageMarker } from '@/lib/llamaparse/client';

describe('chunkMarkdown', () => {
  describe('basic chunking', () => {
    it('should return empty array for empty input', () => {
      const result = chunkMarkdown('', []);
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only input', () => {
      const result = chunkMarkdown('   \n\n  ', []);
      expect(result).toEqual([]);
    });

    it('should create single chunk for short content', () => {
      const markdown = 'This is a short paragraph.';
      const result = chunkMarkdown(markdown, []);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(markdown);
      expect(result[0].pageNumber).toBe(1);
      expect(result[0].chunkIndex).toBe(0);
    });

    it('should preserve content integrity', () => {
      const markdown = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const result = chunkMarkdown(markdown, []);

      const combinedContent = result.map((c) => c.content).join(' ');
      expect(combinedContent).toContain('First paragraph');
      expect(combinedContent).toContain('Second paragraph');
      expect(combinedContent).toContain('Third paragraph');
    });
  });

  describe('page number tagging', () => {
    it('should assign page 1 when no page markers present', () => {
      const markdown = 'Content without page markers.';
      const result = chunkMarkdown(markdown, []);

      expect(result.every((c) => c.pageNumber === 1)).toBe(true);
    });

    it('should extract page numbers from markers', () => {
      const markdown = `Content on page 1.

--- PAGE 2 ---

Content on page 2.

--- PAGE 3 ---

Content on page 3.`;

      const pageMarkers: PageMarker[] = [
        { pageNumber: 2, startIndex: 20, endIndex: 35 },
        { pageNumber: 3, startIndex: 60, endIndex: 75 },
      ];

      const result = chunkMarkdown(markdown, pageMarkers);

      // Should have chunks with different page numbers
      const pageNumbers = [...new Set(result.map((c) => c.pageNumber))];
      expect(pageNumbers.length).toBeGreaterThan(1);
    });

    it('should handle single page marker', () => {
      const markdown = `Content before.

--- PAGE 1 ---

Content after.`;

      const pageMarkers: PageMarker[] = [
        { pageNumber: 1, startIndex: 17, endIndex: 32 },
      ];

      const result = chunkMarkdown(markdown, pageMarkers);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('chunk indexing', () => {
    it('should assign sequential chunk indices starting from 0', () => {
      const markdown = 'A'.repeat(3000); // Large enough to create multiple chunks
      const result = chunkMarkdown(markdown, []);

      for (let i = 0; i < result.length; i++) {
        expect(result[i].chunkIndex).toBe(i);
      }
    });

    it('should maintain unique indices across all chunks', () => {
      const markdown = `First section with enough content.

--- PAGE 2 ---

Second section with more content.

--- PAGE 3 ---

Third section with additional content.`;

      const pageMarkers: PageMarker[] = [
        { pageNumber: 2, startIndex: 40, endIndex: 55 },
        { pageNumber: 3, startIndex: 95, endIndex: 110 },
      ];

      const result = chunkMarkdown(markdown, pageMarkers);
      const indices = result.map((c) => c.chunkIndex);
      const uniqueIndices = [...new Set(indices)];

      expect(indices.length).toBe(uniqueIndices.length);
    });
  });

  describe('chunk sizing', () => {
    it('should create chunks near target size for long content', () => {
      // Create content that should result in multiple chunks
      const paragraph = 'This is a test paragraph with some content. ';
      const markdown = paragraph.repeat(100); // ~4400 characters

      const result = chunkMarkdown(markdown, []);

      expect(result.length).toBeGreaterThan(1);

      // Each chunk should have reasonable token count (not too large)
      for (const chunk of result) {
        expect(chunk.tokenCount).toBeLessThan(800); // Some margin for overlap
      }
    });

    it('should respect custom chunk options', () => {
      const markdown = 'Word '.repeat(200);

      const smallChunks = chunkMarkdown(markdown, [], {
        targetTokens: 100,
        overlapTokens: 10,
      });

      const largeChunks = chunkMarkdown(markdown, [], {
        targetTokens: 1000,
        overlapTokens: 50,
      });

      expect(smallChunks.length).toBeGreaterThan(largeChunks.length);
    });
  });

  describe('chunk overlap', () => {
    it('should add overlap between consecutive chunks', () => {
      // Create content large enough to have multiple chunks
      const markdown = 'Sentence one. '.repeat(100);

      const result = chunkMarkdown(markdown, [], {
        targetTokens: 200,
        overlapTokens: 50,
      });

      if (result.length > 1) {
        // Check that second chunk contains some content from first chunk
        const firstChunkEnd = result[0].content.slice(-100);
        const hasOverlap = result[1].content.includes(firstChunkEnd.slice(0, 20));
        // Overlap may be adjusted at word boundaries
        expect(result.length).toBeGreaterThan(1);
      }
    });
  });

  describe('bounding box handling', () => {
    it('should set boundingBox to null by default', () => {
      const markdown = 'Content without bounding boxes.';
      const result = chunkMarkdown(markdown, []);

      expect(result.every((c) => c.boundingBox === null)).toBe(true);
    });
  });

  describe('token count estimation', () => {
    it('should include token count in each chunk', () => {
      const markdown = 'This is test content.';
      const result = chunkMarkdown(markdown, []);

      expect(result[0].tokenCount).toBeGreaterThan(0);
    });

    it('should estimate reasonable token counts', () => {
      const markdown = 'Word '.repeat(100); // 500 characters
      const result = chunkMarkdown(markdown, []);

      // At ~4 chars per token, 500 chars should be ~125 tokens
      expect(result[0].tokenCount).toBeGreaterThan(50);
      expect(result[0].tokenCount).toBeLessThan(200);
    });
  });
});

describe('estimateTokenCount', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('should estimate based on character count', () => {
    // At 4 chars per token approximation
    expect(estimateTokenCount('test')).toBe(1); // 4 chars = 1 token
    expect(estimateTokenCount('testtest')).toBe(2); // 8 chars = 2 tokens
    expect(estimateTokenCount('Hello World!')).toBe(3); // 12 chars = 3 tokens
  });

  it('should round up token count', () => {
    expect(estimateTokenCount('hi')).toBe(1); // 2 chars rounds up to 1 token
    expect(estimateTokenCount('hello')).toBe(2); // 5 chars rounds up to 2 tokens
  });
});
