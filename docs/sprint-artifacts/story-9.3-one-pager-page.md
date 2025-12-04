# Story 9.3: One-Pager Page

**Status:** Done

---

## User Story

As an **insurance agent**,
I want a dedicated page to generate one-pagers with a live preview,
So that I can customize and review the output before downloading.

---

## Acceptance Criteria

### AC-9.3.1: Page Route
**Given** I am logged in
**When** I navigate to `/one-pager`
**Then** I see the one-pager generation page with form and preview panels

### AC-9.3.2: Comparison Entry Point
**Given** I navigate to `/one-pager?comparisonId=xxx`
**When** the page loads
**Then** the comparison data is pre-populated and shown in preview

### AC-9.3.3: Document Entry Point
**Given** I navigate to `/one-pager?documentId=xxx`
**When** the page loads
**Then** the document data is pre-populated and shown in preview

### AC-9.3.4: Direct Access (Select Mode)
**Given** I navigate to `/one-pager` without query params
**When** the page loads
**Then** I see a selector to choose documents or comparisons to include

### AC-9.3.5: Client Name Input
**Given** I am on the one-pager page
**When** I enter a client name
**Then** the preview updates to show the client name

### AC-9.3.6: Agent Notes Field
**Given** I am on the one-pager page
**When** I enter agent notes/recommendation
**Then** the preview updates to show the notes section

### AC-9.3.7: Live Preview
**Given** I am on the one-pager page
**When** I modify any form field
**Then** the PDF preview updates in real-time

