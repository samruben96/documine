/**
 * Google Cloud Document AI Client
 *
 * Authenticates with GCP using service account credentials and calls Document AI API.
 * Implements JWT-based authentication for Deno environment (Web Crypto API).
 *
 * Story 12.1: Connect GCP Document AI
 * - AC-12.1.1: Service account credentials configured as Edge Function secret
 * - AC-12.1.2: Environment variables for processor ID and location
 * - AC-12.1.3: JWT authentication with RS256 signing
 * - AC-12.1.4: Actionable error messages
 *
 * @module supabase/functions/process-document/documentai-client
 */

// ============================================================================
// Types
// ============================================================================

export interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

export interface DocumentAIConfig {
  projectId: string;
  location: string;
  processorId: string;
}

// ============================================================================
// Document AI Response Types (Story 12.2)
// ============================================================================

/**
 * Bounding polygon for layout elements.
 */
export interface DocumentAIBoundingPoly {
  normalizedVertices: Array<{
    x: number;
    y: number;
  }>;
}

/**
 * Text anchor referencing segments in the full document text.
 */
export interface DocumentAITextAnchor {
  textSegments: Array<{
    startIndex?: string;
    endIndex?: string;
  }>;
}

/**
 * Layout information for a document element.
 */
export interface DocumentAILayout {
  textAnchor: DocumentAITextAnchor;
  boundingPoly: DocumentAIBoundingPoly;
  confidence: number;
}

/**
 * Paragraph element within a page.
 */
export interface DocumentAIParagraph {
  layout: DocumentAILayout;
}

/**
 * Table cell within a table.
 */
export interface DocumentAITableCell {
  layout: DocumentAILayout;
  rowSpan?: number;
  colSpan?: number;
}

/**
 * Table row containing cells.
 */
export interface DocumentAITableRow {
  cells: DocumentAITableCell[];
}

/**
 * Table element within a page.
 */
export interface DocumentAITable {
  layout: DocumentAILayout;
  headerRows: DocumentAITableRow[];
  bodyRows: DocumentAITableRow[];
}

/**
 * Page dimension information.
 */
export interface DocumentAIPageDimension {
  width: number;
  height: number;
  unit: string;
}

/**
 * Single page within the document.
 */
export interface DocumentAIPage {
  pageNumber: number;
  dimension: DocumentAIPageDimension;
  layout: DocumentAILayout;
  paragraphs: DocumentAIParagraph[];
  tables: DocumentAITable[];
}

/**
 * Document AI process response structure.
 * Matches the API response schema.
 */
export interface DocumentAIProcessResponse {
  document: {
    text: string;
    pages: DocumentAIPage[];
  };
}

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

// Error classification types (AC-12.1.4)
export type DocumentAIErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MISSING_KEY'
  | 'AUTH_TOKEN_FAILED'
  | 'PROCESSOR_NOT_FOUND'
  | 'PROCESSOR_INVALID_REGION'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_DOCUMENT'
  | 'UNKNOWN_ERROR';

export interface DocumentAIConnectionError {
  code: DocumentAIErrorCode;
  message: string;
  userMessage: string;
  suggestedAction: string;
}

// ============================================================================
// Token Cache
// ============================================================================

let tokenCache: AccessTokenCache | null = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Get Document AI configuration from environment variables.
 * AC-12.1.1, AC-12.1.2: Validates required configuration
 */
export function getDocumentAIConfig(): DocumentAIConfig {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY not configured. Add service account JSON as Edge Function secret.'
    );
  }

  const processorId = Deno.env.get('DOCUMENT_AI_PROCESSOR_ID');
  if (!processorId) {
    throw new Error(
      'DOCUMENT_AI_PROCESSOR_ID not configured. Set processor ID from GCP Console.'
    );
  }

  const location = Deno.env.get('DOCUMENT_AI_LOCATION') || 'us';

  let serviceAccount: ServiceAccountKey;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Check the secret value format.'
    );
  }

  return {
    projectId: serviceAccount.project_id,
    location,
    processorId,
  };
}

/**
 * Get parsed service account key from environment.
 */
export function getServiceAccountKey(): ServiceAccountKey {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY not configured. Add service account JSON as Edge Function secret.'
    );
  }

  try {
    return JSON.parse(serviceAccountJson) as ServiceAccountKey;
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Check the secret value format.'
    );
  }
}

// ============================================================================
// Authentication (AC-12.1.3)
// ============================================================================

/**
 * Import PEM private key for Web Crypto API.
 * Converts PKCS8 PEM format to CryptoKey for JWT signing.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and newlines
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '');

  // Decode base64 to binary
  const binaryString = atob(pemContents);
  const binaryKey = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryKey[i] = binaryString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Base64url encode a string (JWT-safe encoding).
 */
function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    // Convert Uint8Array to string then base64
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    base64 = btoa(binary);
  }
  // Make URL-safe
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Get access token for GCP API calls using service account credentials.
 * Implements JWT-based authentication for Deno environment.
 *
 * AC-12.1.3: JWT signing with RS256 algorithm
 *
 * @param serviceAccount - Service account key object
 * @returns Access token string
 */
