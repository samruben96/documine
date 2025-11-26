/**
 * API response helpers for consistent response formatting.
 * @module @/lib/utils/api-response
 */

/**
 * Standard error object structure for API responses.
 */
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Standard API response type - either success or error, never both.
 */
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError };

/**
 * Creates a successful JSON Response with the provided data.
 *
 * @param data - The data to include in the response
 * @returns Response with 200 status and { data, error: null } body
 *
 * @example
 * ```ts
 * return successResponse({ id: 1, name: 'Document' });
 * // Returns: { data: { id: 1, name: 'Document' }, error: null }
 * ```
 */
export function successResponse<T>(data: T): Response {
  return Response.json({ data, error: null } satisfies ApiResponse<T>, {
    status: 200,
  });
}

/**
 * Creates an error JSON Response with the provided error details.
 *
 * @param code - Error code (e.g., 'DOCUMENT_NOT_FOUND')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error context
 * @returns Response with specified status and { data: null, error } body
 *
 * @example
 * ```ts
 * return errorResponse('NOT_FOUND', 'Document not found', 404);
 * // Returns: { data: null, error: { code: 'NOT_FOUND', message: 'Document not found' } }
 * ```
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: unknown
): Response {
  const error: ApiError = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return Response.json({ data: null, error } satisfies ApiResponse<never>, {
    status,
  });
}
