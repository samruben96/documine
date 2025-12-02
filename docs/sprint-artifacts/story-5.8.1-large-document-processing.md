# Story 5.8.1: Large Document Processing Reliability

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.8.1
**Status:** Drafted
**Created:** 2025-12-02
**Prerequisites:** Story 4.8 (Docling Migration)
**Type:** Bug Fix / Technical Debt

---

## User Story

As a **user uploading insurance documents**,
I want **reliable processing of large documents with clear feedback**,
So that **I know what to expect and don't encounter silent failures**.

---

## Background & Context

### Problem Statement

On 2025-12-02, a user uploaded a large PDF (`2025 B&B Proposal(83).pdf` - likely 83 pages) which caused:
- Edge function timeout after 150 seconds (status code 546)
- Document stuck in "processing" status indefinitely
- No user feedback about the failure
- No way to recover without manual database intervention

### Root Cause Analysis

| Component | Issue | Impact |
|-----------|-------|--------|
| **Supabase Edge Function** | Hard limit ~150s execution time | Cannot process large documents |
| **Docling Service** | 150s timeout = no buffer for other operations | Entire pipeline times out |
| **Frontend** | No file size/page limit validation | Users can upload any size |
| **UI** | No progress feedback | Users don't know processing status |
| **Error Recovery** | Document stuck in "processing" | Requires manual DB fix |

### Evidence from Logs

```
Edge Function Log:
- Status: 546 (timeout)
- execution_time_ms: 150,209 (2.5 minutes)
- Document stuck in status: "processing"
```

### Current Architecture Limitations

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE EDGE FUNCTION                      │
│                      (150s max limit)                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Download │→ │  Parse   │→ │  Chunk   │→ │  Embed   │    │
│  │  (~5s)   │  │ (60-300s)│  │  (~5s)   │  │ (10-60s) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                     ↑                                        │
│                     │                                        │
│              BOTTLENECK: Large PDFs                          │
│              with tables can exceed                          │
│              150s in Docling alone                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### AC-5.8.1.1: File Size Validation (Frontend)
**Given** a user uploads a document
**When** the file exceeds the size limit
**Then**:
- Files > 15MB are rejected with clear error message
- Error: "File too large. Maximum size is 15MB."
- Validation happens before upload starts

### AC-5.8.1.2: Page Count Warning
**Given** a user uploads a PDF > 5MB
**When** the upload is initiated
**Then** a warning displays: "Large documents may take 2-5 minutes to process"

### AC-5.8.1.3: Docling Timeout Reduction
**Given** a document is being parsed
**When** Docling is called
**Then**:
- Timeout reduced from 150s to 90s
- Leaves 60s buffer for download + chunking + embedding
- On timeout, clear error message saved to processing_jobs

### AC-5.8.1.4: Graceful Timeout Handling
**Given** the edge function approaches timeout
**When** processing exceeds 120s total
**Then**:
- Document marked as 'failed' (not stuck in 'processing')
- Error message: "Document too large. Try splitting into smaller files."
- User can delete and retry with smaller file

### AC-5.8.1.5: Processing Progress Visibility
**Given** a document is processing
**When** the user views the document list
**Then**:
- Processing stage shown: "Parsing..." / "Generating embeddings..."
- Elapsed time displayed: "Processing (45s...)"
- Or estimated time: "~2 min remaining"

### AC-5.8.1.6: Stale Job Auto-Recovery
**Given** a job is stuck in 'processing' for >10 minutes
**When** any edge function runs
**Then**:
- Job automatically marked as 'failed'
- Document status updated to 'failed'
- Error message: "Processing timed out"
- ✅ Already implemented via `mark_stale_jobs_failed()` RPC

---

## Technical Implementation

### Phase 1: Quick Fixes (P0/P1)

#### 1.1 Frontend File Size Validation

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

#### 1.2 Reduce Docling Timeout

**File:** `supabase/functions/process-document/index.ts`

```typescript
// Change line 372
const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s (was 150s)
```

#### 1.3 Add Total Processing Timeout

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