export async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  // Check cache - return if valid (with 1 minute buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);

  // JWT Header
  const header = { alg: 'RS256', typ: 'JWT' };

  // JWT Payload
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour expiry
  };

  // Encode header and payload
  const b64Header = base64UrlEncode(JSON.stringify(header));
  const b64Payload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${b64Header}.${b64Payload}`;

  // Sign with RS256 using Web Crypto API
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const b64Signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${unsignedToken}.${b64Signature}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Cache token with expiry
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Buffer 60s before expiry
  };

  return data.access_token;
}

/**
 * Clear the token cache (useful for testing or forced refresh).
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

// ============================================================================
// Connection Test
// ============================================================================

/**
 * Test connection to Document AI API.
 * AC-12.1.3: Verify authentication with test API call
 *
 * @returns Result with success status and message
 */
export async function testDocumentAIConnection(): Promise<{
  success: boolean;
  message: string;
  processorInfo?: {
    name: string;
    displayName: string;
    type: string;
    state: string;
  };
}> {
  try {
    const config = getDocumentAIConfig();
    const serviceAccount = getServiceAccountKey();
    const accessToken = await getAccessToken(serviceAccount);

    // Make a lightweight GET call to verify processor exists
    const endpoint = `https://${config.location}-documentai.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: `Document AI API error: ${error.error?.message || response.statusText}`,
      };
    }

    const processor = await response.json();
    return {
      success: true,
      message: `Connected to processor: ${processor.displayName} (${processor.type})`,
      processorInfo: {
        name: processor.name,
        displayName: processor.displayName,
        type: processor.type,
        state: processor.state,
      },
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      message: err.message,
    };
  }
}

// ============================================================================
// Error Handling (AC-12.1.4)
// ============================================================================

/**
 * Classify a Document AI error into structured error info.
 * AC-12.1.4: Actionable error messages for different failure modes
 */
export function classifyDocumentAIError(error: Error | string): DocumentAIConnectionError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Missing configuration
  if (/google_service_account_key not configured/i.test(errorMessage)) {
    return {
      code: 'AUTH_MISSING_KEY',
      message: errorMessage,
      userMessage: 'Document AI credentials not configured.',
      suggestedAction: 'Contact administrator to configure GCP service account.',
    };
  }

  if (/document_ai_processor_id not configured/i.test(errorMessage)) {
    return {
      code: 'PROCESSOR_NOT_FOUND',
      message: errorMessage,
      userMessage: 'Document AI processor not configured.',
      suggestedAction: 'Contact administrator to configure processor ID.',
    };
  }

  if (/not valid json/i.test(errorMessage)) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: errorMessage,
      userMessage: 'Document AI credentials are invalid.',
      suggestedAction: 'Check that service account JSON is properly formatted.',
    };
  }

  // Authentication errors
  if (/failed to get access token/i.test(errorMessage)) {
    return {
      code: 'AUTH_TOKEN_FAILED',
      message: errorMessage,
      userMessage: 'Failed to authenticate with Document AI.',
      suggestedAction: 'Verify service account key is valid and has correct permissions.',
    };
  }

  if (/401|unauthorized/i.test(lowerMessage)) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: errorMessage,
      userMessage: 'Document AI authentication failed.',
      suggestedAction: 'Verify service account key is valid and has documentai.documents.process permission.',
    };
  }

  if (/403|forbidden|permission/i.test(lowerMessage)) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: errorMessage,
      userMessage: 'Access denied to Document AI.',
      suggestedAction: 'Verify service account has Document AI User role in GCP IAM.',
    };
  }

  // Processor errors
  if (/404|not found|processor/i.test(lowerMessage)) {
    return {
      code: 'PROCESSOR_NOT_FOUND',
      message: errorMessage,
      userMessage: 'Document AI processor not found.',
      suggestedAction: 'Verify processor ID and region are correct in GCP Console.',
    };
  }

  // Quota errors
  if (/429|quota|rate.?limit|too many requests/i.test(lowerMessage)) {
    return {
      code: 'QUOTA_EXCEEDED',
      message: errorMessage,
      userMessage: 'Document AI rate limit exceeded.',
      suggestedAction: 'Wait a moment and try again, or increase quota in GCP Console.',
    };
  }

  // Network errors
  if (/econnreset|econnrefused|network|connection refused/i.test(lowerMessage)) {
    return {
      code: 'NETWORK_ERROR',
      message: errorMessage,
      userMessage: 'Unable to reach Document AI service.',
      suggestedAction: 'Check network connectivity and try again.',
    };
  }

  // Timeout
  if (/timeout|timed out|aborted/i.test(lowerMessage)) {
    return {
      code: 'TIMEOUT',
      message: errorMessage,
      userMessage: 'Document AI request timed out.',
      suggestedAction: 'Try again with a smaller document or increase timeout.',
    };
  }

  // Page limit exceeded (Document AI has a 30-page limit in imageless mode)
  if (/page.*limit.*exceeded|pages.*exceed/i.test(lowerMessage)) {
    return {
      code: 'INVALID_DOCUMENT',
      message: errorMessage,
      userMessage: 'Document exceeds 30-page limit.',
      suggestedAction: 'Split the document into smaller parts (30 pages max each).',
    };
  }

  // Invalid document
  if (/invalid.*document|unsupported|cannot process/i.test(lowerMessage)) {
    return {
      code: 'INVALID_DOCUMENT',
      message: errorMessage,
      userMessage: 'Document format not supported.',
      suggestedAction: 'Ensure the document is a valid PDF, image, or supported format.',
    };
  }

  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: 'An unexpected error occurred connecting to Document AI.',
    suggestedAction: 'Contact support with error details.',
  };
}

