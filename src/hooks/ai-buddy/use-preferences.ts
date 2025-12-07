/**
 * AI Buddy Preferences Hook
 * Story 14.5: Component Scaffolding
 *
 * Hook for managing user preferences.
 * Stub implementation - full functionality in Epic 18.
 */

import { useState, useCallback } from 'react';
import type { UserPreferences } from '@/types/ai-buddy';

export interface UsePreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePreferences = useCallback(async (_updates: Partial<UserPreferences>) => {
    throw new Error('Not implemented - Preferences management deferred to Epic 18');
  }, []);

  const resetPreferences = useCallback(async () => {
    throw new Error('Not implemented - Preferences reset deferred to Epic 18');
  }, []);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
  };
}
