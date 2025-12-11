# Epic Technical Specification: Flexible AI Reports

Date: 2025-12-10
Author: Sam
Epic ID: 23
Status: **REVISED** - Pivoted from Commission Reporting to Flexible AI Reports

---

## Overview

Epic 23 introduces **Flexible AI Reports** to docuMINE - a powerful feature that allows users to upload any tabular data (Excel, CSV, PDF) and receive AI-generated insights and reports. Unlike traditional reporting tools that require predefined schemas, this feature uses AI to analyze arbitrary data structures and generate meaningful reports based on user prompts or autonomous best-effort analysis.

**Key Value Proposition:** Upload any data file → Optionally describe what you want → Get instant AI-generated reports with text summaries, interactive charts, and exportable documents.

This replaces the originally planned commission-specific reporting system with a more flexible, broadly applicable solution.

## Objectives and Scope

### In-Scope (MVP)

- **Universal Data Upload**: Support for Excel (.xlsx, .xls), CSV (.csv), and PDF files up to 50MB
- **Flexible Prompt Input**: Optional text field for users to describe desired report (e.g., "Show me sales trends by region")
- **Autonomous Analysis**: When no prompt provided, AI generates best-effort summary and insights
- **Multiple Output Formats**:
  - Text summary with key findings
  - Interactive charts (bar, line, pie)
  - Interactive data tables with filtering/sorting
  - Downloadable PDF report
  - Downloadable Excel/CSV export
- **On-Demand Generation**: Reports generated fresh each request (no storage/history)
- **Agency Isolation**: All data processing respects RLS policies

### Out-of-Scope (Future Phases)

- Saved report history/templates
- Scheduled report generation
- Multi-file analysis (combining multiple uploads)
- Real-time collaborative editing
- Custom visualization types
- Report sharing outside agency

## System Architecture Alignment

Flexible AI Reports leverages the existing docuMINE stack:

- **Frontend**: Next.js 15 App Router with shadcn/ui components
- **Backend**: Supabase PostgreSQL for metadata, Supabase Storage for files
- **AI Processing**:
  - **Data Understanding**: GPT-4o for analyzing data structure and content
  - **Report Generation**: GPT-4o for generating insights, summaries, chart recommendations
  - **PDF Extraction**: LlamaParse (existing) for PDF→structured data
- **Visualization**: Recharts for interactive charts
- **Export**: react-pdf for PDF generation, xlsx for Excel export

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ File Upload  │  │ Prompt Input │  │  Report Output View   │ │
│  │  (Dropzone)  │  │  (Optional)  │  │ Text+Charts+Export    │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (/api/reporting)                │
├─────────────────────────────────────────────────────────────────┤
│  POST /upload        - Store file, return sourceId              │
│  POST /analyze       - Parse file, analyze with AI              │
│  POST /generate      - Generate report from analysis + prompt   │
│  GET  /export/pdf    - Generate PDF download                    │
│  GET  /export/excel  - Generate Excel download                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Processing Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│  1. File Parser                                                 │
│     ├─ Excel (.xlsx/.xls) → xlsx library                        │
│     ├─ CSV → papaparse                                          │
│     └─ PDF → LlamaParse → GPT-4o table extraction               │
│                                                                 │
│  2. Data Analyzer (GPT-4o)                                      │
│     ├─ Detect column types (numeric, date, category, text)      │
│     ├─ Identify relationships and patterns                      │
│     └─ Generate data summary/statistics                         │
│                                                                 │
│  3. Report Generator (GPT-4o)                                   │
│     ├─ Process user prompt (or use auto-analysis)               │
│     ├─ Generate text insights                                   │
│     ├─ Recommend chart types and configurations                 │
│     └─ Structure data for visualization                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Storage & Security                           │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Storage: Temporary file storage (auto-cleanup)        │
│  RLS Policies: Agency-scoped access only                        │
│  Audit Logging: Track uploads and report generations            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs |
|----------------|----------------|--------|---------|
| `FileParserService` | Extract structured data from files | File blob | Rows, columns, metadata |
| `DataAnalyzerService` | AI-powered data understanding | Parsed data | Column types, patterns, stats |
| `ReportGeneratorService` | Generate insights from data + prompt | Analysis + user prompt | Report content, chart configs |
| `ChartService` | Transform data to chart configurations | Report output | Recharts-compatible configs |
| `ExportService` | Generate PDF/Excel downloads | Report + data | File blob |

### Data Models

**Simplified Schema (no persistent commission tables):**

