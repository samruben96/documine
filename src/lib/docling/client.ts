/**
 * Docling Document Parsing Client
 *
 * TypeScript client for the Docling document parsing service.
 * Replaces LlamaParse with self-hosted Docling for better table extraction.
 *
 * Implements AC-4.8.5: Local Client Update
 *
 * @module @/lib/docling/client
 */

import { DoclingError } from '@/lib/errors';
import { log } from '@/lib/utils/logger';

/**
 * Page marker with position information.
 * Matches existing LlamaParse PageMarker interface for compatibility.
 */
export interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Bounding box for content positioning.
 * Maintained for interface compatibility (not currently used by Docling).
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result from document parsing.
 * Matches existing LlamaParseResult interface for drop-in replacement.
 */
export interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

/**
 * Response from Docling service API.
 */
interface DoclingApiResponse {
  markdown: string;
  page_markers: Array<{
    page_number: number;
    start_index: number;
    end_index: number;
  }>;
  page_count: number;
  processing_time_ms: number;
}

/**
 * Options for document parsing.
 */
export interface ParseOptions {
  /** Request timeout in milliseconds (default: 120000) */
  timeout?: number;
}

/**
 * Get MIME type from filename extension.
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Parse a document using the Docling service.
 *
 * This function maintains interface compatibility with the previous parsePdf function
 * from LlamaParse, making it a drop-in replacement.
 *
 * @param buffer - Document file content as ArrayBuffer or Uint8Array
 * @param filename - Original filename (used for MIME type detection)
 * @param serviceUrl - Docling service URL (e.g., http://localhost:8000)
 * @param options - Optional parsing options
 * @returns Parsed result with markdown, page markers, and page count
 * @throws DoclingError on service failures
 *
 * @example
 * ```typescript
 * const result = await parseDocument(
 *   pdfBuffer,
 *   'document.pdf',
 *   'http://localhost:8000'
 * );
 * console.log(result.markdown);
 * console.log(`Pages: ${result.pageCount}`);
 * ```
 */
export async function parseDocument(
  buffer: ArrayBuffer | Uint8Array,
  filename: string,
  serviceUrl: string,
  options: ParseOptions = {}
): Promise<DoclingResult> {
  const startTime = Date.now();
  const timeout = options.timeout ?? 120000;

  log.info('Docling parse started', { filename, serviceUrl });

  // Convert to ArrayBuffer for Blob constructor
  const arrayBuffer = buffer instanceof Uint8Array
    ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    : buffer;

  // Create form data with file
  const formData = new FormData();
  const blob = new Blob([arrayBuffer], { type: getMimeType(filename) });
  formData.append('file', blob, filename);

  // Make request to Docling service
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${serviceUrl}/parse`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new DoclingError(
        `Docling parse failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = (await response.json()) as DoclingApiResponse;

    // Transform response to match expected interface
    const result: DoclingResult = {
      markdown: data.markdown,
      pageMarkers: data.page_markers.map((pm) => ({
        pageNumber: pm.page_number,
        startIndex: pm.start_index,
        endIndex: pm.end_index,
      })),
      pageCount: data.page_count,
    };

    const duration = Date.now() - startTime;
    log.info('Docling parse completed', {
      filename,
      duration,
      pageCount: result.pageCount,
      processingTimeMs: data.processing_time_ms,
    });

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DoclingError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new DoclingError(`Docling parse timed out after ${timeout}ms`);
      }
      throw new DoclingError(`Docling service error: ${error.message}`);
    }

    throw new DoclingError('Unknown error during document parsing');
  }
}

/**
 * Check if the Docling service is healthy.
 *
 * @param serviceUrl - Docling service URL
 * @returns true if service is healthy, false otherwise
 */
export async function checkHealth(serviceUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status: string };
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Extract page information from markdown content.
 * This function is provided for compatibility with existing code that may
 * need to re-extract page markers from processed markdown.
 *
 * The regex pattern matches: --- PAGE X ---
 * This is compatible with the existing chunking service.
 */
export function extractPageInfo(markdown: string): {
  cleanMarkdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
} {
  const pageMarkers: PageMarker[] = [];
  const pagePattern = /---\s*PAGE\s+(\d+)\s*---/gi;

  let currentPage = 1;
  let match;

  // Find all page markers
  while ((match = pagePattern.exec(markdown)) !== null) {
    const pageNumStr = match[1];
    if (pageNumStr === undefined) continue;

    const pageNumber = parseInt(pageNumStr, 10);
    pageMarkers.push({
      pageNumber,
      startIndex: match.index,
      endIndex: pagePattern.lastIndex,
    });
    currentPage = Math.max(currentPage, pageNumber);
  }

  // If no page markers found, treat entire document as page 1
  if (pageMarkers.length === 0) {
    pageMarkers.push({
      pageNumber: 1,
      startIndex: 0,
      endIndex: 0,
    });
    return {
      cleanMarkdown: markdown,
      pageMarkers,
      pageCount: 1,
    };
  }

  // Keep page markers in output for chunking to use
  return {
    cleanMarkdown: markdown,
    pageMarkers,
    pageCount: currentPage,
  };
}
