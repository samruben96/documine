'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Upload, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentType, ExtractionStatus } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DocumentTable, type DocumentTableRow } from '@/components/documents/document-table';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { ProcessingQueueSummary } from '@/components/documents/processing-queue-summary';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import { useProcessingProgress } from '@/hooks/use-processing-progress';
import { useFailureNotifications } from '@/hooks/use-failure-notifications';
import { useExtractionRetry } from '@/hooks/use-extraction-status';
import {
  getDocuments,
  getUserAgencyInfo,
  createDocumentFromUpload,
  deleteDocumentAction,
  bulkDeleteDocumentsAction,
  type Document,
  type UserAgencyInfo,
  type Label,
} from '@/app/(dashboard)/chat-docs/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { uploadDocumentToStorage, deleteDocumentFromStorage, sanitizeFilename } from '@/lib/documents/upload';

type DocumentWithLabels = Document & { labels?: Label[] };

/**
 * Document Library Page
 *
 * Story F2-1: Dedicated document library
 * Story F2-6: Document Library Table View
 * Implements:
 * - AC-F2-1.1: Dedicated /documents route accessible from header
 * - AC-F2-6.1: Table with columns: Name, Type, Status, Tags, Date, Pages
 * - AC-F2-6.2: All columns are sortable (click header to sort asc/desc)
 * - AC-F2-6.3: Tags column shows inline tag pills (max 3 visible, "+N" overflow)
 * - AC-F2-6.4: Row hover reveals action buttons (Open, Rename, Delete)
 * - AC-F2-6.5: Row click navigates to /chat-docs/[id] document viewer
 * - AC-F2-6.6: Table has sticky header for scrolling long lists
 * - AC-F2-6.7: Search filters table rows by name OR tags
 * - AC-F2-6.8: Empty state shows friendly message with upload prompt
 */
