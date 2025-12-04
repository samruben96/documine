# Story 9.3: One-Pager Page

**Status:** Draft

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

- [ ] Create `/one-pager` page route with searchParams handling (AC: #1, #2, #3, #4)
- [ ] Create `useOnePagerData` hook to fetch comparison or document data (AC: #2, #3)
- [ ] Create `DocumentSelector` component for direct access mode (AC: #4)
- [ ] Create `OnePagerForm` component with client name and notes fields (AC: #5, #6)
- [ ] Create `OnePagerPreview` component showing PDF preview (AC: #7)
- [ ] Implement live preview updates on form changes (AC: #7)
- [ ] Add download button triggering PDF generation (AC: #8)
- [ ] Style split layout (form left, preview right) (AC: #1)
- [ ] Handle loading states for data fetching (AC: #2, #3)
- [ ] Write component tests for form and preview (AC: #5, #6, #7)
- [ ] Write E2E test for each entry point (AC: #2, #3, #4)

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
<!-- Will be populated during dev-story execution -->

### Debug Log References
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
