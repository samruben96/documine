/**
 * Document Processing Edge Function
 *
 * Orchestrates the document processing pipeline:
 * 1. Check for stale jobs and mark failed
 * 2. Verify agency can process (no active job)
 * 3. Select next pending job in FIFO order
 * 4. Download document from Supabase Storage
 * 5. Extract text via Docling service (self-hosted)
 * 6. Chunk text into semantic segments
 * 7. Generate embeddings via OpenAI
 * 8. Store chunks in document_chunks table
 * 9. Update document status
 * 10. Trigger next pending job for agency
 *
 * Implements AC-4.6.1 through AC-4.6.11, AC-4.7.1 through AC-4.7.5, and AC-4.8.4
 *
 * @module supabase/functions/process-document
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 20;
const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;

// Story 5.8.1: Timeout approach optimized for Supabase paid tier (550s platform limit)
// - Docling: 300s (5 min) - handles large/complex PDFs with extensive tables
// - Total: 480s (8 min) - leaves 70s safety buffer before 550s platform timeout
// - Allows processing of 50-100MB documents with complex content
const DOCLING_TIMEOUT_MS = 300000; // 300s (5 min) - paid tier optimization
const TOTAL_PROCESSING_TIMEOUT_MS = 480000; // 480s (8 min) - ensures error handling runs before platform timeout

// Story 5.13: PDF parsing robustness - error detection patterns
// Known libpdfium errors that indicate PDF format issues (not corruption)
const PAGE_DIMENSIONS_ERROR_PATTERNS = [
  'could not find the page-dimensions',
  'could not find page-dimensions',
  'page-dimensions',
  'MediaBox',
  'libpdfium',
] as const;

// User-friendly error messages for specific error types
const USER_FRIENDLY_ERRORS: Record<string, string> = {
  'page-dimensions':
    'This PDF has an unusual format that our system can\'t process. Try re-saving it with Adobe Acrobat or a PDF converter.',
  'timeout':
    'Processing timeout: document too large or complex. Try splitting into smaller files.',
  'unsupported-format':
    'This file format is not supported. Please upload a PDF, DOCX, or image file.',
};

// Story 5.12: Progress reporting configuration
// Stage weights for total_progress calculation:
// downloading: 5% (quick), parsing: 60% (bulk), chunking: 10% (quick), embedding: 25%
const STAGE_WEIGHTS = {
  downloading: { start: 0, weight: 5 },
  parsing: { start: 5, weight: 60 },
  chunking: { start: 65, weight: 10 },
  embedding: { start: 75, weight: 25 },
} as const;

// Progress update throttle (max once per second to avoid flooding Realtime)
const PROGRESS_THROTTLE_MS = 1000;
let lastProgressUpdate = 0;

// Types
interface ProcessingPayload {
  documentId: string;
  storagePath: string;
  agencyId: string;
}

interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

interface DocumentChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  tokenCount: number;
  chunkType: 'text' | 'table';
  summary: string | null;
}

interface LogData {
  [key: string]: unknown;
}

// Story 5.12: Progress data interface
interface ProgressData {
  stage: 'downloading' | 'parsing' | 'chunking' | 'embedding';
  stage_progress: number; // 0-100
  stage_name: string; // User-friendly name
  estimated_seconds_remaining: number | null;
  total_progress: number; // 0-100 across all stages
  updated_at: string;
}

// User-friendly stage names per UX design
const STAGE_DISPLAY_NAMES: Record<ProgressData['stage'], string> = {
  downloading: 'Loading file',
  parsing: 'Reading document',
  chunking: 'Preparing content',
  embedding: 'Indexing for search',
};

// Structured logging
const log = {
  info: (message: string, data?: LogData): void => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
  warn: (message: string, data?: LogData): void => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
  error: (message: string, error: Error, data?: LogData): void => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
};

/**
 * Check if total processing time has exceeded timeout
 * Story 5.8.1 (AC-5.8.1.5): 240s total processing timeout
 * Throws user-friendly error if timeout exceeded
 */
