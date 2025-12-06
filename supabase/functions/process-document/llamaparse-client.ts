/**
 * LlamaParse API Client for PDF Document Parsing
 * Story 13.1: LlamaParse API Client
 *
 * Replaces Document AI with LlamaParse for simpler, more reliable PDF parsing.
 * Key features:
 * - Simple REST API (no GCS dependency)
 * - 10,000 free pages/month
 * - Page marker support for citation system compatibility
 *
 * @see https://developers.llamaindex.ai/python/cloud/llamaparse/features/parsing_options
 */

// ============================================================================
// Type Definitions (AC-13.1.1)
// ============================================================================

/**
 * Configuration for LlamaParse client.
 * AC-13.1.1: Export LlamaParseConfig type
 */
export interface LlamaParseConfig {
  /** LlamaIndex Cloud API key (LLAMA_CLOUD_API_KEY) */
  apiKey: string;
  /** Base URL for LlamaParse API. Default: https://api.cloud.llamaindex.ai */
  baseUrl?: string;
  /** Polling interval in milliseconds. Default: 2000 (2 seconds) */
  pollingIntervalMs?: number;
  /** Maximum wait time in milliseconds. Default: 300000 (5 minutes) */
  maxWaitTimeMs?: number;
}

/**
 * Result from LlamaParse parsing operation.
 * AC-13.1.1: Export LlamaParseResult type
 */
export interface LlamaParseResult {
  /** Extracted markdown content with page markers */
  markdown: string;
  /** Number of pages in the document */
  pageCount: number;
  /** LlamaParse job ID for reference */
  jobId: string;
  /** Total processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Job status response from LlamaParse API.
 */
export interface LlamaParseJobStatus {
  /** Job identifier */
  id: string;
  /** Current job status */
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  /** Error message if status is ERROR */
  error?: string;
  /** Number of pages processed (available in some responses) */
  num_pages?: number;
}

/**
 * PageMarker interface - MUST match index.ts:154-158
 * Constraint 1: PageMarker MUST include pageNumber, startIndex, endIndex
 */
interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

/**
 * DoclingResult interface - MUST match index.ts:692-696
 * Used for compatibility with existing chunking pipeline.
 */
interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_URL = 'https://api.cloud.llamaindex.ai';
const DEFAULT_POLLING_INTERVAL_MS = 2000;
const DEFAULT_MAX_WAIT_TIME_MS = 300000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 1000;

// Constraint 2: Page marker regex MUST match existing splitByPages() pattern
const PAGE_MARKER_PATTERN = /---\s*PAGE\s+(\d+)\s*---/gi;
const PAGE_MARKER_PLACEHOLDER_PATTERN = /---\s*PAGE\s*\{pageNumber\}\s*---/gi;

// ============================================================================
// Structured Logging (AC-13.1.6)
// ============================================================================

interface LogData {
  [key: string]: unknown;
}

const log = {
  info: (message: string, data?: LogData): void => {
    console.log(
      JSON.stringify({
        level: 'info',
        source: 'llamaparse-client',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
  warn: (message: string, data?: LogData): void => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        source: 'llamaparse-client',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
  error: (message: string, data?: LogData): void => {
    console.error(
      JSON.stringify({
        level: 'error',
        source: 'llamaparse-client',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
};

// ============================================================================
// Error Classes (AC-13.1.6)
// ============================================================================

/**
 * Base error class for LlamaParse operations.
 */
export class LlamaParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LlamaParseError';
  }
}

/**
 * Error during file upload.
 */
export class UploadError extends LlamaParseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'UPLOAD_ERROR', true, details);
    this.name = 'UploadError';
  }
}

/**
 * Error during job polling/status check.
 */
export class PollingError extends LlamaParseError {
  constructor(message: string, isRetryable: boolean = true, details?: Record<string, unknown>) {
    super(message, 'POLLING_ERROR', isRetryable, details);
    this.name = 'PollingError';
  }
}

/**
 * Error when job times out.
 */
export class TimeoutError extends LlamaParseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', false, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Error during result retrieval.
 */
export class ResultError extends LlamaParseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESULT_ERROR', true, details);
    this.name = 'ResultError';
  }
}

// ============================================================================
// Retry Logic (AC-13.1.6)
// ============================================================================

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry.
 * AC-13.1.6: Retry failed requests (max 3 attempts) with exponential backoff (1s, 2s, 4s)
 *
 * @param fn - Function to execute
 * @param operationName - Name for logging
 * @returns Result of successful execution
 * @throws Last error after all retries exhausted
 */
async function withRetry<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
  let lastError: Error | null = null;
  let backoffMs = INITIAL_BACKOFF_MS;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = error instanceof LlamaParseError ? error.isRetryable : true;

      if (!isRetryable || attempt === MAX_RETRY_ATTEMPTS) {
        log.error(`${operationName} failed after ${attempt} attempt(s)`, {
          error: lastError.message,
          attempt,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        });
        throw lastError;
      }

      log.warn(`${operationName} failed, retrying in ${backoffMs}ms`, {
        error: lastError.message,
        attempt,
        nextAttemptIn: backoffMs,
      });

      await sleep(backoffMs);
      backoffMs *= 2; // Exponential backoff: 1s, 2s, 4s
    }
  }

  throw lastError || new Error(`${operationName} failed with unknown error`);
}

