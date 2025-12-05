# Detailed Design

## Services and Modules

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

## Data Models and Contracts

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

## APIs and Interfaces

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

## Workflows and Sequencing

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
