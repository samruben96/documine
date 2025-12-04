'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database.types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ConnectionState } from '@/components/ui/connection-indicator';

export type Document = Tables<'documents'>;

// Polling interval for status updates (fallback for missed realtime events)
const STATUS_POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_CONSECUTIVE_ERRORS = 3; // Stop polling after this many consecutive errors

interface UseDocumentStatusOptions {
  /** Agency ID for filtering realtime updates */
  agencyId: string;
  /** Initial documents to track */
  initialDocuments?: Document[];
  /** Callback when a document becomes ready (AC-4.2.6) */
  onDocumentReady?: (document: Document) => void;
  /** Callback when a document fails */
  onDocumentFailed?: (document: Document) => void;
}

interface UseDocumentStatusResult {
  /** Current list of documents with realtime status updates */
  documents: Document[];
  /** Update documents list (e.g., after new upload) */
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  /** Whether realtime connection is active (backward compatible) */
  isConnected: boolean;
  /** Story 6.6: Granular connection state for UI indicator */
  connectionState: ConnectionState;
}

/**
 * Hook for Supabase Realtime document status subscription
 *
 * Implements AC-4.2.8: Status persistence across navigation
 * - Subscribes to documents table changes filtered by agency_id
 * - Handles INSERT, UPDATE events for status changes
 * - Updates local state when document status changes
 * - Triggers toast notifications when processing completes (AC-4.2.6)
 */
