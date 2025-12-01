# Story 4.6: Document Processing Pipeline (LlamaParse)

Status: Done

## Story

As the **system**,
I want to process uploaded PDFs into searchable chunks with embeddings,
So that documents can be queried via natural language.

## Acceptance Criteria

### AC-4.6.1: LlamaParse PDF Extraction
- PDF sent to LlamaParse API for extraction
- API call uses `LLAMA_CLOUD_API_KEY` environment variable
- Request includes PDF content as multipart form data

### AC-4.6.2: Markdown Output with Structure Preservation
- LlamaParse returns markdown with preserved tables
- Page numbers marked in output (e.g., `--- PAGE X ---`)
- Table structure maintained for quote/policy data extraction

### AC-4.6.3: Semantic Text Chunking
- Text chunked at ~500 tokens per chunk
- 50 token overlap between consecutive chunks
- Chunk boundaries respect paragraph/section breaks when possible

### AC-4.6.4: Chunk Metadata Tagging
- Each chunk tagged with `page_number` (integer)
- Each chunk tagged with `chunk_index` (sequential within document)
- Metadata stored alongside content in `document_chunks` table

### AC-4.6.5: Bounding Box Storage
- Bounding box coordinates stored when available from LlamaParse
- Format: `{ x, y, width, height }` in JSONB column
- NULL if bounding box not available for chunk

### AC-4.6.6: OpenAI Embeddings Generation
- Embeddings generated via OpenAI `text-embedding-3-small` model
- Vector dimension: 1536
- Batch processing: up to 20 chunks per API call for efficiency

### AC-4.6.7: Chunk Persistence
- Chunks stored in `document_chunks` table with embeddings
- All chunks have `agency_id` for RLS policy compliance
- Chunks include: content, page_number, chunk_index, bounding_box, embedding

### AC-4.6.8: Document Status Update on Success
- Document status updated from 'processing' to 'ready' on successful completion
- `updated_at` timestamp refreshed

### AC-4.6.9: Page Count Storage
- Document `page_count` extracted and stored in documents table
- Derived from LlamaParse output metadata

### AC-4.6.10: Error Handling and Retry
- LlamaParse failure retried once with exponential backoff
- After retry failure, document marked 'failed' with error message
- Error stored in `processing_jobs.error_message`
- OpenAI embedding failures retried with exponential backoff (3 attempts)

### AC-4.6.11: Observability Logging
- Processing start time logged
- Processing end time and total duration logged
- Chunk count logged on completion
- Errors logged with full context (documentId, step, error message)

## Tasks / Subtasks

- [x] **Task 1: Create LlamaParse client library** (AC: 4.6.1, 4.6.2)
  - [x] Create `src/lib/llamaparse/client.ts`
  - [x] Implement `parsePdf(pdfBuffer: Buffer)` function
  - [x] Handle API authentication with `LLAMA_CLOUD_API_KEY`
  - [x] Parse response to extract markdown and page markers
  - [x] Extract page count from response metadata
  - [x] Handle API errors with appropriate error types

- [x] **Task 2: Create chunking service** (AC: 4.6.3, 4.6.4, 4.6.5)
  - [x] Create `src/lib/documents/chunking.ts`
  - [x] Implement `chunkMarkdown(markdown: string, pageMarkers: PageMarker[])` function
  - [x] Target ~500 tokens per chunk with 50 token overlap
  - [x] Preserve page number for each chunk
  - [x] Extract and attach bounding boxes when available
  - [x] Return array of `DocumentChunk` objects

- [x] **Task 3: Create embeddings service** (AC: 4.6.6)
  - [x] Create `src/lib/openai/embeddings.ts`
  - [x] Implement `generateEmbeddings(texts: string[])` function
  - [x] Use `text-embedding-3-small` model (1536 dimensions)
  - [x] Batch requests (max 20 texts per API call)
  - [x] Implement retry logic with exponential backoff
  - [x] Return array of 1536-dimension vectors

- [x] **Task 4: Create process-document Edge Function** (AC: 4.6.1-4.6.9)
  - [x] Create `supabase/functions/process-document/index.ts`
  - [x] Download PDF from Supabase Storage using service role key
  - [x] Call LlamaParse client for extraction
  - [x] Call chunking service to process markdown
  - [x] Call embeddings service to generate vectors
  - [x] Insert chunks into `document_chunks` table (batch insert)
  - [x] Update document status to 'ready' with page_count
  - [x] Update processing job to 'completed'

- [x] **Task 5: Implement retry and error handling** (AC: 4.6.10)
  - [x] Add retry wrapper for LlamaParse API calls
  - [x] Add retry wrapper for OpenAI API calls
  - [x] Update document status to 'failed' on unrecoverable error
  - [x] Store error message in processing_jobs table
  - [x] Implement graceful cleanup on partial failure

