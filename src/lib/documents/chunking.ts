/**
 * Document Chunking Service
 *
 * Splits markdown content into semantic chunks for embedding generation.
 * Story 5.9: Enhanced with RecursiveCharacterTextSplitter and table-aware chunking.
 *
 * Key Features:
 * - Recursive text splitting with separator hierarchy ["\n\n", "\n", ". ", " "]
 * - Table detection and preservation as single chunks
 * - Table summary generation for retrieval optimization
 * - Configurable chunk overlap
 *
 * @module @/lib/documents/chunking
 */

import type { PageMarker, BoundingBox } from '@/lib/docling/client';

// Configuration constants
const DEFAULT_TARGET_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4; // Rough approximation

// Separator hierarchy for recursive splitting (most semantic to least)
const SEPARATORS = ['\n\n', '\n', '. ', ' '];

// Table detection regex - matches complete markdown tables
// Pattern: Header row | separator row | data rows
const TABLE_PATTERN = /(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+)/g;

export interface ChunkOptions {
  targetTokens: number;
  overlapTokens: number;
}

export interface DocumentChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  boundingBox: BoundingBox | null;
  tokenCount: number;
  chunkType: 'text' | 'table';
  summary: string | null;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  targetTokens: DEFAULT_TARGET_TOKENS,
  overlapTokens: DEFAULT_OVERLAP_TOKENS,
};

/**
 * Extract tables from content and replace with placeholders.
 * Winston's recommended extract-placeholder-reinsert pattern.
 */
export function extractTablesWithPlaceholders(content: string): {
  textWithPlaceholders: string;
  tables: Map<string, string>;
} {
  const tables = new Map<string, string>();
  let tableIndex = 0;

  const textWithPlaceholders = content.replace(TABLE_PATTERN, (match) => {
    const placeholder = `{{TABLE_${tableIndex++}}}`;
    tables.set(placeholder, match.trim());
    return `\n${placeholder}\n`;
  });

  return { textWithPlaceholders, tables };
}

/**
 * Generate a rule-based summary for a markdown table.
 * Fast and deterministic - avoids LLM calls for performance.
 *
 * Story 5.9 (AC-5.9.6): Summary used for embedding, raw table for answer generation.
 */
export function generateTableSummary(tableMarkdown: string): string {
  const lines = tableMarkdown.trim().split('\n');

  if (lines.length < 2) {
    return 'Table with unknown structure.';
  }

  const headerRow = lines[0] || '';

  // Extract column names from header row
  const columns = headerRow
    .split('|')
    .filter((col) => col.trim())
    .map((col) => col.trim());

  // Count data rows (skip header and separator)
  const dataRows = lines.slice(2).filter((row) => row.includes('|'));
  const rowCount = dataRows.length;

  if (columns.length === 0) {
    return `Table with ${rowCount} rows of data.`;
  }

  // Build summary
  const columnList = columns.slice(0, 5).join(', ');
  const columnSuffix = columns.length > 5 ? `, and ${columns.length - 5} more columns` : '';

  return `Table with ${columns.length} columns (${columnList}${columnSuffix}) containing ${rowCount} rows of data.`;
}

/**
 * RecursiveCharacterTextSplitter implementation.
 * Splits text using a hierarchy of separators, recursively handling oversized segments.
 *
 * Story 5.9 (AC-5.9.1, AC-5.9.2): Separator hierarchy ["\n\n", "\n", ". ", " "]
 */
