/**
 * Document Preview Modal Component
 * Story 17.3: Document Preview & Multi-Document Context
 *
 * Modal for viewing documents in AI Buddy with page navigation.
 * Uses existing DocumentViewer with modal wrapper.
 *
 * Implements:
 * - AC-17.3.1: Click on document opens preview in modal with page navigation
 * - AC-17.3.2: Click citation opens preview to exact page
 * - AC-17.3.6: State resets to default on close/reopen
 */

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DocumentViewer,
  type DocumentViewerRef,
} from '@/components/documents/document-viewer';
import { createClient } from '@/lib/supabase/client';

export interface DocumentPreviewData {
  /** Document ID to display */
  documentId: string;
  /** Document name for display */
  documentName: string;
  /** Optional page to navigate to on open */
  initialPage?: number;
}

export interface DocumentPreviewModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Document data to preview */
  document: DocumentPreviewData | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Document Preview Modal
 *
 * Displays a document in a modal with page navigation controls.
 * AC-17.3.1: Preview opens in modal
 * AC-17.3.2: Navigates to specific page when initialPage provided
 * AC-17.3.6: Resets state on close
 */
export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  className,
}: DocumentPreviewModalProps) {
  const viewerRef = useRef<DocumentViewerRef>(null);
  const supabase = createClient();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch signed URL for the document
  useEffect(() => {
    if (!open || !document?.documentId) {
      // AC-17.3.6: Reset state when closed
      setPdfUrl(null);
      setError(null);
      return;
    }

    async function fetchDocumentUrl() {
      setIsLoadingUrl(true);
      setError(null);

      try {
        // Get document storage path
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('storage_path, filename')
          .eq('id', document!.documentId)
          .single();

        if (docError) {
          throw new Error(docError.message);
        }

        if (!docData?.storage_path) {
          throw new Error('Document storage path not found');
        }

        // Get signed URL for the file
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(docData.storage_path, 3600); // 1 hour expiry

        if (urlError) {
          throw new Error(urlError.message);
        }

        setPdfUrl(urlData.signedUrl);
      } catch (err) {
        console.error('Failed to load document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoadingUrl(false);
      }
    }

    fetchDocumentUrl();
  }, [open, document?.documentId, supabase]);

  // Navigate to initial page when PDF loads
  useEffect(() => {
    if (!pdfUrl || !document?.initialPage || !viewerRef.current) {
      return;
    }
    // Small delay to ensure PDF is rendered
    const timer = setTimeout(() => {
      viewerRef.current?.scrollToPage(document.initialPage!);
    }, 500);
    return () => clearTimeout(timer);
  }, [pdfUrl, document?.initialPage]);

  // Handle close
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col',
          className
        )}
        onKeyDown={handleKeyDown}
        data-testid="document-preview-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-slate-900 truncate pr-4">
            {document?.documentName ?? 'Document Preview'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 flex-shrink-0"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Document viewer */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {isLoadingUrl ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="h-8 w-8 mx-auto mb-2 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-sm">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-red-500">
                <p className="text-sm font-medium">Failed to load document</p>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <DocumentViewer
              ref={viewerRef}
              pdfUrl={pdfUrl}
              className="h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentPreviewModal;
