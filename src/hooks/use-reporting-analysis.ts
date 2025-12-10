'use client';

/**
 * useReportingAnalysis Hook
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * Encapsulates the analyze API call with proper state management.
 * AC-23.3.4: Generate Report button enabled after file upload completes
 * AC-23.3.5: Loading state shown while analysis is in progress
 * AC-23.3.6: Clear error handling if analysis fails
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalyzeResponse } from '@/types/reporting';

interface UseReportingAnalysisReturn {
  /** Trigger analysis for a source file */
  analyze: (sourceId: string) => Promise<void>;
  /** Analysis result data (null until complete) */
  data: AnalyzeResponse | null;
  /** True while analysis is in progress */
  isLoading: boolean;
  /** Error message if analysis failed */
  error: string | null;
  /** Reset all state (e.g., when uploading new file) */
  reset: () => void;
}

export function useReportingAnalysis(): UseReportingAnalysisReturn {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const analyze = useCallback(async (sourceId: string) => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/reporting/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId }),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || `Analysis failed (${response.status})`);
      }

      if (result.error) {
        throw new Error(result.error.message || 'Analysis failed');
      }

      setData(result.data);
    } catch (err) {
      // Don't set error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    analyze,
    data,
    isLoading,
    error,
    reset,
  };
}
