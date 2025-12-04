'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OnePagerButton } from '@/components/one-pager/one-pager-button';

import { Sidebar, MobileBottomNav } from '@/components/layout/sidebar';
import { SplitView, DocumentChatSplitView } from '@/components/layout/split-view';
import { DocumentList } from '@/components/documents/document-list';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { ChatPanel } from '@/components/chat';
import {
  MobileDocumentChatTabs,
  type MobileDocumentChatTabsRef,
} from '@/components/layout/mobile-document-chat-tabs';
import {
  DocumentViewer,
  type DocumentViewerRef,
} from '@/components/documents/document-viewer';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  retryDocumentProcessing,
  deleteDocumentAction,
  getProcessingJobError,
  type Document,
  type UserAgencyInfo,
} from '../actions';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';
import { getDocumentUrl } from '@/lib/utils/storage';
import type { SourceCitation } from '@/lib/chat/types';

/**
 * Hook to track if viewport is mobile (<768px)
 * Used to conditionally render only ONE DocumentViewer instance
 * to avoid ref attachment issues with hidden elements
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial value
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();

    // Listen for resize
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

/**
 * Document Detail Page (Chat + Viewer)
 *
 * Implements AC-4.3.7: Split view with document viewer + chat panel
 * Route: /chat-docs/[id] (moved from /documents/[id] in Story F2-1)
 *
 * Story F2-1 Route restructure:
 * - /documents → Document Library (new)
 * - /chat-docs/[id] → Document viewer + chat (this file)
 */