```sql
-- Data sources (uploaded files) - kept for audit/tracking only
CREATE TABLE report_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  filename text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('xlsx', 'xls', 'csv', 'pdf')),
  file_size_bytes integer NOT NULL,
  row_count integer,
  column_count integer,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'ready', 'failed')),
  error_message text,
  -- Parsed data cached for re-analysis (auto-deleted after 24h)
  parsed_data jsonb,
  parsed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);

-- Auto-cleanup: Cron job deletes expired records and storage files
-- No commission_records or column_mapping_templates tables needed

-- Indexes
CREATE INDEX idx_report_sources_agency ON report_data_sources(agency_id);
CREATE INDEX idx_report_sources_expires ON report_data_sources(expires_at);

-- RLS Policies
ALTER TABLE report_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sources scoped to agency" ON report_data_sources
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

**TypeScript Types:**

```typescript
// types/reporting.ts (REVISED)

// Allowed file types
export const ALLOWED_FILE_TYPES = ['xlsx', 'xls', 'csv', 'pdf'] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Data source (uploaded file)
export interface ReportDataSource {
  id: string;
  agencyId: string;
  userId: string;
  filename: string;
  fileType: AllowedFileType;
  fileSizeBytes: number;
  rowCount?: number;
  columnCount?: number;
  storagePath: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  errorMessage?: string;
  parsedAt?: string;
  createdAt: string;
  expiresAt: string;
}

// Parsed data structure
export interface ParsedData {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    parsedAt: string;
    fileType: AllowedFileType;
  };
}

export interface ColumnInfo {
  name: string;
  type: 'number' | 'date' | 'text' | 'boolean' | 'currency' | 'percentage';
  sampleValues: unknown[];
  nullCount: number;
  uniqueCount: number;
  stats?: NumericStats | DateStats;
}

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  sum: number;
}

export interface DateStats {
  earliest: string;
  latest: string;
  range: string;
}

// Report generation request
export interface GenerateReportRequest {
  sourceId: string;
  prompt?: string; // Optional - AI will auto-generate if missing
}

// Report output
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
  promptUsed: string; // Shows what prompt AI used (user's or auto-generated)
}

export interface ReportInsight {
  type: 'finding' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  relatedColumns?: string[];
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string | string[]; // Support multi-series
  colorKey?: string;
}

// API Response types
export interface UploadResponse {
  sourceId: string;
  status: 'pending';
  filename: string;
}

export interface AnalyzeResponse {
  sourceId: string;
  status: 'ready';
  columns: ColumnInfo[];
  rowCount: number;
  suggestedPrompts: string[]; // AI suggests what user might want
}

