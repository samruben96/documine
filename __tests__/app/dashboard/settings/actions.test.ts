/**
 * Tests for settings server actions
 * Tests AC-2.6.2, AC-2.6.3, AC-3.1.2, AC-3.1.3, AC-3.1.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server supabase client
const mockUpdateEq = vi.fn(() => ({ data: null, error: null }));
const mockSelectSingle = vi.fn(() => ({ data: null, error: null }));
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: mockUpdateEq,
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSelectSingle,
        })),
      })),
    })),
  })),
}));

// Must import after mocks
import { updateProfile, updateAgency } from '@/app/(dashboard)/settings/actions';

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