// ============================================================================
// Logging Helper
// ============================================================================

const log = {
  info: (message: string, data?: Record<string, unknown>): void => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
  warn: (message: string, data?: Record<string, unknown>): void => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
  error: (message: string, error: Error, data?: Record<string, unknown>): void => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error.message,
        stack: error.stack,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },
};

export { log };

// ============================================================================
// Document AI Parsing Service (Story 12.2)
// ============================================================================

/**
 * Encode Uint8Array to base64 string.
 * Handles large files by processing in chunks to avoid stack overflow.
 * AC-12.2.2: Base64 encoding handles large files without memory issues
 */
export function encodeToBase64(buffer: Uint8Array): string {
  // For large files, process in chunks to avoid stack overflow with String.fromCharCode
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let result = '';

  for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
    const chunk = buffer.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode(...chunk);
  }

  return btoa(result);
}

/**
 * Check if an error code is transient and should be retried.
 * AC-12.2.5: Only retry transient errors
 */
export function isTransientError(code: DocumentAIErrorCode): boolean {
  return ['NETWORK_ERROR', 'TIMEOUT', 'QUOTA_EXCEEDED'].includes(code);
}

/**
 * Check if HTTP status code indicates a transient error.
 */
function isTransientHttpStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Sleep utility for retry backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Timeout for Document AI API calls in milliseconds (60 seconds) */
const DOCUMENT_AI_TIMEOUT_MS = 60000;

/**
 * Parse a PDF document using Document AI.
 * AC-12.2.1: Encapsulates Document AI API call
 * AC-12.2.2: Encodes PDF as base64
 * AC-12.2.3: Returns typed response
 * AC-12.2.4: Uses AbortController for 60s timeout
 *
 * @param pdfBuffer - PDF document as Uint8Array
 * @returns Parsed document response
 */
export async function parseDocumentWithDocumentAI(
  pdfBuffer: Uint8Array
): Promise<DocumentAIProcessResponse> {
  const startTime = Date.now();

  // Get configuration and auth token
  log.info('Getting Document AI config and token');
  const config = getDocumentAIConfig();
  const serviceAccount = getServiceAccountKey();
  const accessToken = await getAccessToken(serviceAccount);
  log.info('Got access token', { tokenLength: accessToken.length, projectId: config.projectId, processorId: config.processorId });

  // Build API endpoint
  const endpoint = `https://${config.location}-documentai.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}:process`;

  // Encode PDF to base64 (AC-12.2.2)
  const base64Content = encodeToBase64(pdfBuffer);

  // Construct request body with imagelessMode to enable 30-page limit
  // See: https://cloud.google.com/document-ai/docs/reference/rest/v1/projects.locations.processors/process
  const requestBody = {
    // Enable imageless mode to increase page limit from 15 to 30 pages
    imagelessMode: true,
    rawDocument: {
      content: base64Content,
      mimeType: 'application/pdf',
    },
  };

  // Create AbortController with 60s timeout (AC-12.2.4)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOCUMENT_AI_TIMEOUT_MS);

  // Log request details for debugging
  log.info('Calling Document AI API', {
    endpoint: endpoint.substring(0, 100), // Truncate for logging
    contentLength: base64Content.length,
    pdfSizeBytes: pdfBuffer.byteLength,
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // Clear timeout on successful response
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Document AI API error: ${response.status}`;

      // Log full error response for debugging
      log.error('Document AI API error response', new Error(errorText), {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText.substring(0, 1000), // Truncate for logging
      });

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${errorText}`;
      }

      // For HTTP errors, throw with status for classification
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const result = await response.json() as DocumentAIProcessResponse;

    // Log success metrics
    const processingTime = Date.now() - startTime;
    const pageCount = result.document?.pages?.length || 0;

    log.info('Document AI parsing completed', {
      processingTimeMs: processingTime,
      pageCount,
      textLength: result.document?.text?.length || 0,
    });

    return result;

  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    const err = error instanceof Error ? error : new Error(String(error));

    // Log catch block error for debugging
    log.error('Document AI fetch error', err, {
      errorName: err.name,
      errorType: typeof error,
      isAbortError: err.name === 'AbortError',
    });

    // Handle abort/timeout error (AC-12.2.4)
    if (err.name === 'AbortError') {
      throw new Error(`Document AI request timed out after ${DOCUMENT_AI_TIMEOUT_MS / 1000} seconds`);
    }

    throw error;
  }
}

/**
 * Parse a PDF document with retry logic.
 * AC-12.2.5: 2 retries with exponential backoff (1s, 2s)
 *
 * @param pdfBuffer - PDF document as Uint8Array
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Parsed document response
 */
