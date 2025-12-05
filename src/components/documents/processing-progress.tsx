'use client';

import { Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressData, QueueInfo, JobMetadata } from '@/hooks/use-processing-progress';
import { Button } from '@/components/ui/button';

/**
 * Story 5.12: Stage configuration for step indicator
 * Per UX Design (Party Mode 2025-12-02):
 * - User-friendly labels: Load, Read, Prep, Index
 * - Technical names mapped to display text
 * Story 11.2: Added 'queued' and 'analyzing' stages
 */
const STAGES = [
  { key: 'queued', label: 'Queue', display: 'Waiting in queue...' },
  { key: 'downloading', label: 'Load', display: 'Loading file...' },
  { key: 'parsing', label: 'Read', display: 'Reading document...' },
  { key: 'chunking', label: 'Prep', display: 'Preparing content...' },
  { key: 'embedding', label: 'Index', display: 'Indexing for search...' },
  { key: 'analyzing', label: 'AI', display: 'Analyzing with AI...' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

interface ProcessingProgressProps {
  /** Current progress data from processing_jobs */
  progressData: ProgressData | null;
  /** Story 11.2: Job metadata for elapsed time */
  jobMetadata?: JobMetadata | null;
  /** Story 11.2: Queue info for pending jobs */
  queueInfo?: QueueInfo | null;
  /** Story 11.2: Error message for failed jobs */
  errorMessage?: string | null;
  /** Story 11.2: Callback to retry failed job */
  onRetry?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Story 11.2: Format elapsed time since job started
 */
function formatElapsedTime(startedAt: string | null, createdAt: string): string {
  const startTime = startedAt ? new Date(startedAt) : new Date(createdAt);
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

  if (elapsed < 60) return `${elapsed}s`;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Story 11.2: Format estimated wait time
 */
function formatWaitTime(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null;
  if (seconds < 60) return '<1 min';
  const mins = Math.ceil(seconds / 60);
  return `~${mins} min`;
}

/**
 * Format time remaining as a range (per UX decision: "2-4 min" not exact "3 min")
 * This manages user expectations honestly
 */
function formatTimeRemainingRange(seconds: number): string {
  if (seconds < 30) return '<1 min';
  if (seconds < 60) return '<1 min';

  const mins = Math.ceil(seconds / 60);
  if (mins <= 1) return '~1 min';
  if (mins <= 2) return '1-2 min';
  if (mins <= 4) return '2-4 min';
  if (mins <= 6) return '4-6 min';
  if (mins <= 10) return '6-10 min';

  // For very long estimates, show a wider range
  const lowerBound = Math.max(1, mins - 2);
  return `${lowerBound}-${mins} min`;
}

/**
 * Build ARIA label with full context for screen readers
 * Per UX requirement: "Document processing: stage 2 of 4, parsing document, 45 percent complete..."
 */
function buildAriaLabel(
  currentStageIndex: number,
  currentStage: (typeof STAGES)[number] | undefined,
  stageProgress: number,
  estimatedSeconds: number | null
): string {
  const parts: string[] = [];

  parts.push(
    `Document processing: stage ${currentStageIndex + 1} of ${STAGES.length}`
  );

  if (currentStage) {
    parts.push(currentStage.display.replace('...', ''));
  }

  parts.push(`${stageProgress} percent complete`);

  if (estimatedSeconds !== null && estimatedSeconds > 0) {
    const timeRange = formatTimeRemainingRange(estimatedSeconds);
    parts.push(`approximately ${timeRange} remaining`);
  }

  return parts.join(', ');
}

/**
 * Processing Progress Component
 *
 * Story 5.12 (AC-5.12.1 through AC-5.12.5): Detailed processing progress display
 *
 * Design (Party Mode 2025-12-02):
 * - Step indicator: ✓────●────○────○ (Load, Read, Prep, Index)
 * - Progress bar with percentage
 * - Time remaining estimate (ranges, not exact)
 * - Mobile-responsive layout
 * - Full accessibility support (ARIA labels, WCAG AA)
 *
 * Color palette (Trustworthy Slate):
 * - Completed stage: emerald-500 (#10b981)
 * - Active stage: slate-600 with shimmer (#475569)
 * - Pending stage: slate-300 (#cbd5e1)
 * - Progress bar fill: slate-600 (#475569)
 * - Time estimate text: slate-400 (#94a3b8)
 */
export function ProcessingProgress({
  progressData,
  jobMetadata,
  queueInfo,
  errorMessage,
  onRetry,
  className,
}: ProcessingProgressProps) {
  // Story 11.2: Handle failed state with error message
  if (jobMetadata?.status === 'failed') {
    return (
      <div
        className={cn('flex flex-col gap-2', className)}
        data-testid="processing-progress-bar"
        role="region"
        aria-label="Document processing failed"
      >
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium" data-testid="error-message">
            {errorMessage || 'Processing failed'}
          </span>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-fit"
            data-testid="retry-button"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Story 11.2: Handle completed state
  if (progressData?.stage === 'completed' || jobMetadata?.status === 'completed') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        data-testid="processing-progress-bar"
        role="region"
        aria-label="Document processing complete"
      >
        <div className="flex items-center gap-1.5 text-emerald-600">
          <Check className="h-4 w-4" strokeWidth={3} data-testid="success-indicator" />
          <span className="text-sm font-medium">Complete!</span>
        </div>
      </div>
    );
  }

  // If no progress data, show fallback
  if (!progressData) {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        aria-label="Document processing in progress"
        data-testid="processing-progress-bar"
      >
        <div className="relative overflow-hidden rounded-md bg-slate-100 px-2 py-1">
          <span className="relative z-10 text-xs font-medium text-slate-600">
            Analyzing...
          </span>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
        </div>
      </div>
    );
  }

  const { stage, stage_progress, total_progress, estimated_seconds_remaining } = progressData;
  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);
  const currentStage =
    currentStageIndex >= 0 ? STAGES[currentStageIndex] : undefined;

  // Story 11.2: Calculate elapsed time
  const elapsedTime = jobMetadata
    ? formatElapsedTime(jobMetadata.startedAt, jobMetadata.createdAt)
    : null;

  // Story 11.2: Queue position display
  const isQueued = stage === 'queued' || jobMetadata?.status === 'pending';
  const waitTimeDisplay = queueInfo ? formatWaitTime(queueInfo.estimatedWaitSeconds) : null;

  const ariaLabel = buildAriaLabel(
    currentStageIndex,
    currentStage,
    stage_progress,
    estimated_seconds_remaining
  );

  return (
    <div
      className={cn('flex flex-col gap-1.5', className)}
      role="region"
      aria-label={ariaLabel}
      aria-live="polite"
      data-testid="processing-progress-bar"
    >
      {/* Story 11.2: Queue position indicator */}
      {isQueued && queueInfo && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600" data-testid="queue-position">
          <Clock className="h-3 w-3" />
          <span>Position {queueInfo.position} of {queueInfo.totalPending}</span>
          {waitTimeDisplay && <span className="text-slate-400">| Est. wait: {waitTimeDisplay}</span>}
        </div>
      )}

      {/* Step Indicator Row */}
      <div className="flex items-center gap-0.5" data-testid="stage-timeline">
        {STAGES.map((s, index) => {
          const isCompleted = index < currentStageIndex;
          const isActive = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div key={s.key} className="flex items-center">
              {/* Step dot */}
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium transition-colors',
                  isCompleted && 'bg-emerald-500 text-white',
                  isActive &&
                    'relative overflow-hidden bg-slate-600 text-white',
                  isPending && 'border border-slate-300 bg-white text-slate-300'
                )}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : isActive ? (
                  <>
                    <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-white" />
                    {/* Shimmer animation on active stage */}
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </>
                ) : (
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Connector line (not after last) */}
              {index < STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-2.5 transition-colors',
                    index < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}

        {/* Mobile: inline stage text after dots */}
        <span className="ml-2 truncate text-xs text-slate-600 sm:hidden" data-testid="progress-stage">
          {currentStage?.display || 'Processing...'}
        </span>
      </div>

      {/* Desktop: Stage labels below dots */}
      <div className="hidden items-center gap-0.5 text-[9px] text-slate-400 sm:flex">
        {STAGES.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <span
              className={cn(
                'w-4 text-center',
                index === currentStageIndex && 'font-medium text-slate-600'
              )}
            >
              {s.label}
            </span>
            {index < STAGES.length - 1 && (
              <div className="w-2.5" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Current stage display text */}
      <span className="hidden text-xs font-medium text-slate-600 sm:block" data-testid="progress-stage">
        {currentStage?.display || 'Processing...'}
      </span>

      {/* Progress bar row */}
      <div className="flex items-center gap-2">
        <div
          className="h-1 flex-1 max-w-[120px] overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={total_progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Total progress: ${total_progress} percent`}
        >
          <div
            className="h-full bg-slate-600 transition-all duration-300 ease-out"
            style={{ width: `${total_progress}%` }}
            data-testid="progress-bar-fill"
          />
        </div>
        <span className="min-w-[2rem] text-xs tabular-nums text-slate-500" data-testid="progress-percentage">
          {total_progress}%
        </span>
      </div>

      {/* Story 11.2: Elapsed time and time remaining */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        {elapsedTime && !isQueued && (
          <span data-testid="progress-elapsed">Elapsed: {elapsedTime}</span>
        )}
        {elapsedTime && !isQueued && estimated_seconds_remaining !== null && estimated_seconds_remaining > 0 && (
          <span>|</span>
        )}
        {estimated_seconds_remaining !== null && estimated_seconds_remaining > 0 && (
          <span>~{formatTimeRemainingRange(estimated_seconds_remaining)} remaining</span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for very constrained spaces
 * Shows just the step indicator + progress percentage inline
 */
export function ProcessingProgressCompact({
  progressData,
  className,
}: ProcessingProgressProps) {
  if (!progressData) {
    return (
      <span
        className={cn(
          'relative inline-flex items-center overflow-hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600',
          className
        )}
      >
        <span className="relative z-10">Analyzing...</span>
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
      </span>
    );
  }

  const { stage, stage_progress, total_progress } = progressData;
  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* Mini step indicator */}
      <div className="flex items-center gap-px">
        {STAGES.map((s, index) => (
          <div
            key={s.key}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              index < currentStageIndex && 'bg-emerald-500',
              index === currentStageIndex && 'bg-slate-600',
              index > currentStageIndex && 'bg-slate-200'
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Total progress percentage */}
      <span className="text-xs tabular-nums text-slate-500">
        {total_progress}%
      </span>
    </div>
  );
}
