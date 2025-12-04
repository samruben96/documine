/**
 * CSV Export Service Tests
 *
 * Story 7.6: AC-7.6.4, AC-7.6.5
 * Tests CSV generation, escaping, and filename formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeCSV,
  generateCsvContent,
  formatDateForFilename,
  downloadCsv,
} from '@/lib/compare/export';
import type { ComparisonTableData, ComparisonRow, GapWarning, ConflictWarning } from '@/lib/compare/diff';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('escapeCSV', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCSV('Hello World')).toBe('Hello World');
    expect(escapeCSV('12345')).toBe('12345');
    expect(escapeCSV('Simple text')).toBe('Simple text');
  });

  it('wraps values with commas in quotes', () => {
    expect(escapeCSV('Value, with comma')).toBe('"Value, with comma"');
    expect(escapeCSV('One, two, three')).toBe('"One, two, three"');
  });

  it('wraps values with quotes and escapes internal quotes', () => {
    expect(escapeCSV('Value "with" quotes')).toBe('"Value ""with"" quotes"');
    expect(escapeCSV('"Quoted"')).toBe('"""Quoted"""');
  });

  it('wraps values with newlines in quotes', () => {
    expect(escapeCSV('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    expect(escapeCSV('Line 1\r\nLine 2')).toBe('"Line 1\r\nLine 2"');
  });

  it('handles mixed special characters', () => {
    expect(escapeCSV('Hello, "World"\nNew line')).toBe('"Hello, ""World""\nNew line"');
  });

  it('handles empty string', () => {
    expect(escapeCSV('')).toBe('');
  });
});

describe('formatDateForFilename', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2025-12-03T10:30:00Z');
    expect(formatDateForFilename(date)).toBe('2025-12-03');
  });

  it('pads single-digit months and days', () => {
    const date = new Date('2025-01-05T10:30:00Z');
    expect(formatDateForFilename(date)).toBe('2025-01-05');
  });
});

describe('generateCsvContent', () => {
  const createMockTableData = (overrides: Partial<ComparisonTableData> = {}): ComparisonTableData => ({
    headers: ['Carrier A', 'Carrier B'],
    rows: [],
    documentCount: 2,
    gaps: [],
    conflicts: [],
    ...overrides,
  });

  const createMockRow = (overrides: Partial<ComparisonRow> = {}): ComparisonRow => ({
    id: 'test-row',
    field: 'Test Field',
    category: 'basic',
    fieldType: 'text',
    values: [
      { displayValue: 'Value 1', rawValue: 'Value 1', status: 'found' },
      { displayValue: 'Value 2', rawValue: 'Value 2', status: 'found' },
    ],
    hasDifference: false,
    bestIndex: null,
    worstIndex: null,
    ...overrides,
  });

  it('generates header row with Field and carrier names', () => {
    const tableData = createMockTableData();
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Field,Carrier A,Carrier B');
  });

  it('generates data rows with field and values', () => {
    const tableData = createMockTableData({
      rows: [
        createMockRow({ field: 'Premium', values: [
          { displayValue: '$5,000', rawValue: 5000, status: 'found' },
          { displayValue: '$4,500', rawValue: 4500, status: 'found' },
        ]}),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    // Values with commas are correctly escaped in quotes
    expect(lines[1]).toBe('Premium,"$5,000","$4,500"');
  });

  it('handles not found values as dash', () => {
    const tableData = createMockTableData({
      rows: [
        createMockRow({ field: 'Deductible', values: [
          { displayValue: '$1,000', rawValue: 1000, status: 'found' },
          { displayValue: '—', rawValue: null, status: 'not_found' },
        ]}),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Deductible,"$1,000",—');
  });

  it('handles empty displayValue', () => {
    const tableData = createMockTableData({
      rows: [
        createMockRow({ field: 'Empty', values: [
          { displayValue: '', rawValue: null, status: 'not_found' },
          { displayValue: '', rawValue: null, status: 'not_found' },
        ]}),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Empty,—,—');
  });

  it('includes gap summary section', () => {
    const tableData = createMockTableData({
      gaps: [
        {
          field: 'Cyber Liability',
          coverageType: 'cyber',
          documentsMissing: [1],
          documentsPresent: [0],
          severity: 'medium',
        },
      ] as GapWarning[],
    });
    const csv = generateCsvContent(tableData);
    expect(csv).toContain('GAPS IDENTIFIED');
    expect(csv).toContain('Cyber Liability: Missing in Carrier B (medium severity)');
  });

  it('includes conflict summary section', () => {
    const tableData = createMockTableData({
      conflicts: [
        {
          field: 'General Liability',
          conflictType: 'limit_variance',
          description: 'Limit varies 60% ($500,000 to $1,000,000)',
          affectedDocuments: [0, 1],
          severity: 'high',
        },
      ] as ConflictWarning[],
    });
    const csv = generateCsvContent(tableData);
    expect(csv).toContain('CONFLICTS IDENTIFIED');
    expect(csv).toContain('General Liability: Limit varies 60%');
  });

  it('properly escapes values with special characters', () => {
    const tableData = createMockTableData({
      rows: [
        createMockRow({ field: 'Named Insured', values: [
          { displayValue: 'Smith, Jones & Co.', rawValue: 'Smith, Jones & Co.', status: 'found' },
          { displayValue: '"Best" Insurance', rawValue: '"Best" Insurance', status: 'found' },
        ]}),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Named Insured,"Smith, Jones & Co.","""Best"" Insurance"');
  });

  it('handles multiple rows', () => {
    const tableData = createMockTableData({
      rows: [
        createMockRow({ id: 'row1', field: 'Carrier' }),
        createMockRow({ id: 'row2', field: 'Premium' }),
        createMockRow({ id: 'row3', field: 'Deductible' }),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // header + 3 rows
  });

  it('handles empty table data', () => {
    const tableData = createMockTableData({ rows: [] });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1); // only header
    expect(lines[0]).toBe('Field,Carrier A,Carrier B');
  });

  it('handles 4 carriers', () => {
    const tableData = createMockTableData({
      headers: ['Carrier A', 'Carrier B', 'Carrier C', 'Carrier D'],
      rows: [
        createMockRow({
          field: 'Premium',
          values: [
            { displayValue: '$5,000', rawValue: 5000, status: 'found' },
            { displayValue: '$4,500', rawValue: 4500, status: 'found' },
            { displayValue: '$6,000', rawValue: 6000, status: 'found' },
            { displayValue: '$5,500', rawValue: 5500, status: 'found' },
          ],
        }),
      ],
    });
    const csv = generateCsvContent(tableData);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Field,Carrier A,Carrier B,Carrier C,Carrier D');
    expect(lines[1]).toBe('Premium,"$5,000","$4,500","$6,000","$5,500"');
  });
});

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls saveAs with correct blob and filename', async () => {
    const { saveAs } = await import('file-saver');
    const tableData: ComparisonTableData = {
      headers: ['Test'],
      rows: [],
      documentCount: 1,
      gaps: [],
      conflicts: [],
    };

    downloadCsv(tableData);

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = (saveAs as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(filename).toMatch(/^docuMINE-comparison-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
