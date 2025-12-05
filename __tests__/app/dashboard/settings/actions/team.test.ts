/**
 * Tests for team management server actions
 * Tests AC-3.3.2 to AC-3.3.7 (Team member management)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGetUser,
  mockSelectSingle,
  mockSelectCount,
  mockUpdateEq,
  mockDeleteEq,
  mockDeleteAuthUser,
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
import { removeTeamMember, changeUserRole } from '@/app/(dashboard)/settings/actions';

describe('removeTeamMember server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.3.2: Admin-only access', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('requires admin role to remove team members', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null,
      });

      const result = await removeTeamMember('target-user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can remove team members');
    });
  });

  describe('AC-3.3.4: Self-removal prevention', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
    });

    it('prevents user from removing themselves', async () => {
      const result = await removeTeamMember('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot remove yourself from the agency');
    });
  });

  describe('AC-3.3.5: Last admin prevention', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('prevents removing the last admin', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });
      // Admin count = 1
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });

      const result = await removeTeamMember('target-admin-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Cannot remove the last admin. Promote another member to admin first.'
      );
    });

    it('allows removing admin when more than one admin exists', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });
      // Admin count = 2
      mockSelectCount.mockResolvedValueOnce({ count: 2, error: null });
      mockDeleteEq.mockResolvedValueOnce({ error: null });
      mockDeleteAuthUser.mockResolvedValueOnce({ error: null });

      const result = await removeTeamMember('target-admin-id');

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await removeTeamMember('target-user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});

describe('changeUserRole server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.3.6: Admin-only access', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('requires admin role to change user roles', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null,
      });

      const result = await changeUserRole('target-user-id', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can change user roles');
    });
  });

  describe('AC-3.3.7: Self-role-change prevention', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
    });

    it('prevents user from changing their own role', async () => {
      const result = await changeUserRole('user-123', 'member');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot change your own role');
    });
  });

  describe('AC-3.3.5: Last admin prevention on demotion', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('prevents demoting the last admin to member', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });
      // Admin count = 1
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });

      const result = await changeUserRole('target-admin-id', 'member');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Cannot demote the last admin. Promote another member to admin first.'
      );
    });

    it('allows demoting admin when more than one admin exists', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });
      // Admin count = 2
      mockSelectCount.mockResolvedValueOnce({ count: 2, error: null });
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await changeUserRole('target-admin-id', 'member');

      expect(result.success).toBe(true);
    });
  });

  describe('Role updates', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('successfully promotes member to admin', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null,
      });
      // Target user check (member)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member' },
        error: null,
      });
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await changeUserRole('target-member-id', 'admin');

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await changeUserRole('target-user-id', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});
