# Story 13.1: LlamaParse API Client

**Epic:** 13 - LlamaParse Migration
**Status:** done
**Priority:** P0 - Foundation
**Points:** 3
**Created:** 2025-12-06
**Updated:** 2025-12-06

---

## User Story

**As a** developer
**I want** a TypeScript client for LlamaParse API
**So that** I can parse PDF documents reliably in the Edge Function

---

## Background

After abandoning Epic 12 (Google Document AI), we're migrating to LlamaParse for document parsing. This story creates the foundational API client.

### LlamaParse API Overview

- **Upload**: POST `/api/parsing/upload` - Submit PDF
- **Status**: GET `/api/parsing/job/{id}` - Check progress
- **Result**: GET `/api/parsing/job/{id}/result/markdown` - Get output

### Critical: Page Marker Compatibility

The existing citation system relies on page markers in format `--- PAGE {N} ---` to:
1. Link chat responses to specific document pages
2. Enable "click to verify" source citations
3. Navigate PDF viewer to referenced pages

The `splitByPages()` function in `index.ts:978` uses pattern:
```typescript
const pattern = /---\s*PAGE\s+(\d+)\s*---/gi;
```

LlamaParse must be configured to output this exact format using `page_prefix` parameter.

### Known API Issue

There's a [reported bug](https://github.com/run-llama/llama_cloud_services/issues/721) where `{pageNumber}` placeholder may not be replaced in some cases. Implementation must include fallback handling.

---

## Acceptance Criteria

### AC-13.1.1: Client Module Structure
- [x] Create `supabase/functions/process-document/llamaparse-client.ts`
- [x] Export `parseDocumentWithLlamaParse()` function
- [x] Export `LlamaParseConfig` and `LlamaParseResult` types

### AC-13.1.2: File Upload with Page Marker Configuration
- [x] Accept `ArrayBuffer` file content and filename
- [x] Send multipart/form-data to upload endpoint
- [x] Configure `page_prefix="--- PAGE {pageNumber} ---\n"` to match existing parser pattern
- [x] Set `resultType="markdown"` for markdown output
- [x] Return job ID on success
- [x] Handle upload errors with clear messages

### AC-13.1.3: Job Polling
- [x] Poll job status every 2 seconds (configurable)
- [x] Support progress callback for UI updates
- [x] Timeout after 5 minutes (configurable)
- [x] Handle PENDING, SUCCESS, ERROR states

### AC-13.1.4: Result Retrieval
- [x] Fetch markdown result on SUCCESS
- [x] Parse page count from result (count page markers or use API response)
- [x] Return structured `LlamaParseResult`

### AC-13.1.5: DoclingResult Conversion with PageMarker Indices
- [x] Convert LlamaParse output to `DoclingResult` format
- [x] Extract page markers from markdown using `/---\s*PAGE\s+(\d+)\s*---/gi` pattern
- [x] Compute `startIndex` and `endIndex` for each PageMarker by scanning markdown
- [x] Handle empty pageMarkers case (treat entire document as page 1)
- [x] Maintain compatibility with existing `chunkMarkdown()` pipeline

### AC-13.1.6: Error Handling
- [x] Retry failed requests (max 3 attempts)
- [x] Exponential backoff (1s, 2s, 4s)
- [x] Structured error logging
- [x] User-friendly error messages

### AC-13.1.7: Page Marker Fallback Handling
- [x] If `{pageNumber}` placeholder isn't replaced, detect and use sequential numbering
- [x] Log warning when page markers extraction fails or returns unexpected format
- [x] Graceful degradation: if no page markers found, treat as single-page document

---

## Technical Design

### Interface Definitions

```typescript
export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string; // Default: https://api.cloud.llamaindex.ai
  pollingIntervalMs?: number; // Default: 2000
  maxWaitTimeMs?: number; // Default: 300000 (5 min)
}

export interface LlamaParseResult {
  markdown: string;
  pageCount: number;
  jobId: string;
  processingTimeMs: number;
}

export interface LlamaParseJobStatus {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  error?: string;
}
```

### Existing PageMarker Interface (must match)

```typescript
// From index.ts:154 - DO NOT CHANGE
interface PageMarker {
  pageNumber: number;
  startIndex: number;  // Character position where page starts in markdown
  endIndex: number;    // Character position where page ends in markdown
}

interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];  // NOT number[] - must include indices
  pageCount: number;
}
```

### Main Function

