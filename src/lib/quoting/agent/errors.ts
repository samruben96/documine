/**
 * Quote Agent Error Handling
 * Epic Q8: Stagehand POC & Recipe Foundation
 *
 * Error categorization and mapping for AI agent adapters.
 * This module is adapter-agnostic and will be reused by StagehandAdapter.
 */

import type { QuoteError } from '@/types/quoting/agent';

/**
 * QuoteAgentError - Custom error class for agent operations
 * AC-Q6.2-6: Wraps errors with QuoteError structure
 */
export class QuoteAgentError extends Error {
  readonly code: QuoteError['code'];
  readonly carrierCode: string;
  readonly recoverable: boolean;
  readonly suggestedAction?: string;

  constructor(
    code: QuoteError['code'],
    message: string,
    carrierCode: string,
    options?: {
      recoverable?: boolean;
      suggestedAction?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'QuoteAgentError';
    this.code = code;
    this.carrierCode = carrierCode;
    this.recoverable =
      options?.recoverable ?? isRecoverableErrorCode(code);
    this.suggestedAction =
      options?.suggestedAction ?? getSuggestedAction(code);
  }

  /**
   * Convert to QuoteError interface for API responses
   */
  toQuoteError(): QuoteError {
    return {
      code: this.code,
      message: this.message,
      carrierCode: this.carrierCode,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
    };
  }
}

/**
 * Check if error code is recoverable
 * AC-Q6.2-7: Only TIMEOUT and PORTAL_UNAVAILABLE should be retried
 */
export function isRecoverableErrorCode(code: QuoteError['code']): boolean {
  return code === 'TIMEOUT' || code === 'PORTAL_UNAVAILABLE';
}

/**
 * Get suggested user action for error code
 * AC-Q6.2-6: User-friendly guidance
 */
export function getSuggestedAction(code: QuoteError['code']): string {
  switch (code) {
    case 'CREDENTIALS_INVALID':
      return 'Please verify your carrier portal credentials and try again.';
    case 'CAPTCHA_FAILED':
      return 'CAPTCHA verification failed. Please try again and complete the CAPTCHA when prompted.';
    case 'PORTAL_UNAVAILABLE':
      return 'The carrier portal is temporarily unavailable. Please try again later.';
    case 'FORM_CHANGED':
      return 'The carrier portal has been updated. Our team has been notified and will update the automation.';
    case 'TIMEOUT':
      return 'The request took too long. Please try again.';
    case 'UNKNOWN':
    default:
      return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }
}

/**
 * Map error string to QuoteError
 * Categorizes various error conditions from any agent adapter
 */
export function mapErrorToQuoteError(
  error: string,
  carrierCode: string
): QuoteError {
  const errorLower = error.toLowerCase();

  // Authentication errors
  if (
    errorLower.includes('authentication') ||
    errorLower.includes('login failed') ||
    errorLower.includes('invalid credentials') ||
    errorLower.includes('password') ||
    errorLower.includes('unauthorized')
  ) {
    return {
      code: 'CREDENTIALS_INVALID',
      message: 'Login to carrier portal failed. Please check your credentials.',
      carrierCode,
      recoverable: false,
      suggestedAction: getSuggestedAction('CREDENTIALS_INVALID'),
    };
  }

  // CAPTCHA errors
  if (
    errorLower.includes('captcha') ||
    errorLower.includes('recaptcha') ||
    errorLower.includes('hcaptcha')
  ) {
    return {
      code: 'CAPTCHA_FAILED',
      message: 'CAPTCHA verification was required but could not be completed.',
      carrierCode,
      recoverable: false,
      suggestedAction: getSuggestedAction('CAPTCHA_FAILED'),
    };
  }

  // Portal unavailable
  if (
    errorLower.includes('unavailable') ||
    errorLower.includes('connection') ||
    errorLower.includes('network') ||
    errorLower.includes('503') ||
    errorLower.includes('502') ||
    errorLower.includes('site down')
  ) {
    return {
      code: 'PORTAL_UNAVAILABLE',
      message: 'Carrier portal is currently unavailable.',
      carrierCode,
      recoverable: true,
      suggestedAction: getSuggestedAction('PORTAL_UNAVAILABLE'),
    };
  }

  // Form/navigation errors
  if (
    errorLower.includes('element not found') ||
    errorLower.includes('navigation failed') ||
    errorLower.includes('selector') ||
    errorLower.includes('form changed')
  ) {
    return {
      code: 'FORM_CHANGED',
      message: 'Carrier portal form has changed. Automation needs updating.',
      carrierCode,
      recoverable: false, // FORM_CHANGED gets 1 retry at most
      suggestedAction: getSuggestedAction('FORM_CHANGED'),
    };
  }

  // Timeout errors
  if (
    errorLower.includes('timeout') ||
    errorLower.includes('timed out') ||
    errorLower.includes('deadline exceeded')
  ) {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out while processing.',
      carrierCode,
      recoverable: true,
      suggestedAction: getSuggestedAction('TIMEOUT'),
    };
  }

  // Default to unknown
  return {
    code: 'UNKNOWN',
    message: error || 'An unexpected error occurred.',
    carrierCode,
    recoverable: false,
    suggestedAction: getSuggestedAction('UNKNOWN'),
  };
}

/**
 * Create a structured error log entry
 * AC-Q6.2-6: Structured logging without sensitive data
 */
export function createErrorLogEntry(
  error: QuoteError,
  context: {
    sessionId?: string;
    taskId?: string;
    attempt?: number;
  }
): Record<string, unknown> {
  return {
    level: 'error',
    component: 'QuoteAgent',
    errorCode: error.code,
    errorMessage: error.message,
    carrierCode: error.carrierCode,
    recoverable: error.recoverable,
    sessionId: context.sessionId,
    taskId: context.taskId,
    attempt: context.attempt,
    timestamp: new Date().toISOString(),
  };
}
