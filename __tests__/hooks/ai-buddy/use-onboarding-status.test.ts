/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - useOnboardingStatus Hook
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Fetch user list
 * AC-18.4.4: Filter by status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnboardingStatus } from '@/hooks/ai-buddy/use-onboarding-status';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOnboardingStatus', () => {
  const mockUsers = [
    {
      userId: 'user-1',
      email: 'completed@example.com',
      fullName: 'Completed User',
      onboardingCompleted: true,
      onboardingCompletedAt: '2025-12-08T10:00:00Z',
      onboardingSkipped: false,
    },
    {
      userId: 'user-2',
      email: 'skipped@example.com',
      fullName: 'Skipped User',
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: true,
    },
    {
      userId: 'user-3',
      email: 'notstarted@example.com',
      fullName: 'Not Started User',
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches users on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(3);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/ai-buddy/admin/onboarding-status');
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.users).toBeNull();
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Network error');
  });

  it('filters users by completed status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default filter is 'all'
    expect(result.current.filterStatus).toBe('all');
    expect(result.current.filteredUsers).toHaveLength(3);

    // Filter to completed
    act(() => {
      result.current.setFilterStatus('completed');
    });

    expect(result.current.filterStatus).toBe('completed');
    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('completed@example.com');
  });

  it('filters users by skipped status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilterStatus('skipped');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('skipped@example.com');
  });

  it('filters users by not_started status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilterStatus('not_started');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('notstarted@example.com');
  });

  it('shows all users when filter is all', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Filter to completed first
    act(() => {
      result.current.setFilterStatus('completed');
    });
    expect(result.current.filteredUsers).toHaveLength(1);

    // Back to all
    act(() => {
      result.current.setFilterStatus('all');
    });
    expect(result.current.filteredUsers).toHaveLength(3);
  });

  it('returns empty filteredUsers when users is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Admin access required' }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toBeNull();
    expect(result.current.filteredUsers).toEqual([]);
  });

  it('refetches data when refetch is called', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { users: mockUsers }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { users: [...mockUsers, { userId: 'user-4', email: 'new@example.com', fullName: 'New User', onboardingCompleted: true, onboardingCompletedAt: null, onboardingSkipped: false }] },
            error: null,
          }),
      });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(3);

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.users).toHaveLength(4);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handles response with error in body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null, error: 'Some error' }),
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Some error');
  });
});
