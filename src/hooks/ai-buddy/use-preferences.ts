/**
 * AI Buddy Preferences Hook
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Hook for managing user preferences with useState/useCallback pattern.
 * Provides CRUD operations for user preferences stored in ai_buddy_preferences JSONB column.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserPreferences } from '@/types/ai-buddy';

export interface UsePreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  resetPreferences: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface PreferencesApiResponse {
  data?: {
    preferences: UserPreferences;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Hook for managing AI Buddy user preferences
 *
 * @example
 * ```tsx
 * const { preferences, isLoading, updatePreferences } = usePreferences();
 *
 * // Check if onboarding is needed
 * const needsOnboarding = !preferences?.onboardingCompleted && !preferences?.onboardingSkipped;
 *
 * // Complete onboarding
 * await updatePreferences({
 *   displayName: 'John',
 *   role: 'producer',
 *   linesOfBusiness: ['Personal Auto', 'Homeowners'],
 *   onboardingCompleted: true,
 *   onboardingCompletedAt: new Date().toISOString(),
 * });
 * ```
 */
export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch preferences from API
   */
  const fetchPreferences = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-buddy/preferences');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch preferences: ${response.status}`);
      }

      const result: PreferencesApiResponse = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPreferences(result.data?.preferences || {});
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch preferences');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update preferences via API with optimistic update
   */
  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
      const previousPreferences = preferences;

      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        ...updates,
      }));

      try {
        const response = await fetch('/api/ai-buddy/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Revert optimistic update
          setPreferences(previousPreferences);
          throw new Error(errorData?.error?.message || `Failed to update preferences: ${response.status}`);
        }

        const result: PreferencesApiResponse = await response.json();

        if (result.error) {
          // Revert optimistic update
          setPreferences(previousPreferences);
          throw new Error(result.error.message);
        }

        const updatedPreferences = result.data?.preferences || {};
        setPreferences(updatedPreferences);
        return updatedPreferences;
      } catch (err) {
        // Revert on error
        setPreferences(previousPreferences);
        const error = err instanceof Error ? err : new Error('Failed to update preferences');
        setError(error);
        throw error;
      }
    },
    [preferences]
  );

  /**
   * Reset preferences to defaults via dedicated API endpoint
   * AC-18.2.9, AC-18.2.10, AC-18.2.11: Reset with onboarding re-trigger
   */
  const resetPreferences = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/ai-buddy/preferences/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to reset preferences: ${response.status}`);
      }

      const result: PreferencesApiResponse = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update local state with reset preferences
      setPreferences(result.data?.preferences || {});
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset preferences');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Refetch preferences
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Fetch preferences on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPreferences();
    }
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    refetch,
  };
}
