/**
 * Shared mock implementations for settings actions tests.
 * Each test file must still call vi.mock() but can use these mock functions.
 */
import { vi } from 'vitest';

// Create mock functions
export const mockUpdateEq = vi.fn(() => ({ data: null, error: null }));
export const mockSelectSingle = vi.fn(() => ({ data: null, error: null }));
export const mockSelectMaybeSingle = vi.fn(() => ({ data: null, error: null }));
export const mockSelectCount = vi.fn(() => ({ count: 0, error: null }));
export const mockInsertSelect = vi.fn(() => ({ data: { id: 'inv-123' }, error: null }));
export const mockDeleteEq = vi.fn(() => ({ error: null }));
export const mockGetUser = vi.fn();
export const mockInviteUserByEmail = vi.fn(() => ({ error: null }));
export const mockDeleteAuthUser = vi.fn(() => ({ error: null }));

/**
 * Creates the mock Supabase client factory.
 * Call this in vi.mock('@/lib/supabase/server', ...) factory function.
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((tableName: string) => ({
      update: vi.fn(() => ({
        eq: mockUpdateEq,
      })),
      select: vi.fn((columns?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact' && opts?.head === true) {
          const createThenable = (): Record<string, unknown> => ({
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
        const buildSelectChain = (): Record<string, unknown> => ({
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
    })),
  };
}

/**
 * Creates the mock service client factory.
 */
export function createMockServiceClient() {
  return {
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
  };
}

/**
 * Reset all mocks. Call in beforeEach.
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  mockSelectCount.mockImplementation(() => ({ count: 0, error: null }));
}

/**
 * Setup authenticated admin user.
 */
export function setupAuthenticatedAdmin(agencyId = 'agency-1') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'admin@example.com' } },
  });
  mockSelectSingle.mockResolvedValueOnce({
    data: { role: 'admin', agency_id: agencyId, seat_limit: 10 },
    error: null,
  });
}

/**
 * Setup authenticated member (non-admin) user.
 */
export function setupAuthenticatedMember(agencyId = 'agency-1') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'member@example.com' } },
  });
  mockSelectSingle.mockResolvedValueOnce({
    data: { role: 'member', agency_id: agencyId },
    error: null,
  });
}

/**
 * Setup unauthenticated user.
 */
export function setupUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}
