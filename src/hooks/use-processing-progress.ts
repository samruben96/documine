'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Json } from '@/types/database.types';

/**
 * Story 5.12: Processing progress data interface
 * Matches Edge Function progress_data JSON structure
 */
export interface ProgressData {
  stage: 'downloading' | 'parsing' | 'chunking' | 'embedding';
  stage_progress: number; // 0-100
  stage_name: string; // User-friendly name
  estimated_seconds_remaining: number | null;
  total_progress: number; // 0-100 across all stages
  updated_at: string;
}

// Max consecutive errors before stopping polling
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Stage weights for simulating progress during parsing
 * (Docling doesn't provide intermediate progress callbacks)
 */
const STAGE_WEIGHTS = {
  downloading: { start: 0, weight: 5 },
  parsing: { start: 5, weight: 60 },
  chunking: { start: 65, weight: 10 },
  embedding: { start: 75, weight: 25 },
} as const;

/**
 * Simulate progress during parsing stage based on elapsed time
 * Since Docling doesn't provide page-level callbacks, we estimate progress
 */
function simulateParsingProgress(
  startedAt: string,
  estimatedDurationSeconds: number = 120 // Default 2 minutes for parsing
): number {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  const progress = Math.min(95, (elapsed / estimatedDurationSeconds) * 100);
  return Math.round(progress);
}

/**
 * Processing job record from Supabase
 */
interface ProcessingJobPayload {
  id: string;
  document_id: string;
  status: string;
  progress_data: Json | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Hook result interface
 */
interface UseProcessingProgressResult {
  /** Map of document ID to progress data */
  progressMap: Map<string, ProgressData>;
  /** Whether realtime connection is active */
  isConnected: boolean;
}

/**
 * Parse JSON progress_data from database into typed ProgressData
 */
function parseProgressData(json: Json | null): ProgressData | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return null;
  }

  const data = json as Record<string, unknown>;

  // Validate required fields
  if (
    typeof data.stage !== 'string' ||
    typeof data.stage_progress !== 'number' ||
    typeof data.stage_name !== 'string' ||
    typeof data.total_progress !== 'number' ||
    typeof data.updated_at !== 'string'
  ) {
    return null;
  }

  // Validate stage is one of the expected values
  const validStages = ['downloading', 'parsing', 'chunking', 'embedding'];
  if (!validStages.includes(data.stage)) {
    return null;
  }

  return {
    stage: data.stage as ProgressData['stage'],
    stage_progress: data.stage_progress,
    stage_name: data.stage_name,
    estimated_seconds_remaining:
      typeof data.estimated_seconds_remaining === 'number'
        ? data.estimated_seconds_remaining
        : null,
    total_progress: data.total_progress,
    updated_at: data.updated_at,
  };
}

/**
 * Hook for subscribing to document processing progress via Supabase Realtime
 *
 * Story 5.12 (AC-5.12.4): Real-time progress updates
 * - Fetches initial progress data on mount (FIX: was missing)
 * - Subscribes to processing_jobs table updates
 * - Parses progress_data JSONB field
 * - Simulates parsing progress (Docling doesn't provide intermediate callbacks)
 * - Filters by document IDs on client-side (processing_jobs has no agency_id)
 * - Returns Map of document ID to progress data
 *
 * @param documentIds - Array of document IDs to track progress for
 */
