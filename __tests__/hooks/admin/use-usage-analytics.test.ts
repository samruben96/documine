/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for useUsageAnalytics Hook
 * Story 20.3: Usage Analytics Dashboard
 *
 * Tests:
 * - Fetching analytics data
 * - Date range changes
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsageAnalytics } from '@/hooks/admin/use-usage-analytics';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useUsageAnalytics', () => {
  const mockApiResponse = {
    summary: {
      totalConversations: 100,
      activeUsers: 10,
      documentsUploaded: 25,
      messagesSent: 500,
      comparisonPeriod: {
        conversations: 5,
        users: -2,
        documents: 10,
        messages: 8,
      },
    },
    byUser: [
      {
        userId: 'user-1',
        userName: 'Test User',
        userEmail: 'test@example.com',
        conversations: 50,
        messages: 200,
        documents: 10,
        lastActiveAt: '2024-01-15T10:00:00Z',
      },
    ],
    trends: [
      { date: '2024-01-14', activeUsers: 8, conversations: 20, messages: 100 },
      { date: '2024-01-15', activeUsers: 10, conversations: 25, messages: 120 },
    ],
    period: {
      type: '30days',
      startDate: '2024-01-08T00:00:00.000Z',
      endDate: '2024-01-15T23:59:59.999Z',
    },
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initial Fetch', () => {
    it('fetches analytics data on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      // Should start loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that fetch was called with the analytics URL
      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg).toContain('/api/admin/analytics');
    });

    it('populates summary data after fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.summary).not.toBeNull();
      });

      expect(result.current.summary?.totalConversations).toBe(100);
      expect(result.current.summary?.activeUsers).toBe(10);
    });

    it('populates byUser data after fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.byUser.length).toBeGreaterThan(0);
      });

      expect(result.current.byUser[0].userName).toBe('Test User');
    });

    it('populates trends data after fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.trends.length).toBeGreaterThan(0);
      });

      expect(result.current.trends).toHaveLength(2);
    });
  });

  describe('Date Range', () => {
    it('sets default date range to 30days', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      expect(result.current.dateRange.period).toBe('30days');
    });

    it('refetches when date range changes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockApiResponse, summary: { ...mockApiResponse.summary, totalConversations: 200 } }),
        });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change date range
      act(() => {
        result.current.setDateRange({
          period: 'week',
          startDate: new Date('2023-12-15'),
          endDate: new Date('2024-01-15'),
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('sets error state on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      const { result } = renderHook(() => useUsageAnalytics());

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

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Empty State', () => {
    it('sets isEmpty to true when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockApiResponse,
          summary: { totalConversations: 0, activeUsers: 0, documentsUploaded: 0, messagesSent: 0 },
          byUser: [],
          trends: [],
        }),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true);
      });
    });

    it('sets isEmpty to false when data exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(false);
      });
    });
  });

  describe('Refetch', () => {
    it('refetches data when refetch is called', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockApiResponse, summary: { ...mockApiResponse.summary, totalConversations: 150 } }),
        });

      const { result } = renderHook(() => useUsageAnalytics());

      await waitFor(() => {
        expect(result.current.summary?.totalConversations).toBe(100);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.summary?.totalConversations).toBe(150);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
