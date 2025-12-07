/**
 * Onboarding Flow Component
 * Story 14.5: Component Scaffolding
 *
 * Multi-step onboarding wizard for new users.
 * Stub implementation - full functionality in Epic 18.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingFlow({
  steps,
  onComplete,
  onSkip,
  className,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const step = steps[currentStep];

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {step?.title}
        </h2>
        <p className="text-[var(--text-muted)]">{step?.description}</p>
      </div>
      <div className="flex items-center justify-between p-4 border-t border-[var(--chat-border)]">
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
