# Story 9.6: Testing & Polish

**Status:** Draft

---

## User Story

As a **developer**,
I want comprehensive test coverage for the one-pager feature,
So that we can confidently ship and maintain it.

---

## Acceptance Criteria

### AC-9.6.1: Unit Tests Pass
**Given** I run `npm test`
**When** the test suite completes
**Then** all one-pager unit tests pass

### AC-9.6.2: Component Tests Pass
**Given** I run component tests
**When** the test suite completes
**Then** all one-pager component tests pass

### AC-9.6.3: E2E Tests Pass
**Given** I run `npx playwright test`
**When** the E2E tests complete
**Then** all one-pager E2E tests pass (comparison entry, document entry, direct access)

### AC-9.6.4: PDF Renders Correctly
**Given** I generate a one-pager PDF
**When** I open it in a PDF viewer (Preview, Chrome, Adobe)
**Then** the document renders correctly with no layout issues

### AC-9.6.5: Error Handling
**Given** an error occurs during generation (e.g., missing data)
**When** the user attempts to generate
**Then** a helpful error toast is displayed

### AC-9.6.6: Loading States
**Given** data is being fetched or PDF is generating
**When** the user waits
**Then** appropriate loading indicators are shown

### AC-9.6.7: Responsive Design
**Given** I view the one-pager page on desktop and tablet
**When** I resize the browser
**Then** the layout adapts appropriately

---

## Implementation Details

### Tasks / Subtasks

- [ ] Review and complete unit tests for `generator.ts` (AC: #1)
- [ ] Review and complete unit tests for `use-agency-branding.ts` (AC: #1)
- [ ] Review and complete component tests for all one-pager components (AC: #2)
- [ ] Write E2E test for comparison entry point flow (AC: #3)
- [ ] Write E2E test for document entry point flow (AC: #3)
- [ ] Write E2E test for direct access flow (AC: #3)
- [ ] Manual visual QA of generated PDFs in multiple viewers (AC: #4)
- [ ] Add error boundaries and toast notifications (AC: #5)
- [ ] Add loading skeletons and spinners where needed (AC: #6)
- [ ] Test responsive layout on various screen sizes (AC: #7)
- [ ] Fix any bugs discovered during testing
- [ ] Update CLAUDE.md with Epic 9 patterns and learnings

### Technical Summary

This story focuses on quality assurance and polish. It ensures comprehensive test coverage across all testing levels (unit, component, E2E), validates PDF output in real viewers, and adds proper error handling and loading states. Any bugs discovered during testing are fixed as part of this story.

### Project Structure Notes

- **Files to create/modify:**
  - `__tests__/lib/one-pager/generator.test.ts`
  - `__tests__/hooks/use-agency-branding.test.ts`
  - `__tests__/components/one-pager/*.test.tsx`
  - `__tests__/e2e/one-pager-generation.spec.ts`
  - `CLAUDE.md` (add Epic 9 section)
- **Expected test locations:**
  - All tests in `__tests__/` directory
- **Estimated effort:** 1 story point
- **Prerequisites:** Stories 9.1-9.5 (all features must be complete to test)

### Key Code References

| File | Purpose |
|------|---------|
| `__tests__/e2e/conversation-persistence.spec.ts` | E2E test pattern |
| `__tests__/lib/chat/confidence.test.ts` | Unit test pattern |
| `__tests__/components/compare/*.test.tsx` | Component test patterns |

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md) - Primary context document containing:
- Testing strategy
- Acceptance criteria for all stories
- Test file locations

**Architecture:** [architecture.md](../architecture.md)
- Testing conventions
- Error handling patterns

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
