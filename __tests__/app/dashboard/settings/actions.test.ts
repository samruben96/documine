/**
 * Tests for settings server actions
 * Tests AC-2.6.2, AC-2.6.3, AC-3.1.2, AC-3.1.3, AC-3.1.4
 * Tests AC-3.2.1 to AC-3.2.9 (invitation actions)
 * Tests AC-3.5.1 to AC-3.5.6 (usage metrics)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server supabase client
const mockUpdateEq = vi.fn(() => ({ data: null, error: null }));
const mockSelectSingle = vi.fn(() => ({ data: null, error: null }));
const mockSelectMaybeSingle = vi.fn(() => ({ data: null, error: null }));
const mockSelectCount = vi.fn(() => ({ count: 0, error: null }));
const mockInsertSelect = vi.fn(() => ({ data: { id: 'inv-123' }, error: null }));
const mockDeleteEq = vi.fn(() => ({ error: null }));
const mockGetUser = vi.fn();
const mockInviteUserByEmail = vi.fn(() => ({ error: null }));
const mockDeleteAuthUser = vi.fn(() => ({ error: null }));

// Track which table is being queried
let currentTable = '';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((tableName: string) => {
      currentTable = tableName;
      return {
        update: vi.fn(() => ({
          eq: mockUpdateEq,
        })),
        select: vi.fn((columns?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact' && opts?.head === true) {
            // For count queries with filtering (eq, eq.eq, eq.gte, eq.eq.gte)
            // Create a thenable object that only resolves mockSelectCount when awaited
            const createThenable = () => ({
              eq: vi.fn(() => createThenable()),
              gte: vi.fn(() => createThenable()),
              then: (resolve: (value: { count: number | null; error: null }) => void) => {
                resolve(mockSelectCount());
              },
            });
            return {
              eq: vi.fn(() => createThenable()),
            };
          }
          // For regular select queries
          const buildSelectChain = () => ({
            single: mockSelectSingle,
            maybeSingle: mockSelectMaybeSingle,
            eq: vi.fn(() => buildSelectChain()),
            gte: vi.fn(() => ({ data: [], error: null })),
          });
          return {
            eq: vi.fn(() => buildSelectChain()),
            single: mockSelectSingle,
          };
        }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockInsertSelect,
          })),
        })),
        delete: vi.fn(() => ({
          eq: mockDeleteEq,
        })),
      };
    }),
  })),
  createServiceClient: vi.fn(() => ({
    auth: {
      admin: {
        inviteUserByEmail: mockInviteUserByEmail,
        deleteUser: mockDeleteAuthUser,
      },
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Must import after mocks
import { updateProfile, updateAgency, inviteUser, resendInvitation, cancelInvitation, removeTeamMember, changeUserRole, getBillingInfo, updateSubscriptionTier, getUsageMetrics } from '@/app/(dashboard)/settings/actions';

describe('updateProfile server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.6.2: Name validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockUpdateEq.mockResolvedValue({ data: null, error: null });
    });

    it('rejects names shorter than 2 characters', async () => {
      const result = await updateProfile({ fullName: 'A' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters');
    });

    it('rejects empty names', async () => {
      const result = await updateProfile({ fullName: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('rejects names longer than 100 characters', async () => {
      const longName = 'A'.repeat(101);
      const result = await updateProfile({ fullName: longName });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name must be at most 100 characters');
    });

    it('accepts valid names (2-100 chars)', async () => {
      const result = await updateProfile({ fullName: 'John Doe' });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts minimum valid name (2 chars)', async () => {
      const result = await updateProfile({ fullName: 'Jo' });

      expect(result.success).toBe(true);
    });

    it('accepts maximum valid name (100 chars)', async () => {
      const maxName = 'A'.repeat(100);
      const result = await updateProfile({ fullName: maxName });

      expect(result.success).toBe(true);
    });
  });

  describe('AC-2.6.3: Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await updateProfile({ fullName: 'John Doe' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('Database error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it('returns error when database update fails', async () => {
      mockUpdateEq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await updateProfile({ fullName: 'John Doe' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update profile');
    });

    it('returns success when database update succeeds', async () => {
      mockUpdateEq.mockResolvedValue({ data: null, error: null });

      const result = await updateProfile({ fullName: 'Jane Doe' });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('updateAgency server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-3.1.2: Agency name validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null
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
        error: null
      });

      const result = await updateAgency({ name: 'New Agency Name' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can update agency settings');
    });

    it('allows admin users to update', async () => {
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null
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
        error: null
      });
    });

    it('returns error when user data fetch fails', async () => {
      mockSelectSingle.mockResolvedValue({
        data: null,
        error: { message: 'Failed to get user' }
      });

      const result = await updateAgency({ name: 'Test Agency' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user data');
    });

    it('returns error when database update fails', async () => {
      mockUpdateEq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
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

describe('inviteUser server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-3.2.1: Email validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1', seat_limit: 10 },
        error: null
      });
      mockSelectCount.mockResolvedValue({ count: 1, error: null });
      mockSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockInsertSelect.mockResolvedValue({ data: { id: 'inv-123' }, error: null });
      mockInviteUserByEmail.mockResolvedValue({ error: null });
    });

    it('rejects invalid email format', async () => {
      const result = await inviteUser({ email: 'not-an-email', role: 'member' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('accepts valid email format', async () => {
      const result = await inviteUser({ email: 'test@example.com', role: 'member' });

      expect(result.success).toBe(true);
    });
  });

  describe('AC-3.2.4: Admin-only access', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'member@example.com' } },
      });
    });

    it('rejects non-admin users', async () => {
      mockSelectSingle.mockResolvedValue({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null
      });

      const result = await inviteUser({ email: 'test@example.com', role: 'member' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can invite users');
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await inviteUser({ email: 'test@example.com', role: 'member' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});

describe('resendInvitation server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-3.2.8: Resend functionality', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('requires admin role', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null
      });

      const result = await resendInvitation('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can resend invitations');
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await resendInvitation('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});

describe('cancelInvitation server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-3.2.9: Cancel functionality', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
    });

    it('requires admin role', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member', agency_id: 'agency-1' },
        error: null
      });

      const result = await cancelInvitation('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can cancel invitations');
    });
  });

  describe('Authentication checks', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await cancelInvitation('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });
});

describe('removeTeamMember server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        error: null
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
        error: null
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
        error: null
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      });
      // Admin count = 1
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });

      const result = await removeTeamMember('target-admin-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove the last admin. Promote another member to admin first.');
    });

    it('allows removing admin when more than one admin exists', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
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
    vi.clearAllMocks();
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
        error: null
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
        error: null
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
        error: null
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      });
      // Admin count = 1
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });

      const result = await changeUserRole('target-admin-id', 'member');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot demote the last admin. Promote another member to admin first.');
    });

    it('allows demoting admin when more than one admin exists', async () => {
      // Current user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null
      });
      // Target user check (admin)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
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
        error: null
      });
      // Target user check (member)
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'member' },
        error: null
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

describe('getBillingInfo server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockSelectCount to default implementation
    mockSelectCount.mockImplementation(() => ({ count: 0, error: null }));
  });

  describe('AC-3.4.1, AC-3.4.2: Returns billing information', () => {
    it('returns billing info with tier, seatLimit, currentSeats, agencyName', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      // First call: get user's agency_id
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null
      });
      // Second call: get agency details
      mockSelectSingle.mockResolvedValueOnce({
        data: { name: 'Test Agency', subscription_tier: 'professional', seat_limit: 10 },
        error: null
      });
      // Note: mockSelectCount uses the nested mock and returns { count: 0 } by default
      // The test verifies the structure is returned correctly

      const result = await getBillingInfo();

      expect(result.tier).toBe('professional');
      expect(result.seatLimit).toBe(10);
      // currentSeats comes from mock which returns 0 by default
      expect(result.currentSeats).toBe(0);
      expect(result.agencyName).toBe('Test Agency');
    });

    it('returns starter tier as default when not set', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { name: 'Test Agency', subscription_tier: null, seat_limit: null },
        error: null
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
        error: null
      });

      await expect(getBillingInfo()).rejects.toThrow('No agency found');
    });

    it('throws error when agency load fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: { agency_id: 'agency-1' },
        error: null
      });
      mockSelectSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Agency not found' }
      });

      await expect(getBillingInfo()).rejects.toThrow('Failed to load agency');
    });
  });
});

describe('updateSubscriptionTier server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        error: null
      });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can change subscription tier');
    });

    it('allows admin to change tier', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { role: 'admin', agency_id: 'agency-1' },
        error: null
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
        error: null
      });
      // Currently have 5 users, trying to downgrade to starter (3 seats)
      // Mock returns count: 5 via the nested eq() call
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
        error: null
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
        error: null
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
        error: null
      });
      mockSelectCount.mockResolvedValueOnce({ count: 1, error: null });
    });

    it('returns error when database update fails', async () => {
      mockUpdateEq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const result = await updateSubscriptionTier('professional');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update subscription tier');
    });
  });
});

describe('getUsageMetrics server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure mockSelectCount returns default value (reset any previous mockReturnValue)
    mockSelectCount.mockImplementation(() => ({ count: 0, error: null }));
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
        error: null
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
        error: null
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
        error: null
      });
      // Default mockSelectCount already returns { count: 0, error: null }
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