// ============================================================================
// API Operations (AC-13.1.2, AC-13.1.3, AC-13.1.4)
// ============================================================================

/**
 * Upload file to LlamaParse API.
 * AC-13.1.2: File Upload with Page Marker Configuration
 *
 * @param fileBuffer - File content as ArrayBuffer
 * @param filename - Original filename
 * @param config - LlamaParse configuration
 * @returns Job ID on success
 */
async function uploadFile(
  fileBuffer: ArrayBuffer,
  filename: string,
  config: LlamaParseConfig
): Promise<string> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/parsing/upload`;

  // Create form data with file and parsing options
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), filename);

  // Constraint 3: LlamaParse upload MUST set page_prefix
  // AC-13.1.2: Configure page_prefix to match existing parser pattern
  formData.append('page_prefix', '--- PAGE {pageNumber} ---\n');

  // AC-13.1.2: Set resultType="markdown" for markdown output
  formData.append('result_type', 'markdown');

  log.info('Uploading file to LlamaParse', {
    filename,
    sizeBytes: fileBuffer.byteLength,
    url,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new UploadError(`Upload failed: ${response.status} ${response.statusText}`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
  }

  const result = await response.json();
  const jobId = result.id;

  if (!jobId) {
    throw new UploadError('Upload response missing job ID', { response: result });
  }

  log.info('File uploaded successfully', { jobId, filename });
  return jobId;
}

/**
 * Get job status from LlamaParse API.
 *
 * @param jobId - Job ID to check
 * @param config - LlamaParse configuration
 * @returns Job status
 */
async function getJobStatus(jobId: string, config: LlamaParseConfig): Promise<LlamaParseJobStatus> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/parsing/job/${jobId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new PollingError(`Failed to get job status: ${response.status}`, true, {
      status: response.status,
      jobId,
    });
  }

  const status = await response.json();
  return {
    id: status.id || jobId,
    status: status.status,
    error: status.error,
    num_pages: status.num_pages,
  };
}

/**
 * Poll job until completion or timeout.
 * AC-13.1.3: Job Polling
 *
 * @param jobId - Job ID to poll
 * @param config - LlamaParse configuration
 * @param onProgress - Optional progress callback
 * @returns Final job status
 */
async function pollJobUntilComplete(
  jobId: string,
  config: LlamaParseConfig,
  onProgress?: (stage: string, percent: number) => Promise<void>
): Promise<LlamaParseJobStatus> {
  const pollingInterval = config.pollingIntervalMs || DEFAULT_POLLING_INTERVAL_MS;
  const maxWaitTime = config.maxWaitTimeMs || DEFAULT_MAX_WAIT_TIME_MS;
  const startTime = Date.now();

  log.info('Starting job polling', {
    jobId,
    pollingIntervalMs: pollingInterval,
    maxWaitTimeMs: maxWaitTime,
  });

  let lastProgress = 0;

  while (true) {
    const elapsed = Date.now() - startTime;

    // AC-13.1.3: Timeout after 5 minutes (configurable)
    if (elapsed > maxWaitTime) {
      throw new TimeoutError(`Job timed out after ${maxWaitTime / 1000} seconds`, {
        jobId,
        elapsedMs: elapsed,
      });
    }

    const status = await withRetry(() => getJobStatus(jobId, config), 'getJobStatus');

    // AC-13.1.3: Handle PENDING, SUCCESS, ERROR states
    switch (status.status) {
      case 'SUCCESS':
        log.info('Job completed successfully', { jobId, elapsedMs: elapsed });
        if (onProgress) {
          await onProgress('parsing', 100);
        }
        return status;

      case 'ERROR':
        throw new PollingError(`Job failed: ${status.error || 'Unknown error'}`, false, {
          jobId,
          error: status.error,
        });

      case 'PENDING':
        // Calculate estimated progress based on elapsed time
        // Assume most documents complete in ~30 seconds, cap at 95%
        const estimatedProgress = Math.min(95, Math.floor((elapsed / 30000) * 100));
        if (estimatedProgress > lastProgress && onProgress) {
          lastProgress = estimatedProgress;
          await onProgress('parsing', estimatedProgress);
        }
        break;
    }

    // AC-13.1.3: Poll job status every 2 seconds (configurable)
    await sleep(pollingInterval);
  }
}

/**
 * Fetch markdown result from LlamaParse API.
 * AC-13.1.4: Result Retrieval
 *
 * @param jobId - Completed job ID
 * @param config - LlamaParse configuration
 * @returns Markdown content
 */
async function fetchResult(jobId: string, config: LlamaParseConfig): Promise<string> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/parsing/job/${jobId}/result/markdown`;

  log.info('Fetching result', { jobId, url });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new ResultError(`Failed to fetch result: ${response.status}`, {
      status: response.status,
      jobId,
    });
  }

  const result = await response.json();

  // Handle different response formats
  const markdown = typeof result === 'string' ? result : result.markdown || result.text || '';

  if (!markdown) {
    log.warn('Empty markdown result received', { jobId });
  }

  log.info('Result fetched successfully', {
    jobId,
    markdownLength: markdown.length,
  });

  return markdown;
}

