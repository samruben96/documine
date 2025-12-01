'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';

import { Sidebar, MobileBottomNav } from '@/components/layout/sidebar';
import { SplitView, DocumentViewPlaceholder, ChatPanelPlaceholder } from '@/components/layout/split-view';
import { DocumentList } from '@/components/documents/document-list';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { DocumentStatus, type DocumentStatusType } from '@/components/documents/document-status';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
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

  const { documents, setDocuments, isConnected } = useDocumentStatus({
    agencyId: agencyId || '',
    onDocumentReady: () => {},
    onDocumentFailed: () => {},
  });

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
        setDocuments((prev) => [result.document!, ...prev]);

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

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <SplitView
        sidebar={
          <Sidebar>
            <DocumentList
              documents={documents}
              onFilesAccepted={handleFilesAccepted}
              queuePositions={queuePositions}
              isLoading={isLoading}
            />
          </Sidebar>
        }
        main={
          <div className="h-full flex">
            {/* Main content - Welcome/Upload area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
              <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-lg font-medium text-slate-800">
                  {documents.length > 0 ? 'Select a document' : 'Welcome to docuMINE'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {documents.length > 0
                    ? 'Choose a document from the sidebar to view and analyze it'
                    : 'Upload your first document to get started with AI-powered analysis'}
                </p>

                {/* Show upload zone in main area when no documents */}
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

                {/* Connection status */}
                {agencyId && (
                  <div className="mt-6 flex items-center justify-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-xs text-slate-500">
                      {isConnected ? 'Live updates active' : 'Connecting...'}
                    </span>
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
