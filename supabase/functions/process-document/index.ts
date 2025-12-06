/**
 * Document Processing Edge Function
 *
 * Orchestrates the document processing pipeline:
 * 1. Check for stale jobs and mark failed
 * 2. Verify agency can process (no active job)
 * 3. Select next pending job in FIFO order
 * 4. Download document from Supabase Storage
 * 5. Extract text via LlamaParse (Story 13.2)
 * 6. Chunk text into semantic segments
 * 7. Generate embeddings via OpenAI
 * 8. Store chunks in document_chunks table
 * 9. Update document status
 * 10. Trigger next pending job for agency
 *
 * Story 13.2: Migrated from Document AI to LlamaParse for PDF parsing
 * - Simple REST API with upload → poll → result flow
 * - 10,000 free pages/month
 * - No GCS dependency (unlike Document AI batch processing)
 *
 * @module supabase/functions/process-document
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
// Story 13.2: LlamaParse replaces Document AI
import {
  parseDocumentWithLlamaParse,
  convertToDoclingResult,
  LlamaParseError,
  UploadError,
  PollingError,
  TimeoutError,
  ResultError,
} from './llamaparse-client.ts';

// Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 20;
const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;

// Story 13.2: LlamaParse timeout is handled in llamaparse-client.ts (5 min max wait)
// Total processing timeout for the entire pipeline
const TOTAL_PROCESSING_TIMEOUT_MS = 480000; // 480s (8 min) - ensures error handling runs before platform timeout

// Story 11.3 (AC-11.3.4): Error classification
// Story 11.5 (AC-11.5.1): Extended error classification with categories
// PERMANENT errors should NOT be auto-retried (user action required)
// TRANSIENT errors can be auto-retried by stuck job detector
// RECOVERABLE errors need user action (re-upload corrected file)
type ErrorType = 'permanent' | 'transient';
type ErrorCategory = 'transient' | 'recoverable' | 'permanent';

/**
 * Extended error classification result
 * Story 11.5 (AC-11.5.1): Structured error with category, code, and user message
 */
interface ClassifiedError {
  /** Legacy error type for backward compat (permanent/transient) */
  errorType: ErrorType;
  /** Error category for user messaging (transient/recoverable/permanent) */
  category: ErrorCategory;
  /** Machine-readable error code */
  code: string;
  /** Whether this error should trigger automatic retry */
  shouldAutoRetry: boolean;
}

/**
 * Error classification patterns organized by code
 * Story 11.5 (AC-11.5.1): Pattern-based error classification
 */
const ERROR_CLASSIFICATION_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  category: ErrorCategory;
  shouldAutoRetry: boolean;
}> = [
  // TRANSIENT errors - automatic retry
  { pattern: /timeout|timed?\s*out/i, code: 'TIMEOUT', category: 'transient', shouldAutoRetry: true },
  { pattern: /429|rate.?limit|too many requests/i, code: 'RATE_LIMIT', category: 'transient', shouldAutoRetry: true },
  { pattern: /ECONNRESET|ECONNREFUSED|network|connection/i, code: 'CONNECTION_ERROR', category: 'transient', shouldAutoRetry: true },
  { pattern: /503|service unavailable|temporarily unavailable/i, code: 'SERVICE_UNAVAILABLE', category: 'transient', shouldAutoRetry: true },

  // RECOVERABLE errors - user action needed
  { pattern: /page-dimensions|MediaBox|libpdfium|CropBox/i, code: 'PDF_FORMAT_ERROR', category: 'recoverable', shouldAutoRetry: false },
  { pattern: /password/i, code: 'PASSWORD_PROTECTED', category: 'recoverable', shouldAutoRetry: false },
  { pattern: /unsupported.*format|invalid.*file|not supported/i, code: 'UNSUPPORTED_FORMAT', category: 'recoverable', shouldAutoRetry: false },
  { pattern: /corrupt|corrupted|damaged|malformed/i, code: 'FILE_CORRUPTED', category: 'recoverable', shouldAutoRetry: false },
  { pattern: /too.?large|size.?exceeded|maximum.*size/i, code: 'FILE_TOO_LARGE', category: 'recoverable', shouldAutoRetry: false },
  { pattern: /empty|no content|no text/i, code: 'EMPTY_DOCUMENT', category: 'recoverable', shouldAutoRetry: false },

  // PERMANENT errors - needs support
  { pattern: /max.*retr|retries?\s*exceeded/i, code: 'MAX_RETRIES_EXCEEDED', category: 'permanent', shouldAutoRetry: false },
];

