# Story 12.4: Response Parsing

Status: done

## Story

As a document processing system,
I want to convert Document AI API responses into the existing DoclingResult format,
so that downstream processing (chunking, embedding, extraction) continues to work unchanged.

## Acceptance Criteria

### AC-12.4.1: Document AI Text Extracted with Page Boundaries
- [x] `document.text` from Document AI response extracted
- [x] Page boundaries identified from `document.pages[]` array
- [x] Text segmented by page using `textAnchor.textSegments` indices
- [x] Full document text preserved without truncation

### AC-12.4.2: Markdown Output Compatible with Existing Chunker
- [x] Output format matches current DoclingResult.markdown structure
- [x] Paragraph breaks preserved as double newlines
- [x] Headings detected and formatted (if Document AI provides)
- [x] Whitespace normalized (no excessive blank lines)

### AC-12.4.3: Page Markers Format Preserved
- [x] Page markers format: `--- PAGE X ---` inserted between pages
- [x] Page markers match existing format exactly
- [x] First page starts without marker (content begins immediately)
- [x] Page numbers are 1-indexed (PAGE 1, PAGE 2, etc.)

### AC-12.4.4: Tables Converted to Markdown Format
- [x] Tables detected from `document.pages[].tables` array
- [x] Table cells extracted via `textAnchor` references to full text
- [x] Tables formatted as markdown pipes: `| col1 | col2 |`
- [x] Header rows distinguished with `|---|---|` separator
- [x] Tables embedded at correct position in document flow

### AC-12.4.5: Page Count Accurately Reported
- [x] `pageCount` matches `document.pages.length`
- [x] `pageMarkers` array has entry for each page
- [x] Each PageMarker has correct `pageNumber`, `startIndex`, `endIndex`
- [x] Page marker indices align with markdown output positions

## Tasks / Subtasks

- [x] Task 1: Create convertDocumentAIToDoclingResult() Function (AC: 12.4.1, 12.4.5)
  - [x] Create new function in `documentai-client.ts`
  - [x] Accept `DocumentAIProcessResponse` as input
  - [x] Return `DoclingResult` with markdown, pageMarkers, pageCount
  - [x] Export function for use in index.ts

- [x] Task 2: Implement Text Extraction with Page Markers (AC: 12.4.1, 12.4.3)
  - [x] Iterate through `document.pages[]` array
  - [x] For each page, extract text using textAnchor startIndex/endIndex
  - [x] Insert `--- PAGE X ---` marker between pages
  - [x] Build complete markdown string with markers

- [x] Task 3: Implement PageMarkers Array Generation (AC: 12.4.5)
  - [x] Create PageMarker for each page
  - [x] Calculate startIndex/endIndex based on position in final markdown
  - [x] Account for page marker text length in indices
  - [x] Validate indices are contiguous and complete

- [x] Task 4: Implement Table Extraction (AC: 12.4.4)
  - [x] Detect tables in `document.pages[].tables`
  - [x] Extract cell text using textAnchor references
  - [x] Format as markdown table with pipes
  - [x] Insert tables at correct position in document flow
  - [x] Handle headerRows vs bodyRows distinction

- [x] Task 5: Normalize and Clean Output (AC: 12.4.2)
  - [x] Normalize whitespace (collapse multiple blank lines)
  - [x] Preserve paragraph structure
  - [x] Ensure consistent line endings
  - [x] Trim leading/trailing whitespace per page

- [x] Task 6: Unit Tests (AC: All)
  - [x] Test: Simple single-page document
  - [x] Test: Multi-page document with page markers
  - [x] Test: Document with tables
  - [x] Test: Page count accuracy
  - [x] Test: PageMarker indices correctness
  - [x] Test: Empty document handling
  - [x] Test: Large document (50+ pages)

## Dev Notes

### Document AI Response Structure

The Document AI OCR processor returns:

