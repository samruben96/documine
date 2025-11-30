'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { DocumentListItem } from './document-list-item';
import { DocumentListEmpty } from './document-list-empty';
import { DeleteDocumentModal } from './delete-document-modal';
import type { Tables } from '@/types/database.types';

type Document = Tables<'documents'>;

interface DocumentListProps {
  documents: Document[];
  onFilesAccepted: (files: File[]) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Document List Component
 *
 * Displays a scrollable list of documents in the sidebar.
 * Implements:
 * - AC-4.3.1: Document list with icon, filename, date
 * - AC-4.3.4: Sorted by most recently uploaded first
 * - AC-4.3.5: Scrollable list with custom scrollbar
 * - AC-4.3.6: Search functionality with debounce
 * - AC-4.3.7: Navigation to /documents/[id]
 * - AC-4.3.8: Selected document styling
 * - AC-4.3.9: Empty state with upload zone
 */
export function DocumentList({
  documents,
  onFilesAccepted,
  isLoading = false,
  className,
}: DocumentListProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const selectedId = params?.id;

  // Search state - AC-4.3.6
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Delete modal state - AC-4.4.1, AC-4.4.8
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    filename: string;
    display_name: string | null;
  } | null>(null);

  // Filter documents by search query - AC-4.3.6
  const filteredDocuments = useMemo(() => {
    if (!debouncedQuery.trim()) return documents;

    const query = debouncedQuery.toLowerCase();
    return documents.filter((doc) => {
      const name = (doc.display_name || doc.filename).toLowerCase();
      return name.includes(query);
    });
  }, [documents, debouncedQuery]);

  // Handle document click - AC-4.3.7
  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle delete button click - AC-4.4.1
  const handleDeleteClick = useCallback((doc: Document) => {
    setDocumentToDelete({
      id: doc.id,
      filename: doc.filename,
      display_name: doc.display_name,
    });
    setDeleteModalOpen(true);
  }, []);

  // Handle successful deletion - AC-4.4.7, AC-4.4.8
  const handleDeleteSuccess = useCallback(() => {
    // If we deleted the currently viewed document, navigate to /documents
    if (documentToDelete && documentToDelete.id === selectedId) {
      router.push('/documents');
    }
    setDocumentToDelete(null);
  }, [documentToDelete, selectedId, router]);

  // Show empty state when no documents exist
  if (!isLoading && documents.length === 0) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <DocumentListEmpty onFilesAccepted={onFilesAccepted} />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search input - AC-4.3.6 */}
      <div className="flex-shrink-0 p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Document list - AC-4.3.5: Scrollable with custom scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        {isLoading ? (
          // Loading skeleton
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="py-1">
            {filteredDocuments.map((doc) => (
              <DocumentListItem
                key={doc.id}
                id={doc.id}
                filename={doc.filename}
                displayName={doc.display_name}
                status={doc.status}
                createdAt={doc.created_at}
                isSelected={doc.id === selectedId}
                onClick={() => handleDocumentClick(doc.id)}
                onDeleteClick={() => handleDeleteClick(doc)}
              />
            ))}
          </div>
        ) : (
          // Empty search results - AC-4.3.6
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No documents found matching &apos;{debouncedQuery}&apos;
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-2 text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Upload button at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            // Trigger file input click via a hidden input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/pdf';
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files?.length) {
                onFilesAccepted(Array.from(files));
              }
            };
            input.click();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <Upload className="h-4 w-4" />
          Upload document
        </button>
      </div>

      {/* Delete confirmation modal - AC-4.4.2, AC-4.4.3, AC-4.4.4 */}
      <DeleteDocumentModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        document={documentToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
