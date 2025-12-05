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
