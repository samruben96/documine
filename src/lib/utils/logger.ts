/**
 * Structured JSON logger for consistent application logging.
 * @module @/lib/utils/logger
 */

type LogData = Record<string, unknown>;

/**
 * Structured logger that outputs JSON-formatted log entries.
 * All methods include timestamp in ISO-8601 format.
 *
 * @example
 * ```ts
 * log.info('User logged in', { userId: '123' });
 * // Output: {"level":"info","message":"User logged in","userId":"123","timestamp":"2025-01-01T00:00:00.000Z"}
 *
 * log.error('Failed to process', error, { documentId: '456' });
 * // Output: {"level":"error","message":"Failed to process","error":"...","stack":"...","documentId":"456","timestamp":"..."}
 * ```
 */
export const log = {
  /**
   * Log an informational message.
   */
  info: (message: string, data?: LogData): void => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },

  /**
   * Log a warning message.
   */
  warn: (message: string, data?: LogData): void => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  },

  /**
   * Log an error with stack trace.
   */
  error: (message: string, error: Error, data?: LogData): void => {
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
