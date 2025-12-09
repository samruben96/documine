/**
 * Unit Tests - Guardrail Enforcement Logs API
 * Story 19.2: Enforcement Logging
 *
 * Tests for GET /api/ai-buddy/admin/guardrails/logs
 *
 * AC-19.2.2: Log entries with correct fields
 * AC-19.2.6: Date range filtering
 * AC-19.2.7: Append-only (read-only API)
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing route
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  requireAdminAuth: vi.fn(),
}));

import { GET } from '@/app/api/ai-buddy/admin/guardrails/logs/route';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { NextRequest } from 'next/server';

describe('Guardrail Enforcement Logs API', () => {
  const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
  const mockRequireAdminAuth = requireAdminAuth as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createRequest(queryParams: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost/api/ai-buddy/admin/guardrails/logs');
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  }

  describe('authentication and authorization', () => {
    it('returns 401 for unauthenticated users', async () => {
      mockRequireAdminAuth.mockResolvedValue({
        success: false,
        error: 'Not authenticated',
        status: 401,
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 for non-admin users', async () => {
      mockRequireAdminAuth.mockResolvedValue({
        success: false,
        error: 'Admin access required',
        status: 403,
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('returns 403 for admin without view_audit_logs permission', async () => {
      mockRequireAdminAuth.mockResolvedValue({
        success: false,
        error: "Permission 'view_audit_logs' required",
        status: 403,
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('view_audit_logs');
    });

    it('calls requireAdminAuth with view_audit_logs permission', async () => {
      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        userId: 'user-123',
        agencyId: 'agency-123',
        role: 'admin',
      });

      const mockQuery = vi.fn().mockReturnThis();
      mockCreateClient.mockResolvedValue({
        from: () => ({
          select: mockQuery,
          eq: mockQuery,
          order: mockQuery,
          gte: mockQuery,
          lte: mockQuery,
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        }),
      });

      await GET(createRequest());

      expect(mockRequireAdminAuth).toHaveBeenCalledWith('view_audit_logs');
    });
  });

  describe('fetching logs', () => {
    beforeEach(() => {
      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        userId: 'user-123',
        agencyId: 'agency-123',
        role: 'admin',
      });
    });

    it('returns logs with correct fields (AC-19.2.2)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          agency_id: 'agency-123',
          user_id: 'user-456',
          conversation_id: 'conv-789',
          action: 'guardrail_triggered',
          metadata: {
            triggeredTopic: 'legal advice',
            messagePreview: 'Can you help me sue...',
            redirectMessage: 'Please consult an attorney',
          },
          logged_at: '2024-01-15T10:30:00Z',
          users: { email: 'test@example.com' },
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockLogs, error: null, count: 1 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.logs).toHaveLength(1);

      const log = data.data.logs[0];
      expect(log.id).toBe('log-1');
      expect(log.userId).toBe('user-456');
      expect(log.userEmail).toBe('test@example.com');
      expect(log.conversationId).toBe('conv-789');
      expect(log.triggeredTopic).toBe('legal advice');
      expect(log.messagePreview).toBe('Can you help me sue...');
      expect(log.redirectApplied).toBe('Please consult an attorney');
      expect(log.loggedAt).toBe('2024-01-15T10:30:00Z');
    });

    it('returns total count and hasMore flag', async () => {
      const mockLogs = Array.from({ length: 20 }, (_, i) => ({
        id: `log-${i}`,
        agency_id: 'agency-123',
        user_id: 'user-456',
        conversation_id: 'conv-789',
        action: 'guardrail_triggered',
        metadata: { triggeredTopic: 'test', messagePreview: 'msg', redirectMessage: 'redirect' },
        logged_at: '2024-01-15T10:30:00Z',
        users: { email: 'test@example.com' },
      }));

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockLogs, error: null, count: 50 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest({ limit: '20' }));
      const data = await response.json();

      expect(data.data.total).toBe(50);
      expect(data.data.hasMore).toBe(true);
      expect(data.data.logs).toHaveLength(20);
    });

    it('handles empty results', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.logs).toHaveLength(0);
      expect(data.data.total).toBe(0);
      expect(data.data.hasMore).toBe(false);
    });
  });

  describe('date range filtering (AC-19.2.6)', () => {
    beforeEach(() => {
      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        userId: 'user-123',
        agencyId: 'agency-123',
        role: 'admin',
      });
    });

    it('applies startDate filter', async () => {
      const mockGte = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: mockGte,
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      await GET(createRequest({ startDate: '2024-01-01T00:00:00Z' }));

      expect(mockGte).toHaveBeenCalledWith('logged_at', '2024-01-01T00:00:00.000Z');
    });

    it('applies endDate filter with end of day', async () => {
      const mockLte = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: mockLte,
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      await GET(createRequest({ endDate: '2024-01-15' }));

      // Should be called with end of day
      expect(mockLte).toHaveBeenCalled();
      const callArg = mockLte.mock.calls[0][1];
      expect(callArg).toContain('2024-01-15');
    });

    it('returns 400 for invalid startDate', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest({ startDate: 'invalid-date' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('startDate');
    });

    it('returns 400 for invalid endDate', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest({ endDate: 'not-a-date' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('endDate');
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        userId: 'user-123',
        agencyId: 'agency-123',
        role: 'admin',
      });
    });

    it('applies limit and offset params', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: mockRange,
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      await GET(createRequest({ limit: '10', offset: '20' }));

      expect(mockRange).toHaveBeenCalledWith(20, 29); // offset to offset + limit - 1
    });

    it('caps limit at 100', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: mockRange,
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      await GET(createRequest({ limit: '500' }));

      expect(mockRange).toHaveBeenCalledWith(0, 99); // Max 100 items
    });

    it('uses default limit of 50', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: mockRange,
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      await GET(createRequest());

      expect(mockRange).toHaveBeenCalledWith(0, 49);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockRequireAdminAuth.mockResolvedValue({
        success: true,
        userId: 'user-123',
        agencyId: 'agency-123',
        role: 'admin',
      });
    });

    it('returns 500 on database error', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
      });

      mockCreateClient.mockResolvedValue({
        from: () => ({ select: mockSelect }),
      });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