function checkProcessingTimeout(startTime: number): void {
  const elapsed = Date.now() - startTime;
  if (elapsed > TOTAL_PROCESSING_TIMEOUT_MS) {
    throw new Error(
      'Processing timeout: document too large or complex. Try splitting into smaller files.'
    );
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const doclingServiceUrl = Deno.env.get('DOCLING_SERVICE_URL');

  if (!supabaseUrl || !supabaseServiceKey || !openaiKey || !doclingServiceUrl) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required environment variables' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload: ProcessingPayload;
  try {
    payload = await req.json() as ProcessingPayload;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { documentId, storagePath, agencyId } = payload;

  log.info('Processing request received', { documentId, agencyId, storagePath });

  try {
    // Step 0: Mark stale jobs as failed (AC-4.7.5)
    const staleCount = await markStaleJobsFailed(supabase);
    if (staleCount > 0) {
      log.info('Marked stale jobs as failed', { count: staleCount });
    }

    // Step 1: Check if agency already has an active processing job (AC-4.7.2)
    const hasActiveJob = await hasActiveProcessingJob(supabase, agencyId);
    if (hasActiveJob) {
      log.info('Agency has active job, skipping', { documentId, agencyId });
      return new Response(
        JSON.stringify({ success: true, queued: true, message: 'Job queued, another job is processing' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get next pending job in FIFO order (AC-4.7.1)
    const nextJob = await getNextPendingJob(supabase, agencyId);
    if (!nextJob) {
      log.info('No pending jobs for agency', { agencyId });
      return new Response(
        JSON.stringify({ success: true, message: 'No pending jobs to process' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if the triggered document matches the FIFO order
    // If not, we'll process the oldest one (FIFO) instead
    const processingDocumentId = nextJob.document_id;
    const processingStoragePath = await getDocumentStoragePath(supabase, processingDocumentId);

    if (!processingStoragePath) {
      log.error('Document storage path not found', new Error('Storage path missing'), {
        documentId: processingDocumentId
      });
      await updateJobStatus(supabase, processingDocumentId, 'failed', 'Document storage path not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Document storage path not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (processingDocumentId !== documentId) {
      log.info('Processing older queued document (FIFO)', {
        requestedDocumentId: documentId,
        processingDocumentId
      });
    }

    log.info('Processing started', { documentId: processingDocumentId, agencyId });

    // Step 3: Update job status to 'processing'
    await updateJobStatus(supabase, processingDocumentId, 'processing');

    // Story 5.12: Initialize progress reporting
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'downloading',
      0,
      estimateTimeRemaining(0, 'downloading', 0),
      true // Force initial update
    );

    // Step 4: Download PDF from Storage
    const pdfBuffer = await downloadFromStorage(supabase, processingStoragePath);
    log.info('PDF downloaded', { documentId: processingDocumentId, size: pdfBuffer.byteLength });

    // Story 5.12: Report download complete
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'downloading',
      100,
      estimateTimeRemaining(pdfBuffer.byteLength, 'downloading', 100),
      true
    );
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 5: Send to Docling service
    // Story 5.12: Report parsing start (Docling doesn't report page-level progress, use time-based)
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'parsing',
      0,
      estimateTimeRemaining(pdfBuffer.byteLength, 'parsing', 0),
      true
    );

    const parseStartTime = Date.now();
    const parseResult = await parseDocumentWithRetry(pdfBuffer, processingStoragePath, doclingServiceUrl);

    // Story 5.12: Report parsing complete
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'parsing',
      100,
      estimateTimeRemaining(pdfBuffer.byteLength, 'parsing', 100),
      true
    );

    log.info('Docling parsing completed', {
      documentId: processingDocumentId,
      duration: Date.now() - parseStartTime,
      pageCount: parseResult.pageCount,
    });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 6: Chunk the content
    // Story 5.12: Report chunking start (fast stage, just show start/end)
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'chunking',
      0,
      estimateTimeRemaining(pdfBuffer.byteLength, 'chunking', 0),
      true
    );

    const chunks = chunkMarkdown(parseResult.markdown, parseResult.pageMarkers);

    // Story 5.12: Report chunking complete
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'chunking',
      100,
      estimateTimeRemaining(pdfBuffer.byteLength, 'chunking', 100),
      true
    );

    log.info('Chunking completed', { documentId: processingDocumentId, chunkCount: chunks.length });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 6.5: AI Tagging (Story F2-3)
    // AC-F2-3.1: Generate tags, AC-F2-3.2: Generate summary, AC-F2-3.3: Infer document type
    // AC-F2-3.4: 5-second timeout, AC-F2-3.5: Graceful degradation
    await performAITagging(supabase, processingDocumentId, chunks, openaiKey);

    // Step 7: Generate embeddings
    // Story 5.12: Report embedding progress with batch-level updates
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'embedding',
      0,
      estimateTimeRemaining(pdfBuffer.byteLength, 'embedding', 0),
      true
    );

    const embeddingsStartTime = Date.now();
    const embeddings = await generateEmbeddingsWithRetry(
      chunks.map((c) => c.content),
      openaiKey,
      async (batchIndex, totalBatches) => {
        // Story 5.12: Report embedding progress per batch
        const progress = Math.round((batchIndex / totalBatches) * 100);
        await updateJobProgress(
          supabase,
          processingDocumentId,
          'embedding',
          progress,
          estimateTimeRemaining(pdfBuffer.byteLength, 'embedding', progress)
        );
      }
    );

    // Story 5.12: Report embeddings complete
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'embedding',
      100,
      null, // No time remaining - we're done!
      true
    );

    log.info('Embeddings completed', {
      documentId: processingDocumentId,
      duration: Date.now() - embeddingsStartTime,
    });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 8: Insert chunks into database
    await insertChunks(supabase, processingDocumentId, agencyId, chunks, embeddings);
    log.info('Chunks inserted', { documentId: processingDocumentId, count: chunks.length });

    // Step 9: Update document status to 'ready' with page count
    await updateDocumentStatus(supabase, processingDocumentId, 'ready', parseResult.pageCount);

    // Step 10: Complete processing job
    await updateJobStatus(supabase, processingDocumentId, 'completed');

    const totalDuration = Date.now() - startTime;
    log.info('Processing completed', {
      documentId: processingDocumentId,
      duration: totalDuration,
      chunkCount: chunks.length,
      pageCount: parseResult.pageCount,
    });

    // Step 11: Check if there are more pending jobs for this agency (AC-4.7.3)
    // and trigger the next one
    const nextPendingJob = await getNextPendingJob(supabase, agencyId);
    if (nextPendingJob) {
      log.info('Triggering next pending job', {
        nextDocumentId: nextPendingJob.document_id,
        agencyId
      });
      // Fire and forget - trigger next job asynchronously
      triggerNextJob(supabaseUrl, supabaseServiceKey, nextPendingJob.document_id, agencyId).catch((err) => {
        log.warn('Failed to trigger next job', { error: err.message });
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunkCount: chunks.length,
        pageCount: parseResult.pageCount,
        documentId: processingDocumentId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Processing failed', err, { documentId, step: 'unknown' });

    // Update document and job status to failed
    try {
      await updateDocumentStatus(supabase, documentId, 'failed');
      await updateJobStatus(supabase, documentId, 'failed', err.message);
    } catch (updateError) {
      log.error('Failed to update failure status', updateError as Error, { documentId });
    }

    // Even on failure, try to trigger the next job (AC-4.7.3)
    const nextPendingJob = await getNextPendingJob(supabase, agencyId);
    if (nextPendingJob) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      triggerNextJob(supabaseUrl, supabaseServiceKey, nextPendingJob.document_id, agencyId).catch((triggerErr) => {
        log.warn('Failed to trigger next job after failure', { error: triggerErr.message });
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Storage Operations
// ============================================================================

async function downloadFromStorage(
  supabase: ReturnType<typeof createClient>,
  storagePath: string
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download PDF: ${error?.message || 'No data'}`);
  }

  return new Uint8Array(await data.arrayBuffer());
}

// ============================================================================
// Docling Operations (AC-4.8.4)
// ============================================================================

interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

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
 * Parse document with retry logic and fallback options.
 * Implements:
 * - AC-4.8.8: Retry logic (2 attempts with exponential backoff)
 * - AC-5.13.2: Retry with disable_cell_matching on page-dimensions error
 * - AC-5.13.3: Diagnostic logging for PDF failures
 */
async function parseDocumentWithRetry(
  docBuffer: Uint8Array,
  filename: string,
  serviceUrl: string
): Promise<DoclingResult> {
  let lastError: Error | null = null;
  const fileSizeBytes = docBuffer.byteLength;

  // First attempt: Normal parsing
  try {
    return await parseDocument(docBuffer, filename, serviceUrl, false);
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));

    // Story 5.13 (AC-5.13.3): Log diagnostic info for parse failures
    const diagnostics = extractDiagnosticInfo(lastError.message, fileSizeBytes, filename);
    log.warn('Docling parse failed (attempt 1)', {
      ...diagnostics,
      willRetry: true,
    });

    // Story 5.13 (AC-5.13.2): Check if this is a page-dimensions error
    // If so, retry with disable_cell_matching=true
    if (isPageDimensionsError(lastError.message)) {
      log.info('Detected page-dimensions error, retrying with disable_cell_matching', {
        filename,
        fileSizeMB: diagnostics.fileSizeMB,
      });

      try {
        await sleep(2000); // Brief delay before retry
        return await parseDocument(docBuffer, filename, serviceUrl, true);
      } catch (retryError) {
        const retryErr = retryError instanceof Error ? retryError : new Error(String(retryError));

        // Story 5.13 (AC-5.13.3): Log final failure with diagnostics
        log.error('Docling parse failed with fallback option', retryErr, {
          ...diagnostics,
          fallbackAttempted: true,
          finalError: retryErr.message,
        });

        // Return user-friendly error message (AC-5.13.1)
        throw new Error(getUserFriendlyError(retryErr.message));
      }
    }

    // Standard retry for non-page-dimensions errors (AC-4.8.8)
    await sleep(2000);

    try {
      return await parseDocument(docBuffer, filename, serviceUrl, false);
    } catch (retryError) {
      const retryErr = retryError instanceof Error ? retryError : new Error(String(retryError));

      // Story 5.13 (AC-5.13.3): Log final failure with diagnostics
      log.error('Docling parse failed after retry', retryErr, {
        ...diagnostics,
        retriesAttempted: 2,
        finalError: retryErr.message,
      });

      // Return user-friendly error message (AC-5.13.1)
      throw new Error(getUserFriendlyError(retryErr.message));
    }
  }
}

/**
 * Parse document using Docling service.
 * Implements AC-4.8.4: Edge Function calls Docling service instead of LlamaParse
 * Story 5.13 (AC-5.13.2): Added disableCellMatching parameter for fallback parsing
 */
async function parseDocument(
  docBuffer: Uint8Array,
  filename: string,
  serviceUrl: string,
  disableCellMatching: boolean = false
): Promise<DoclingResult> {
  // Determine MIME type from filename
  const ext = filename.toLowerCase().split('.').pop() || 'pdf';
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
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  // Create form data with file
  const formData = new FormData();
  const blob = new Blob([docBuffer], { type: mimeType });
  formData.append('file', blob, filename.split('/').pop() || 'document');

  // Send to Docling service with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOCLING_TIMEOUT_MS); // 300s timeout (AC-5.8.1.4)

  // Story 5.13 (AC-5.13.2): Build URL with optional disable_cell_matching param
  const parseUrl = new URL(`${serviceUrl}/parse`);
  if (disableCellMatching) {
    parseUrl.searchParams.set('disable_cell_matching', 'true');
  }

  try {
    const response = await fetch(parseUrl.toString(), {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Docling parse failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as DoclingApiResponse;

    // Transform response to match expected interface
    return {
      markdown: data.markdown,
      pageMarkers: data.page_markers.map((pm) => ({
        pageNumber: pm.page_number,
        startIndex: pm.start_index,
        endIndex: pm.end_index,
      })),
      pageCount: data.page_count,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Docling parse timed out after 300 seconds. Document may be too large or complex.');
    }

    throw error;
  }
}

/**
 * Extract page information from markdown content.
 * The regex pattern matches: --- PAGE X ---
 * This is compatible with the existing chunking service.
 */
function extractPageInfo(markdown: string): { pageMarkers: PageMarker[]; pageCount: number } {
  const pageMarkers: PageMarker[] = [];
  const pagePattern = /---\s*PAGE\s+(\d+)\s*---/gi;

  let maxPage = 1;
  let match;

  while ((match = pagePattern.exec(markdown)) !== null) {
    const pageNumber = parseInt(match[1], 10);
    pageMarkers.push({
      pageNumber,
      startIndex: match.index,
      endIndex: pagePattern.lastIndex,
    });
    maxPage = Math.max(maxPage, pageNumber);
  }

  if (pageMarkers.length === 0) {
    pageMarkers.push({ pageNumber: 1, startIndex: 0, endIndex: 0 });
  }

  return { pageMarkers, pageCount: maxPage };
}

// ============================================================================
// Chunking Operations (Story 5.9: Table-Aware Chunking)
// ============================================================================

// Separator hierarchy for recursive splitting (most semantic to least)
const SEPARATORS = ['\n\n', '\n', '. ', ' '];

// Table detection regex - matches complete markdown tables
const TABLE_PATTERN = /(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+)/g;

/**
 * Extract tables from content and replace with placeholders.
 * Story 5.9 (AC-5.9.3): Tables preserved as single chunks
 */
function extractTablesWithPlaceholders(content: string): {
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
 * Story 5.9 (AC-5.9.6): Summary used for embedding, raw table for answer generation.
 */
function generateTableSummary(tableMarkdown: string): string {
  const lines = tableMarkdown.trim().split('\n');

  if (lines.length < 2) {
    return 'Table with unknown structure.';
  }

  const headerRow = lines[0];
  const columns = headerRow
    .split('|')
    .filter((col) => col.trim())
    .map((col) => col.trim());

  const dataRows = lines.slice(2).filter((row) => row.includes('|'));
  const rowCount = dataRows.length;

  if (columns.length === 0) {
    return `Table with ${rowCount} rows of data.`;
  }

  const columnList = columns.slice(0, 5).join(', ');
  const columnSuffix = columns.length > 5 ? `, and ${columns.length - 5} more columns` : '';

  return `Table with ${columns.length} columns (${columnList}${columnSuffix}) containing ${rowCount} rows of data.`;
}

/**
 * RecursiveCharacterTextSplitter implementation.
 * Story 5.9 (AC-5.9.1, AC-5.9.2): Separator hierarchy ["\n\n", "\n", ". ", " "]
 */
function recursiveCharacterTextSplitter(
  text: string,
  targetChars: number,
  separators: string[] = SEPARATORS
): string[] {
  if (text.length <= targetChars) {
    return text.trim() ? [text.trim()] : [];
  }

  if (separators.length === 0) {
    return forceWordSplit(text, targetChars);
  }

  const separator = separators[0];
  const remainingSeparators = separators.slice(1);
  const splits = text.split(separator);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const split of splits) {
    const potentialChunk = currentChunk ? currentChunk + separator + split : split;

    if (potentialChunk.length <= targetChars) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      if (split.length > targetChars) {
        const subChunks = recursiveCharacterTextSplitter(split, targetChars, remainingSeparators);
        chunks.push(...subChunks);
        currentChunk = '';
      } else {
        currentChunk = split;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

function forceWordSplit(text: string, targetChars: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 <= targetChars) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) chunks.push(current);
      if (word.length > targetChars) {
        for (let i = 0; i < word.length; i += targetChars) {
          chunks.push(word.slice(i, i + targetChars));
        }
        current = '';
      } else {
        current = word;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function chunkMarkdown(markdown: string, pageMarkers: PageMarker[]): DocumentChunk[] {
  if (!markdown.trim()) return [];

  const targetChars = TARGET_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  // Split by pages
  const pages = splitByPages(markdown, pageMarkers);
  const allChunks: DocumentChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkPageWithTableAwareness(
      page.content,
      targetChars,
      page.pageNumber,
      globalIndex
    );

    for (const chunk of pageChunks) {
      allChunks.push(chunk);
      globalIndex++;
    }
  }

  return addOverlap(allChunks, overlapChars);
}

interface PageContent {
  pageNumber: number;
  content: string;
}

function splitByPages(markdown: string, pageMarkers: PageMarker[]): PageContent[] {
  if (pageMarkers.length === 0) {
    return [{ pageNumber: 1, content: markdown }];
  }

  const pages: PageContent[] = [];
  const pattern = /---\s*PAGE\s+(\d+)\s*---/gi;
  const parts = markdown.split(pattern);

  let currentPage = 1;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (/^\d+$/.test(part.trim())) {
      currentPage = parseInt(part.trim(), 10);
      continue;
    }
    if (part.trim()) {
      pages.push({ pageNumber: currentPage, content: part.trim() });
    }
  }

  return pages.length > 0 ? pages : [{ pageNumber: 1, content: markdown }];
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
    const placeholderMatches = chunk.match(/\{\{TABLE_\d+\}\}/g);

    if (placeholderMatches && placeholderMatches.length > 0) {
      let remaining = chunk;

      for (const placeholder of placeholderMatches) {
        const parts = remaining.split(placeholder);
        const before = parts[0]?.trim();
        remaining = parts.slice(1).join(placeholder);

        if (before && before.length > 0) {
          finalChunks.push(createTextChunk(before, pageNumber, chunkIndex++));
        }

        const tableContent = tables.get(placeholder);
        if (tableContent) {
          finalChunks.push(createTableChunk(tableContent, pageNumber, chunkIndex++));
        }
      }

      const after = remaining.trim();
      if (after && after.length > 0) {
        finalChunks.push(createTextChunk(after, pageNumber, chunkIndex++));
      }
    } else {
      finalChunks.push(createTextChunk(chunk, pageNumber, chunkIndex++));
    }
  }

  return finalChunks;
}

function createTextChunk(content: string, pageNumber: number, chunkIndex: number): DocumentChunk {
  return {
    content,
    pageNumber,
    chunkIndex,
    tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
    chunkType: 'text',
    summary: null,
  };
}

function createTableChunk(tableContent: string, pageNumber: number, chunkIndex: number): DocumentChunk {
  return {
    content: tableContent,
    pageNumber,
    chunkIndex,
    tokenCount: Math.ceil(tableContent.length / CHARS_PER_TOKEN),
    chunkType: 'table',
    summary: generateTableSummary(tableContent),
  };
}

function addOverlap(chunks: DocumentChunk[], overlapChars: number): DocumentChunk[] {
  if (chunks.length <= 1) return chunks;

  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;

    // Skip overlap for table chunks
    if (chunk.chunkType === 'table') return chunk;

    const prevChunk = chunks[i - 1];
    if (prevChunk.chunkType === 'table') return chunk;

    const overlap = getOverlapText(prevChunk.content, overlapChars);
    if (!overlap || chunk.content.startsWith(overlap)) return chunk;

    const newContent = overlap + '\n\n' + chunk.content;
    return {
      ...chunk,
      content: newContent,
      tokenCount: Math.ceil(newContent.length / CHARS_PER_TOKEN),
    };
  });
}

function getOverlapText(content: string, overlapChars: number): string {
  if (content.length <= overlapChars) return content;

  let overlap = content.slice(-overlapChars);
  const firstSpace = overlap.indexOf(' ');
  if (firstSpace > 0 && firstSpace < overlap.length / 2) {
    overlap = overlap.slice(firstSpace + 1);
  }
  return overlap.trim();
}

// ============================================================================
// Embeddings Operations
// ============================================================================

// Story 5.12: Progress callback type for embedding progress reporting
type EmbeddingProgressCallback = (batchIndex: number, totalBatches: number) => Promise<void>;

async function generateEmbeddingsWithRetry(
  texts: string[],
  apiKey: string,
  onProgress?: EmbeddingProgressCallback
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];
  const totalBatches = Math.ceil(texts.length / EMBEDDING_BATCH_SIZE);

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batchIndex = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchEmbeddings = await generateBatchWithRetry(batch, apiKey);
    embeddings.push(...batchEmbeddings);

    // Story 5.12: Report progress after each batch
    if (onProgress) {
      await onProgress(batchIndex, totalBatches);
    }
  }

  return embeddings;
}

async function generateBatchWithRetry(texts: string[], apiKey: string): Promise<number[][]> {
  let lastError: Error | null = null;
  let delay = 1000;

  // Retry 3 times (AC-4.6.10)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: texts,
          dimensions: EMBEDDING_DIMENSIONS,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as {
        data: Array<{ index: number; embedding: number[] }>;
      };

      // Sort by index and extract embeddings
      return data.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn('Embedding batch failed', { attempt, error: lastError.message });

      if (attempt < 3) {
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  throw lastError || new Error('Embeddings generation failed');
}

// ============================================================================
// Queue Management Operations
// ============================================================================

interface ProcessingJobRecord {
  id: string;
  document_id: string;
  status: string;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Mark stale jobs as failed (AC-4.7.5)
 * Jobs in 'processing' state for >10 minutes are marked as failed
 */
async function markStaleJobsFailed(
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  const { data, error } = await supabase.rpc('mark_stale_jobs_failed');

  if (error) {
    log.warn('Failed to mark stale jobs', { error: error.message });
    return 0;
  }

  return data as number ?? 0;
}

/**
 * Check if agency has an active processing job (AC-4.7.2)
 */
async function hasActiveProcessingJob(
  supabase: ReturnType<typeof createClient>,
  agencyId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_active_processing_job', {
    p_agency_id: agencyId,
  });

  if (error) {
    log.warn('Failed to check active job', { error: error.message, agencyId });
    return true; // Fail safe - assume there's an active job
  }

  return data as boolean ?? false;
}

/**
 * Get next pending job in FIFO order with SKIP LOCKED (AC-4.7.1)
 */
async function getNextPendingJob(
  supabase: ReturnType<typeof createClient>,
  agencyId: string
): Promise<ProcessingJobRecord | null> {
  const { data, error } = await supabase.rpc('get_next_pending_job', {
    p_agency_id: agencyId,
  });

  if (error) {
    log.warn('Failed to get next pending job', { error: error.message, agencyId });
    return null;
  }

  const jobs = data as ProcessingJobRecord[] | null;
  return jobs?.[0] ?? null;
}

/**
 * Get document storage path
 */
async function getDocumentStoragePath(
  supabase: ReturnType<typeof createClient>,
  documentId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.storage_path;
}

/**
 * Trigger the next job in the queue by calling this Edge Function recursively
 */
async function triggerNextJob(
  supabaseUrl: string,
  serviceKey: string,
  documentId: string,
  agencyId: string
): Promise<void> {
  // Get storage path for next document
  const supabase = createClient(supabaseUrl, serviceKey);
  const storagePath = await getDocumentStoragePath(supabase, documentId);

  if (!storagePath) {
    log.warn('Cannot trigger next job - storage path not found', { documentId });
    return;
  }

  // Call this function recursively
  const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      documentId,
      storagePath,
      agencyId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger next job: ${response.status} - ${errorText}`);
  }
}

// ============================================================================
// Database Operations
// ============================================================================

async function updateJobStatus(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'processing') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('processing_jobs')
    .update(updateData)
    .eq('document_id', documentId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }
}

async function updateDocumentStatus(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  status: 'processing' | 'ready' | 'failed',
  pageCount?: number
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (pageCount !== undefined) {
    updateData.page_count = pageCount;
  }

  const { error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

async function insertChunks(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  agencyId: string,
  chunks: DocumentChunk[],
  embeddings: number[][]
): Promise<void> {
  // Prepare chunks for insertion
  // Story 5.9: Include chunk_type, summary, embedding_version
  const chunkRecords = chunks.map((chunk, i) => ({
    document_id: documentId,
    agency_id: agencyId,
    content: chunk.content,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    bounding_box: null, // NULL if not available (AC-4.6.5)
    embedding: JSON.stringify(embeddings[i]), // Store as JSON string for vector column
    chunk_type: chunk.chunkType, // Story 5.9 (AC-5.9.4)
    summary: chunk.summary, // Story 5.9 (AC-5.9.6) - only for table chunks
    embedding_version: 2, // Story 5.9 - version 2 for new table-aware chunking
  }));

  // Insert in batches of 100 to avoid payload size limits
  const batchSize = 100;
  for (let i = 0; i < chunkRecords.length; i += batchSize) {
    const batch = chunkRecords.slice(i, i + batchSize);

    const { error } = await supabase
      .from('document_chunks')
      .insert(batch);

    if (error) {
      throw new Error(`Failed to insert chunks: ${error.message}`);
    }
  }
}

// ============================================================================
// Story F2-3: AI Tagging
// ============================================================================

/**
 * AI tagging timeout in milliseconds.
 * AC-F2-3.4: Tagging completes within 5 seconds
 */
const AI_TAGGING_TIMEOUT_MS = 5000;

/**
 * System prompt for document tagging.
 */
const TAGGING_SYSTEM_PROMPT = `You are analyzing an insurance document. Based on the content provided, extract:

1. Tags (3-5): Short, relevant keywords describing the document content.
   - Focus on insurance terms (e.g., "liability", "commercial auto", "workers comp")
   - Include carrier name if identifiable
   - Include policy type (e.g., "BOP", "GL", "umbrella")

2. Summary (1-2 sentences): Brief description of what this document is about.
   - Be specific: mention carrier, policy type, coverage highlights
   - Keep under 200 characters

3. Document Type: Is this a "quote" document (insurance proposal/quote) or "general" document (certificate, endorsement, general info)?

Do NOT include:
- PII (names, addresses, policy numbers)
- Generic tags like "insurance" or "document"`;

/**
 * Perform AI tagging on document chunks.
 * Story F2-3: Generates tags, summary, and infers document type.
 *
 * AC-F2-3.1: Returns 3-5 tags
 * AC-F2-3.2: Returns summary under 200 chars
 * AC-F2-3.3: Infers document type
 * AC-F2-3.4: 5-second timeout
 * AC-F2-3.5: Graceful degradation - failures don't block processing
 */
async function performAITagging(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  chunks: DocumentChunk[],
  openaiApiKey: string
): Promise<void> {
  const startTime = Date.now();

  // Use first 5 chunks (~5 pages) as context for efficiency
  const context = chunks
    .slice(0, 5)
    .map((c) => c.content)
    .join('\n\n---\n\n');

  if (!context.trim()) {
    log.warn('AI tagging skipped: no content', { documentId });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TAGGING_TIMEOUT_MS);

  try {
    // Build request for OpenAI structured outputs
    const requestBody = {
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_tags',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 5,
                description: 'Short, relevant keywords describing the document content',
              },
              summary: {
                type: 'string',
                maxLength: 200,
                description: 'Brief 1-2 sentence description of the document',
              },
              documentType: {
                type: 'string',
                enum: ['quote', 'general'],
                description: 'Whether this is a quote document or general document',
              },
            },
            required: ['tags', 'summary', 'documentType'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.1, // Low for consistent extraction
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      log.warn('AI tagging API error', { documentId, status: response.status, error: errorText });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      log.warn('AI tagging: no content in response', { documentId });
      return;
    }

    // Parse the response
    const parsed = JSON.parse(content) as {
      tags: string[];
      summary: string;
      documentType: 'quote' | 'general';
    };

    // Validate basic structure
    if (!Array.isArray(parsed.tags) || !parsed.summary || !parsed.documentType) {
      log.warn('AI tagging: invalid response structure', { documentId, parsed });
      return;
    }

    // Get current document to check if document_type is already set
    const { data: docData } = await supabase
      .from('documents')
      .select('document_type')
      .eq('id', documentId)
      .single();

    // Build update object
    const updateData: Record<string, unknown> = {
      ai_tags: parsed.tags,
      ai_summary: parsed.summary,
      updated_at: new Date().toISOString(),
    };

    // Only update document_type if not already set (AC-F2-3.3: ability to override)
    if (!docData?.document_type) {
      updateData.document_type = parsed.documentType;
    }

    // Update document with tags and summary
    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      log.warn('AI tagging: failed to update document', { documentId, error: updateError.message });
      return;
    }

    const duration = Date.now() - startTime;
    log.info('AI tagging completed', {
      documentId,
      duration,
      tagCount: parsed.tags.length,
      summaryLength: parsed.summary.length,
      documentType: parsed.documentType,
      documentTypeUpdated: !docData?.document_type,
    });
  } catch (error) {
    clearTimeout(timeout);

    const err = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    if (err.name === 'AbortError') {
      log.warn('AI tagging timeout', { documentId, duration, timeoutMs: AI_TAGGING_TIMEOUT_MS });
    } else {
      log.warn('AI tagging failed', { documentId, duration, error: err.message });
    }

    // AC-F2-3.5: Graceful degradation - don't throw, just log and continue
  }
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Story 5.13: PDF Parsing Robustness Helpers
// ============================================================================

/**
 * Check if error is a page-dimensions/libpdfium error.
 * Story 5.13 (AC-5.13.1): Detect specific PDF format errors
 */
function isPageDimensionsError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return PAGE_DIMENSIONS_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Get user-friendly error message for PDF parsing errors.
 * Story 5.13 (AC-5.13.1): Return helpful messages instead of technical errors
 */
function getUserFriendlyError(errorMessage: string): string {
  if (isPageDimensionsError(errorMessage)) {
    return USER_FRIENDLY_ERRORS['page-dimensions'];
  }
  if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
    return USER_FRIENDLY_ERRORS['timeout'];
  }
  if (errorMessage.includes('unsupported') || errorMessage.includes('not supported')) {
    return USER_FRIENDLY_ERRORS['unsupported-format'];
  }
  // Return original message if no specific handler
  return errorMessage;
}

/**
 * Extract diagnostic info from error for logging.
 * Story 5.13 (AC-5.13.3): Log PDF metadata for analysis
 */
function extractDiagnosticInfo(
  errorMessage: string,
  fileSizeBytes: number,
  filename: string
): Record<string, unknown> {
  return {
    errorType: isPageDimensionsError(errorMessage) ? 'page-dimensions' : 'other',
    originalError: errorMessage,
    fileSizeBytes,
    fileSizeMB: (fileSizeBytes / (1024 * 1024)).toFixed(2),
    filename,
    fileExtension: filename.split('.').pop()?.toLowerCase() || 'unknown',
  };
}

// ============================================================================
// Story 5.12: Progress Reporting
// ============================================================================

/**
 * Update job progress data for real-time UI updates.
 * Story 5.12 (AC-5.12.1 through AC-5.12.4): Progress reporting
 *
 * @param supabase - Supabase client
 * @param documentId - Document being processed
 * @param stage - Current processing stage
 * @param stageProgress - Progress within current stage (0-100)
 * @param estimatedSecondsRemaining - Estimated time remaining (null if unknown)
 * @param force - Force update even if throttled (for stage transitions)
 */
async function updateJobProgress(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  stage: ProgressData['stage'],
  stageProgress: number,
  estimatedSecondsRemaining: number | null = null,
  force: boolean = false
): Promise<void> {
  // Throttle updates to avoid flooding Realtime (max once per second)
  const now = Date.now();
  if (!force && now - lastProgressUpdate < PROGRESS_THROTTLE_MS) {
    return;
  }
  lastProgressUpdate = now;

  // Calculate total progress based on stage weights
  const stageConfig = STAGE_WEIGHTS[stage];
  const totalProgress = Math.round(
    stageConfig.start + (stageProgress / 100) * stageConfig.weight
  );

  const progressData: ProgressData = {
    stage,
    stage_progress: Math.round(stageProgress),
    stage_name: STAGE_DISPLAY_NAMES[stage],
    estimated_seconds_remaining: estimatedSecondsRemaining,
    total_progress: totalProgress,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('processing_jobs')
    .update({ progress_data: progressData })
    .eq('document_id', documentId);

  if (error) {
    // Don't throw - progress updates are best-effort
    log.warn('Failed to update progress', { error: error.message, documentId, stage });
  }
}

/**
 * Estimate time remaining based on file size and stage.
 * Returns seconds.
 */
function estimateTimeRemaining(
  fileSizeBytes: number,
  stage: ProgressData['stage'],
  stageProgress: number = 0
): number | null {
  const MB = 1024 * 1024;
  const sizeMB = fileSizeBytes / MB;

  // Base estimates per stage (in seconds) for ~10MB file
  const baseEstimates: Record<ProgressData['stage'], number> = {
    downloading: 10,
    parsing: 120, // 2 min base for parsing
    chunking: 15,
    embedding: 60, // 1 min base for embeddings
  };

  // Scale by file size (larger files take proportionally longer)
  const sizeMultiplier = Math.max(1, sizeMB / 10);
  const baseTime = baseEstimates[stage] * sizeMultiplier;

  // Adjust for progress within stage
  const remainingTime = baseTime * ((100 - stageProgress) / 100);

  // Add estimates for remaining stages
  const stageOrder: ProgressData['stage'][] = ['downloading', 'parsing', 'chunking', 'embedding'];
  const currentIndex = stageOrder.indexOf(stage);
  let additionalTime = 0;

  for (let i = currentIndex + 1; i < stageOrder.length; i++) {
    additionalTime += baseEstimates[stageOrder[i]] * sizeMultiplier;
  }

  return Math.round(remainingTime + additionalTime);
}
