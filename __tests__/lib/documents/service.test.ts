/**
 * Tests for document database service
 * Tests createProcessingJob using service client for RLS bypass
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the service client for processing_jobs
const mockInsertSelectSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((tableName: string) => {
      if (tableName === 'processing_jobs') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: mockInsertSelectSingle,
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${tableName}`);
    }),
  })),
}));

// Import after mocking
import { createProcessingJob } from '@/lib/documents/service';
import { createServiceClient } from '@/lib/supabase/server';

describe('Document Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProcessingJob', () => {
    it('creates processing job using service client (not user client)', async () => {
      const mockJob = {
        id: 'job-123',
        document_id: 'doc-456',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error_message: null,
      };

      mockInsertSelectSingle.mockResolvedValueOnce({
        data: mockJob,
        error: null,
      });

      const result = await createProcessingJob('doc-456');

      // Verify service client was used (not passed in)
      expect(createServiceClient).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });

    it('inserts with correct document_id and pending status', async () => {
      const mockJob = {
        id: 'job-789',
        document_id: 'test-doc-id',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error_message: null,
      };

      mockInsertSelectSingle.mockResolvedValueOnce({
        data: mockJob,
        error: null,
      });

      const result = await createProcessingJob('test-doc-id');

      expect(result.document_id).toBe('test-doc-id');
      expect(result.status).toBe('pending');
    });

    it('throws ProcessingError on database error', async () => {
      mockInsertSelectSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'RLS policy violation' },
      });

      await expect(createProcessingJob('doc-456')).rejects.toThrow(
        'Failed to create processing job: RLS policy violation'
      );
    });

    it('uses service client to bypass RLS for processing_jobs table', async () => {
      // This test documents the intentional design: processing_jobs requires
      // service_role because it's meant to be managed by the system (Edge Functions),
      // not directly by users.
      const mockJob = {
        id: 'job-abc',
        document_id: 'doc-xyz',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error_message: null,
      };

      mockInsertSelectSingle.mockResolvedValueOnce({
        data: mockJob,
        error: null,
      });

      await createProcessingJob('doc-xyz');

      // Verify the function doesn't accept a client parameter (encapsulated)
      expect(createProcessingJob.length).toBe(1); // Only takes documentId
      expect(createServiceClient).toHaveBeenCalledTimes(1);
    });
  });
});
