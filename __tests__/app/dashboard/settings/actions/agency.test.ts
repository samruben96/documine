/**
 * Tests for updateAgency server action
 * Tests AC-3.1.2, AC-3.1.3, AC-3.1.4 (Agency settings)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGetUser,
  mockUpdateEq,
  mockSelectSingle,
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
import { updateAgency } from '@/app/(dashboard)/settings/actions';

describe('updateAgency server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.1.2: Agency name validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      mockUpdateEq.mockResolvedValue({ data: null, error: null });
    });

    it('rejects agency names shorter than 2 characters', async () => {
      const result = await updateAgency({ name: 'A' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agency name must be at least 2 characters');
    });

    it('rejects empty agency names', async () => {
      const result = await updateAgency({ name: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('rejects agency names longer than 100 characters', async () => {
      const longName = 'A'.repeat(101);
      const result = await updateAgency({ name: longName });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agency name must be at most 100 characters');
    });

    it('accepts valid agency names (2-100 chars)', async () => {
      const result = await updateAgency({ name: 'Test Agency' });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts minimum valid name (2 chars)', async () => {
      const result = await updateAgency({ name: 'AB' });

      expect(result.success).toBe(true);
    });

    it('accepts maximum valid name (100 chars)', async () => {
      const maxName = 'A'.repeat(100);
      const result = await updateAgency({ name: maxName });

      expect(result.success).toBe(true);
    });
  });

  describe('AC-3.1.4: Admin-only access', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it('rejects non-admin users', async () => {
      mockSelectSingle.mockResolvedValue({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null,
      });

      const result = await updateAgency({ name: 'New Agency Name' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can update agency settings');
    });

    it('allows admin users to update', async () => {
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      mockUpdateEq.mockResolvedValue({ data: null, error: null });

      const result = await updateAgency({ name: 'Updated Agency Name' });

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await updateAgency({ name: 'Test Agency' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('AC-3.1.3: Database operations', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
    });

    it('returns error when user data fetch fails', async () => {
      mockSelectSingle.mockResolvedValue({
        data: null,
        error: { message: 'Failed to get user' },
      });

      const result = await updateAgency({ name: 'Test Agency' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user data');
    });

    it('returns error when database update fails', async () => {
      mockUpdateEq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await updateAgency({ name: 'Test Agency' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update agency settings');
    });

    it('returns success when update succeeds', async () => {
      mockUpdateEq.mockResolvedValue({ data: null, error: null });

      const result = await updateAgency({ name: 'Updated Agency' });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
