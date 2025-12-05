/**
 * Tests for billing server actions
 * Tests AC-3.4.1 to AC-3.4.6 (Billing and subscription)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGetUser,
  mockSelectSingle,
  mockSelectCount,
  mockUpdateEq,
  createMockSupabaseClient,
  createMockServiceClient,
  resetAllMocks,
} from './mocks';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => createMockSupabaseClient()),
  createServiceClient: vi.fn(() => createMockServiceClient()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks
import { getBillingInfo, updateSubscriptionTier } from '@/app/(dashboard)/settings/actions';

describe('getBillingInfo server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.4.1, AC-3.4.2: Returns billing information', () => {
    it('returns billing info with tier, seatLimit, currentSeats, agencyName', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      // First call: get user's agency_id
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null,
      });
      // Second call: get agency details
      mockSelectSingle.mockResolvedValueOnce({
        data: { name: 'Test Agency', subscription_tier: 'professional', seat_limit: 10 },
        error: null,
      });

      const result = await getBillingInfo();

      expect(result.tier).toBe('professional');
      expect(result.seatLimit).toBe(10);
      expect(result.currentSeats).toBe(0);
      expect(result.agencyName).toBe('Test Agency');
    });

    it('returns starter tier as default when not set', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null,
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { name: 'Test Agency', subscription_tier: null, seat_limit: null },
        error: null,
      });

      const result = await getBillingInfo();

      expect(result.tier).toBe('starter');
      expect(result.seatLimit).toBe(3);
    });
  });

  describe('Authentication checks', () => {
    it('throws error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(getBillingInfo()).rejects.toThrow('Not authenticated');
    });
  });

  describe('Error handling', () => {
    it('throws error when no agency found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(getBillingInfo()).rejects.toThrow('No agency found');
    });

    it('throws error when agency load fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null,
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Agency not found' },
      });

      await expect(getBillingInfo()).rejects.toThrow('Failed to load agency');
    });
  });
});

describe('updateSubscriptionTier server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.4.6: Admin-only access', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it('requires admin role to change subscription tier', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null,
      });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can change subscription tier');
    });

    it('allows admin to change tier', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      mockSelectCount.mockResolvedValueOnce({ count: 3, error: null });
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(true);
    });
  });

  describe('AC-3.4.6: Seat limit validation on downgrade', () => {
    it('blocks downgrade when current users exceed new seat limit', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Currently have 5 users, trying to downgrade to starter (3 seats)
      mockSelectCount.mockReturnValue({ count: 5, error: null });

      const result = await updateSubscriptionTier('starter');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot downgrade to starter');
      expect(result.error).toContain('5');
      expect(result.error).toContain('3 seat limit');
    });

    it('allows downgrade when users fit within new limit', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Currently have 2 users, downgrading to starter (3 seats) is fine
      mockSelectCount.mockReturnValue({ count: 2, error: null });
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSubscriptionTier('starter');

      expect(result.success).toBe(true);
    });
  });

  describe('AC-3.4.6: Updates both tier and seat_limit', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });
    });

    it('updates to professional tier with 10 seats', async () => {
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(true);
    });

    it('updates to agency tier with 25 seats', async () => {
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSubscriptionTier('agency');

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });
    });

    it('returns error when database update fails', async () => {
      mockUpdateEq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update subscription tier');
    });
  });
});
