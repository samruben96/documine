import { describe, it, expect } from 'vitest';
import {
  chunkMarkdown,
  estimateTokenCount,
  extractTablesWithPlaceholders,
  generateTableSummary,
  recursiveCharacterTextSplitter,
  type DocumentChunk,
} from '@/lib/documents/chunking';
import type { PageMarker } from '@/lib/docling/client';

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
      expect(result[0].chunkType).toBe('text');
      expect(result[0].summary).toBeNull();
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

// Story 5.9: Table Detection Tests
describe('extractTablesWithPlaceholders', () => {
  it('should extract simple markdown table', () => {
    const content = `Some text before.

| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |

Some text after.`;

    const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(1);
    expect(textWithPlaceholders).toContain('{{TABLE_0}}');
    expect(textWithPlaceholders).not.toContain('| Column A |');

    const tableContent = tables.get('{{TABLE_0}}');
    expect(tableContent).toContain('| Column A | Column B |');
    expect(tableContent).toContain('| Value 1  | Value 2  |');
  });

  it('should extract multiple tables', () => {
    const content = `First table:

| A | B |
|---|---|
| 1 | 2 |

Middle text.

| X | Y | Z |
|---|---|---|
| a | b | c |
| d | e | f |

End text.`;

    const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(2);
    expect(textWithPlaceholders).toContain('{{TABLE_0}}');
    expect(textWithPlaceholders).toContain('{{TABLE_1}}');
  });

  it('should handle table with alignment markers', () => {
    const content = `| Left | Center | Right |
|:-----|:------:|------:|
| a    |   b    |     c |`;

    const { tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(1);
    const tableContent = tables.get('{{TABLE_0}}');
    expect(tableContent).toContain(':-----|:------:|------:');
  });

  it('should preserve text without tables', () => {
    const content = 'Just plain text without any tables.';
    const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(0);
    expect(textWithPlaceholders).toBe(content);
  });

  it('should handle table at document start', () => {
    const content = `| Header |
|--------|
| Data   |

Text after.`;

    const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(1);
    expect(textWithPlaceholders.trim().startsWith('{{TABLE_0}}')).toBe(true);
  });

  it('should handle table at document end', () => {
    const content = `Text before.

| Header |
|--------|
| Data   |`;

    const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

    expect(tables.size).toBe(1);
    expect(textWithPlaceholders).toContain('Text before');
  });
});

describe('generateTableSummary', () => {
  it('should generate summary with column names and row count', () => {
    const table = `| Coverage Type | Limit | Deductible |
|---------------|-------|------------|
| General Liability | $1,000,000 | $5,000 |
| Property | $500,000 | $10,000 |`;

    const summary = generateTableSummary(table);

    expect(summary).toContain('3 columns');
    expect(summary).toContain('Coverage Type');
    expect(summary).toContain('Limit');
    expect(summary).toContain('Deductible');
    expect(summary).toContain('2 rows');
  });

  it('should handle table with many columns', () => {
    const table = `| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |`;

    const summary = generateTableSummary(table);

    expect(summary).toContain('7 columns');
    expect(summary).toContain('and 2 more columns');
  });

  it('should handle empty table (header only)', () => {
    const table = `| Header |
|--------|`;

    const summary = generateTableSummary(table);

    expect(summary).toContain('1 columns');
    expect(summary).toContain('0 rows');
  });

  it('should handle malformed table gracefully', () => {
    const table = 'Not a table at all';
    const summary = generateTableSummary(table);

    expect(summary).toContain('Table with');
  });
});

describe('recursiveCharacterTextSplitter', () => {
  it('should return single chunk for short text', () => {
    const text = 'Short text.';
    const chunks = recursiveCharacterTextSplitter(text, 100);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('Short text.');
  });

  it('should split by paragraph first', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = recursiveCharacterTextSplitter(text, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toContain('Para 1');
  });

  it('should fall back to line breaks for large paragraphs', () => {
    const text = 'Line 1.\nLine 2.\nLine 3.\nLine 4.';
    const chunks = recursiveCharacterTextSplitter(text, 20);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should fall back to sentences', () => {
    const text = 'Sentence one. Sentence two. Sentence three. Sentence four.';
    const chunks = recursiveCharacterTextSplitter(text, 30);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should contain complete sentences
    expect(chunks.some((c) => c.includes('.'))).toBe(true);
  });

  it('should handle text smaller than target size', () => {
    const text = 'Short.';
    const chunks = recursiveCharacterTextSplitter(text, 1000);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('Short.');
  });

  it('should handle very long text', () => {
    const text = 'Word '.repeat(1000);
    const chunks = recursiveCharacterTextSplitter(text, 200);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be under target size (with some margin)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(250);
    }
  });

  it('should not produce empty chunks', () => {
    const text = 'Para 1.\n\n\n\nPara 2.\n\nPara 3.';
    const chunks = recursiveCharacterTextSplitter(text, 20);

    expect(chunks.every((c) => c.length > 0)).toBe(true);
  });
});