// ============================================================================
// Page Marker Extraction (AC-13.1.5, AC-13.1.7)
// ============================================================================

/**
 * Extract page markers with character indices from markdown.
 * AC-13.1.5: DoclingResult Conversion with PageMarker Indices
 * AC-13.1.7: Page Marker Fallback Handling
 *
 * Constraint 1: PageMarker MUST include pageNumber, startIndex, endIndex
 * Constraint 2: Page marker regex MUST be /---\s*PAGE\s+(\d+)\s*---/gi
 *
 * @param markdown - Markdown content with page markers
 * @returns Array of PageMarker objects with indices
 */
export function extractPageMarkersWithIndices(markdown: string): PageMarker[] {
  const markers: PageMarker[] = [];

  // Reset regex state (important for global regex)
  PAGE_MARKER_PATTERN.lastIndex = 0;

  let match;
  while ((match = PAGE_MARKER_PATTERN.exec(markdown)) !== null) {
    const pageNumber = parseInt(match[1], 10);
    // startIndex is position AFTER the marker (where content begins)
    const startIndex = match.index + match[0].length;

    // Update previous marker's endIndex to where this marker starts
    if (markers.length > 0) {
      markers[markers.length - 1].endIndex = match.index;
    }

    markers.push({
      pageNumber,
      startIndex,
      endIndex: markdown.length, // Will be updated by next iteration or stays as end
    });
  }

  // AC-13.1.7: Handle {pageNumber} placeholder bug - fallback to sequential numbering
  // Known issue: https://github.com/run-llama/llama_cloud_services/issues/721
  if (markers.length === 0 && markdown.includes('{pageNumber}')) {
    log.warn('{pageNumber} placeholder not replaced by LlamaParse, using fallback sequential numbering');

    // Reset regex state
    PAGE_MARKER_PLACEHOLDER_PATTERN.lastIndex = 0;

    let fallbackMatch;
    let pageNum = 1;
    while ((fallbackMatch = PAGE_MARKER_PLACEHOLDER_PATTERN.exec(markdown)) !== null) {
      const startIndex = fallbackMatch.index + fallbackMatch[0].length;

      if (markers.length > 0) {
        markers[markers.length - 1].endIndex = fallbackMatch.index;
      }

      markers.push({
        pageNumber: pageNum++,
        startIndex,
        endIndex: markdown.length,
      });
    }
  }

  // AC-13.1.7: Log warning when page markers extraction fails
  if (markers.length === 0 && markdown.length > 0) {
    log.warn('No page markers found in markdown, will treat as single-page document', {
      markdownLength: markdown.length,
      hasContent: markdown.trim().length > 0,
    });
  }

  return markers;
}

