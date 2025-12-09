/**
 * Onboarding Flow Component
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * 3-step onboarding wizard modal for new AI Buddy users.
 *
 * AC-18.1.1: First-time onboarding modal with Step 1
 * AC-18.1.2: Step 1 - Name and Role
 * AC-18.1.3: Step 2 - Lines of Business
 * AC-18.1.4: Step 3 - Favorite Carriers
 * AC-18.1.8: Skip onboarding option
 * AC-18.1.10: Back navigation with preserved selections
 */

'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressSteps } from './progress-steps';
import { ChipSelect } from './chip-select';
import {
  LINES_OF_BUSINESS,
  COMMON_CARRIERS,
  USER_ROLES,
  type UserPreferences,
} from '@/types/ai-buddy';

export interface OnboardingFlowProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when onboarding is completed with preferences */
  onComplete: (preferences: Partial<UserPreferences>) => Promise<void>;
  /** Callback when onboarding is skipped */
  onSkip: () => Promise<void>;
}

interface OnboardingData {
  displayName: string;
  role: UserPreferences['role'] | '';
  linesOfBusiness: string[];
  favoriteCarriers: string[];
}

const STEP_LABELS = ['Welcome', 'Lines of Business', 'Carriers'];

/**
 * 3-step onboarding wizard for AI Buddy
 */
export function OnboardingFlow({
  open,
  onOpenChange,
  onComplete,
  onSkip,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    role: '',
    linesOfBusiness: [],
    favoriteCarriers: [],
  });

  // Reset state when modal closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Only reset if actually closing, not just programmatically
      setCurrentStep(1);
      setData({
        displayName: '',
        role: '',
        linesOfBusiness: [],
        favoriteCarriers: [],
      });
    }
    onOpenChange(newOpen);
  }, [onOpenChange, isSubmitting]);

  // Step 1: Name validation
  const isStep1Valid = data.displayName.trim().length > 0;

  // Step 2: Lines of business validation (min 1 required)
  const isStep2Valid = data.linesOfBusiness.length >= 1;

  // Step 3: Carriers are optional
  const isStep3Valid = true;

  // Navigation
  const goToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    }
  };

  // AC-18.1.10: Back navigation preserves selections
  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  // AC-18.1.4: Complete onboarding
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        displayName: data.displayName.trim(),
        role: data.role || undefined,
        linesOfBusiness: data.linesOfBusiness,
        favoriteCarriers: data.favoriteCarriers,
      });
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // AC-18.1.8: Skip onboarding
  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSkip();
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid="onboarding-dialog"
        showCloseButton={false}
      >
        {/* Progress indicator */}
        <div className="mb-4">
          <ProgressSteps
            currentStep={currentStep}
            totalSteps={3}
            labels={STEP_LABELS}
          />
        </div>

        {/* Step 1: Welcome + Name/Role */}
        {currentStep === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Welcome to AI Buddy!
              </DialogTitle>
              <DialogDescription>
                Let&apos;s personalize your experience. This takes less than 2 minutes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">
                  What should I call you? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="display-name"
                  placeholder="Enter your name"
                  value={data.displayName}
                  onChange={(e) =>
                    setData((d) => ({ ...d, displayName: e.target.value }))
                  }
                  maxLength={50}
                  disabled={isSubmitting}
                  data-testid="name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">What&apos;s your role? (optional)</Label>
                <Select
                  value={data.role}
                  onValueChange={(value) =>
                    setData((d) => ({ ...d, role: value as UserPreferences['role'] }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role" data-testid="role-select">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
                data-testid="skip-button"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep1Valid || isSubmitting}
                data-testid="continue-button"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Lines of Business */}
        {currentStep === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Lines of Business</DialogTitle>
              <DialogDescription>
                Select the lines of business you work with most often. This helps me
                provide more relevant suggestions.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ChipSelect
                options={LINES_OF_BUSINESS}
                selected={data.linesOfBusiness}
                onChange={(selected) =>
                  setData((d) => ({ ...d, linesOfBusiness: selected }))
                }
                minSelection={1}
                label="Select at least one"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  data-testid="back-button"
                >
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  data-testid="skip-button"
                >
                  Skip for now
                </Button>
              </div>
              <Button
                onClick={handleNext}
                disabled={!isStep2Valid || isSubmitting}
                data-testid="continue-button"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Favorite Carriers */}
        {currentStep === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>Favorite Carriers</DialogTitle>
              <DialogDescription>
                Select your preferred carriers (optional). This helps me tailor
                recommendations to carriers you work with.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ChipSelect
                options={COMMON_CARRIERS}
                selected={data.favoriteCarriers}
                onChange={(selected) =>
                  setData((d) => ({ ...d, favoriteCarriers: selected }))
                }
                minSelection={0}
                label="Select your favorites"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  data-testid="back-button"
                >
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  data-testid="skip-button"
                >
                  Skip for now
                </Button>
              </div>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                data-testid="start-chatting-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Start Chatting'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
