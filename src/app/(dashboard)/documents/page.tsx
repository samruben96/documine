'use client';

import { useState, useCallback, useTransition, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { FileText, FileUp, Loader2, Sparkles, MessageSquare } from 'lucide-react';

import { Sidebar, MobileBottomNav } from '@/components/layout/sidebar';
import { SplitView, DocumentViewPlaceholder, ChatPanelPlaceholder } from '@/components/layout/split-view';
import { DocumentList } from '@/components/documents/document-list';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { DocumentStatus, type DocumentStatusType } from '@/components/documents/document-status';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import { useProcessingProgress } from '@/hooks/use-processing-progress';
import { ConnectionIndicator, type ConnectionState } from '@/components/ui/connection-indicator';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  retryDocumentProcessing,
  deleteDocumentAction,
  getDocumentQueuePosition,
  getRateLimitInfoAction,
  type Document,
  type UserAgencyInfo,
} from './actions';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';

/**
 * Documents Page
 *
 * Main document management interface with sidebar layout.
 * Implements AC-4.3.7: Split view layout with document list in sidebar.
 */
interface RateLimitData {
  remaining: number;
  limit: number;
  tier: string;
}

export default function DocumentsPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);
  const [queuePositions, setQueuePositions] = useState<Map<string, number>>(new Map());
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitData | null>(null);

  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { agencyId } = useAgencyId();

  const { documents, setDocuments, isConnected, connectionState: docConnectionState } = useDocumentStatus({
    agencyId: agencyId || '',
    onDocumentReady: () => {},
    onDocumentFailed: () => {},
  });

  // Story 5.12: Track processing document IDs for progress subscription
  const processingDocumentIds = useMemo(() => {
    return documents
      .filter((doc) => doc.status === 'processing')
      .map((doc) => doc.id);
  }, [documents]);

  // Story 5.12: Subscribe to processing progress updates
  const { progressMap, isConnected: isProgressConnected, connectionState: progressConnectionState } = useProcessingProgress(processingDocumentIds);

  // Story 5.14 (AC-5.14.7): Connection indicator should reflect actual subscription state
  // Connected = documents channel is live OR progress channel is live (when there are processing docs)
  const isAnyChannelConnected = isConnected || (processingDocumentIds.length > 0 && isProgressConnected);

  // Story 6.6: Compute combined connection state from both channels
  // Priority: connected > reconnecting > connecting > disconnected
  // If any channel is connected, show connected
  // If any channel is reconnecting, show reconnecting
  // If all channels are connecting, show connecting
  // Otherwise show disconnected
  const combinedConnectionState = useMemo((): ConnectionState => {
    const hasProgressChannel = processingDocumentIds.length > 0;
    const states = hasProgressChannel
      ? [docConnectionState, progressConnectionState]
      : [docConnectionState];

    // If any channel is connected, we're connected
    if (states.includes('connected')) {
      return 'connected';
    }
    // If any channel is reconnecting, show reconnecting
    if (states.includes('reconnecting')) {
      return 'reconnecting';
    }
    // If any channel is still connecting, show connecting
    if (states.includes('connecting')) {
      return 'connecting';
    }
    // All channels disconnected
    return 'disconnected';
  }, [docConnectionState, progressConnectionState, processingDocumentIds.length]);

  // Fetch queue positions for processing documents (AC-4.7.4)
  const fetchQueuePositions = useCallback(async (docs: Document[]) => {
    const processingDocs = docs.filter((doc) => doc.status === 'processing');
    if (processingDocs.length === 0) {
      setQueuePositions(new Map());
      return;
    }

    const positions = new Map<string, number>();
    await Promise.all(
      processingDocs.map(async (doc) => {
        const result = await getDocumentQueuePosition(doc.id);
        if (result.success && result.position !== undefined) {
          positions.set(doc.id, result.position);
        }
      })
    );
    setQueuePositions(positions);
  }, []);

  // Refresh queue positions when documents change
  useEffect(() => {
    fetchQueuePositions(documents);
  }, [documents, fetchQueuePositions]);

  // Load rate limit info (AC-4.7.7)
  const loadRateLimitInfo = useCallback(async () => {
    const result = await getRateLimitInfoAction();
    if (result.success && result.data) {
      setRateLimitInfo({
        remaining: result.data.remaining,
        limit: result.data.uploadsPerHour,
        tier: result.data.tier,
      });
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadUserAgencyInfo();
    loadRateLimitInfo();
  }, [loadRateLimitInfo]);

  async function loadUserAgencyInfo() {
    const result = await getUserAgencyInfo();
    if (result.success && result.data) {
      setUserAgencyInfo(result.data);
    }
  }

  async function loadDocuments() {
    setIsLoading(true);
    try {
      const result = await getDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleFilesAccepted = useCallback((files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    newUploadingFiles.forEach((uploadingFile) => {
      uploadFile(uploadingFile);
    });
  }, []);

  async function uploadFile(uploadingFile: UploadingFile) {
    const { id, file } = uploadingFile;

    const agencyInfo = userAgencyInfoRef.current;
    if (!agencyInfo) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'failed' as const, error: 'User info not loaded' }
            : f
        )
      );
      toast.error('Failed to get user info. Please refresh the page.');
      return;
    }

    const controller = new AbortController();
    uploadControllersRef.current.set(id, controller);

    const supabase = createClient();
    const documentId = crypto.randomUUID();
    const safeFilename = sanitizeFilename(file.name);
    const storagePath = `${agencyInfo.agencyId}/${documentId}/${safeFilename}`;

    try {
      await uploadDocumentToStorage(supabase, file, agencyInfo.agencyId, documentId, {
        onProgress: (percent) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, progress: percent, status: 'uploading' as const } : f
            )
          );
        },
        signal: controller.signal,
      });

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 100, status: 'processing' as const } : f
        )
      );

      const result = await createDocumentFromUpload({
        documentId,
        filename: file.name,
        storagePath,
      });

      if (result.success && result.document) {
        // Add document only if not already in list (may have been added via realtime)
        setDocuments((prev) => {
          if (prev.some((doc) => doc.id === result.document!.id)) {
            return prev;
          }
          return [result.document!, ...prev];
        });

        // Refresh rate limit info after successful upload
        loadRateLimitInfo();

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
        }, 2000);
      } else {
        await deleteDocumentFromStorage(supabase, storagePath);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: 'failed' as const, error: result.error }
              : f
          )
        );
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      const isCancelled = error instanceof Error && error.message === 'Upload cancelled';

      if (isCancelled) {
        await deleteDocumentFromStorage(supabase, storagePath);
      } else {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'failed' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
        toast.error('Upload failed');
      }
    } finally {
      uploadControllersRef.current.delete(id);
    }
  }

  const handleCancelUpload = useCallback((fileId: string) => {
    const controller = uploadControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
    }
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info('Upload cancelled');
  }, []);

  /**
   * Handle retry of failed document
   * Story 5.8.1 (AC-5.8.1.7): Retry button re-queues document for processing
   */
  const handleRetryDocument = useCallback(async (documentId: string) => {
    startTransition(async () => {
      const result = await retryDocumentProcessing(documentId);
      if (result.success) {
        toast.success('Document re-queued for processing');
        // Document status will update via realtime subscription
      } else {
        toast.error(result.error || 'Failed to retry document');
      }
    });
  }, []);

  /**
   * Story 5.14 (AC-5.14.4): Optimistic delete - remove document from state immediately
   */
  const handleOptimisticDelete = useCallback((documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  }, [setDocuments]);

  /**
   * Story 5.14 (AC-5.14.5): Restore document on delete failure
   */
  const handleRestoreDocument = useCallback((document: Document) => {
    setDocuments((prev) => {
      // Check if document is already in list (shouldn't happen, but be safe)
      if (prev.some((doc) => doc.id === document.id)) {
        return prev;
      }
      // Restore at the beginning of the list
      return [document, ...prev];
    });
  }, [setDocuments]);

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <SplitView
        sidebar={
          <Sidebar>
            <DocumentList
              documents={documents}
              onFilesAccepted={handleFilesAccepted}
              queuePositions={queuePositions}
              progressMap={progressMap}
              isLoading={isLoading}
              onRetryClick={handleRetryDocument}
              onOptimisticDelete={handleOptimisticDelete}
              onRestoreDocument={handleRestoreDocument}
            />
          </Sidebar>
        }
        main={
          <div className="h-full flex">
            {/* Main content - Empty states (AC-6.7.6-10, AC-6.8.13) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
              <div className="text-center max-w-md">
                {/* Animated icon container - AC-6.8.13 */}
                <div className="relative inline-block">
                  {/* Decorative sparkles */}
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-primary/60 animate-pulse" />

                  {/* Main icon with floating animation */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 animate-float">
                    {documents.length > 0 ? (
                      <FileText className="h-10 w-10 text-primary" />
                    ) : (
                      <FileUp className="h-10 w-10 text-primary" />
                    )}
                  </div>
                </div>

                {/* Headline - different messaging (AC-6.7.8, AC-6.7.9, AC-6.8.13) */}
                <h2 className="mt-6 text-xl font-semibold text-slate-800 dark:text-slate-200">
                  {documents.length > 0
                    ? 'Choose a document to explore'
                    : 'Your documents await'}
                </h2>

                {/* Description (AC-6.7.8, AC-6.8.13) */}
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {documents.length > 0
                    ? 'Select a document from the sidebar to view it and unlock AI-powered insights'
                    : 'Upload a policy, quote, or certificate and start asking questions in seconds'}
                </p>

                {/* Feature highlights when documents exist */}
                {documents.length > 0 && (
                  <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary/60" />
                      <span>View PDF</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary/60" />
                      <span>Ask Questions</span>
                    </div>
                  </div>
                )}

                {/* Upload zone when no documents - AC-6.7.7 */}
                {documents.length === 0 && !isLoading && (
                  <div className="mt-6">
                    <UploadZone
                      onFilesAccepted={handleFilesAccepted}
                      uploadingFiles={uploadingFiles}
                      onCancelUpload={handleCancelUpload}
                      rateLimitInfo={rateLimitInfo || undefined}
                      disabled={isPending}
                    />
                  </div>
                )}

                {/* Connection status - Story 6.6 */}
                {agencyId && (
                  <div className="mt-6 flex items-center justify-center">
                    <ConnectionIndicator state={combinedConnectionState} />
                  </div>
                )}
              </div>
            </div>

            {/* Chat Panel Placeholder - hidden on mobile/tablet */}
            <div className="hidden lg:block w-80">
              <ChatPanelPlaceholder />
            </div>
          </div>
        }
      />

      {/* Uploading files overlay - shown when documents exist */}
      {uploadingFiles.length > 0 && documents.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 space-y-2 z-50">
          <UploadZone
            onFilesAccepted={() => {}}
            uploadingFiles={uploadingFiles}
            onCancelUpload={handleCancelUpload}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