export interface GenerateResponse {
  report: GeneratedReport;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### APIs and Interfaces

```typescript
// POST /api/reporting/upload
// Upload a data file for analysis
Request: FormData { file: File }
Response: {
  data: UploadResponse;
  error: null;
}

// POST /api/reporting/analyze
// Parse file and analyze data structure
Request: { sourceId: string }
Response: {
  data: AnalyzeResponse;
  error: null;
}

// POST /api/reporting/generate
// Generate report from data + optional prompt
Request: GenerateReportRequest
Response: {
  data: GenerateResponse;
  error: null;
}
// SSE streaming available for real-time generation feedback

// GET /api/reporting/export/pdf?sourceId=xxx&reportData=base64
// Generate PDF download
Response: PDF file stream

// GET /api/reporting/export/excel?sourceId=xxx
// Generate Excel download with original data + summary sheet
Response: Excel file stream

// DELETE /api/reporting/sources/[id]
// Delete uploaded file (manual cleanup before expiry)
Response: { data: { deleted: true }; error: null }
```

### Workflows

**Upload → Analyze → Generate Flow:**

```
User → Upload File → Validate → Store in Supabase Storage
                                        ↓
                           Return sourceId immediately
                                        ↓
User → Click "Analyze" → Parse file (xlsx/csv/pdf)
                                        ↓
                           AI analyzes data structure
                                        ↓
                           Return column info + suggested prompts
                                        ↓
User → Enter prompt (or leave blank) → Click "Generate Report"
                                        ↓
                           AI generates insights + chart configs
                                        ↓
User ← View interactive report ← Stream results
                                        ↓
User → Export PDF/Excel or upload new file
```

**Auto-Analysis (No Prompt):**

When user doesn't provide a prompt, AI follows this logic:
1. Identify key metrics (numeric columns)
2. Identify dimensions (categorical columns)
3. Check for time series data (date columns)
4. Generate summary statistics
5. Find interesting patterns/outliers
6. Recommend best visualization types
7. Create 2-3 default charts showing most insightful views

---

## UI Components

### ReportingPage Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Header: Commission Reporting → Data Reports]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  STEP 1: Upload Your Data                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │         📁 Drop a file here or click to upload       │  │ │
│  │  │            Excel, CSV, or PDF up to 50MB             │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  STEP 2: What report do you want? (Optional)              │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  "Show sales trends by region" or leave blank for   │  │ │
│  │  │   AI to generate the best report automatically      │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Suggested prompts: (shown after file analysis)           │ │
│  │  • "Summarize monthly totals"                             │ │
│  │  • "Compare by category"                                  │ │
│  │  • "Show top 10 by value"                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [Generate Report]                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  REPORT: [Title]                          [PDF] [Excel]   │ │
│  │                                                           │ │
│  │  Summary:                                                 │ │
│  │  Lorem ipsum analysis findings...                         │ │
│  │                                                           │ │
│  │  Key Insights:                                            │ │
│  │  ✓ Finding 1                                              │ │
│  │  ⚠ Warning about trend                                    │ │
│  │  💡 Recommendation                                        │ │
│  │                                                           │ │
│  │  ┌─────────────────┐ ┌─────────────────┐                  │ │
│  │  │   Bar Chart     │ │   Line Chart    │                  │ │
│  │  │   [Interactive] │ │   [Interactive] │                  │ │
│  │  └─────────────────┘ └─────────────────┘                  │ │
│  │                                                           │ │
│  │  Data Table:                         [Filter] [Sort]      │ │
│  │  ┌───────────────────────────────────────────────────┐   │ │
│  │  │ Col A  │ Col B  │ Col C  │ Col D  │               │   │ │
│  │  │--------|--------|--------|--------|               │   │ │
│  │  │ data   │ data   │ data   │ data   │               │   │ │
│  │  └───────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria (REVISED)

### File Upload (Story 23.1) - COMPLETE, needs UI text updates

1. **AC-23.1.1**: User can upload Excel (.xlsx, .xls), CSV, and PDF files up to 50MB ✅
2. **AC-23.1.2**: Upload progress indicator shows percentage complete ✅
3. **AC-23.1.3**: Invalid file types show clear error message ✅
4. **AC-23.1.4**: Uploaded files are stored in Supabase Storage under agency folder ✅
5. **AC-23.1.5**: Upload creates data source record with status='pending' ✅

### Data Analysis (Story 23.2) - REVISED

6. **AC-23.2.1**: File parsing extracts all rows and columns from Excel/CSV
7. **AC-23.2.2**: PDF files parsed via LlamaParse with table extraction
8. **AC-23.2.3**: AI detects column types (number, date, text, currency, percentage)
9. **AC-23.2.4**: AI suggests 3-5 relevant report prompts based on data
10. **AC-23.2.5**: Analysis completes within 15 seconds for files < 10K rows

### Prompt Input (Story 23.3) - NEW

11. **AC-23.3.1**: Text input field for optional report description
12. **AC-23.3.2**: Placeholder text explains auto-analysis option
13. **AC-23.3.3**: Suggested prompts are clickable chips
14. **AC-23.3.4**: Generate button enabled after file upload (prompt optional)

### Report Generation (Story 23.4) - REVISED

15. **AC-23.4.1**: AI generates report title and summary from data + prompt
16. **AC-23.4.2**: Report includes 3-5 key insights with severity indicators
17. **AC-23.4.3**: Without prompt, AI generates best-effort analysis automatically
18. **AC-23.4.4**: Generation shows streaming progress feedback
19. **AC-23.4.5**: Generation completes within 30 seconds

### Charts & Visualization (Story 23.5) - REVISED

20. **AC-23.5.1**: AI recommends appropriate chart types for data
21. **AC-23.5.2**: Bar, line, pie, area charts render with Recharts
22. **AC-23.5.3**: Charts are interactive (hover, click for details)
23. **AC-23.5.4**: Multiple charts supported per report (2-4 typical)
24. **AC-23.5.5**: Charts are responsive on mobile

### Chart Visualization Polish (Story 23.9) - NEW

35. **AC-23.9.1**: Charts use vibrant, accessible color palette (not monochrome)
36. **AC-23.9.2**: Zero/Unknown categories filtered from charts
37. **AC-23.9.3**: Pie charts styled with gradients, proper labels, hover effects
38. **AC-23.9.4**: Bar charts styled with gradients, readable axes, subtle grid
39. **AC-23.9.5**: Tooltips styled consistently with shadcn/ui theme
40. **AC-23.9.6**: Legends responsive and properly styled
41. **AC-23.9.7**: Data table formats values (currency, null="N/A")

### Interactive Data Table (Story 23.6) - NEW

25. **AC-23.6.1**: Data table displays all rows from uploaded file
26. **AC-23.6.2**: Columns are sortable (click header)
27. **AC-23.6.3**: Global filter/search across all columns
28. **AC-23.6.4**: Pagination for large datasets (>100 rows)
29. **AC-23.6.5**: Column-specific filters for numeric/date columns

### Export (Story 23.7) - REVISED

30. **AC-23.7.1**: PDF export includes summary, insights, and charts
31. **AC-23.7.2**: Excel export includes original data + summary sheet
32. **AC-23.7.3**: Export buttons visible in report view
33. **AC-23.7.4**: Download starts immediately (no email required)

---

## Migration Plan

### Database Changes

Since Story 23.1 already created `commission_data_sources`, `commission_records`, and `column_mapping_templates`, we need to:

1. **Keep `commission_data_sources`** - Rename to `report_data_sources` (or keep name, update usage)
2. **Drop `commission_records`** - Not needed for on-demand generation
3. **Drop `column_mapping_templates`** - Not needed without predefined schema
4. **Add new columns**: `parsed_data jsonb`, `expires_at timestamptz`

**Migration Script:**

```sql
-- Migration: Simplify reporting tables for flexible AI reports

-- Add new columns to existing table
ALTER TABLE commission_data_sources
  ADD COLUMN parsed_data jsonb,
  ADD COLUMN parsed_at timestamptz,
  ADD COLUMN expires_at timestamptz DEFAULT now() + interval '24 hours';

-- Rename table (optional - can keep commission_data_sources name)
-- ALTER TABLE commission_data_sources RENAME TO report_data_sources;

-- Drop unused tables
DROP TABLE IF EXISTS commission_records CASCADE;
DROP TABLE IF EXISTS column_mapping_templates CASCADE;

-- Add expiry index for cleanup job
CREATE INDEX idx_commission_sources_expires ON commission_data_sources(expires_at);
```

### Code Changes Required

| File | Change |
|------|--------|
| `src/types/reporting.ts` | Update types per new schema |
| `src/app/(dashboard)/reporting/page.tsx` | Add prompt input, update copy |
| `src/components/reporting/file-uploader.tsx` | Update help text (remove "commission") |
| `src/app/api/reporting/analyze/route.ts` | NEW - Parse and analyze file |
| `src/app/api/reporting/generate/route.ts` | NEW - AI report generation |
| `src/app/api/reporting/export/pdf/route.ts` | NEW - PDF export |
| `src/app/api/reporting/export/excel/route.ts` | NEW - Excel export |
| `src/components/reporting/prompt-input.tsx` | NEW - Prompt text input |
| `src/components/reporting/report-view.tsx` | NEW - Report display |
| `src/components/reporting/report-charts.tsx` | NEW - Chart rendering |
| `src/components/reporting/data-table.tsx` | NEW - Interactive data table |

---

## Dependencies

### Existing (keep)

- `@supabase/supabase-js` - Database, Storage
- `xlsx` - Excel parsing
- `papaparse` - CSV parsing
- `recharts` - Charts
- `react-dropzone` - File upload
- `@tanstack/react-table` - Data tables

### New Required

| Package | Purpose | Version |
|---------|---------|---------|
| `@react-pdf/renderer` | PDF generation | ^3.4.0 |
| `file-saver` | File download | ^2.0.5 |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucination in insights | Misleading reports | Show source data, confidence indicators |
| Large file processing timeout | Failed analysis | Chunked processing, row limits |
| Complex PDF parsing | Poor data extraction | Fall back to text summary |
| High AI costs per report | Budget overrun | Rate limiting, caching analysis |

---

## Test Strategy

### Unit Tests
- File parsing (xlsx, csv, pdf)
- Column type detection
- Chart config generation
- Export formatting

### Integration Tests
- Full upload → analyze → generate flow
- RLS policy enforcement
- AI prompt handling

### E2E Tests
- Upload Excel, generate report, export PDF
- Upload CSV without prompt, verify auto-analysis
- Mobile responsiveness

---

## Story Breakdown (REVISED)

| Story | Title | Points | Dependencies |
|-------|-------|--------|--------------|
| 23.1 | File Upload Infrastructure | ✅ DONE | - |
| 23.2 | Data Analysis Pipeline | 5 | 23.1 |
| 23.3 | Prompt Input UI | 2 | 23.1 |
| 23.4 | AI Report Generation | 8 | 23.2 |
| 23.5 | Charts & Visualization | 5 | 23.4 |
| 23.6 | Interactive Data Table | 3 | 23.4 |
| 23.7 | PDF/Excel Export | 5 | 23.4, 23.5 |
| 23.8 | UI Polish & Testing | 3 | All |
| 23.9 | Chart Visualization Polish | 3 | 23.5 |

**Total: ~34 story points** (vs original ~40 for commission-specific)
