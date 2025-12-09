/**
 * AI Buddy Project Documents Hook
 * Story 17.2: Project Document Management
 *
 * Hook for managing documents attached to a project.
 *
 * AC-17.2.2: Upload documents to project
 * AC-17.2.3: Add documents from library
 * AC-17.2.4: Library documents link without duplicating
 * AC-17.2.5: Remove documents from project
 * AC-17.2.7: Includes extraction_data for comparison context
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  ProjectDocument,
  AiBuddyApiResponse,
  ProjectDocumentRemoveResponse,
} from '@/types/ai-buddy';

// Max 25 documents per project per tech-spec
const MAX_DOCUMENTS_PER_PROJECT = 25;

export interface UseProjectDocumentsOptions {
  projectId: string | null;
}

export interface UseProjectDocumentsReturn {
  /** Documents attached to the project */
  documents: ProjectDocument[];
  /** Loading state for fetching documents */
  isLoading: boolean;
  /** Adding documents in progress */
  isAdding: boolean;
  /** Uploading files in progress */
  isUploading: boolean;
  /** Removing document in progress */
  isRemoving: boolean;
  /** Error state */
  error: Error | null;
  /** Add existing library documents to project */
  addDocuments: (documentIds: string[]) => Promise<ProjectDocument[]>;
  /** Upload new files to project */
  uploadDocuments: (files: File[]) => Promise<ProjectDocument[]>;
  /** Remove a document from project (keeps in library) */
  removeDocument: (documentId: string) => Promise<void>;
  /** Refresh documents list */
  refresh: () => Promise<void>;
  /** Check if can add more documents */
  canAddMore: boolean;
  /** Number of remaining slots */
  remainingSlots: number;
}

/**
 * Hook for managing project documents
 * Handles list, add, upload, remove, and realtime status updates
 */
