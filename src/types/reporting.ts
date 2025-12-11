/**
 * Epic 23: Custom Reporting Types
 * Story 23.1: File Upload Infrastructure
 *
 * TypeScript interfaces for commission data, column mapping, and reporting.
 */

// =============================================================================
// File Upload & Validation
// =============================================================================

/**
 * Allowed file types for commission statement uploads
 * AC-23.1.1: Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf)
 */
export const ALLOWED_FILE_TYPES = ['xlsx', 'xls', 'csv', 'pdf'] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

/**
 * MIME types corresponding to allowed file types
 */
export const ALLOWED_MIME_TYPES: Record<AllowedFileType, string[]> = {
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  csv: ['text/csv', 'application/csv'],
  pdf: ['application/pdf'],
};

/**
 * Maximum file size in bytes (50MB per AC-23.1.1)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Get file type from filename extension
 */
export function getFileType(filename: string): AllowedFileType | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_FILE_TYPES.includes(ext as AllowedFileType)) {
    return ext as AllowedFileType;
  }
  return null;
}

/**
 * Check if a MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_MIME_TYPES).flat().includes(mimeType);
}

// =============================================================================
// Commission Data Source
// =============================================================================

/**
 * Status flow for commission data sources
 * pending → mapping → confirmed → imported → (or failed at any stage)
 */
export type CommissionSourceStatus =
  | 'pending'    // File uploaded, awaiting processing
  | 'mapping'    // AI has detected columns, awaiting user confirmation
  | 'confirmed'  // User confirmed mappings, ready for import
  | 'imported'   // Data successfully imported to commission_records
  | 'failed';    // Processing failed at some stage

/**
 * Commission data source (uploaded file)
 */
