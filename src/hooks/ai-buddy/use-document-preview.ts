/**
 * useDocumentPreview Hook
 * Story 17.3: Document Preview & Multi-Document Context
 *
 * Manages document preview modal state for AI Buddy.
 * Provides functions to open preview from document panel or citations.
 *
 * Implements:
 * - AC-17.3.1: Click on document opens preview in modal
 * - AC-17.3.2: Click citation opens preview to exact page
 * - AC-17.3.6: State resets on close
 */

import { useState, useCallback } from 'react';
import type { Citation, ProjectDocument } from '@/types/ai-buddy';
import type { DocumentPreviewData } from '@/components/ai-buddy/documents/document-preview-modal';

export interface UseDocumentPreviewReturn {
  /** Whether the preview modal is open */
  isOpen: boolean;
  /** Current document data for preview */
  previewDocument: DocumentPreviewData | null;
  /** Open preview for a project document (AC-17.3.1) */
  openDocumentPreview: (document: ProjectDocument) => void;
  /** Open preview from a citation with page navigation (AC-17.3.2) */
  openCitationPreview: (citation: Citation) => void;
  /** Open preview with specific document ID and optional page */
  openPreview: (documentId: string, documentName: string, page?: number) => void;
  /** Close the preview modal (AC-17.3.6: resets state) */
  closePreview: () => void;
  /** Set modal open state */
  setIsOpen: (open: boolean) => void;
}

/**
 * Hook for managing document preview modal state
 */
export function useDocumentPreview(): UseDocumentPreviewReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentPreviewData | null>(null);

  // AC-17.3.1: Open preview for a project document
  const openDocumentPreview = useCallback((document: ProjectDocument) => {
    setPreviewDocument({
      documentId: document.document_id,
      documentName: document.document.name,
      initialPage: undefined, // Open to first page
    });
    setIsOpen(true);
  }, []);

  // AC-17.3.2: Open preview from citation with page navigation
  const openCitationPreview = useCallback((citation: Citation) => {
    setPreviewDocument({
      documentId: citation.documentId,
      documentName: citation.documentName,
      initialPage: citation.page,
    });
    setIsOpen(true);
  }, []);

  // Generic open with specific parameters
  const openPreview = useCallback((documentId: string, documentName: string, page?: number) => {
    setPreviewDocument({
      documentId,
      documentName,
      initialPage: page,
    });
    setIsOpen(true);
  }, []);

  // AC-17.3.6: Close and reset state
  const closePreview = useCallback(() => {
    setIsOpen(false);
    // Delay clearing document data to allow modal close animation
    setTimeout(() => {
      setPreviewDocument(null);
    }, 200);
  }, []);

  // Handle open state changes (from modal)
  const handleSetIsOpen = useCallback((open: boolean) => {
    if (!open) {
      closePreview();
    } else {
      setIsOpen(true);
    }
  }, [closePreview]);

  return {
    isOpen,
    previewDocument,
    openDocumentPreview,
    openCitationPreview,
    openPreview,
    closePreview,
    setIsOpen: handleSetIsOpen,
  };
}

export default useDocumentPreview;
