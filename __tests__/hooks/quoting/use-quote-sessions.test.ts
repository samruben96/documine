/**
 * @vitest-environment happy-dom
 */
/**
 * Quote Sessions Hook Tests
 * Story Q2.1: Quote Sessions List Page
 *
 * Tests for:
 * - AC-Q2.1-1: Sessions sorted by most recently updated first
 * - Delete with optimistic update
 * - Duplicate session
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuoteSessions } from '@/hooks/quoting/use-quote-sessions';
import type { QuoteSession } from '@/types/quoting';

// Mock session data
const mockSessions: QuoteSession[] = [
  {
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
  },
  {
    id: 'session-2',
    agencyId: 'agency-1',
    userId: 'user-1',
    prospectName: 'Johnson Family',
    quoteType: 'home',
    status: 'quotes_received',
    clientData: {},
    createdAt: '2025-12-09T10:00:00Z',
    updatedAt: '2025-12-11T10:00:00Z',
    carrierCount: 2,
  },
];

const mockDuplicatedSession: QuoteSession = {
  id: 'session-3',
  agencyId: 'agency-1',
  userId: 'user-1',
  prospectName: 'Smith Family (Copy)',
  quoteType: 'bundle',
  status: 'draft',
  clientData: { personal: { firstName: 'John', lastName: 'Smith' } },
  createdAt: '2025-12-11T16:00:00Z',
  updatedAt: '2025-12-11T16:00:00Z',
  carrierCount: 0,
};

const mockCreatedSession: QuoteSession = {
  id: 'session-new',
  agencyId: 'agency-1',
  userId: 'user-1',
  prospectName: 'New Prospect',
  quoteType: 'bundle',
  status: 'draft',
  clientData: {},
  createdAt: '2025-12-11T17:00:00Z',
  updatedAt: '2025-12-11T17:00:00Z',
  carrierCount: 0,
};

describe('useQuoteSessions', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns empty sessions array initially', () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], error: null }),
      });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      expect(result.current.sessions).toEqual([]);
    });

    it('isLoading is false initially', () => {
      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      expect(result.current.isLoading).toBe(false);
    });

    it('isMutating is false initially', () => {
      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      expect(result.current.isMutating).toBe(false);
    });

    it('error is null initially', () => {
      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      expect(result.current.error).toBeNull();
    });
  });

  describe('Auto-fetch', () => {
    it('fetches sessions on mount when autoFetch is true', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockSessions, error: null }),
      });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/quoting');
    });

    it('does not fetch on mount when autoFetch is false', () => {
      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.sessions).toEqual([]);
    });
  });

  describe('fetchSessions', () => {
    it('sets isLoading while fetching', async () => {
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ data: mockSessions, error: null }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      act(() => {
        result.current.fetchSessions();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets error on fetch failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ data: null, error: { message: 'Network error' } }),
      });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
    });

    it('includes search param in URL when provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], error: null }),
      });

      const { result } = renderHook(() =>
        useQuoteSessions({ autoFetch: false, search: 'Smith' })
      );

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/quoting?search=Smith');
    });

    it('includes status param in URL when provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], error: null }),
      });

      const { result } = renderHook(() =>
        useQuoteSessions({ autoFetch: false, status: 'draft' })
      );

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/quoting?status=draft');
    });
  });

  describe('createSession', () => {
    it('creates session and adds to top of list', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCreatedSession, error: null }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      let created: QuoteSession | null = null;
      await act(async () => {
        created = await result.current.createSession({
          prospectName: 'New Prospect',
          quoteType: 'bundle',
        });
      });

      expect(created).toBeTruthy();
      expect(created?.id).toBe('session-new');
      expect(created?.prospectName).toBe('New Prospect');

      // New session should be at the top
      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions[0].id).toBe('session-new');
    });

    it('sends POST request with correct body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedSession, error: null }),
      });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      await act(async () => {
        await result.current.createSession({
          prospectName: 'Test Prospect',
          quoteType: 'home',
        });
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/quoting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectName: 'Test Prospect', quoteType: 'home' }),
      });
    });

    it('returns null on create failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ data: null, error: { message: 'Create failed' } }),
      });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      let created: QuoteSession | null = null;
      await act(async () => {
        created = await result.current.createSession({
          prospectName: 'New Prospect',
          quoteType: 'bundle',
        });
      });

      expect(created).toBeNull();
      expect(result.current.error?.message).toBe('Create failed');
    });

    it('sets isMutating during creation', async () => {
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ data: mockCreatedSession, error: null }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: false }));

      act(() => {
        result.current.createSession({
          prospectName: 'New Prospect',
          quoteType: 'bundle',
        });
      });

      expect(result.current.isMutating).toBe(true);

      await waitFor(() => {
        expect(result.current.isMutating).toBe(false);
      });
    });
  });

  describe('deleteSession', () => {
    it('removes session from list optimistically', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { deleted: true }, error: null }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteSession('session-1');
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe('session-2');
    });

    it('reverts on delete failure', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ data: null, error: { message: 'Delete failed' } }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      await act(async () => {
        try {
          await result.current.deleteSession('session-1');
        } catch {
          // Expected to throw
        }
      });

      // Should revert back to original
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.error?.message).toBe('Delete failed');
    });
  });

  describe('duplicateSession', () => {
    it('adds duplicated session to the top of the list', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockDuplicatedSession, error: null }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      let duplicated: QuoteSession | null = null;
      await act(async () => {
        duplicated = await result.current.duplicateSession('session-1');
      });

      expect(duplicated).toBeTruthy();
      expect(duplicated?.id).toBe('session-3');
      expect(duplicated?.prospectName).toBe('Smith Family (Copy)');

      // New session should be at the top
      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions[0].id).toBe('session-3');
    });

    it('returns null on duplicate failure', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ data: null, error: { message: 'Duplicate failed' } }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      let duplicated: QuoteSession | null = null;
      await act(async () => {
        duplicated = await result.current.duplicateSession('session-1');
      });

      expect(duplicated).toBeNull();
      expect(result.current.error?.message).toBe('Duplicate failed');
      // List should remain unchanged
      expect(result.current.sessions).toHaveLength(2);
    });
  });

  describe('refresh', () => {
    it('re-fetches sessions when called', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSessions, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [mockSessions[0]], error: null }),
        });

      const { result } = renderHook(() => useQuoteSessions({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
