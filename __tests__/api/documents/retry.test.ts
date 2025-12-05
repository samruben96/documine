import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for document retry API endpoint
 * Story 11.3: Reliable Job Recovery
 *
 * AC-11.3.3: Manual retry via "Retry" button
 * - Retry button shown for failed documents
 * - Creates new processing_job with retry_count from previous
 * - Admin can retry any failed document
 */

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Document Retry API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/documents/[id]/retry', () => {
    it('requires authentication', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      });

      const { POST } = await import(
        '@/app/api/documents/[id]/retry/route'
      );

      const request = new Request('http://localhost/api/documents/123/retry', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '123' }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 for user without agency', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const { POST } = await import(
        '@/app/api/documents/[id]/retry/route'
      );

      const request = new Request('http://localhost/api/documents/123/retry', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '123' }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('NO_AGENCY');
    });

    it('returns 404 for non-existent document', async () => {
      const mockFrom = vi.fn();
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: mockFrom
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { agency_id: 'agency-1' },
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
      });

      const { POST } = await import(
        '@/app/api/documents/[id]/retry/route'
      );

      const request = new Request('http://localhost/api/documents/123/retry', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '123' }),
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('rejects retry for non-failed documents', async () => {
      const mockFrom = vi.fn();
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: mockFrom
          // First call: get user's agency
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { agency_id: 'agency-1' },
                  error: null,
                }),
              }),
            }),
          })
          // Second call: get document
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '123', agency_id: 'agency-1', status: 'ready', name: 'test.pdf' },
                  error: null,
                }),
              }),
            }),
          })
          // Third call: get existing job (processing status)
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: 'job-1', status: 'processing', retry_count: 0 },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
      });

      const { POST } = await import(
        '@/app/api/documents/[id]/retry/route'
      );

      const request = new Request('http://localhost/api/documents/123/retry', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '123' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('INVALID_STATE');
      expect(body.error.message).toContain('processing');
    });

    it('successfully retries a failed document by resetting existing job', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockFrom = vi.fn();

      const { createClient } = await import('@/lib/supabase/server');
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: mockFrom
          // First call: get user's agency
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { agency_id: 'agency-1' },
                  error: null,
                }),
              }),
            }),
          })
          // Second call: get document
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '123', agency_id: 'agency-1', status: 'failed', name: 'test.pdf' },
                  error: null,
                }),
              }),
            }),
          })
          // Third call: get existing job
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: 'job-1', status: 'failed', retry_count: 1, error_message: 'Test error' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          })
          // Fourth call: reset job
          .mockReturnValueOnce({
            update: mockUpdate,
          })
          // Fifth call: update document status
          .mockReturnValueOnce({
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
      });

      const { POST } = await import(
        '@/app/api/documents/[id]/retry/route'
      );

      const request = new Request('http://localhost/api/documents/123/retry', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '123' }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.success).toBe(true);
      expect(body.data.documentId).toBe('123');

      // Verify job was reset
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          stage: 'queued',
          progress_percent: 0,
          error_message: null,
          started_at: null,
          completed_at: null,
        })
      );
    });
  });
});