export function recursiveCharacterTextSplitter(
  text: string,
  targetChars: number,
  separators: string[] = SEPARATORS
): string[] {
  // Base case: text fits within target
  if (text.length <= targetChars) {
    return text.trim() ? [text.trim()] : [];
  }

  // No more separators - force split at word boundaries
  if (separators.length === 0) {
    return forceWordSplit(text, targetChars);
  }

  const separator = separators[0]!;
  const remainingSeparators = separators.slice(1);

  // Split by current separator
  const splits = text.split(separator);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const split of splits) {
    const potentialChunk = currentChunk
      ? currentChunk + separator + split
      : split;

    if (potentialChunk.length <= targetChars) {
      currentChunk = potentialChunk;
    } else {
      // Save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // Handle segment that's too large - recurse with finer separator
      if (split.length > targetChars) {
        const subChunks = recursiveCharacterTextSplitter(
          split,
          targetChars,
          remainingSeparators
        );
        chunks.push(...subChunks);
        currentChunk = '';
      } else {
        currentChunk = split;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Force split text at word boundaries when no separators work.
 */
function forceWordSplit(text: string, targetChars: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= targetChars) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // Handle word longer than target (rare)
      if (word.length > targetChars) {
        // Split word by characters as last resort
        for (let i = 0; i < word.length; i += targetChars) {
          chunks.push(word.slice(i, i + targetChars));
        }
        currentChunk = '';
      } else {
        currentChunk = word;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Chunk markdown content into semantic segments with table awareness.
 *
 * Strategy (Story 5.9):
 * 1. Split content by page markers first
 * 2. Extract tables and replace with placeholders
 * 3. Apply recursive text splitter to non-table content
 * 4. Reinsert tables as separate chunks with summaries
 * 5. Add overlap between consecutive text chunks
 * 6. Tag each chunk with page number and type
 *
 * @param markdown - Markdown content from Docling document parser
 * @param pageMarkers - Page boundary markers
 * @param options - Chunking options (target tokens, overlap)
 * @returns Array of document chunks with metadata
 */
export function chunkMarkdown(
  markdown: string,
  pageMarkers: PageMarker[],
  options: ChunkOptions = DEFAULT_OPTIONS
): DocumentChunk[] {
  if (!markdown.trim()) {
    return [];
  }

  const { targetTokens, overlapTokens } = options;
  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  // Split content by pages
  const pages = splitByPages(markdown, pageMarkers);

  // Process each page into chunks with table awareness
  const allChunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkPageWithTableAwareness(
      page.content,
      targetChars,
      page.pageNumber,
      globalChunkIndex
    );

    for (const chunk of pageChunks) {
      allChunks.push(chunk);
      globalChunkIndex++;
    }
  }

  // Add overlap between consecutive text chunks (not table chunks)
  return addChunkOverlap(allChunks, overlapChars);
}

interface PageContent {
  pageNumber: number;
  content: string;
}

/**
 * Split markdown by page markers
 */
function splitByPages(markdown: string, pageMarkers: PageMarker[]): PageContent[] {
  if (pageMarkers.length === 0) {
    return [{ pageNumber: 1, content: markdown }];
  }

  const pages: PageContent[] = [];
  const pagePattern = /---\s*PAGE\s+(\d+)\s*---/gi;

  // Split by page markers
  const parts = markdown.split(pagePattern);

  if (parts.length === 1) {
    // No page markers found, treat as single page
    return [{ pageNumber: 1, content: markdown }];
  }

  // First part is content before any page marker (if any)
  let currentPage = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;

    // Check if this part is a page number (digit only from regex capture)
    if (/^\d+$/.test(part.trim())) {
      currentPage = parseInt(part.trim(), 10);
      continue;
    }

    const content = part.trim();
    if (content) {
      pages.push({
        pageNumber: currentPage,
        content,
      });
    }
  }

  return pages;
}

/**
 * Chunk a single page's content with table awareness.
 * Story 5.9 (AC-5.9.3, AC-5.9.4, AC-5.9.5): Tables as single chunks with metadata.
 */
function chunkPageWithTableAwareness(
  content: string,
  targetChars: number,
  pageNumber: number,
  startIndex: number
): DocumentChunk[] {
  // Step 1: Extract tables and replace with placeholders
  const { textWithPlaceholders, tables } = extractTablesWithPlaceholders(content);

  // Step 2: Split text content using recursive splitter
  const textChunks = recursiveCharacterTextSplitter(textWithPlaceholders, targetChars);

  // Step 3: Process chunks - expand placeholders to table chunks
  const finalChunks: DocumentChunk[] = [];
  let chunkIndex = startIndex;

  for (const chunk of textChunks) {
    // Check if chunk contains table placeholder
    const placeholderMatches = chunk.match(/\{\{TABLE_\d+\}\}/g);

    if (placeholderMatches && placeholderMatches.length > 0) {
      // Split chunk around table placeholders
      let remaining = chunk;

      for (const placeholder of placeholderMatches) {
        const parts = remaining.split(placeholder);
        const before = parts[0]?.trim();
        remaining = parts.slice(1).join(placeholder);

        // Add text before table (if any)
        if (before && before.length > 0) {
          finalChunks.push(createTextChunk(before, pageNumber, chunkIndex++));
        }

        // Add table as its own chunk
        const tableContent = tables.get(placeholder);
        if (tableContent) {
          finalChunks.push(createTableChunk(tableContent, pageNumber, chunkIndex++));
        }
      }

      // Add text after last table (if any)
      const after = remaining.trim();
      if (after && after.length > 0) {
        finalChunks.push(createTextChunk(after, pageNumber, chunkIndex++));
      }
    } else {
      // Regular text chunk
      finalChunks.push(createTextChunk(chunk, pageNumber, chunkIndex++));
    }
  }

  return finalChunks;
}

/**
 * Create a text chunk with metadata
 */
function createTextChunk(
  content: string,
  pageNumber: number,
  chunkIndex: number
): DocumentChunk {
  return {
    content,
    pageNumber,
    chunkIndex,
    boundingBox: null,
    tokenCount: estimateTokenCount(content),
    chunkType: 'text',
    summary: null,
  };
}

/**
 * Create a table chunk with metadata and summary.
 * Story 5.9 (AC-5.9.4, AC-5.9.5, AC-5.9.6): Table preservation with summary.
 */
function createTableChunk(
  tableContent: string,
  pageNumber: number,
  chunkIndex: number
): DocumentChunk {
  const summary = generateTableSummary(tableContent);

  return {
    content: tableContent,
    pageNumber,
    chunkIndex,
    boundingBox: null,
    tokenCount: estimateTokenCount(tableContent),
    chunkType: 'table',
    summary,
  };
}

/**
 * Add overlap between consecutive text chunks for context continuity.
 * Tables don't get overlap - they're self-contained.
 */
function addChunkOverlap(chunks: DocumentChunk[], overlapChars: number): DocumentChunk[] {
  if (chunks.length <= 1 || overlapChars <= 0) {
    return chunks;
  }

  const overlappedChunks: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    // Skip overlap for table chunks
    if (chunk.chunkType === 'table') {
      overlappedChunks.push(chunk);
      continue;
    }

    let content = chunk.content;

    // Add overlap from previous text chunk (skip if previous was table)
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      if (prevChunk && prevChunk.chunkType === 'text') {
        const overlap = getOverlapText(prevChunk.content, overlapChars);
        if (overlap && !content.startsWith(overlap)) {
          content = overlap + '\n\n' + content;
        }
      }
    }

    overlappedChunks.push({
      ...chunk,
      content,
      tokenCount: estimateTokenCount(content),
    });
  }

  return overlappedChunks;
}

