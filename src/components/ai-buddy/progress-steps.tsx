/**
 * Progress Steps Component
 * Story 14.5: Component Scaffolding
 *
 * Visual progress indicator for multi-step flows.
 * Stub implementation - full functionality in Epic 18.
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              index < currentStep
                ? 'bg-emerald-500 text-white'
                : index === currentStep
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                  : 'bg-[var(--chat-surface)] text-[var(--text-muted)]'
            )}
          >
            {index < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2',
                index < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-[var(--chat-border)]'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
