/**
 * Document Chunking Service
 *
 * Splits markdown content into semantic chunks for embedding generation.
 * Implements AC-4.6.3, AC-4.6.4, AC-4.6.5: Semantic chunking with metadata.
 *
 * @module @/lib/documents/chunking
 */

import type { PageMarker, BoundingBox } from '@/lib/docling/client';

const DEFAULT_TARGET_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4; // Rough approximation

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
}

const DEFAULT_OPTIONS: ChunkOptions = {
  targetTokens: DEFAULT_TARGET_TOKENS,
  overlapTokens: DEFAULT_OVERLAP_TOKENS,
};

/**
 * Chunk markdown content into semantic segments.
 *
 * Strategy:
 * 1. Split content by page markers first
 * 2. Within each page, split by paragraph/section boundaries
 * 3. Merge small chunks, split large ones to target size
 * 4. Add overlap between consecutive chunks
 * 5. Tag each chunk with page number
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

  // Process each page into chunks
  const allChunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks = splitPageIntoChunks(page.content, targetChars, overlapChars);

    for (const chunkContent of pageChunks) {
      allChunks.push({
        content: chunkContent.trim(),
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        boundingBox: null, // Bounding boxes extracted separately if available
        tokenCount: estimateTokenCount(chunkContent),
      });
    }
  }

  // Add overlap between consecutive chunks
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
 * Split a single page's content into chunks respecting semantic boundaries
 */
function splitPageIntoChunks(
  content: string,
  targetChars: number,
  _overlapChars: number
): string[] {
  if (content.length <= targetChars) {
    return [content];
  }

  const chunks: string[] = [];

  // First try to split by major sections (## headers)
  const sections = splitByPattern(content, /(?=^##\s)/m);

  for (const section of sections) {
    if (section.length <= targetChars) {
      chunks.push(section);
    } else {
      // Section too large, split by paragraphs
      const paragraphs = splitByPattern(section, /\n\n+/);
      let currentChunk = '';

      for (const para of paragraphs) {
        if (currentChunk.length + para.length <= targetChars) {
          currentChunk += (currentChunk ? '\n\n' : '') + para;
        } else {
          // Save current chunk if not empty
          if (currentChunk) {
            chunks.push(currentChunk);
          }

          // Handle paragraph larger than target
          if (para.length > targetChars) {
            const splitPara = splitLargeParagraph(para, targetChars);
            chunks.push(...splitPara.slice(0, -1));
            currentChunk = splitPara[splitPara.length - 1] || '';
          } else {
            currentChunk = para;
          }
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Split content by pattern while keeping the delimiter with the following content
 */
function splitByPattern(content: string, pattern: RegExp): string[] {
  const parts = content.split(pattern);
  return parts.filter((p) => p.trim().length > 0);
}

/**
 * Split a large paragraph by sentences when it exceeds target size
 */
function splitLargeParagraph(paragraph: string, targetChars: number): string[] {
  const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= targetChars) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // Handle sentence larger than target (rare case)
      if (sentence.length > targetChars) {
        // Force split by character count
        const forceSplit = forceChunkSplit(sentence, targetChars);
        chunks.push(...forceSplit.slice(0, -1));
        currentChunk = forceSplit[forceSplit.length - 1] || '';
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Force split content at word boundaries when all else fails
 */
function forceChunkSplit(content: string, targetChars: number): string[] {
  const words = content.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= targetChars) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Add overlap between consecutive chunks for context continuity
 */
function addChunkOverlap(chunks: DocumentChunk[], overlapChars: number): DocumentChunk[] {
  if (chunks.length <= 1 || overlapChars <= 0) {
    return chunks;
  }

  const overlappedChunks: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    let content = chunk.content;

    // Add overlap from previous chunk (last N characters)
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      if (prevChunk) {
        const prevContent = prevChunk.content;
        const overlap = getOverlapText(prevContent, overlapChars);
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
