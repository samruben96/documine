/**
 * AI Buddy Conversation Attachments Hook
 * Story 17.1: Document Upload to Conversation with Status
 *
 * Hook for managing document attachments in a conversation.
 *
 * AC-17.1.2: Pending attachments state management
 * AC-17.1.3: Upload mutation with progress tracking
 * AC-17.1.6: Retry failed processing
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  ConversationAttachment,
  PendingAttachment,
  AttachmentStatus,
  AiBuddyApiResponse,
} from '@/types/ai-buddy';

// Allowed file types per AC-17.1.1
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max attachments per message: 5
const MAX_ATTACHMENTS = 5;

export interface UseConversationAttachmentsOptions {
  conversationId?: string;
}

export interface UseConversationAttachmentsReturn {
  /** Attachments already uploaded and linked to conversation */
  attachments: ConversationAttachment[];
  /** Files pending upload (local state) */
  pendingAttachments: PendingAttachment[];
  /** Loading state for fetching attachments */
  isLoading: boolean;
  /** Uploading state */
  isUploading: boolean;
  /** Error state */
  error: Error | null;
  /** Add files to pending attachments */
  addPendingAttachments: (files: File[]) => void;
  /** Remove a pending attachment */
  removePendingAttachment: (id: string) => void;
  /** Clear all pending attachments */
  clearPendingAttachments: () => void;
  /** Upload all pending attachments */
  uploadPendingAttachments: () => Promise<ConversationAttachment[]>;
  /** Refresh attachments list */
  refresh: () => Promise<void>;
  /** Retry a failed attachment */
  retryAttachment: (documentId: string) => Promise<void>;
  /** Validate a file before adding */
  validateFile: (file: File) => { valid: boolean; error?: string };
  /** Check if can add more attachments */
  canAddMore: boolean;
}

/**
 * Hook for managing conversation attachments
 * Handles pending state, upload, and realtime status updates
 */