export async function parseDocumentWithRetry(
  pdfBuffer: Uint8Array,
  maxRetries = 2
): Promise<DocumentAIProcessResponse> {
  const delays = [1000, 2000]; // Exponential backoff delays
  const errors: Error[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await parseDocumentWithDocumentAI(pdfBuffer);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // Log raw error BEFORE classification for debugging
      log.error('Document AI raw error', err, {
        attempt: attempt + 1,
        maxRetries,
        errorName: err.name,
        httpStatus: (err as Error & { status?: number }).status,
      });

      // Classify the error
      const classified = classifyDocumentAIError(err);

      // Check if HTTP status indicates transient error
      const httpStatus = (err as Error & { status?: number }).status;
      const isHttpTransient = httpStatus ? isTransientHttpStatus(httpStatus) : false;

      // Only retry transient errors (AC-12.2.5)
      const shouldRetry = isTransientError(classified.code) || isHttpTransient;

      if (!shouldRetry || attempt === maxRetries) {
        // Non-transient error or final attempt - throw with accumulated error info
        const finalError = new Error(
          `Document AI parsing failed after ${attempt + 1} attempt(s): ${err.message}`
        );
        (finalError as Error & { attempts?: Error[] }).attempts = errors;
        throw finalError;
      }

      // Log retry attempt
      const delay = delays[attempt];
      log.info(`Retry attempt ${attempt + 1}/${maxRetries}`, {
        errorCode: classified.code,
        errorMessage: err.message,
        delayMs: delay,
      });

      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new Error('Unexpected: retry loop completed without return or throw');
}

// ============================================================================
// Story 12.6: Batch Processing for Large Documents
// ============================================================================

/** Threshold for batch processing - documents with more pages use batch mode */
export const BATCH_PROCESSING_PAGE_THRESHOLD = 15;

/** GCS bucket name for batch processing (from environment) */
export function getGcsBucketName(): string {
  const bucket = Deno.env.get('GCS_BUCKET_NAME');
  if (!bucket) {
    throw new Error(
      'GCS_BUCKET_NAME not configured. Set bucket name as Edge Function secret.'
    );
  }
  return bucket;
}

/**
 * Processing mode for Document AI
 * - 'online': Synchronous processing via process endpoint (≤15 pages)
 * - 'batch': Asynchronous processing via batchProcess endpoint (>15 pages)
 */
export type ProcessingMode = 'online' | 'batch';

/**
 * Get page count from a PDF buffer.
 * Uses PDF structure parsing to find /Count in the catalog.
 * AC-12.6.1: Page count detection before processing
 *
 * @param pdfBuffer - PDF document as Uint8Array
 * @returns Number of pages in the PDF, or null if detection fails
 */
export function getPageCount(pdfBuffer: Uint8Array): number | null {
  try {
    // Convert buffer to string for regex searching
    // PDF structure is ASCII-based, so this is safe
    const decoder = new TextDecoder('latin1');
    const pdfContent = decoder.decode(pdfBuffer);

    // Method 1: Look for /Type /Pages followed by /Count N
    // This is the standard way PDFs store page count in the catalog
    const pagesPattern = /\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/;
    const pagesMatch = pdfContent.match(pagesPattern);
    if (pagesMatch && pagesMatch[1]) {
      const count = parseInt(pagesMatch[1], 10);
      if (count > 0 && count < 10000) { // Sanity check
        log.info('Page count detected via /Pages /Count', { pageCount: count });
        return count;
      }
    }

    // Method 2: Look for /Count directly (some PDFs have different structure)
    const countPattern = /\/Count\s+(\d+)/g;
    let maxCount = 0;
    let match;
    while ((match = countPattern.exec(pdfContent)) !== null) {
      const count = parseInt(match[1], 10);
      if (count > maxCount && count < 10000) {
        maxCount = count;
      }
    }
    if (maxCount > 0) {
      log.info('Page count detected via /Count', { pageCount: maxCount });
      return maxCount;
    }

    // Method 3: Count /Type /Page occurrences (individual page objects)
    // Note: This is slower but more reliable for malformed PDFs
    const pageObjPattern = /\/Type\s*\/Page(?!\s*s)/g;
    const pageMatches = pdfContent.match(pageObjPattern);
    if (pageMatches && pageMatches.length > 0) {
      log.info('Page count detected via /Type /Page objects', { pageCount: pageMatches.length });
      return pageMatches.length;
    }

    log.warn('Could not detect page count from PDF structure');
    return null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.warn('Page count detection failed', { error: err.message });
    return null;
  }
}

/**
 * Determine processing mode based on page count.
 * AC-12.6.2: Documents ≤15 pages use online processing
 * AC-12.6.3: Documents >15 pages use batch processing
 *
 * @param pageCount - Number of pages (null defaults to batch for safety)
 * @returns 'online' or 'batch'
 */
export function selectProcessingMode(pageCount: number | null): ProcessingMode {
  // If page count unknown, default to batch (safer for large docs)
  if (pageCount === null) {
    log.info('Page count unknown, defaulting to batch processing');
    return 'batch';
  }

  // Threshold: 15 pages (Document AI imagelessMode limit)
  if (pageCount <= BATCH_PROCESSING_PAGE_THRESHOLD) {
    log.info('Using online processing', { pageCount, threshold: BATCH_PROCESSING_PAGE_THRESHOLD });
    return 'online';
  }

  log.info('Using batch processing', { pageCount, threshold: BATCH_PROCESSING_PAGE_THRESHOLD });
  return 'batch';
}

// ============================================================================
// Story 12.6: GCS Operations for Batch Processing
// ============================================================================

/**
 * Upload a PDF to Google Cloud Storage.
 * AC-12.6.4: Batch processing uploads PDF to GCS bucket
 *
 * @param bucket - GCS bucket name
 * @param objectPath - Path within bucket (e.g., "{documentId}/input.pdf")
 * @param pdfBuffer - PDF content
 * @param accessToken - GCP access token
 * @returns GCS URI (gs://bucket/path)
 */
export async function uploadToGCS(
  bucket: string,
  objectPath: string,
  pdfBuffer: Uint8Array,
  accessToken: string
): Promise<string> {
  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedPath}`;

  log.info('Uploading to GCS', {
    bucket,
    objectPath,
    sizeBytes: pdfBuffer.byteLength,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/pdf',
    },
    body: pdfBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GCS upload failed: ${response.status} - ${errorText}`);
  }

  const gcsUri = `gs://${bucket}/${objectPath}`;
  log.info('GCS upload complete', { gcsUri });
  return gcsUri;
}

