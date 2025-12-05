'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Json } from '@/types/database.types';
import type { ConnectionState } from '@/components/ui/connection-indicator';

/**
 * Story 11.2: Processing stage type
 * Updated to include 'queued' stage from Story 11.1 async architecture
 */
export type ProcessingStage = 'queued' | 'downloading' | 'parsing' | 'chunking' | 'embedding' | 'analyzing' | 'completed';

/**
 * Story 5.12: Processing progress data interface
 * Matches Edge Function progress_data JSON structure
 * Story 10.12: Added 'analyzing' stage for quote extraction
 * Story 11.2: Now also populated from direct stage/progress_percent columns
 */
export interface ProgressData {
  stage: ProcessingStage;
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
 * Story 10.12: Added 'analyzing' stage for quote extraction
 * Story 11.2: Added 'queued' stage for async processing
 */
const STAGE_WEIGHTS = {
  queued: { start: 0, weight: 0 },
  downloading: { start: 0, weight: 5 },
  parsing: { start: 5, weight: 55 },
  chunking: { start: 60, weight: 10 },
  embedding: { start: 70, weight: 20 },
  analyzing: { start: 90, weight: 10 },
} as const;

/**
 * Story 11.2: Stage labels for UI display
 */
export const STAGE_LABELS: Record<ProcessingStage, string> = {
  queued: 'Waiting in queue...',
  downloading: 'Downloading file...',
  parsing: 'Parsing document...',
  chunking: 'Preparing content...',
  embedding: 'Indexing for search...',
  analyzing: 'Analyzing with AI...',
  completed: 'Processing complete!',
};

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
 * Story 11.1: Added stage, progress_percent, agency_id, retry_count columns
 */
interface ProcessingJobPayload {
  id: string;
  document_id: string;
  agency_id: string | null;
  status: string;
  stage: string | null;
  progress_percent: number | null;
  progress_data: Json | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  retry_count: number | null;
}

/**
 * Story 11.2: Job metadata for elapsed time and queue position
 */
export interface JobMetadata {
  createdAt: string;
  startedAt: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
}

/**
 * Story 11.2: Queue position info
 */
export interface QueueInfo {
  position: number;
  totalPending: number;
  estimatedWaitSeconds: number | null;
}

/**
 * Hook result interface
 */
interface UseProcessingProgressResult {
  /** Map of document ID to progress data */
  progressMap: Map<string, ProgressData>;
  /** Map of document ID to error message (for failed jobs) - Story 5.13 */
  errorMap: Map<string, string>;
  /** Story 11.2: Map of document ID to job metadata */
  jobMetadataMap: Map<string, JobMetadata>;
  /** Story 11.2: Map of document ID to queue info (for pending jobs) */
  queueInfoMap: Map<string, QueueInfo>;
  /** Whether realtime connection is active (backward compatible) */
  isConnected: boolean;
  /** Story 6.6: Granular connection state for UI indicator */
  connectionState: ConnectionState;
}

/**
 * Story 5.14 (AC-5.14.3): Track documents that have received server progress data
 * to prevent simulated progress from overriding actual server data
 */
type ProgressSource = 'server' | 'simulated';

/**
 * Story 11.2: Valid processing stages
 */
const VALID_STAGES: ProcessingStage[] = ['queued', 'downloading', 'parsing', 'chunking', 'embedding', 'analyzing', 'completed'];

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
  // Story 11.2: Added 'queued' and 'completed' stages
  if (!VALID_STAGES.includes(data.stage as ProcessingStage)) {
    return null;
  }