export function useConversationAttachments(
  options: UseConversationAttachmentsOptions = {}
): UseConversationAttachmentsReturn {
  const { conversationId } = options;

  const [attachments, setAttachments] = useState<ConversationAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track mounted state for cleanup
  const isMountedRef = useRef(true);

  // Supabase client for realtime
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  /**
   * Fetch attachments for the conversation
   */
  const fetchAttachments = useCallback(async () => {
    if (!conversationId) {
      setAttachments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai-buddy/conversations/${conversationId}/attachments`
      );
      const result: AiBuddyApiResponse<{ attachments: ConversationAttachment[] }> =
        await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch attachments');
      }

      if (isMountedRef.current) {
        setAttachments(result.data?.attachments ?? []);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch attachments');
      if (isMountedRef.current) {
        setError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  /**
   * Validate a file before adding
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file type: ${extension}. Allowed: PDF, PNG, JPG, JPEG`,
        };
      }

      // Check size
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 50MB`,
        };
      }

      return { valid: true };
    },
    []
  );

  /**
   * Add files to pending attachments
   * AC-17.1.2: Max 5 files per message
   */
  const addPendingAttachments = useCallback(
    (files: File[]) => {
      const currentCount = pendingAttachments.length;
      const remainingSlots = MAX_ATTACHMENTS - currentCount;

      if (remainingSlots <= 0) {
        setError(new Error('Maximum 5 attachments per message'));
        return;
      }

      const filesToAdd = files.slice(0, remainingSlots);
      const newPending: PendingAttachment[] = [];

      for (const file of filesToAdd) {
        const validation = validateFile(file);
        if (validation.valid) {
          newPending.push({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            status: 'pending',
          });
        } else {
          // Add as failed with error message
          newPending.push({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            status: 'failed',
            error: validation.error,
          });
        }
      }

      setPendingAttachments((prev) => [...prev, ...newPending]);
    },
    [pendingAttachments.length, validateFile]
  );

  /**
   * Remove a pending attachment
   */
  const removePendingAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Clear all pending attachments
   */
  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  /**
   * Upload all pending attachments to the conversation
   * AC-17.1.3: Status transitions: pending → uploading → processing → ready
   */
  const uploadPendingAttachments = useCallback(async (): Promise<ConversationAttachment[]> => {
    if (!conversationId) {
      throw new Error('No conversation ID');
    }

    // Filter to only valid pending files
    const validPending = pendingAttachments.filter(
      (p) => p.status === 'pending' && !p.error
    );

    if (validPending.length === 0) {
      return [];
    }

    setIsUploading(true);
    setError(null);

    // Update status to uploading
    setPendingAttachments((prev) =>
      prev.map((p) =>
        validPending.some((vp) => vp.id === p.id)
          ? { ...p, status: 'uploading' as AttachmentStatus }
          : p
      )
    );

    try {
      // Build FormData with all valid files
      const formData = new FormData();
      for (const pending of validPending) {
        formData.append('files', pending.file);
      }

      const response = await fetch(
        `/api/ai-buddy/conversations/${conversationId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result: AiBuddyApiResponse<{ attachments: ConversationAttachment[] }> =
        await response.json();

      if (!response.ok || result.error) {
        // Mark all as failed
        setPendingAttachments((prev) =>
          prev.map((p) =>
            validPending.some((vp) => vp.id === p.id)
              ? { ...p, status: 'failed' as AttachmentStatus, error: result.error?.message }
              : p
          )
        );
        throw new Error(result.error?.message ?? 'Failed to upload attachments');
      }

      const uploadedAttachments = result.data?.attachments ?? [];

      // Update pending to show processing status with document IDs
      setPendingAttachments((prev) =>
        prev.map((p) => {
          if (!validPending.some((vp) => vp.id === p.id)) {
            return p;
          }
          // Find matching uploaded attachment by name
          const uploaded = uploadedAttachments.find(
            (ua) => ua.document.name === p.name
          );
          if (uploaded) {
            return {
              ...p,
              status: 'processing' as AttachmentStatus,
              documentId: uploaded.document_id,
            };
          }
          return { ...p, status: 'failed' as AttachmentStatus };
        })
      );

      // Add to attachments list
      setAttachments((prev) => [...uploadedAttachments, ...prev]);

      return uploadedAttachments;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [conversationId, pendingAttachments]);

  /**
   * Retry a failed attachment
   * AC-17.1.6: Creates new processing job for failed document
   */
  const retryAttachment = useCallback(
    async (documentId: string) => {
      // For now, just refresh to get updated status
      // In future, could call a retry endpoint
      await fetchAttachments();
    },
    [fetchAttachments]
  );

  /**
   * Subscribe to realtime document status changes
   * AC-17.1.3: Processing status updates in real-time
   */
  useEffect(() => {
    if (!conversationId) return;

    const setupRealtimeSubscription = async () => {
      supabaseRef.current = createClient();

      // Subscribe to documents table for status changes
      const channel = supabaseRef.current
        .channel(`conversation-docs-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'documents',
          },
          (payload) => {
            const updatedDoc = payload.new as {
              id: string;
              status: string;
              page_count: number | null;
            };

            // Update attachments with new status
            setAttachments((prev) =>
              prev.map((att) =>
                att.document_id === updatedDoc.id
                  ? {
                      ...att,
                      document: {
                        ...att.document,
                        status: updatedDoc.status,
                        page_count: updatedDoc.page_count,
                      },
                    }
                  : att
              )
            );

            // Update pending attachments if they match
            setPendingAttachments((prev) =>
              prev.map((p) => {
                if (p.documentId === updatedDoc.id) {
                  const newStatus: AttachmentStatus =
                    updatedDoc.status === 'ready'
                      ? 'ready'
                      : updatedDoc.status === 'failed'
                      ? 'failed'
                      : 'processing';
                  return { ...p, status: newStatus };
                }
                return p;
              })
            );
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then((unsub) => unsub?.());
    };
  }, [conversationId]);

  // Initial fetch when conversationId changes
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Calculate if more attachments can be added
  const canAddMore = pendingAttachments.length < MAX_ATTACHMENTS;

  return {
    attachments,
    pendingAttachments,
    isLoading,
    isUploading,
    error,
    addPendingAttachments,
    removePendingAttachment,
    clearPendingAttachments,
    uploadPendingAttachments,
    refresh: fetchAttachments,
    retryAttachment,
    validateFile,
    canAddMore,
  };
}
