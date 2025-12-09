/**
 * @vitest-environment happy-dom
 */
/**
 * useDocumentPreview Hook Tests
 * Story 17.3: Document Preview & Multi-Document Context
 *
 * Tests for the document preview hook.
 *
 * Covers:
 * - AC-17.3.1: Click on document opens preview in modal
 * - AC-17.3.2: Click citation opens preview to exact page
 * - AC-17.3.6: State resets to default on close/reopen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentPreview } from '@/hooks/ai-buddy/use-document-preview';
import type { ProjectDocument, Citation } from '@/types/ai-buddy';

describe('useDocumentPreview', () => {
  const mockProjectDocument: ProjectDocument = {
    id: 'project-doc-1',
    project_id: 'project-123',
    document_id: 'doc-123',
    added_at: '2025-01-01T00:00:00Z',
    document: {
      id: 'doc-123',
      name: 'Test Document.pdf',
      user_id: 'user-123',
      created_at: '2025-01-01T00:00:00Z',
      filename: 'test-document.pdf',
      file_type: 'pdf',
      file_size: 1024,
      processing_status: 'completed',
    },
  };

  const mockCitation: Citation = {
    documentId: 'doc-456',
    documentName: 'Cited Document.pdf',
    page: 5,
    text: 'Sample citation text',
    confidence: 'high',
  };

  describe('initial state', () => {
    it('starts with modal closed', () => {
      const { result } = renderHook(() => useDocumentPreview());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.previewDocument).toBeNull();
    });
  });

  describe('AC-17.3.1: open document from panel', () => {
    it('opens preview for a project document', () => {
      const { result } = renderHook(() => useDocumentPreview());

      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument).toEqual({
        documentId: 'doc-123',
        documentName: 'Test Document.pdf',
        initialPage: undefined,
      });
    });

    it('openPreview with specific parameters works', () => {
      const { result } = renderHook(() => useDocumentPreview());

      act(() => {
        result.current.openPreview('doc-789', 'Another Doc.pdf', 3);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument).toEqual({
        documentId: 'doc-789',
        documentName: 'Another Doc.pdf',
        initialPage: 3,
      });
    });
  });

  describe('AC-17.3.2: open from citation with page navigation', () => {
    it('opens preview at specific page from citation', () => {
      const { result } = renderHook(() => useDocumentPreview());

      act(() => {
        result.current.openCitationPreview(mockCitation);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument).toEqual({
        documentId: 'doc-456',
        documentName: 'Cited Document.pdf',
        initialPage: 5,
      });
    });

    it('handles citation without page number', () => {
      const { result } = renderHook(() => useDocumentPreview());
      const citationWithoutPage: Citation = {
        ...mockCitation,
        page: undefined as unknown as number,
      };

      act(() => {
        result.current.openCitationPreview(citationWithoutPage);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument?.initialPage).toBeUndefined();
    });
  });

  describe('AC-17.3.6: state reset on close', () => {
    it('closePreview sets isOpen to false', () => {
      const { result } = renderHook(() => useDocumentPreview());

      // Open first
      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });
      expect(result.current.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.closePreview();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('closePreview clears document after delay', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useDocumentPreview());

      // Open
      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });
      expect(result.current.previewDocument).not.toBeNull();

      // Close
      act(() => {
        result.current.closePreview();
      });

      // Document should still exist immediately (for animation)
      expect(result.current.previewDocument).not.toBeNull();

      // After delay, document should be cleared
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.previewDocument).toBeNull();

      vi.useRealTimers();
    });

    it('setIsOpen(false) triggers close behavior', () => {
      const { result } = renderHook(() => useDocumentPreview());

      // Open
      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });
      expect(result.current.isOpen).toBe(true);

      // Close via setIsOpen
      act(() => {
        result.current.setIsOpen(false);
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('setIsOpen(true) just opens without document change', () => {
      const { result } = renderHook(() => useDocumentPreview());

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument).toBeNull();
    });
  });

  describe('reopening behavior', () => {
    it('can open a different document after closing', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useDocumentPreview());

      // Open first document
      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });
      expect(result.current.previewDocument?.documentId).toBe('doc-123');

      // Close
      act(() => {
        result.current.closePreview();
        vi.advanceTimersByTime(200);
      });

      // Open second document
      act(() => {
        result.current.openCitationPreview(mockCitation);
      });
      expect(result.current.previewDocument?.documentId).toBe('doc-456');
      expect(result.current.previewDocument?.initialPage).toBe(5);

      vi.useRealTimers();
    });

    it('opening new document replaces previous without close', () => {
      const { result } = renderHook(() => useDocumentPreview());

      // Open first document
      act(() => {
        result.current.openDocumentPreview(mockProjectDocument);
      });

      // Open second document directly (no close)
      act(() => {
        result.current.openCitationPreview(mockCitation);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.previewDocument?.documentId).toBe('doc-456');
    });
  });
});