/**
 * Download a file from Google Cloud Storage.
 * AC-12.6.6: Batch processing downloads results from GCS
 *
 * @param bucket - GCS bucket name
 * @param objectPath - Path within bucket
 * @param accessToken - GCP access token
 * @returns File content as string (for JSON results)
 */
export async function downloadFromGCS(
  bucket: string,
  objectPath: string,
  accessToken: string
): Promise<string> {
  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}?alt=media`;

  log.info('Downloading from GCS', { bucket, objectPath });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GCS download failed: ${response.status} - ${errorText}`);
  }

  const content = await response.text();
  log.info('GCS download complete', { contentLength: content.length });
  return content;
}

/**
 * Delete a file from Google Cloud Storage.
 * Cleanup after batch processing.
 *
 * @param bucket - GCS bucket name
 * @param objectPath - Path within bucket
 * @param accessToken - GCP access token
 */
export async function deleteFromGCS(
  bucket: string,
  objectPath: string,
  accessToken: string
): Promise<void> {
  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;

  log.info('Deleting from GCS', { bucket, objectPath });

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  // 404 is acceptable - file may already be deleted by lifecycle rule
  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    log.warn('GCS delete failed (non-blocking)', { status: response.status, error: errorText });
  } else {
    log.info('GCS delete complete');
  }
}

/**
 * List objects in a GCS bucket with a prefix.
 * Used to find actual output files from batch processing.
 */
export async function listGCSObjects(
  bucket: string,
  prefix: string,
  accessToken: string
): Promise<string[]> {
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?prefix=${encodeURIComponent(prefix)}`;

  log.info('Listing GCS objects', { bucket, prefix });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GCS list failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const items = result.items || [];
  const objectNames = items.map((item: { name: string }) => item.name);

  log.info('GCS list complete', { count: objectNames.length, objects: objectNames });
  return objectNames;
}

// ============================================================================
// Story 12.6: Batch Processing API
// ============================================================================

/**
 * Batch operation result from Document AI.
 */
export interface BatchOperationResult {
  individualProcessStatuses: Array<{
    inputGcsSource: string;
    status: { code?: number; message?: string };
    outputGcsDestination: string;
  }>;
}

/** Polling configuration for batch operations */
const BATCH_POLL_INTERVAL_MS = 5000; // 5 seconds
const BATCH_MAX_ATTEMPTS = 60; // 5 minutes total

/**
 * Initiate batch processing via Document AI.
 * AC-12.6.3: Documents >15 pages use batch processing
 *
 * @param inputGcsUri - GCS URI of input PDF
 * @param outputGcsUri - GCS URI prefix for output
 * @param accessToken - GCP access token
 * @returns Operation name for polling
 */
export async function batchProcessDocument(
  inputGcsUri: string,
  outputGcsUri: string,
  accessToken: string
): Promise<string> {
  const config = getDocumentAIConfig();
  const endpoint = `https://${config.location}-documentai.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}:batchProcess`;

  const requestBody = {
    inputDocuments: {
      gcsDocuments: {
        documents: [{ gcsUri: inputGcsUri, mimeType: 'application/pdf' }]
      }
    },
    documentOutputConfig: {
      gcsOutputConfig: { gcsUri: outputGcsUri }
    }
  };

  log.info('Initiating batch processing', {
    inputGcsUri,
    outputGcsUri,
    endpoint: endpoint.substring(0, 100),
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Batch process initiation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const operationName = result.name;

  log.info('Batch processing initiated', { operationName });
  return operationName;
}

/**
 * Poll for batch operation completion.
 * AC-12.6.5: Batch processing polls for completion (max 5 minutes)
 *
 * @param operationName - Operation name from batchProcessDocument
 * @param accessToken - GCP access token
 * @param onProgress - Optional callback for progress updates
 * @returns Batch operation result with output location
 */
export async function pollBatchOperation(
  operationName: string,
  accessToken: string,
  onProgress?: (attempt: number, maxAttempts: number) => Promise<void>
): Promise<BatchOperationResult> {
  for (let attempt = 1; attempt <= BATCH_MAX_ATTEMPTS; attempt++) {
    // Use the correct endpoint - operationName includes the full path
    const url = `https://documentai.googleapis.com/v1/${operationName}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch operation poll failed: ${response.status} - ${errorText}`);
    }

    const operation = await response.json();

    // Report progress
    if (onProgress) {
      await onProgress(attempt, BATCH_MAX_ATTEMPTS);
    }

    if (operation.done) {
      // Check for error
      if (operation.error) {
        throw new Error(`Batch processing failed: ${operation.error.message || JSON.stringify(operation.error)}`);
      }

      // Extract result from metadata (NOT response - Google's API puts results in metadata)
      // The response field only contains @type, actual data is in metadata.individualProcessStatuses
      const result = operation.metadata as BatchOperationResult;

      log.info('Batch processing completed', {
        operationName,
        attemptCount: attempt,
        state: (operation.metadata as Record<string, unknown>)?.state,
        outputCount: result.individualProcessStatuses?.length || 0,
        firstStatus: result.individualProcessStatuses?.[0] ? JSON.stringify(result.individualProcessStatuses[0]).substring(0, 500) : 'none',
      });

      // Check individual status
      if (result.individualProcessStatuses?.[0]?.status?.code && result.individualProcessStatuses[0].status.code !== 0) {
        throw new Error(`Batch item failed: ${result.individualProcessStatuses[0].status.message}`);
      }

      return result;
    }

    log.info('Batch processing in progress', {
      operationName,
      attempt,
      maxAttempts: BATCH_MAX_ATTEMPTS,
    });

    await sleep(BATCH_POLL_INTERVAL_MS);
  }

  throw new Error(`Batch processing timed out after ${BATCH_MAX_ATTEMPTS * BATCH_POLL_INTERVAL_MS / 1000} seconds`);
}