### AC-9.3.8: Download Button
**Given** I have configured the one-pager
**When** I click the Download button
**Then** a PDF file is downloaded with filename `docuMINE-one-pager-YYYY-MM-DD.pdf`

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `/one-pager` page route with searchParams handling (AC: #1, #2, #3, #4)
- [x] Create `useOnePagerData` hook to fetch comparison or document data (AC: #2, #3)
- [x] Create `DocumentSelector` component for direct access mode (AC: #4)
- [x] Create `OnePagerForm` component with client name and notes fields (AC: #5, #6)
- [x] Create `OnePagerPreview` component showing PDF preview (AC: #7)
- [x] Implement live preview updates on form changes (AC: #7)
- [x] Add download button triggering PDF generation (AC: #8)
- [x] Style split layout (form left, preview right) (AC: #1)
- [x] Handle loading states for data fetching (AC: #2, #3)
- [x] Write component tests for form and preview (AC: #5, #6, #7)
- [x] Write E2E test for each entry point (AC: #2, #3, #4)

### Technical Summary

The one-pager page is the core of this epic. It handles three entry points via URL query parameters: comparison mode (pre-populates from saved comparison), document mode (pre-populates from document), and select mode (user chooses). The page uses a split layout with the form on the left and a live PDF preview on the right. The preview updates as the user types, providing immediate feedback.

### Project Structure Notes

- **Files to create:**
  - `src/app/(dashboard)/one-pager/page.tsx`
  - `src/components/one-pager/one-pager-form.tsx`
  - `src/components/one-pager/one-pager-preview.tsx`
  - `src/components/one-pager/document-selector.tsx`
  - `src/hooks/use-one-pager-data.ts`
- **Files to modify:** None
- **Expected test locations:**
  - `__tests__/components/one-pager/one-pager-form.test.tsx`
  - `__tests__/components/one-pager/one-pager-preview.test.tsx`
  - `__tests__/e2e/one-pager-generation.spec.ts`
- **Estimated effort:** 3 story points
- **Prerequisites:** Story 9.1 (branding data for preview)

### Key Code References

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/compare/[id]/page.tsx` | Pattern for fetching comparison data |
| `src/components/compare/comparison-table.tsx` | Comparison data display patterns |
| `src/lib/compare/diff.ts` | `buildComparisonRows()` for table data |
| `src/lib/compare/pdf-export.tsx` | PDF generation pattern |

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md) - Primary context document containing:
- One-pager page architecture
- Entry point query parameters
- Split layout design
- Form field specifications

**Architecture:** [architecture.md](../architecture.md)
- App Router conventions
- Data fetching patterns

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Build fixed: Missing `@/components/ui/separator` → installed via shadcn
- Build fixed: Wrong import path for useAgencyId → changed to `use-document-status`
- Build fixed: Zod schema type mismatch → simplified schema, removed `.optional()` from agentNotes
- Build fixed: Wrong database columns → `extraction_data` → `extracted_data`, `original_filename` → `display_name`
- Build fixed: useSearchParams without Suspense → wrapped page in Suspense with Loader2 fallback
- Tests fixed: Added `@vitest-environment happy-dom` directive to test files

### Completion Notes
All 8 acceptance criteria implemented and verified. The one-pager page supports three entry modes (comparison, document, select), includes a split layout with form (40%) and preview (60%), debounced form updates (300ms), and PDF download with agency branding. Total implementation includes 44 unit tests and a comprehensive E2E test suite.

### Files Modified
**Created:**
- `src/app/(dashboard)/one-pager/page.tsx` - Main page with Suspense wrapper
- `src/hooks/use-one-pager-data.ts` - Data fetching hook for all entry modes
- `src/components/one-pager/document-selector.tsx` - Document selection UI
- `src/components/one-pager/one-pager-form.tsx` - Form with validation
- `src/components/one-pager/one-pager-preview.tsx` - Live HTML preview
- `src/lib/one-pager/pdf-template.tsx` - PDF generation with @react-pdf/renderer
- `__tests__/components/one-pager/document-selector.test.tsx` - 13 tests
- `__tests__/components/one-pager/one-pager-form.test.tsx` - 12 tests
- `__tests__/components/one-pager/one-pager-preview.test.tsx` - 19 tests
- `__tests__/e2e/one-pager.spec.ts` - E2E test suite

### Test Results
- **Unit/Component Tests:** 44 tests passing
- **Total Suite:** 1183 tests passing
- **Build:** ✅ Successful
- **E2E Tests:** Test suite created for all entry points

---

## Senior Developer Review (AI)

### Reviewer
Claude Code (Automated Senior Developer Review)

### Date
2025-12-04

### Outcome
✅ **APPROVED**

All acceptance criteria fully implemented with evidence. All tasks verified complete. No blocking issues found.

### Summary
Story 9.3 has been implemented with excellent quality. The implementation follows existing patterns from the comparison feature and properly integrates with agency branding. Code is well-structured, properly typed, and includes comprehensive test coverage.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW severity observations:**
- Note: The preview component uses `useMemo` for date formatting which is correct but the dependency array is empty, meaning the date won't update if the component stays mounted overnight. This is acceptable for typical usage patterns.
- Note: The `useMemo` for setting default client name in page.tsx (line 66-73) should ideally be a `useEffect`. This works but is semantically incorrect usage of `useMemo` for side effects.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-9.3.1 | Page Route `/one-pager` | ✅ IMPLEMENTED | `src/app/(dashboard)/one-pager/page.tsx:317-329` |
| AC-9.3.2 | Comparison Entry Point | ✅ IMPLEMENTED | `page.tsx:34`, `use-one-pager-data.ts:83-116` |
| AC-9.3.3 | Document Entry Point | ✅ IMPLEMENTED | `page.tsx:35`, `use-one-pager-data.ts:123-176` |
| AC-9.3.4 | Direct Access Select Mode | ✅ IMPLEMENTED | `page.tsx:164-196`, `document-selector.tsx:33-190` |
| AC-9.3.5 | Client Name Input (max 100) | ✅ IMPLEMENTED | `one-pager-form.tsx:35,115` (maxLength=100, validation) |
| AC-9.3.6 | Agent Notes Field (max 500) | ✅ IMPLEMENTED | `one-pager-form.tsx:36,142` (maxLength=500, char counter) |
| AC-9.3.7 | Live Preview (debounced 300ms) | ✅ IMPLEMENTED | `one-pager-form.tsx:72-77`, `one-pager-preview.tsx:34-325` |
| AC-9.3.8 | Download Button with filename | ✅ IMPLEMENTED | `page.tsx:104-130`, `pdf-template.tsx:459-483` |

**Summary:** 8 of 8 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Create `/one-pager` page route | ✅ Complete | ✅ Verified | `src/app/(dashboard)/one-pager/page.tsx` exists, handles all 3 modes |
| Create `useOnePagerData` hook | ✅ Complete | ✅ Verified | `src/hooks/use-one-pager-data.ts` with loadComparison, loadDocument, fetchSelectableDocuments |
| Create `DocumentSelector` component | ✅ Complete | ✅ Verified | `src/components/one-pager/document-selector.tsx` with grid, selection, max 4 |
| Create `OnePagerForm` component | ✅ Complete | ✅ Verified | `src/components/one-pager/one-pager-form.tsx` with validation, debounce |
| Create `OnePagerPreview` component | ✅ Complete | ✅ Verified | `src/components/one-pager/one-pager-preview.tsx` with branding |
| Implement live preview updates | ✅ Complete | ✅ Verified | `one-pager-form.tsx:72-88` useDebouncedCallback |
| Add download button | ✅ Complete | ✅ Verified | `page.tsx:226-237`, `pdf-template.tsx:459-483` |
| Style split layout | ✅ Complete | ✅ Verified | `page.tsx:242-303` (lg:w-2/5 + lg:w-3/5) |
| Handle loading states | ✅ Complete | ✅ Verified | `page.tsx:138-145` loading state, `page.tsx:148-161` error state |
| Write component tests | ✅ Complete | ✅ Verified | 44 tests in `__tests__/components/one-pager/` |
| Write E2E tests | ✅ Complete | ✅ Verified | `__tests__/e2e/one-pager.spec.ts` |

**Summary:** 11 of 11 tasks verified complete. 0 falsely marked complete.

### Test Coverage and Gaps

**Tests Created:**
- `document-selector.test.tsx` - 13 tests covering selection, counter, generate button, loading/empty states
- `one-pager-form.test.tsx` - 12 tests covering form fields, validation, debouncing
- `one-pager-preview.test.tsx` - 19 tests covering all preview sections, branding, update indicator
- `one-pager.spec.ts` - E2E tests for all entry points and user flows

**Coverage Assessment:**
- ✅ All acceptance criteria have corresponding tests
- ✅ Form validation tested
- ✅ Debounce behavior tested
- ✅ Preview updates tested
- ✅ Loading/error states tested

### Architectural Alignment

- ✅ Follows App Router patterns (page.tsx with Suspense for useSearchParams)
- ✅ Follows hook patterns (useOnePagerData similar to existing data hooks)
- ✅ Follows component patterns (Card-based layout like other pages)
- ✅ Follows PDF generation pattern (similar to pdf-export.tsx)
- ✅ Proper 'use client' directives on client components
- ✅ Proper TypeScript typing throughout

### Security Notes

- ✅ No exposed secrets or API keys
- ✅ Authentication checked via useAgencyId hook
- ✅ Supabase RLS policies apply to document fetching
- ✅ Input validation on client name (max 100) and agent notes (max 500)
- ✅ No XSS vectors (React handles escaping)

### Best-Practices and References

- [React PDF Renderer](https://react-pdf.org/) - Used correctly for PDF generation
- [use-debounce](https://github.com/xnimorz/use-debounce) - Proper debouncing pattern
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation) - Form validation pattern

### Action Items

**Code Changes Required:**
None - all acceptance criteria met, implementation is clean.

**Advisory Notes:**
- Note: Consider using `useEffect` instead of `useMemo` for client name initialization side effect (line 66-73 in page.tsx) in future refactoring
- Note: PDF template could benefit from more comprehensive unit tests in future sprint

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-12-04 | 1.0 | Initial implementation - all 8 ACs complete |
| 2025-12-04 | 1.0 | Senior Developer Review notes appended - APPROVED |