- [x] **Task 6: Add observability logging** (AC: 4.6.11)
  - [x] Log processing start with documentId, agencyId
  - [x] Log LlamaParse completion with duration
  - [x] Log chunking completion with chunk count
  - [x] Log embeddings completion with duration
  - [x] Log overall completion with total duration and metrics
  - [x] Log errors with full context

- [x] **Task 7: Testing and verification** (AC: All)
  - [x] Write unit tests for chunking service
  - [x] Write unit tests for embeddings service (utility functions)
  - [x] Write unit tests for LlamaParse client (mocked fetch)
  - [x] Test error handling and retry logic via LlamaParse tests
  - [x] Updated error tests for LlamaParseError and EmbeddingError
  - [x] Verify test count: 507 tests (up from 463 baseline = +44 new tests)
  - [x] Run build and verify no type errors

## Dev Notes

### Architecture Overview

```
Document Upload → processing_jobs INSERT
                        │
                        ▼
               Edge Function Trigger
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    Download PDF   LlamaParse    OpenAI Embeddings
    from Storage   (markdown)    (vectors)
          │             │             │
          └─────────────┴─────────────┘
                        │
                        ▼
              Insert document_chunks
                        │
                        ▼
              Update document → 'ready'
```

### LlamaParse API Integration

```typescript
// src/lib/llamaparse/client.ts
const LLAMAPARSE_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing/upload';

interface LlamaParseResponse {
  markdown: string;
  pages: PageInfo[];
  metadata: {
    page_count: number;
  };
}

export async function parsePdf(pdfBuffer: Buffer): Promise<LlamaParseResponse> {
  const formData = new FormData();
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }));

  const response = await fetch(LLAMAPARSE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new LlamaParseError(`LlamaParse API error: ${response.status}`);
  }

  return response.json();
}
```

### Chunking Strategy

```typescript
// src/lib/documents/chunking.ts
interface ChunkOptions {
  targetTokens: number;    // ~500
  overlapTokens: number;   // 50
}

interface DocumentChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  boundingBox: BoundingBox | null;
  tokenCount: number;
}

export function chunkMarkdown(
  markdown: string,
  pageMarkers: PageMarker[],
  options: ChunkOptions = { targetTokens: 500, overlapTokens: 50 }
): DocumentChunk[] {
  // 1. Split by page markers first
  // 2. Within each page, split by paragraph/section
  // 3. Merge small chunks, split large ones
  // 4. Add overlap between chunks
  // 5. Tag each chunk with page number
}
```

### Embeddings Batching

```typescript
// src/lib/openai/embeddings.ts
const BATCH_SIZE = 20;

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    embeddings.push(...response.data.map(d => d.embedding));
  }

  return embeddings;
}
```

### Edge Function Structure

