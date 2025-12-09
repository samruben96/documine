/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy useProjectDocuments Hook Tests
 * Story 17.2: Project Document Management
 *
 * Tests for:
 * - Fetching project documents
 * - Adding documents from library
 * - Uploading new documents
 * - Removing documents
 * - Real-time status updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectDocuments } from '@/hooks/ai-buddy/use-project-documents';

// Mock document data
const mockDocuments = [
  {
    document_id: 'doc-1',
    attached_at: '2025-12-07T10:00:00Z',
    document: {
      id: 'doc-1',
      name: 'Test Policy.pdf',
      file_type: 'pdf',
      status: 'ready',
      page_count: 10,
      created_at: '2025-12-06T10:00:00Z',
      extraction_data: null,
    },
  },
  {
    document_id: 'doc-2',
    attached_at: '2025-12-07T11:00:00Z',
    document: {
      id: 'doc-2',
      name: 'Quote Document.pdf',
      file_type: 'pdf',
      status: 'ready',
      page_count: 5,
      created_at: '2025-12-06T11:00:00Z',
      extraction_data: { carrier: 'Test Carrier', premium: 1000 },
    },
  },
];

describe('AI Buddy useProjectDocuments', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns empty documents array when no projectId', () => {
      const { result } = renderHook(() => useProjectDocuments({ projectId: null }));

      expect(result.current.documents).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading to true when fetching', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Fetching documents', () => {
    it('fetches documents when projectId is provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.documents).toHaveLength(2);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai-buddy/projects/proj-1/documents'
      );
    });

    it('handles fetch error gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ data: null, error: { message: 'Failed to fetch' } }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.documents).toEqual([]);
    });
  });

  describe('Adding documents', () => {
    it('adds documents from library', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { documents: [] }, error: null }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { added: ['doc-3', 'doc-4'] }, error: null }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addDocuments(['doc-3', 'doc-4']);
      });

      // Verify POST was called
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai-buddy/projects/proj-1/documents',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ documentIds: ['doc-3', 'doc-4'] }),
        })
      );
    });

    it('sets isAdding state during add operation', async () => {
      let resolveAdd: () => void;
      const addPromise = new Promise<void>((resolve) => {
        resolveAdd = resolve;
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { documents: [] }, error: null }),
      });

      fetchMock.mockImplementationOnce(() =>
        addPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({ data: { added: ['doc-3'] }, error: null }),
        }))
      );

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start adding
      let addPromiseResult: Promise<void>;
      act(() => {
        addPromiseResult = result.current.addDocuments(['doc-3']);
      });

      expect(result.current.isAdding).toBe(true);

      // Complete adding
      await act(async () => {
        resolveAdd!();
        await addPromiseResult;
      });

      expect(result.current.isAdding).toBe(false);
    });
  });

  describe('Removing documents', () => {
    it('removes document from project', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { removed: true }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.documents).toHaveLength(2);
      });

      await act(async () => {
        await result.current.removeDocument('doc-1');
      });

      // Verify DELETE was called
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai-buddy/projects/proj-1/documents/doc-1',
        expect.objectContaining({ method: 'DELETE' })
      );

      // Optimistic update should have removed the document
      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents[0].document_id).toBe('doc-2');
    });

    it('reverts on remove failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ data: null, error: { message: 'Failed to remove' } }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.documents).toHaveLength(2);
      });

      await act(async () => {
        try {
          await result.current.removeDocument('doc-1');
        } catch {
          // Expected to throw
        }
      });

      // Document should be restored after failure
      await waitFor(() => {
        expect(result.current.documents).toHaveLength(2);
      });
    });
  });

  describe('Computed values', () => {
    it('calculates canAddMore correctly', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // With 2 documents, should be able to add more (max 25)
      expect(result.current.canAddMore).toBe(true);
      expect(result.current.remainingSlots).toBe(23);
    });

    it('calculates remainingSlots correctly', async () => {
      // Create 25 mock documents to test limit
      const maxDocuments = Array.from({ length: 25 }, (_, i) => ({
        document_id: `doc-${i}`,
        attached_at: '2025-12-07T10:00:00Z',
        document: {
          id: `doc-${i}`,
          name: `Document ${i}.pdf`,
          file_type: 'pdf',
          status: 'ready',
          page_count: 5,
          created_at: '2025-12-06T10:00:00Z',
          extraction_data: null,
        },
      }));

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { documents: maxDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.documents).toHaveLength(25);
      });

      expect(result.current.canAddMore).toBe(false);
      expect(result.current.remainingSlots).toBe(0);
    });
  });

  describe('Refresh function', () => {
    it('refetches documents when refresh is called', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { documents: mockDocuments }, error: null }),
      });

      const { result } = renderHook(() => useProjectDocuments({ projectId: 'proj-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock call count
      fetchMock.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      // Should have called fetch again
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai-buddy/projects/proj-1/documents'
      );
    });
  });
});
