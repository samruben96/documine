/**
 * VIN Decode Hook
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-18: VIN decode API call on blur with auto-populate
 * AC-Q3.1-19: Handle decode failures with fallback message
 *
 * Uses NHTSA vPIC API - free, no API key, CORS-friendly
 */

import { useState, useCallback } from 'react';

export interface VINDecodeResult {
  year: number | null;
  make: string | null;
  model: string | null;
}

export interface UseVINDecodeReturn {
  /** Decode a VIN */
  decodeVIN: (vin: string) => Promise<VINDecodeResult | null>;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Last successful result */
  result: VINDecodeResult | null;
  /** Clear state */
  clear: () => void;
}

// NHTSA API response structure
interface NHTSAResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: NHTSAResult[];
}

interface NHTSAResult {
  Variable: string;
  Value: string | null;
  VariableId: number;
}

/**
 * Hook for decoding VINs using NHTSA API
 *
 * AC-Q3.1-18: Auto-populate year/make/model on successful decode
 * AC-Q3.1-19: Show warning and allow manual entry on failure
 */
export function useVINDecode(): UseVINDecodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VINDecodeResult | null>(null);

  /**
   * Decode VIN using NHTSA API
   */
  const decodeVIN = useCallback(
    async (vin: string): Promise<VINDecodeResult | null> => {
      if (!vin || vin.length !== 17) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
        );

        if (!response.ok) {
          throw new Error('Failed to decode VIN');
        }

        const data: NHTSAResponse = await response.json();

        // Extract values from results
        const getValue = (variableName: string): string | null => {
          const item = data.Results.find(
            (r) => r.Variable === variableName
          );
          return item?.Value ?? null;
        };

        const yearStr = getValue('Model Year');
        const make = getValue('Make');
        const model = getValue('Model');

        // Validate that we got useful data
        const year = yearStr ? parseInt(yearStr, 10) : null;

        // Check if we got at least make and model
        if (!make && !model) {
          setError("Couldn't decode VIN - please enter details manually");
          setResult(null);
          return null;
        }

        const decodeResult: VINDecodeResult = {
          year: year && !isNaN(year) ? year : null,
          make: make || null,
          model: model || null,
        };

        setResult(decodeResult);
        return decodeResult;
      } catch (err) {
        // AC-Q3.1-19: Handle failures gracefully
        const message =
          err instanceof Error
            ? err.message
            : "Couldn't decode VIN - please enter details manually";
        setError(message);
        setResult(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear state
   */
  const clear = useCallback(() => {
    setError(null);
    setResult(null);
    setIsLoading(false);
  }, []);

  return {
    decodeVIN,
    isLoading,
    error,
    result,
    clear,
  };
}
