/**
 * Story 11.5: Error Classification Service
 *
 * Classifies processing errors into categories for appropriate
 * user messaging and retry behavior.
 *
 * AC-11.5.1: Error Categorization (transient, recoverable, permanent)
 * AC-11.5.2: User-friendly messages with suggested actions
 */

/**
 * Error category determines retry behavior and user messaging:
 * - transient: Automatic retry (infrastructure issues)
 * - recoverable: User action needed (file format issues)
 * - permanent: Needs support (unrecoverable errors)
 */
export type ErrorCategory = 'transient' | 'recoverable' | 'permanent';

/**
 * Classified error with user-facing information
 */
export interface ClassifiedError {
  /** Error category for retry behavior */
  category: ErrorCategory;
  /** Machine-readable error code */
  code: string;
  /** Original technical error message (for logging) */
  message: string;
  /** User-friendly message (non-technical) */
  userMessage: string;
  /** Suggested action for user (null if none needed) */
  suggestedAction: string | null;
  /** Whether this error should trigger automatic retry */
  shouldAutoRetry: boolean;
}

/**
 * Error mapping entry (all required fields except message)
 */
interface ErrorMapping {
  category: ErrorCategory;
  code: string;
  userMessage: string;
  suggestedAction: string | null;
  shouldAutoRetry: boolean;
}

/**
 * Error mappings organized by category and code
 */
const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // ============================================================================
  // TRANSIENT ERRORS - Automatic retry, infrastructure issues
  // ============================================================================
  'TIMEOUT': {
    category: 'transient',
    code: 'TIMEOUT',
    userMessage: 'Processing timed out.',
    suggestedAction: null, // Will auto-retry
    shouldAutoRetry: true,
  },
  'RATE_LIMIT': {
    category: 'transient',
    code: 'RATE_LIMIT',
    userMessage: 'Service is busy.',
    suggestedAction: null,
    shouldAutoRetry: true,
  },
  'CONNECTION_ERROR': {
    category: 'transient',
    code: 'CONNECTION_ERROR',
    userMessage: 'Connection interrupted.',
    suggestedAction: null,
    shouldAutoRetry: true,
  },
  'SERVICE_UNAVAILABLE': {
    category: 'transient',
    code: 'SERVICE_UNAVAILABLE',
    userMessage: 'Service temporarily unavailable.',
    suggestedAction: null,
    shouldAutoRetry: true,
  },

  // ============================================================================
  // RECOVERABLE ERRORS - User action needed, document issues
  // ============================================================================
  'PDF_FORMAT_ERROR': {
    category: 'recoverable',
    code: 'PDF_FORMAT_ERROR',
    userMessage: 'This PDF has an unusual format that we cannot process.',
    suggestedAction: 'Try re-saving the PDF using Adobe Acrobat or a PDF converter.',
    shouldAutoRetry: false,
  },
  'PASSWORD_PROTECTED': {
    category: 'recoverable',
    code: 'PASSWORD_PROTECTED',
    userMessage: 'This PDF is password protected.',
    suggestedAction: 'Please upload an unlocked version of the document.',
    shouldAutoRetry: false,
  },
  'UNSUPPORTED_FORMAT': {
    category: 'recoverable',
    code: 'UNSUPPORTED_FORMAT',
    userMessage: 'File format not supported.',
    suggestedAction: 'Please upload a PDF, DOCX, or image file.',
    shouldAutoRetry: false,
  },
  'FILE_CORRUPTED': {
    category: 'recoverable',
    code: 'FILE_CORRUPTED',
    userMessage: 'File appears to be corrupted.',
    suggestedAction: 'Try downloading the file again and re-uploading.',
    shouldAutoRetry: false,
  },
  'FILE_TOO_LARGE': {
    category: 'recoverable',
    code: 'FILE_TOO_LARGE',
    userMessage: 'File is too large to process.',
    suggestedAction: 'Try splitting the document into smaller files.',
    shouldAutoRetry: false,
  },
  'EMPTY_DOCUMENT': {
    category: 'recoverable',
    code: 'EMPTY_DOCUMENT',
    userMessage: 'Document appears to be empty.',
    suggestedAction: 'Please upload a document with content.',
    shouldAutoRetry: false,
  },

  // ============================================================================
  // PERMANENT ERRORS - Needs support, unrecoverable
  // ============================================================================
  'UNKNOWN': {
    category: 'permanent',
    code: 'UNKNOWN',
    userMessage: 'An unexpected error occurred.',
    suggestedAction: 'Please contact support with error ID: {errorId}',
    shouldAutoRetry: false,
  },
  'MAX_RETRIES_EXCEEDED': {
    category: 'permanent',
    code: 'MAX_RETRIES_EXCEEDED',
    userMessage: 'Processing failed after multiple attempts.',
    suggestedAction: 'Please contact support for assistance.',
    shouldAutoRetry: false,
  },
};

