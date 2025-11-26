/**
 * Tests for login/logout server actions
 * Tests AC-2.4.6: Logout clears session and redirects
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout } from '@/app/(auth)/login/actions';

// Mock redirect to prevent actual navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock cookies for createClient
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  })),
}));

describe('login server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful login', () => {
    it('redirects to /documents on success', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      try {
        await login({
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe: false,
        });
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/documents');
    });

    it('redirects to custom redirect path when provided', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      try {
        await login(
          {
            email: 'test@example.com',
            password: 'Password123!',
            rememberMe: false,
          },
          '/settings'
        );
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/settings');
    });
  });

  describe('validation errors', () => {
    it('returns error for invalid email', async () => {
      const result = await login({
        email: 'invalid-email',
        password: 'Password123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('returns error for short password', async () => {
      const result = await login({
        email: 'test@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });

  describe('auth errors', () => {
    it('returns generic error on auth failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      const result = await login({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });
});

describe('logout server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.4.6: Logout clears session and redirects', () => {
    it('calls supabase.auth.signOut()', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      try {
        await logout();
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('redirects to /login after signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      try {
        await logout();
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });
});
