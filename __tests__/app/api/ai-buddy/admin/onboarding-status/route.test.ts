/**
 * Unit Tests - Admin Onboarding Status API Route
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Returns user list with onboarding status
 * AC-18.4.5: Returns 403 for non-admin, 401 for unauthenticated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock requireAdminAuth
const mockRequireAdminAuth = vi.fn();
vi.mock('@/lib/auth/admin', () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
}));

// Import AFTER mocks are set up
import { GET } from '@/app/api/ai-buddy/admin/onboarding-status/route';

describe('GET /api/ai-buddy/admin/onboarding-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('returns 401 for unauthenticated user', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'Not authenticated',
      status: 401,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Not authenticated');
  });

  it('returns 403 for non-admin user', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'Admin access required',
      status: 403,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
  });

  it('returns user list for admin with correct structure', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
      role: 'admin',
    });

    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        full_name: 'User One',
        ai_buddy_preferences: {
          onboardingCompleted: true,
          onboardingCompletedAt: '2025-12-08T10:00:00Z',
          onboardingSkipped: false,
        },
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        full_name: 'User Two',
        ai_buddy_preferences: {
          onboardingCompleted: false,
          onboardingSkipped: true,
        },
      },
      {
        id: 'user-3',
        email: 'user3@example.com',
        full_name: null,
        ai_buddy_preferences: null,
      },
    ];

    mockOrder.mockResolvedValue({ data: mockUsers, error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.users).toHaveLength(3);

    // Check first user (completed)
    expect(json.data.users[0]).toEqual({
      userId: 'user-1',
      email: 'user1@example.com',
      fullName: 'User One',
      onboardingCompleted: true,
      onboardingCompletedAt: '2025-12-08T10:00:00Z',
      onboardingSkipped: false,
    });

    // Check second user (skipped)
    expect(json.data.users[1]).toEqual({
      userId: 'user-2',
      email: 'user2@example.com',
      fullName: 'User Two',
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: true,
    });

    // Check third user (not started - null preferences)
    expect(json.data.users[2]).toEqual({
      userId: 'user-3',
      email: 'user3@example.com',
      fullName: null,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
    });
  });

  it('returns empty array when no users in agency', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
      role: 'admin',
    });

    mockOrder.mockResolvedValue({ data: [], error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.users).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
      role: 'admin',
    });

    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch users');
  });

  it('extracts status correctly from JSONB preferences', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
      role: 'admin',
    });

    const mockUsers = [
      {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
        ai_buddy_preferences: {
          displayName: 'Tester',
          linesOfBusiness: ['Personal Auto'],
          onboardingCompleted: true,
          onboardingCompletedAt: '2025-12-08T12:00:00Z',
        },
      },
    ];

    mockOrder.mockResolvedValue({ data: mockUsers, error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.users[0].onboardingCompleted).toBe(true);
    expect(json.data.users[0].onboardingCompletedAt).toBe('2025-12-08T12:00:00Z');
    expect(json.data.users[0].onboardingSkipped).toBe(false);
  });

  it('queries users for the correct agency', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'specific-agency-id',
      role: 'admin',
    });

    mockOrder.mockResolvedValue({ data: [], error: null });

    await GET();

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, email, full_name, ai_buddy_preferences');
    expect(mockEq).toHaveBeenCalledWith('agency_id', 'specific-agency-id');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
  });
});
