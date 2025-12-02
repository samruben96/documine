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

    // Step 4: Download PDF from Storage
    const pdfBuffer = await downloadFromStorage(supabase, processingStoragePath);
    log.info('PDF downloaded', { documentId: processingDocumentId, size: pdfBuffer.byteLength });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 5: Send to Docling service
    const parseStartTime = Date.now();
    const parseResult = await parseDocumentWithRetry(pdfBuffer, processingStoragePath, doclingServiceUrl);
    log.info('Docling parsing completed', {
      documentId: processingDocumentId,
      duration: Date.now() - parseStartTime,
      pageCount: parseResult.pageCount,
    });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 6: Chunk the content
    const chunks = chunkMarkdown(parseResult.markdown, parseResult.pageMarkers);
    log.info('Chunking completed', { documentId: processingDocumentId, chunkCount: chunks.length });
    checkProcessingTimeout(startTime); // AC-5.8.1.5

    // Step 7: Generate embeddings
    const embeddingsStartTime = Date.now();
    const embeddings = await generateEmbeddingsWithRetry(
      chunks.map((c) => c.content),
      openaiKey
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
 * Parse document with retry logic.
 * Implements AC-4.8.8: Retry logic (2 attempts with exponential backoff)
 */
async function parseDocumentWithRetry(
  docBuffer: Uint8Array,
  filename: string,
  serviceUrl: string
): Promise<DoclingResult> {
  let lastError: Error | null = null;

  // Retry once on failure (AC-4.8.8)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await parseDocument(docBuffer, filename, serviceUrl);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn('Docling parse failed, retrying', { attempt, error: lastError.message });

      if (attempt < 2) {
        await sleep(2000 * attempt); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Docling parsing failed');
}

/**
 * Parse document using Docling service.
 * Implements AC-4.8.4: Edge Function calls Docling service instead of LlamaParse
 */
async function parseDocument(
  docBuffer: Uint8Array,
  filename: string,
  serviceUrl: string
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
  const timeoutId = setTimeout(() => controller.abort(), DOCLING_TIMEOUT_MS); // 180s timeout (AC-5.8.1.4)

  try {
    const response = await fetch(`${serviceUrl}/parse`, {
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

async function generateEmbeddingsWithRetry(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchEmbeddings = await generateBatchWithRetry(batch, apiKey);
    embeddings.push(...batchEmbeddings);
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
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
