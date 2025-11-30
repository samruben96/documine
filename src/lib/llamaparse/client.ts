/**
 * LlamaParse API Client
 *
 * Handles PDF extraction using LlamaParse cloud service.
 * Implements AC-4.6.1, AC-4.6.2: LlamaParse PDF extraction with structure preservation.
 *
 * @module @/lib/llamaparse/client
 */

import { LlamaParseError } from '@/lib/errors';
import { log } from '@/lib/utils/logger';

const LLAMAPARSE_API_BASE = 'https://api.cloud.llamaindex.ai/api/parsing';

export interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LlamaParseResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

interface JobStatusResponse {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  error_message?: string;
}

interface MarkdownResultResponse {
  markdown: string;
}

/**
 * Parse a PDF using LlamaParse API.
 *
 * Flow:
 * 1. Upload PDF to start parsing job
 * 2. Poll for job completion
 * 3. Retrieve markdown result
 *
 * @param pdfBuffer - PDF file content as ArrayBuffer or Uint8Array
 * @param filename - Original filename (for logging)
 * @param apiKey - LlamaParse API key (LLAMA_CLOUD_API_KEY)
 * @returns Parsed result with markdown, page markers, and page count
 * @throws LlamaParseError on API failures
 */
export async function parsePdf(
  pdfBuffer: ArrayBuffer | Uint8Array,
  filename: string,
  apiKey: string
): Promise<LlamaParseResult> {
  const startTime = Date.now();

  // Step 1: Upload PDF to start parsing job
  const jobId = await uploadPdf(pdfBuffer, filename, apiKey);
  log.info('LlamaParse job started', { jobId, filename });

  // Step 2: Poll for job completion
  await waitForJobCompletion(jobId, apiKey);

  // Step 3: Get markdown result
  const markdown = await getMarkdownResult(jobId, apiKey);

  // Extract page markers from markdown
  const { cleanMarkdown, pageMarkers, pageCount } = extractPageInfo(markdown);

  const duration = Date.now() - startTime;
  log.info('LlamaParse completed', { jobId, filename, duration, pageCount });

  return {
    markdown: cleanMarkdown,
    pageMarkers,
    pageCount,
  };
}

/**
 * Upload PDF to LlamaParse and get job ID
 */
async function uploadPdf(
  pdfBuffer: ArrayBuffer | Uint8Array,
  filename: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  // Convert to ArrayBuffer if Uint8Array
  const buffer = pdfBuffer instanceof Uint8Array
    ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer
    : pdfBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  formData.append('file', blob, filename);

  // Request markdown output with page separators
  formData.append('result_type', 'markdown');
  formData.append('page_separator', '--- PAGE {page_number} ---');
  formData.append('auto_mode_trigger_on_table_in_page', 'true');
  formData.append('auto_mode_trigger_on_image_in_page', 'true');

  const response = await fetch(`${LLAMAPARSE_API_BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new LlamaParseError(
      `LlamaParse upload failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * Poll for job completion
 */
async function waitForJobCompletion(
  jobId: string,
  apiKey: string,
  maxWaitMs = 120000,
  pollIntervalMs = 2000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${LLAMAPARSE_API_BASE}/job/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new LlamaParseError(`Failed to check job status: ${response.status}`);
    }

    const status = (await response.json()) as JobStatusResponse;

    if (status.status === 'SUCCESS') {
      return;
    }

    if (status.status === 'ERROR') {
      throw new LlamaParseError(`LlamaParse job failed: ${status.error_message || 'Unknown error'}`);
    }

    // Job still pending, wait and retry
    await sleep(pollIntervalMs);
  }

  throw new LlamaParseError(`LlamaParse job timed out after ${maxWaitMs}ms`);
}

/**
 * Get markdown result from completed job
 */
async function getMarkdownResult(jobId: string, apiKey: string): Promise<string> {
  const response = await fetch(`${LLAMAPARSE_API_BASE}/job/${jobId}/result/markdown`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new LlamaParseError(`Failed to get markdown result: ${response.status}`);
  }

  const data = (await response.json()) as MarkdownResultResponse;
  return data.markdown;
}

/**
 * Extract page markers from markdown content.
 * LlamaParse inserts "--- PAGE X ---" markers between pages.
 */
function extractPageInfo(markdown: string): {
  cleanMarkdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
} {
  const pageMarkers: PageMarker[] = [];
  const pagePattern = /---\s*PAGE\s+(\d+)\s*---/gi;

  let currentPage = 1;
  let lastIndex = 0;
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
    lastIndex = pagePattern.lastIndex;
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
  // (chunking service will use these to tag chunks with page numbers)
  return {
    cleanMarkdown: markdown,
    pageMarkers,
    pageCount: currentPage,
  };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