/**
 * Parse a large document using batch processing.
 * Combines upload, process, poll, download, and cleanup.
 *
 * @param pdfBuffer - PDF document
 * @param documentId - Document ID for GCS path
 * @param onProgress - Progress callback
 * @returns Document AI response
 */
export async function parseLargeDocumentWithBatch(
  pdfBuffer: Uint8Array,
  documentId: string,
  onProgress?: (stage: 'uploading' | 'processing' | 'downloading', progress: number) => Promise<void>
): Promise<DocumentAIProcessResponse> {
  const startTime = Date.now();

  // Get configuration and auth
  const bucket = getGcsBucketName();
  const serviceAccount = getServiceAccountKey();
  const accessToken = await getAccessToken(serviceAccount);

  // GCS paths
  const inputPath = `${documentId}/input.pdf`;
  const outputPath = `${documentId}/output/`;
  const inputGcsUri = `gs://${bucket}/${inputPath}`;
  const outputGcsUri = `gs://${bucket}/${outputPath}`;

  try {
    // Step 1: Upload to GCS
    if (onProgress) await onProgress('uploading', 0);
    await uploadToGCS(bucket, inputPath, pdfBuffer, accessToken);
    if (onProgress) await onProgress('uploading', 100);

    // Step 2: Initiate batch processing
    if (onProgress) await onProgress('processing', 0);
    const operationName = await batchProcessDocument(inputGcsUri, outputGcsUri, accessToken);

    // Step 3: Poll for completion with progress
    const result = await pollBatchOperation(
      operationName,
      accessToken,
      async (attempt, maxAttempts) => {
        if (onProgress) {
          const progress = Math.round((attempt / maxAttempts) * 100);
          await onProgress('processing', progress);
        }
      }
    );

    // Step 4: Download result
    if (onProgress) await onProgress('downloading', 0);

    // Extract output path from result
    const outputGcsDestination = result.individualProcessStatuses?.[0]?.outputGcsDestination;
    if (!outputGcsDestination) {
      throw new Error('No output destination in batch result');
    }

    log.info('Batch output destination', { outputGcsDestination });

    // Parse GCS URI to get bucket and object path
    // Format: gs://bucket/path/
    const gcsMatch = outputGcsDestination.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!gcsMatch) {
      throw new Error(`Invalid GCS output URI: ${outputGcsDestination}`);
    }

    const outputBucket = gcsMatch[1];
    const outputPrefix = gcsMatch[2];

    // List objects to find the actual output file
    // Document AI output naming varies: could be 0, 0.json, output-0.json, etc.
    const outputObjects = await listGCSObjects(outputBucket, outputPrefix, accessToken);

    if (outputObjects.length === 0) {
      throw new Error(`No output files found at ${outputGcsDestination}`);
    }

    // Find the JSON output file - typically ends with .json or is the first sharded output
    // Prefer files ending in .json, otherwise take the first file
    let outputObjectPath = outputObjects.find(obj => obj.endsWith('.json'));
    if (!outputObjectPath) {
      // Document AI sometimes outputs without .json extension
      outputObjectPath = outputObjects[0];
    }

    log.info('Found output file', { outputObjectPath, allObjects: outputObjects });

    // Download the JSON output
    const resultJson = await downloadFromGCS(outputBucket, outputObjectPath, accessToken);

    if (onProgress) await onProgress('downloading', 100);

    // Parse the result as Document AI response
    const documentResponse = JSON.parse(resultJson) as DocumentAIProcessResponse;

    const processingTime = Date.now() - startTime;
    log.info('Batch parsing completed', {
      documentId,
      processingTimeMs: processingTime,
      pageCount: documentResponse.document?.pages?.length || 0,
    });

    return documentResponse;

  } finally {
    // Cleanup: Delete input file (output files cleaned by lifecycle rule)
    try {
      await deleteFromGCS(bucket, inputPath, accessToken);
    } catch (cleanupError) {
      log.warn('GCS cleanup failed (non-blocking)', {
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      });
    }
  }
}