/**
 * Extract overlap text from end of content, respecting word boundaries
 */
function getOverlapText(content: string, overlapChars: number): string {
  if (content.length <= overlapChars) {
    return content;
  }

  // Take last N characters
  let overlap = content.slice(-overlapChars);

  // Adjust to word boundary
  const firstSpace = overlap.indexOf(' ');
  if (firstSpace > 0 && firstSpace < overlap.length / 2) {
    overlap = overlap.slice(firstSpace + 1);
  }

  return overlap.trim();
}

/**
 * Estimate token count from character count
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Extract bounding boxes from document parser JSON output.
 * Called separately when bounding box data is available.
 */
export function extractBoundingBoxes(
  _parserJson: unknown
): Map<number, BoundingBox[]> {
  // Bounding boxes are in the JSON response from document parsers
  // For MVP, we return empty map as bounding boxes are optional (AC-4.6.5: NULL if not available)
  // Full implementation would parse the JSON response for bbox coordinates
  return new Map();
}

/**
 * Attach bounding boxes to chunks based on page and position
 */
export function attachBoundingBoxes(
  chunks: DocumentChunk[],
  boundingBoxes: Map<number, BoundingBox[]>
): DocumentChunk[] {
  if (boundingBoxes.size === 0) {
    return chunks;
  }

  return chunks.map((chunk) => {
    const pageBoxes = boundingBoxes.get(chunk.pageNumber);
    // For now, return null as bounding box matching requires text position correlation
    // which depends on document parser JSON format
    return {
      ...chunk,
      boundingBox: pageBoxes?.[0] || null,
    };
  });
}
