'use client';

import { useState, useCallback, useEffect, useRef, useMemo, useTransition } from 'react';
import { Search, X, Upload, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentType } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DocumentCard } from '@/components/documents/document-card';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  type Document,
  type UserAgencyInfo,
  type Label,
} from '@/app/(dashboard)/chat-docs/actions';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';

type DocumentWithLabels = Document & { labels?: Label[] };

/**
 * Document Library Page
 *
 * Story F2-1: Dedicated document library with grid/list view
 * Implements:
 * - AC-F2-1.1: Dedicated /documents route accessible from header
 * - AC-F2-1.2: Grid view of all agency documents
 * - AC-F2-1.3: Each doc shows filename, date, page count, status, type, tags
 * - AC-F2-1.4: Click navigates to /chat-docs/[id]
 * - AC-F2-1.5: Upload button opens upload modal
 * - AC-F2-1.6: Empty state when no documents
 */
export default function DocumentLibraryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);
  const [updatingTypeId, setUpdatingTypeId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { agencyId } = useAgencyId();
  const { documents, setDocuments } = useDocumentStatus({
    agencyId: agencyId || '',
  });

  // Load documents and user info on mount
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

  // Filter documents by search query
  const filteredDocuments = useMemo(() => {
    if (!debouncedQuery.trim()) return documents;

    const query = debouncedQuery.toLowerCase();
    return documents.filter((doc: DocumentWithLabels) => {
      const name = (doc.display_name || doc.filename).toLowerCase();
      return name.includes(query);
    });
  }, [documents, debouncedQuery]);

  // Handle file upload
  const handleFilesAccepted = useCallback((files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
    setUploadDialogOpen(false); // Close dialog after accepting files

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
        setDocuments((prev: DocumentWithLabels[]) => [result.document!, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
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

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Handle document type change with optimistic update
   * AC-F2-2.4: Type change persists immediately
   */
  const handleTypeChange = useCallback(
    async (documentId: string, newType: DocumentType) => {
      // Store previous state for rollback
      const previousDoc = documents.find((d) => d.id === documentId);
      if (!previousDoc) return;

      // Optimistic update
      setUpdatingTypeId(documentId);
      setDocuments((prev: DocumentWithLabels[]) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, document_type: newType } : doc
        )
      );

      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_type: newType }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message || 'Failed to update document type');
        }

        toast.success(`Document marked as ${newType}`);
      } catch (error) {
        // Rollback on error
        setDocuments((prev: DocumentWithLabels[]) =>
          prev.map((doc) =>
            doc.id === documentId
              ? { ...doc, document_type: previousDoc.document_type }
              : doc
          )
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to update document type'
        );
      } finally {
        setUpdatingTypeId(null);
      }
    },
    [documents, setDocuments]
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950">
      {/* Page header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Document Library
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </p>
            </div>

            {/* Upload button (AC-F2-1.5) */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="upload-button">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                </DialogHeader>
                <UploadZone
                  onFilesAccepted={handleFilesAccepted}
                  className="mt-4"
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Search bar */}
          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          // Loading skeleton (AC-F2-1.2)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="flex-1 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 && documents.length === 0 ? (
          // Empty state (AC-F2-1.6)
          <div
            data-testid="empty-state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <FolderOpen className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300">
              No documents yet
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Upload your first insurance document to get started with document analysis and comparison.
            </p>
            <Button
              className="mt-6"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          // No search results
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              No documents found matching &apos;{debouncedQuery}&apos;
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          // Document grid (AC-F2-1.2)
          <div
            data-testid="document-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredDocuments.map((doc: DocumentWithLabels) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                filename={doc.filename}
                displayName={doc.display_name}
                status={doc.status}
                pageCount={doc.page_count}
                createdAt={doc.created_at}
                labels={doc.labels}
                documentType={doc.document_type as DocumentType | null}
                onTypeChange={handleTypeChange}
                isUpdatingType={updatingTypeId === doc.id}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
