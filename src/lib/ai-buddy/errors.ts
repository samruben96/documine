/**
 * AI Buddy Error Codes and Helpers
 * Story 14.2: API Route Structure
 *
 * Consistent error handling for AI Buddy API routes.
 * Error codes follow AIB_XXX pattern per tech-spec section 5.2.
 */

import { NextResponse } from 'next/server';
import type { AiBuddyApiError, AiBuddyApiResponse } from '@/types/ai-buddy';

/**
 * AI Buddy error codes with HTTP status mappings
 */
export const AIB_ERROR_CODES = {
  AIB_001: { status: 401, message: 'Unauthorized - not authenticated' },
  AIB_002: { status: 403, message: 'Forbidden - insufficient permissions' },
  AIB_003: { status: 429, message: 'Rate limit exceeded' },
  AIB_004: { status: 400, message: 'Invalid request body' },
  AIB_005: { status: 404, message: 'Resource not found' },
  AIB_006: { status: 500, message: 'Internal server error' },
  AIB_007: { status: 503, message: 'AI service unavailable' },
  AIB_NOT_IMPLEMENTED: { status: 501, message: 'Not implemented' },
  // Project-specific error codes (Story 16.1)
  AIB_101: { status: 400, message: 'Project name is required' },
  AIB_102: { status: 400, message: 'Project name exceeds 100 characters' },
  AIB_103: { status: 400, message: 'Project description exceeds 500 characters' },
} as const;

export type AiBuddyErrorCode = keyof typeof AIB_ERROR_CODES;

/**
 * Create an AiBuddyApiError object
 */
export function createError(
  code: AiBuddyErrorCode,
  message?: string,
  details?: unknown
): AiBuddyApiError {
  return {
    code,
    message: message ?? AIB_ERROR_CODES[code].message,
    details,
  };
}

/**
 * Create a success response in standard AI Buddy format
 */
export function successResponse<T>(data: T): AiBuddyApiResponse<T> {
  return {
    data,
    error: null,
  };
}

/**
 * Create an error response in standard AI Buddy format
 */
export function errorResponse(
  code: AiBuddyErrorCode,
  message?: string,
  details?: unknown
): AiBuddyApiResponse<null> {
  return {
    data: null,
    error: createError(code, message, details),
  };
}

/**
 * Create a NextResponse with standard AI Buddy error format
 */
export function aiBuddyErrorResponse(
  code: AiBuddyErrorCode,
  message?: string,
  details?: unknown
): NextResponse {
  const { status } = AIB_ERROR_CODES[code];
  return NextResponse.json(errorResponse(code, message, details), { status });
}

/**
 * Create a NextResponse with standard AI Buddy success format
 */
export function aiBuddySuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(successResponse(data), { status });
}

/**
 * Create a "not implemented" response for stub routes
 */
export function notImplementedResponse(): NextResponse {
  return aiBuddyErrorResponse('AIB_NOT_IMPLEMENTED');
}