export default function DocumentLibraryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);
  // Story 11.5 (AC-11.5.4): Filter for failed documents
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed'>('all');
  // Story 11.8: Track document IDs currently retrying extraction
  const [retryingExtractionIds, setRetryingExtractionIds] = useState<Set<string>>(new Set());
  // Story 11.8: Track selected document IDs for bulk operations
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  // Story 11.8: Bulk delete confirmation dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const userAgencyInfoRef = useRef<UserAgencyInfo | null>(null);
  userAgencyInfoRef.current = userAgencyInfo;

  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { agencyId } = useAgencyId();
  const { documents, setDocuments, registerOptimisticInsert } = useDocumentStatus({
    agencyId: agencyId || '',
  });

  // Story 11.5 (AC-11.5.3): Toast notifications for processing failures
  useFailureNotifications({
    agencyId: agencyId || '',
    enabled: !!agencyId,
    onViewDocument: (documentId) => router.push(`/chat-docs/${documentId}`),
  });

  // Story 11.2: Get processing progress for documents with status 'processing'
  // Story 11.5: Also track failed documents to get error messages
  const trackedDocumentIds = useMemo(
    () => documents
      .filter((d) => d.status === 'processing' || d.status === 'failed')
      .map((d) => d.id),
    [documents]
  );
  const { progressMap, errorMap } = useProcessingProgress(trackedDocumentIds);

  // Story 11.8: Extraction retry hook
  const { retry: retryExtraction } = useExtractionRetry();

  // Story 11.8: Handle extraction retry with tracking
  const handleRetryExtraction = useCallback(async (documentId: string) => {
    setRetryingExtractionIds((prev) => new Set(prev).add(documentId));
    try {
      await retryExtraction(documentId);
      toast.success('Extraction retry started');
    } catch {
      toast.error('Failed to retry extraction');
    } finally {
      setRetryingExtractionIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  }, [retryExtraction]);

  // Story 11.8: Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;

    setIsDeleting(true);
    try {
      // Optimistic: remove from UI immediately
      const idsToDelete = new Set(selectedDocumentIds);
      setDocuments((prev) => prev.filter((doc) => !idsToDelete.has(doc.id)));
      setSelectedDocumentIds([]);
      setBulkDeleteDialogOpen(false);

      const result = await bulkDeleteDocumentsAction(selectedDocumentIds);

      if (result.success) {
        toast.success(`Deleted ${result.deleted} document${result.deleted !== 1 ? 's' : ''}`);
      } else if (result.deleted > 0) {
        toast.warning(`Deleted ${result.deleted} document(s), ${result.failed} failed`);
        // Reload to get accurate state
        loadDocuments();
      } else {
        toast.error(result.error || 'Delete failed');
        // Reload to restore state
        loadDocuments();
      }
    } catch (error) {
      toast.error('Delete failed');
      loadDocuments(); // Restore state
    } finally {
      setIsDeleting(false);
    }
  }, [selectedDocumentIds, setDocuments]);

  // Story 11.8: Handle single delete from row action
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    // Optimistic: remove from UI immediately
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

    const result = await deleteDocumentAction(documentId);

    if (result.success) {
      toast.success('Document deleted');
    } else {
      toast.error(result.error || 'Delete failed');
      loadDocuments(); // Restore state
    }
  }, [setDocuments]);

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

  // Filter documents by search query (searches name and AI tags)
  // Story 11.5 (AC-11.5.4): Also filter by status
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply status filter first
    if (statusFilter === 'failed') {
      filtered = filtered.filter((doc: DocumentWithLabels) => doc.status === 'failed');
    }

    // Then apply search query
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter((doc: DocumentWithLabels) => {
        const name = (doc.display_name || doc.filename).toLowerCase();
        const tagsMatch = doc.ai_tags?.some(tag => tag.toLowerCase().includes(query)) ?? false;
        return name.includes(query) || tagsMatch;
      });
    }

    return filtered;
  }, [documents, debouncedQuery, statusFilter]);

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
        // Story 11.8: Register ID before optimistic update to prevent duplicate rows
        // when the realtime INSERT event races with this state update
        registerOptimisticInsert(result.document.id);
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950">
      {/* Page header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* Story DR.3: AC-DR.3.4 - text-2xl font-semibold text-slate-900 */}
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
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

          {/* Story 11.4 (AC-11.4.3): Processing Queue Summary */}
          {/* Story 11.5 (AC-11.5.4): Click on failed count to filter */}
          {agencyId && (
            <ProcessingQueueSummary
              agencyId={agencyId}
              className="mt-4 max-w-md"
              onFilterFailed={() => setStatusFilter('failed')}
            />
          )}

          {/* Search bar and filter indicator */}
          <div className="mt-4 flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
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

            {/* Story 11.5 (AC-11.5.4): Status filter indicator */}
            {statusFilter === 'failed' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                data-testid="clear-failed-filter"
              >
                <X className="h-3 w-3" />
                Failed only
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document table (AC-F2-6.1) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          // Loading skeleton for table
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex gap-8">
                {['Name', 'Type', 'Status', 'Tags', 'Date', 'Pages'].map((col) => (
                  <div key={col} className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-8 animate-pulse">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredDocuments.length === 0 && documents.length === 0 ? (
          // Empty state (AC-F2-6.8)
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
          // Document table (AC-F2-6.1, 6.2, 6.3, 6.4, 6.5, 6.6)
          <div data-testid="document-table">
            {/* Story 11.8: Selection action bar */}
            {selectedDocumentIds.length > 0 && (
              <div className="mb-4 flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocumentIds([])}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                >
                  Clear selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete selected
                </Button>
              </div>
            )}
            <DocumentTable
              progressMap={progressMap}
              onRetryExtraction={handleRetryExtraction}
              retryingExtractionIds={retryingExtractionIds}
              enableSelection
              onSelectionChange={setSelectedDocumentIds}
              onDelete={handleDeleteDocument}
              documents={filteredDocuments.map((doc: DocumentWithLabels): DocumentTableRow => {
                // Story 10.12: Extract carrier and premium from extraction_data JSONB
                const extraction = doc.extraction_data as Record<string, unknown> | null;
                return {
                  id: doc.id,
                  filename: doc.filename,
                  display_name: doc.display_name,
                  status: doc.status,
                  page_count: doc.page_count,
                  created_at: doc.created_at,
                  document_type: doc.document_type as DocumentType | null,
                  ai_tags: doc.ai_tags,
                  ai_summary: doc.ai_summary,
                  carrier_name: (extraction?.carrierName as string) ?? null,
                  annual_premium: (extraction?.annualPremium as number) ?? null,
                  // Story 11.5: Include error message for failed documents
                  error_message: errorMap.get(doc.id) ?? null,
                  // Story 11.8: Include extraction status
                  extraction_status: doc.extraction_status as ExtractionStatus | null,
                };
              })}
            />
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

      {/* Story 11.8: Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected document{selectedDocumentIds.length !== 1 ? 's' : ''} and all associated conversations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
