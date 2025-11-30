'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';

import { Sidebar, MobileBottomNav } from '@/components/layout/sidebar';
import { SplitView, ChatPanelPlaceholder } from '@/components/layout/split-view';
import { DocumentList } from '@/components/documents/document-list';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  retryDocumentProcessing,
  deleteDocumentAction,
  type Document,
  type UserAgencyInfo,
} from '../actions';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';

/**
 * Document Detail Page
 *
 * Implements AC-4.3.7: Split view with document viewer + chat panel placeholder
 * Route: /documents/[id]
 */
export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = params?.id;

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);

  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { agencyId } = useAgencyId();
  const { documents, setDocuments, isConnected } = useDocumentStatus({
    agencyId: agencyId || '',
  });

  // Load documents and user info
  useEffect(() => {
    loadDocuments();
    loadUserAgencyInfo();
  }, []);

  // Find selected document when documents or ID changes
  useEffect(() => {
    if (documentId && documents.length > 0) {
      const doc = documents.find((d) => d.id === documentId);
      setSelectedDocument(doc || null);
    }
  }, [documentId, documents]);

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
    const newDocumentId = crypto.randomUUID();
    const safeFilename = sanitizeFilename(file.name);
    const storagePath = `${agencyInfo.agencyId}/${newDocumentId}/${safeFilename}`;

    try {
      await uploadDocumentToStorage(supabase, file, agencyInfo.agencyId, newDocumentId, {
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
        documentId: newDocumentId,
        filename: file.name,
        storagePath,
      });

      if (result.success && result.document) {
        setDocuments((prev) => [result.document!, ...prev]);
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
              isLoading={isLoading}
            />
          </Sidebar>
        }
        main={
          <div className="h-full flex">
            {/* Document Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Document header */}
              <div className="flex-shrink-0 h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/documents')}
                  className="sm:hidden p-1.5 rounded hover:bg-slate-100"
                  aria-label="Back to documents"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                {selectedDocument ? (
                  <>
                    <FileText className="h-5 w-5 text-slate-500" />
                    <h1 className="font-medium text-slate-800 truncate">
                      {selectedDocument.display_name || selectedDocument.filename}
                    </h1>
                  </>
                ) : isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">Loading...</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Document not found</span>
                )}
              </div>

              {/* Document content placeholder */}
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                {selectedDocument ? (
                  <div className="text-center">
                    <FileText className="mx-auto h-16 w-16 text-slate-300" />
                    <p className="mt-4 text-sm text-slate-600">
                      Document viewer coming in Epic 5
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedDocument.filename}
                    </p>
                  </div>
                ) : !isLoading ? (
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Document not found</p>
                    <button
                      type="button"
                      onClick={() => router.push('/documents')}
                      className="mt-2 text-sm text-slate-600 hover:text-slate-800 underline"
                    >
                      Back to documents
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Chat Panel Placeholder - hidden on mobile/tablet */}
            <div className="hidden lg:block w-80">
              <ChatPanelPlaceholder />
            </div>
          </div>
        }
      />

      {/* Uploading files overlay */}
      {uploadingFiles.length > 0 && (
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
