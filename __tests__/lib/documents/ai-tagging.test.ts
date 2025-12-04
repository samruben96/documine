/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocumentTags, tagResultSchema } from '@/lib/documents/ai-tagging';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Tagging Service', () => {
  const mockApiKey = 'test-api-key';
  const mockChunks = [
    'This is a commercial auto insurance quote from Progressive.',
    'Coverage includes liability and collision with $500,000 limits.',
    'Named insured: Acme Trucking Company LLC.',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDocumentTags', () => {
    it('returns valid tags from successful API response (AC-F2-3.1, AC-F2-3.2, AC-F2-3.3)', async () => {
      const mockResponse = {
        tags: ['commercial auto', 'liability', 'Progressive', 'trucking'],
        summary: 'Commercial auto quote from Progressive for trucking company with liability coverage.',
        documentType: 'quote' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse),
            },
          }],
        }),
      });

      const result = await generateDocumentTags(mockChunks, mockApiKey);

      expect(result).not.toBeNull();
      expect(result?.tags).toHaveLength(4);
      expect(result?.tags).toContain('commercial auto');
      expect(result?.summary).toContain('Progressive');
      expect(result?.documentType).toBe('quote');
    });

    it('validates response against schema (AC-F2-3.1)', async () => {
      // Response with too few tags should fail validation
      const invalidResponse = {
        tags: ['only-one'],
        summary: 'Valid summary',
        documentType: 'quote',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(invalidResponse),
            },
          }],
        }),
      });

      const result = await generateDocumentTags(mockChunks, mockApiKey);

      expect(result).toBeNull();
    });

    it('returns null on API error (AC-F2-3.5)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await generateDocumentTags(mockChunks, mockApiKey);

      expect(result).toBeNull();
    });

    it('returns null when API returns empty content (AC-F2-3.5)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: null,
            },
          }],
        }),
      });

      const result = await generateDocumentTags(mockChunks, mockApiKey);

      expect(result).toBeNull();
    });

    it('returns null for empty chunks array (AC-F2-3.5)', async () => {
      const result = await generateDocumentTags([], mockApiKey);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null for whitespace-only chunks (AC-F2-3.5)', async () => {
      // Empty strings after trim should trigger early return
      const result = await generateDocumentTags([''], mockApiKey);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles timeout via AbortController (AC-F2-3.4)', async () => {
      // Verify abort controller is passed to fetch
      const mockResponse = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Summary.',
        documentType: 'quote' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse),
            },
          }],
        }),
      });

      await generateDocumentTags(mockChunks, mockApiKey, 5000);

      // Verify signal was passed
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
    });

    it('handles AbortError gracefully (AC-F2-3.5)', async () => {
      // Simulate abort error
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await generateDocumentTags(mockChunks, mockApiKey);

      expect(result).toBeNull();
    });

    it('uses only first 5 chunks for context efficiency', async () => {
      const manyChunks = Array(10).fill('Chunk content.');

      const mockResponse = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Document summary.',
        documentType: 'general' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse),
            },
          }],
        }),
      });

      await generateDocumentTags(manyChunks, mockApiKey);

      // Check that request body contains only 5 chunks separated by delimiters
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const content = requestBody.messages[1].content;
      const chunkSeparators = (content.match(/---/g) || []).length;
      expect(chunkSeparators).toBe(4); // 5 chunks = 4 separators
    });

    it('sends correct request format to OpenAI', async () => {
      const mockResponse = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Summary text.',
        documentType: 'quote' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse),
            },
          }],
        }),
      });

      await generateDocumentTags(mockChunks, mockApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('gpt-5.1');
      expect(requestBody.response_format.type).toBe('json_schema');
      expect(requestBody.temperature).toBe(0.1);
    });
  });

  describe('tagResultSchema', () => {
    it('validates correct tag result', () => {
      const valid = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Valid summary text.',
        documentType: 'quote',
      };

      const result = tagResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('requires minimum 3 tags (AC-F2-3.1)', () => {
      const invalid = {
        tags: ['tag1', 'tag2'],
        summary: 'Summary.',
        documentType: 'quote',
      };

      const result = tagResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows maximum 5 tags (AC-F2-3.1)', () => {
      const valid = {
        tags: ['t1', 't2', 't3', 't4', 't5'],
        summary: 'Summary.',
        documentType: 'general',
      };

      const result = tagResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects more than 5 tags (AC-F2-3.1)', () => {
      const invalid = {
        tags: ['t1', 't2', 't3', 't4', 't5', 't6'],
        summary: 'Summary.',
        documentType: 'quote',
      };

      const result = tagResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects summary over 200 characters (AC-F2-3.2)', () => {
      const invalid = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'A'.repeat(201),
        documentType: 'quote',
      };

      const result = tagResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('only allows quote or general document types (AC-F2-3.3)', () => {
      const validQuote = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Summary.',
        documentType: 'quote',
      };

      const validGeneral = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Summary.',
        documentType: 'general',
      };

      const invalid = {
        tags: ['tag1', 'tag2', 'tag3'],
        summary: 'Summary.',
        documentType: 'certificate',
      };

      expect(tagResultSchema.safeParse(validQuote).success).toBe(true);
      expect(tagResultSchema.safeParse(validGeneral).success).toBe(true);
      expect(tagResultSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
