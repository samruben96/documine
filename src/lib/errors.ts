/**
 * Custom application error classes with typed error codes.
 * @module @/lib/errors
 */

/** Union type of all application error codes for type safety */
export type ErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'PROCESSING_ERROR'
  | 'VALIDATION_ERROR'
  | 'EMBEDDING_ERROR'
  | 'CHAT_ERROR'
  | 'EXTRACTION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'TIMEOUT_ERROR';

/**
 * Error thrown when a requested document cannot be found.
 */
export class DocumentNotFoundError extends Error {
  readonly code = 'DOCUMENT_NOT_FOUND' as const;

  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * Error thrown when a user lacks authorization for an action.
 */
export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED' as const;

  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error thrown when document or data processing fails.
 */
export class ProcessingError extends Error {
  readonly code = 'PROCESSING_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ProcessingError';
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when OpenAI embedding generation fails.
 */
export class EmbeddingError extends Error {
  readonly code = 'EMBEDDING_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * Error thrown when chat operations fail.
 */
export class ChatError extends Error {
  readonly code = 'CHAT_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * Error thrown when OpenAI rate limit is exceeded.
 */
export class RateLimitError extends Error {
  readonly code = 'RATE_LIMIT_ERROR' as const;

  constructor(message = 'Too many requests. Please wait a moment.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when request times out.
 */
export class TimeoutError extends Error {
  readonly code = 'TIMEOUT_ERROR' as const;

  constructor(message = "I'm having trouble processing that. Please try again.") {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when quote extraction fails.
 * Story 7.2: AI-powered quote data extraction errors.
 */
export class ExtractionError extends Error {
  readonly code = 'EXTRACTION_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}
