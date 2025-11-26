/**
 * Custom application error classes with typed error codes.
 * @module @/lib/errors
 */

/** Union type of all application error codes for type safety */
export type ErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'PROCESSING_ERROR'
  | 'VALIDATION_ERROR';

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
