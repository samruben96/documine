/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for useAuditLogs Hook
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - Fetching audit logs data
 * - Pagination handling
 * - Filter changes
 * - Transcript fetching
 * - Export functionality
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuditLogs } from '@/hooks/admin/use-audit-logs';
import type { AuditLogTableEntry } from '@/app/api/admin/audit-logs/route';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:url');
global.URL.revokeObjectURL = vi.fn();

const createMockEntry = (id: string): AuditLogTableEntry => ({
  id,
  agencyId: 'agency-1',
  userId: 'user-1',
  userName: 'Test User',
  userEmail: 'test@example.com',
  conversationId: 'conv-1',
  conversationTitle: 'Test Conversation',
  projectId: 'proj-1',
  projectName: 'Test Project',
  action: 'conversation_created',
  metadata: {},
  loggedAt: '2024-01-15T10:30:00Z',
  messageCount: 5,
  guardrailEventCount: 0,
});

const mockApiResponse = {
  data: {
    entries: [createMockEntry('entry-1'), createMockEntry('entry-2')],
    total: 50,
    page: 1,
    pageSize: 25,
    totalPages: 2,
  },
};

describe('useAuditLogs', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Fetch', () => {
    it('fetches logs on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useAuditLogs());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('/api/admin/audit-logs');
    });

    it('populates logs after fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(2);
      });

      expect(result.current.logs[0].id).toBe('entry-1');
    });

    it('sets pagination data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalCount).toBe(50);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(2);
    });
  });

  describe('Pagination', () => {
    it('allows changing page', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockApiResponse,
            data: { ...mockApiResponse.data, page: 2 },
          }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      const secondCallArg = mockFetch.mock.calls[1][0];
      expect(secondCallArg).toContain('page=2');
    });

    it('uses custom page size', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useAuditLogs({ pageSize: 10 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pageSize).toBe(10);
      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('limit=10');
    });
  });

  describe('Filters', () => {
    it('resets to page 1 when filters change', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });

      const { result } = renderHook(() => useAuditLogs({ initialPage: 2 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ search: 'test' });
      });

      await waitFor(() => {
        expect(result.current.page).toBe(1);
      });
    });

    it('includes userId filter in query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() =>
        useAuditLogs({ initialFilters: { userId: 'user-123' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('userId=user-123');
    });

    it('includes date range filters in query', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() =>
        useAuditLogs({ initialFilters: { startDate, endDate } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('startDate=');
      expect(callArg).toContain('endDate=');
    });

    it('includes search filter in query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() =>
        useAuditLogs({ initialFilters: { search: 'policy' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('search=policy');
    });

    it('includes hasGuardrailEvents filter in query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() =>
        useAuditLogs({ initialFilters: { hasGuardrailEvents: true } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('hasGuardrailEvents=true');
    });
  });

  describe('Transcript Fetching', () => {
    it('fetches transcript for conversation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              conversation: { id: 'conv-1', title: 'Test' },
              messages: [],
              guardrailEvents: [],
            },
          }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const transcript = await result.current.fetchTranscript('conv-1');

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/admin/audit-logs/conv-1/transcript'
      );
      expect(transcript).toHaveProperty('conversation');
    });

    it('throws error on transcript fetch failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: { message: 'Not found' } }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.fetchTranscript('invalid-id')).rejects.toThrow();
    });
  });

  describe('Export', () => {
    it('exports as CSV', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['csv data'])),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const url = await result.current.exportLogs('csv');

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/admin/audit-logs/export',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"format":"csv"'),
        })
      );
      expect(url).toBe('blob:url');
    });

    it('exports as PDF', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { entries: [] } }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dataStr = await result.current.exportLogs('pdf');

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/admin/audit-logs/export',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"format":"pdf"'),
        })
      );
      expect(dataStr).toContain('entries');
    });

    it('includes transcripts option for PDF export', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { entries: [] } }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.exportLogs('pdf', true);

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/admin/audit-logs/export',
        expect.objectContaining({
          body: expect.stringContaining('"includeTranscripts":true'),
        })
      );
    });

    it('includes current filters in export', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() =>
        useAuditLogs({ initialFilters: { userId: 'user-1' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { entries: [] } }),
      });

      await result.current.exportLogs('pdf');

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[1].body).toContain('"userId":"user-1"');
    });
  });

  describe('Refetch', () => {
    it('refetches current data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockApiResponse,
            data: {
              ...mockApiResponse.data,
              entries: [createMockEntry('entry-3')],
            },
          }),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(2);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.logs).toHaveLength(0);
    });

    it('sets error on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it('clears error on successful refetch', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
