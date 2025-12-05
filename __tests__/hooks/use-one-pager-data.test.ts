/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnePagerData } from '@/hooks/use-one-pager-data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('useOnePagerData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Entry Mode Detection', () => {
    it('determines comparison mode when comparisonId provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          extractions: [],
          documents: [],
        }),
      });

      const { result } = renderHook(() =>
        useOnePagerData('comp-123', null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.entryMode).toBe('comparison');
      expect(result.current.data?.comparisonId).toBe('comp-123');
    });

    it('determines document mode when documentId provided', async () => {
      // First call for document - uses single()
      const mockDocSingle = vi.fn().mockResolvedValue({
        data: { id: 'doc-123', display_name: 'test.pdf', filename: 'test.pdf', created_at: '2024-01-01' },
        error: null,
      });
      const mockDocEq = vi.fn().mockReturnValue({ single: mockDocSingle });
      const mockDocSelect = vi.fn().mockReturnValue({ eq: mockDocEq });

      // Second call for extraction - uses maybeSingle()
      const mockExtMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockExtEq = vi.fn().mockReturnValue({ maybeSingle: mockExtMaybeSingle });
      const mockExtSelect = vi.fn().mockReturnValue({ eq: mockExtEq });

      mockFrom
        .mockReturnValueOnce({ select: mockDocSelect })
        .mockReturnValueOnce({ select: mockExtSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, 'doc-123')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.entryMode).toBe('document');
      expect(result.current.data?.documentId).toBe('doc-123');
    });

    it('determines select mode when no IDs provided', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.entryMode).toBe('select');
    });
  });

  describe('Comparison Mode', () => {
    it('loads comparison data from API', async () => {
      const mockExtractions = [
        {
          carrierName: 'Test Carrier',
          namedInsured: 'Acme Corp',
          annualPremium: 10000,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          extractions: mockExtractions,
          documents: [{ id: 'doc-1', filename: 'test.pdf' }],
        }),
      });

      const { result } = renderHook(() =>
        useOnePagerData('comp-123', null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.extractions).toEqual(mockExtractions);
      expect(result.current.data?.defaultClientName).toBe('Acme Corp');
    });

    it('handles comparison API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Comparison not found' },
        }),
      });

      const { result } = renderHook(() =>
        useOnePagerData('comp-not-found', null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Comparison not found');
    });
  });

  describe('Document Mode', () => {
    it('loads document data from database', async () => {
      // First call for document
      const mockDocSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'doc-123',
          display_name: 'policy.pdf',
          filename: 'policy.pdf',
          created_at: '2024-01-01',
        },
        error: null,
      });
      const mockDocEq = vi.fn().mockReturnValue({ single: mockDocSingle });
      const mockDocSelect = vi.fn().mockReturnValue({ eq: mockDocEq });

      // Second call for extraction - uses maybeSingle now
      const mockExtMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          extracted_data: {
            carrierName: 'Test Carrier',
            namedInsured: 'Test Client',
          },
          created_at: '2024-01-02',
        },
        error: null,
      });
      const mockExtEq = vi.fn().mockReturnValue({ maybeSingle: mockExtMaybeSingle });
      const mockExtSelect = vi.fn().mockReturnValue({ eq: mockExtEq });

      mockFrom
        .mockReturnValueOnce({ select: mockDocSelect })
        .mockReturnValueOnce({ select: mockExtSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, 'doc-123')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.entryMode).toBe('document');
      expect(result.current.data?.defaultClientName).toBe('Test Client');
    });

    it('handles document not found error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Document not found' },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, 'doc-not-found')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Document not found');
    });
  });

  describe('Select Mode', () => {
    it('fetches selectable documents', async () => {
      mockLimit.mockResolvedValue({
        data: [
          { id: 'doc-1', display_name: 'doc1.pdf', filename: 'doc1.pdf', status: 'ready', created_at: '2024-01-01' },
          { id: 'doc-2', display_name: 'doc2.pdf', filename: 'doc2.pdf', status: 'ready', created_at: '2024-01-02' },
        ],
        error: null,
      });
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.selectableDocuments).toHaveLength(2);
      expect(result.current.data?.selectableDocuments[0].filename).toBe('doc1.pdf');
    });

    it('handles not authenticated error', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() =>
        useOnePagerData(null, null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Not authenticated');
    });
  });

  describe('loadComparison', () => {
    it('can manually load comparison after initial render', async () => {
      // Initial load in select mode
      mockLimit.mockResolvedValue({ data: [], error: null });
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now load comparison
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          extractions: [{ carrierName: 'New Carrier' }],
          documents: [],
        }),
      });

      await act(async () => {
        await result.current.loadComparison('new-comp-id');
      });

      expect(result.current.data?.entryMode).toBe('comparison');
      expect(result.current.data?.comparisonId).toBe('new-comp-id');
    });
  });

  describe('loadDocument', () => {
    it('can manually load document after initial render', async () => {
      // Initial load in select mode
      mockLimit.mockResolvedValue({ data: [], error: null });
      mockOrder.mockReturnValue({ limit: mockLimit });
      const mockSelectEq = vi.fn().mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockSelectEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() =>
        useOnePagerData(null, null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now set up for document load
      const mockDocSingle = vi.fn().mockResolvedValue({
        data: { id: 'doc-new', display_name: 'new.pdf', filename: 'new.pdf', created_at: '2024-01-01' },
        error: null,
      });
      const mockDocEq = vi.fn().mockReturnValue({ single: mockDocSingle });
      const mockDocSelect = vi.fn().mockReturnValue({ eq: mockDocEq });

      // Extraction uses maybeSingle now
      const mockExtMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockExtEq = vi.fn().mockReturnValue({ maybeSingle: mockExtMaybeSingle });
      const mockExtSelect = vi.fn().mockReturnValue({ eq: mockExtEq });

      mockFrom
        .mockReturnValueOnce({ select: mockDocSelect })
        .mockReturnValueOnce({ select: mockExtSelect });

      await act(async () => {
        await result.current.loadDocument('doc-new');
      });

      expect(result.current.data?.entryMode).toBe('document');
      expect(result.current.data?.documentId).toBe('doc-new');
    });
  });
});
