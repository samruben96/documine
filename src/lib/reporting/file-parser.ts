/**
 * File Parser Service
 * Epic 23: Flexible AI Reports - Story 23.2
 *
 * Parses Excel, CSV, and PDF files into standardized ParsedData format.
 * AC-23.2.1: Extract all rows and columns from Excel/CSV
 * AC-23.2.2: PDF parsing via LlamaParse with table extraction
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ParsedData, AllowedFileType } from '@/types/reporting';

// ============================================================================
// Excel Parsing (AC-23.2.1)
// ============================================================================

/**
 * Parse Excel file (.xlsx, .xls) into ParsedData format.
 * Extracts all rows and columns from the first sheet.
 *
 * @param buffer - File contents as Buffer
 * @returns ParsedData with rows and column metadata
 * @throws Error if file is empty or corrupt
 */
export function parseExcel(buffer: Buffer): ParsedData {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel file contains no sheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Failed to read Excel worksheet');
    }

    // Convert to JSON with header row (returns array of arrays with header: 1)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays first to get headers
      defval: null,
    }) as unknown[][];

    if (jsonData.length === 0) {
      // Return empty ParsedData for empty files
      return {
        columns: [],
        rows: [],
        metadata: {
          totalRows: 0,
          totalColumns: 0,
          parsedAt: new Date().toISOString(),
          fileType: 'xlsx',
        },
      };
    }

    // First row is headers
    const headers = (jsonData[0] || []).map((h, i) =>
      h !== null && h !== undefined ? String(h) : `Column_${i + 1}`
    );

    // Convert remaining rows to objects
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData || rowData.every((cell) => cell === null || cell === undefined)) {
        continue; // Skip completely empty rows
      }

      const row: Record<string, unknown> = {};
      headers.forEach((header, j) => {
        row[header] = rowData[j] ?? null;
      });
      rows.push(row);
    }

    // Build column info with sample values
    const columns = headers.map((name) => ({
      name,
      type: 'text' as const, // Will be analyzed by data-analyzer
      sampleValues: rows.slice(0, 5).map((r) => r[name]),
      nullCount: rows.filter((r) => r[name] === null || r[name] === undefined).length,
      uniqueCount: new Set(rows.map((r) => JSON.stringify(r[name]))).size,
    }));

    return {
      columns,
      rows,
      metadata: {
        totalRows: rows.length,
        totalColumns: headers.length,
        parsedAt: new Date().toISOString(),
        fileType: 'xlsx',
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Excel')) {
      throw error;
    }
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// CSV Parsing (AC-23.2.1)
// ============================================================================

/**
 * Parse CSV file into ParsedData format.
 * Handles various delimiters (comma, semicolon, tab) and encodings.
 *
 * @param buffer - File contents as Buffer
 * @returns ParsedData with rows and column metadata
 * @throws Error if file is empty or corrupt
 */
export function parseCsv(buffer: Buffer): ParsedData {
  try {
    // Detect encoding and convert buffer to string
    let content = buffer.toString('utf-8');

    // Handle BOM (Byte Order Mark)
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    // Handle Windows-1252 encoding fallback if utf-8 has issues
    if (content.includes('�')) {
      content = buffer.toString('latin1');
    }

    if (!content.trim()) {
      return {
        columns: [],
        rows: [],
        metadata: {
          totalRows: 0,
          totalColumns: 0,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };
    }

    // Parse with PapaParse (auto-detects delimiter)
    const result = Papa.parse<Record<string, unknown>>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-detect numbers, booleans
      transformHeader: (header, index) => header.trim() || `Column_${index + 1}`,
    });

    if (result.errors.length > 0) {
      // Log but don't fail on minor parse errors
      console.warn('CSV parse warnings:', result.errors.slice(0, 3));
    }

    const rows = result.data;
    const headers = result.meta.fields || [];

    if (headers.length === 0) {
      return {
        columns: [],
        rows: [],
        metadata: {
          totalRows: 0,
          totalColumns: 0,
          parsedAt: new Date().toISOString(),
          fileType: 'csv',
        },
      };
    }

    // Build column info
    const columns = headers.map((name) => ({
      name,
      type: 'text' as const,
      sampleValues: rows.slice(0, 5).map((r) => r[name]),
      nullCount: rows.filter((r) => r[name] === null || r[name] === undefined || r[name] === '').length,
      uniqueCount: new Set(rows.map((r) => JSON.stringify(r[name]))).size,
    }));

    return {
      columns,
      rows,
      metadata: {
        totalRows: rows.length,
        totalColumns: headers.length,
        parsedAt: new Date().toISOString(),
        fileType: 'csv',
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// PDF Parsing (AC-23.2.2) - LlamaParse Integration
// ============================================================================

/**
 * LlamaParse configuration for reporting PDF parsing.
 * Uses the same API key as the document processing Edge Function.
 */
interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
  pollingIntervalMs?: number;
  maxWaitTimeMs?: number;
}

const DEFAULT_LLAMAPARSE_CONFIG = {
  baseUrl: 'https://api.cloud.llamaindex.ai',
  pollingIntervalMs: 2000,
  maxWaitTimeMs: 300000, // 5 minutes
};

/**
 * Parse PDF file into ParsedData format using LlamaParse.
 * AC-23.2.2: PDF files parsed via LlamaParse with table extraction,
 * falling back to text summary if no tables found.
 *
 * @param buffer - File contents as Buffer
 * @returns ParsedData with extracted tables or text summary
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedData> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('LLAMA_CLOUD_API_KEY is required for PDF parsing');
  }

  const config: LlamaParseConfig = {
    apiKey,
    ...DEFAULT_LLAMAPARSE_CONFIG,
  };

  try {
    // Step 1: Upload file to LlamaParse
    const jobId = await uploadPdfToLlamaParse(buffer, config);

    // Step 2: Poll for completion
    await pollLlamaParseJob(jobId, config);

    // Step 3: Fetch result (markdown)
    const markdown = await fetchLlamaParseResult(jobId, config);

    // Step 4: Extract tables from markdown
    const tables = extractTablesFromMarkdown(markdown);

    if (tables.length > 0 && tables[0]) {
      // Use the first table as primary data source
      const primaryTable = tables[0];
      return {
        columns: primaryTable.columns,
        rows: primaryTable.rows,
        metadata: {
          totalRows: primaryTable.rows.length,
          totalColumns: primaryTable.columns.length,
          parsedAt: new Date().toISOString(),
          fileType: 'pdf',
          additionalTables: tables.length > 1 ? tables.length - 1 : undefined,
        },
      };
    }

    // Fallback: No tables found - return text summary as single-column data
    const textContent = markdown.replace(/---\s*PAGE\s+\d+\s*---/gi, '').trim();
    const lines = textContent.split('\n').filter((line) => line.trim());

    return {
      columns: [
        {
          name: 'content',
          type: 'text',
          sampleValues: lines.slice(0, 5),
          nullCount: 0,
          uniqueCount: lines.length,
        },
      ],
      rows: lines.map((line) => ({ content: line.trim() })),
      metadata: {
        totalRows: lines.length,
        totalColumns: 1,
        parsedAt: new Date().toISOString(),
        fileType: 'pdf',
        isTextFallback: true,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Upload PDF to LlamaParse API.
 */
async function uploadPdfToLlamaParse(
  buffer: Buffer,
  config: LlamaParseConfig
): Promise<string> {
  const url = `${config.baseUrl}/api/parsing/upload`;

  const formData = new FormData();
  // Convert Buffer to ArrayBuffer for Blob compatibility
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length) as ArrayBuffer;
  formData.append('file', new Blob([arrayBuffer]), 'document.pdf');
  formData.append('result_type', 'markdown');
  formData.append('page_prefix', '--- PAGE {pageNumber} ---\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LlamaParse upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (!result.id) {
    throw new Error('LlamaParse upload response missing job ID');
  }

  return result.id;
}

/**
 * Poll LlamaParse job until completion.
 */
async function pollLlamaParseJob(
  jobId: string,
  config: LlamaParseConfig
): Promise<void> {
  const startTime = Date.now();
  const maxWait = config.maxWaitTimeMs || DEFAULT_LLAMAPARSE_CONFIG.maxWaitTimeMs;
  const pollInterval = config.pollingIntervalMs || DEFAULT_LLAMAPARSE_CONFIG.pollingIntervalMs;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWait) {
      throw new Error(`LlamaParse job timed out after ${maxWait / 1000} seconds`);
    }

    const url = `${config.baseUrl}/api/parsing/job/${jobId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    const status = await response.json();

    if (status.status === 'SUCCESS') {
      return;
    }

    if (status.status === 'ERROR') {
      throw new Error(`LlamaParse job failed: ${status.error || 'Unknown error'}`);
    }

    // PENDING - wait and poll again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

/**
 * Fetch markdown result from LlamaParse.
 */
async function fetchLlamaParseResult(
  jobId: string,
  config: LlamaParseConfig
): Promise<string> {
  const url = `${config.baseUrl}/api/parsing/job/${jobId}/result/markdown`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch LlamaParse result: ${response.status}`);
  }

  const result = await response.json();
  return typeof result === 'string' ? result : result.markdown || result.text || '';
}