/**
 * Convert LlamaParse result to DoclingResult format.
 * AC-13.1.5: Maintain compatibility with existing chunkMarkdown() pipeline
 *
 * @param llamaResult - Result from LlamaParse
 * @returns DoclingResult for downstream processing
 */
export function convertToDoclingResult(llamaResult: LlamaParseResult): DoclingResult {
  const pageMarkers = extractPageMarkersWithIndices(llamaResult.markdown);

  // AC-13.1.5: Handle empty pageMarkers case (treat entire document as page 1)
  // Page count priority: explicit pageCount > marker count > 1
  const pageCount = llamaResult.pageCount || pageMarkers.length || 1;

  return {
    markdown: llamaResult.markdown,
    pageMarkers,
    pageCount,
  };
}

// ============================================================================
// Main Function (AC-13.1.1)
// ============================================================================

/**
 * Parse PDF document using LlamaParse API.
 * AC-13.1.1: Export parseDocumentWithLlamaParse() function
 *
 * This is the main entry point for document parsing. It handles:
 * 1. File upload with page marker configuration
 * 2. Job polling with progress updates
 * 3. Result retrieval
 *
 * @param fileBuffer - PDF file content as ArrayBuffer
 * @param filename - Original filename
 * @param config - LlamaParse configuration
 * @param onProgress - Optional callback for progress updates
 * @returns LlamaParseResult with markdown and metadata
 */
export async function parseDocumentWithLlamaParse(
  fileBuffer: ArrayBuffer,
  filename: string,
  config: LlamaParseConfig,
  onProgress?: (stage: string, percent: number) => Promise<void>
): Promise<LlamaParseResult> {
  const startTime = Date.now();

  log.info('Starting LlamaParse document parsing', {
    filename,
    fileSizeBytes: fileBuffer.byteLength,
  });

  try {
    // Report initial progress
    if (onProgress) {
      await onProgress('parsing', 0);
    }

    // Step 1: Upload file (AC-13.1.2)
    const jobId = await withRetry(
      () => uploadFile(fileBuffer, filename, config),
      'uploadFile'
    );

    // Report upload complete
    if (onProgress) {
      await onProgress('parsing', 10);
    }

    // Step 2: Poll for completion (AC-13.1.3)
    const finalStatus = await pollJobUntilComplete(jobId, config, onProgress);

    // Step 3: Fetch result (AC-13.1.4)
    const markdown = await withRetry(
      () => fetchResult(jobId, config),
      'fetchResult'
    );

    const processingTimeMs = Date.now() - startTime;

    // AC-13.1.4: Parse page count from result
    // Use API response num_pages if available, otherwise count from markers
    const pageMarkersCount = extractPageMarkersWithIndices(markdown).length;
    const pageCount = finalStatus.num_pages || pageMarkersCount || 1;

    log.info('LlamaParse document parsing complete', {
      jobId,
      filename,
      processingTimeMs,
      pageCount,
      markdownLength: markdown.length,
    });

    return {
      markdown,
      pageCount,
      jobId,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    log.error('LlamaParse document parsing failed', {
      filename,
      processingTimeMs,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof LlamaParseError ? error.code : 'UNKNOWN',
    });

    throw error;
  }
}
