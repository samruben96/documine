/**
 * File Parser Unit Tests
 * Story 23.2: Data Analysis Pipeline
 *
 * AC-23.2.1: File parsing extracts all rows and columns from Excel/CSV
 * AC-23.2.2: PDF files parsed via LlamaParse with table extraction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseExcel, parseCsv, parseFile } from '@/lib/reporting/file-parser';

// Mock xlsx module
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

// Mock papaparse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('File Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('parseExcel', () => {
    it('should parse valid Excel file and extract all rows/columns', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };

      const mockData = [
        ['Name', 'Amount', 'Date'],
        ['John', 1000, '2024-01-15'],
        ['Jane', 2500, '2024-02-20'],
        ['Bob', 750, '2024-03-10'],
      ];

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockData);

      const buffer = Buffer.from('test data');
      const result = parseExcel(buffer);

      expect(result.columns).toHaveLength(3);
      expect(result.columns[0]?.name).toBe('Name');
      expect(result.columns[1]?.name).toBe('Amount');
      expect(result.columns[2]?.name).toBe('Date');
      expect(result.rows).toHaveLength(3);
      expect(result.metadata.totalRows).toBe(3);
      expect(result.metadata.totalColumns).toBe(3);
      expect(result.metadata.fileType).toBe('xlsx');
    });

    it('should handle empty Excel file', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([]);

      const buffer = Buffer.from('empty');
      const result = parseExcel(buffer);

      expect(result.columns).toHaveLength(0);
      expect(result.rows).toHaveLength(0);
      expect(result.metadata.totalRows).toBe(0);
    });

    it('should throw error for Excel file with no sheets', async () => {
      const mockWorkbook = {
        SheetNames: [],
        Sheets: {},
      };

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);

      const buffer = Buffer.from('no sheets');
      expect(() => parseExcel(buffer)).toThrow('Excel file contains no sheets');
    });

    it('should generate column names for empty headers', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };

      const mockData = [
        ['Name', null, 'Date'],
        ['John', 1000, '2024-01-15'],
      ];

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockData);

      const buffer = Buffer.from('test');
      const result = parseExcel(buffer);

      expect(result.columns[1]?.name).toBe('Column_2');
    });
  });

  describe('parseCsv', () => {
    it('should parse CSV with comma delimiter', async () => {
      const Papa = (await import('papaparse')).default;
      vi.mocked(Papa.parse).mockReturnValue({
        data: [
          { Name: 'John', Amount: 1000 },
          { Name: 'Jane', Amount: 2500 },
        ],
        meta: { fields: ['Name', 'Amount'] },
        errors: [],
      } as ReturnType<typeof Papa.parse<Record<string, unknown>>>);

      const csvContent = 'Name,Amount\nJohn,1000\nJane,2500';
      const buffer = Buffer.from(csvContent);
      const result = parseCsv(buffer);

      expect(result.columns).toHaveLength(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Amount: 1000 });
    });

    it('should handle UTF-8 BOM', async () => {
      const Papa = (await import('papaparse')).default;
      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ Name: 'Test' }],
        meta: { fields: ['Name'] },
        errors: [],
      } as ReturnType<typeof Papa.parse<Record<string, unknown>>>);

      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const content = Buffer.from('Name\nTest');
      const buffer = Buffer.concat([bom, content]);
      const result = parseCsv(buffer);

      expect(result.rows).toHaveLength(1);
    });

    it('should handle empty CSV file', async () => {
      const Papa = (await import('papaparse')).default;
      vi.mocked(Papa.parse).mockReturnValue({
        data: [],
        meta: { fields: [] },
        errors: [],
      } as unknown as ReturnType<typeof Papa.parse<Record<string, unknown>>>);

      const buffer = Buffer.from('');
      const result = parseCsv(buffer);

      expect(result.columns).toHaveLength(0);
      expect(result.rows).toHaveLength(0);
    });

    it('should log parse warnings but not fail', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const Papa = (await import('papaparse')).default;
      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ Name: 'Test' }],
        meta: { fields: ['Name'] },
        errors: [{ type: 'FieldMismatch', code: 'TooFewFields', message: 'warning', row: 1 }],
      } as unknown as ReturnType<typeof Papa.parse<Record<string, unknown>>>);

      const buffer = Buffer.from('Name\nTest');
      const result = parseCsv(buffer);

      expect(result.rows).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('parseFile', () => {
    it('should route xlsx to parseExcel', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([['Col1'], ['value1']]);

      const buffer = Buffer.from('test');
      const result = await parseFile(buffer, 'xlsx');

      expect(result.metadata.fileType).toBe('xlsx');
    });

    it('should route xls to parseExcel', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      const xlsx = await import('xlsx');
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([['Col1'], ['value1']]);

      const buffer = Buffer.from('test');
      const result = await parseFile(buffer, 'xls');

      // Note: parseExcel sets fileType to 'xlsx' for both xlsx and xls
      expect(result.metadata.fileType).toBe('xlsx');
    });

    it('should route csv to parseCsv', async () => {
      const Papa = (await import('papaparse')).default;
      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ Name: 'Test' }],
        meta: { fields: ['Name'] },
        errors: [],
      } as ReturnType<typeof Papa.parse<Record<string, unknown>>>);

      const buffer = Buffer.from('Name\nTest');
      const result = await parseFile(buffer, 'csv');

      expect(result.metadata.fileType).toBe('csv');
    });

    it('should throw error for PDF without LLAMA_CLOUD_API_KEY', async () => {
      const originalEnv = process.env.LLAMA_CLOUD_API_KEY;
      delete process.env.LLAMA_CLOUD_API_KEY;

      const buffer = Buffer.from('pdf content');
      await expect(parseFile(buffer, 'pdf')).rejects.toThrow('LLAMA_CLOUD_API_KEY is required');

      process.env.LLAMA_CLOUD_API_KEY = originalEnv;
    });

    it('should throw error for unsupported file type', async () => {
      const buffer = Buffer.from('test');
      // @ts-expect-error Testing invalid file type
      await expect(parseFile(buffer, 'doc')).rejects.toThrow('Unsupported file type');
    });
  });
});
