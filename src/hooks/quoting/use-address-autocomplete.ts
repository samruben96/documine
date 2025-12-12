/**
 * Address Autocomplete Hook
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-4: Autocomplete suggestions appear after 3+ characters
 * AC-Q3.1-5: Selected suggestion populates all address fields
 *
 * Uses server proxy to protect Google Places API key
 *
 * TODO: PRODUCTION - Re-enable Google Places API calls
 * Currently disabled to conserve API quota during development.
 * To enable:
 * 1. Set GOOGLE_PLACES_API_KEY in environment
 * 2. Set ENABLE_PLACES_API=true below
 */

// Toggle this to enable/disable Places API calls
const ENABLE_PLACES_API = false;

import { useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { Address } from '@/types/quoting';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface UseAddressAutocompleteOptions {
  /** Minimum characters before searching (default: 3) */
  minChars?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
}

export interface UseAddressAutocompleteReturn {
  /** Current predictions */
  predictions: PlacePrediction[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Search for predictions */
  search: (input: string) => void;
  /** Select a prediction and get full address */
  selectPrediction: (placeId: string) => Promise<Address | null>;
  /** Clear predictions */
  clear: () => void;
}

/**
 * Google Places autocomplete hook
 *
 * Uses session tokens to reduce API costs (Autocomplete + Place Details
 * counted as single session when using same token).
 */
export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn {
  const { minChars = 3, debounceMs = 300 } = options;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session token for billing optimization
  const sessionTokenRef = useRef<string>(generateSessionToken());

  /**
   * Fetch predictions from server proxy
   */
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.length < minChars) {
        setPredictions([]);
        return;
      }

      // TODO: PRODUCTION - Remove this check when enabling Places API
      if (!ENABLE_PLACES_API) {
        // API disabled - no suggestions shown during development
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/quoting/places/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input,
            sessionToken: sessionTokenRef.current,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to fetch suggestions');
        }

        setPredictions(result.predictions ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch suggestions';
        setError(message);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minChars]
  );

  /**
   * Debounced search function
   */
  const debouncedFetch = useDebouncedCallback(fetchPredictions, debounceMs);

  /**
   * Search for predictions
   */
  const search = useCallback(
    (input: string) => {
      if (!input || input.length < minChars) {
        setPredictions([]);
        return;
      }
      debouncedFetch(input);
    },
    [minChars, debouncedFetch]
  );

  /**
   * Select a prediction and fetch full address details
   * AC-Q3.1-5: Auto-populate address fields on selection
   */
  const selectPrediction = useCallback(
    async (placeId: string): Promise<Address | null> => {
      // TODO: PRODUCTION - Remove this check when enabling Places API
      if (!ENABLE_PLACES_API) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/quoting/places/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeId,
            sessionToken: sessionTokenRef.current,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to fetch address details');
        }

        // Generate new session token for next search
        sessionTokenRef.current = generateSessionToken();

        // Clear predictions after selection
        setPredictions([]);

        return result.address ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch address';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear predictions
   */
  const clear = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  return {
    predictions,
    isLoading,
    error,
    search,
    selectPrediction,
    clear,
  };
}

/**
 * Generate a random session token
 * Used to group Autocomplete + Place Details requests for billing
 */
function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
