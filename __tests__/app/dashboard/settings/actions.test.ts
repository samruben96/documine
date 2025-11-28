/**
 * Tests for settings server actions
 * Tests AC-2.6.2, AC-2.6.3, AC-3.1.2, AC-3.1.3, AC-3.1.4
 * Tests AC-3.2.1 to AC-3.2.9 (invitation actions)
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
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => mockSelectCount()),
              })),
            };
          }
          return {
            eq: vi.fn(() => ({
              single: mockSelectSingle,
              eq: vi.fn(() => ({
                single: mockSelectSingle,
                eq: vi.fn(() => ({
                  maybeSingle: mockSelectMaybeSingle,
                })),
                maybeSingle: mockSelectMaybeSingle,
              })),
              maybeSingle: mockSelectMaybeSingle,
            })),
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
import { updateProfile, updateAgency, inviteUser, resendInvitation, cancelInvitation } from '@/app/(dashboard)/settings/actions';

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
