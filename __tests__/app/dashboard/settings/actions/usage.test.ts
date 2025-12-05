/**
 * Tests for getUsageMetrics server action
 * Tests AC-3.5.1 to AC-3.5.6 (Usage metrics)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGetUser,
  mockSelectSingle,
  mockSelectCount,
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
import { getUsageMetrics } from '@/app/(dashboard)/settings/actions';

describe('getUsageMetrics server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.5.6: Admin-only access', () => {
    it('returns null when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await getUsageMetrics();

      expect(result).toBeNull();
    });

    it('returns null when user is not an admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'member@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null,
      });

      const result = await getUsageMetrics();

      expect(result).toBeNull();
    });

    it('returns null when user has no agency_id', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: null },
        error: null,
      });

      const result = await getUsageMetrics();

      expect(result).toBeNull();
    });
  });

  describe('AC-3.5.1 to AC-3.5.4: Returns usage metrics for admin', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
    });

    it('returns correct structure with all metrics', async () => {
      const result = await getUsageMetrics();

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('documentsUploaded');
      expect(result).toHaveProperty('queriesAsked');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('storageUsedBytes');
    });

    it('returns documentsUploaded with thisMonth and allTime (AC-3.5.1)', async () => {
      const result = await getUsageMetrics();

      expect(result?.documentsUploaded).toHaveProperty('thisMonth');
      expect(result?.documentsUploaded).toHaveProperty('allTime');
      expect(typeof result?.documentsUploaded.thisMonth).toBe('number');
      expect(typeof result?.documentsUploaded.allTime).toBe('number');
    });

    it('returns queriesAsked with thisMonth and allTime (AC-3.5.2)', async () => {
      const result = await getUsageMetrics();

      expect(result?.queriesAsked).toHaveProperty('thisMonth');
      expect(result?.queriesAsked).toHaveProperty('allTime');
      expect(typeof result?.queriesAsked.thisMonth).toBe('number');
      expect(typeof result?.queriesAsked.allTime).toBe('number');
    });

    it('returns activeUsers as a number (AC-3.5.3)', async () => {
      const result = await getUsageMetrics();

      expect(typeof result?.activeUsers).toBe('number');
    });

    it('returns storageUsedBytes as a number (AC-3.5.4)', async () => {
      const result = await getUsageMetrics();

      expect(typeof result?.storageUsedBytes).toBe('number');
    });

    it('defaults counts to 0 when database returns null', async () => {
      mockSelectCount.mockImplementation(() => ({ count: null, error: null }));

      const result = await getUsageMetrics();

      expect(result?.documentsUploaded.thisMonth).toBe(0);
      expect(result?.documentsUploaded.allTime).toBe(0);
      expect(result?.queriesAsked.thisMonth).toBe(0);
      expect(result?.queriesAsked.allTime).toBe(0);
    });
  });
});
