'use client';

/**
 * SourceViewerModal - Document Viewer for Source Citations
 *
 * Story 7.5: AC-7.5.2, AC-7.5.3, AC-7.5.4
 * Displays a document viewer in a modal for verifying extracted values.
 *
 * Features:
 * - AC-7.5.2: Modal with document viewer and carrier name in header
 * - AC-7.5.3: Auto-navigates to source page on open
 * - AC-7.5.4: Highlights source text (when bounding box available)
 *
 * @module @/components/compare/source-viewer-modal
 */

import { useRef, useEffect, useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DocumentViewer,
  type DocumentViewerRef,
} from '@/components/documents/document-viewer';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Props
// ============================================================================

export interface SourceViewerModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Handler for open state changes */
  onOpenChange: (open: boolean) => void;
  /** Document ID to load */
  documentId: string | null;
  /** Page number to navigate to (1-indexed) */
  pageNumber?: number;
  /** Carrier/document name for title */
  carrierName?: string;
  /** Optional text excerpt for highlighting (future enhancement) */
  textExcerpt?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal component for viewing source documents.
 * AC-7.5.2: Opens when "View source" is clicked
 * AC-7.5.3: Auto-navigates to the specified page
 * AC-7.5.4: Shows page-level pulse animation (full text highlight requires future enhancement)
 */
export function SourceViewerModal({
  open,
  onOpenChange,
  documentId,
  pageNumber,
  carrierName,
  textExcerpt,
}: SourceViewerModalProps) {
  const viewerRef = useRef<DocumentViewerRef>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch signed URL when documentId changes and modal opens
  useEffect(() => {
    if (!documentId || !open) {
      setPdfUrl(null);
      return;
    }

    const fetchPdfUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Get document record to find storage path
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('storage_path, filename')
          .eq('id', documentId)
          .single();

        if (docError || !doc?.storage_path) {
          throw new Error('Document not found');
        }

        // Get signed URL for the PDF
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

        if (urlError || !urlData?.signedUrl) {
          throw new Error('Failed to get document URL');
        }

        setPdfUrl(urlData.signedUrl);
      } catch (err) {
        console.error('Failed to fetch PDF URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfUrl();
  }, [documentId, open]);

  // AC-7.5.3: Navigate to page after PDF loads
  // We use a delay to wait for PDF.js to render the pages
  useEffect(() => {
    if (!open || !pdfUrl || !pageNumber || !viewerRef.current) {
      return;
    }

    // Wait for PDF to load and render (PDF.js needs time)
    const timer = setTimeout(() => {
      if (viewerRef.current) {
        viewerRef.current.scrollToPage(pageNumber);

        // AC-7.5.4: Show page highlight
        // Note: Full text highlighting would require bounding box data from extraction
        // Currently uses page-level pulse animation as visual indicator
        viewerRef.current.highlightSource({
          pageNumber,
          text: textExcerpt || '',
          chunkId: '', // Not using chunk-based highlighting for compare
          // No boundingBox - will trigger page pulse fallback
        });
      }
    }, 800); // Allow time for PDF.js to initialize and render

    return () => clearTimeout(timer);
  }, [open, pdfUrl, pageNumber, textExcerpt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl h-[90vh] flex flex-col p-0"
        aria-describedby="source-viewer-description"
      >
        {/* AC-7.5.2: Header with carrier name and page number */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            <span>Source Document</span>
            {carrierName && (
              <span className="text-muted-foreground font-normal">
                — {carrierName}
              </span>
            )}
            {pageNumber && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                (Page {pageNumber})
              </span>
            )}
          </DialogTitle>
          <p id="source-viewer-description" className="sr-only">
            View the source document for the selected value
          </p>
        </DialogHeader>

        {/* Document viewer content */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
              <AlertCircle className="h-12 w-12" />
              <p className="text-sm">{error}</p>
              <p className="text-xs text-muted-foreground">
                Please try again or contact support
              </p>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
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

export default SourceViewerModal;
