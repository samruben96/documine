'use client';

import { CheckCircle2, XCircle, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { classifyError, type ErrorCategory } from '@/lib/documents/error-classification';

export type DocumentStatusType = 'uploading' | 'processing' | 'ready' | 'failed';

interface DocumentStatusProps {
  status: DocumentStatusType;
  progress?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Document Status Component
 *
 * Displays the current status of a document with appropriate visual indicators.
 *
 * Implements:
 * - AC-4.2.4: Shimmer animation for "Analyzing..." state (no spinners > 200ms)
 * - AC-4.2.5: Green checkmark for "Ready" state
 * - AC-4.2.7: Error icon with Retry/Delete actions for "Failed" state
 */
export function DocumentStatus({
  status,
  progress,
  errorMessage,
  onRetry,
  onDelete,
  className,
}: DocumentStatusProps) {
  switch (status) {
    case 'uploading':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-600 transition-all duration-200"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{progress ?? 0}%</span>
        </div>
      );

    case 'processing':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          {/* Shimmer animation per AC-4.2.4 (no spinners > 200ms) */}
          <div className="relative overflow-hidden rounded-md bg-slate-100 px-2 py-1">
            <span className="relative z-10 text-xs font-medium text-slate-600">
              Analyzing...
            </span>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
          </div>
        </div>
      );

    case 'ready':
      return (
        <div className={cn('flex items-center gap-1.5', className)}>
          {/* Green checkmark per AC-4.2.5 */}
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">Ready</span>
        </div>
      );

    case 'failed':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          {/* Error indicator with tooltip per AC-4.2.7 */}
          <div className="flex items-center gap-1.5" title={errorMessage}>
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-600">Failed</span>
          </div>

          {/* Retry and Delete actions per AC-4.2.7 */}
          {(onRetry || onDelete) && (
            <div className="flex items-center gap-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Retry processing"
                  aria-label="Retry processing"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Delete document"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Compact Document Status Badge
 *
 * A smaller status indicator for use in list views.
 * Implements AC-4.7.4: Queue Position Display
 */
export function DocumentStatusBadge({
  status,
  errorMessage,
  queuePosition,
}: {
  status: DocumentStatusType;
  errorMessage?: string;
  /** Queue position: 0 = actively processing, 1+ = position in queue, -1/undefined = not in queue */
  queuePosition?: number;
}) {
  switch (status) {
    case 'uploading':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          Uploading
        </span>
      );

    case 'processing':
      // Show queue position if available (AC-4.7.4)
      const isActivelyProcessing = queuePosition === 0;
      const isQueued = queuePosition !== undefined && queuePosition > 0;

      return (
        <span
          className="relative inline-flex items-center overflow-hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
          title={
            isActivelyProcessing
              ? 'Document is actively being processed'
              : isQueued
              ? `Position ${queuePosition} in queue`
              : 'Processing document'
          }
        >
          <span className="relative z-10">
            {isActivelyProcessing
              ? 'Analyzing'
              : isQueued
              ? `Queue #${queuePosition}`
              : 'Analyzing'}
          </span>
          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
        </span>
      );

    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Ready
        </span>
      );

    case 'failed':
      // Story 11.5 (AC-11.5.3, AC-11.5.5): User-friendly error with tooltip
      const classification = errorMessage ? classifyError(errorMessage) : null;
      const userMessage = classification?.userMessage || 'Processing failed';
      const suggestedAction = classification?.suggestedAction || null;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 cursor-help"
              data-testid="failed-status-badge"
            >
              <XCircle className="h-3 w-3" />
              Failed
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px]" data-testid="error-tooltip">
            <div className="space-y-1">
              <p className="font-medium text-sm">{userMessage}</p>
              {suggestedAction && (
                <p className="text-xs text-slate-400">{suggestedAction}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );

    default:
      return null;
  }
}
