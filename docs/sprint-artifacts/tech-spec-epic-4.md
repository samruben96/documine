# Epic Technical Specification: Document Upload & Management

Date: 2025-11-28
Author: Sam
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 delivers the complete document upload and management system for docuMINE - the foundational capability that enables all AI-powered document analysis features. This epic enables users to upload insurance PDFs (policies, quotes, certificates), view their document library, organize files with naming and labels, and ensures documents are properly processed and indexed for natural language querying.

Building on the authentication and agency infrastructure from Epics 1-3, this epic implements the document storage layer using Supabase Storage with agency-scoped RLS policies, the document processing pipeline using Docling for document extraction (migrated from LlamaParse in Story 4.8) and OpenAI for embeddings, and the document management UI following the UX specification's "Invisible Technology" design philosophy.

This is a critical path epic - without document upload and processing, the core value proposition (Document Q&A in Epic 5 and Quote Comparison in Epic 6) cannot function.

## Objectives and Scope

**In Scope:**
- Document upload via drag-and-drop and file picker (PDF only, max 50MB)
- Upload progress indicators with real-time feedback
- Document processing pipeline using Docling for PDF→Markdown extraction (migrated from LlamaParse)
- Text chunking with semantic boundaries (~500 tokens, 50 token overlap)
- OpenAI embeddings generation (text-embedding-3-small, 1536 dimensions)
- Document list view with sidebar navigation (per UX spec)
- Document status tracking (processing, ready, failed)
- Document deletion with cascade cleanup
- Document rename and labeling for organization
- Processing queue management for fair multi-agency handling
- Multi-file upload (up to 5 simultaneous files)
- Real-time status updates via Supabase Realtime

**Out of Scope:**
- Document Q&A chat interface (Epic 5)
- Quote comparison (Epic 6)
- Non-PDF document types (Word, Excel, images) - PDF only for MVP
- OCR for scanned documents (LlamaParse handles this)
- Document versioning (single version per document)
- Folder hierarchies (flat structure with labels for MVP)
- Document sharing between agencies (strict isolation)
- Batch operations (bulk delete, bulk label) - single operations for MVP

## System Architecture Alignment

**Components Referenced:**
- Supabase PostgreSQL with RLS for document metadata storage
- Supabase Storage for PDF file storage (S3-compatible)
- Supabase Edge Functions for background document processing
- Docling service for PDF extraction (self-hosted, ~2.45 pages/sec) - replaces LlamaParse
- OpenAI API for embeddings (text-embedding-3-small)
- pgvector extension for vector similarity search indexing
- Next.js 15 App Router for UI and API routes
- Supabase Realtime for processing status updates

**Architecture Constraints:**
- All documents scoped by `agency_id` via RLS policies
- Storage paths follow pattern: `{agency_id}/{document_id}/{filename}`
- Storage policies mirror database RLS (same agency isolation)
- Edge Function timeout: 150 seconds (Supabase limit) - sufficient for most documents
- Chunking must preserve page numbers for source citation
- Embeddings stored in document_chunks table with vector(1536) type
- IVFFlat index on embeddings for fast similarity search
- Processing jobs table for queue management

**Key Decisions Applied:**
- ADR-001: Supabase-Native for unified storage + database
- ADR-002: Docling for PDF Processing (migrated from LlamaParse per Story 4.8)
- ADR-004: Row Level Security for agency isolation
- UX Principle: Speed is a feature - skeleton loading, not spinners

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Upload Zone | Drag-drop file handling, validation | File objects | Upload progress events | `src/components/documents/upload-zone.tsx` |
| Upload Service | File upload to Supabase Storage | File, agencyId, documentId | Storage path | `src/lib/documents/upload.ts` |
| Document Service | CRUD operations on documents | Document data | Document records | `src/lib/documents/service.ts` |
| Processing Queue | Job creation and status tracking | Document ID | Job status | `src/lib/documents/processing.ts` |
| Docling Client | PDF extraction API calls | PDF content | Markdown text + metadata | `src/lib/docling/client.ts` |
| Chunking Service | Text splitting with semantic boundaries | Markdown text | Chunks with page numbers | `src/lib/documents/chunking.ts` |
| Embeddings Service | OpenAI embedding generation | Text chunks | Vector embeddings | `src/lib/openai/embeddings.ts` |
| Document List | Sidebar document navigation | Agency ID | Document list UI | `src/components/documents/document-list.tsx` |
| Document Viewer | PDF rendering with highlights | Document ID | Rendered PDF | `src/components/documents/document-viewer.tsx` |
| Process Document Edge Function | Background processing orchestration | Document ID | Processed chunks | `supabase/functions/process-document/` |

### Data Models and Contracts

**Existing Tables Used (from Epic 1):**

```sql
-- Documents table (already exists)
-- Structure: id, agency_id, uploaded_by, filename, storage_path, status, page_count, metadata, created_at, updated_at

-- Document chunks table (already exists)
-- Structure: id, document_id, agency_id, content, page_number, chunk_index, bounding_box, embedding vector(1536), created_at

-- Processing jobs table (already exists)
-- Structure: id, document_id, status, error_message, started_at, completed_at, created_at
```

**New Column Additions:**

```sql
-- Add display_name to documents for rename functionality
ALTER TABLE documents ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add labels as JSONB array for tagging
ALTER TABLE documents ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]';

-- Index for label filtering
CREATE INDEX IF NOT EXISTS idx_documents_labels ON documents USING gin(labels);
```

**Labels Table (Optional - Simple Approach):**

```sql
-- For MVP, using JSONB array on documents table
-- Future: Normalize to separate table if needed

-- Agency-level label definitions (for autocomplete/consistency)
CREATE TABLE IF NOT EXISTS document_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#475569', -- Slate default
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, name)
);

ALTER TABLE document_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labels scoped to agency" ON document_labels
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

**TypeScript Types:**

```typescript
// src/types/documents.ts

