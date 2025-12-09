/**
 * AI Buddy Onboarding Hook
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Hook for managing onboarding state and completion.
 *
 * AC-18.1.1: Check if onboarding should be shown
 * AC-18.1.8: Skip onboarding functionality
 * AC-18.1.9: No re-display after skip
 */

import { useCallback } from 'react';
import { usePreferences } from './use-preferences';
import type { UserPreferences } from '@/types/ai-buddy';

export interface UseOnboardingReturn {
  /** Whether onboarding modal should be shown */
  shouldShowOnboarding: boolean;
  /** Whether preferences are still loading */
  isLoading: boolean;
  /** Error if any occurred */
  error: Error | null;
  /**
   * Complete onboarding with provided preferences
   * Sets onboardingCompleted = true and onboardingCompletedAt = current timestamp
   */
  completeOnboarding: (preferences: Partial<UserPreferences>) => Promise<void>;
  /**
   * Skip onboarding
   * Sets onboardingSkipped = true and onboardingSkippedAt = current timestamp
   */
  skipOnboarding: () => Promise<void>;
}

/**
 * Hook for managing AI Buddy onboarding state
 *
 * @example
 * ```tsx
 * const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
 *
 * if (shouldShowOnboarding) {
 *   return <OnboardingFlow onComplete={completeOnboarding} onSkip={skipOnboarding} />;
 * }
 * ```
 */
export function useOnboarding(): UseOnboardingReturn {
  const { preferences, isLoading, error, updatePreferences } = usePreferences();

  // AC-18.1.1: Show onboarding for new users who haven't completed or skipped
  // AC-18.1.9: Don't re-display after skip
  const shouldShowOnboarding = !isLoading && !!preferences &&
    !preferences.onboardingCompleted &&
    !preferences.onboardingSkipped;

  // Complete onboarding with collected preferences
  const completeOnboarding = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      await updatePreferences({
        ...newPreferences,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        onboardingSkipped: false,
        onboardingSkippedAt: undefined,
      });
    },
    [updatePreferences]
  );

  // AC-18.1.8: Skip onboarding
  const skipOnboarding = useCallback(async () => {
    await updatePreferences({
      onboardingSkipped: true,
      onboardingSkippedAt: new Date().toISOString(),
    });
  }, [updatePreferences]);

  return {
    shouldShowOnboarding,
    isLoading,
    error,
    completeOnboarding,
    skipOnboarding,
  };
}