export interface CommissionDataSource {
  id: string;
  agencyId: string;
  userId: string;
  filename: string;
  fileType: AllowedFileType;
  carrierName?: string;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  rowCount?: number;
  columnMappings: ColumnMapping[];
  status: CommissionSourceStatus;
  errorMessage?: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Column Mapping
// =============================================================================

/**
 * Normalized target fields for commission data
 */
export type NormalizedField =
  | 'carrier_name'
  | 'policy_number'
  | 'policy_type'
  | 'insured_name'
  | 'effective_date'
  | 'transaction_date'
  | 'transaction_type'
  | 'premium'
  | 'commission_rate'
  | 'commission_amount';

/**
 * Human-readable labels for normalized fields
 */
export const NORMALIZED_FIELD_LABELS: Record<NormalizedField, string> = {
  carrier_name: 'Carrier Name',
  policy_number: 'Policy Number',
  policy_type: 'Policy Type',
  insured_name: 'Insured Name',
  effective_date: 'Effective Date',
  transaction_date: 'Transaction Date',
  transaction_type: 'Transaction Type',
  premium: 'Premium',
  commission_rate: 'Commission Rate',
  commission_amount: 'Commission Amount',
};

/**
 * Required fields for import (AC-23.3.6: commission_amount is required)
 */
export const REQUIRED_FIELDS: NormalizedField[] = ['commission_amount'];

/**
 * Column mapping from source to normalized field
 */
export interface ColumnMapping {
  sourceColumn: string;
  targetField: NormalizedField | null;
  confidence: number; // 0-1
  sampleValues: string[];
}

/**
 * Column mapping template (saved per carrier)
 */
export interface ColumnMappingTemplate {
  id: string;
  agencyId: string;
  carrierName: string;
  columnMappings: ColumnMapping[];
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
}

// =============================================================================
// Commission Records
// =============================================================================

/**
 * Transaction types for commission records
 */
export type TransactionType = 'new' | 'renewal' | 'endorsement' | 'cancellation';

/**
 * Normalized commission record
 */
export interface CommissionRecord {
  id: string;
  agencyId: string;
  sourceId: string;
  carrierName: string;
  policyNumber?: string;
  policyType?: string;
  insuredName?: string;
  effectiveDate?: string;
  transactionDate?: string;
  transactionType?: TransactionType;
  premium?: number;
  commissionRate?: number;
  commissionAmount: number;
  rawData: Record<string, unknown>;
  rowIndex: number;
  createdAt: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Upload response (POST /api/reporting/upload)
 * AC-23.1.5: Returns sourceId, status, filename
 */
export interface UploadResponse {
  sourceId: string;
  status: 'pending';
  filename: string;
}

/**
 * Upload error codes
 */
export type UploadErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'AUTH_REQUIRED'
  | 'DB_ERROR';

/**
 * Standard API error response
 */
export interface ApiError {
  code: UploadErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Parsed Data Types (Story 23.2)
// =============================================================================

/**
 * Column types detected by data analyzer.
 * AC-23.2.3: Detects number, date, text, boolean, currency, percentage
 */
export type ColumnType =
  | 'number'
  | 'date'
  | 'text'
  | 'boolean'
  | 'currency'
  | 'percentage';

/**
 * Column information with detected type and statistics.
 * Used in AnalyzeResponse and ParsedData.
 */
export interface ColumnInfo {
  name: string;
  type: ColumnType;
  sampleValues: unknown[];
  nullCount: number;
  uniqueCount: number;
  stats?: NumericStats | DateStats;
}

/**
 * Statistics for numeric columns (number, currency, percentage).
 */
export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  sum: number;
}

/**
 * Statistics for date columns.
 */
export interface DateStats {
  earliest: string;
  latest: string;
  range: string;
}

/**
 * Parsed data structure from file parser.
 * Standardized format for Excel, CSV, and PDF data.
 */
export interface ParsedData {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    parsedAt: string;
    fileType: AllowedFileType;
    /** Number of additional tables found (PDF only) */
    additionalTables?: number;
    /** True if PDF had no tables and fell back to text extraction */
    isTextFallback?: boolean;
  };
}

// =============================================================================
// Analyze API Types (Story 23.2)
// =============================================================================

/**
 * Response from POST /api/reporting/analyze
 * AC-23.2.4: Includes suggestedPrompts (3-5)
 */
export interface AnalyzeResponse {
  sourceId: string;
  status: 'ready';
  columns: ColumnInfo[];
  rowCount: number;
  suggestedPrompts: string[];
}

// =============================================================================
// Report Generation Types (Future Stories 23.3-23.7)
// =============================================================================

/**
 * Report query types
 */
export type ReportQueryType =
  | 'commission_summary'
  | 'production_trends'
  | 'carrier_mix'
  | 'custom';

/**
 * Report query parameters
 */
export interface ReportQuery {
  type: ReportQueryType;
  dateRange?: { start: string; end: string };
  carriers?: string[];
  groupBy?: 'carrier' | 'month' | 'policy_type';
}

/**
 * Chart configuration for reports
 */
export interface ChartConfig {
  id?: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  data: unknown[];
  xKey: string;
  yKey: string | string[];
  title?: string;
  description?: string;
}

/**
 * Report query result
 */
export interface ReportResult {
  data: Record<string, unknown>[];
  chartConfig?: ChartConfig;
  summary?: string;
}

/**
 * Request body for POST /api/reporting/generate
 */
export interface GenerateReportRequest {
  sourceId: string;
  prompt?: string;
}

/**
 * Generated report output
 */
export interface GeneratedReport {
  title: string;
  summary: string;
  insights: ReportInsight[];
  charts: ChartConfig[];
  dataTable: {
    columns: string[];
    rows: Record<string, unknown>[];
    sortable: boolean;
    filterable: boolean;
  };
  generatedAt: string;
  promptUsed: string;
}

/**
 * Individual insight in a report
 */
export interface ReportInsight {
  type: 'finding' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  relatedColumns?: string[];
}

/**
 * Response from POST /api/reporting/generate
 */
export interface GenerateResponse {
  report: GeneratedReport;
}
