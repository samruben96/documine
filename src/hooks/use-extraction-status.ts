'use client';

/**
 * useExtractionStatus Hook
 *
 * Story 11.7: Comparison Page - Extraction Status Handling
 * AC-11.7.4: Realtime Status Updates
 *
 * Subscribes to extraction_status changes for selected documents
 * via Supabase Realtime. Updates automatically when extraction completes.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ExtractionStatus } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DocumentExtractionState {
  /** Current extraction status */
  status: ExtractionStatus | null;
  /** Whether extraction_data exists */
  hasData: boolean;
}

interface UseExtractionStatusResult {
  /** Map of document ID to extraction status */
  statusMap: Record<string, DocumentExtractionState>;
  /** Whether initial fetch is still loading (prevents race condition on first selection) */
  isLoading: boolean;
  /** Whether the Realtime connection is active */
  isConnected: boolean;
  /** Force refresh from database */
  refresh: () => Promise<void>;
}

/**
 * Hook for subscribing to extraction_status changes via Supabase Realtime
 *
 * @param documentIds - Array of document IDs to monitor
 * @returns Object with statusMap, connection state, and refresh function
 */
export function useExtractionStatus(
  documentIds: string[]
): UseExtractionStatusResult {
  const [statusMap, setStatusMap] = useState<Record<string, DocumentExtractionState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Track which document IDs we've fetched to detect new selections
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  // Fetch initial status and extraction_data presence
  const fetchStatuses = useCallback(async (idsToFetch?: string[]) => {
    const targetIds = idsToFetch || documentIds;
    if (targetIds.length === 0) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('documents')
      .select('id, extraction_status, extraction_data')
      .in('id', targetIds);

    if (error) {
      console.error('Failed to fetch extraction statuses:', error);
      return;
    }

    if (data) {
      setStatusMap((prev) => {
        const newMap = { ...prev };
        for (const doc of data) {
          newMap[doc.id] = {
            status: doc.extraction_status as ExtractionStatus | null,
            hasData: doc.extraction_data !== null,
          };
          fetchedIdsRef.current.add(doc.id);
        }
        return newMap;
      });
    }
  }, [documentIds]);

  // Set up Realtime subscription
  useEffect(() => {
    if (documentIds.length === 0) {
      setStatusMap({});
      setIsLoading(false);
      fetchedIdsRef.current.clear();
      return;
    }

    const supabase = createClient();

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Find new document IDs that haven't been fetched yet
    const newIds = documentIds.filter(id => !fetchedIdsRef.current.has(id));

    // Set loading if we have new IDs to fetch
    if (newIds.length > 0) {
      setIsLoading(true);
      // Initial fetch for new IDs only
      fetchStatuses(newIds).finally(() => {
        setIsLoading(false);
      });
    }

    // Create filter for document IDs
    // Note: Supabase filter syntax for 'in' with multiple IDs
    const filterValue = documentIds.join(',');

    // Subscribe to changes
    const channel = supabase
      .channel(`extraction-status-${documentIds.slice(0, 3).join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=in.(${filterValue})`,
        },
        (payload) => {
          const newDoc = payload.new as {
            id: string;
            extraction_status: ExtractionStatus | null;
            extraction_data: unknown | null;
          };

          setStatusMap((prev) => ({
            ...prev,
            [newDoc.id]: {
              status: newDoc.extraction_status,
              hasData: newDoc.extraction_data !== null,
            },
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [documentIds, fetchStatuses]);

  return {
    statusMap,
    isLoading,
    isConnected,
    refresh: fetchStatuses,
  };
}

/**
 * Hook for triggering extraction retry
 *
 * Story 11.8: Retry extraction for documents with failed extraction_status
 *
 * @returns Function to retry extraction for a document
 */
export function useExtractionRetry(): {
  retry: (documentId: string) => Promise<void>;
  isRetrying: boolean;
  error: string | null;
} {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(async (documentId: string) => {
    setIsRetrying(true);
    setError(null);

    try {
      // Use extraction-specific retry endpoint (Story 11.8)
      // This is for documents that are 'ready' but have 'failed' extraction_status
      const response = await fetch(`/api/documents/${documentId}/retry-extraction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to retry extraction');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Retry failed';
      setError(message);
      console.error('Extraction retry failed:', err);
      throw err; // Re-throw so caller can handle
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return { retry, isRetrying, error };
}
