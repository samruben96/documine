/**
 * Tests for invitation server actions
 * Tests AC-3.2.1 to AC-3.2.9 (Invitation actions)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGetUser,
  mockSelectSingle,
  mockSelectCount,
  mockSelectMaybeSingle,
  mockInsertSelect,
  mockInviteUserByEmail,
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
import {
  inviteUser,
  resendInvitation,
  cancelInvitation,
} from '@/app/(dashboard)/settings/actions';

describe('inviteUser server action', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AC-3.2.1: Email validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@example.com' } },
      });
      mockSelectSingle.mockResolvedValue({
        data: { role: 'admin', agency_id: 'agency-1', seat_limit: 10 },
        error: null,
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
        error: null,
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
    resetAllMocks();
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
        error: null,
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
    resetAllMocks();
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
        error: null,
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
