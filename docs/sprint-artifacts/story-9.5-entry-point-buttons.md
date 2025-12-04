# Story 9.5: Entry Point Buttons

**Status:** Draft

---

## User Story

As an **insurance agent**,
I want quick access to generate one-pagers from anywhere I'm viewing data,
So that I can create client summaries without extra navigation.

---

## Acceptance Criteria

### AC-9.5.1: Comparison Results Button
**Given** I am viewing a comparison result at `/compare/[id]`
**When** I click "Generate One-Pager" button
**Then** I am navigated to `/one-pager?comparisonId=[id]`

### AC-9.5.2: Comparison History Button
**Given** I am viewing comparison history
**When** I click the one-pager action on a comparison row
**Then** I am navigated to `/one-pager?comparisonId=[id]`

### AC-9.5.3: Document Viewer Button
**Given** I am viewing a document at `/documents/[id]`
**When** I click "Generate One-Pager" button
**Then** I am navigated to `/one-pager?documentId=[id]`

### AC-9.5.4: Consistent Styling
**Given** I see the one-pager button in any location
**When** I compare the styling
**Then** all buttons have consistent appearance (icon, text, color)

### AC-9.5.5: Button Visibility
**Given** I am on a page with one-pager button
**When** I view the actions area
**Then** the button is prominently visible in the header/actions section

---

## Implementation Details

### Tasks / Subtasks

- [ ] Create `OnePagerButton` shared component (AC: #4)
- [ ] Add button to comparison results page header (AC: #1)
- [ ] Add button to comparison history row actions (AC: #2)
- [ ] Add button to document viewer header (AC: #3)
- [ ] Style button with FileText icon and consistent appearance (AC: #4)
- [ ] Ensure button placement is visible and accessible (AC: #5)
- [ ] Write component test for OnePagerButton (AC: #4)
- [ ] Write E2E tests for each navigation path (AC: #1, #2, #3)

### Technical Summary

This story adds "Generate One-Pager" buttons to three locations in the app, all using a shared button component for consistency. The button is a simple navigation trigger that passes the relevant ID (comparison or document) as a query parameter. No data fetching occurs in this story - that's handled by the one-pager page itself.

### Project Structure Notes

- **Files to create:**
  - `src/components/one-pager/one-pager-button.tsx`
- **Files to modify:**
  - `src/app/(dashboard)/compare/[id]/page.tsx`
  - `src/app/(dashboard)/documents/[id]/page.tsx`
  - `src/components/compare/comparison-history.tsx`
- **Expected test locations:**
  - `__tests__/components/one-pager/one-pager-button.test.tsx`
  - `__tests__/e2e/one-pager-generation.spec.ts` (extended)
- **Estimated effort:** 1 story point
- **Prerequisites:** Story 9.3 (one-pager page must exist to navigate to)

### Key Code References

| File | Purpose |
|------|---------|
| `src/components/compare/export-button.tsx` | Button pattern with icon |
| `src/app/(dashboard)/compare/[id]/page.tsx` | Header actions location |
| `src/components/compare/comparison-history.tsx` | Row actions pattern |

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md) - Primary context document containing:
- Entry point navigation table
- Button styling guidelines
- Query parameter format

**Architecture:** [architecture.md](../architecture.md)
- Next.js Link patterns
- Component organization

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