```typescript
interface DocumentAIProcessResponse {
  document: {
    text: string;  // Full extracted text, all pages concatenated
    pages: Array<{
      pageNumber: number;  // 1-indexed
      dimension: { width: number; height: number; unit: string };
      layout: {
        textAnchor: {
          textSegments: Array<{
            startIndex?: string;  // String indices into document.text
            endIndex?: string;
          }>;
        };
        boundingPoly: { normalizedVertices: Array<{x: number; y: number}> };
        confidence: number;
      };
      paragraphs: Array<Paragraph>;  // Same structure with textAnchor
      tables: Array<{
        layout: Layout;
        headerRows: Array<{ cells: Array<{ layout: Layout }> }>;
        bodyRows: Array<{ cells: Array<{ layout: Layout }> }>;
      }>;
    }>;
  };
}
```

**Key insight:** `document.text` contains ALL text from ALL pages concatenated. Each element (page, paragraph, table cell) has a `textAnchor.textSegments` that references back into this text using `startIndex` and `endIndex`.

### Conversion Algorithm

```typescript
function convertDocumentAIToDoclingResult(response: DocumentAIProcessResponse): DoclingResult {
  const { document } = response;
  const pages = document.pages || [];
  const fullText = document.text || '';

  let markdown = '';
  const pageMarkers: PageMarker[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = page.pageNumber || (i + 1);

    // Get text for this page using textAnchor
    const pageLayout = page.layout;
    const segments = pageLayout?.textAnchor?.textSegments || [];

    let pageText = '';
    for (const seg of segments) {
      const start = parseInt(seg.startIndex || '0', 10);
      const end = parseInt(seg.endIndex || String(fullText.length), 10);
      pageText += fullText.substring(start, end);
    }

    // Record page marker position
    const startIndex = markdown.length;

    // Add page marker (except for first page)
    if (i > 0) {
      markdown += `\n\n--- PAGE ${pageNum} ---\n\n`;
    }

    // Add page content
    markdown += pageText.trim();

    // TODO: Insert tables at correct positions

    const endIndex = markdown.length;
    pageMarkers.push({ pageNumber: pageNum, startIndex, endIndex });
  }

  return {
    markdown: markdown.trim(),
    pageMarkers,
    pageCount: pages.length,
  };
}
```

### Table Extraction Strategy

Tables in Document AI are complex. Each table has:
- `headerRows[]` - rows that are headers
- `bodyRows[]` - data rows
- Each row has `cells[]`, each cell has a `layout.textAnchor`

**Approach:**
1. For each page, collect tables with their bounding positions
2. Determine where in the page text the table appears
3. Extract cell text using textAnchor
4. Format as markdown table
5. Insert at correct position relative to surrounding text

**Deferral option:** For MVP, we could output tables as plain text (cells concatenated) and enhance to proper markdown in a follow-up. This matches Docling behavior for simple cases.

### Learnings from Previous Story

**From Story 12.2 (Document AI Parsing Service) - Status: done**

Key patterns to reuse:
- **Response types already defined:** `DocumentAIProcessResponse`, `DocumentAIPage`, `DocumentAITable`, etc. are all in `documentai-client.ts:44-131`. DO NOT recreate.
- **parseDocumentWithRetry() returns raw response:** Story 12.4 converts this response to `DoclingResult` format.
- **Error handling in place:** If response parsing fails, use existing error classification.

**Files to Reuse (NOT recreate):**
- `supabase/functions/process-document/documentai-client.ts` - Types and parsing service
- `supabase/functions/process-document/index.ts:616-620` - DoclingResult interface