// ============================================================================
// Story 12.4: Response Parsing - Convert Document AI to DoclingResult
// ============================================================================

/**
 * PageMarker interface for tracking page boundaries in markdown output.
 * Must match the PageMarker interface in index.ts.
 */
interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

/**
 * DoclingResult interface matching the expected output format.
 * Must match DoclingResult in index.ts for compatibility.
 */
interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

/**
 * Extract text for a given text anchor from the full document text.
 * Handles the case where startIndex/endIndex are strings (Document AI API quirk).
 * AC-12.4.1: Extract text using textAnchor.textSegments indices
 */
function extractTextFromAnchor(
  fullText: string,
  textAnchor: DocumentAITextAnchor | undefined
): string {
  if (!textAnchor || !textAnchor.textSegments || textAnchor.textSegments.length === 0) {
    return '';
  }

  let result = '';
  for (const segment of textAnchor.textSegments) {
    // Document AI returns indices as strings - must parseInt
    const startIndex = segment.startIndex ? parseInt(String(segment.startIndex), 10) : 0;
    const endIndex = segment.endIndex ? parseInt(String(segment.endIndex), 10) : fullText.length;
    result += fullText.slice(startIndex, endIndex);
  }
  return result;
}

/**
 * Get the start and end indices for a page from Document AI response.
 * Returns [startIndex, endIndex] in the original document text.
 */
function getPageTextBounds(
  page: DocumentAIPage,
  fullTextLength: number
): [number, number] {
  if (!page.layout?.textAnchor?.textSegments?.length) {
    return [0, fullTextLength];
  }

  const segments = page.layout.textAnchor.textSegments;
  let minStart = fullTextLength;
  let maxEnd = 0;

  for (const segment of segments) {
    const start = segment.startIndex ? parseInt(String(segment.startIndex), 10) : 0;
    const end = segment.endIndex ? parseInt(String(segment.endIndex), 10) : fullTextLength;
    minStart = Math.min(minStart, start);
    maxEnd = Math.max(maxEnd, end);
  }

  return [minStart, maxEnd];
}

/**
 * Format a Document AI table as markdown.
 * AC-12.4.4: Tables converted to markdown format with | pipes
 */
function formatTableAsMarkdown(
  table: DocumentAITable,
  fullText: string
): string {
  const rows: string[][] = [];

  // Extract header rows
  if (table.headerRows) {
    for (const row of table.headerRows) {
      const cells = row.cells.map((cell) => {
        const text = extractTextFromAnchor(fullText, cell.layout?.textAnchor);
        return text.trim().replace(/\n/g, ' ').replace(/\|/g, '\\|');
      });
      rows.push(cells);
    }
  }

  // Extract body rows
  if (table.bodyRows) {
    for (const row of table.bodyRows) {
      const cells = row.cells.map((cell) => {
        const text = extractTextFromAnchor(fullText, cell.layout?.textAnchor);
        return text.trim().replace(/\n/g, ' ').replace(/\|/g, '\\|');
      });
      rows.push(cells);
    }
  }

  if (rows.length === 0) {
    return '';
  }

  // Determine column count from max row length
  const colCount = Math.max(...rows.map((r) => r.length));

  // Pad rows to have consistent column count
  const paddedRows = rows.map((row) => {
    while (row.length < colCount) {
      row.push('');
    }
    return row;
  });

  // Build markdown table
  const lines: string[] = [];

  // First row (header or first data row)
  lines.push('| ' + paddedRows[0].join(' | ') + ' |');

  // Separator after first row (AC-12.4.4: |---|---| separator)
  lines.push('|' + paddedRows[0].map(() => '---').join('|') + '|');

  // Remaining rows
  for (let i = 1; i < paddedRows.length; i++) {
    lines.push('| ' + paddedRows[i].join(' | ') + ' |');
  }

  return lines.join('\n');
}

/**
 * Normalize whitespace in text while preserving paragraph structure.
 * AC-12.4.2: Paragraph breaks preserved as double newlines
 * Task 5: Normalize whitespace
 */