export interface Document {
  id: string;
  agencyId: string;
  uploadedBy: string;
  filename: string;
  displayName: string | null;
  storagePath: string;
  status: 'processing' | 'ready' | 'failed';
  pageCount: number | null;
  labels: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  agencyId: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  boundingBox: BoundingBox | null;
  embedding: number[]; // 1536 dimensions
  createdAt: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface UploadProgress {
  documentId: string;
  filename: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  error?: string;
}

// Zod Schemas
export const uploadDocumentSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type === 'application/pdf',
    'Only PDF files are supported'
  ).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    'File size must be less than 50MB'
  ),
});

export const renameDocumentSchema = z.object({
  displayName: z.string().min(1).max(255),
});

export const updateLabelsSchema = z.object({
  labels: z.array(z.string().min(1).max(50)).max(10),
});
```

### APIs and Interfaces

**API Routes:**

```typescript
// POST /api/documents - Upload document
// Request: FormData with file
// Response: { data: Document; error: null } | { data: null; error: ApiError }

// GET /api/documents - List documents
// Query params: ?search=term&label=label1
// Response: { data: Document[]; error: null }

// GET /api/documents/[id] - Get document details
// Response: { data: Document & { chunks?: DocumentChunk[] }; error: null }

// DELETE /api/documents/[id] - Delete document
// Response: { data: { deleted: true }; error: null }

// PATCH /api/documents/[id] - Update document (rename, labels)
// Request: { displayName?: string; labels?: string[] }
// Response: { data: Document; error: null }

// GET /api/documents/[id]/url - Get signed URL for PDF viewing
// Response: { data: { url: string; expiresAt: Date }; error: null }
```

**Server Actions:**

```typescript
// src/app/(dashboard)/documents/actions.ts

export async function uploadDocument(formData: FormData): Promise<{
  success: boolean;
  document?: Document;
  error?: string;
}> {
  // 1. Validate file (PDF, <50MB)
  // 2. Generate document ID
  // 3. Upload to Supabase Storage
  // 4. Create document record (status: 'processing')
  // 5. Create processing job
  // 6. Return document for optimistic UI
}

export async function deleteDocument(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify ownership via RLS
  // 2. Delete document record (cascades to chunks, conversations)
  // 3. Delete from Supabase Storage
  // 4. Return success
}

export async function renameDocument(documentId: string, displayName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate displayName (1-255 chars)
  // 2. Update documents.display_name
  // 3. Return success
}

export async function updateDocumentLabels(documentId: string, labels: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate labels (max 10, each max 50 chars)
  // 2. Update documents.labels JSONB
  // 3. Create label definitions if new
  // 4. Return success
}

export async function retryProcessing(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify document status is 'failed'
  // 2. Update status to 'processing'
  // 3. Create new processing job
  // 4. Return success
}
```

**Edge Function (Document Processing):**

```typescript
// supabase/functions/process-document/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ProcessingPayload {
  documentId: string;
  storagePath: string;
  agencyId: string;
}

