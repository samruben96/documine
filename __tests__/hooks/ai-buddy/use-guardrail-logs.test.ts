/**
 * Unit Tests - useGuardrailLogs Hook
 * Story 19.2: Enforcement Logging
 *
 * Tests for guardrail enforcement logs fetching hook
 *
 * AC-19.2.4: Supports table display with logs data
 * AC-19.2.6: Supports date range filtering
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGuardrailLogs } from '@/hooks/ai-buddy/use-guardrail-logs';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGuardrailLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockLogsResponse = {
    logs: [
      {
        id: 'log-1',
        agencyId: 'agency-123',
        userId: 'user-456',
        userEmail: 'test@example.com',
        conversationId: 'conv-789',
        triggeredTopic: 'legal advice',
        messagePreview: 'Can you help me sue...',
        redirectApplied: 'Please consult an attorney',
        loggedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'log-2',
        agencyId: 'agency-123',
        userId: 'user-789',
        userEmail: 'other@example.com',
        conversationId: 'conv-012',
        triggeredTopic: 'claims filing',
        messagePreview: 'I want to file a claim...',
        redirectApplied: 'Contact your carrier directly',
        loggedAt: '2024-01-14T09:00:00Z',
      },
    ],
    total: 2,
    hasMore: false,
  };

  describe('initial fetch', () => {
    it('fetches logs on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLogsResponse }),
      });

      const { result } = renderHook(() => useGuardrailLogs());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.logs).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useGuardrailLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.logs).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Server error');
    });

    it('handles 403 permission error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: { message: "Permission 'view_audit_logs' required" } }),
      });

      const { result } = renderHook(() => useGuardrailLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toContain('view_audit_logs');
    });
  });

  describe('date filtering (AC-19.2.6)', () => {
    it('passes date params to API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLogsResponse }),
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      renderHook(() => useGuardrailLogs({ startDate, endDate }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('startDate=');
      expect(callUrl).toContain('endDate=');
    });

    it('refetches when date range changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockLogsResponse }),
      });

      const { rerender } = renderHook(
        ({ startDate }) => useGuardrailLogs({ startDate }),
        { initialProps: { startDate: new Date('2024-01-01') } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Change date
      rerender({ startDate: new Date('2024-02-01') });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('pagination', () => {
    it('returns hasMore when more logs exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { logs: mockLogsResponse.logs, total: 50, hasMore: true },
        }),
      });

      const { result } = renderHook(() => useGuardrailLogs({ limit: 20 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
      expect(result.current.totalCount).toBe(50);
    });

    it('loadMore appends logs', async () => {
      const firstPage = {
        logs: [mockLogsResponse.logs[0]],
        total: 2,
        hasMore: true,
      };
      const secondPage = {
        logs: [mockLogsResponse.logs[1]],
        total: 2,
        hasMore: false,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: firstPage }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: secondPage }),
        });

      const { result } = renderHook(() => useGuardrailLogs({ limit: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);

      // Load more
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });

    it('does not loadMore when already loading', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: { ...mockLogsResponse, hasMore: true } }),
          }), 100)
        )
      );

      const { result } = renderHook(() => useGuardrailLogs());

      // Try to load more while still loading
      await act(async () => {
        await result.current.loadMore();
      });

      // Should only have one call (the initial fetch)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not loadMore when hasMore is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { ...mockLogsResponse, hasMore: false } }),
      });

      const { result } = renderHook(() => useGuardrailLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);

      // Try to load more
      await act(async () => {
        await result.current.loadMore();
      });

      // Should not make another request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('refetch', () => {
    it('refetches logs from the beginning', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockLogsResponse }),
      });

      const { result } = renderHook(() => useGuardrailLogs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading state', () => {
    it('shows loading state during fetch', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockLogsResponse }),
          }), 50)
        )
      );

      const { result } = renderHook(() => useGuardrailLogs());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
