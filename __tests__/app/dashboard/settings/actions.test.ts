/**
 * Tests for settings server actions
 * Tests AC-2.6.2, AC-2.6.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server supabase client
const mockUpdate = vi.fn();
const mockEq = vi.fn(() => ({ data: null, error: null }));
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: mockEq,
      })),
    })),
  })),
}));

// Must import after mocks
import { updateProfile } from '@/app/(dashboard)/settings/actions';

describe('updateProfile server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.6.2: Name validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockEq.mockResolvedValue({ data: null, error: null });
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
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await updateProfile({ fullName: 'John Doe' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update profile');
    });

    it('returns success when database update succeeds', async () => {
      mockEq.mockResolvedValue({ data: null, error: null });

      const result = await updateProfile({ fullName: 'Jane Doe' });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