[Source: docs/sprint-artifacts/epics/epic-12/stories/12-2-document-ai-parsing-service/12-2-document-ai-parsing-service.md#Dev-Agent-Record]

### Project Structure Notes

**File to modify:**
- `supabase/functions/process-document/documentai-client.ts` - Add `convertDocumentAIToDoclingResult()` function

**Interface to match (in index.ts):**
```typescript
interface DoclingResult {
  markdown: string;
  pageMarkers: PageMarker[];
  pageCount: number;
}

interface PageMarker {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}
```

**Integration point:**
- Story 12.3 will import and call `convertDocumentAIToDoclingResult()` after calling `parseDocumentWithRetry()`

### References

- [Source: docs/sprint-artifacts/epics/epic-12/tech-spec/tech-spec-epic-12.md#Story-12.4] - Acceptance criteria (AC-12.4.1 to AC-12.4.5)
- [Source: docs/sprint-artifacts/epics/epic-12/tech-spec/tech-spec-epic-12.md#Data-Models-and-Contracts] - DoclingResult interface
- [Source: supabase/functions/process-document/documentai-client.ts:44-131] - DocumentAI response types
- [Source: supabase/functions/process-document/index.ts:616-620] - DoclingResult interface

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-12/stories/12-4-response-parsing/12-4-response-parsing.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented `convertDocumentAIToDoclingResult()` function in `documentai-client.ts`
- All 5 acceptance criteria satisfied with comprehensive unit tests
- 20 new test cases added covering single-page, multi-page, tables, empty docs, and 50+ page documents
- All 1554 tests pass, build succeeds

### File List

- `supabase/functions/process-document/documentai-client.ts` (modified: lines 775-1113)
- `__tests__/supabase/documentai-parsing.test.ts` (modified: lines 399-1021)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted from create-story workflow | SM Agent |
| 2025-12-05 | Implementation complete: convertDocumentAIToDoclingResult() with tests | Dev Agent |
| 2025-12-05 | Senior Developer Review (AI) - APPROVED | Sam |

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-05

### Outcome
✅ **APPROVED**

All acceptance criteria implemented, all tasks verified complete, tests comprehensive and passing.

### Summary

Story 12.4 successfully implements the `convertDocumentAIToDoclingResult()` function that converts Google Cloud Document AI API responses into the internal `DoclingResult` format used by downstream processing (chunking, embedding, extraction). The implementation correctly handles text extraction, page markers, table formatting, and whitespace normalization.

### Key Findings

**No blocking issues found.**

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-12.4.1 | Document AI Text Extracted with Page Boundaries | ✅ IMPLEMENTED | `documentai-client.ts:804-820` - `extractTextFromAnchor()` uses `textAnchor.textSegments` indices |
| AC-12.4.2 | Markdown Output Compatible with Existing Chunker | ✅ IMPLEMENTED | `documentai-client.ts:917-932` - `normalizeWhitespace()` preserves paragraph breaks |
| AC-12.4.3 | Page Markers Format Preserved | ✅ IMPLEMENTED | `documentai-client.ts:1009-1016` - First page no marker, subsequent pages `--- PAGE X ---` |
| AC-12.4.4 | Tables Converted to Markdown Format | ✅ IMPLEMENTED | `documentai-client.ts:852-910` - `formatTableAsMarkdown()` creates pipe format |
| AC-12.4.5 | Page Count Accurately Reported | ✅ IMPLEMENTED | `documentai-client.ts:962,1096-1106` - `pageCount = pages.length`, contiguous indices |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Create convertDocumentAIToDoclingResult() | ✅ Verified | `documentai-client.ts:947-1113` |
| Task 2: Text Extraction with Page Markers | ✅ Verified | `documentai-client.ts:972-1028` |
| Task 3: PageMarkers Array Generation | ✅ Verified | `documentai-client.ts:1036-1106` |
| Task 4: Table Extraction | ✅ Verified | `documentai-client.ts:980-1001` |
| Task 5: Normalize and Clean Output | ✅ Verified | `documentai-client.ts:917-932,1003-1004` |
| Task 6: Unit Tests | ✅ Verified | `documentai-parsing.test.ts:403-1021` (20 tests) |

**Summary: 6 of 6 tasks verified complete**

### Test Coverage and Gaps

- 20 new test cases added for Story 12.4
- All 1554 tests pass (no regressions)
- Coverage includes: single-page, multi-page, page markers, tables, empty docs, null response, pages out of order, string indices, 50+ page performance

### Architectural Alignment

- ✅ Uses existing `DocumentAIProcessResponse` type from Story 12.2
- ✅ Output matches `DoclingResult` interface from `index.ts`
- ✅ No architecture violations

### Security Notes

- No security concerns identified
- Function handles untrusted input gracefully (null checks, empty arrays)

### Best-Practices and References

- [Google Cloud Document AI Response Format](https://cloud.google.com/document-ai/docs/reference/rest/v1/Document)
- String indices properly parsed with `parseInt()` per Document AI API quirk

### Action Items

**Advisory Notes:**
- Note: Story file task checkboxes were unchecked but all tasks were complete - corrected during review
- Note: Consider exporting `PageMarker` and `DoclingResult` types from a shared location in future refactor

---

_Drafted: 2025-12-05_
_Epic: Epic 12 - Google Cloud Document AI Migration_
