import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the createClient before importing the action
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { renameDocument } from '@/app/(dashboard)/chat-docs/actions';
import { createClient } from '@/lib/supabase/server';

describe('renameDocument server action', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
  });

  describe('AC-4.5.3: Rename Validation', () => {
    it('rejects empty names', async () => {
      const result = await renameDocument('doc-1', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name cannot be empty');
    });

    it('rejects names with only whitespace', async () => {
      const result = await renameDocument('doc-1', '   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name cannot be empty');
    });

    it('rejects names longer than 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const result = await renameDocument('doc-1', longName);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name too long (max 255 characters)');
    });

    it('rejects names with forward slash', async () => {
      const result = await renameDocument('doc-1', 'path/to/name');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name cannot contain path separators');
    });

    it('rejects names with backslash', async () => {
      const result = await renameDocument('doc-1', 'path\\to\\name');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name cannot contain path separators');
    });

    it('accepts valid names up to 255 characters', async () => {
      const validName = 'a'.repeat(255);
      const result = await renameDocument('doc-1', validName);
      expect(result.success).toBe(true);
    });
  });

  describe('AC-4.5.4: Rename Persistence', () => {
    it('trims whitespace from name before saving', async () => {
      const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await renameDocument('doc-1', '  My Document  ');
      expect(updateMock).toHaveBeenCalledWith({ display_name: 'My Document' });
    });

    it('returns error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await renameDocument('doc-1', 'New Name');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('returns success when rename succeeds', async () => {
      const result = await renameDocument('doc-1', 'New Document Name');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
