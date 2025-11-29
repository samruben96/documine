'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database.types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type Document = Tables<'documents'>;

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
  /** Whether realtime connection is active */
  isConnected: boolean;
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
  const [isConnected, setIsConnected] = useState(false);

  // Track previous document statuses to detect transitions
  const previousStatusRef = useRef<Map<string, string>>(new Map());

  // Update previous status map when documents change
  useEffect(() => {
    const statusMap = new Map<string, string>();
    documents.forEach((doc) => {
      statusMap.set(doc.id, doc.status);
    });
    previousStatusRef.current = statusMap;
  }, [documents]);

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
            handleRealtimeChange(payload as RealtimePostgresChangesPayload<Document>);
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error for documents');
          }
        });
    };

    setupChannel();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [agencyId, handleRealtimeChange]);

  return {
    documents,
    setDocuments,
    isConnected,
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
