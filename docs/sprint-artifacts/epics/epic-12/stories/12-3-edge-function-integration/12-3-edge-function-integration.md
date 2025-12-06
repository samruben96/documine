# Story 12.3: Edge Function Integration

Status: done

## Story

As a document processing system,
I want the Edge Function to use Document AI for PDF parsing instead of Docling,
so that documents are processed reliably with enterprise-grade OCR in 5-30 seconds instead of 150+ seconds.

## Acceptance Criteria

### AC-12.3.1: parseDocument() Function Replaced with Document AI Call
- [x] The `parseDocument()` function in `index.ts` is replaced to call Document AI
- [x] Function calls `parseDocumentWithRetry()` from `documentai-client.ts`
- [x] Function accepts same parameters: `docBuffer`, `filename`, `serviceUrl`
- [x] `serviceUrl` parameter is now ignored (Document AI uses env vars)

### AC-12.3.2: parseDocumentWithRetry() Wrapper Updated
- [x] Existing `parseDocumentWithRetry()` in `index.ts` delegates to Document AI version
- [x] Maintains same return signature: `DoclingResult { markdown, pageMarkers, pageCount }`
- [x] Converts Document AI response to `DoclingResult` format (via Story 12.4)
- [x] Page-dimensions fallback logic removed (Document AI doesn't have this issue)

### AC-12.3.3: Progress Updates Continue at Parsing Stage
- [x] Progress updates at parsing stage preserved: 0% at start, 100% at complete
- [x] Stage name remains "parsing" for UI consistency
- [x] `updateJobProgress()` calls unchanged

### AC-12.3.4: Error Classification Applied to Document AI Errors
- [x] Document AI errors classified using `classifyDocumentAIError()` from Story 12.1
- [x] Error codes mapped to existing `classifyError()` categories for consistency
- [x] Transient errors (NETWORK_ERROR, TIMEOUT, QUOTA_EXCEEDED) trigger job retry
- [x] Non-transient errors (AUTH_*, PROCESSOR_*, INVALID_DOCUMENT) marked as failed

### AC-12.3.5: Docling-Specific Code Paths Removed
- [x] Docling service URL no longer required (env var check removed/optional)
- [x] `PAGE_DIMENSIONS_ERROR_PATTERNS` constant removed (obsolete)
- [x] `isPageDimensionsError()` function removed (obsolete)
- [x] `disable_cell_matching` fallback logic removed (obsolete)
- [x] Docling-specific timeout removed (uses Document AI 60s timeout from Story 12.2)
- [x] `getUserFriendlyError()` updated for Document AI errors

## Tasks / Subtasks

- [x] Task 1: Response Conversion Function (AC: 12.3.2) - **DONE by Story 12.4**
  - [x] `convertDocumentAIToDoclingResult()` implemented in `documentai-client.ts:947-1113`
  - [x] Text extraction with page markers
  - [x] PageMarkers array generation
  - [x] Table formatting as markdown
  - [x] Import function in `index.ts` (part of Task 2)

- [x] Task 2: Replace parseDocument() Function (AC: 12.3.1, 12.3.2)
  - [x] Import `parseDocumentWithRetry` from `documentai-client.ts`
  - [x] Update `parseDocumentWithRetry()` wrapper to:
    - Call Document AI parsing instead of Docling
    - Convert response using `convertDocumentAIToDoclingResult()`
    - Return `DoclingResult` format for compatibility
  - [x] Remove `parseDocument()` function (Docling-specific)
  - [x] Remove `disableCellMatching` parameter path

- [x] Task 3: Update Progress Reporting (AC: 12.3.3)
  - [x] Verify progress updates at parsing stage are preserved
  - [x] Update logging to reference "Document AI" instead of "Docling"
  - [x] Keep elapsed time logging for performance metrics

- [x] Task 4: Integrate Error Classification (AC: 12.3.4)
  - [x] Import `classifyDocumentAIError` from `documentai-client.ts`
  - [x] Map Document AI error codes to existing error categories
  - [x] Update error handling in main try/catch block
  - [x] Test error classification for common failure modes

- [x] Task 5: Remove Docling-Specific Code (AC: 12.3.5)
  - [x] Remove `PAGE_DIMENSIONS_ERROR_PATTERNS` constant
  - [x] Remove `isPageDimensionsError()` function
  - [x] Remove `getUserFriendlyError()` function (or update for Document AI)
  - [x] Remove `extractDiagnosticInfo()` function
  - [x] Remove `DOCLING_TIMEOUT_MS` constant (use Document AI timeout)
  - [x] Make `DOCLING_SERVICE_URL` env var optional with deprecation warning
  - [x] Update module header comment

- [x] Task 6: Update Environment Variable Handling (AC: 12.3.5)
  - [x] Remove `doclingServiceUrl` requirement from startup check
  - [x] Add warning log if `DOCLING_SERVICE_URL` is present (deprecated)
  - [x] Verify Document AI env vars are checked (from Story 12.1)

- [ ] Task 7: Integration Test (AC: All) - **Manual testing required**
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

### Learnings from Previous Stories

**From Story 12.2 (Document AI Parsing Service) - Status: done**

- **Parsing Functions Ready**: `parseDocumentWithDocumentAI()` and `parseDocumentWithRetry()` implemented with full typing
- **Base64 Encoding Ready**: `encodeToBase64()` handles large files with chunked processing
- **Timeout Handling Ready**: 60-second timeout with AbortController
- **Retry Logic Ready**: 2 retries with exponential backoff (1s, 2s)
- **Error Classification Ready**: `classifyDocumentAIError()` covers all error types

**From Story 12.4 (Response Parsing) - Status: done**

- **Conversion Function Ready**: `convertDocumentAIToDoclingResult()` at `documentai-client.ts:947-1113`
- **Page Markers Implemented**: `--- PAGE X ---` format, first page no marker, 1-indexed
- **Table Formatting Implemented**: Markdown pipe format with header separators
- **PageMarker Array Implemented**: Contiguous indices, accurate page count
- **20 Unit Tests**: Single-page, multi-page, tables, empty docs, 50+ pages

**Files to Reuse (NOT recreate):**
- `supabase/functions/process-document/documentai-client.ts` - All parsing and conversion functions

**Integration for Story 12.3:**
```typescript
import {
  parseDocumentWithRetry as parseWithDocumentAI,
  convertDocumentAIToDoclingResult,
  classifyDocumentAIError,
  isTransientError,
} from './documentai-client.ts';
```

[Source: docs/sprint-artifacts/epics/epic-12/stories/12-2-document-ai-parsing-service/12-2-document-ai-parsing-service.md]
[Source: docs/sprint-artifacts/epics/epic-12/stories/12-4-response-parsing/12-4-response-parsing.md]

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

## Code Review

### Review Date: 2025-12-05
### Reviewer: Senior Developer (AI Review)
### Outcome: **APPROVED** ✅

---

#### Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| AC-12.3.1 | ✅ PASS | `parseDocumentWithDocumentAI` imported at line 24, wrapper at 626-669 |
| AC-12.3.2 | ✅ PASS | Returns `DoclingResult`, uses `convertDocumentAIToDoclingResult()` |
| AC-12.3.3 | ✅ PASS | Progress updates at 0% and 100% for parsing stage (lines 369-390) |
| AC-12.3.4 | ✅ PASS | Uses `classifyDocumentAIError()` in catch block (line 656) |
| AC-12.3.5 | ✅ PASS | All Docling-specific patterns removed; deprecation warning added |

#### Build & Test Results

| Check | Status |
|-------|--------|
| Build | ✅ PASS - Compiles successfully |
| Tests | ✅ PASS - 1554 tests pass (2 skipped) |

#### Code Quality Observations

**Strengths:**
1. Clear module header with Story 12.3 reference
2. Proper import aliasing (`parseDocumentWithRetry as parseDocumentWithDocumentAI`)
3. Backward compatibility maintained (`_serviceUrl` parameter)
4. Helpful deprecation warning for DOCLING_SERVICE_URL
5. Excellent error handling with full context logging

**Minor Observations (Not Blocking):**
1. Line 367 comment says "Send to Docling service" - should say "Document AI" (cosmetic)
2. Story context XML still shows `status="drafted"` (documentation sync issue)

#### Security Review

- ✅ No hardcoded credentials
- ✅ Service account key handling encapsulated
- ✅ No PII in logs
- ✅ User-friendly error messages don't expose internals

#### Recommended Follow-up (Post-Merge)

1. **Manual E2E Test:** Upload PDF via UI, verify Document AI processing completes
2. **Litmus Test:** Test with `foran auto nationwide.pdf` - must complete < 60s
3. **Optional:** Fix comment at line 367

---

## Post-Implementation Bug Fix (2025-12-06)

### Issue: PAGE_LIMIT_EXCEEDED Error for Documents > 15 Pages

**Problem:** Documents with more than 15 pages failed with `PAGE_LIMIT_EXCEEDED` error from Document AI. The error message stated: "Document pages in non-imageless mode exceed the limit: 15 got 26. Try using imageless mode to increase the limit to 30."

**Root Cause:** Document AI has a 15-page limit in normal mode. The `fieldMask` parameter we initially added was not sufficient to enable "imageless mode" - a separate **`imagelessMode: true`** parameter is required at the top level of the request body.

**Fix Applied:** Updated `documentai-client.ts` to include `imagelessMode: true` in the request body:

```typescript
const requestBody = {
  imagelessMode: true,  // Enable 30-page limit (was missing)
  rawDocument: {
    content: base64Content,
    mimeType: 'application/pdf',
  },
};
```

**Files Modified:**
- `supabase/functions/process-document/documentai-client.ts` (lines 662-669)

**Deployment:** Edge Function v23 deployed with fix

**Verification:** FORAN MOE.pdf (26 pages) processed successfully after fix

**Reference:** [Document AI REST API - imagelessMode](https://docs.cloud.google.com/document-ai/docs/reference/rest/v1/projects.locations.processors/process)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted from create-story workflow | SM Agent |
| 2025-12-05 | Code review completed - APPROVED | Senior Dev (AI) |
| 2025-12-06 | Bug fix: Added imagelessMode for 30-page limit | Claude Opus 4.5 |
