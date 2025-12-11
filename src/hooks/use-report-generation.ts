'use client';

/**
 * useReportGeneration Hook
 * Epic 23: Flexible AI Reports - Story 23.4
 *
 * Manages report generation state and SSE stream consumption.
 * AC-23.4.4: Generation shows streaming progress feedback via SSE
 * AC-23.4.7: Error states handled gracefully with retry capability
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GeneratedReport,
  ReportInsight,
  ChartConfig,
} from '@/types/reporting';

// ============================================================================
// Types
// ============================================================================

export interface ReportProgress {
  stage: 'analyzing' | 'generating' | 'charting';
  percent: number;
}

export interface UseReportGenerationReturn {
  /** Trigger report generation for a source file */
  generate: (sourceId: string, prompt?: string) => Promise<void>;
  /** Generated report (null until complete) */
  report: GeneratedReport | null;
  /** True while generation is in progress */
  isGenerating: boolean;
  /** Current progress (null when not generating) */
  progress: ReportProgress | null;
  /** Streaming title (available before full report) */
  streamingTitle: string | null;
  /** Streaming summary (available before full report) */
  streamingSummary: string | null;
  /** Streaming insights (incrementally added) */
  streamingInsights: ReportInsight[];
  /** Streaming charts (incrementally added) */
  streamingCharts: ChartConfig[];
  /** Error message if generation failed */
  error: string | null;
  /** Reset all state (e.g., for new generation) */
  reset: () => void;
  /** Cancel in-progress generation */
  cancel: () => void;
}

/**
 * SSE Event types from the generate API
 */
interface ReportSSEEvent {
  type: 'progress' | 'title' | 'summary' | 'insight' | 'chart' | 'done' | 'error';
  stage?: 'analyzing' | 'generating' | 'charting';
  percent?: number;
  title?: string;
  summary?: string;
  insight?: ReportInsight;
  chart?: ChartConfig;
  report?: GeneratedReport;
  error?: string;
  code?: string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing AI report generation with SSE streaming.
 *
 * Features:
 * - Streams progress updates during generation
 * - Incrementally shows title, summary, insights, charts as they're generated
 * - Handles errors gracefully with retry capability
 * - Supports cancellation via AbortController
 *
 * @returns Report generation state and functions
 */
export function useReportGeneration(): UseReportGenerationReturn {
  // State
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const [streamingTitle, setStreamingTitle] = useState<string | null>(null);
  const [streamingSummary, setStreamingSummary] = useState<string | null>(null);
  const [streamingInsights, setStreamingInsights] = useState<ReportInsight[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<ChartConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Generate a report from source data.
   */
  const generate = useCallback(async (sourceId: string, prompt?: string) => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Reset state
    setIsGenerating(true);
    setError(null);
    setReport(null);
    setProgress(null);
    setStreamingTitle(null);
    setStreamingSummary(null);
    setStreamingInsights([]);
    setStreamingCharts([]);

    try {
      const response = await fetch('/api/reporting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId, prompt }),
        signal: abortControllerRef.current.signal,
      });

      // Handle non-streaming error responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Generation failed (${response.status})`);
        }
        throw new Error(`Generation failed (${response.status})`);
      }

      // Check for SSE response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        throw new Error('Expected SSE response from generate API');
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split on newlines, keep incomplete line in buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          // SSE data lines start with "data: "
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            // Skip empty data or [DONE] signal
            if (!data || data === '[DONE]') {
              continue;
            }

            try {
              const event: ReportSSEEvent = JSON.parse(data);

              switch (event.type) {
                case 'progress':
                  if (event.stage && event.percent !== undefined) {
                    setProgress({ stage: event.stage, percent: event.percent });
                  }
                  break;

                case 'title':
                  if (event.title) {
                    setStreamingTitle(event.title);
                  }
                  break;

                case 'summary':
                  if (event.summary) {
                    setStreamingSummary(event.summary);
                  }
                  break;

                case 'insight':
                  if (event.insight) {
                    setStreamingInsights((prev) => [...prev, event.insight!]);
                  }
                  break;

                case 'chart':
                  if (event.chart) {
                    setStreamingCharts((prev) => [...prev, event.chart!]);
                  }
                  break;

                case 'done':
                  if (event.report) {
                    setReport(event.report);
                  }
                  break;

                case 'error':
                  throw new Error(event.error || 'Generation failed');
              }
            } catch (parseError) {
              // Re-throw actual errors (from error events)
              if (parseError instanceof Error && !parseError.message.includes('JSON')) {
                throw parseError;
              }
              // Skip unparseable events
              console.warn('Failed to parse SSE event:', data);
            }
          }
        }
      }
    } catch (err) {
      // Don't set error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Report generation failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  }, []);

  /**
   * Reset all state.
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setReport(null);
    setIsGenerating(false);
    setProgress(null);
    setStreamingTitle(null);
    setStreamingSummary(null);
    setStreamingInsights([]);
    setStreamingCharts([]);
    setError(null);
  }, []);

  /**
   * Cancel in-progress generation.
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setProgress(null);
  }, []);

  return {
    generate,
    report,
    isGenerating,
    progress,
    streamingTitle,
    streamingSummary,
    streamingInsights,
    streamingCharts,
    error,
    reset,
    cancel,
  };
}