/**
 * Classify an error message into structured classification
 * Story 11.3 (AC-11.3.4): Error classification for smart retry behavior
 * Story 11.5 (AC-11.5.1): Extended classification with category and code
 */
function classifyError(errorMessage: string): ClassifiedError {
  // Find matching pattern
  for (const { pattern, code, category, shouldAutoRetry } of ERROR_CLASSIFICATION_PATTERNS) {
    if (pattern.test(errorMessage)) {
      // Map category to legacy error type for backward compat
      const errorType: ErrorType = category === 'transient' ? 'transient' : 'permanent';
      return { errorType, category, code, shouldAutoRetry };
    }
  }

  // Default to unknown/permanent error
  return {
    errorType: 'permanent',
    category: 'permanent',
    code: 'UNKNOWN',
    shouldAutoRetry: false,
  };
}

/**
 * Classify LlamaParse errors to existing error categories.
 * Story 13.2 (AC-13.2.3): Map LlamaParse error types to ClassifiedError
 */
function classifyLlamaParseError(error: Error): ClassifiedError {
  // First, check if it's a known LlamaParse error type
  if (error.name === 'UploadError') {
    return {
      errorType: 'transient',
      category: 'transient',
      code: 'UPLOAD_ERROR',
      shouldAutoRetry: true,
    };
  }

  if (error.name === 'TimeoutError') {
    return {
      errorType: 'transient',
      category: 'transient',
      code: 'TIMEOUT',
      shouldAutoRetry: true,
    };
  }

  if (error.name === 'PollingError') {
    // Check if it's a non-retryable polling error (job failed)
    const isRetryable = error instanceof LlamaParseError ? error.isRetryable : true;
    if (!isRetryable) {
      return {
        errorType: 'permanent',
        category: 'recoverable',
        code: 'PDF_FORMAT_ERROR',
        shouldAutoRetry: false,
      };
    }
    return {
      errorType: 'transient',
      category: 'transient',
      code: 'CONNECTION_ERROR',
      shouldAutoRetry: true,
    };
  }

  if (error.name === 'ResultError') {
    return {
      errorType: 'transient',
      category: 'transient',
      code: 'CONNECTION_ERROR',
      shouldAutoRetry: true,
    };
  }

  // Fall back to generic classifyError for unknown errors
  return classifyError(error.message);
}

// Story 5.12: Progress reporting configuration
// Story 11.6: Removed 'analyzing' stage - extraction now happens in Phase 2 (background)
// Story 13.2: Simplified stages - LlamaParse handles all parsing internally
// Stage weights for total_progress calculation:
// downloading: 5%, parsing: 55%, chunking: 10%, embedding: 30%
const STAGE_WEIGHTS = {
  downloading: { start: 0, weight: 5 },
  parsing: { start: 5, weight: 55 },
  chunking: { start: 60, weight: 10 },
  embedding: { start: 70, weight: 30 },
} as const;

// Progress update throttle (max once per second to avoid flooding Realtime)
const PROGRESS_THROTTLE_MS = 1000;
let lastProgressUpdate = 0;

