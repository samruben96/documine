/**
 * Integration tests for signup server action
 * Tests AC-2.2.1 through AC-2.2.5: Record creation, atomicity, and cleanup
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signup } from '@/app/(auth)/signup/actions';

// Mock redirect to prevent actual navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error('NEXT_REDIRECT'); // Simulate redirect behavior
  },
}));

// Mock cookies for createClient
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock Supabase clients
const mockAuthSignUp = vi.fn();
const mockAuthAdminDeleteUser = vi.fn();
const mockAgenciesInsert = vi.fn();
const mockUsersInsert = vi.fn();
const mockAgenciesDelete = vi.fn();

// Track insert arguments for verification
let agencyInsertArgs: Record<string, unknown> | null = null;
let userInsertArgs: Record<string, unknown> | null = null;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockAuthSignUp,
    },
  })),
  createServiceClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockAuthAdminDeleteUser,
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'agencies') {
        return {
          insert: vi.fn((data: Record<string, unknown>) => {
            agencyInsertArgs = data;
            return {
              select: vi.fn(() => ({
                single: mockAgenciesInsert,
              })),
            };
          }),
          delete: vi.fn(() => ({
            eq: mockAgenciesDelete,
          })),
        };
      }
      if (table === 'users') {
        return {
          insert: vi.fn((data: Record<string, unknown>) => {
            userInsertArgs = data;
            return mockUsersInsert();
          }),
        };
      }
      return {};
    }),
  })),
}));

describe('signup server action - record creation', () => {
  const validFormData = {
    fullName: 'John Smith',
    email: 'john@agency.com',
    password: 'SecurePass123!',
    agencyName: 'Smith Insurance Agency',
  };

  const mockAuthUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockAgencyId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
    agencyInsertArgs = null;
    userInsertArgs = null;

    // Default successful auth signup
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: mockAuthUserId } },
      error: null,
    });

    // Default successful agency insert
    mockAgenciesInsert.mockResolvedValue({
      data: { id: mockAgencyId },
      error: null,
    });

    // Default successful user insert
    mockUsersInsert.mockReturnValue({
      error: null,
    });

    // Default successful cleanup
    mockAuthAdminDeleteUser.mockResolvedValue({ error: null });
    mockAgenciesDelete.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.2.1: Agency record creation', () => {
    it('creates agency with name from form', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        // Expect redirect error on success
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(agencyInsertArgs).not.toBeNull();
      expect(agencyInsertArgs?.name).toBe('Smith Insurance Agency');
    });

    it('creates agency with subscription_tier=starter', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(agencyInsertArgs?.subscription_tier).toBe('starter');
    });

    it('creates agency with seat_limit=3', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(agencyInsertArgs?.seat_limit).toBe(3);
    });
  });

  describe('AC-2.2.2: User record creation with matching id', () => {
    it('creates user with id matching auth.users.id', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(userInsertArgs).not.toBeNull();
      expect(userInsertArgs?.id).toBe(mockAuthUserId);
    });

    it('creates user with correct agency_id', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(userInsertArgs?.agency_id).toBe(mockAgencyId);
    });

    it('creates user with email from form', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(userInsertArgs?.email).toBe('john@agency.com');
    });

    it('creates user with full_name from form', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(userInsertArgs?.full_name).toBe('John Smith');
    });
  });

  describe('AC-2.2.3: First user role is admin', () => {
    it('sets user role to admin for first agency user', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(userInsertArgs?.role).toBe('admin');
    });
  });

  describe('AC-2.2.4: Atomic transaction - rollback on failure', () => {
    it('deletes agency record if user insert fails', async () => {
      // User insert fails
      mockUsersInsert.mockReturnValue({
        error: { message: 'User insert failed' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(mockAgenciesDelete).toHaveBeenCalledWith('id', mockAgencyId);
    });

    it('agency record is NOT created if user insert fails (both fail or neither exists)', async () => {
      // User insert fails
      mockUsersInsert.mockReturnValue({
        error: { message: 'User insert failed' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      // Verify cleanup was attempted
      expect(mockAgenciesDelete).toHaveBeenCalled();
      expect(mockAuthAdminDeleteUser).toHaveBeenCalledWith(mockAuthUserId);
    });
  });

  describe('AC-2.2.5: Auth user cleanup on failure', () => {
    it('deletes auth user if agency insert fails', async () => {
      // Agency insert fails
      mockAgenciesInsert.mockResolvedValue({
        data: null,
        error: { message: 'Agency insert failed' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(mockAuthAdminDeleteUser).toHaveBeenCalledWith(mockAuthUserId);
    });

    it('deletes auth user if user insert fails', async () => {
      // User insert fails
      mockUsersInsert.mockReturnValue({
        error: { message: 'User insert failed' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(mockAuthAdminDeleteUser).toHaveBeenCalledWith(mockAuthUserId);
    });

    it('returns generic error on record creation failure', async () => {
      // Agency insert fails
      mockAgenciesInsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Successful signup flow', () => {
    it('redirects to /documents on success', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/documents');
    });

    it('creates both agency and user records on success', async () => {
      try {
        await signup(validFormData);
      } catch (e) {
        expect((e as Error).message).toBe('NEXT_REDIRECT');
      }

      // Verify agency was created
      expect(agencyInsertArgs).not.toBeNull();
      expect(agencyInsertArgs?.name).toBe('Smith Insurance Agency');

      // Verify user was created
      expect(userInsertArgs).not.toBeNull();
      expect(userInsertArgs?.id).toBe(mockAuthUserId);
    });
  });

  describe('Auth signup errors', () => {
    it('returns specific error for duplicate email', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists');
    });

    it('returns generic error for other auth failures', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Some other error' },
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong. Please try again.');
    });

    it('returns error when auth user is null', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await signup(validFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Validation errors', () => {
    it('returns validation error for invalid email', async () => {
      const result = await signup({
        ...validFormData,
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('returns validation error for short password', async () => {
      const result = await signup({
        ...validFormData,
        password: 'Pass1!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });
  });
});