Deno.serve(async (req: Request) => {
  const { documentId, storagePath, agencyId } = await req.json() as ProcessingPayload;

  try {
    // 1. Download PDF from Supabase Storage
    // 2. Send to LlamaParse API
    // 3. Chunk the extracted markdown
    // 4. Generate embeddings for each chunk
    // 5. Insert chunks into document_chunks table
    // 6. Update document status to 'ready'
    // 7. Update processing job to 'completed'

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Update document status to 'failed'
    // Update processing job with error message
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Workflows and Sequencing

**Document Upload Flow:**

```
User drops file on Upload Zone
    │
    ├─> 1. Client-side validation
    │       - Check file.type === 'application/pdf'
    │       - Check file.size <= 50MB
    │       - If invalid: toast error, abort
    │
    ├─> 2. Generate document ID (UUID)
    │
    ├─> 3. Optimistic UI update
    │       - Show document in list with "Uploading..." status
    │       - Progress bar at 0%
    │
    ├─> 4. Upload to Supabase Storage
    │       - Path: {agency_id}/{document_id}/{filename}
    │       - Track progress via onUploadProgress callback
    │       - Update progress bar in real-time
    │
    ├─> 5. Create document record
    │       INSERT INTO documents (id, agency_id, uploaded_by, filename, storage_path, status)
    │       VALUES ($id, $agencyId, $userId, $filename, $path, 'processing')
    │
    ├─> 6. Create processing job
    │       INSERT INTO processing_jobs (document_id, status)
    │       VALUES ($documentId, 'pending')
    │
    ├─> 7. Trigger Edge Function
    │       - POST to /functions/v1/process-document
    │       - Payload: { documentId, storagePath, agencyId }
    │
    └─> 8. Subscribe to realtime updates
            - Listen for document status changes
            - Update UI when processing completes
```

**Document Processing Pipeline (Edge Function):**

```
Edge Function receives trigger
    │
    ├─> 1. Update job status to 'processing'
    │       UPDATE processing_jobs SET status = 'processing', started_at = now()
    │
    ├─> 2. Download PDF from Storage
    │       - Use service role key
    │       - Stream into memory (max 50MB)
    │
    ├─> 3. Send to LlamaParse API
    │       POST https://api.cloud.llamaindex.ai/api/parsing/upload
    │       - Multipart form with PDF
    │       - Headers: Authorization: Bearer {LLAMA_CLOUD_API_KEY}
    │       - Wait for parsing (typically ~6 seconds)
    │       - Returns: markdown text with page markers
    │
    ├─> 4. Parse LlamaParse response
    │       - Extract markdown content
    │       - Identify page boundaries (--- PAGE X ---)
    │       - Extract bounding boxes if available
    │
    ├─> 5. Chunk the content
    │       - Semantic chunking by paragraph/section
    │       - Target: ~500 tokens per chunk
    │       - Overlap: 50 tokens between chunks
    │       - Preserve page number for each chunk
    │       - Store bounding box if available
    │
    ├─> 6. Generate embeddings (batched)
    │       POST https://api.openai.com/v1/embeddings
    │       - Model: text-embedding-3-small
    │       - Batch up to 20 chunks per request
    │       - Returns: 1536-dimension vectors
    │
    ├─> 7. Store chunks in database
    │       INSERT INTO document_chunks
    │       (document_id, agency_id, content, page_number, chunk_index, bounding_box, embedding)
    │       VALUES (batch of chunks)
    │
    ├─> 8. Update document status
    │       UPDATE documents SET status = 'ready', page_count = $pageCount, updated_at = now()
    │
    └─> 9. Complete processing job
            UPDATE processing_jobs SET status = 'completed', completed_at = now()
```

**Document Deletion Flow:**

```
User clicks Delete on document
    │
    ├─> 1. Confirmation modal
    │       "Delete {filename}?"
    │       "This will permanently delete the document and all conversations."
    │
    ├─> 2. User confirms
    │
    ├─> 3. Delete document record
    │       DELETE FROM documents WHERE id = $documentId
    │       - CASCADE deletes: document_chunks, conversations, chat_messages
    │
    ├─> 4. Delete from Storage
    │       supabase.storage.from('documents').remove([storagePath])
    │       - If storage delete fails, log error but don't block
    │
    ├─> 5. Update UI
    │       - Remove document from list
    │       - If viewing deleted doc, navigate to /documents
    │       - Success toast: "Document deleted"
    │
    └─> 6. Handle failures
            - Database error: rollback, show error toast
            - Storage error: log, continue (orphaned file acceptable)
```

**Processing Queue Management:**

```
Processing job created
    │
    ├─> Queue processor checks for pending jobs
    │   SELECT * FROM processing_jobs
    │   WHERE status = 'pending'
    │   ORDER BY created_at ASC
    │   LIMIT 1
    │   FOR UPDATE SKIP LOCKED
    │
    ├─> Concurrency control
    │   - One job per agency at a time
    │   - Cross-agency jobs can run in parallel
    │   - Check: SELECT COUNT(*) FROM processing_jobs
    │            WHERE agency_id = $agency AND status = 'processing'
    │
    ├─> Stale job detection (scheduled)
    │   - Jobs 'processing' for > 10 minutes without update
    │   - Mark as 'failed' with timeout error
    │   - Can be retried manually
    │
    └─> Rate limiting
        - Max 10 documents per agency per hour
        - Check before creating job
        - If exceeded: reject upload with error message
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Document upload (< 50MB) | < 30 seconds | Direct upload to Supabase Storage with progress tracking | NFR1 |
| Document processing | < 2 minutes | LlamaParse ~6s + chunking ~5s + embeddings ~30s + DB writes | NFR2 |
| Document list load | < 500ms | Single query with agency_id filter, indexed | General |
| File picker response | < 100ms | Client-side file selection, no server round-trip | UX |
| Realtime status update | < 1 second | Supabase Realtime subscription on documents table | General |
| Signed URL generation | < 200ms | Supabase Storage API, 1-hour expiry | General |
| Search/filter documents | < 500ms | PostgreSQL ILIKE + GIN index on labels | General |

**Performance Optimizations:**
- Parallel uploads for multi-file (up to 5 concurrent)
- Batch embedding generation (20 chunks per API call)
- IVFFlat index on embeddings for O(log n) similarity search
- Skeleton loading states per UX spec (no spinners > 200ms)
- Optimistic UI updates for immediate feedback

### Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data encrypted in transit | TLS 1.3 via Supabase/Vercel | NFR6 |
| Data encrypted at rest | AES-256 via Supabase managed | NFR7 |
| Agency isolation - database | RLS policies on documents, document_chunks, processing_jobs | NFR10 |
| Agency isolation - storage | Storage policies using agency_id path prefix | NFR10 |
| Signed URLs for file access | 1-hour expiry, agency-scoped | NFR11 |
| File type validation | Server-side MIME type check, not just extension | Security best practice |
| File size limits | 50MB max enforced client + server side | NFR1 |
| API key protection | LLAMA_CLOUD_API_KEY, OPENAI_API_KEY server-side only | Security best practice |
| Service role key | Used only in Edge Functions, never client-exposed | Supabase docs |

**Storage Security Policies:**

```sql
-- Storage bucket: documents
-- Path structure: {agency_id}/{document_id}/{filename}

-- Users can upload to their agency folder only
CREATE POLICY "Upload to agency folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );

-- Users can read from their agency folder only
CREATE POLICY "Read from agency folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );

-- Users can delete from their agency folder only
CREATE POLICY "Delete from agency folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );
```

### Reliability/Availability

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Upload reliability | 99.9% | Supabase Storage SLA, retry on failure | NFR22 |
| Processing reliability | 95%+ success rate | Retry once on LlamaParse failure, manual retry option | General |
| No data loss | Zero document loss | Storage + DB replication via Supabase | NFR22 |
| Graceful degradation | Processing queue backlog | Queue pending status visible, no blocking | NFR21 |
| Edge Function timeout | 150 seconds | Sufficient for most documents, large docs may timeout | Supabase limit |

**Error Recovery:**

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Upload failure | HTTP error from Storage API | Client retry with exponential backoff (3 attempts) |
| LlamaParse failure | API error response | Retry once automatically, then mark failed |
| LlamaParse timeout | No response in 60s | Mark failed, allow manual retry |
| OpenAI embedding failure | API error response | Retry with exponential backoff (3 attempts) |
| Edge Function timeout | 150s limit exceeded | Mark failed, log partial progress |
| Database write failure | PostgreSQL error | Rollback transaction, mark failed |
| Storage delete failure | API error on cleanup | Log error, continue (orphaned file acceptable) |

### Observability

| Signal | Type | Implementation |
|--------|------|----------------|
| Document uploaded | Event log | `log.info('Document uploaded', { documentId, agencyId, filename, size })` |
| Processing started | Event log | `log.info('Processing started', { documentId, jobId })` |
| Processing completed | Event log | `log.info('Processing completed', { documentId, duration, chunkCount, pageCount })` |
| Processing failed | Error log | `log.error('Processing failed', error, { documentId, step, duration })` |
| LlamaParse latency | Metric | Track API call duration |
| OpenAI embeddings latency | Metric | Track API call duration per batch |
| Queue depth | Metric | Count of pending jobs per agency |
| Storage usage | Metric | Track bytes uploaded per agency |

**Structured Logging Format:**

```typescript
// All logs follow this format
{
  level: 'info' | 'warn' | 'error',
  message: string,
  timestamp: string, // ISO 8601
  documentId?: string,
  agencyId?: string,
  jobId?: string,
  duration?: number, // milliseconds
  error?: string,
  stack?: string,
  ...additionalContext
}
```

**Key Metrics to Track:**
- Documents uploaded per day/agency
- Processing success rate
- Average processing time by document size
- LlamaParse API latency (p50, p95, p99)
- OpenAI API latency (p50, p95, p99)
- Queue wait time (time from pending to processing)
- Storage usage by agency

## Dependencies and Integrations

### NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database + Storage + Realtime |
| @supabase/ssr | ^0.7.0 | Server-side Supabase client |
| openai | ^6.9.1 | Embeddings generation |
| zod | ^4.1.13 | Validation (use `.issues` not `.errors`) |
| react-hook-form | ^7.66.1 | Form handling |
| @hookform/resolvers | ^5.2.2 | Zod resolver for react-hook-form |
| sonner | ^2.0.7 | Toast notifications |
| lucide-react | ^0.554.0 | Icons |

### New Dependencies Required

| Package | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| react-dropzone | ^14.3.5 | Drag-and-drop file upload zone | `npm install react-dropzone` |
| react-pdf | ^9.2.1 | PDF rendering in document viewer | `npm install react-pdf` |
| pdfjs-dist | ^4.10.38 | PDF.js worker for react-pdf | `npm install pdfjs-dist` |

**Installation Command:**
```bash
npm install react-dropzone react-pdf pdfjs-dist
```

**Note:** LlamaParse is called via REST API from Edge Function (no npm package needed for Deno runtime).

### External Services

| Service | Purpose | API Documentation |
|---------|---------|-------------------|
| Docling (Self-hosted) | PDF/DOCX/XLSX extraction with 97.9% table accuracy | https://github.com/docling-project/docling |
| ~~LlamaParse (LlamaIndex Cloud)~~ | ~~PDF extraction~~ (DEPRECATED - replaced by Docling) | ~~https://docs.cloud.llamaindex.ai/~~ |
| OpenAI Embeddings | text-embedding-3-small (1536 dim) | https://platform.openai.com/docs/guides/embeddings |
| Supabase Storage | S3-compatible file storage | https://supabase.com/docs/guides/storage |
| Supabase Realtime | Live status updates | https://supabase.com/docs/guides/realtime |

### Environment Variables

**Already Configured (from Epic 1):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**New for Epic 4 (Post Story 4.8 Migration):**
```bash
# DEPRECATED: LLAMA_CLOUD_API_KEY=llx-...  # Replaced by Docling
DOCLING_SERVICE_URL=http://localhost:8000  # Local development
# DOCLING_SERVICE_URL=https://docling.your-domain.com  # Production
```

**Edge Function Environment:**
```bash
# Set in Supabase Dashboard > Edge Functions > Secrets
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=https://docling.your-domain.com  # Docling service URL
# DEPRECATED: LLAMA_CLOUD_API_KEY (removed after Story 4.8)
```

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Upload Zone  │  │ Document List│  │   Document Viewer     │  │
│  │ (react-drop) │  │              │  │   (react-pdf)         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Storage  │  │ Database │  │ Realtime │  │ Edge Functions │   │
│  │ (PDFs)   │  │ +pgvector│  │ (status) │  │ (processing)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────┬────────┘   │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
          ┌──────────────────────────────────────────┼───────┐
          │                                          │       │
          ▼                                          ▼       ▼
┌─────────────────────┐                    ┌─────────────────────┐
│    Docling Service  │                    │      OpenAI         │
│    (Self-hosted)    │                    │   (Embeddings)      │
│    PDF/DOCX/XLSX    │                    │   text-embedding-   │
│    → Markdown       │                    │   3-small           │
│    ~2.45 pages/sec  │                    │                     │
└─────────────────────┘                    └─────────────────────┘
```

### Database Migrations Required

```sql
-- Migration: add_document_organization_fields
-- File: supabase/migrations/XXXXXX_add_document_organization.sql

-- Add display_name for rename functionality
ALTER TABLE documents ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add labels as JSONB array for tagging
ALTER TABLE documents ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]';

-- Add GIN index for label filtering
CREATE INDEX IF NOT EXISTS idx_documents_labels ON documents USING gin(labels);

-- Optional: Agency-level label definitions for autocomplete
CREATE TABLE IF NOT EXISTS document_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#475569',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, name)
);

ALTER TABLE document_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labels scoped to agency" ON document_labels
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

### Supabase Edge Function Deployment

```bash
# Deploy document processing Edge Function
npx supabase functions deploy process-document --project-ref <project-ref>

# Set secrets for Edge Function
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref <project-ref>
npx supabase secrets set LLAMA_CLOUD_API_KEY=llx-... --project-ref <project-ref>
```

## Acceptance Criteria (Authoritative)

### Story 4.1: Document Upload Zone

1. **AC-4.1.1:** Upload zone displays dashed border with "Drop a document here or click to upload" text
2. **AC-4.1.2:** Drag hover state shows border color change (#475569) and background highlight
3. **AC-4.1.3:** Click on zone opens native file picker filtered to PDF files
4. **AC-4.1.4:** Drag-and-drop accepts PDF files and rejects other file types with toast: "Only PDF files are supported"
5. **AC-4.1.5:** Files over 50MB are rejected with toast: "File too large. Maximum size is 50MB"
6. **AC-4.1.6:** Multiple files (up to 5) can be uploaded simultaneously
7. **AC-4.1.7:** Uploaded file is stored at path `{agency_id}/{document_id}/{filename}` in Supabase Storage
8. **AC-4.1.8:** Document record created with status='processing' immediately after upload

### Story 4.2: Upload Progress & Status Feedback

9. **AC-4.2.1:** Upload progress bar shows 0-100% during file upload to storage
10. **AC-4.2.2:** Filename is displayed alongside progress bar
11. **AC-4.2.3:** "Cancel" option available during upload (removes from queue)
12. **AC-4.2.4:** Status changes to "Analyzing..." with shimmer animation when upload completes
13. **AC-4.2.5:** Status shows "Ready" with checkmark when processing completes
14. **AC-4.2.6:** Success toast appears: "{filename} is ready"
15. **AC-4.2.7:** Failed status shows error icon with "Retry" and "Delete" options
16. **AC-4.2.8:** Processing status persists across page navigation (realtime subscription)

### Story 4.3: Document List View

17. **AC-4.3.1:** Documents displayed in sidebar list with icon + filename + upload date
18. **AC-4.3.2:** Upload date shows relative format ("2 hours ago", "Yesterday", "Nov 20")
19. **AC-4.3.3:** Status indicator visible: Ready (✓), Processing (⟳), Failed (✗)
20. **AC-4.3.4:** List sorted by most recently uploaded first
21. **AC-4.3.5:** List is scrollable when documents exceed viewport
22. **AC-4.3.6:** Search input filters documents by filename match
23. **AC-4.3.7:** Clicking document opens split view (document + chat panel)
24. **AC-4.3.8:** Selected document shows left border accent and darker background
25. **AC-4.3.9:** Empty state shows centered upload zone with "Upload your first document to get started"
26. **AC-4.3.10:** Sidebar width is 240px on desktop, collapsible on tablet, hidden on mobile

### Story 4.4: Delete Documents

27. **AC-4.4.1:** Delete action available via trash icon or context menu
28. **AC-4.4.2:** Confirmation modal displays: "Delete {filename}?"
29. **AC-4.4.3:** Modal body text: "This will permanently delete the document and all conversations about it. This cannot be undone."
30. **AC-4.4.4:** "Cancel" and "Delete" buttons in modal (Delete is destructive red)
31. **AC-4.4.5:** On confirm: document record deleted (cascades to chunks, conversations)
32. **AC-4.4.6:** On confirm: file deleted from Supabase Storage
33. **AC-4.4.7:** Success toast: "Document deleted"
34. **AC-4.4.8:** If viewing deleted document, navigate to /documents

### Story 4.5: Document Organization (Rename/Label)

35. **AC-4.5.1:** Rename action available via edit icon or context menu
36. **AC-4.5.2:** Inline edit: filename becomes editable text field
37. **AC-4.5.3:** Enter to save, Escape to cancel rename
38. **AC-4.5.4:** Rename validation: 1-255 characters, no path separators
39. **AC-4.5.5:** "+ Add label" action available on document
40. **AC-4.5.6:** Label input with autocomplete from existing agency labels
41. **AC-4.5.7:** Labels displayed as small pills below filename
42. **AC-4.5.8:** Click X on label pill to remove label
43. **AC-4.5.9:** Maximum 10 labels per document
44. **AC-4.5.10:** Label dropdown in sidebar filters document list by selected label

### Story 4.6: Document Processing Pipeline (LlamaParse)

45. **AC-4.6.1:** PDF sent to LlamaParse API for extraction
46. **AC-4.6.2:** LlamaParse returns markdown with preserved tables and page numbers
47. **AC-4.6.3:** Text chunked at ~500 tokens with 50 token overlap
48. **AC-4.6.4:** Each chunk tagged with page_number and chunk_index
49. **AC-4.6.5:** Bounding box stored when available from LlamaParse
50. **AC-4.6.6:** Embeddings generated via OpenAI text-embedding-3-small (1536 dimensions)
51. **AC-4.6.7:** Chunks stored in document_chunks table with embeddings
52. **AC-4.6.8:** Document status updated to 'ready' on success
53. **AC-4.6.9:** Document page_count stored in metadata
54. **AC-4.6.10:** LlamaParse failure retried once, then marked 'failed' with error message
55. **AC-4.6.11:** Processing time logged for observability

### Story 4.7: Processing Queue Management

56. **AC-4.7.1:** Processing jobs processed in FIFO order per agency
57. **AC-4.7.2:** One active processing job per agency at a time
58. **AC-4.7.3:** Cross-agency jobs can run in parallel
59. **AC-4.7.4:** Queued documents show "Processing... (X documents ahead)"
60. **AC-4.7.5:** Stale jobs (>10 minutes without update) marked as failed
61. **AC-4.7.6:** Failed jobs can be retried manually via "Retry" button
62. **AC-4.7.7:** Rate limit: max 10 documents per agency per hour
63. **AC-4.7.8:** Rate limit exceeded shows toast: "Upload limit reached. Please try again later."

### Story 4.8: Migrate Document Processing to Docling

**Background:** Story 4.8 was added post-Epic 4 completion (2025-11-30) based on LlamaParse issues discovered during Epic 5 development. Research showed Docling provides 97.9% table accuracy vs 75% for LlamaParse, eliminates API costs, and provides self-hosted data control.

64. **AC-4.8.1:** Docling runs as a self-hosted Python microservice with REST API endpoint accepting PDF/DOCX/XLSX/image files
65. **AC-4.8.2:** Supports PDF, DOCX, XLSX, and image files (PNG, JPEG, TIFF) with markdown output
66. **AC-4.8.3:** Output includes page markers (`--- PAGE X ---`) compatible with existing chunking service
67. **AC-4.8.4:** Edge Function calls Docling service instead of LlamaParse with same retry logic (2 attempts)
68. **AC-4.8.5:** `src/lib/llamaparse/client.ts` replaced with `src/lib/docling/client.ts` maintaining same interface
69. **AC-4.8.6:** Complex tables with merged cells and borderless tables extracted correctly
70. **AC-4.8.7:** Docker Compose configuration for local development, production deployment documented
71. **AC-4.8.8:** Logging, error handling, and retry logic maintained from LlamaParse implementation
72. **AC-4.8.9:** Existing document_chunks table structure unchanged, no database migration required
73. **AC-4.8.10:** Unit tests for Docling client, integration test with sample PDF, build passes

## Traceability Mapping

| AC | FR | Spec Section | Component(s)/API(s) | Test Idea |
|----|-----|--------------|---------------------|-----------|
| AC-4.1.1 | FR8 | Upload Zone | `upload-zone.tsx` | Verify default UI state |
| AC-4.1.2 | FR8 | Upload Zone | `upload-zone.tsx` | Drag file over, verify hover state |
| AC-4.1.3 | FR8 | Upload Zone | `upload-zone.tsx` + react-dropzone | Click zone, verify file picker opens |
| AC-4.1.4 | FR8 | Upload Zone | `upload-zone.tsx` | Drop .docx file, verify rejection toast |
| AC-4.1.5 | FR8 | Upload Zone | `upload-zone.tsx` | Upload 60MB PDF, verify rejection |
| AC-4.1.6 | FR8 | Upload Zone | `upload-zone.tsx` | Drop 5 PDFs, verify parallel upload |
| AC-4.1.7 | FR8, FR27 | Upload Service | `upload.ts` + Supabase Storage | Verify storage path format |
| AC-4.1.8 | FR8 | Upload Service | `documents` table | Verify record created with processing status |
| AC-4.2.1 | FR8 | Progress Feedback | `upload-zone.tsx` | Upload large file, verify progress bar |
| AC-4.2.2 | FR8 | Progress Feedback | `upload-zone.tsx` | Verify filename displays during upload |
| AC-4.2.3 | FR8 | Progress Feedback | `upload-zone.tsx` | Click cancel during upload |
| AC-4.2.4 | FR12 | Progress Feedback | `upload-zone.tsx` | Verify shimmer after upload completes |
| AC-4.2.5 | FR12 | Progress Feedback | `document-list.tsx` | Verify checkmark on ready status |
| AC-4.2.6 | FR12 | Progress Feedback | Toast notification | Verify success toast message |
| AC-4.2.7 | FR34 | Progress Feedback | `document-list.tsx` | Fail processing, verify error UI |
| AC-4.2.8 | FR12 | Progress Feedback | Supabase Realtime | Navigate away, return, verify status persists |
| AC-4.3.1 | FR9 | Document List | `document-list.tsx` | Verify list item structure |
| AC-4.3.2 | FR9 | Document List | `document-list.tsx` | Upload doc, verify relative date |
| AC-4.3.3 | FR9 | Document List | `document-list.tsx` | Verify status icons display |
| AC-4.3.4 | FR9 | Document List | `document-list.tsx` | Upload 3 docs, verify sort order |
| AC-4.3.5 | FR9 | Document List | `document-list.tsx` | Upload 20 docs, verify scroll |
| AC-4.3.6 | FR9 | Document List | `document-list.tsx` | Type in search, verify filter |
| AC-4.3.7 | FR9 | Document List | `/documents/[id]/page.tsx` | Click doc, verify split view |
| AC-4.3.8 | FR9 | Document List | `document-list.tsx` | Click doc, verify selected style |
| AC-4.3.9 | FR9 | Document List | `/documents/page.tsx` | New user, verify empty state |
| AC-4.3.10 | FR32 | Document List | `sidebar.tsx` | Test at different viewport widths |
| AC-4.4.1 | FR10 | Delete Document | `document-list.tsx` | Verify delete action exists |
| AC-4.4.2 | FR10 | Delete Document | Confirmation modal | Click delete, verify modal text |
| AC-4.4.3 | FR10 | Delete Document | Confirmation modal | Verify body text |
| AC-4.4.4 | FR10 | Delete Document | Confirmation modal | Verify button styling |
| AC-4.4.5 | FR10 | Delete Document | `deleteDocument()` | Delete doc, verify DB cascade |
| AC-4.4.6 | FR10 | Delete Document | `deleteDocument()` | Delete doc, verify storage cleanup |
| AC-4.4.7 | FR10 | Delete Document | Toast notification | Verify success message |
| AC-4.4.8 | FR10 | Delete Document | Navigation | Delete viewed doc, verify redirect |
| AC-4.5.1 | FR11 | Rename Document | `document-list.tsx` | Verify rename action exists |
| AC-4.5.2 | FR11 | Rename Document | `document-list.tsx` | Click rename, verify inline edit |
| AC-4.5.3 | FR11 | Rename Document | `document-list.tsx` | Press Enter, press Escape |
| AC-4.5.4 | FR11 | Rename Document | Zod schema | Try invalid names |
| AC-4.5.5 | FR11 | Labels | `document-list.tsx` | Verify add label action |
| AC-4.5.6 | FR11 | Labels | Label input | Type label, verify autocomplete |
| AC-4.5.7 | FR11 | Labels | `document-list.tsx` | Add labels, verify pill display |
| AC-4.5.8 | FR11 | Labels | `document-list.tsx` | Click X on pill, verify removal |
| AC-4.5.9 | FR11 | Labels | Validation | Try adding 11th label |
| AC-4.5.10 | FR11 | Labels | `sidebar.tsx` | Select label, verify filter |
| AC-4.6.1 | FR12 | Processing Pipeline | Edge Function | Verify LlamaParse API call |
| AC-4.6.2 | FR12 | Processing Pipeline | Edge Function | Verify markdown output with tables |
| AC-4.6.3 | FR12 | Processing Pipeline | `chunking.ts` | Unit test chunking logic |
| AC-4.6.4 | FR12 | Processing Pipeline | `document_chunks` table | Verify page_number, chunk_index |
| AC-4.6.5 | FR12 | Processing Pipeline | `document_chunks` table | Verify bounding_box when present |
| AC-4.6.6 | FR12 | Processing Pipeline | Edge Function | Verify OpenAI embeddings call |
| AC-4.6.7 | FR12 | Processing Pipeline | `document_chunks` table | Verify chunks inserted |
| AC-4.6.8 | FR12 | Processing Pipeline | `documents` table | Verify status = 'ready' |
| AC-4.6.9 | FR12 | Processing Pipeline | `documents` table | Verify page_count stored |
| AC-4.6.10 | FR12 | Processing Pipeline | Edge Function | Mock LlamaParse failure, verify retry |
| AC-4.6.11 | FR12 | Processing Pipeline | Logs | Verify duration logged |
| AC-4.7.1 | FR33 | Queue Management | `processing_jobs` table | Verify FIFO ordering |
| AC-4.7.2 | FR33 | Queue Management | Edge Function | Upload 2 docs same agency, verify sequential |
| AC-4.7.3 | FR33 | Queue Management | Edge Function | Upload to 2 agencies, verify parallel |
| AC-4.7.4 | FR33 | Queue Management | `document-list.tsx` | Queue 3 docs, verify queue position display |
| AC-4.7.5 | FR33 | Queue Management | Scheduled function | Mock stale job, verify failure |
| AC-4.7.6 | FR33 | Queue Management | `document-list.tsx` | Failed doc, click Retry |
| AC-4.7.7 | FR33 | Queue Management | `uploadDocument()` | Upload 11 docs in hour, verify limit |
| AC-4.7.8 | FR33 | Queue Management | Toast notification | Verify rate limit message |
| AC-4.8.1 | FR12 | Docling Migration | `docling-service/` | Verify REST API responds to /parse endpoint |
| AC-4.8.2 | FR12 | Docling Migration | `docling-service/` | Upload PDF/DOCX/XLSX/image, verify markdown output |
| AC-4.8.3 | FR12 | Docling Migration | `docling-service/` | Verify page markers in output |
| AC-4.8.4 | FR12 | Docling Migration | Edge Function | Verify Edge Function calls Docling service |
| AC-4.8.5 | FR12 | Docling Migration | `src/lib/docling/client.ts` | Unit test client interface compatibility |
| AC-4.8.6 | FR12 | Docling Migration | `docling-service/` | Test complex table extraction |
| AC-4.8.7 | FR12 | Docling Migration | `docker-compose.yml` | Run docker-compose up, verify service starts |
| AC-4.8.8 | FR12 | Docling Migration | Edge Function | Verify logging and retry on failure |
| AC-4.8.9 | FR12 | Docling Migration | `document_chunks` table | Verify no schema changes needed |
| AC-4.8.10 | FR12 | Docling Migration | Vitest | All tests pass, build succeeds |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R1 | ~~LlamaParse API rate limits or outages~~ (Mitigated by Docling migration) | ~~Processing blocked~~ | ~~Medium~~ | Self-hosted Docling eliminates external API dependency |
| R2 | Large PDFs exceed Edge Function 150s timeout | Failed processing for large docs | Medium | Warn users about large file processing time, split processing if needed |
| R3 | OpenAI API rate limits during batch embeddings | Partial processing failure | Low | Exponential backoff, smaller batch sizes, retry on 429 |
| R4 | Supabase Storage 50MB limit too restrictive | Users can't upload large policies | Low | Accept for MVP, can increase limit in Supabase dashboard |
| R5 | Vector index performance with many documents | Slow similarity search | Low | IVFFlat index handles 100K+ vectors, monitor and tune lists parameter |
| R6 | ~~LlamaParse table extraction quality varies~~ (Mitigated) | ~~Poor extraction~~ | ~~Medium~~ | Docling provides 97.9% table accuracy vs 75% LlamaParse |
| R9 | Docling service resource requirements | Higher infra costs | Low | Start CPU-only, add GPU only if needed for performance |
| R10 | Docling service deployment complexity | Setup challenges | Medium | Docker containerization simplifies environment, Railway/Fly.io options documented |
| R7 | Processing queue starvation for high-volume agencies | Long wait times | Low | Monitor queue depth, consider priority lanes post-MVP |
| R8 | PDF.js worker loading performance | Slow initial document render | Medium | Lazy load worker, show skeleton while loading |

### Assumptions

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | All uploaded documents are PDFs | MVP scope - most insurance docs are PDF |
| A2 | 50MB file size limit is sufficient for insurance documents | Typical policies are 1-20MB |
| A3 | ~500 token chunks provide good RAG retrieval | Industry standard, can tune later |
| A4 | LlamaParse handles scanned PDFs via built-in OCR | LlamaParse advertises OCR support |
| A5 | 1-hour signed URL expiry is sufficient for viewing session | Users rarely view for >1 hour continuously |
| A6 | JSONB labels array is sufficient vs normalized table | Simpler for MVP, can normalize later |
| A7 | One processing job per agency is fair | Prevents single agency from monopolizing |
| A8 | 10 documents/hour rate limit is reasonable | Prevents abuse while allowing normal usage |
| A9 | text-embedding-3-small (1536 dim) is sufficient quality | Good balance of quality vs cost/speed |

### Open Questions

| ID | Question | Owner | Status | Decision |
|----|----------|-------|--------|----------|
| Q1 | Should we show document preview thumbnails in list? | Sam | Decided | No for MVP - adds complexity, use file icon |
| Q2 | Should labels have colors? | Sam | Decided | Default slate color for MVP, color picker later |
| Q3 | What happens to in-progress uploads on page close? | Sam | Decided | Lost - warn user before leaving page |
| Q4 | Should we support document versioning? | Sam | Decided | No for MVP - re-upload replaces |
| Q5 | How to handle password-protected PDFs? | Sam | Open | TBD - likely reject with error message |
| Q6 | Should we pre-extract on upload or lazy extract on first query? | Sam | Decided | Pre-extract on upload for consistent UX |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | Chunking logic, validation schemas, utility functions | Vitest | 80%+ for core logic |
| Integration | Upload flow, processing pipeline, CRUD operations | Vitest + Supabase local | All server actions |
| Component | Upload zone, document list, status indicators | Vitest + Testing Library | Key user interactions |
| E2E | Full upload-to-ready journey | Manual for MVP, Playwright later | Critical paths |

### Key Test Scenarios

**Upload Zone:**
- Valid PDF uploads successfully
- Invalid file type rejected with correct message
- Oversized file rejected with correct message
- Multiple files upload in parallel
- Progress bar updates during upload
- Cancel aborts upload

**Document List:**
- Documents load and display correctly
- Search filters by filename
- Label filter shows matching documents
- Sort order is newest first
- Selected document highlights correctly
- Empty state displays for new users

**Document Processing:**
- LlamaParse receives PDF and returns markdown
- Chunking produces correct token sizes with overlap
- Embeddings generated for all chunks
- Status updates to 'ready' on success
- Status updates to 'failed' on error with message
- Retry creates new processing job

**Delete:**
- Confirmation modal displays correctly
- Delete removes document from DB
- Delete removes file from storage
- Cascade deletes chunks and conversations
- Navigation after deleting viewed document

**Labels/Rename:**
- Inline rename works with Enter/Escape
- Validation rejects invalid names
- Labels add/remove correctly
- Autocomplete shows existing labels
- Max 10 labels enforced

**Queue Management:**
- FIFO ordering respected
- One job per agency at a time
- Cross-agency parallelism works
- Stale job detection marks failed
- Rate limiting enforced

### Test Data

```typescript
// Test fixtures
const testPdf = new File(['%PDF-1.4...'], 'test-policy.pdf', { type: 'application/pdf' });
const testDocx = new File(['...'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
const largePdf = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

const mockDocument: Document = {
  id: 'doc-123',
  agencyId: 'agency-456',
  uploadedBy: 'user-789',
  filename: 'test-policy.pdf',
  displayName: null,
  storagePath: 'agency-456/doc-123/test-policy.pdf',
  status: 'ready',
  pageCount: 10,
  labels: ['auto', 'renewal'],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| Supabase Storage | Mock upload/download responses |
| Supabase Database | Supabase local for integration, mock for unit |
| Supabase Realtime | Mock subscription callbacks |
| LlamaParse API | MSW or manual mock responses |
| OpenAI Embeddings | Mock fixed 1536-dim vectors |
| Edge Functions | Test locally with Supabase CLI |

## Definition of Done

### Story-Level DoD

- [ ] All acceptance criteria verified and passing
- [ ] TypeScript compiles without errors (`npm run build` succeeds)
- [ ] Unit tests written for new utility functions (Vitest)
- [ ] Integration tests for server actions
- [ ] Component tests for user interactions
- [ ] No console errors in browser during manual testing
- [ ] Responsive design verified at desktop, tablet, mobile breakpoints
- [ ] Loading states use skeleton/shimmer (no spinners > 200ms)
- [ ] Error states display user-friendly messages
- [ ] Code reviewed and approved
- [ ] Merged to main branch

### Epic-Level DoD

- [ ] All 8 stories complete and passing DoD (7 original + Story 4.8)
- [ ] All 73 acceptance criteria verified (63 original + 10 from Story 4.8)
- [ ] Database migration applied successfully
- [ ] Edge Function deployed and tested
- [ ] New environment variable (DOCLING_SERVICE_URL) documented and set
- [ ] Docling service deployed and accessible (local or production)
- [ ] New dependencies installed (react-dropzone, react-pdf, pdfjs-dist)
- [ ] Storage bucket configured with RLS policies
- [ ] End-to-end upload-to-ready flow tested with real PDF
- [ ] Cross-agency isolation verified (cannot see other agency docs)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] Documentation updated if needed
- [ ] Sprint status updated to reflect epic completion

### FR Coverage Verification

| FR | Description | Stories | Status |
|----|-------------|---------|--------|
| FR8 | Upload PDF documents | 4.1, 4.2 | ◯ |
| FR9 | View document list | 4.3 | ◯ |
| FR10 | Delete documents | 4.4 | ◯ |
| FR11 | Organize/label documents | 4.5 | ◯ |
| FR12 | Process and index documents | 4.6, 4.7, **4.8** | ◯ |
| FR27 | Isolated agency data | 4.1 (storage path) | ◯ |
| FR33 | Processing queue | 4.7 | ◯ |

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-11-28_
_Updated: 2025-11-30 (Story 4.8 - Docling Migration added)_
