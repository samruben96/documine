import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parsePdf } from '@/lib/llamaparse/client';
import { LlamaParseError } from '@/lib/errors';

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

describe('parsePdf', () => {
  const mockApiKey = 'test-llama-api-key';
  const mockPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
  const mockFilename = 'test-document.pdf';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful parsing', () => {
    it('should complete full parsing flow successfully', async () => {
      const jobId = 'job-123';
      const mockMarkdown = `# Document Title

This is the document content.

--- PAGE 2 ---

Content on page 2.`;

      // Mock upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: jobId }),
      });

      // Mock job status (immediately complete)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      // Mock markdown result
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: mockMarkdown }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      const result = await parsePromise;

      expect(result.markdown).toBe(mockMarkdown);
      expect(result.pageCount).toBe(2);
      expect(result.pageMarkers).toHaveLength(1);
      expect(result.pageMarkers[0].pageNumber).toBe(2);
    });

    it('should handle single page document', async () => {
      const mockMarkdown = 'Single page content without markers.';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: mockMarkdown }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      const result = await parsePromise;

      expect(result.pageCount).toBe(1);
      expect(result.pageMarkers).toHaveLength(1);
      expect(result.pageMarkers[0].pageNumber).toBe(1);
    });

    it('should handle multi-page document', async () => {
      const mockMarkdown = `--- PAGE 1 ---
Page 1 content.

--- PAGE 2 ---
Page 2 content.

--- PAGE 3 ---
Page 3 content.

--- PAGE 4 ---
Page 4 content.`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: mockMarkdown }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      const result = await parsePromise;

      expect(result.pageCount).toBe(4);
      expect(result.pageMarkers).toHaveLength(4);
    });
  });

  describe('job polling', () => {
    it('should poll until job completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      // First poll - still pending
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'PENDING' }),
      });

      // Second poll - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: 'Content' }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      await parsePromise;

      // Should have polled twice
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    it('should throw LlamaParseError on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      });

      await expect(parsePdf(mockPdfBuffer, mockFilename, mockApiKey)).rejects.toThrow(
        LlamaParseError
      );
    });

    it('should throw LlamaParseError on job failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ERROR',
            error_message: 'PDF parsing failed',
          }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);

      // Run timers and catch the error
      await vi.runAllTimersAsync();

      await expect(parsePromise).rejects.toThrow(LlamaParseError);
    });

    it('should throw LlamaParseError on job status check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);

      await vi.runAllTimersAsync();

      await expect(parsePromise).rejects.toThrow(LlamaParseError);
    });

    it('should throw LlamaParseError on markdown retrieval failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);

      await vi.runAllTimersAsync();

      await expect(parsePromise).rejects.toThrow(LlamaParseError);
    });
  });

  describe('API calls', () => {
    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'job-1' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: 'Content' }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      await parsePromise;

      // Check that authorization header was included
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('llamaindex.ai'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it('should use correct API endpoints', async () => {
      const jobId = 'test-job-id';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: jobId }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ markdown: 'Content' }),
      });

      const parsePromise = parsePdf(mockPdfBuffer, mockFilename, mockApiKey);
      await vi.runAllTimersAsync();
      await parsePromise;

      // Check upload endpoint
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/upload'),
        expect.any(Object)
      );

      // Check status endpoint
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(`/job/${jobId}`),
        expect.any(Object)
      );

      // Check markdown result endpoint
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(`/job/${jobId}/result/markdown`),
        expect.any(Object)
      );
    });
  });
});