export function useDocumentStatus({
  agencyId,
  initialDocuments = [],
  onDocumentReady,
  onDocumentFailed,
}: UseDocumentStatusOptions): UseDocumentStatusResult {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  // Track previous document statuses to detect transitions
  const previousStatusRef = useRef<Map<string, string>>(new Map());

  // Story 6.6: Use ref for realtime change handler to prevent effect re-runs
  // when onDocumentReady/onDocumentFailed callbacks change (they're often inline functions)
  const handleRealtimeChangeRef = useRef<((payload: RealtimePostgresChangesPayload<Document>) => void) | null>(null);

  // Polling interval ref for status updates
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track consecutive fetch errors to implement backoff
  const consecutiveErrorsRef = useRef(0);

  // Update previous status map when documents change
  useEffect(() => {
    const statusMap = new Map<string, string>();
    documents.forEach((doc) => {
      statusMap.set(doc.id, doc.status);
    });
    previousStatusRef.current = statusMap;
  }, [documents]);

  // Fetch latest document statuses from database
  const fetchDocumentStatuses = useCallback(async () => {
    if (!agencyId) return;

    // Stop polling if too many consecutive errors (likely auth issue)
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      return;
    }

    const supabase = createClient();
    const { data: latestDocs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      consecutiveErrorsRef.current++;
      // Only log first error, not repeated ones
      if (consecutiveErrorsRef.current === 1) {
        console.error('Failed to fetch document statuses:', error);
      }
      // Stop polling after max errors
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn('Stopping document status polling due to repeated errors');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      return;
    }

    // Reset error count on successful fetch
    consecutiveErrorsRef.current = 0;

    if (latestDocs && latestDocs.length > 0) {
      setDocuments((prev) => {
        // Track which IDs we've seen to avoid duplicates
        const seenIds = new Set<string>();

        // Merge: update existing docs with latest data, preserve order
        const mergedDocs: typeof latestDocs = [];

        // First, process docs from database (authoritative source)
        for (const latestDoc of latestDocs) {
          if (seenIds.has(latestDoc.id)) continue;
          seenIds.add(latestDoc.id);

          const existingDoc = prev.find((d) => d.id === latestDoc.id);
          const previousStatus = previousStatusRef.current.get(latestDoc.id);

          // Check for status transitions
          if (previousStatus && previousStatus !== latestDoc.status) {
            if (previousStatus !== 'ready' && latestDoc.status === 'ready') {
              toast.success(`${latestDoc.filename} is ready`, { duration: 4000 });
              onDocumentReady?.(latestDoc);
            } else if (previousStatus !== 'failed' && latestDoc.status === 'failed') {
              toast.error(`${latestDoc.filename} processing failed`);
              onDocumentFailed?.(latestDoc);
            }
          }

          mergedDocs.push(existingDoc ? { ...existingDoc, ...latestDoc } : latestDoc);
        }

        // Check if anything actually changed to avoid unnecessary re-renders
        const hasChanges = mergedDocs.some((doc, i) => {
          const prevDoc = prev[i];
          return !prevDoc || prevDoc.status !== doc.status || prevDoc.id !== doc.id;
        }) || mergedDocs.length !== prev.length;

        return hasChanges ? mergedDocs : prev;
      });
    }
  }, [agencyId, onDocumentReady, onDocumentFailed]);

  // Fetch latest status on mount (catches any changes that happened during navigation)
  useEffect(() => {
    if (agencyId) {
      fetchDocumentStatuses();
    }
  }, [agencyId, fetchDocumentStatuses]);

  // Handle realtime payload
  const handleRealtimeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Document>) => {
      const eventType = payload.eventType;

      if (eventType === 'INSERT') {
        const newDoc = payload.new as Document;
        setDocuments((prev) => {
          // Only add if not already in list
          if (prev.some((doc) => doc.id === newDoc.id)) {
            return prev;
          }
          return [newDoc, ...prev];
        });
      } else if (eventType === 'UPDATE') {
        const updatedDoc = payload.new as Document;
        const oldDoc = payload.old as Partial<Document>;
        const previousStatus = previousStatusRef.current.get(updatedDoc.id) || oldDoc.status;

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc
          )
        );

        // Detect status transitions (AC-4.2.6)
        if (previousStatus !== 'ready' && updatedDoc.status === 'ready') {
          // Document became ready - trigger success toast
          toast.success(`${updatedDoc.filename} is ready`, {
            duration: 4000, // AC-4.2.6: Auto-dismisses after 4 seconds
          });
          onDocumentReady?.(updatedDoc);
        } else if (previousStatus !== 'failed' && updatedDoc.status === 'failed') {
          // Document failed
          toast.error(`${updatedDoc.filename} processing failed`);
          onDocumentFailed?.(updatedDoc);
        }
      } else if (eventType === 'DELETE') {
        const deletedDoc = payload.old as Partial<Document>;
        if (deletedDoc.id) {
          setDocuments((prev) => prev.filter((doc) => doc.id !== deletedDoc.id));
        }
      }
    },
    [onDocumentReady, onDocumentFailed]
  );

  // Keep ref updated with latest handler (avoids effect re-runs when callbacks change)
  useEffect(() => {
    handleRealtimeChangeRef.current = handleRealtimeChange;
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!agencyId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupChannel = () => {
      channel = supabase
        .channel(`documents-${agencyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `agency_id=eq.${agencyId}`,
          },
          (payload) => {
            // Use ref to always call the latest handler without re-creating the channel
            handleRealtimeChangeRef.current?.(payload as RealtimePostgresChangesPayload<Document>);
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
            console.error('Realtime channel error for documents');
          } else if (status === 'TIMED_OUT') {
            setConnectionState('reconnecting');
          } else if (status === 'CLOSED') {
            setConnectionState('disconnected');
          }
          // For other statuses (like 'JOINING'), keep current state
        });
    };

    setupChannel();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [agencyId]); // Removed handleRealtimeChange - using ref instead to prevent flicker

  // Polling fallback: Fetch document statuses periodically
  // This catches any missed realtime events (race conditions, connection issues)
  // CRITICAL: Always poll to detect status changes, not just when processing docs exist
  // This fixes the chicken-and-egg problem where we need to detect the CHANGE to processing
  useEffect(() => {
    if (!agencyId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Always poll - this catches status changes we might miss from realtime
    // The polling function is smart about avoiding unnecessary state updates
    pollingIntervalRef.current = setInterval(() => {
      fetchDocumentStatuses();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [agencyId, fetchDocumentStatuses]);

  return {
    documents,
    setDocuments,
    isConnected: connectionState === 'connected',
    connectionState,
  };
}

/**
 * Hook to get user's agency ID for realtime subscriptions
 */
export function useAgencyId(): { agencyId: string | null; isLoading: boolean } {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgencyId() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('agency_id')
          .eq('id', user.id)
          .single();

        if (userData?.agency_id) {
          setAgencyId(userData.agency_id);
        }
      } catch (error) {
        console.error('Failed to fetch agency ID:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgencyId();
  }, []);

  return { agencyId, isLoading };
}
