'use client';

/**
 * Extraction Status Badge Component
 *
 * Story 11.8: Document List - Extraction Status Indicators
 * AC-11.8.1: Document cards show extraction status badge
 * AC-11.8.2: Status states display with appropriate icons
 * AC-11.8.4: Tooltip explanations for each state
 *
 * Shows the extraction status (for quote comparison) separately from
 * the document processing status (for chat readiness).
 */

import { Check, CheckCheck, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ExtractionStatus, DocumentType } from '@/types';

interface ExtractionStatusBadgeProps {
  /** Current extraction status */
  status: ExtractionStatus | null;
  /** Document type - general docs don't show extraction badge */
  documentType?: DocumentType | null;
  /** Callback when retry is clicked (for failed status) */
  onRetry?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusConfig: Record<ExtractionStatus, {
  icon: typeof Check;
  label: string;
  tooltip: string;
  className: string;
}> = {
  pending: {
    icon: Loader2,
    label: 'Queued',
    tooltip: 'This document is ready for chat. Quote analysis is queued.',
    className: 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400',
  },
  extracting: {
    icon: Loader2,
    label: 'Analyzing...',
    tooltip: 'Extracting quote details for comparison. Chat is available now.',
    className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  },
  complete: {
    icon: CheckCheck,
    label: 'Fully Analyzed',
    tooltip: 'This document is fully analyzed and ready for comparison.',
    className: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  },
  failed: {
    icon: AlertTriangle,
    label: 'Analysis Failed',
    tooltip: 'Quote extraction failed. Click to retry.',
    className: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  },
  skipped: {
    icon: Check,
    label: 'Ready',
    tooltip: 'This document is ready. (General documents don\'t require quote extraction.)',
    className: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  },
};

/**
 * ExtractionStatusBadge
 *
 * Displays extraction status for quote documents.
 * - Shows spinner for pending/extracting states
 * - Shows checkmark for complete/skipped states
 * - Shows retry option for failed state
 * - Hidden for general documents (they don't need extraction)
 */
export function ExtractionStatusBadge({
  status,
  documentType,
  onRetry,
  isRetrying = false,
  className,
}: ExtractionStatusBadgeProps) {
  // Don't show badge for general documents (unless complete for consistency)
  if (documentType === 'general' && status !== 'complete') {
    return null;
  }

  // Default to pending if status is null (legacy documents)
  const effectiveStatus: ExtractionStatus = status || 'pending';
  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;
  const isSpinning = effectiveStatus === 'extracting' || effectiveStatus === 'pending' || isRetrying;

  const handleClick = (e: React.MouseEvent) => {
    if (effectiveStatus === 'failed' && onRetry) {
      e.stopPropagation();
      onRetry();
    }
  };

  // Story 11.8: For failed status, render a more prominent retry button inline
  if (effectiveStatus === 'failed' && onRetry) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              data-testid={`extraction-status-${effectiveStatus}`}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                config.className
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <button
          type="button"
          data-testid="extraction-retry-button"
          onClick={handleClick}
          disabled={isRetrying}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
            'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
            'transition-colors shadow-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCcw className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  const badge = (
    <div
      data-testid={`extraction-status-${effectiveStatus}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          isSpinning && 'animate-spin'
        )}
      />
      <span>{isRetrying ? 'Retrying...' : config.label}</span>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