export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = params?.id;
  const isMobile = useIsMobile();

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Refs for document viewer and mobile tabs (AC-5.5.4, AC-5.5.10)
  const documentViewerRef = useRef<DocumentViewerRef>(null);
  const mobileTabsRef = useRef<MobileDocumentChatTabsRef>(null);

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

  // AC-6.5.3: Update page title with document name
  useEffect(() => {
    if (selectedDocument) {
      const docName = selectedDocument.display_name || selectedDocument.filename;
      document.title = `${docName} - docuMINE`;
    } else {
      document.title = 'docuMINE';
    }
    // Cleanup: reset title when leaving page
    return () => {
      document.title = 'docuMINE';
    };
  }, [selectedDocument]);

  // Load PDF URL when selected document changes (AC-5.5.1)
  useEffect(() => {
    async function loadPdfUrl() {
      if (!selectedDocument?.storage_path) {
        setPdfUrl(null);
        return;
      }

      // Only load PDF for processed documents (status 'ready' means processing complete)
      if (selectedDocument.status !== 'ready') {
        setPdfUrl(null);
        return;
      }

      setPdfLoading(true);
      try {
        const supabase = createClient();
        const url = await getDocumentUrl(supabase, selectedDocument.storage_path);
        setPdfUrl(url);
      } catch (error) {
        console.error('Failed to load PDF URL:', error);
        toast.error('Failed to load document');
        setPdfUrl(null);
      } finally {
        setPdfLoading(false);
      }
    }

    loadPdfUrl();
  }, [selectedDocument?.id, selectedDocument?.storage_path, selectedDocument?.status]);

  // Handle source citation click (AC-5.5.4, AC-5.5.10)
  const handleSourceClick = useCallback((source: SourceCitation) => {
    // Check if we're on mobile (via window width or ref state)
    const isMobile = window.innerWidth < 768; // md breakpoint

    if (isMobile && mobileTabsRef.current) {
      // AC-5.5.10: Switch to Document tab first, then highlight
      mobileTabsRef.current.switchToDocument();
      // Small delay to allow tab switch animation
      setTimeout(() => {
        documentViewerRef.current?.highlightSource(source);
      }, 100);
    } else {
      // Desktop: Just highlight directly
      documentViewerRef.current?.highlightSource(source);
    }
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

  // Document Viewer content (shared between desktop and mobile)
  // AC-5.5.1: PDF renders with text layer enabled
  const documentViewerContent = (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Document header - always shown when document selected */}
      {selectedDocument && (
        <div className="flex-shrink-0 min-h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-center px-4 py-2 gap-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/documents')}
              className="sm:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Back to documents"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <FileText className="h-5 w-5 text-slate-500 flex-shrink-0" />
            {/* Filename with tooltip for truncated names (AC-6.7.15) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1" tabIndex={0}>
                  {selectedDocument.display_name || selectedDocument.filename}
                </h1>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[400px]">
                <p className="break-all">{selectedDocument.display_name || selectedDocument.filename}</p>
              </TooltipContent>
            </Tooltip>
            {/* AC-9.5.3: Generate One-Pager button (only for ready documents) */}
            {selectedDocument.status === 'ready' && (
              <OnePagerButton documentId={selectedDocument.id} size="sm" />
            )}
          </div>
          {/* Story F2-3 (AC-F2-3.6): Show AI summary and tags in document viewer */}
          {selectedDocument.ai_summary && (
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-8 sm:ml-0 line-clamp-1">
              {selectedDocument.ai_summary}
            </p>
          )}
          {selectedDocument.ai_tags && selectedDocument.ai_tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap ml-8 sm:ml-0" data-testid="document-viewer-tags">
              {selectedDocument.ai_tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Loading/Not found header when no document selected */}
      {!selectedDocument && (
        <div className="flex-shrink-0 h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-3">
          <button
            type="button"
            onClick={() => router.push('/documents')}
            className="sm:hidden p-1.5 rounded hover:bg-slate-100"
            aria-label="Back to documents"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Document not found</span>
          )}
        </div>
      )}

      {/* Document content */}
      <div className="flex-1 overflow-hidden">
        {pdfLoading ? (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-4 text-sm text-slate-500">Loading document...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          // AC-5.5.1: Actual PDF viewer with text layer
          <DocumentViewer
            ref={documentViewerRef}
            pdfUrl={pdfUrl}
            className="h-full"
          />
        ) : selectedDocument && selectedDocument.status === 'failed' ? (
          // Story 5.13 (AC-5.13.1): Show user-friendly error message for failed documents
          <FailedDocumentView documentId={selectedDocument.id} filename={selectedDocument.filename} />
        ) : selectedDocument && selectedDocument.status !== 'ready' ? (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-4 text-sm text-slate-600">
                Document is being processed...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                The viewer will be available once processing completes
              </p>
            </div>
          </div>
        ) : selectedDocument ? (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <FileText className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-sm text-slate-600">
                Unable to load document
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {selectedDocument.filename}
              </p>
            </div>
          </div>
        ) : !isLoading ? (
          <div className="h-full flex items-center justify-center bg-slate-50">
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
          </div>
        ) : null}
      </div>
    </div>
  );

  // Chat Panel content (shared between desktop and mobile)
  // AC-5.5.4, AC-5.5.10: Pass source click handler for scroll and highlight
  const chatPanelContent = documentId ? (
    <ChatPanel documentId={documentId} onSourceClick={handleSourceClick} />
  ) : null;

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
          // Conditionally render ONLY ONE layout to avoid duplicate DocumentViewer instances
          // This ensures the documentViewerRef attaches to the visible instance
          isMobile ? (
            // Mobile: Tabbed interface - AC-5.1.8, AC-5.5.10
            <MobileDocumentChatTabs
              ref={mobileTabsRef}
              documentViewer={documentViewerContent}
              chatPanel={chatPanelContent}
            />
          ) : (
            // Desktop/Tablet: Split view with document + chat side-by-side
            <DocumentChatSplitView
              documentViewer={documentViewerContent}
              chatPanel={chatPanelContent}
            />
          )
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

/**
 * Story 5.13 (AC-5.13.1): Display user-friendly error for failed documents
 * Fetches error message from processing_jobs table and displays it prominently
 */
function FailedDocumentView({ documentId, filename }: { documentId: string; filename: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchError() {
      setIsLoading(true);
      try {
        // Use server action to bypass RLS restrictions on processing_jobs
        const result = await getProcessingJobError(documentId);

        if (result.success) {
          setErrorMessage(result.errorMessage || null);
        } else {
          console.error('Failed to fetch error message:', result.error);
          setErrorMessage(null);
        }
      } catch (err) {
        console.error('Error fetching processing job:', err);
        setErrorMessage(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchError();
  }, [documentId]);

  // Default message if no specific error was stored
  const displayMessage = errorMessage || 'Document processing failed. Please try uploading again.';

  return (
    <div className="h-full flex items-center justify-center bg-slate-50">
      <div className="max-w-md text-center px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">
          Processing Failed
        </h3>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading error details...</p>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">
              {displayMessage}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {filename}
            </p>
            <p className="text-xs text-slate-500">
              Use the retry button in the document list to try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
