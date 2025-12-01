/**
 * Tests for document database service
 * Tests createProcessingJob using service client for RLS bypass
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockDocument = {
  id: 'doc-456',
  storage_path: 'agencies/agency-123/doc-456.pdf',
  agency_id: 'agency-123',
};

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

// Mock functions
const mockInsertSelectSingle = vi.fn();
const mockDocumentSelectSingle = vi.fn();

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
      if (tableName === 'documents') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockDocumentSelectSingle,
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${tableName}`);
    }),
  })),
}));

// Mock the Edge Function trigger (fire-and-forget)
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
));

// Import after mocking
import { createProcessingJob } from '@/lib/documents/service';
import { createServiceClient } from '@/lib/supabase/server';

describe('Document Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful responses
    mockDocumentSelectSingle.mockResolvedValue({
      data: mockDocument,
      error: null,
    });
    mockInsertSelectSingle.mockResolvedValue({
      data: mockJob,
      error: null,
    });
  });

  describe('createProcessingJob', () => {
    it('creates processing job using service client (not user client)', async () => {
      const result = await createProcessingJob('doc-456');

      // Verify service client was used (not passed in)
      expect(createServiceClient).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });

    it('inserts with correct document_id and pending status', async () => {
      const testDocId = 'test-doc-id';
      const testJob = {
        ...mockJob,
        id: 'job-789',
        document_id: testDocId,
      };

      mockDocumentSelectSingle.mockResolvedValueOnce({
        data: { ...mockDocument, id: testDocId },
        error: null,
      });
      mockInsertSelectSingle.mockResolvedValueOnce({
        data: testJob,
        error: null,
      });

      const result = await createProcessingJob(testDocId);

      expect(result.document_id).toBe(testDocId);
      expect(result.status).toBe('pending');
    });

    it('throws ProcessingError on database error', async () => {
      mockDocumentSelectSingle.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      });
      mockInsertSelectSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'RLS policy violation' },
      });

      await expect(createProcessingJob('doc-456')).rejects.toThrow(
        'Failed to create processing job: RLS policy violation'
      );
    });

    it('throws ProcessingError when document not found', async () => {
      mockDocumentSelectSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(createProcessingJob('doc-456')).rejects.toThrow(
        'Failed to get document: Not found'
      );
    });

    it('uses service client to bypass RLS for processing_jobs table', async () => {
      // This test documents the intentional design: processing_jobs requires
      // service_role because it's meant to be managed by the system (Edge Functions),
      // not directly by users.
      await createProcessingJob('doc-456');

      // Verify the function doesn't accept a client parameter (encapsulated)
      expect(createProcessingJob.length).toBe(1); // Only takes documentId
      expect(createServiceClient).toHaveBeenCalledTimes(1);
    });

  });
});