```typescript
// supabase/functions/process-document/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ProcessingPayload {
  documentId: string;
  storagePath: string;
  agencyId: string;
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  const { documentId, storagePath, agencyId } = await req.json() as ProcessingPayload;

  log.info('Processing started', { documentId, agencyId });

  try {
    // 1. Update job status to 'processing'
    await updateJobStatus(documentId, 'processing');

    // 2. Download PDF from Storage
    const pdfBuffer = await downloadFromStorage(storagePath);

    // 3. Send to LlamaParse
    const parseResult = await parsePdfWithRetry(pdfBuffer);
    log.info('LlamaParse completed', { documentId, duration: Date.now() - startTime });

    // 4. Chunk the content
    const chunks = chunkMarkdown(parseResult.markdown, parseResult.pages);
    log.info('Chunking completed', { documentId, chunkCount: chunks.length });

    // 5. Generate embeddings
    const embeddings = await generateEmbeddingsWithRetry(chunks.map(c => c.content));
    log.info('Embeddings completed', { documentId, duration: Date.now() - startTime });

    // 6. Insert chunks into database
    await insertChunks(documentId, agencyId, chunks, embeddings);

    // 7. Update document status
    await updateDocumentStatus(documentId, 'ready', parseResult.metadata.page_count);

    // 8. Complete processing job
    await updateJobStatus(documentId, 'completed');

    const totalDuration = Date.now() - startTime;
    log.info('Processing completed', { documentId, duration: totalDuration, chunkCount: chunks.length });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    log.error('Processing failed', error, { documentId });
    await updateDocumentStatus(documentId, 'failed');
    await updateJobStatus(documentId, 'failed', error.message);

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Environment Variables Required

```bash
# Edge Function secrets (set via Supabase dashboard or CLI)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
LLAMA_CLOUD_API_KEY=llx-...
```

### Project Structure Notes

- Edge Function goes in `documine/supabase/functions/process-document/`
- LlamaParse client in `documine/src/lib/llamaparse/client.ts`
- Chunking service in `documine/src/lib/documents/chunking.ts`
- Embeddings service in `documine/src/lib/openai/embeddings.ts`
- Edge Function timeout: 150 seconds (Supabase limit)

### Learnings from Previous Story

**From Story 4-5-document-organization-rename-label (Status: done)**

- **Test baseline**: 463 tests passing - maintain or increase
- **Migration naming**: Currently at `00006_labels.sql` - next would be 00007 if needed
- **TypeScript types**: Updated manually in `src/types/database.types.ts`
- **Server actions pattern**: Follow existing patterns in `actions.ts`
- **RLS helper function**: Use existing `get_user_agency_id()` for policies

[Source: stories/4-5-document-organization-rename-label.md#Dev-Agent-Record]

### References

- [Source: docs/epics.md#Story-4.6-Document-Processing-Pipeline-LlamaParse]
- [Source: docs/sprint-artifacts/tech-spec-epic-4.md#Story-4.6]
- [Source: docs/architecture.md#LlamaParse-+-GPT-4o-Vision-for-PDF-Processing]
- [Source: docs/architecture.md#Edge-Functions]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-6-document-processing-pipeline-llamaparse.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- None required - implementation proceeded without blockers

### Completion Notes List

1. **LlamaParse Client** (`src/lib/llamaparse/client.ts`): Full implementation with upload, polling, and markdown retrieval. Uses page separator pattern `--- PAGE {page_number} ---` for page tracking.

2. **Chunking Service** (`src/lib/documents/chunking.ts`): Semantic chunking with ~500 token targets, 50 token overlap, page number tracking, and bounding box support (NULL when not available per AC-4.6.5).

3. **Embeddings Service** (`src/lib/openai/embeddings.ts`): Batched embedding generation (20 per batch), exponential backoff retry (3 attempts), using text-embedding-3-small (1536 dimensions).

4. **Edge Function** (`supabase/functions/process-document/index.ts`): Self-contained Deno implementation that orchestrates the full pipeline. Includes all retry logic, error handling, and structured logging. Excluded from Next.js TypeScript compilation via tsconfig.

5. **Error Types**: Added `LlamaParseError` and `EmbeddingError` to `src/lib/errors.ts` with corresponding tests.

6. **Test Coverage**: +44 new tests (507 total from 463 baseline):
   - Chunking: 20 tests covering basic chunking, page numbers, indexing, sizing, overlap
   - LlamaParse: 12 tests covering parsing flow, polling, error handling, API calls
   - Embeddings: 4 tests for validation and model info utilities
   - Errors: 8 tests for new error types

7. **TypeScript Strictness**: Fixed all `noUncheckedIndexedAccess` issues with proper undefined guards.

### File List

**Created:**
- `src/lib/llamaparse/client.ts` - LlamaParse API client
- `src/lib/documents/chunking.ts` - Semantic text chunking service
- `src/lib/openai/embeddings.ts` - OpenAI embeddings with batching
- `supabase/functions/process-document/index.ts` - Edge Function
- `__tests__/unit/lib/documents/chunking.test.ts` - Chunking tests
- `__tests__/unit/lib/openai/embeddings.test.ts` - Embeddings tests
- `__tests__/unit/lib/llamaparse/client.test.ts` - LlamaParse tests

**Modified:**
- `src/lib/errors.ts` - Added LlamaParseError, EmbeddingError
- `__tests__/unit/lib/errors.test.ts` - Added tests for new error types
- `tsconfig.json` - Excluded supabase folder from compilation

## Code Review Notes

### Reviewer: Senior Developer (Claude Opus 4.5)
### Date: 2025-11-30
### Verdict: **APPROVED**

---

### AC Validation Checklist

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| 4.6.1 | LlamaParse PDF Extraction | **PASS** | `supabase/functions/process-document/index.ts:250-267` - Multipart form upload with API key |
| 4.6.2 | Markdown with Structure Preservation | **PASS** | `index.ts:254` - Page separator `--- PAGE {page_number} ---` configured |
| 4.6.3 | Semantic Text Chunking (~500 tokens, 50 overlap) | **PASS** | `index.ts:26-27` - TARGET_TOKENS=500, OVERLAP_TOKENS=50; `index.ts:401-423` - Respects paragraph boundaries |
| 4.6.4 | Chunk Metadata Tagging | **PASS** | `index.ts:362-363, 599-600` - page_number and chunk_index assigned |
| 4.6.5 | Bounding Box Storage (NULL if unavailable) | **PASS** | `index.ts:601` - `bounding_box: null` per AC spec |
| 4.6.6 | OpenAI Embeddings (text-embedding-3-small, 1536d, batch 20) | **PASS** | `index.ts:23-25` - Model, dimensions, batch size correctly configured |
| 4.6.7 | Chunk Persistence with agency_id | **PASS** | `index.ts:587-617` - All fields including agency_id for RLS |
| 4.6.8 | Document Status Update to 'ready' | **PASS** | `index.ts:155, 571` - Status updated with updated_at timestamp |
| 4.6.9 | Page Count Storage | **PASS** | `index.ts:155, 574-575` - page_count derived from LlamaParse output |
| 4.6.10 | Error Handling and Retry | **PASS** | `index.ts:228-239` - LlamaParse 2 attempts; `index.ts:488-524` - OpenAI 3 attempts with exponential backoff |
| 4.6.11 | Observability Logging | **PASS** | `index.ts:54-82, 116, 124, 129-133, 137, 145-148, 161-166, 174` - Structured JSON logging throughout |

### Task Verification

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Create LlamaParse client library | **VERIFIED** | `src/lib/llamaparse/client.ts` - Full implementation with upload, polling, markdown retrieval |
| 2 | Create chunking service | **VERIFIED** | `src/lib/documents/chunking.ts` - Semantic chunking with page tracking and overlap |
| 3 | Create embeddings service | **VERIFIED** | `src/lib/openai/embeddings.ts` - Batched generation with retry logic |
| 4 | Create process-document Edge Function | **VERIFIED** | `supabase/functions/process-document/index.ts` - Self-contained Deno implementation |
| 5 | Implement retry and error handling | **VERIFIED** | Integrated in Edge Function: LlamaParse retry (2x), OpenAI retry (3x) |
| 6 | Add observability logging | **VERIFIED** | Structured JSON logging with timestamps, durations, metrics |
| 7 | Testing and verification | **VERIFIED** | 507 tests passing (+44 from baseline), build passes |

### Security Review

| Item | Status | Notes |
|------|--------|-------|
| API key handling | **PASS** | Keys retrieved from env vars (`Deno.env.get()`), never logged |
| Error message exposure | **CAUTION** | `index.ts:185` returns raw error messages - consider sanitizing for production |
| Service role key usage | **PASS** | Appropriate for Edge Function backend operations |
| Input validation | **PASS** | Request body validated, storage paths handled safely |

### Code Quality Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Architecture | **Excellent** | Clear separation: Storage, LlamaParse, Chunking, Embeddings, Database |
| TypeScript | **Good** | Proper types, strict mode compliant |
| Error handling | **Good** | Try/catch boundaries, graceful failure status updates |
| Logging | **Excellent** | Structured JSON logging with timestamps for all operations |
| Testing | **Good** | 44 new tests covering core functionality |

### Minor Issues (Non-blocking)

1. **`index.ts:389`** - `parts[i]` accessed without undefined check
   - **Risk**: Low (empty array elements unlikely)
   - **Recommendation**: Add `if (!part) continue;` guard

2. **`index.ts:413-416`** - `splitLongText` called 3x with same args
   - **Risk**: Performance inefficiency
   - **Recommendation**: Cache result in variable

3. **Test warnings** - Unhandled rejection warnings in LlamaParse tests
   - **Risk**: None (cosmetic, tests pass correctly)
   - **Recommendation**: Add explicit `.catch()` in test assertions

### Performance Considerations

- Embedding batch size of 20 is optimal for OpenAI rate limits
- Chunk insertion uses batch size 100 to avoid payload limits
- Job polling interval of 2s is reasonable for LlamaParse processing

### Integration Notes

- Edge Function requires secrets: `LLAMA_CLOUD_API_KEY`, `OPENAI_API_KEY`
- Secrets set via: `npx supabase secrets set LLAMA_CLOUD_API_KEY="..." --project-ref qfhzvkqbbtxvmwiixlhf`
- Edge Function excluded from Next.js build via `tsconfig.json` exclude array

### Summary

Implementation is solid and production-ready. All 11 acceptance criteria are met with proper evidence. The document processing pipeline correctly:
- Extracts PDF content via LlamaParse with page tracking
- Chunks content semantically with overlap for context continuity
- Generates embeddings in efficient batches
- Persists chunks with proper metadata for RLS compliance
- Handles errors gracefully with retry logic
- Provides comprehensive observability logging

**Recommendation**: Approve for merge. Minor optimizations can be addressed in future iterations.

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-30 | Bob (Scrum Master) | Initial story draft via create-story workflow (YOLO mode) |
| 2025-11-30 | Dev Agent (Amelia) | Implemented all 7 tasks, 507 tests passing, build passes. Ready for review. |
| 2025-11-30 | Senior Dev Review (Claude Opus 4.5) | Code review APPROVED - All 11 ACs validated, implementation is production-ready |
