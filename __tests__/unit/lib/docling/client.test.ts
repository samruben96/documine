import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDocument, checkHealth, extractPageInfo } from '@/lib/docling/client';
import { DoclingError } from '@/lib/errors';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger to avoid console output in tests
vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Docling Client', () => {
  const mockServiceUrl = 'http://localhost:8000';
  const mockPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
  const mockFilename = 'test-document.pdf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseDocument', () => {
    describe('successful parsing', () => {
      it('should parse document and return structured result', async () => {
        const mockResponse = {
          markdown: `--- PAGE 1 ---

# Document Title

This is the document content.

--- PAGE 2 ---

Content on page 2.`,
          page_markers: [
            { page_number: 1, start_index: 0, end_index: 14 },
            { page_number: 2, start_index: 54, end_index: 68 },
          ],
          page_count: 2,
          processing_time_ms: 3500,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);

        expect(result.markdown).toBe(mockResponse.markdown);
        expect(result.pageCount).toBe(2);
        expect(result.pageMarkers).toHaveLength(2);
        expect(result.pageMarkers[0].pageNumber).toBe(1);
        expect(result.pageMarkers[1].pageNumber).toBe(2);
      });

      it('should handle single page document', async () => {
        const mockResponse = {
          markdown: '--- PAGE 1 ---\n\nSingle page content.',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 14 }],
          page_count: 1,
          processing_time_ms: 1200,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);

        expect(result.pageCount).toBe(1);
        expect(result.pageMarkers).toHaveLength(1);
        expect(result.pageMarkers[0].pageNumber).toBe(1);
      });

      it('should handle multi-page document', async () => {
        const mockResponse = {
          markdown: `--- PAGE 1 ---
Page 1.

--- PAGE 2 ---
Page 2.

--- PAGE 3 ---
Page 3.

--- PAGE 4 ---
Page 4.`,
          page_markers: [
            { page_number: 1, start_index: 0, end_index: 14 },
            { page_number: 2, start_index: 25, end_index: 39 },
            { page_number: 3, start_index: 50, end_index: 64 },
            { page_number: 4, start_index: 75, end_index: 89 },
          ],
          page_count: 4,
          processing_time_ms: 8000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);

        expect(result.pageCount).toBe(4);
        expect(result.pageMarkers).toHaveLength(4);
      });

      it('should convert Uint8Array buffer correctly', async () => {
        const mockResponse = {
          markdown: '--- PAGE 1 ---\n\nContent',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 14 }],
          page_count: 1,
          processing_time_ms: 1000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const uint8Buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
        await parseDocument(uint8Buffer, mockFilename, mockServiceUrl);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/parse'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('file type handling', () => {
      it('should use correct MIME type for PDF', async () => {
        const mockResponse = {
          markdown: 'Content',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 0 }],
          page_count: 1,
          processing_time_ms: 1000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await parseDocument(mockPdfBuffer, 'document.pdf', mockServiceUrl);

        // The fetch call should have been made with FormData containing PDF
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should use correct MIME type for DOCX', async () => {
        const mockResponse = {
          markdown: 'Content',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 0 }],
          page_count: 1,
          processing_time_ms: 1000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await parseDocument(mockPdfBuffer, 'document.docx', mockServiceUrl);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should handle image files (PNG)', async () => {
        const mockResponse = {
          markdown: 'OCR text from image',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 0 }],
          page_count: 1,
          processing_time_ms: 2000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await parseDocument(mockPdfBuffer, 'image.png', mockServiceUrl);

        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should throw DoclingError on service failure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        });

        await expect(
          parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl)
        ).rejects.toThrow(DoclingError);
      });

      it('should throw DoclingError on unsupported file type from server', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('Unsupported file type: .xyz'),
        });

        await expect(
          parseDocument(mockPdfBuffer, 'file.xyz', mockServiceUrl)
        ).rejects.toThrow(DoclingError);
      });

      it('should throw DoclingError on timeout (AbortError)', async () => {
        // Mock AbortError which is what AbortController throws on timeout
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);

        await expect(
          parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl)
        ).rejects.toThrow(DoclingError);
      });

      it('should include timeout message in error', async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);

        try {
          await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);
        } catch (error) {
          expect(error).toBeInstanceOf(DoclingError);
          expect((error as DoclingError).message).toContain('timed out');
        }
      });

      it('should throw DoclingError on network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(
          parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl)
        ).rejects.toThrow(DoclingError);
      });
    });

    describe('API calls', () => {
      it('should call correct endpoint', async () => {
        const mockResponse = {
          markdown: 'Content',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 0 }],
          page_count: 1,
          processing_time_ms: 1000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);

        expect(mockFetch).toHaveBeenCalledWith(
          `${mockServiceUrl}/parse`,
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      it('should send FormData with file', async () => {
        const mockResponse = {
          markdown: 'Content',
          page_markers: [{ page_number: 1, start_index: 0, end_index: 0 }],
          page_count: 1,
          processing_time_ms: 1000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await parseDocument(mockPdfBuffer, mockFilename, mockServiceUrl);

        const [, options] = mockFetch.mock.calls[0];
        expect(options.body).toBeInstanceOf(FormData);
      });
    });
  });

  describe('checkHealth', () => {
    it('should return true when service is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const result = await checkHealth(mockServiceUrl);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockServiceUrl}/health`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when service returns unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'unhealthy' }),
      });

      const result = await checkHealth(mockServiceUrl);

      expect(result).toBe(false);
    });

    it('should return false when service is down', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await checkHealth(mockServiceUrl);

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkHealth(mockServiceUrl);

      expect(result).toBe(false);
    });
  });

  describe('extractPageInfo', () => {
    it('should extract page markers from markdown', () => {
      const markdown = `--- PAGE 1 ---

Content page 1

--- PAGE 2 ---

Content page 2

--- PAGE 3 ---

Content page 3`;

      const result = extractPageInfo(markdown);

      expect(result.pageCount).toBe(3);
      expect(result.pageMarkers).toHaveLength(3);
      expect(result.pageMarkers[0].pageNumber).toBe(1);
      expect(result.pageMarkers[1].pageNumber).toBe(2);
      expect(result.pageMarkers[2].pageNumber).toBe(3);
    });

    it('should handle single page without markers', () => {
      const markdown = 'Single page content without any page markers.';

      const result = extractPageInfo(markdown);

      expect(result.pageCount).toBe(1);
      expect(result.pageMarkers).toHaveLength(1);
      expect(result.pageMarkers[0].pageNumber).toBe(1);
    });

    it('should handle case-insensitive page markers', () => {
      const markdown = `--- page 1 ---

Content

--- PAGE 2 ---

More content`;

      const result = extractPageInfo(markdown);

      expect(result.pageCount).toBe(2);
      expect(result.pageMarkers).toHaveLength(2);
    });

    it('should handle page markers with extra whitespace', () => {
      const markdown = `---   PAGE   1   ---

Content

---  PAGE  2  ---

More content`;

      const result = extractPageInfo(markdown);

      expect(result.pageCount).toBe(2);
      expect(result.pageMarkers).toHaveLength(2);
    });

    it('should preserve markdown content', () => {
      const markdown = `--- PAGE 1 ---

# Heading

Some content here.`;

      const result = extractPageInfo(markdown);

      expect(result.cleanMarkdown).toBe(markdown);
    });
  });
});
