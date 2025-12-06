# Technical Implementation

## Phase 1: Quick Fixes (P0/P1)

### 1.1 Frontend File Size Validation

**File:** `src/lib/validations/documents.ts`

```typescript
// Add new constants
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const LARGE_FILE_WARNING_THRESHOLD = 5 * 1024 * 1024; // 5MB

// Add new validation
export function validateFileSize(file: File): { valid: boolean; error?: string; warning?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large (${formatBytes(file.size)}). Maximum size is 15MB.`
    };
  }

  if (file.size > LARGE_FILE_WARNING_THRESHOLD) {
    return {
      valid: true,
      warning: 'Large documents may take 2-5 minutes to process.'
    };
  }

  return { valid: true };
}
```

**File:** `src/components/documents/upload-zone.tsx`

- Add validation before `onFilesAccepted`
- Show warning toast for large files
- Block upload for files > 15MB

### 1.2 Reduce Docling Timeout

**File:** `supabase/functions/process-document/index.ts`

```typescript
// Change line 372
const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s (was 150s)
```

### 1.3 Add Total Processing Timeout

**File:** `supabase/functions/process-document/index.ts`

```typescript
// Add at start of processing
const TOTAL_TIMEOUT_MS = 120000; // 120s total budget
const processingStartTime = Date.now();

// Add helper function
function checkTimeout(): void {
  if (Date.now() - processingStartTime > TOTAL_TIMEOUT_MS) {
    throw new Error('Processing timeout: document too large. Try splitting into smaller files.');
  }
}

// Call after each major step
await downloadFromStorage(...);
checkTimeout();

const parseResult = await parseDocumentWithRetry(...);
checkTimeout();

// etc.
```

## Phase 2: Progress Visibility (P2)

### 2.1 Add Processing Stage to Database

**Migration:** `add_processing_stage_column`

```sql
ALTER TABLE processing_jobs ADD COLUMN stage VARCHAR(50) DEFAULT 'pending';
-- Stages: pending, downloading, parsing, chunking, embedding, completed, failed
```

### 2.2 Update Edge Function to Report Progress

```typescript
await updateJobStage(supabase, documentId, 'downloading');
const pdfBuffer = await downloadFromStorage(...);

await updateJobStage(supabase, documentId, 'parsing');
const parseResult = await parseDocumentWithRetry(...);

await updateJobStage(supabase, documentId, 'chunking');
const chunks = chunkMarkdown(...);

await updateJobStage(supabase, documentId, 'embedding');
const embeddings = await generateEmbeddingsWithRetry(...);
```

### 2.3 Update Document Status Component

**File:** `src/components/documents/document-status.tsx`

- Subscribe to `processing_jobs` table changes via Supabase Realtime
- Display current stage
- Show elapsed time

## Phase 3: Long-term Architecture (P3 - Future Epic)

Split into multiple edge functions with intermediate storage:

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  parse-doc     │ →   │  chunk-doc     │ →   │  embed-doc     │
│  (stores md)   │     │ (stores chunks)│     │ (stores vecs)  │
│   90s limit    │     │   30s limit    │     │   60s limit    │
└────────────────┘     └────────────────┘     └────────────────┘
        ↓                      ↓                      ↓
   temp_storage          document_chunks        document_chunks
   (markdown)            (no embeddings)        (with embeddings)
```

This would allow:
- Individual retries per stage
- Progress tracking per stage
- Support for documents of any size
- Better error isolation

---
