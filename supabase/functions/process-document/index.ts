/**
 * Document Processing Edge Function
 *
 * Orchestrates the document processing pipeline:
 * 1. Download PDF from Supabase Storage
 * 2. Extract text via LlamaParse API
 * 3. Chunk text into semantic segments
 * 4. Generate embeddings via OpenAI
 * 5. Store chunks in document_chunks table
 * 6. Update document status
 *
 * Implements AC-4.6.1 through AC-4.6.11
 *
 * @module supabase/functions/process-document
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configuration
const LLAMAPARSE_API_BASE = 'https://api.cloud.llamaindex.ai/api/parsing';
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 20;
const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;

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

// Main handler
Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const llamaparseKey = Deno.env.get('LLAMA_CLOUD_API_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !openaiKey || !llamaparseKey) {
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

  log.info('Processing started', { documentId, agencyId, storagePath });

  try {
    // Step 1: Update job status to 'processing'
    await updateJobStatus(supabase, documentId, 'processing');

    // Step 2: Download PDF from Storage
    const pdfBuffer = await downloadFromStorage(supabase, storagePath);
    log.info('PDF downloaded', { documentId, size: pdfBuffer.byteLength });

    // Step 3: Send to LlamaParse
    const parseStartTime = Date.now();
    const parseResult = await parsePdfWithRetry(pdfBuffer, storagePath, llamaparseKey);
    log.info('LlamaParse completed', {
      documentId,
      duration: Date.now() - parseStartTime,
      pageCount: parseResult.pageCount,
    });

    // Step 4: Chunk the content
    const chunks = chunkMarkdown(parseResult.markdown, parseResult.pageMarkers);
    log.info('Chunking completed', { documentId, chunkCount: chunks.length });

    // Step 5: Generate embeddings
    const embeddingsStartTime = Date.now();
    const embeddings = await generateEmbeddingsWithRetry(
      chunks.map((c) => c.content),
      openaiKey
    );
    log.info('Embeddings completed', {
      documentId,
      duration: Date.now() - embeddingsStartTime,
    });

    // Step 6: Insert chunks into database
    await insertChunks(supabase, documentId, agencyId, chunks, embeddings);
    log.info('Chunks inserted', { documentId, count: chunks.length });

    // Step 7: Update document status to 'ready' with page count
    await updateDocumentStatus(supabase, documentId, 'ready', parseResult.pageCount);

    // Step 8: Complete processing job
    await updateJobStatus(supabase, documentId, 'completed');

    const totalDuration = Date.now() - startTime;
    log.info('Processing completed', {
      documentId,
      duration: totalDuration,
      chunkCount: chunks.length,
      pageCount: parseResult.pageCount,
    });

    return new Response(
      JSON.stringify({ success: true, chunkCount: chunks.length, pageCount: parseResult.pageCount }),
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
// LlamaParse Operations
// ============================================================================

interface LlamaParseResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

async function parsePdfWithRetry(
  pdfBuffer: Uint8Array,
  filename: string,
  apiKey: string
): Promise<LlamaParseResult> {
  let lastError: Error | null = null;

  // Retry once on failure (AC-4.6.10)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await parsePdf(pdfBuffer, filename, apiKey);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn('LlamaParse failed, retrying', { attempt, error: lastError.message });

      if (attempt < 2) {
        await sleep(2000 * attempt); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('LlamaParse failed');
}

async function parsePdf(
  pdfBuffer: Uint8Array,
  filename: string,
  apiKey: string
): Promise<LlamaParseResult> {
  // Step 1: Upload PDF to start job
  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, filename.split('/').pop() || 'document.pdf');
  formData.append('result_type', 'markdown');
  formData.append('page_separator', '--- PAGE {page_number} ---');

  const uploadResponse = await fetch(`${LLAMAPARSE_API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`LlamaParse upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const { id: jobId } = await uploadResponse.json() as { id: string };

  // Step 2: Poll for completion
  await waitForJobCompletion(jobId, apiKey);

  // Step 3: Get markdown result
  const markdownResponse = await fetch(`${LLAMAPARSE_API_BASE}/job/${jobId}/result/markdown`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!markdownResponse.ok) {
    throw new Error(`Failed to get markdown: ${markdownResponse.status}`);
  }

  const { markdown } = await markdownResponse.json() as { markdown: string };

  // Extract page info
  const { pageMarkers, pageCount } = extractPageInfo(markdown);

  return { markdown, pageMarkers, pageCount };
}

async function waitForJobCompletion(jobId: string, apiKey: string): Promise<void> {
  const maxWaitMs = 120000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${LLAMAPARSE_API_BASE}/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Job status check failed: ${response.status}`);
    }

    const status = await response.json() as { status: string; error_message?: string };

    if (status.status === 'SUCCESS') {
      return;
    }

    if (status.status === 'ERROR') {
      throw new Error(`LlamaParse job failed: ${status.error_message || 'Unknown'}`);
    }

    await sleep(2000);
  }

  throw new Error('LlamaParse job timed out');
}

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
// Chunking Operations
// ============================================================================

function chunkMarkdown(markdown: string, pageMarkers: PageMarker[]): DocumentChunk[] {
  if (!markdown.trim()) return [];

  const targetChars = TARGET_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  // Split by pages
  const pages = splitByPages(markdown, pageMarkers);
  const allChunks: DocumentChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = splitIntoChunks(page.content, targetChars);
    for (const content of pageChunks) {
      allChunks.push({
        content: content.trim(),
        pageNumber: page.pageNumber,
        chunkIndex: globalIndex++,
        tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
      });
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

function splitIntoChunks(content: string, targetChars: number): string[] {
  if (content.length <= targetChars) return [content];

  const chunks: string[] = [];
  const paragraphs = content.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length <= targetChars) {
      current += (current ? '\n\n' : '') + para;
    } else {
      if (current) chunks.push(current);
      current = para.length > targetChars ? splitLongText(para, targetChars)[0] : para;
      if (para.length > targetChars) {
        chunks.push(...splitLongText(para, targetChars).slice(0, -1));
        current = splitLongText(para, targetChars).pop() || '';
      }
    }
  }

  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim());
}

function splitLongText(text: string, targetChars: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 <= targetChars) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function addOverlap(chunks: DocumentChunk[], overlapChars: number): DocumentChunk[] {
  if (chunks.length <= 1) return chunks;

  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;

    const prevContent = chunks[i - 1].content;
    const overlap = prevContent.slice(-overlapChars).trim();
    const separator = overlap ? '\n\n' : '';
    const newContent = overlap + separator + chunk.content;

    return {
      ...chunk,
      content: newContent,
      tokenCount: Math.ceil(newContent.length / CHARS_PER_TOKEN),
    };
  });
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
  const chunkRecords = chunks.map((chunk, i) => ({
    document_id: documentId,
    agency_id: agencyId,
    content: chunk.content,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    bounding_box: null, // NULL if not available (AC-4.6.5)
    embedding: JSON.stringify(embeddings[i]), // Store as JSON string for vector column
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
