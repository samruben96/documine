'use client';

/**
 * ReportingError Component
 * Epic 23: Flexible AI Reports - Story 23.8
 *
 * Consistent error display for reporting module with actionable recovery options.
 * AC-23.8.3: Error states display user-friendly messages with actionable recovery options
 */

import { useState } from 'react';
import { AlertCircle, RefreshCw, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorType = 'analysis' | 'generation' | 'upload' | 'network' | 'validation';

interface ReportingErrorProps {
  /** Type of error for contextual messaging */
  type: ErrorType;
  /** User-friendly error message */
  message: string;
  /** Technical error details (for debugging) */
  details?: string;
  /** Handler for retry action */
  onRetry?: () => void;
  /** Handler for uploading a new file */
  onUploadNew?: () => void;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error type configuration with user-friendly labels and actions
 */
const ERROR_CONFIG: Record<ErrorType, {
  title: string;
  showRetry: boolean;
  showUploadNew: boolean;
}> = {
  analysis: {
    title: 'Analysis Failed',
    showRetry: true,
    showUploadNew: true,
  },
  generation: {
    title: 'Report Generation Failed',
    showRetry: true,
    showUploadNew: false,
  },
  upload: {
    title: 'Upload Failed',
    showRetry: true,
    showUploadNew: true,
  },
  network: {
    title: 'Connection Error',
    showRetry: true,
    showUploadNew: false,
  },
  validation: {
    title: 'Invalid File',
    showRetry: false,
    showUploadNew: true,
  },
};

/**
 * ReportingError displays consistent error states with recovery options.
 *
 * Features:
 * - User-friendly error messages
 * - Retry button for transient failures
 * - Upload new file button for unrecoverable errors
 * - Expandable technical details for debugging
 *
 * @example
 * ```tsx
 * <ReportingError
 *   type="analysis"
 *   message="Failed to parse the uploaded file."
 *   details="Invalid CSV format: missing header row"
 *   onRetry={handleRetry}
 *   onUploadNew={handleUploadNew}
 * />
 * ```
 */
export function ReportingError({
  type,
  message,
  details,
  onRetry,
  onUploadNew,
  isRetrying = false,
  className,
}: ReportingErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = ERROR_CONFIG[type];

  return (
    <Alert
      variant="destructive"
      className={cn('animate-in fade-in-50 slide-in-from-top-2 duration-300', className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm">{message}</p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {config.showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
              aria-label="Retry the failed operation"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRetrying && 'animate-spin')}
                aria-hidden="true"
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          {config.showUploadNew && onUploadNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadNew}
              disabled={isRetrying}
              className="gap-2"
              aria-label="Upload a different file"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload New File
            </Button>
          )}
        </div>

        {/* Expandable technical details */}
        {details && (
          <div className="border-t border-red-200 pt-3 mt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              {showDetails ? (
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              )}
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>

            {showDetails && (
              <div
                id="error-details"
                className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 font-mono whitespace-pre-wrap break-all"
              >
                {details}
              </div>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