/**
 * Extract tables from markdown content.
 * Handles pipe-delimited markdown tables.
 */
function extractTablesFromMarkdown(markdown: string): Array<{
  columns: ParsedData['columns'];
  rows: Record<string, unknown>[];
}> {
  const tables: Array<{
    columns: ParsedData['columns'];
    rows: Record<string, unknown>[];
  }> = [];

  // Split by page markers and process each section
  const sections = markdown.split(/---\s*PAGE\s+\d+\s*---/gi);

  for (const section of sections) {
    const lines = section.split('\n');
    let inTable = false;
    let headers: string[] = [];
    let rows: Record<string, unknown>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine === undefined) continue;
      const line = currentLine.trim();

      // Detect table header row (contains pipes)
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Check if next line is separator (---|---|---)
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
          // This is a header row
          if (headers.length > 0 && rows.length > 0) {
            // Save previous table
            tables.push(buildTableResult(headers, rows));
          }
          headers = cells.map((h, idx) => h || `Column_${idx + 1}`);
          rows = [];
          inTable = true;
          i++; // Skip separator line
          continue;
        }

        // This is a data row
        if (inTable && headers.length > 0) {
          const row: Record<string, unknown> = {};
          headers.forEach((header, j) => {
            const value = cells[j];
            // Try to parse numbers
            if (value !== undefined && value !== '') {
              const numValue = parseTableCellValue(value);
              row[header] = numValue;
            } else {
              row[header] = null;
            }
          });
          rows.push(row);
        }
      } else if (inTable && line === '') {
        // Empty line might end table, but continue checking
        continue;
      } else if (inTable && !line.includes('|')) {
        // Non-table content ends the table
        if (headers.length > 0 && rows.length > 0) {
          tables.push(buildTableResult(headers, rows));
          headers = [];
          rows = [];
        }
        inTable = false;
      }
    }

    // Don't forget table at end of section
    if (headers.length > 0 && rows.length > 0) {
      tables.push(buildTableResult(headers, rows));
    }
  }

  return tables;
}