// Types
// Story 11.1: Added job_id for async processing via pg_cron
interface ProcessingPayload {
  job_id?: string;       // Story 11.1: Job ID from pg_cron trigger (optional for backward compat)
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
// Story 11.6: Removed 'analyzing' stage - extraction now happens in Phase 2
// Story 13.2: Simplified stages - LlamaParse handles all parsing internally
interface ProgressData {
  stage: 'downloading' | 'parsing' | 'chunking' | 'embedding';
  stage_progress: number; // 0-100
  stage_name: string; // User-friendly name
  estimated_seconds_remaining: number | null;
  total_progress: number; // 0-100 across all stages
  updated_at: string;
}

// User-friendly stage names per UX design
// Story 11.6: Removed 'analyzing' stage
// Story 13.2: Simplified stages - LlamaParse handles all parsing internally
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

  // Story 13.2 (AC-13.2.5): LLAMA_CLOUD_API_KEY required for LlamaParse
  const llamaCloudApiKey = Deno.env.get('LLAMA_CLOUD_API_KEY');

  // AC-13.2.5: Log configuration on startup (without exposing key)
  log.info('Edge Function configuration', {
    hasLlamaCloudApiKey: !!llamaCloudApiKey,
    hasOpenaiKey: !!openaiKey,
  });

  // AC-13.2.5: Fail fast if API key not configured
  if (!supabaseUrl || !supabaseServiceKey || !openaiKey || !llamaCloudApiKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!openaiKey) missing.push('OPENAI_API_KEY');
    if (!llamaCloudApiKey) missing.push('LLAMA_CLOUD_API_KEY');

    log.error('Missing environment variables', { missing });

