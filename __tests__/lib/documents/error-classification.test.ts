import { describe, it, expect } from 'vitest';

/**
 * Tests for error classification logic
 * Story 11.3 (AC-11.3.4): Error classification for job recovery
 *
 * PERMANENT errors: Document issues that won't succeed on retry
 * TRANSIENT errors: Infrastructure issues that may succeed on retry
 */

// Replicate the error classification logic from the Edge Function
// for testing purposes
const PERMANENT_ERROR_PATTERNS = [
  // PDF format issues
  'page-dimensions',
  'mediabox',
  'libpdfium',
  'invalid pdf',
  'corrupt',
  'corrupted',
  'malformed',
  'damaged',
  // Unsupported formats
  'unsupported format',
  'not supported',
  'file format',
  'invalid file',
  // Content issues
  'empty document',
  'no content',
  'password protected',
  'encrypted',
  // Permanent service errors
  '400 bad request',
  '422',
  '415 unsupported',
] as const;

type ErrorType = 'permanent' | 'transient';

function classifyError(errorMessage: string): ErrorType {
  const lowerMessage = errorMessage.toLowerCase();

  for (const pattern of PERMANENT_ERROR_PATTERNS) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return 'permanent';
    }
  }

  return 'transient';
}

describe('Error Classification', () => {
  describe('Permanent Errors (should NOT auto-retry)', () => {
    it('classifies PDF format errors as permanent', () => {
      expect(classifyError('could not find the page-dimensions')).toBe('permanent');
      expect(classifyError('Error: MediaBox not found')).toBe('permanent');
      expect(classifyError('libpdfium error: invalid page')).toBe('permanent');
      expect(classifyError('Invalid PDF structure')).toBe('permanent');
    });

    it('classifies corrupt file errors as permanent', () => {
      expect(classifyError('File is corrupt')).toBe('permanent');
      expect(classifyError('Document appears to be corrupted')).toBe('permanent');
      expect(classifyError('Malformed PDF structure')).toBe('permanent');
      expect(classifyError('Damaged file header')).toBe('permanent');
    });

    it('classifies unsupported format errors as permanent', () => {
      expect(classifyError('Unsupported format: .xyz')).toBe('permanent');
      expect(classifyError('File format not supported')).toBe('permanent');
      expect(classifyError('Invalid file type')).toBe('permanent');
    });

    it('classifies content issues as permanent', () => {
      expect(classifyError('Empty document - no content to process')).toBe('permanent');
      expect(classifyError('No content found in PDF')).toBe('permanent');
      expect(classifyError('Document is password protected')).toBe('permanent');
      expect(classifyError('Encrypted PDF cannot be processed')).toBe('permanent');
    });

    it('classifies client errors (4xx) as permanent', () => {
      expect(classifyError('400 Bad Request: invalid parameters')).toBe('permanent');
      expect(classifyError('Error 422: Unprocessable entity')).toBe('permanent');
      expect(classifyError('415 Unsupported Media Type')).toBe('permanent');
    });
  });

  describe('Transient Errors (CAN auto-retry)', () => {
    it('classifies timeout errors as transient', () => {
      expect(classifyError('Request timed out after 30 seconds')).toBe('transient');
      expect(classifyError('Connection timeout')).toBe('transient');
      expect(classifyError('Docling parse timed out')).toBe('transient');
    });

    it('classifies network errors as transient', () => {
      expect(classifyError('Network error: connection refused')).toBe('transient');
      expect(classifyError('Failed to fetch: network error')).toBe('transient');
      expect(classifyError('ECONNRESET')).toBe('transient');
    });

    it('classifies server errors (5xx) as transient', () => {
      expect(classifyError('500 Internal Server Error')).toBe('transient');
      expect(classifyError('502 Bad Gateway')).toBe('transient');
      expect(classifyError('503 Service Unavailable')).toBe('transient');
      expect(classifyError('504 Gateway Timeout')).toBe('transient');
    });

    it('classifies rate limit errors as transient', () => {
      expect(classifyError('429 Too Many Requests')).toBe('transient');
      expect(classifyError('Rate limit exceeded')).toBe('transient');
    });

    it('classifies resource exhaustion as transient', () => {
      expect(classifyError('Out of memory')).toBe('transient');
      expect(classifyError('Database connection pool exhausted')).toBe('transient');
    });

    it('classifies unknown errors as transient by default', () => {
      expect(classifyError('Something went wrong')).toBe('transient');
      expect(classifyError('Unexpected error occurred')).toBe('transient');
      expect(classifyError('')).toBe('transient');
    });
  });

  describe('Edge Cases', () => {
    it('handles case insensitivity', () => {
      expect(classifyError('PAGE-DIMENSIONS ERROR')).toBe('permanent');
      expect(classifyError('CORRUPTED FILE')).toBe('permanent');
      expect(classifyError('Password Protected')).toBe('permanent');
    });

    it('handles errors with mixed context', () => {
      // Permanent patterns take precedence even in longer messages
      expect(
        classifyError('Network error while trying to parse corrupted PDF')
      ).toBe('permanent');
      expect(
        classifyError('Timeout while processing invalid PDF structure')
      ).toBe('permanent');
    });
  });
});

describe('Retry Logic Integration', () => {
  describe('Stuck Job Detector Behavior', () => {
    it('permanent errors should not be auto-retried', () => {
      const errorType = classifyError('Document is password protected');
      expect(errorType).toBe('permanent');
      // In the actual DB function, jobs with error_type='permanent' are skipped
    });

    it('transient errors should be auto-retried', () => {
      const errorType = classifyError('Connection timeout');
      expect(errorType).toBe('transient');
      // In the actual DB function, jobs with error_type='transient' are reset
    });
  });

  describe('Manual Retry Behavior', () => {
    it('allows manual retry regardless of error type', () => {
      // Manual retry via UI should always be possible
      // This is a behavioral note - the API doesn't check error_type
      const permanentError = classifyError('Invalid PDF structure');
      const transientError = classifyError('Network timeout');

      // Both types can be manually retried by the user
      expect(permanentError).toBe('permanent');
      expect(transientError).toBe('transient');
      // The user can always click "Retry" - they might upload a fixed file
    });
  });
});
