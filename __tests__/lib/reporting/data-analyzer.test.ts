/**
 * Data Analyzer Unit Tests
 * Story 23.2: Data Analysis Pipeline
 *
 * AC-23.2.3: AI detects column types: number, date, text, boolean, currency, percentage
 * AC-23.2.4: AI suggests 3-5 relevant report prompts based on detected data patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeColumnTypes, generateSuggestedPrompts } from '@/lib/reporting/data-analyzer';
import type { ParsedData, ColumnInfo } from '@/types/reporting';

// Mock LLM client
vi.mock('@/lib/llm/config', () => ({
  getLLMClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
  getModelId: vi.fn(() => 'test-model'),
}));

describe('Data Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeColumnTypes', () => {
    it('should detect numeric columns', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Amount', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Amount: 100 },
          { Amount: 250.50 },
          { Amount: 1000 },
          { Amount: 75 },
        ],
        metadata: {
          totalRows: 4,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('number');
      expect(result[0]?.stats).toBeDefined();
      expect((result[0]?.stats as { min: number; max: number; mean: number; sum: number }).min).toBe(75);
      expect((result[0]?.stats as { min: number; max: number; mean: number; sum: number }).max).toBe(1000);
    });

    it('should detect date columns (ISO format)', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Created', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Created: '2024-01-15' },
          { Created: '2024-02-20' },
          { Created: '2024-03-10' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('date');
      expect(result[0]?.stats).toBeDefined();
      expect((result[0]?.stats as { earliest: string; latest: string }).earliest).toBe('2024-01-15');
      expect((result[0]?.stats as { earliest: string; latest: string }).latest).toBe('2024-03-10');
    });

    it('should detect date columns (US format)', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Date', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Date: '01/15/2024' },
          { Date: '02/20/2024' },
          { Date: '12/31/2024' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('date');
    });

    it('should detect boolean columns', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Active', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Active: 'true' },
          { Active: 'false' },
          { Active: 'true' },
          { Active: 'false' },
        ],
        metadata: {
          totalRows: 4,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('boolean');
    });

    it('should detect boolean columns (yes/no)', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Confirmed', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Confirmed: 'yes' },
          { Confirmed: 'no' },
          { Confirmed: 'yes' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('boolean');
    });

    it('should detect currency columns', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Price', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Price: '$1,234.56' },
          { Price: '$999.00' },
          { Price: '$2,500.00' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('currency');
    });

    it('should detect percentage columns', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Rate', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Rate: '15%' },
          { Rate: '25%' },
          { Rate: '10.5%' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('percentage');
    });

    it('should detect text columns for non-matching values', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Name', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Name: 'John Smith' },
          { Name: 'Jane Doe' },
          { Name: 'Bob Wilson' },
        ],
        metadata: {
          totalRows: 3,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('text');
    });

    it('should handle mixed data defaulting to text', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Mixed', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Mixed: '100' },
          { Mixed: 'hello' },
          { Mixed: '2024-01-01' },
          { Mixed: 'true' },
        ],
        metadata: {
          totalRows: 4,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      // No single type has >70%, should default to text
      expect(result[0]?.type).toBe('text');
    });

    it('should handle columns with null values', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Value', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Value: 100 },
          { Value: null },
          { Value: 200 },
          { Value: undefined },
          { Value: 300 },
        ],
        metadata: {
          totalRows: 5,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.type).toBe('number');
      expect(result[0]?.nullCount).toBe(2);
    });

    it('should calculate unique count correctly', () => {
      const data: ParsedData = {
        columns: [
          { name: 'Category', type: 'text', sampleValues: [], nullCount: 0, uniqueCount: 0 },
        ],
        rows: [
          { Category: 'A' },
          { Category: 'B' },
          { Category: 'A' },
          { Category: 'C' },
          { Category: 'B' },
        ],
        metadata: {
          totalRows: 5,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = analyzeColumnTypes(data);

      expect(result[0]?.uniqueCount).toBe(3);
    });
  });

  describe('generateSuggestedPrompts', () => {
    it('should return 3-5 prompts from AI', async () => {
      const { getLLMClient } = await import('@/lib/llm/config');
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                'Summarize sales by region',
                'Show monthly trends',
                'Compare top 10 products',
              ]),
            },
          },
        ],
      });

      vi.mocked(getLLMClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as ReturnType<typeof getLLMClient>);

      const columns: ColumnInfo[] = [
        { name: 'Sales', type: 'number', sampleValues: [100, 200], nullCount: 0, uniqueCount: 10 },
        { name: 'Region', type: 'text', sampleValues: ['North', 'South'], nullCount: 0, uniqueCount: 4 },
      ];

      const data: ParsedData = {
        columns,
        rows: [
          { Sales: 100, Region: 'North' },
          { Sales: 200, Region: 'South' },
        ],
        metadata: {
          totalRows: 2,
          totalColumns: 2,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = await generateSuggestedPrompts(columns, data);

      expect(result).toHaveLength(3);
      expect(result[0]).toContain('sales');
    });

    it('should handle markdown code blocks in AI response', async () => {
      const { getLLMClient } = await import('@/lib/llm/config');
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '```json\n["Prompt 1", "Prompt 2", "Prompt 3"]\n```',
            },
          },
        ],
      });

      vi.mocked(getLLMClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as ReturnType<typeof getLLMClient>);

      const columns: ColumnInfo[] = [
        { name: 'Value', type: 'number', sampleValues: [1, 2], nullCount: 0, uniqueCount: 2 },
      ];

      const data: ParsedData = {
        columns,
        rows: [{ Value: 1 }, { Value: 2 }],
        metadata: {
          totalRows: 2,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = await generateSuggestedPrompts(columns, data);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Prompt 1');
    });

    it('should return default prompts on AI error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { getLLMClient } = await import('@/lib/llm/config');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      vi.mocked(getLLMClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as ReturnType<typeof getLLMClient>);

      const columns: ColumnInfo[] = [
        { name: 'Amount', type: 'number', sampleValues: [100], nullCount: 0, uniqueCount: 1 },
      ];

      const data: ParsedData = {
        columns,
        rows: [{ Amount: 100 }],
        metadata: {
          totalRows: 1,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = await generateSuggestedPrompts(columns, data);

      // Should return fallback prompts
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should limit prompts to maximum of 5', async () => {
      const { getLLMClient } = await import('@/lib/llm/config');
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                'Prompt 1',
                'Prompt 2',
                'Prompt 3',
                'Prompt 4',
                'Prompt 5',
                'Prompt 6',
                'Prompt 7',
              ]),
            },
          },
        ],
      });

      vi.mocked(getLLMClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as ReturnType<typeof getLLMClient>);

      const columns: ColumnInfo[] = [
        { name: 'Value', type: 'number', sampleValues: [1], nullCount: 0, uniqueCount: 1 },
      ];

      const data: ParsedData = {
        columns,
        rows: [{ Value: 1 }],
        metadata: {
          totalRows: 1,
          totalColumns: 1,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = await generateSuggestedPrompts(columns, data);

      expect(result).toHaveLength(5);
    });

    it('should generate date-based prompts when date columns present', async () => {
      const { getLLMClient } = await import('@/lib/llm/config');
      const mockCreate = vi.fn().mockRejectedValue(new Error('Force fallback'));

      vi.mocked(getLLMClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as ReturnType<typeof getLLMClient>);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const columns: ColumnInfo[] = [
        { name: 'Amount', type: 'number', sampleValues: [100], nullCount: 0, uniqueCount: 1 },
        { name: 'Date', type: 'date', sampleValues: ['2024-01-01'], nullCount: 0, uniqueCount: 1 },
      ];

      const data: ParsedData = {
        columns,
        rows: [{ Amount: 100, Date: '2024-01-01' }],
        metadata: {
          totalRows: 1,
          totalColumns: 2,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };

      const result = await generateSuggestedPrompts(columns, data);

      // Should include time-based prompt
      expect(result.some((p) => p.toLowerCase().includes('trend') || p.toLowerCase().includes('time'))).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