export function useProcessingProgress(
  documentIds: string[]
): UseProcessingProgressResult {
  const [progressMap, setProgressMap] = useState<Map<string, ProgressData>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);

  // Track job metadata for simulated progress (started_at times)
  const jobMetadataRef = useRef<Map<string, { started_at: string | null }>>(new Map());

  // Polling interval ref for simulated progress
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling interval ref for fetching latest progress (fallback for missed realtime)
  const fetchPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Track consecutive fetch errors to implement backoff
  const consecutiveErrorsRef = useRef(0);

  // Update progress map with a job's data
  const updateProgressForJob = useCallback(
    (job: ProcessingJobPayload) => {
      // Store job metadata for simulation
      jobMetadataRef.current.set(job.document_id, { started_at: job.started_at });

      // If we have progress_data from the server, use it
      if (job.progress_data) {
        const progressData = parseProgressData(job.progress_data);
        if (progressData) {
          setProgressMap((prev) => {
            const next = new Map(prev);
            next.set(job.document_id, progressData);
            return next;
          });
          return;
        }
      }

      // No progress_data yet - create initial progress based on job status
      if (job.status === 'processing' || job.status === 'pending') {
        const initialProgress: ProgressData = {
          stage: 'downloading',
          stage_progress: 0,
          stage_name: 'Loading file...',
          estimated_seconds_remaining: null,
          total_progress: 0,
          updated_at: new Date().toISOString(),
        };
        setProgressMap((prev) => {
          const next = new Map(prev);
          // Only set if we don't already have data for this document
          if (!prev.has(job.document_id)) {
            next.set(job.document_id, initialProgress);
          }
          return next;
        });
      }
    },
    []
  );

  // Handle realtime payload
  const handleRealtimeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<ProcessingJobPayload>) => {
      if (payload.eventType !== 'UPDATE') return;

      const job = payload.new as ProcessingJobPayload;

      // Only process if this document is in our tracked list
      if (!documentIds.includes(job.document_id)) return;

      updateProgressForJob(job);
    },
    [documentIds, updateProgressForJob]
  );

  // Fetch progress data from database
  // Used for initial load AND as polling fallback for missed realtime updates
  const fetchProgressData = useCallback(async () => {
    if (documentIds.length === 0) return;

    // Stop polling if too many consecutive errors (likely auth issue)
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      return;
    }

    const supabase = createClient();
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('id, document_id, status, progress_data, started_at, created_at')
      .in('document_id', documentIds);

    if (error) {
      consecutiveErrorsRef.current++;
      // Only log first error, not repeated ones
      if (consecutiveErrorsRef.current === 1) {
        console.error('Failed to fetch processing progress:', error);
      }
      // Stop polling after max errors
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn('Stopping processing progress polling due to repeated errors');
        if (fetchPollingRef.current) {
          clearInterval(fetchPollingRef.current);
          fetchPollingRef.current = null;
        }
      }
      return;
    }

    // Reset error count on successful fetch
    consecutiveErrorsRef.current = 0;

    if (jobs && jobs.length > 0) {
      for (const job of jobs) {
        updateProgressForJob(job as ProcessingJobPayload);
      }
    }
  }, [documentIds, updateProgressForJob]);

  // Fetch initial progress data on mount
  useEffect(() => {
    if (documentIds.length === 0) {
      setProgressMap(new Map());
      jobMetadataRef.current.clear();
      return;
    }

    // Fetch immediately on mount
    fetchProgressData();
  }, [documentIds, fetchProgressData]);

  // CRITICAL FIX: Polling fallback to catch missed realtime updates
  // Realtime subscription may not be active when Edge Function sends early updates
  // Poll every 3 seconds to ensure we always have latest progress
  useEffect(() => {
    if (documentIds.length === 0) {
      if (fetchPollingRef.current) {
        clearInterval(fetchPollingRef.current);
        fetchPollingRef.current = null;
      }
      return;
    }

    // Poll for latest progress every 3 seconds
    fetchPollingRef.current = setInterval(() => {
      fetchProgressData();
    }, 3000);

    return () => {
      if (fetchPollingRef.current) {
        clearInterval(fetchPollingRef.current);
        fetchPollingRef.current = null;
      }
    };
  }, [documentIds, fetchProgressData]);

  // Simulated progress polling for parsing stage
  // (Docling doesn't provide intermediate progress callbacks)
  useEffect(() => {
    if (documentIds.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Poll every 2 seconds to simulate progress during parsing
    pollingIntervalRef.current = setInterval(() => {
      setProgressMap((prev) => {
        let hasChanges = false;
        const next = new Map(prev);

        for (const [docId, progress] of prev) {
          // Only simulate progress during parsing stage
          if (progress.stage === 'parsing' && progress.stage_progress < 95) {
            const metadata = jobMetadataRef.current.get(docId);
            if (metadata?.started_at) {
              const simulatedProgress = simulateParsingProgress(metadata.started_at);

              // Only update if progress increased
              if (simulatedProgress > progress.stage_progress) {
                hasChanges = true;
                const totalProgress = Math.round(
                  STAGE_WEIGHTS.parsing.start +
                  (simulatedProgress / 100) * STAGE_WEIGHTS.parsing.weight
                );

                next.set(docId, {
                  ...progress,
                  stage_progress: simulatedProgress,
                  total_progress: totalProgress,
                  updated_at: new Date().toISOString(),
                });
              }
            }
          }
        }

        return hasChanges ? next : prev;
      });
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [documentIds]);

  // Set up realtime subscription
  useEffect(() => {
    // Don't subscribe if no documents to track
    if (documentIds.length === 0) {
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupChannel = () => {
      // Subscribe to all processing_jobs updates, filter client-side
      // This is simple and efficient for low-volume processing
      channel = supabase
        .channel('processing-progress')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'processing_jobs',
          },
          (payload) => {
            handleRealtimeChange(
              payload as RealtimePostgresChangesPayload<ProcessingJobPayload>
            );
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error for processing_jobs');
          }
        });
    };

    setupChannel();

    // Cleanup on unmount or documentIds change
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [documentIds, handleRealtimeChange]);

  // Clean up progress for documents no longer being tracked
  useEffect(() => {
    setProgressMap((prev) => {
      const next = new Map<string, ProgressData>();
      for (const [docId, progress] of prev) {
        if (documentIds.includes(docId)) {
          next.set(docId, progress);
        }
      }
      // Only update if something changed
      if (next.size !== prev.size) {
        return next;
      }
      return prev;
    });

    // Clean up metadata too
    for (const docId of jobMetadataRef.current.keys()) {
      if (!documentIds.includes(docId)) {
        jobMetadataRef.current.delete(docId);
      }
    }
  }, [documentIds]);

  return {
    progressMap,
    isConnected,
  };
}