  return {
    stage: data.stage as ProcessingStage,
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
 * Story 11.2: Create ProgressData from direct columns (stage, progress_percent)
 * Used when progress_data JSONB is not available but direct columns are
 */
function createProgressFromColumns(
  stage: string | null,
  progressPercent: number | null
): ProgressData | null {
  if (!stage || !VALID_STAGES.includes(stage as ProcessingStage)) {
    return null;
  }

  const typedStage = stage as ProcessingStage;

  return {
    stage: typedStage,
    stage_progress: progressPercent ?? 0,
    stage_name: STAGE_LABELS[typedStage] || 'Processing...',
    estimated_seconds_remaining: null,
    total_progress: progressPercent ?? 0,
    updated_at: new Date().toISOString(),
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
  // Story 5.13: Track error messages for failed jobs
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  // Story 11.2: Track job metadata for elapsed time
  const [jobMetadataMap, setJobMetadataMap] = useState<Map<string, JobMetadata>>(new Map());
  // Story 11.2: Track queue info for pending jobs
  const [queueInfoMap, setQueueInfoMap] = useState<Map<string, QueueInfo>>(new Map());
  // Story 6.6: Track granular connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  // Track job metadata for simulated progress (started_at times)
  const jobMetadataRef = useRef<Map<string, { started_at: string | null }>>(new Map());

  // Story 6.6: Use ref for realtime change handler to prevent effect re-runs
  const handleRealtimeChangeRef = useRef<((payload: RealtimePostgresChangesPayload<ProcessingJobPayload>) => void) | null>(null);

  // Story 5.14 (AC-5.14.3): Track which documents have received server progress data
  // to prevent simulated progress from overriding actual server data
  const progressSourceRef = useRef<Map<string, ProgressSource>>(new Map());

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

      // Story 11.2: Update job metadata for elapsed time tracking
      setJobMetadataMap((prev) => {
        const next = new Map(prev);
        next.set(job.document_id, {
          createdAt: job.created_at,
          startedAt: job.started_at,
          status: job.status as JobMetadata['status'],
          retryCount: job.retry_count ?? 0,
        });
        return next;
      });

      // Story 5.13: Track error messages for failed jobs
      if (job.status === 'failed' && job.error_message) {
        setErrorMap((prev) => {
          const next = new Map(prev);
          next.set(job.document_id, job.error_message!);
          return next;
        });
      }

      // Story 11.2: Try direct columns first (stage, progress_percent from Story 11.1)
      // These are more reliable than progress_data JSONB
      if (job.stage && job.progress_percent !== null) {
        const progressData = createProgressFromColumns(job.stage, job.progress_percent);
        if (progressData) {
          progressSourceRef.current.set(job.document_id, 'server');

          setProgressMap((prev) => {
            const next = new Map(prev);
            const existing = prev.get(job.document_id);

            // Story 5.14 (AC-5.14.1): Monotonic progress
            if (existing && progressData.total_progress < existing.total_progress) {
              return prev;
            }

            next.set(job.document_id, progressData);
            return next;
          });
          return;
        }
      }

      // Fallback: If we have progress_data JSONB from the server, use it
      // Story 5.14 (AC-5.14.3): Mark as server-sourced to prevent simulation override
      if (job.progress_data) {
        const progressData = parseProgressData(job.progress_data);
        if (progressData) {
          // Mark this document as having server progress (stops simulation)
          progressSourceRef.current.set(job.document_id, 'server');

          setProgressMap((prev) => {
            const next = new Map(prev);
            const existing = prev.get(job.document_id);

            // Story 5.14 (AC-5.14.1): Monotonic progress - only update if progress increased
            // This prevents visual jumping when polling returns older data
            if (existing && progressData.total_progress < existing.total_progress) {
              return prev; // Don't regress
            }

            next.set(job.document_id, progressData);
            return next;
          });
          return;
        }
      }

      // No progress data yet - create initial progress based on job status
      // Story 11.2: Use 'queued' for pending status
      if (job.status === 'processing' || job.status === 'pending') {
        const initialProgress: ProgressData = {
          stage: job.status === 'pending' ? 'queued' : 'downloading',
          stage_progress: 0,
          stage_name: job.status === 'pending' ? 'Waiting in queue...' : 'Loading file...',
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

  // Keep ref updated with latest handler (avoids effect re-runs)
  useEffect(() => {
    handleRealtimeChangeRef.current = handleRealtimeChange;
  });

  // Fetch progress data from database
  // Used for initial load AND as polling fallback for missed realtime updates
  const fetchProgressData = useCallback(async () => {
    if (documentIds.length === 0) return;

    // Stop polling if too many consecutive errors (likely auth issue)
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      return;
    }

    const supabase = createClient();
    // Story 11.2: Include stage, progress_percent, agency_id, retry_count columns
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('id, document_id, agency_id, status, stage, progress_percent, progress_data, error_message, started_at, completed_at, created_at, retry_count')
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: clear state when tracking no documents
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
          // Story 5.14 (AC-5.14.3): Skip simulation for documents with server progress
          // This prevents simulated progress from overriding real server data
          if (progressSourceRef.current.get(docId) === 'server') {
            continue;
          }

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
    // Story 6.6: When inactive, set state to 'connected' since there's nothing to connect to
    if (documentIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: no connection needed when not tracking
      setConnectionState('connected');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: reset to connecting when setting up channel
    setConnectionState('connecting');

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
            // Use ref to always call the latest handler without re-creating the channel
            handleRealtimeChangeRef.current?.(
              payload as RealtimePostgresChangesPayload<ProcessingJobPayload>
            );
          }
        )
        .subscribe((status) => {
          // Story 6.6: Map Supabase channel statuses to ConnectionState
          // Note: Supabase may send multiple status callbacks during connection
          // We only update state on definitive status changes to prevent flickering
          if (status === 'SUBSCRIBED') {
            setConnectionState('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionState('disconnected');
            console.error('Realtime channel error for processing_jobs');
          } else if (status === 'TIMED_OUT') {
            setConnectionState('reconnecting');
          } else if (status === 'CLOSED') {
            setConnectionState('disconnected');
          }
          // For other statuses (like 'JOINING'), keep current state
        });
    };

    setupChannel();

    // Cleanup on unmount or documentIds change
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [documentIds]); // Removed handleRealtimeChange - using ref instead to prevent flicker

  // Clean up progress for documents no longer being tracked
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: filter map when documentIds changes
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

    // Story 11.2: Clean up job metadata map
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: filter map when documentIds changes
    setJobMetadataMap((prev) => {
      const next = new Map<string, JobMetadata>();
      for (const [docId, metadata] of prev) {
        if (documentIds.includes(docId)) {
          next.set(docId, metadata);
        }
      }
      if (next.size !== prev.size) {
        return next;
      }
      return prev;
    });

    // Story 11.2: Clean up queue info map
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: filter map when documentIds changes
    setQueueInfoMap((prev) => {
      const next = new Map<string, QueueInfo>();
      for (const [docId, info] of prev) {
        if (documentIds.includes(docId)) {
          next.set(docId, info);
        }
      }
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

    // Story 5.14: Clean up progress source tracking
    for (const docId of progressSourceRef.current.keys()) {
      if (!documentIds.includes(docId)) {
        progressSourceRef.current.delete(docId);
      }
    }
  }, [documentIds]);

  // Story 11.2: Fetch queue positions for pending jobs
  useEffect(() => {
    if (documentIds.length === 0) return;

    const fetchQueuePositions = async () => {
      const supabase = createClient();

      // Get pending jobs to calculate queue positions
      const pendingDocIds: string[] = [];
      for (const [docId, metadata] of jobMetadataMap) {
        if (metadata.status === 'pending') {
          pendingDocIds.push(docId);
        }
      }

      if (pendingDocIds.length === 0) {
        // Clear queue info if no pending jobs
        if (queueInfoMap.size > 0) {
          setQueueInfoMap(new Map());
        }
        return;
      }

      // Get total pending count
      const { count: totalPending } = await supabase
        .from('processing_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // For each pending doc, get its queue position
      const newQueueInfo = new Map<string, QueueInfo>();
      for (const docId of pendingDocIds) {
        const { data: positionResult } = await supabase
          .rpc('get_queue_position', { p_document_id: docId });

        const position = positionResult ?? 1;
        // Estimate ~2 minutes per document (120 seconds average processing time)
        const estimatedWaitSeconds = position > 1 ? (position - 1) * 120 : null;

        newQueueInfo.set(docId, {
          position,
          totalPending: totalPending ?? 0,
          estimatedWaitSeconds,
        });
      }

      setQueueInfoMap(newQueueInfo);
    };

    // Fetch queue positions initially and every 10 seconds for pending jobs
    fetchQueuePositions();
    const interval = setInterval(fetchQueuePositions, 10000);

    return () => clearInterval(interval);
  }, [documentIds, jobMetadataMap, queueInfoMap.size]);

  return {
    progressMap,
    errorMap,
    jobMetadataMap,
    queueInfoMap,
    isConnected: connectionState === 'connected',
    connectionState,
  };
}
