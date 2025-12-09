/**
 * Document Library Picker Component
 * Story 17.2: Project Document Management
 *
 * Modal to select existing documents from the docuMINE library.
 *
 * AC-17.2.3: Search/filter docuMINE documents
 * AC-17.2.4: Select existing documents without re-uploading
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface LibraryDocument {
  id: string;
  filename: string;
  status: string;
  page_count: number | null;
  created_at: string;
  document_type: string | null;
  extraction_data: unknown;
  ai_summary: string | null;
}

export interface DocumentLibraryPickerProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Document IDs to exclude (already in project) */
  excludeDocumentIds?: string[];
  /** Callback when documents are selected */
  onSelect: (documentIds: string[]) => void;
  /** Maximum number of documents that can be selected */
  maxSelection?: number;
}

/**
 * Document Library Picker Modal
 * Shows searchable list of user's docuMINE documents
 */
export function DocumentLibraryPicker({
  open,
  onOpenChange,
  excludeDocumentIds = [],
  onSelect,
  maxSelection = 25,
}: DocumentLibraryPickerProps) {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch documents from library
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, status, page_count, created_at, document_type, extraction_data, ai_summary')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Filter out excluded documents and only show ready ones
      const filtered = (data || []).filter(
        (doc) =>
          !excludeDocumentIds.includes(doc.id) &&
          (doc.status === 'ready' || doc.status === 'completed')
      );

      setDocuments(filtered);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludeDocumentIds]);

  // Fetch on open
  useEffect(() => {
    if (open) {
      fetchDocuments();
      setSelectedIds(new Set());
      setSearchQuery('');
    }
  }, [open, fetchDocuments]);

  // Filter documents by search query
  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle document selection
  const toggleSelection = (docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else if (next.size < maxSelection) {
        next.add(docId);
      }
      return next;
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
    onOpenChange(false);
  };

  // Get file type from filename
  const getFileType = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || 'unknown';
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Library</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="library-search-input"
          />
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] border rounded-lg bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? 'No documents match your search'
                  : 'No documents available'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedIds.has(doc.id);
                const hasExtractionData = !!doc.extraction_data;

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleSelection(doc.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left',
                      'hover:bg-white transition-colors',
                      isSelected && 'bg-emerald-50 hover:bg-emerald-50'
                    )}
                    data-testid={`library-document-${doc.id}`}
                  >
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'flex-shrink-0 h-5 w-5 rounded border',
                        'flex items-center justify-center',
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* File icon */}
                    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>

                    {/* Document info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {doc.filename}
                        </p>
                        {hasExtractionData && (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
                            <Sparkles className="h-2.5 w-2.5" />
                            Quote
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 uppercase">
                          {getFileType(doc.filename)}
                        </span>
                        {doc.page_count && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-xs text-slate-500">
                              {doc.page_count} pages
                            </span>
                          </>
                        )}
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-xs text-slate-500">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                      {doc.ai_summary && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {doc.ai_summary}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with selection count and confirm button */}
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-sm text-slate-500">
            {selectedIds.size} of {maxSelection} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
