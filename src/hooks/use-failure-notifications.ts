'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { classifyError, getErrorSuggestedAction } from '@/lib/documents/error-classification';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Story 11.5 (AC-11.5.3): Failure Notifications Hook
 *
 * Subscribes to processing_jobs table changes and shows toast notifications
 * when documents fail processing. Uses error classification to provide
 * user-friendly messages and suggested actions.
 *
 * Features:
 * - Realtime subscription to processing_jobs status changes
 * - User-friendly error messages (not technical jargon)
 * - Suggested actions based on error category
 * - Deduplication to prevent duplicate toasts
 * - Action button to navigate to document
 */

interface ProcessingJobPayload {
  id: string;
  document_id: string;
  status: string;
  error_message: string | null;
  error_category: string | null;
  error_code: string | null;
}

interface UseFailureNotificationsOptions {
  /** Agency ID to filter notifications */
  agencyId: string;
  /** Callback when user clicks "View Document" action */
  onViewDocument?: (documentId: string) => void;
  /** Whether notifications are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to show toast notifications when document processing fails
 *
 * @param options - Configuration options
 */
export function useFailureNotifications({
  agencyId,
  onViewDocument,
  enabled = true,
}: UseFailureNotificationsOptions): void {
  // Track shown document IDs to prevent duplicate toasts
  const shownFailures = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!agencyId || !enabled) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    // Subscribe to processing_jobs status changes
    channel = supabase
      .channel(`failure-notifications-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `agency_id=eq.${agencyId}`,
        },
        async (payload: RealtimePostgresChangesPayload<ProcessingJobPayload>) => {
          const newRecord = payload.new as ProcessingJobPayload;

          // Only handle transitions to 'failed' status
          if (newRecord?.status !== 'failed') return;

          // Skip if we've already shown this failure
          if (shownFailures.current.has(newRecord.document_id)) return;

          // Mark as shown to prevent duplicates
          shownFailures.current.add(newRecord.document_id);

          // Get document filename for the toast
          const { data: doc } = await supabase
            .from('documents')
            .select('filename, display_name')
            .eq('id', newRecord.document_id)
            .single();

          const filename = doc?.display_name || doc?.filename || 'Document';

          // Classify the error for user-friendly message
          const errorMessage = newRecord.error_message || 'Processing failed';
          const classification = classifyError(errorMessage);
          const suggestedAction = getErrorSuggestedAction(
            errorMessage,
            newRecord.document_id
          );

          // Show toast with error details
          // Build description as string (sonner handles string descriptions)
          const description = suggestedAction
            ? `${classification.userMessage}\n${suggestedAction}`
            : classification.userMessage;

          toast.error(`${filename} failed to process`, {
            description,
            duration: 10000, // 10 seconds for error toasts
            action: onViewDocument
              ? {
                  label: 'View',
                  onClick: () => onViewDocument(newRecord.document_id),
                }
              : undefined,
          });

          // Clean up shown failures after 5 minutes to allow re-notification
          // if the same document fails again after a retry
          setTimeout(() => {
            shownFailures.current.delete(newRecord.document_id);
          }, 5 * 60 * 1000);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [agencyId, enabled, onViewDocument]);
}

/**
 * Simpler hook that just returns failed document IDs
 * Useful for components that want to handle notifications themselves
 */
export function useFailedDocuments(agencyId: string): {
  failedDocumentIds: Set<string>;
} {
  const failedDocumentIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!agencyId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    channel = supabase
      .channel(`failed-docs-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload: RealtimePostgresChangesPayload<ProcessingJobPayload>) => {
          const newRecord = payload.new as ProcessingJobPayload;

          if (newRecord?.status === 'failed') {
            failedDocumentIds.current.add(newRecord.document_id);
          } else if (newRecord?.status === 'processing' || newRecord?.status === 'completed') {
            // Remove from failed if retried successfully
            failedDocumentIds.current.delete(newRecord.document_id);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [agencyId]);

  return { failedDocumentIds: failedDocumentIds.current };
}
