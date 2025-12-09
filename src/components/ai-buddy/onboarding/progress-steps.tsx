/**
 * Progress Steps Component
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Displays step indicators for the onboarding wizard.
 *
 * AC-18.1.1: Step indicators showing completed/current/upcoming states
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStepsProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional labels for each step */
  labels?: string[];
  /** Additional className */
  className?: string;
}

/**
 * Step indicator component for onboarding wizard
 *
 * @example
 * ```tsx
 * <ProgressSteps
 *   currentStep={2}
 *   totalSteps={3}
 *   labels={['Welcome', 'Lines of Business', 'Carriers']}
 * />
 * ```
 */
export function ProgressSteps({
  currentStep,
  totalSteps,
  labels,
  className,
}: ProgressStepsProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      data-testid="progress-steps"
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div
            key={stepNumber}
            className="flex items-center gap-2"
          >
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary',
                  isUpcoming && 'bg-muted text-muted-foreground'
                )}
                data-testid={`step-${stepNumber}`}
                data-state={isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  stepNumber
                )}
              </div>
              {labels && labels[index] && (
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {labels[index]}
                </span>
              )}
            </div>

            {/* Connector line between steps */}
            {stepNumber < totalSteps && (
              <div
                className={cn(
                  'w-8 h-0.5',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
