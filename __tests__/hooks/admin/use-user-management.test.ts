/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - useUserManagement Hook
 * Story 20.2: Admin User Management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserManagement } from '@/hooks/admin/use-user-management';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useUserManagement', () => {
  const mockUserResponse = {
    users: [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        aiBuddyStatus: 'active',
        lastActiveAt: '2025-12-08T10:00:00Z',
        onboardingCompleted: true,
        isOwner: false,
      },
    ],
    invitations: [],
    totalCount: 1,
    totalPages: 1,
    currentPage: 1,
  };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUserResponse),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Fetch', () => {
    it('fetches users on mount', async () => {
      const { result } = renderHook(() => useUserManagement());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users')
      );
      expect(result.current.users).toEqual(mockUserResponse.users);
    });

    it('sets error on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch' }),
      });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe('Failed to fetch');
    });
  });

  describe('Pagination', () => {
    it('includes pagination params in fetch', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=1.*pageSize=20/)
      );
    });

    it('refetches when page changes', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/page=2/)
        );
      });
    });
  });

  describe('Sorting', () => {
    it('includes sort params in fetch', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/sortColumn=name.*sortDirection=asc/)
      );
    });

    it('toggles sort direction when clicking same column', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSort('name');
      });

      expect(result.current.sortDirection).toBe('desc');
    });

    it('resets to asc when clicking different column', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSort('email');
      });

      expect(result.current.sortColumn).toBe('email');
      expect(result.current.sortDirection).toBe('asc');
    });
  });

  describe('Search', () => {
    it('includes search param in fetch', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/search=test/)
        );
      });
    });

    it('resets to page 1 when search changes', async () => {
      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Invite User', () => {
    it('posts invitation and refetches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'inv-1', email: 'new@example.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.inviteUser('new@example.com', 'producer');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', role: 'producer' }),
      });
    });

    it('throws error on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Email already exists' }),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.inviteUser('existing@example.com', 'producer');
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Remove User', () => {
    it('deletes user and refetches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeUser('user-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?userId=user-1', {
        method: 'DELETE',
      });
    });
  });

  describe('Change Role', () => {
    it('patches user role and refetches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-1', role: 'producer' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeRole('user-1', 'producer');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'producer' }),
      });
    });
  });

  describe('Cancel Invitation', () => {
    it('deletes invitation and refetches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelInvitation('inv-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/invitations/inv-1', {
        method: 'DELETE',
      });
    });
  });

  describe('Resend Invitation', () => {
    it('posts to resend and refetches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'inv-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse),
        });

      const { result } = renderHook(() => useUserManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resendInvitation('inv-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/invitations/inv-1', {
        method: 'POST',
      });
    });
  });
});
