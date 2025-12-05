# Story 12.3: Edge Function Integration

Status: drafted

## Story

As a document processing system,
I want the Edge Function to use Document AI for PDF parsing instead of Docling,
so that documents are processed reliably with enterprise-grade OCR in 5-30 seconds instead of 150+ seconds.

## Acceptance Criteria

### AC-12.3.1: parseDocument() Function Replaced with Document AI Call
- [ ] The `parseDocument()` function in `index.ts` is replaced to call Document AI
- [ ] Function calls `parseDocumentWithRetry()` from `documentai-client.ts`
- [ ] Function accepts same parameters: `docBuffer`, `filename`, `serviceUrl`
- [ ] `serviceUrl` parameter is now ignored (Document AI uses env vars)

### AC-12.3.2: parseDocumentWithRetry() Wrapper Updated
- [ ] Existing `parseDocumentWithRetry()` in `index.ts` delegates to Document AI version
- [ ] Maintains same return signature: `DoclingResult { markdown, pageMarkers, pageCount }`
- [ ] Converts Document AI response to `DoclingResult` format (via Story 12.4)
- [ ] Page-dimensions fallback logic removed (Document AI doesn't have this issue)

### AC-12.3.3: Progress Updates Continue at Parsing Stage
- [ ] Progress updates at parsing stage preserved: 0% at start, 100% at complete
- [ ] Stage name remains "parsing" for UI consistency
- [ ] `updateJobProgress()` calls unchanged

### AC-12.3.4: Error Classification Applied to Document AI Errors
- [ ] Document AI errors classified using `classifyDocumentAIError()` from Story 12.1
- [ ] Error codes mapped to existing `classifyError()` categories for consistency
- [ ] Transient errors (NETWORK_ERROR, TIMEOUT, QUOTA_EXCEEDED) trigger job retry
- [ ] Non-transient errors (AUTH_*, PROCESSOR_*, INVALID_DOCUMENT) marked as failed

### AC-12.3.5: Docling-Specific Code Paths Removed
- [ ] Docling service URL no longer required (env var check removed/optional)
- [ ] `PAGE_DIMENSIONS_ERROR_PATTERNS` constant removed (obsolete)
- [ ] `isPageDimensionsError()` function removed (obsolete)
- [ ] `disable_cell_matching` fallback logic removed (obsolete)
- [ ] Docling-specific timeout removed (uses Document AI 60s timeout from Story 12.2)
- [ ] `getUserFriendlyError()` updated for Document AI errors

## Tasks / Subtasks

- [ ] Task 1: Create Response Conversion Function (AC: 12.3.2)
  - [ ] Create `convertDocumentAIToDoclingResult()` function
  - [ ] Extract text with page markers from Document AI response
  - [ ] Generate page markers array from Document AI pages
  - [ ] Calculate page count from pages array
  - [ ] Handle tables using text anchors (see Story 12.4)

- [ ] Task 2: Replace parseDocument() Function (AC: 12.3.1, 12.3.2)
  - [ ] Import `parseDocumentWithRetry` from `documentai-client.ts`
  - [ ] Update `parseDocumentWithRetry()` wrapper to:
    - Call Document AI parsing instead of Docling
    - Convert response using `convertDocumentAIToDoclingResult()`
    - Return `DoclingResult` format for compatibility
  - [ ] Remove `parseDocument()` function (Docling-specific)
  - [ ] Remove `disableCellMatching` parameter path

- [ ] Task 3: Update Progress Reporting (AC: 12.3.3)
  - [ ] Verify progress updates at parsing stage are preserved
  - [ ] Update logging to reference "Document AI" instead of "Docling"
  - [ ] Keep elapsed time logging for performance metrics

- [ ] Task 4: Integrate Error Classification (AC: 12.3.4)
  - [ ] Import `classifyDocumentAIError` from `documentai-client.ts`
  - [ ] Map Document AI error codes to existing error categories
  - [ ] Update error handling in main try/catch block
  - [ ] Test error classification for common failure modes

- [ ] Task 5: Remove Docling-Specific Code (AC: 12.3.5)
  - [ ] Remove `PAGE_DIMENSIONS_ERROR_PATTERNS` constant
  - [ ] Remove `isPageDimensionsError()` function
  - [ ] Remove `getUserFriendlyError()` function (or update for Document AI)
  - [ ] Remove `extractDiagnosticInfo()` function
  - [ ] Remove `DOCLING_TIMEOUT_MS` constant (use Document AI timeout)
  - [ ] Make `DOCLING_SERVICE_URL` env var optional with deprecation warning
  - [ ] Update module header comment

- [ ] Task 6: Update Environment Variable Handling (AC: 12.3.5)
  - [ ] Remove `doclingServiceUrl` requirement from startup check
  - [ ] Add warning log if `DOCLING_SERVICE_URL` is present (deprecated)
  - [ ] Verify Document AI env vars are checked (from Story 12.1)

- [ ] Task 7: Integration Test (AC: All)
  - [ ] Manual test: Upload PDF and verify processing completes
  - [ ] Verify progress updates show correctly in UI
  - [ ] Verify error handling for invalid documents
  - [ ] Verify chunking and embedding work with Document AI output
  - [ ] Test with `foran auto nationwide.pdf` (the litmus test)

## Dev Notes

### Architecture Decision: Hard Cutover

Per tech spec, this is a **hard cutover** with no Docling fallback:
- The entire purpose of Epic 12 is reliability
- Running both services adds complexity without benefit
- If Document AI fails, we fix it rather than fall back to broken Docling

[Source: docs/sprint-artifacts/tech-spec-epic-12.md#Migration-Strategy]

### Document AI Response Format

Document AI returns structured response with text and pages:

```typescript
interface DocumentAIProcessResponse {
  document: {
    text: string;  // Full extracted text
    pages: DocumentAIPage[];
  };
}

interface DocumentAIPage {
  pageNumber: number;
  dimension: { width: number; height: number; unit: string };
  layout: DocumentAILayout;
  paragraphs: DocumentAIParagraph[];
  tables: DocumentAITable[];
}
```

[Source: supabase/functions/process-document/documentai-client.ts:126-131]

### Response Conversion Pattern

The existing codebase expects `DoclingResult`:

```typescript
interface DoclingResult {
  markdown: string;       // Text with page markers
  pageMarkers: PageMarker[];
  pageCount: number;
}

interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}
```

Conversion approach:
1. Use `document.text` directly as markdown base
2. Insert `--- PAGE X ---` markers at page boundaries
3. Build `pageMarkers` array from page text positions
4. Use `document.pages.length` for page count

### Error Code Mapping

Map Document AI errors to existing error categories:

| Document AI Code | Category | Should Retry |
|------------------|----------|--------------|
| AUTH_* | recoverable | No |
| PROCESSOR_* | permanent | No |
| NETWORK_ERROR | transient | Yes |
| TIMEOUT | transient | Yes |
| QUOTA_EXCEEDED | transient | Yes |
| INVALID_DOCUMENT | recoverable | No |
| UNKNOWN_ERROR | permanent | No |

[Source: supabase/functions/process-document/documentai-client.ts:139-149]

### Learnings from Previous Story

**From Story 12.2 (Document AI Parsing Service) - Status: done**

- **Parsing Functions Ready**: `parseDocumentWithDocumentAI()` and `parseDocumentWithRetry()` implemented with full typing
- **Base64 Encoding Ready**: `encodeToBase64()` handles large files with chunked processing
- **Timeout Handling Ready**: 60-second timeout with AbortController
- **Retry Logic Ready**: 2 retries with exponential backoff (1s, 2s)
- **Error Classification Ready**: `classifyDocumentAIError()` covers all error types

**Files to Reuse (NOT recreate):**
- `supabase/functions/process-document/documentai-client.ts` - All parsing functions

**Integration Notes:**
- Import both `parseDocumentWithRetry` (as `parseWithDocumentAI`) and `classifyDocumentAIError`
- The conversion function is the main new code in Story 12.3
- Story 12.4 will handle table-specific markdown conversion

[Source: docs/sprint-artifacts/story-12.2-document-ai-parsing-service.md#Dev-Agent-Record]

### Functions to Remove

```typescript
// Remove these from index.ts (Docling-specific):
- PAGE_DIMENSIONS_ERROR_PATTERNS constant
- isPageDimensionsError() function
- getUserFriendlyError() function
- extractDiagnosticInfo() function
- parseDocument() function (Docling version)
- DOCLING_TIMEOUT_MS constant

// These stay but update references:
- parseDocumentWithRetry() - Update to call Document AI
- TOTAL_PROCESSING_TIMEOUT_MS - Keep as-is (480s platform buffer)
```

### Processing Pipeline Unchanged

The rest of the pipeline stays the same:
1. Download PDF from Storage ✓
2. **Parse with Document AI** ← This changes
3. Chunk markdown ✓
4. Generate embeddings ✓
5. AI Tagging ✓
6. Quote Extraction ✓
7. Update status ✓

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#Story-12.3] - Acceptance criteria
- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#System-Architecture-Alignment] - Architecture alignment
- [Source: supabase/functions/process-document/index.ts] - Edge Function to modify
- [Source: supabase/functions/process-document/documentai-client.ts] - Document AI client from Stories 12.1/12.2
- [Source: docs/sprint-artifacts/story-12.2-document-ai-parsing-service.md] - Previous story learnings

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted from create-story workflow | SM Agent |