    return new Response(
      JSON.stringify({
        success: false,
        error: `Missing required environment variables: ${missing.join(', ')}`,
      }),
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

  const { job_id, documentId, storagePath, agencyId } = payload;

  log.info('Processing request received', { job_id, documentId, agencyId, storagePath });

  // Story 11.1: If job_id is provided, this is from pg_cron - process directly
  // Skip the active job check and FIFO selection since pg_cron already did that
  const isFromPgCron = !!job_id;

  try {
    // Step 0: Mark stale jobs as failed (AC-4.7.5)
    const staleCount = await markStaleJobsFailed(supabase);
    if (staleCount > 0) {
      log.info('Marked stale jobs as failed', { count: staleCount });
    }

    let processingDocumentId: string;
    let processingStoragePath: string | null;

    if (isFromPgCron) {
      // Story 11.1: Job already selected by pg_cron - process directly
      log.info('Processing from pg_cron trigger', { job_id, documentId });
      processingDocumentId = documentId;
      processingStoragePath = storagePath;
    } else {
      // Legacy flow: Check for active jobs and select next pending

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
      processingDocumentId = nextJob.document_id;
      processingStoragePath = await getDocumentStoragePath(supabase, processingDocumentId);
    }

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

    if (!isFromPgCron && processingDocumentId !== documentId) {
      log.info('Processing older queued document (FIFO)', {
        requestedDocumentId: documentId,
        processingDocumentId
      });
    }

    log.info('Processing started', { documentId: processingDocumentId, agencyId, isFromPgCron });

    // Step 3: Update job status to 'processing' (only for legacy flow - pg_cron already did this)
    if (!isFromPgCron) {
      await updateJobStatus(supabase, processingDocumentId, 'processing');
    }

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

    // Step 5: Parse document with LlamaParse (Story 13.2)
    // AC-13.2.1: Import and call parseDocumentWithLlamaParse
    // AC-13.2.2: Report 'parsing' progress during polling
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'parsing',
      0,
      estimateTimeRemaining(pdfBuffer.byteLength, 'parsing', 0),
      true
    );

    const parseStartTime = Date.now();

    // AC-13.2.1: Call LlamaParse with progress callback
    // Convert Uint8Array to ArrayBuffer for LlamaParse client
    const llamaParseResult = await parseDocumentWithLlamaParse(
      pdfBuffer.buffer as ArrayBuffer,
      processingStoragePath,
      { apiKey: llamaCloudApiKey },
      // AC-13.2.2: Progress callback for real-time updates
      async (_stage, percent) => {
        await updateJobProgress(
          supabase,
          processingDocumentId,
          'parsing',
          percent,
          estimateTimeRemaining(pdfBuffer.byteLength, 'parsing', percent),
          percent === 0 || percent === 100 // Force update at stage transitions
        );
      }
    );

    // AC-13.2.4: Convert to DoclingResult format for existing pipeline
    const parseResult = convertToDoclingResult(llamaParseResult);

    // AC-13.2.2: Report parsing complete at 100%
    await updateJobProgress(
      supabase,
      processingDocumentId,
      'parsing',
      100,
      estimateTimeRemaining(pdfBuffer.byteLength, 'parsing', 100),
      true
    );

    log.info('LlamaParse parsing completed', {
      documentId: processingDocumentId,
      duration: Date.now() - parseStartTime,
      pageCount: parseResult.pageCount,
      jobId: llamaParseResult.jobId,
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

    // Step 9: Store raw_text for Phase 2 extraction (Story 11.6)
    // Save concatenated text so extract-quote-data doesn't need to re-parse
    const rawText = chunks.map((c) => c.content).join('\n\n');
    await supabase
      .from('documents')
      .update({ raw_text: rawText })
      .eq('id', processingDocumentId);

    // Step 10: Update document status to 'ready' with page count (AC-11.6.1)
    // Document is now ready for chat - extraction happens in background
    await updateDocumentStatus(supabase, processingDocumentId, 'ready', parseResult.pageCount);

    // Step 11: Set extraction_status and trigger Phase 2 (AC-11.6.2, AC-11.6.4)
    // Get document type to determine if extraction is needed
    const { data: docData } = await supabase
      .from('documents')
      .select('document_type')
      .eq('id', processingDocumentId)
      .single();

    const documentType = docData?.document_type;
    const needsExtraction = documentType !== 'general';

    // Set extraction_status based on document type
    await supabase
      .from('documents')
      .update({
        extraction_status: needsExtraction ? 'pending' : 'skipped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', processingDocumentId);

    log.info('Phase 1 complete - document ready for chat', {
      documentId: processingDocumentId,
      extractionStatus: needsExtraction ? 'pending' : 'skipped',
    });

    // Trigger Phase 2 extraction async (AC-11.6.2: fire-and-forget)
    if (needsExtraction) {
      triggerPhase2Extraction(supabaseUrl, supabaseServiceKey, processingDocumentId, agencyId)
        .catch((err) => {
          // Non-blocking - document is still ready for chat
          log.warn('Failed to trigger Phase 2 extraction', {
            documentId: processingDocumentId,
            error: err.message,
          });
        });
    }

    // Step 11: Complete processing job
    await updateJobStatus(supabase, processingDocumentId, 'completed');

    const totalDuration = Date.now() - startTime;
    log.info('Processing completed', {
      documentId: processingDocumentId,
      duration: totalDuration,
      chunkCount: chunks.length,
      pageCount: parseResult.pageCount,
    });

    // Step 12: Check if there are more pending jobs for this agency (AC-4.7.3)
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

    // Story 13.2 (AC-13.2.3): Use LlamaParse-specific error classification when applicable
    const classification = err instanceof LlamaParseError
      ? classifyLlamaParseError(err)
      : classifyError(err.message);

    // Story 11.3 (AC-11.3.5): Structured logging with error classification
    // Story 11.5 (AC-11.5.1): Extended logging with category and code
    log.error('Processing failed', err, {
      documentId,
      agencyId,
      errorType: classification.errorType,
      errorCategory: classification.category,
      errorCode: classification.code,
      isRetryable: classification.shouldAutoRetry,
      step: 'unknown',
      errorName: err.name, // Story 13.2: Include error class name for debugging
    });

    // Update document and job status to failed with error classification
    try {
      await updateDocumentStatus(supabase, documentId, 'failed');
      await updateJobStatus(supabase, documentId, 'failed', err.message, classification);
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
      JSON.stringify({
        success: false,
        error: err.message,
        errorType: classification.errorType,
        errorCategory: classification.category,
        errorCode: classification.code,
      }),
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
// LlamaParse Types (Story 13.2 - AC-13.2.4: Backward Compatibility)
// ============================================================================

/**
 * DoclingResult interface - matches historical format for chunking pipeline compatibility.
 * Story 13.2: LlamaParse convertToDoclingResult() produces this format.
 */
interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
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

/**
 * Trigger Phase 2 extraction via the extract-quote-data Edge Function.
 * Story 11.6 (AC-11.6.2): Fire-and-forget async call - doesn't block Phase 1 completion.
 */
async function triggerPhase2Extraction(
  supabaseUrl: string,
  serviceKey: string,
  documentId: string,
  agencyId: string
): Promise<void> {
  log.info('Triggering Phase 2 extraction', { documentId, agencyId });

  const response = await fetch(`${supabaseUrl}/functions/v1/extract-quote-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      documentId,
      agencyId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger Phase 2 extraction: ${response.status} - ${errorText}`);
  }

  log.info('Phase 2 extraction triggered successfully', { documentId });
}

// ============================================================================
// Database Operations
// ============================================================================

async function updateJobStatus(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string,
  classification?: ClassifiedError
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

  // Story 11.3 (AC-11.3.4): Set error_type for classification
  // Story 11.5 (AC-11.5.1): Set error_category and error_code for extended classification
  if (status === 'failed' && errorMessage) {
    const classificationResult = classification || classifyError(errorMessage);
    updateData.error_type = classificationResult.errorType;
    updateData.error_category = classificationResult.category;
    updateData.error_code = classificationResult.code;
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
// Story 10.12: Quote Extraction at Upload Time
// ============================================================================

/**
 * Quote extraction timeout in milliseconds.
 * AC-10.12.8: 60-second timeout for extraction
 */
const QUOTE_EXTRACTION_TIMEOUT_MS = 60000;

/**
 * Extraction version for cache invalidation.
 * Must match EXTRACTION_VERSION in src/types/compare.ts
 */
const EXTRACTION_VERSION = 3;

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
// Story 10.12: Quote Extraction at Upload Time
// ============================================================================

/**
 * System prompt for insurance quote extraction.
 * Mirrors the prompt from src/lib/compare/extraction.ts
 */
const EXTRACTION_SYSTEM_PROMPT = `You are an expert insurance document analyst.
Your task is to extract structured data from insurance quote documents.

IMPORTANT GUIDELINES:
- Extract exact values as they appear in the document
- For each extracted item, include the page number(s) where it appears
- If a field is not found in the document, omit it or set to null
- Do NOT guess or infer values that are not explicitly stated
- For currency amounts, extract the numeric value only (no $ or commas)
- For dates, use YYYY-MM-DD format

COVERAGE TYPE MAPPINGS:
- "General Liability", "CGL", "Commercial General Liability" → general_liability
- "Property", "Building", "Business Personal Property", "BPP" → property
- "Auto Liability", "Automobile Liability", "Commercial Auto" → auto_liability
- "Physical Damage", "Collision", "Comprehensive", "Auto Physical" → auto_physical_damage
- "Umbrella", "Excess Liability", "Excess" → umbrella
- "Workers Compensation", "WC", "Workers' Comp" → workers_comp
- "Professional Liability", "E&O", "Errors and Omissions" → professional_liability
- "Cyber Liability", "Data Breach", "Network Security" → cyber
- "EPLI", "Employment Practices Liability" → epli
- "D&O", "Directors and Officers" → d_and_o
- "Crime", "Fidelity", "Employee Dishonesty" → crime
- Other coverages → other

EXCLUSION CATEGORY MAPPINGS:
- Flood, water damage → flood
- Earthquake, earth movement → earthquake
- Pollution, contamination → pollution
- Mold, fungus → mold
- Cyber, data breach (when excluded) → cyber
- Employment practices (when excluded) → employment
- Other exclusions → other

LIMIT TYPE MAPPINGS:
- "Each Occurrence", "Per Occurrence", "Per Claim" → per_occurrence
- "Aggregate", "Annual Aggregate", "Policy Aggregate" → aggregate
- "Per Person", "Each Person" → per_person
- "CSL", "Combined Single Limit" → combined_single

Extract all available information and include source page numbers for traceability.`;

/**
 * JSON Schema for quote extraction structured output.
 * Matches quoteExtractionSchema from src/types/compare.ts
 */
const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    carrierName: { type: ['string', 'null'], description: 'Insurance carrier/company name' },
    policyNumber: { type: ['string', 'null'], description: 'Policy or quote number' },
    namedInsured: { type: ['string', 'null'], description: 'Named insured (policyholder)' },
    effectiveDate: { type: ['string', 'null'], description: 'Policy effective date (YYYY-MM-DD)' },
    expirationDate: { type: ['string', 'null'], description: 'Policy expiration date (YYYY-MM-DD)' },
    annualPremium: { type: ['number', 'null'], description: 'Total annual premium in USD' },
    coverages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['general_liability', 'property', 'auto_liability', 'auto_physical_damage',
                   'umbrella', 'workers_comp', 'professional_liability', 'cyber', 'other',
                   'epli', 'd_and_o', 'crime', 'pollution', 'inland_marine', 'builders_risk',
                   'business_interruption', 'product_liability', 'garage_liability',
                   'liquor_liability', 'medical_malpractice', 'fiduciary']
          },
          name: { type: 'string' },
          limit: { type: ['number', 'null'] },
          sublimit: { type: ['number', 'null'] },
          limitType: { type: ['string', 'null'], enum: ['per_occurrence', 'aggregate', 'per_person', 'combined_single', null] },
          deductible: { type: ['number', 'null'] },
          description: { type: 'string' },
          sourcePages: { type: 'array', items: { type: 'integer' } },
          aggregateLimit: { type: ['number', 'null'] },
          selfInsuredRetention: { type: ['number', 'null'] },
          coinsurance: { type: ['number', 'null'] },
          waitingPeriod: { type: ['string', 'null'] },
          indemnityPeriod: { type: ['string', 'null'] },
        },
        required: ['type', 'name', 'limit', 'sublimit', 'limitType', 'deductible', 'description', 'sourcePages', 'aggregateLimit', 'selfInsuredRetention', 'coinsurance', 'waitingPeriod', 'indemnityPeriod'],
        additionalProperties: false,
      },
    },
    exclusions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['flood', 'earthquake', 'pollution', 'mold', 'cyber', 'employment', 'other'] },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['name', 'description', 'category', 'sourcePages'],
        additionalProperties: false,
      },
    },
    deductibles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          amount: { type: 'number' },
          appliesTo: { type: 'string' },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['type', 'amount', 'appliesTo', 'sourcePages'],
        additionalProperties: false,
      },
    },
    policyMetadata: {
      type: ['object', 'null'],
      properties: {
        formType: { type: ['string', 'null'], enum: ['iso', 'proprietary', 'manuscript', null] },
        formNumbers: { type: 'array', items: { type: 'string' } },
        policyType: { type: ['string', 'null'], enum: ['occurrence', 'claims-made', null] },
        retroactiveDate: { type: ['string', 'null'] },
        extendedReportingPeriod: { type: ['string', 'null'] },
        auditType: { type: ['string', 'null'], enum: ['annual', 'monthly', 'final', 'none', null] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['formType', 'formNumbers', 'policyType', 'retroactiveDate', 'extendedReportingPeriod', 'auditType', 'sourcePages'],
      additionalProperties: false,
    },
    endorsements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formNumber: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['broadening', 'restricting', 'conditional'] },
          description: { type: 'string' },
          affectedCoverage: { type: ['string', 'null'] },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['formNumber', 'name', 'type', 'description', 'affectedCoverage', 'sourcePages'],
        additionalProperties: false,
      },
    },
    carrierInfo: {
      type: ['object', 'null'],
      properties: {
        amBestRating: { type: ['string', 'null'] },
        amBestFinancialSize: { type: ['string', 'null'] },
        naicCode: { type: ['string', 'null'] },
        admittedStatus: { type: ['string', 'null'], enum: ['admitted', 'non-admitted', 'surplus', null] },
        claimsPhone: { type: ['string', 'null'] },
        underwriter: { type: ['string', 'null'] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['amBestRating', 'amBestFinancialSize', 'naicCode', 'admittedStatus', 'claimsPhone', 'underwriter', 'sourcePages'],
      additionalProperties: false,
    },
    premiumBreakdown: {
      type: ['object', 'null'],
      properties: {
        basePremium: { type: ['number', 'null'] },
        coveragePremiums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coverage: { type: 'string' },
              premium: { type: 'number' },
            },
            required: ['coverage', 'premium'],
            additionalProperties: false,
          },
        },
        taxes: { type: ['number', 'null'] },
        fees: { type: ['number', 'null'] },
        brokerFee: { type: ['number', 'null'] },
        surplusLinesTax: { type: ['number', 'null'] },
        totalPremium: { type: 'number' },
        paymentPlan: { type: ['string', 'null'] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['basePremium', 'coveragePremiums', 'taxes', 'fees', 'brokerFee', 'surplusLinesTax', 'totalPremium', 'paymentPlan', 'sourcePages'],
      additionalProperties: false,
    },
  },
  required: ['carrierName', 'policyNumber', 'namedInsured', 'effectiveDate', 'expirationDate', 'annualPremium', 'coverages', 'exclusions', 'deductibles', 'policyMetadata', 'endorsements', 'carrierInfo', 'premiumBreakdown'],
  additionalProperties: false,
} as const;

