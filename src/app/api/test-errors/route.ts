import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { log } from '@/lib/utils/logger';
import {
  DocumentNotFoundError,
  UnauthorizedError,
  ProcessingError,
  ValidationError,
} from '@/lib/errors';

/**
 * Test endpoint demonstrating error handling and response patterns.
 * GET /api/test-errors - Returns sample success response
 */
export async function GET() {
  log.info('Test endpoint called', { method: 'GET' });

  return successResponse({
    message: 'Error handling test endpoint',
    availableTypes: ['not_found', 'unauthorized', 'processing', 'validation', 'success'],
    usage: 'POST /api/test-errors?type=<type>',
  });
}

/**
 * Test endpoint for triggering different error types.
 * POST /api/test-errors?type=<error_type>
 *
 * @param type - Error type to trigger:
 *   - not_found: DocumentNotFoundError
 *   - unauthorized: UnauthorizedError
 *   - processing: ProcessingError
 *   - validation: ValidationError
 *   - success: Sample success response
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  log.info('Test error endpoint called', { method: 'POST', type });

  try {
    switch (type) {
      case 'not_found': {
        const error = new DocumentNotFoundError('test-doc-123');
        log.warn('Simulating document not found error', { documentId: 'test-doc-123' });
        throw error;
      }

      case 'unauthorized': {
        const error = new UnauthorizedError('User does not have access to this resource');
        log.warn('Simulating unauthorized error');
        throw error;
      }

      case 'processing': {
        const error = new ProcessingError('Failed to parse document content');
        log.warn('Simulating processing error');
        throw error;
      }

      case 'validation': {
        const error = new ValidationError('Invalid document format: expected PDF');
        log.warn('Simulating validation error', { expectedFormat: 'PDF' });
        throw error;
      }

      case 'success':
        log.info('Returning success response');
        return successResponse({
          id: 'test-123',
          status: 'processed',
          timestamp: new Date().toISOString(),
        });

      default:
        return errorResponse(
          'INVALID_TYPE',
          `Invalid error type: ${type}. Use: not_found, unauthorized, processing, validation, or success`,
          400
        );
    }
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      log.error('Document not found', error);
      return errorResponse(error.code, error.message, 404);
    }

    if (error instanceof UnauthorizedError) {
      log.error('Unauthorized access', error);
      return errorResponse(error.code, error.message, 401);
    }

    if (error instanceof ProcessingError) {
      log.error('Processing failed', error);
      return errorResponse(error.code, error.message, 422);
    }

    if (error instanceof ValidationError) {
      log.error('Validation failed', error);
      return errorResponse(error.code, error.message, 400);
    }

    // Unexpected error - log full details but return generic message
    const unexpectedError = error instanceof Error ? error : new Error('Unknown error');
    log.error('Unexpected error in test endpoint', unexpectedError);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
