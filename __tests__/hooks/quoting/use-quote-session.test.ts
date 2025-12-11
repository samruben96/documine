/**
 * @vitest-environment happy-dom
 */
/**
 * Single Quote Session Hook Tests
 * Story Q2.3: Quote Session Detail Page
 *
 * Tests for:
 * - AC-Q2.3-1: Fetch session data for display
 * - AC-Q2.3-6: Handle not-found case with redirect and toast
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { QuoteSession } from '@/types/quoting';

// Create mocks before vi.mock calls
const mockPush = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: (msg: string) => mockToastError(msg),
    success: (msg: string) => mockToastSuccess(msg),
    info: vi.fn(),
  },
}));

// Import after mocks
import { useQuoteSession } from '@/hooks/quoting/use-quote-session';

// Mock session data
const mockSession: QuoteSession = {
  id: 'session-1',
  agencyId: 'agency-1',
  userId: 'user-1',
  prospectName: 'Smith Family',
  quoteType: 'bundle',
  status: 'in_progress',
  clientData: { personal: { firstName: 'John', lastName: 'Smith' } },
  createdAt: '2025-12-10T10:00:00Z',
  updatedAt: '2025-12-11T15:00:00Z',
  carrierCount: 0,
};

describe('useQuoteSession', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns null session initially', () => {
      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false })
      );

      expect(result.current.session).toBeNull();
    });

    it('isLoading is false initially', () => {
      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false })
      );

      expect(result.current.isLoading).toBe(false);
    });

    it('error is null initially', () => {
      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false })
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe('Auto-fetch', () => {
    it('fetches session on mount when autoFetch is true', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockSession, error: null }),
      });

      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.session).toBeTruthy();
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/quoting/session-1');
      expect(result.current.session?.id).toBe('session-1');
    });

    it('does not fetch on mount when autoFetch is false', () => {
      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false })
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.session).toBeNull();
    });
  });

  describe('fetchSession', () => {
    it('sets isLoading while fetching', async () => {
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: () => Promise.resolve({ data: mockSession, error: null }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false })
      );

      act(() => {
        result.current.fetchSession();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets error on fetch failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ data: null, error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: false, redirectOnNotFound: false })
      );

      await act(async () => {
        await result.current.fetchSession();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Server error');
    });

    it('sets error when sessionId is empty', async () => {
      const { result } = renderHook(() =>
        useQuoteSession('', { autoFetch: false })
      );

      await act(async () => {
        await result.current.fetchSession();
      });

      expect(result.current.error?.message).toBe('Session ID is required');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('AC-Q2.3-6: Not found handling', () => {
    it('redirects to /quoting on 404 when redirectOnNotFound is true', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
      });

      const { result } = renderHook(() =>
        useQuoteSession('invalid-id', { autoFetch: false, redirectOnNotFound: true })
      );

      await act(async () => {
        await result.current.fetchSession();
      });

      expect(mockPush).toHaveBeenCalledWith('/quoting');
    });

    it('shows error toast on 404 when redirectOnNotFound is true', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
      });

      const { result } = renderHook(() =>
        useQuoteSession('invalid-id', { autoFetch: false, redirectOnNotFound: true })
      );

      await act(async () => {
        await result.current.fetchSession();
      });

      expect(mockToastError).toHaveBeenCalledWith('Quote session not found');
    });

    it('does not redirect on 404 when redirectOnNotFound is false', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
      });

      const { result } = renderHook(() =>
        useQuoteSession('invalid-id', { autoFetch: false, redirectOnNotFound: false })
      );

      await act(async () => {
        await result.current.fetchSession();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockToastError).not.toHaveBeenCalled();
      expect(result.current.error?.message).toBe('Quote session not found');
    });
  });

  describe('refresh', () => {
    it('re-fetches session when called', async () => {
      const updatedSession = { ...mockSession, prospectName: 'Updated Name' };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: mockSession, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: updatedSession, error: null }),
        });

      const { result } = renderHook(() =>
        useQuoteSession('session-1', { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.session?.prospectName).toBe('Smith Family');
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.session?.prospectName).toBe('Updated Name');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
