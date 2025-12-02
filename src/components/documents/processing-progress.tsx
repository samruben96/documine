'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressData } from '@/hooks/use-processing-progress';

/**
 * Story 5.12: Stage configuration for step indicator
 * Per UX Design (Party Mode 2025-12-02):
 * - User-friendly labels: Load, Read, Prep, Index
 * - Technical names mapped to display text
 */
const STAGES = [
  { key: 'downloading', label: 'Load', display: 'Loading file...' },
  { key: 'parsing', label: 'Read', display: 'Reading document...' },
  { key: 'chunking', label: 'Prep', display: 'Preparing content...' },
  { key: 'embedding', label: 'Index', display: 'Indexing for search...' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

interface ProcessingProgressProps {
  /** Current progress data from processing_jobs */
  progressData: ProgressData | null;
  /** Optional additional CSS classes */
  className?: string;
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
  className,
}: ProcessingProgressProps) {
  // If no progress data, show fallback
  if (!progressData) {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        aria-label="Document processing in progress"
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

  const { stage, stage_progress, estimated_seconds_remaining } = progressData;
  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);
  const currentStage =
    currentStageIndex >= 0 ? STAGES[currentStageIndex] : undefined;

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
    >
      {/* Step Indicator Row */}
      <div className="flex items-center gap-0.5">
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
        <span className="ml-2 truncate text-xs text-slate-600 sm:hidden">
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
      <span className="hidden text-xs font-medium text-slate-600 sm:block">
        {currentStage?.display || 'Processing...'}
      </span>

      {/* Progress bar row */}
      <div className="flex items-center gap-2">
        <div
          className="h-1 w-20 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={stage_progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Stage progress: ${stage_progress} percent`}
        >
          <div
            className="h-full bg-slate-600 transition-all duration-300 ease-out"
            style={{ width: `${stage_progress}%` }}
          />
        </div>
        <span className="min-w-[2rem] text-xs tabular-nums text-slate-500">
          {stage_progress}%
        </span>
      </div>

      {/* Time remaining (ranges per UX decision) */}
      {estimated_seconds_remaining !== null &&
        estimated_seconds_remaining > 0 && (
          <span className="text-[11px] text-slate-400">
            ~{formatTimeRemainingRange(estimated_seconds_remaining)} remaining
          </span>
        )}
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