/**
 * Perform quote extraction on document chunks.
 * Story 10.12: Extracts structured quote data at upload time.
 *
 * AC-10.12.1: Triggered after AI tagging for quote documents
 * AC-10.12.2: Stores result in documents.extraction_data
 * AC-10.12.3: Graceful degradation - failures don't block processing
 * AC-10.12.4: Only runs for document_type = 'quote' or null
 * AC-10.12.8: 60-second timeout
 */
async function performQuoteExtraction(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  agencyId: string,
  chunks: DocumentChunk[],
  openaiApiKey: string
): Promise<void> {
  const startTime = Date.now();

  // AC-10.12.4: Check document type - only extract for quotes
  const { data: docData } = await supabase
    .from('documents')
    .select('document_type')
    .eq('id', documentId)
    .single();

  const documentType = docData?.document_type;

  // Skip extraction for general documents
  if (documentType === 'general') {
    log.info('Quote extraction skipped: document_type is general', { documentId });
    return;
  }

  log.info('Starting quote extraction', {
    documentId,
    documentType: documentType || 'null (treating as quote)',
    chunkCount: chunks.length,
  });

  // Build context from all chunks with page markers
  const context = chunks
    .map((c) => {
      return `--- PAGE ${c.pageNumber} ---\n${c.content}`;
    })
    .join('\n\n');

  if (!context.trim()) {
    log.warn('Quote extraction skipped: no content', { documentId });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUOTE_EXTRACTION_TIMEOUT_MS);

  try {
    // Build request for OpenAI structured outputs
    const requestBody = {
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract structured insurance quote data from the following document:\n\n${context}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'quote_extraction',
          strict: true,
          schema: EXTRACTION_JSON_SCHEMA,
        },
      },
      temperature: 0.1, // Low temperature for consistent extraction
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in extraction response');
    }

    // Parse the extraction result
    const extraction = JSON.parse(content);

    // Add metadata fields
    extraction.extractedAt = new Date().toISOString();
    extraction.modelUsed = 'gpt-5.1';

    // AC-10.12.2: Store extraction in documents table
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extraction_data: extraction,
        extraction_version: EXTRACTION_VERSION,
        extraction_error: null, // Clear any previous error
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to store extraction: ${updateError.message}`);
    }

    // AC-10.12.2: Also cache in quote_extractions table for comparison flow compatibility
    const { error: cacheError } = await supabase
      .from('quote_extractions')
      .upsert(
        {
          document_id: documentId,
          agency_id: agencyId,
          extracted_data: extraction,
          extraction_version: EXTRACTION_VERSION,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'document_id',
          ignoreDuplicates: false,
        }
      );

    if (cacheError) {
      log.warn('Failed to cache extraction in quote_extractions', {
        documentId,
        error: cacheError.message,
      });
      // Don't throw - documents table update succeeded
    }

    const duration = Date.now() - startTime;
    log.info('Quote extraction completed', {
      documentId,
      duration,
      coverageCount: extraction.coverages?.length || 0,
      exclusionCount: extraction.exclusions?.length || 0,
      carrierName: extraction.carrierName || null,
      annualPremium: extraction.annualPremium || null,
    });

  } catch (error) {
    clearTimeout(timeout);

    const err = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    // AC-10.12.3: Store error details in extraction_error column
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extraction_error: err.message,
        extraction_data: null,
        extraction_version: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      log.warn('Failed to store extraction error', { documentId, error: updateError.message });
    }

    if (err.name === 'AbortError') {
      log.warn('Quote extraction timeout', {
        documentId,
        duration,
        timeoutMs: QUOTE_EXTRACTION_TIMEOUT_MS,
      });
    } else {
      log.warn('Quote extraction failed', {
        documentId,
        duration,
        error: err.message,
      });
    }

    // AC-10.12.3: Graceful degradation - don't throw, just log and continue
  }
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Story 5.12: Progress Reporting
// ============================================================================

/**
 * Update job progress data for real-time UI updates.
 * Story 5.12 (AC-5.12.1 through AC-5.12.4): Progress reporting
 * Story 11.1 (AC-11.1.4): Also update stage and progress_percent columns directly
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

  // Story 11.1 (AC-11.1.4): Update stage and progress_percent columns directly
  // in addition to progress_data JSONB for backward compatibility
  const { error } = await supabase
    .from('processing_jobs')
    .update({
      progress_data: progressData,
      stage: stage,                    // Story 11.1: Direct column update
      progress_percent: totalProgress, // Story 11.1: Direct column update
    })
    .eq('document_id', documentId);

  if (error) {
    // Don't throw - progress updates are best-effort
    log.warn('Failed to update progress', { error: error.message, documentId, stage });
  }
}

/**
 * Estimate time remaining based on file size and stage.
 * Returns seconds.
 * Story 13.2: Simplified for LlamaParse (no batch mode stages)
 */
function estimateTimeRemaining(
  fileSizeBytes: number,
  stage: ProgressData['stage'],
  stageProgress: number = 0
): number | null {
  const MB = 1024 * 1024;
  const sizeMB = fileSizeBytes / MB;

  // Base estimates per stage (in seconds) for ~10MB file
  // Story 11.6: Removed 'analyzing' - extraction now in Phase 2
  // Story 13.2: Simplified for LlamaParse (no batch processing stages)
  const baseEstimates: Record<ProgressData['stage'], number> = {
    downloading: 10,
    parsing: 60, // LlamaParse is typically 30-60s for most documents
    chunking: 15,
    embedding: 60, // 1 min base for embeddings
  };

  // Scale by file size (larger files take proportionally longer)
  const sizeMultiplier = Math.max(1, sizeMB / 10);
  const baseTime = baseEstimates[stage] * sizeMultiplier;

  // Adjust for progress within stage
  const remainingTime = baseTime * ((100 - stageProgress) / 100);

  // Add estimates for remaining stages
  // Story 13.2: Single stage order for LlamaParse
  const stageOrder: ProgressData['stage'][] = ['downloading', 'parsing', 'chunking', 'embedding'];
  const currentIndex = stageOrder.indexOf(stage);
  let additionalTime = 0;

  for (let i = currentIndex + 1; i < stageOrder.length; i++) {
    additionalTime += baseEstimates[stageOrder[i]] * sizeMultiplier;
  }

  return Math.round(remainingTime + additionalTime);
}