### Phase 2: Progress Visibility (P2)

#### 2.1 Add Processing Stage to Database

**Migration:** `add_processing_stage_column`

```sql
ALTER TABLE processing_jobs ADD COLUMN stage VARCHAR(50) DEFAULT 'pending';
-- Stages: pending, downloading, parsing, chunking, embedding, completed, failed
```

#### 2.2 Update Edge Function to Report Progress

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

#### 2.3 Update Document Status Component

**File:** `src/components/documents/document-status.tsx`

- Subscribe to `processing_jobs` table changes via Supabase Realtime
- Display current stage
- Show elapsed time

### Phase 3: Long-term Architecture (P3 - Future Epic)

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

## Implementation Tasks

### Task 1: Frontend Validation (P0)
- [ ] Add `MAX_FILE_SIZE_BYTES` constant (15MB)
- [ ] Add `validateFileSize()` function
- [ ] Update `upload-zone.tsx` to validate before upload
- [ ] Show error toast for oversized files
- [ ] Show warning toast for large files (>5MB)
- [ ] Add unit tests

### Task 2: Reduce Timeouts (P1)
- [ ] Reduce Docling timeout from 150s to 90s
- [ ] Add total processing timeout check (120s)
- [ ] Update error messages to be user-friendly
- [ ] Redeploy edge function

### Task 3: Progress Visibility (P2)
- [ ] Add `stage` column to `processing_jobs`
- [ ] Update edge function to report stage progress
- [ ] Add Realtime subscription to document-status component
- [ ] Display stage and elapsed time in UI
- [ ] Add tests

### Task 4: Documentation
- [ ] Update CLAUDE.md with file size limits
- [ ] Add troubleshooting guide for large documents
- [ ] Document recommended document sizes

---

## Test Strategy

### Unit Tests

```typescript
// documents.test.ts
describe('validateFileSize', () => {
  it('rejects files > 15MB', () => {
    const file = new File(['x'.repeat(16 * 1024 * 1024)], 'large.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('15MB');
  });

  it('warns for files > 5MB', () => {
    const file = new File(['x'.repeat(6 * 1024 * 1024)], 'medium.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('2-5 minutes');
  });

  it('accepts files < 5MB without warning', () => {
    const file = new File(['x'.repeat(1 * 1024 * 1024)], 'small.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});
```

### Manual Testing

- [ ] Upload 1MB PDF - should process in <30s
- [ ] Upload 5MB PDF - should show warning, process in 1-2 min
- [ ] Upload 16MB PDF - should be rejected before upload
- [ ] Upload 10MB complex PDF - should either complete or fail gracefully with clear message

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Stuck documents | Occurs | Zero |
| User-visible errors | Generic/none | Clear actionable message |
| Large file rejection | None | Before upload starts |
| Processing feedback | Spinner only | Stage + time |

---

## Rollback Plan

1. **Frontend validation**: Can be disabled by removing check in upload-zone
2. **Timeout changes**: Redeploy previous edge function version
3. **Progress visibility**: Backward compatible (new column, optional UI)

---

## Dependencies

- Supabase Edge Function deployment access
- Vercel deployment for frontend changes

---

## Notes

- The 15MB limit is based on typical insurance document sizes
- Most insurance declarations pages are 2-20 pages, well under 5MB
- Very large documents (100+ pages) should be split by the user
- Future: Consider automatic document splitting in Docling service

---

## Related Issues

- Edge function status 546 timeout on 2025-12-02
- Document `e015b760-d0cf-400d-8ef0-69faffc3045a` required manual DB reset

---

## Definition of Done

- [ ] Files >15MB rejected with clear error
- [ ] Files >5MB show processing warning
- [ ] Docling timeout reduced to 90s
- [ ] Total timeout check added (120s)
- [ ] Failed documents show clear error message
- [ ] No documents stuck in "processing" status
- [ ] Unit tests passing
- [ ] Manual testing complete
- [ ] Edge function redeployed

---

## Change Log

- 2025-12-02: Story created based on production timeout incident