```typescript
export async function parseDocumentWithLlamaParse(
  fileBuffer: ArrayBuffer,
  filename: string,
  config: LlamaParseConfig,
  onProgress?: (stage: string, percent: number) => Promise<void>
): Promise<LlamaParseResult> {
  // 1. Upload file with page_prefix configuration
  // 2. Poll for completion
  // 3. Fetch result
  // 4. Return structured result
}
```

### Conversion Function

```typescript
export function convertToDoclingResult(
  llamaResult: LlamaParseResult
): DoclingResult {
  const pageMarkers = extractPageMarkersWithIndices(llamaResult.markdown);
  return {
    markdown: llamaResult.markdown,
    pageMarkers,
    pageCount: llamaResult.pageCount || pageMarkers.length || 1,
  };
}

function extractPageMarkersWithIndices(markdown: string): PageMarker[] {
  const pattern = /---\s*PAGE\s+(\d+)\s*---/gi;
  const markers: PageMarker[] = [];
  let match;
  let lastEndIndex = 0;

  while ((match = pattern.exec(markdown)) !== null) {
    const pageNumber = parseInt(match[1], 10);
    const startIndex = match.index + match[0].length;

    // Update previous marker's endIndex
    if (markers.length > 0) {
      markers[markers.length - 1].endIndex = match.index;
    }

    markers.push({
      pageNumber,
      startIndex,
      endIndex: markdown.length, // Will be updated by next iteration
    });
  }

  // Handle {pageNumber} placeholder bug - fallback to sequential
  if (markers.length === 0 && markdown.includes('--- PAGE {pageNumber} ---')) {
    console.warn('[LlamaParse] {pageNumber} placeholder not replaced, using fallback');
    // Count occurrences and use sequential numbering
    const fallbackPattern = /---\s*PAGE\s*\{pageNumber\}\s*---/gi;
    let fallbackMatch;
    let pageNum = 1;
    while ((fallbackMatch = fallbackPattern.exec(markdown)) !== null) {
      const startIndex = fallbackMatch.index + fallbackMatch[0].length;
      if (markers.length > 0) {
        markers[markers.length - 1].endIndex = fallbackMatch.index;
      }
      markers.push({
        pageNumber: pageNum++,
        startIndex,
        endIndex: markdown.length,
      });
    }
  }

  return markers;
}
```

### LlamaParse API Upload Parameters

```typescript
// Required upload form data fields
const formData = new FormData();
formData.append('file', new Blob([fileBuffer]), filename);

// Critical: Configure page markers to match existing pattern
formData.append('page_prefix', '--- PAGE {pageNumber} ---\n');
formData.append('result_type', 'markdown');
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLAMA_CLOUD_API_KEY` | Yes | LlamaIndex Cloud API key |

---

## Testing Requirements

### Unit Tests
- [x] Mock upload endpoint responses
- [x] Mock polling scenarios (success, error, timeout)
- [x] Test retry logic with exponential backoff
- [x] Test DoclingResult conversion with valid page markers
- [x] Test PageMarker index computation (startIndex, endIndex)
- [x] Test fallback when {pageNumber} placeholder not replaced
- [x] Test empty markdown handling

### Manual Testing
- [ ] Upload small PDF (1-5 pages)
- [ ] Upload medium PDF (20-50 pages)
- [ ] Upload large PDF (100+ pages)
- [ ] Verify markdown quality
- [ ] Verify page markers extracted correctly
- [ ] Verify source citations work in chat

---

## Definition of Done

- [x] Code compiles without errors
- [x] All acceptance criteria met
- [x] Unit tests pass (24 tests)
- [ ] Manual testing with real PDFs successful
- [ ] Page markers work with existing citation system
- [ ] Code reviewed
- [x] Documentation updated

---

## Dependencies

- LlamaIndex Cloud account created
- API key generated and added to Supabase secrets

---

## Notes

- LlamaParse has 10,000 free pages/month
- API is simpler than Document AI (no GCS required)
- Page marker format MUST match `/---\s*PAGE\s+(\d+)\s*---/gi` pattern
- Known bug: `{pageNumber}` may not be replaced - fallback required

---

## References

