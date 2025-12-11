/**
 * Analyze API Route Unit Tests
 * Story 23.2: Data Analysis Pipeline
 *
 * AC-23.2.5: Analysis completes within 15 seconds for files < 10K rows
 * Tests for API route: valid source, invalid source, wrong status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/reporting/analyze/route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      download: vi.fn(),
    })),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createServiceClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock('@/lib/admin/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/reporting/file-parser', () => ({
  parseFile: vi.fn(),
}));

vi.mock('@/lib/reporting/data-analyzer', () => ({
  analyzeColumnTypes: vi.fn(),
  generateSuggestedPrompts: vi.fn(),
}));

describe('POST /api/reporting/analyze', () => {
  const mockUser = { id: 'user-123' };
  const mockAgencyId = 'agency-456';
  const mockSourceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function createRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost:3000/api/reporting/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  it('should return 401 for unauthenticated requests', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTH_REQUIRED');
  });

  it('should return 400 for invalid sourceId format', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { agency_id: mockAgencyId },
            error: null,
          }),
        })),
      })),
    });

    const request = createRequest({ sourceId: 'not-a-uuid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });

  it('should return 404 for non-existent sourceId', async () => {
    const fromMock = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { agency_id: mockAgencyId },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'commission_data_sources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    mockSupabaseClient.from = fromMock;

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 if source status is not pending', async () => {
    const fromMock = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { agency_id: mockAgencyId },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'commission_data_sources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockSourceId,
                  status: 'ready', // Not 'pending'
                  storage_path: 'path/to/file.csv',
                  file_type: 'csv',
                  filename: 'test.csv',
                },
                error: null,
              }),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    mockSupabaseClient.from = fromMock;

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_STATUS');
    expect(data.error.message).toContain('ready');
  });

  it('should return 200 with analysis results for valid source', async () => {
    const mockSource = {
      id: mockSourceId,
      status: 'pending',
      storage_path: `${mockAgencyId}/reporting/${mockSourceId}/test.csv`,
      file_type: 'csv',
      filename: 'test.csv',
    };

    const mockParsedData = {
      columns: [
        { name: 'Name', type: 'text', sampleValues: ['John', 'Jane'], nullCount: 0, uniqueCount: 2 },
        { name: 'Amount', type: 'number', sampleValues: [100, 200], nullCount: 0, uniqueCount: 2 },
      ],
      rows: [
        { Name: 'John', Amount: 100 },
        { Name: 'Jane', Amount: 200 },
      ],
      metadata: {
        totalRows: 2,
        totalColumns: 2,
        parsedAt: new Date().toISOString(),
        fileType: 'csv',
      },
    };

    const mockAnalyzedColumns = [
      { name: 'Name', type: 'text', sampleValues: ['John', 'Jane'], nullCount: 0, uniqueCount: 2 },
      { name: 'Amount', type: 'number', sampleValues: [100, 200], nullCount: 0, uniqueCount: 2, stats: { min: 100, max: 200, mean: 150, sum: 300 } },
    ];

    const mockSuggestedPrompts = [
      'Summarize the key metrics',
      'Show top entries by Amount',
      'Generate insights',
    ];

    const fromMock = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { agency_id: mockAgencyId },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'commission_data_sources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockSource,
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      return { select: vi.fn() };
    });

    mockSupabaseClient.from = fromMock;
    mockSupabaseClient.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: new Blob(['Name,Amount\nJohn,100\nJane,200']),
        error: null,
      }),
    });

    const { parseFile } = await import('@/lib/reporting/file-parser');
    const { analyzeColumnTypes, generateSuggestedPrompts } = await import('@/lib/reporting/data-analyzer');

    vi.mocked(parseFile).mockResolvedValue(mockParsedData);
    vi.mocked(analyzeColumnTypes).mockReturnValue(mockAnalyzedColumns);
    vi.mocked(generateSuggestedPrompts).mockResolvedValue(mockSuggestedPrompts);

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.sourceId).toBe(mockSourceId);
    expect(data.data.status).toBe('ready');
    expect(data.data.columns).toHaveLength(2);
    expect(data.data.rowCount).toBe(2);
    expect(data.data.suggestedPrompts).toHaveLength(3);
    expect(data.error).toBeNull();
  });

  it('should return 500 on storage download error', async () => {
    const mockSource = {
      id: mockSourceId,
      status: 'pending',
      storage_path: 'path/to/file.csv',
      file_type: 'csv',
      filename: 'test.csv',
    };

    const fromMock = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { agency_id: mockAgencyId },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'commission_data_sources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockSource,
                error: null,
              }),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    mockSupabaseClient.from = fromMock;
    mockSupabaseClient.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      }),
    });

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('DOWNLOAD_FAILED');
  });

  it('should return 422 on file parse error', async () => {
    const mockSource = {
      id: mockSourceId,
      status: 'pending',
      storage_path: 'path/to/file.csv',
      file_type: 'csv',
      filename: 'test.csv',
    };

    const fromMock = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { agency_id: mockAgencyId },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'commission_data_sources') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockSource,
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      return { select: vi.fn() };
    });

    mockSupabaseClient.from = fromMock;
    mockSupabaseClient.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: new Blob(['corrupt data']),
        error: null,
      }),
    });

    const { parseFile } = await import('@/lib/reporting/file-parser');
    vi.mocked(parseFile).mockRejectedValue(new Error('Invalid CSV format'));

    const request = createRequest({ sourceId: mockSourceId });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('PARSE_ERROR');
  });
});