export function useProjectDocuments(
  options: UseProjectDocumentsOptions
): UseProjectDocumentsReturn {
  const { projectId } = options;

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track mounted state for cleanup
  const isMountedRef = useRef(true);

  // Supabase client for realtime
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Track document IDs for realtime filtering
  const documentIdsRef = useRef<Set<string>>(new Set());

  /**
   * Fetch documents for the project
   */
  const fetchDocuments = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      documentIdsRef.current.clear();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai-buddy/projects/${projectId}/documents`
      );
      const result: AiBuddyApiResponse<{ documents: ProjectDocument[] }> =
        await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch documents');
      }

      if (isMountedRef.current) {
        const docs = result.data?.documents ?? [];
        setDocuments(docs);
        // Update document IDs for realtime filtering
        documentIdsRef.current = new Set(docs.map((d) => d.document_id));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch documents');
      if (isMountedRef.current) {
        setError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  /**
   * Add existing library documents to project
   * AC-17.2.3: Select from Library with search/filter
   * AC-17.2.4: Links without duplicating
   */
  const addDocuments = useCallback(
    async (documentIds: string[]): Promise<ProjectDocument[]> => {
      if (!projectId) {
        throw new Error('No project selected');
      }

      if (documentIds.length === 0) {
        return [];
      }

      // Check remaining slots
      const currentCount = documents.length;
      const remainingSlots = MAX_DOCUMENTS_PER_PROJECT - currentCount;
      if (documentIds.length > remainingSlots) {
        throw new Error(
          `Cannot add ${documentIds.length} documents. Only ${remainingSlots} slots remaining (max ${MAX_DOCUMENTS_PER_PROJECT}).`
        );
      }

      setIsAdding(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/ai-buddy/projects/${projectId}/documents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentIds }),
          }
        );

        const result: AiBuddyApiResponse<{ documents: ProjectDocument[] }> =
          await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to add documents');
        }

        const addedDocs = result.data?.documents ?? [];

        // Update local state - add new docs to beginning
        if (isMountedRef.current) {
          setDocuments((prev) => {
            // Filter out any duplicates
            const existingIds = new Set(prev.map((d) => d.document_id));
            const newDocs = addedDocs.filter((d) => !existingIds.has(d.document_id));
            // Update document IDs for realtime
            newDocs.forEach((d) => documentIdsRef.current.add(d.document_id));
            return [...newDocs, ...prev];
          });
        }

        return addedDocs;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add documents');
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsAdding(false);
        }
      }
    },
    [projectId, documents.length]
  );

  /**
   * Upload new files to project
   * AC-17.2.2: Uploaded documents appear in project's document list
   */
  const uploadDocuments = useCallback(
    async (files: File[]): Promise<ProjectDocument[]> => {
      if (!projectId) {
        throw new Error('No project selected');
      }

      if (files.length === 0) {
        return [];
      }

      // Check remaining slots
      const currentCount = documents.length;
      const remainingSlots = MAX_DOCUMENTS_PER_PROJECT - currentCount;
      if (files.length > remainingSlots) {
        throw new Error(
          `Cannot upload ${files.length} files. Only ${remainingSlots} slots remaining (max ${MAX_DOCUMENTS_PER_PROJECT}).`
        );
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        for (const file of files) {
          formData.append('files', file);
        }

        const response = await fetch(
          `/api/ai-buddy/projects/${projectId}/documents`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const result: AiBuddyApiResponse<{ documents: ProjectDocument[] }> =
          await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to upload documents');
        }

        const uploadedDocs = result.data?.documents ?? [];

        // Update local state - add new docs to beginning
        if (isMountedRef.current) {
          setDocuments((prev) => {
            // Update document IDs for realtime
            uploadedDocs.forEach((d) => documentIdsRef.current.add(d.document_id));
            return [...uploadedDocs, ...prev];
          });
        }

        return uploadedDocs;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to upload documents');
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [projectId, documents.length]
  );

  /**
   * Remove a document from project
   * AC-17.2.5: Removes from project context
   * AC-17.2.6: Keeps in library (historical citations remain valid)
   */
  const removeDocument = useCallback(
    async (documentId: string): Promise<void> => {
      if (!projectId) {
        throw new Error('No project selected');
      }

      // Optimistic update
      const previousDocuments = documents;
      setDocuments((prev) => prev.filter((d) => d.document_id !== documentId));
      documentIdsRef.current.delete(documentId);

      setIsRemoving(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/ai-buddy/projects/${projectId}/documents/${documentId}`,
          {
            method: 'DELETE',
          }
        );

        const result: AiBuddyApiResponse<ProjectDocumentRemoveResponse> =
          await response.json();

        if (!response.ok || result.error) {
          // Rollback optimistic update
          if (isMountedRef.current) {
            setDocuments(previousDocuments);
            documentIdsRef.current.add(documentId);
          }
          throw new Error(result.error?.message ?? 'Failed to remove document');
        }

        // Success - optimistic update already applied
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to remove document');
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsRemoving(false);
        }
      }
    },
    [projectId, documents]
  );

  /**
   * Subscribe to realtime document status changes
   * Updates document status when processing completes
   */
  useEffect(() => {
    if (!projectId) return;

    const setupRealtimeSubscription = async () => {
      supabaseRef.current = createClient();

      // Subscribe to documents table for status changes
      const channel = supabaseRef.current
        .channel(`project-docs-${projectId}`)
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

            // Only update if this document is in our project
            if (!documentIdsRef.current.has(updatedDoc.id)) {
              return;
            }

            // Update documents with new status
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.document_id === updatedDoc.id
                  ? {
                      ...doc,
                      document: {
                        ...doc.document,
                        status: updatedDoc.status,
                        page_count: updatedDoc.page_count,
                      },
                    }
                  : doc
              )
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
  }, [projectId]);

  // Initial fetch when projectId changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Calculate remaining slots
  const remainingSlots = MAX_DOCUMENTS_PER_PROJECT - documents.length;
  const canAddMore = remainingSlots > 0;

  return {
    documents,
    isLoading,
    isAdding,
    isUploading,
    isRemoving,
    error,
    addDocuments,
    uploadDocuments,
    removeDocument,
    refresh: fetchDocuments,
    canAddMore,
    remainingSlots,
  };
}