/**
 * Build table result with column metadata.
 */
function buildTableResult(
  headers: string[],
  rows: Record<string, unknown>[]
): { columns: ParsedData['columns']; rows: Record<string, unknown>[] } {
  const columns = headers.map((name) => ({
    name,
    type: 'text' as const,
    sampleValues: rows.slice(0, 5).map((r) => r[name]),
    nullCount: rows.filter((r) => r[name] === null || r[name] === undefined).length,
    uniqueCount: new Set(rows.map((r) => JSON.stringify(r[name]))).size,
  }));

  return { columns, rows };
}

/**
 * Parse table cell value, detecting numbers and cleaning formatting.
 */
function parseTableCellValue(value: string): unknown {
  const trimmed = value.trim();

  // Remove currency symbols and thousands separators for number detection
  const cleanedForNumber = trimmed.replace(/[$€£¥,]/g, '');

  // Check for percentage
  if (trimmed.endsWith('%')) {
    const num = parseFloat(cleanedForNumber.slice(0, -1));
    if (!isNaN(num)) {
      return num / 100; // Return as decimal
    }
  }

  // Check for number
  const num = parseFloat(cleanedForNumber);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  // Check for boolean
  const lower = trimmed.toLowerCase();
  if (lower === 'true' || lower === 'yes') return true;
  if (lower === 'false' || lower === 'no') return false;

  // Return as string
  return trimmed;
}

// ============================================================================
// Unified Parser
// ============================================================================

/**
 * Parse file based on type into ParsedData format.
 *
 * @param buffer - File contents as Buffer
 * @param fileType - File type (xlsx, xls, csv, pdf)
 * @returns ParsedData with rows and column metadata
 */
export async function parseFile(
  buffer: Buffer,
  fileType: AllowedFileType
): Promise<ParsedData> {
  switch (fileType) {
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer);
    case 'csv':
      return parseCsv(buffer);
    case 'pdf':
      return parsePdf(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