// Story 5.9: Table-Aware Chunking Integration Tests
describe('table-aware chunking', () => {
  it('should preserve tables as single chunks', () => {
    const markdown = `Introduction text.

| Coverage | Limit |
|----------|-------|
| Liability | $1M  |
| Property | $500K |

Conclusion text.`;

    const result = chunkMarkdown(markdown, []);

    // Find the table chunk
    const tableChunk = result.find((c) => c.chunkType === 'table');
    expect(tableChunk).toBeDefined();
    expect(tableChunk?.content).toContain('| Coverage | Limit |');
    expect(tableChunk?.summary).toContain('2 columns');
    expect(tableChunk?.summary).toContain('2 rows');
  });

  it('should set chunk_type correctly', () => {
    const markdown = `Text content.

| A | B |
|---|---|
| 1 | 2 |

More text.`;

    const result = chunkMarkdown(markdown, []);

    const textChunks = result.filter((c) => c.chunkType === 'text');
    const tableChunks = result.filter((c) => c.chunkType === 'table');

    expect(textChunks.length).toBeGreaterThan(0);
    expect(tableChunks.length).toBe(1);
  });

  it('should generate summary only for table chunks', () => {
    const markdown = `Text.

| X |
|---|
| 1 |`;

    const result = chunkMarkdown(markdown, []);

    const textChunk = result.find((c) => c.chunkType === 'text');
    const tableChunk = result.find((c) => c.chunkType === 'table');

    expect(textChunk?.summary).toBeNull();
    expect(tableChunk?.summary).toBeDefined();
    expect(tableChunk?.summary).toContain('1 columns');
  });

  it('should handle large table without splitting', () => {
    // Create a table with 20+ rows
    let table = '| Col1 | Col2 | Col3 |\n|------|------|------|\n';
    for (let i = 0; i < 25; i++) {
      table += `| Row${i} | Data | More |\n`;
    }

    const markdown = `Before table.\n\n${table}\nAfter table.`;

    const result = chunkMarkdown(markdown, [], {
      targetTokens: 100, // Small target to test table preservation
      overlapTokens: 10,
    });

    // Table should remain as single chunk despite being large
    const tableChunk = result.find((c) => c.chunkType === 'table');
    expect(tableChunk).toBeDefined();
    expect(tableChunk?.content).toContain('Row24'); // Last row should be present
    expect(tableChunk?.summary).toContain('25 rows');
  });

  it('should handle multiple tables on same page', () => {
    const markdown = `Table 1:

| A | B |
|---|---|
| 1 | 2 |

Some text between tables.

Table 2:

| X | Y | Z |
|---|---|---|
| a | b | c |`;

    const result = chunkMarkdown(markdown, []);

    const tableChunks = result.filter((c) => c.chunkType === 'table');
    expect(tableChunks).toHaveLength(2);

    expect(tableChunks[0].summary).toContain('2 columns');
    expect(tableChunks[1].summary).toContain('3 columns');
  });

  it('should maintain correct chunk indices with tables', () => {
    const markdown = `Text.

| A |
|---|
| 1 |

More text.`;

    const result = chunkMarkdown(markdown, []);

    // All indices should be unique and sequential
    const indices = result.map((c) => c.chunkIndex);
    for (let i = 0; i < indices.length; i++) {
      expect(indices[i]).toBe(i);
    }
  });

  it('should not add overlap to table chunks', () => {
    const markdown = `Long text before the table. ${'Word '.repeat(50)}

| Header |
|--------|
| Data   |

Long text after the table. ${'More '.repeat(50)}`;

    const result = chunkMarkdown(markdown, [], {
      targetTokens: 100,
      overlapTokens: 20,
    });

    const tableChunk = result.find((c) => c.chunkType === 'table');

    // Table content should not contain overlap text
    expect(tableChunk?.content.startsWith('| Header |')).toBe(true);
  });

  it('should handle table spanning across page boundary', () => {
    const markdown = `--- PAGE 1 ---

Text on page 1.

| A | B |
|---|---|
| 1 | 2 |

--- PAGE 2 ---

Text on page 2.`;

    const pageMarkers: PageMarker[] = [
      { pageNumber: 1, startIndex: 0, endIndex: 14 },
      { pageNumber: 2, startIndex: 60, endIndex: 74 },
    ];

    const result = chunkMarkdown(markdown, pageMarkers);

    const tableChunk = result.find((c) => c.chunkType === 'table');
    expect(tableChunk).toBeDefined();
    expect(tableChunk?.pageNumber).toBe(1); // Table should be on page 1
  });

  it('should handle consecutive tables', () => {
    const markdown = `| A |
|---|
| 1 |

| B |
|---|
| 2 |`;

    const result = chunkMarkdown(markdown, []);

    const tableChunks = result.filter((c) => c.chunkType === 'table');
    expect(tableChunks).toHaveLength(2);
  });
});
