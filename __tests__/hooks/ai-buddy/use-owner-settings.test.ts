/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - useOwnerSettings Hook
 * Story 20.5: Owner Management
 *
 * Tests for subscription data fetching, admin list loading, and transfer mutation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOwnerSettings } from '@/hooks/ai-buddy/use-owner-settings';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOwnerSettings', () => {
  const mockOwnerSubscription = {
    isOwner: true,
    plan: 'Professional',
    billingCycle: 'monthly',
    seatsUsed: 3,
    maxSeats: 5,
    billingContact: {
      name: 'Archway Computer',
      email: 'billing@archwaycomputer.com',
      message: 'For billing inquiries, contact Archway Computer.',
    },
  };

  const mockNonOwnerSubscription = {
    isOwner: false,
    ownerEmail: 'owner@example.com',
    message: 'Contact agency owner for subscription information.',
  };

  const mockAdmins = {
    admins: [
      { id: 'admin-1', email: 'admin1@example.com', name: 'Admin One' },
      { id: 'admin-2', email: 'admin2@example.com', name: null },
    ],
    count: 2,
  };

  const mockTransferResult = {
    transferred: true,
    previousOwner: { id: 'owner-1', email: 'owner@example.com', name: 'Owner' },
    newOwner: { id: 'admin-1', email: 'admin1@example.com', name: 'Admin One' },
    transferredAt: '2025-12-09T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subscription Fetching', () => {
    it('fetches subscription on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOwnerSubscription,
      });

      const { result } = renderHook(() => useOwnerSettings());

      expect(result.current.isLoadingSubscription).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/subscription');
      expect(result.current.subscription).toEqual(mockOwnerSubscription);
    });

    it('sets subscriptionError on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Forbidden' }),
      });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      expect(result.current.subscriptionError).toBeInstanceOf(Error);
      expect(result.current.subscriptionError?.message).toBe('Forbidden');
    });

    it('derives isOwner from subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOwnerSubscription,
      });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isOwner).toBe(true);
      });
    });

    it('isOwner is false for non-owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNonOwnerSubscription,
      });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isOwner).toBe(false);
      });
    });
  });

  describe('Admin List Fetching', () => {
    it('fetches admins when subscription indicates owner', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmins,
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.admins.length).toBe(2);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/transfer-ownership');
    });

    it('does not fetch admins when not owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNonOwnerSubscription,
      });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      // Should only have one call (subscription), not two
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.admins).toEqual([]);
    });

    it('sets adminsError on fetch failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to load admins' }),
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.adminsError).toBeInstanceOf(Error);
      });
    });
  });

  describe('Transfer Ownership', () => {
    it('calls transfer API with correct parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmins,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransferResult,
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      let transferResult;
      await act(async () => {
        transferResult = await result.current.transferOwnership('admin-1', 'password123');
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/admin/transfer-ownership',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newOwnerId: 'admin-1', confirmPassword: 'password123' }),
        }
      );
      expect(transferResult).toEqual(mockTransferResult);
    });

    it('sets isTransferring during transfer', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmins,
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => mockTransferResult,
                  }),
                100
              )
            )
        );

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      expect(result.current.isTransferring).toBe(false);

      act(() => {
        result.current.transferOwnership('admin-1', 'password123');
      });

      expect(result.current.isTransferring).toBe(true);

      await waitFor(() => {
        expect(result.current.isTransferring).toBe(false);
      });
    });

    it('throws error on transfer failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmins,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid password' }),
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.isLoadingSubscription).toBe(false);
      });

      await expect(
        result.current.transferOwnership('admin-1', 'wrongpassword')
      ).rejects.toThrow('Invalid password');
    });
  });

  describe('Derived State', () => {
    it('canTransfer is true when owner and admins available', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmins,
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.canTransfer).toBe(true);
      });
    });

    it('canTransfer is false when not owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNonOwnerSubscription,
      });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.canTransfer).toBe(false);
      });
    });

    it('canTransfer is false when no admins available', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOwnerSubscription,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ admins: [], count: 0 }),
        });

      const { result } = renderHook(() => useOwnerSettings());

      await waitFor(() => {
        expect(result.current.admins.length).toBe(0);
      });

      expect(result.current.canTransfer).toBe(false);
    });
  });
});