function normalizeWhitespace(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse more than 2 consecutive newlines to exactly 2 (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces to single space
    .replace(/[ \t]+/g, ' ')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Convert Document AI API response to DoclingResult format.
 *
 * Story 12.4: Response Parsing
 * AC-12.4.1: Document AI text extracted with page boundaries
 * AC-12.4.2: Markdown output compatible with existing chunker
 * AC-12.4.3: Page markers format: --- PAGE X --- preserved
 * AC-12.4.4: Tables converted to markdown table format
 * AC-12.4.5: Page count accurately reported
 *
 * @param response - Document AI API ProcessResponse
 * @returns DoclingResult with markdown, pageMarkers, and pageCount
 */
export function convertDocumentAIToDoclingResult(
  response: DocumentAIProcessResponse
): DoclingResult {
  // Handle empty/null document
  if (!response?.document || !response.document.pages || response.document.pages.length === 0) {
    return {
      markdown: '',
      pageMarkers: [],
      pageCount: 0,
    };
  }

  const { document } = response;
  const fullText = document.text || '';
  const pages = document.pages;
  const pageCount = pages.length;

  // Sort pages by pageNumber to ensure correct order
  const sortedPages = [...pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

  // Build markdown with page markers and track page positions
  const markdownParts: string[] = [];
  const pageMarkers: PageMarker[] = [];
  let currentPosition = 0;

  for (let i = 0; i < sortedPages.length; i++) {
    const page = sortedPages[i];
    const pageNumber = page.pageNumber || (i + 1);

    // Get text bounds for this page
    const [pageStart, pageEnd] = getPageTextBounds(page, fullText.length);
    let pageText = fullText.slice(pageStart, pageEnd);

    // Check if page has tables and format them
    if (page.tables && page.tables.length > 0) {
      // For each table, replace its text region with formatted markdown table
      // Sort tables by their position in the text (descending) to replace from end to start
      const tablesWithPositions = page.tables
        .map((table) => {
          const [tStart, tEnd] = getPageTextBounds(
            { layout: table.layout } as DocumentAIPage,
            fullText.length
          );
          return { table, start: tStart - pageStart, end: tEnd - pageStart };
        })
        .filter((t) => t.start >= 0 && t.end <= pageText.length)
        .sort((a, b) => b.start - a.start); // Descending order

      for (const { table, start, end } of tablesWithPositions) {
        const markdownTable = formatTableAsMarkdown(table, fullText);
        if (markdownTable) {
          pageText = pageText.slice(0, start) + '\n\n' + markdownTable + '\n\n' + pageText.slice(end);
        }
      }
    }

    // Normalize whitespace for this page
    pageText = normalizeWhitespace(pageText);

    // Record start position for this page
    const pageStartIndex = currentPosition;

    // AC-12.4.3: First page has no marker prefix - content starts immediately
    // Subsequent pages get --- PAGE X --- marker
    if (i > 0) {
      // Add page marker for pages after the first
      const marker = `\n\n--- PAGE ${pageNumber} ---\n\n`;
      markdownParts.push(marker);
      currentPosition += marker.length;
    }

    // Add page content
    markdownParts.push(pageText);
    currentPosition += pageText.length;

    // Record page marker with indices in final markdown
    pageMarkers.push({
      pageNumber,
      startIndex: pageStartIndex,
      endIndex: currentPosition,
    });
  }

  // Combine all parts into final markdown
  let markdown = markdownParts.join('');

  // Final cleanup
  markdown = normalizeWhitespace(markdown);

  // Recalculate page markers after final normalization
  // Since normalization might slightly change positions, we recalculate
  const finalPageMarkers: PageMarker[] = [];
  let searchStart = 0;

  for (let i = 0; i < sortedPages.length; i++) {
    const pageNumber = sortedPages[i].pageNumber || (i + 1);

    let pageStartIndex: number;
    let pageEndIndex: number;

    if (i === 0) {
      // First page starts at 0
      pageStartIndex = 0;

      // Find where next page marker starts (or end of document)
      if (sortedPages.length > 1) {
        const nextPageNum = sortedPages[1].pageNumber || 2;
        const nextMarker = `--- PAGE ${nextPageNum} ---`;
        const nextMarkerIdx = markdown.indexOf(nextMarker, searchStart);
        // End just before the newlines preceding the marker
        pageEndIndex = nextMarkerIdx > 0 ? nextMarkerIdx - 2 : markdown.length;
      } else {
        pageEndIndex = markdown.length;
      }
    } else {
      // Subsequent pages: find the marker
      const marker = `--- PAGE ${pageNumber} ---`;
      const markerIdx = markdown.indexOf(marker, searchStart);

      if (markerIdx >= 0) {
        // Page starts at the marker (including leading newlines)
        pageStartIndex = markerIdx > 0 ? markerIdx - 2 : markerIdx; // Include \n\n before marker

        // Find next page marker or end of document
        const nextPageIdx = i + 1;
        if (nextPageIdx < sortedPages.length) {
          const nextPageNum = sortedPages[nextPageIdx].pageNumber || (nextPageIdx + 1);
          const nextMarker = `--- PAGE ${nextPageNum} ---`;
          const nextMarkerIdx = markdown.indexOf(nextMarker, markerIdx + marker.length);
          pageEndIndex = nextMarkerIdx > 0 ? nextMarkerIdx - 2 : markdown.length;
        } else {
          pageEndIndex = markdown.length;
        }

        searchStart = markerIdx + marker.length;
      } else {
        // Marker not found - shouldn't happen, but handle gracefully
        pageStartIndex = searchStart;
        pageEndIndex = markdown.length;
      }
    }

    finalPageMarkers.push({
      pageNumber,
      startIndex: pageStartIndex,
      endIndex: pageEndIndex,
    });
  }

  // AC-12.4.5: Verify page markers are contiguous (for validation)
  // Adjust indices to be truly contiguous
  for (let i = 1; i < finalPageMarkers.length; i++) {
    // Each page starts where the previous one ends
    finalPageMarkers[i].startIndex = finalPageMarkers[i - 1].endIndex;
  }

  // Ensure last page ends at document end
  if (finalPageMarkers.length > 0) {
    finalPageMarkers[finalPageMarkers.length - 1].endIndex = markdown.length;
  }

  return {
    markdown,
    pageMarkers: finalPageMarkers,
    pageCount,
  };
}
