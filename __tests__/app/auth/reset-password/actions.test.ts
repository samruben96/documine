import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing the actions
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { requestPasswordReset, updatePassword } from '@/app/(auth)/reset-password/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

describe('Password Reset Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('calls supabase.auth.resetPasswordForEmail with correct params', async () => {
      const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      await requestPasswordReset('test@example.com');

      // Per PKCE fix: redirectTo now points to /auth/callback which handles
      // server-side code exchange, then redirects to /reset-password/update
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/callback?type=recovery'),
      });
    });

    it('returns success regardless of email existence (AC-2.5.1)', async () => {
      const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(result).toEqual({ success: true });
    });

    it('returns success even when Supabase returns error (security)', async () => {
      const mockResetPasswordForEmail = vi.fn().mockResolvedValue({
        error: { message: 'Email not found' },
      });
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      // Should still return success to prevent email enumeration
      const result = await requestPasswordReset('unknown@example.com');
      expect(result).toEqual({ success: true });
    });
  });

  describe('updatePassword', () => {
    it('rejects weak passwords (too short)', async () => {
      const result = await updatePassword('Pass1!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });

    it('rejects passwords without uppercase', async () => {
      const result = await updatePassword('password1!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must contain at least 1 uppercase letter');
    });

    it('rejects passwords without number', async () => {
      const result = await updatePassword('Password!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must contain at least 1 number');
    });

    it('rejects passwords without special character', async () => {
      const result = await updatePassword('Password1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must contain at least 1 special character');
    });

    it('calls supabase.auth.updateUser with valid password', async () => {
      const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        auth: {
          updateUser: mockUpdateUser,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      await updatePassword('ValidPass1!');

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'ValidPass1!' });
    });

    it('redirects to /login?reset=success on success (AC-2.5.6)', async () => {
      const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        auth: {
          updateUser: mockUpdateUser,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      await updatePassword('ValidPass1!');

      expect(redirect).toHaveBeenCalledWith('/login?reset=success');
    });

    it('returns error for expired session (AC-2.5.5)', async () => {
      const mockUpdateUser = vi.fn().mockResolvedValue({
        error: { message: 'Token expired' },
      });
      const mockSupabase = {
        auth: {
          updateUser: mockUpdateUser,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await updatePassword('ValidPass1!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('handles generic errors gracefully', async () => {
      const mockUpdateUser = vi.fn().mockResolvedValue({
        error: { message: 'Unknown error' },
      });
      const mockSupabase = {
        auth: {
          updateUser: mockUpdateUser,
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

      const result = await updatePassword('ValidPass1!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update password. Please try again.');
    });
  });
});
