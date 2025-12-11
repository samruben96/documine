import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for reporting upload API endpoint
 * Epic 23: Custom Reporting - File Upload Infrastructure
 * Story 23.1: Upload commission statement files
 *
 * AC-23.1.1: Accept Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) up to 50MB
 * AC-23.1.3: Reject invalid file types with clear error message
 * AC-23.1.4: Store files in Supabase Storage
 * AC-23.1.5: Create commission_data_sources record with status='pending'
 */

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock audit logger
vi.mock('@/lib/admin/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}));

describe('Reporting Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/reporting/upload', () => {
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

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });

    it('returns 401 for user without agency', async () => {
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

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });

    it('returns 400 when no file is provided', async () => {
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
                data: { agency_id: 'agency-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('INVALID_FILE_TYPE');
      expect(body.error.message).toBe('No file provided');
    });

    it('AC-23.1.3: rejects invalid file type with clear error message', async () => {
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
                data: { agency_id: 'agency-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('INVALID_FILE_TYPE');
      expect(body.error.message).toContain('Invalid file type');
      expect(body.error.message).toContain('xlsx');
      expect(body.error.message).toContain('xls');
      expect(body.error.message).toContain('csv');
      expect(body.error.message).toContain('pdf');
    });

    it('AC-23.1.1: rejects files over 50MB', async () => {
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
                data: { agency_id: 'agency-1' },
                error: null,
              }),
            }),
          }),
        }),
        // Include storage mock in case size validation doesn't catch it
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      // Create a mock file that reports a size > 50MB
      // Note: File size is checked via file.size property after parsing FormData
      const largeContent = new Uint8Array(51 * 1024 * 1024); // 51MB of actual content
      const largeBlob = new Blob([largeContent], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const largeFile = new File([largeBlob], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = new FormData();
      formData.append('file', largeFile);

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(413);
      const body = await response.json();
      expect(body.error.code).toBe('FILE_TOO_LARGE');
      expect(body.error.message).toContain('50MB');
    });

    it('AC-23.1.1: accepts valid Excel .xlsx file', async () => {
      const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
      const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return {
              insert: mockDbInsert,
            };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test content'], 'commission-report.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.status).toBe('pending');
      expect(body.data.filename).toBe('commission-report.xlsx');
      expect(body.data.sourceId).toBeDefined();
      expect(body.error).toBeNull();

      // Verify storage was called
      expect(mockStorageUpload).toHaveBeenCalled();

      // Verify DB insert with correct data
      expect(mockDbInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agency_id: 'agency-1',
          user_id: 'user-1',
          filename: 'commission-report.xlsx',
          file_type: 'xlsx',
          status: 'pending',
        })
      );
    });

    it('AC-23.1.1: accepts valid .xls file', async () => {
      const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
      const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return { insert: mockDbInsert };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'legacy-report.xls', {
          type: 'application/vnd.ms-excel',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.filename).toBe('legacy-report.xls');

      expect(mockDbInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_type: 'xls',
        })
      );
    });

    it('AC-23.1.1: accepts valid CSV file', async () => {
      const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
      const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return { insert: mockDbInsert };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['name,amount\nJohn,100'], 'data.csv', {
          type: 'text/csv',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.filename).toBe('data.csv');

      expect(mockDbInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_type: 'csv',
        })
      );
    });

    it('AC-23.1.1: accepts valid PDF file', async () => {
      const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
      const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return { insert: mockDbInsert };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['%PDF-1.4'], 'statement.pdf', {
          type: 'application/pdf',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.filename).toBe('statement.pdf');

      expect(mockDbInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          file_type: 'pdf',
        })
      );
    });

    it('AC-23.1.4: stores file in correct path: {agency_id}/reporting/{source_id}/{filename}', async () => {
      const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
      const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'test-agency-123' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return { insert: mockDbInsert };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test-file.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      await POST(request);

      // Verify storage path follows pattern: {agency_id}/reporting/{source_id}/{filename}
      expect(mockStorageUpload).toHaveBeenCalled();
      const [storagePath] = mockStorageUpload.mock.calls[0];
      expect(storagePath).toMatch(
        /^test-agency-123\/reporting\/[a-f0-9-]+\/test-file\.xlsx$/
      );
    });

    it('returns 500 on storage upload error', async () => {
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
                data: { agency_id: 'agency-1' },
                error: null,
              }),
            }),
          }),
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({
              error: { message: 'Storage error' },
            }),
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('UPLOAD_FAILED');
    });

    it('cleans up storage on database insert error', async () => {
      const mockStorageRemove = vi.fn().mockResolvedValue({ error: null });
      const { createClient } = await import('@/lib/supabase/server');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: { message: 'Database error' },
              }),
            };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ error: null }),
            remove: mockStorageRemove,
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('DB_ERROR');

      // Verify cleanup was attempted
      expect(mockStorageRemove).toHaveBeenCalled();
    });

    it('logs audit event on successful upload', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { logAuditEvent } = await import('@/lib/admin/audit-logger');

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { agency_id: 'agency-1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'commission_data_sources') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
      });

      const { POST } = await import('@/app/api/reporting/upload/route');

      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );

      const request = new Request('http://localhost/api/reporting/upload', {
        method: 'POST',
        body: formData,
      });

      await POST(request);

      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId: 'agency-1',
          userId: 'user-1',
          action: 'reporting_uploaded',
          metadata: expect.objectContaining({
            filename: 'test.xlsx',
            fileType: 'xlsx',
          }),
        })
      );
    });
  });
});