/**
 * Pattern matchers for error classification
 * Order matters: more specific patterns should come first
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  // Transient errors
  { pattern: /timeout|timed?\s*out/i, code: 'TIMEOUT' },
  { pattern: /429|rate.?limit|too many requests/i, code: 'RATE_LIMIT' },
  { pattern: /ECONNRESET|ECONNREFUSED|network|connection/i, code: 'CONNECTION_ERROR' },
  { pattern: /503|service unavailable|temporarily unavailable/i, code: 'SERVICE_UNAVAILABLE' },

  // Recoverable errors - PDF specific
  { pattern: /page-dimensions|MediaBox|libpdfium|CropBox/i, code: 'PDF_FORMAT_ERROR' },
  { pattern: /password/i, code: 'PASSWORD_PROTECTED' },
  { pattern: /unsupported.*format|invalid.*file|not supported/i, code: 'UNSUPPORTED_FORMAT' },
  { pattern: /corrupt|corrupted|damaged|malformed/i, code: 'FILE_CORRUPTED' },
  { pattern: /too.?large|size.?exceeded|maximum.*size/i, code: 'FILE_TOO_LARGE' },
  { pattern: /empty|no content|no text/i, code: 'EMPTY_DOCUMENT' },

  // Permanent errors
  { pattern: /max.*retr|retries?\s*exceeded/i, code: 'MAX_RETRIES_EXCEEDED' },
];

/**
 * Classify an error message into a structured error object
 *
 * AC-11.5.1: Classify errors into transient, recoverable, permanent categories
 * AC-11.5.2: Generate user-friendly messages with suggested actions
 *
 * @param errorMessage - The technical error message to classify
 * @returns ClassifiedError with category, user message, and suggested action
 */
export function classifyError(errorMessage: string): ClassifiedError {
  // Find matching pattern
  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      const mapping = ERROR_MAPPINGS[code];
      if (mapping) {
        return {
          category: mapping.category,
          code: mapping.code,
          message: errorMessage,
          userMessage: mapping.userMessage,
          suggestedAction: mapping.suggestedAction,
          shouldAutoRetry: mapping.shouldAutoRetry,
        };
      }
    }
  }

  // Default to unknown error - fallback inline if mapping missing
  return {
    category: 'permanent' as ErrorCategory,
    code: 'UNKNOWN',
    message: errorMessage,
    userMessage: 'An unexpected error occurred.',
    suggestedAction: 'Please contact support.',
    shouldAutoRetry: false,
  };
}

/**
 * Get user-friendly message for an error
 * Convenience function when you only need the user message
 *
 * @param errorMessage - The technical error message
 * @returns User-friendly message string
 */
export function getErrorUserMessage(errorMessage: string): string {
  const classified = classifyError(errorMessage);
  return classified.userMessage;
}

/**
 * Get suggested action for an error
 * Convenience function when you only need the suggested action
 *
 * @param errorMessage - The technical error message
 * @param errorId - Optional error ID to include in support messages
 * @returns Suggested action string or null
 */
export function getErrorSuggestedAction(
  errorMessage: string,
  errorId?: string
): string | null {
  const classified = classifyError(errorMessage);
  if (!classified.suggestedAction) return null;

  // Replace placeholder with actual error ID
  return classified.suggestedAction.replace(
    '{errorId}',
    errorId?.slice(0, 8) || 'unknown'
  );
}

/**
 * Check if an error should trigger automatic retry
 *
 * @param errorMessage - The technical error message
 * @returns true if the error is transient and should be auto-retried
 */
export function shouldAutoRetry(errorMessage: string): boolean {
  const classified = classifyError(errorMessage);
  return classified.shouldAutoRetry;
}

/**
 * Get error category from error message
 * Convenience function for categorization only
 *
 * @param errorMessage - The technical error message
 * @returns Error category
 */
export function getErrorCategory(errorMessage: string): ErrorCategory {
  const classified = classifyError(errorMessage);
  return classified.category;
}
