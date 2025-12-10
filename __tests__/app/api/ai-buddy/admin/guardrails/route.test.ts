/**
 * Unit Tests - Admin Guardrails API Route
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.1: GET returns guardrails for admin
 * AC-19.1.10: PATCH persists changes immediately
 * AC-19.1.12: Returns 403 for non-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
  createServiceClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock requireAdminAuth
const mockRequireAdminAuth = vi.fn();
vi.mock('@/lib/auth/admin', () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
}));

// Import AFTER mocks are set up
import { GET, PATCH } from '@/app/api/ai-buddy/admin/guardrails/route';

describe('GET /api/ai-buddy/admin/guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup for ai_buddy_guardrails
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_buddy_guardrails') {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        };
      }
      if (table === 'agency_audit_logs') {
        return {
          insert: mockInsert,
        };
      }
      return { select: mockSelect };
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
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

  it('returns default guardrails when none exist', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
    });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.guardrails).toBeDefined();
    expect(json.data.guardrails.agencyId).toBe('agency-123');
    expect(json.data.guardrails.restrictedTopics).toBeInstanceOf(Array);
    expect(json.data.guardrails.restrictedTopics.length).toBeGreaterThan(0);
    expect(json.data.guardrails.eandoDisclaimer).toBe(true);
  });

  it('returns existing guardrails from database', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
    });

    const existingGuardrails = {
      agency_id: 'agency-123',
      restricted_topics: [
        {
          id: 'topic-1',
          trigger: 'custom topic',
          redirectGuidance: 'Custom redirect',
          enabled: true,
          isBuiltIn: false,
        },
      ],
      custom_rules: [],
      eando_disclaimer: false,
      ai_disclosure_message: 'Custom message',
      ai_disclosure_enabled: true,
      restricted_topics_enabled: true,
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockMaybeSingle.mockResolvedValue({ data: existingGuardrails, error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.guardrails.restrictedTopics).toHaveLength(1);
    expect(json.data.guardrails.restrictedTopics[0].trigger).toBe('custom topic');
    expect(json.data.guardrails.eandoDisclaimer).toBe(false);
  });
});

describe('PATCH /api/ai-buddy/admin/guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_buddy_guardrails') {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        };
      }
      if (table === 'agency_audit_logs') {
        return {
          insert: mockInsert,
        };
      }
      return { select: mockSelect };
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('returns 401 for unauthenticated user', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: false,
      error: 'Not authenticated',
      status: 401,
    });

    const request = new Request('http://localhost/api/ai-buddy/admin/guardrails', {
      method: 'PATCH',
      body: JSON.stringify({ eandoDisclaimer: false }),
    });

    const response = await PATCH(request);
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

    const request = new Request('http://localhost/api/ai-buddy/admin/guardrails', {
      method: 'PATCH',
      body: JSON.stringify({ eandoDisclaimer: false }),
    });

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
  });

  it('returns 400 for invalid JSON body', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
    });

    const request = new Request('http://localhost/api/ai-buddy/admin/guardrails', {
      method: 'PATCH',
      body: 'invalid json',
    });

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid JSON body');
  });

  it('updates eandoDisclaimer successfully', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      success: true,
      userId: 'admin-user-id',
      agencyId: 'agency-123',
    });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const updatedData = {
      agency_id: 'agency-123',
      restricted_topics: [],
      custom_rules: [],
      eando_disclaimer: false,
      ai_disclosure_message: 'test',
      ai_disclosure_enabled: true,
      restricted_topics_enabled: true,
      updated_at: '2024-01-01T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: updatedData, error: null });

    const request = new Request('http://localhost/api/ai-buddy/admin/guardrails', {
      method: 'PATCH',
      body: JSON.stringify({ eandoDisclaimer: false }),
    });

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled(); // Audit log
  });
});
