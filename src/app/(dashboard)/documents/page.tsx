'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';

import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { DocumentStatus, type DocumentStatusType } from '@/components/documents/document-status';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  retryDocumentProcessing,
  deleteDocumentAction,
  type Document,
  type UserAgencyInfo,
} from './actions';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';

/**
 * Documents Page
 *
 * Main document management interface with upload zone integration.
 * Implements AC-4.1.1 through AC-4.1.8, AC-4.2.1 through AC-4.2.8.
 */
export default function DocumentsPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);

  // Use ref to access current userAgencyInfo in callbacks without stale closures
  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  // Track active upload controllers for cancellation (AC-4.2.3)
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Get agency ID for realtime subscription
  const { agencyId } = useAgencyId();

  // Realtime document status subscription (AC-4.2.8)
  const { documents, setDocuments, isConnected } = useDocumentStatus({
    agencyId: agencyId || '',
    onDocumentReady: (doc) => {
      // Toast already handled in the hook per AC-4.2.6
    },
    onDocumentFailed: (doc) => {
      // Toast already handled in the hook
    },
  });

  // Load initial documents and user info on mount
  useEffect(() => {
    loadDocuments();
    loadUserAgencyInfo();
  }, []);

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

  /**
   * Handle accepted files from upload zone
   */
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

  /**
   * Upload a single file using client-side Supabase with progress tracking
   * Implements AC-4.2.1 (real-time progress) and AC-4.2.3 (cancellation)
   */
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
      // Upload with real-time progress (AC-4.2.1)
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

      // Transition to processing state (AC-4.2.4)
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 100, status: 'processing' as const } : f
        )
      );

      // Create document record
      const result = await createDocumentFromUpload({
        documentId,
        filename: file.name,
        storagePath,
      });

      if (result.success && result.document) {
        // Add to documents list (realtime will update status changes)
        setDocuments((prev) => [result.document!, ...prev]);

        // Remove from uploading list after delay
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

  /**
   * Cancel an in-progress upload (AC-4.2.3)
   */
  const handleCancelUpload = useCallback((fileId: string) => {
    const controller = uploadControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
    }
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info('Upload cancelled');
  }, []);

  /**
   * Retry processing for a failed document (AC-4.2.7)
   */
  const handleRetry = useCallback(async (documentId: string) => {
    const result = await retryDocumentProcessing(documentId);
    if (result.success) {
      toast.info('Retrying document processing...');
      // Update local state immediately
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, status: 'processing' } : doc
        )
      );
    } else {
      toast.error(result.error || 'Retry failed');
    }
  }, [setDocuments]);

  /**
   * Delete a failed document (AC-4.2.7)
   */
  const handleDelete = useCallback(async (documentId: string) => {
    const result = await deleteDocumentAction(documentId);
    if (result.success) {
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } else {
      toast.error(result.error || 'Delete failed');
    }
  }, [setDocuments]);

  /**
   * Format relative date for display
   */
  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const hasDocuments = documents.length > 0 || uploadingFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Documents</h1>
        {/* Realtime connection indicator */}
        {agencyId && (
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs text-slate-500">
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <UploadZone
        onFilesAccepted={handleFilesAccepted}
        uploadingFiles={uploadingFiles}
        onCancelUpload={handleCancelUpload}
        disabled={isPending}
      />

      {/* Documents List */}
      {isLoading ? (
        <div className="rounded-lg border bg-white p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
          </div>
        </div>
      ) : hasDocuments ? (
        <div className="rounded-lg border bg-white divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-slate-700"
                  title={doc.display_name || doc.filename}
                >
                  {doc.display_name || doc.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatRelativeDate(doc.created_at)}
                </p>
              </div>

              {/* Document Status with actions (AC-4.2.4, AC-4.2.5, AC-4.2.7) */}
              <div className="flex-shrink-0">
                <DocumentStatus
                  status={doc.status as DocumentStatusType}
                  errorMessage={doc.status === 'failed' ? 'Processing failed' : undefined}
                  onRetry={doc.status === 'failed' ? () => handleRetry(doc.id) : undefined}
                  onDelete={doc.status === 'failed' ? () => handleDelete(doc.id) : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No documents yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upload your first document to get started
          </p>
        </div>
      )}
    </div>
  );
}