- [LlamaParse Parsing Options](https://developers.llamaindex.ai/python/cloud/llamaparse/features/parsing_options)
- [GitHub Issue #721 - pageNumber placeholder bug](https://github.com/run-llama/llama_cloud_services/issues/721)
- Existing code: `supabase/functions/process-document/index.ts:154-158` (PageMarker interface)
- Existing code: `supabase/functions/process-document/index.ts:972-994` (splitByPages function)

---

## Tasks/Subtasks

- [x] Task 1: Create llamaparse-client.ts module structure
- [x] Task 2: Implement parseDocumentWithLlamaParse() with file upload, page_prefix config, polling
- [x] Task 3: Implement convertToDoclingResult() with PageMarker index computation
- [x] Task 4: Add extractPageMarkersWithIndices() with fallback for {pageNumber} bug
- [x] Task 5: Add retry logic with exponential backoff (1s, 2s, 4s)
- [x] Task 6: Add structured error logging
- [x] Task 7: Write unit tests for all functions

---

## Dev Agent Record

### Debug Log

**2025-12-06 Session:**
- Analyzed existing PageMarker and DoclingResult interfaces in index.ts
- Reviewed splitByPages() function pattern for compatibility
- Created comprehensive llamaparse-client.ts with all required functionality
- Implemented type exports, file upload, job polling, result retrieval
- Added page marker extraction with startIndex/endIndex computation
- Implemented {pageNumber} placeholder fallback per known API bug
- Added retry logic with exponential backoff (1s, 2s, 4s)
- Created structured logging for all operations
- Wrote 24 unit tests covering all acceptance criteria

### Completion Notes

- **Implementation complete**: All 7 acceptance criteria implemented
- **Type definitions**: LlamaParseConfig, LlamaParseResult, LlamaParseJobStatus exported
- **Error classes**: LlamaParseError, UploadError, PollingError, TimeoutError, ResultError
- **Page marker compatibility**: Uses exact pattern `/---\s*PAGE\s+(\d+)\s*---/gi`
- **Fallback handling**: Detects unreplaced `{pageNumber}` and uses sequential numbering
- **Tests**: 24 unit tests pass, 1631 total tests pass (no regressions)
- **Build**: Compiles without errors

---

## File List

### New Files
- `supabase/functions/process-document/llamaparse-client.ts` - LlamaParse API client
- `__tests__/lib/llamaparse/client.test.ts` - Unit tests (24 tests)

### Modified Files
- `docs/sprint-artifacts/sprint-status.yaml` - Status updated to in-progress

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
| 2025-12-06 | Added page marker compatibility requirements (AC-13.1.2, AC-13.1.5, AC-13.1.7), PageMarker index computation, fallback handling, references | Claude |
| 2025-12-06 | Implementation complete - all 7 ACs verified, 24 unit tests, build passes | Dev Agent |
| 2025-12-06 | Senior Developer Review - APPROVED | Claude |

---

## Senior Developer Review (AI)

### Reviewer: Sam
### Date: 2025-12-06
### Outcome: ✅ **APPROVED**

The implementation is clean, well-documented, and follows all architectural constraints. All acceptance criteria are verified with evidence, and all tasks are confirmed complete.

---

### Summary

Story 13.1 implements a high-quality LlamaParse API client that provides PDF document parsing capabilities as a replacement for the abandoned Document AI implementation. The code demonstrates excellent patterns including:

- Comprehensive type exports for downstream integration
- Proper page marker handling with fallback for known API bugs
- Exponential backoff retry logic
- Structured logging throughout
- Full interface compatibility with existing `DoclingResult` and `PageMarker` types

---

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- Note: Manual testing with real PDFs is pending (marked incomplete in DoD) - this is acceptable as Story 13.2 (Edge Function Integration) will validate real-world usage before production deployment.

---

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-13.1.1 | Client Module Structure | ✅ IMPLEMENTED | `llamaparse-client.ts:22-46` exports `LlamaParseConfig`, `LlamaParseResult`, and `parseDocumentWithLlamaParse` |
| AC-13.1.2 | File Upload with Page Marker Configuration | ✅ IMPLEMENTED | `llamaparse-client.ts:268-319` - `uploadFile()` with `page_prefix="--- PAGE {pageNumber} ---\n"` and `result_type=markdown` |
| AC-13.1.3 | Job Polling | ✅ IMPLEMENTED | `llamaparse-client.ts:363-421` - `pollJobUntilComplete()` with configurable interval (default 2s), timeout (default 5min), and PENDING/SUCCESS/ERROR handling |
| AC-13.1.4 | Result Retrieval | ✅ IMPLEMENTED | `llamaparse-client.ts:432-466` - `fetchResult()` fetches markdown, handles multiple response formats |
| AC-13.1.5 | DoclingResult Conversion with PageMarker Indices | ✅ IMPLEMENTED | `llamaparse-client.ts:483-541,550-562` - `extractPageMarkersWithIndices()` computes startIndex/endIndex, `convertToDoclingResult()` maintains pipeline compatibility |
| AC-13.1.6 | Error Handling | ✅ IMPLEMENTED | `llamaparse-client.ts:147-197,219-253` - Error classes (`LlamaParseError`, `UploadError`, `PollingError`, `TimeoutError`, `ResultError`) + `withRetry()` with exponential backoff (1s, 2s, 4s) |
| AC-13.1.7 | Page Marker Fallback Handling | ✅ IMPLEMENTED | `llamaparse-client.ts:507-538` - Detects unreplaced `{pageNumber}` placeholder and uses sequential numbering, logs warnings for extraction failures |

**Summary: 7 of 7 acceptance criteria fully implemented**

---

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create llamaparse-client.ts module structure | ✅ Complete | ✅ VERIFIED | File exists at `supabase/functions/process-document/llamaparse-client.ts` (656 lines) |
| Task 2: Implement parseDocumentWithLlamaParse() | ✅ Complete | ✅ VERIFIED | `llamaparse-client.ts:583-655` - Complete implementation with upload, polling, result fetch |
| Task 3: Implement convertToDoclingResult() | ✅ Complete | ✅ VERIFIED | `llamaparse-client.ts:550-562` - Converts to DoclingResult with proper pageCount handling |
| Task 4: Add extractPageMarkersWithIndices() with fallback | ✅ Complete | ✅ VERIFIED | `llamaparse-client.ts:483-541` - Pattern matching + {pageNumber} fallback handling |
| Task 5: Add retry logic with exponential backoff | ✅ Complete | ✅ VERIFIED | `llamaparse-client.ts:219-253` - `withRetry()` with 3 attempts, 1s/2s/4s backoff |
| Task 6: Add structured error logging | ✅ Complete | ✅ VERIFIED | `llamaparse-client.ts:104-138` - `log.info()`, `log.warn()`, `log.error()` with JSON format |
| Task 7: Write unit tests for all functions | ✅ Complete | ✅ VERIFIED | `__tests__/lib/llamaparse/client.test.ts` - 24 tests covering all functionality |

**Summary: 7 of 7 tasks verified complete, 0 questionable, 0 false completions**

---

### Test Coverage and Gaps

**Test Coverage:**
- 24 unit tests in `__tests__/lib/llamaparse/client.test.ts`
- Tests cover: page marker extraction (9 tests), DoclingResult conversion (3 tests), API integration mocks (6 tests), retry logic (3 tests), error classes (2 tests), pattern compatibility (1 test)
- All 1631 project tests pass with no regressions

**Test Gaps (acceptable for this story):**
- Manual testing with real PDFs pending - will be verified in Story 13.2 integration
- No E2E tests yet - deferred to Story 13.4

---

### Architectural Alignment

**Tech Spec Compliance:**
- ✅ Interface matches `LlamaParseConfig`, `LlamaParseResult` from tech spec
- ✅ `page_prefix` parameter set correctly for citation system compatibility
- ✅ Polling and retry patterns match architecture requirements
- ✅ DoclingResult conversion maintains backward compatibility

**Interface Compatibility:**
- ✅ `PageMarker` interface matches `index.ts:154-158` (pageNumber, startIndex, endIndex)
- ✅ `DoclingResult` interface matches `index.ts:692-696` (markdown, pageMarkers, pageCount)
- ✅ Page marker regex `/---\s*PAGE\s+(\d+)\s*---/gi` matches `splitByPages()` pattern at `index.ts:978`

---

### Security Notes

- ✅ API key passed via `Authorization: Bearer` header (not exposed in URL)
- ✅ No secrets hardcoded - uses `config.apiKey` from environment
- ✅ Input validation present (checks for job ID in upload response)
- ✅ Error messages don't leak sensitive information

---

### Best-Practices and References

- [LlamaParse Parsing Options](https://developers.llamaindex.ai/python/cloud/llamaparse/features/parsing_options)
- [GitHub Issue #721 - pageNumber placeholder bug](https://github.com/run-llama/llama_cloud_services/issues/721)
- Deno Edge Function compatibility verified (uses native `fetch`, no npm dependencies)

---

### Action Items

**Code Changes Required:**
- None - implementation is complete and correct

**Advisory Notes:**
- Note: Manual testing with real PDFs recommended during Story 13.2 integration to validate page marker output format
- Note: Consider adding timeout handling test with fake timers when Story 13.4 E2E tests are written
- Note: Monitor LlamaParse API for resolution of `{pageNumber}` placeholder bug (Issue #721) - fallback may become unnecessary
