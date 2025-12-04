'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { DocumentTable, type DocumentTableRow } from '@/components/documents/document-table';
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
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAgencyInfo, setUserAgencyInfo] = useState<UserAgencyInfo | null>(null);

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

  // Filter documents by search query (searches name and AI tags)
  const filteredDocuments = useMemo(() => {
    if (!debouncedQuery.trim()) return documents;

    const query = debouncedQuery.toLowerCase();
    return documents.filter((doc: DocumentWithLabels) => {
      const name = (doc.display_name || doc.filename).toLowerCase();
      const tagsMatch = doc.ai_tags?.some(tag => tag.toLowerCase().includes(query)) ?? false;
      return name.includes(query) || tagsMatch;
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
            <DocumentTable
              documents={filteredDocuments.map((doc: DocumentWithLabels): DocumentTableRow => ({
                id: doc.id,
                filename: doc.filename,
                display_name: doc.display_name,
                status: doc.status,
                page_count: doc.page_count,
                created_at: doc.created_at,
                document_type: doc.document_type as DocumentType | null,
                ai_tags: doc.ai_tags,
                ai_summary: doc.ai_summary,
              }))}
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
    </div>
  );
}
