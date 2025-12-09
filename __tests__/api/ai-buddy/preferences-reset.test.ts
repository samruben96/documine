/**
 * Preferences Reset API Route Tests
 * Story 18.2: Preferences Management
 *
 * AC-18.2.9, AC-18.2.10, AC-18.2.11: Reset preferences endpoint tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { POST } from '@/app/api/ai-buddy/preferences/reset/route';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { createClient, createServiceClient } from '@/lib/supabase/server';

describe('POST /api/ai-buddy/preferences/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when auth error occurs', async () => {
    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Auth failed'),
        }),
      },
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  // AC-18.2.10: Preferences reset to defaults
  it('resets preferences to defaults successfully', async () => {
    const mockUser = { id: 'user-123' };

    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (createServiceClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.preferences).toEqual({
      displayName: undefined,
      role: undefined,
      linesOfBusiness: [],
      favoriteCarriers: [],
      agencyName: undefined,
      licensedStates: [],
      communicationStyle: 'professional',
      onboardingCompleted: false,
      onboardingCompletedAt: undefined,
      onboardingSkipped: false,
      onboardingSkippedAt: undefined,
    });
  });

  // AC-18.2.11: Onboarding re-trigger
  it('sets onboardingCompleted to false to trigger re-display', async () => {
    const mockUser = { id: 'user-123' };

    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (createServiceClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.preferences.onboardingCompleted).toBe(false);
    expect(json.data.preferences.onboardingSkipped).toBe(false);
  });

  it('returns 500 when database update fails', async () => {
    const mockUser = { id: 'user-123' };

    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error('DB error') }),
    });

    (createServiceClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.code).toBe('RESET_ERROR');
  });

  it('uses service client for database update (verify-then-service pattern)', async () => {
    const mockUser = { id: 'user-123' };

    (createClient as Mock).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    (createServiceClient as Mock).mockReturnValue({ from: mockFrom });

    await POST();

    // Verify service client was used
    expect(createServiceClient).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });
});
