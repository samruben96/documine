# Story Q2.4: Quote Session Status Management

Status: done

## Story

As an **insurance agent**,
I want **to see my quote sessions display the correct status automatically**,
So that **I can quickly understand where each quote is in my workflow**.

## Acceptance Criteria

1. **AC-Q2.4-1:** Given a newly created session with no client data, when viewing the status, then it displays as "Draft" with gray badge

2. **AC-Q2.4-2:** Given a session with client name entered (firstName + lastName), when viewing the status, then it displays as "In Progress" with amber badge

3. **AC-Q2.4-3:** Given a session with at least one quote result, when viewing the status, then it displays as "Quotes Received" with blue badge

4. **AC-Q2.4-4:** Given a session with a generated comparison, when viewing the status, then it displays as "Complete" with green badge

## Tasks / Subtasks

- [x] Task 1: Verify StatusBadge visual implementation (AC: 1-4)
  - [x] 1.1 Audit `src/components/quoting/status-badge.tsx` confirms all 4 variants
  - [x] 1.2 Verify badge variant colors in `src/components/ui/badge.tsx`:
    - `status-default` (gray) for draft
    - `status-progress` (amber) for in_progress
    - `status-info` (blue) for quotes_received
    - `status-success` (green) for complete
  - [x] 1.3 Verify StatusBadge is rendered on list page (QuoteSessionCard)
  - [x] 1.4 Verify StatusBadge is rendered on detail page header

- [x] Task 2: Verify calculateSessionStatus logic (AC: 1-4)
  - [x] 2.1 Audit `src/lib/quoting/service.ts:calculateSessionStatus()` covers all transitions
  - [x] 2.2 Confirm existing unit tests in `__tests__/lib/quoting/service.test.ts` cover:
    - Empty data → draft (AC-Q2.4-1)
    - Personal firstName+lastName → in_progress (AC-Q2.4-2)
    - carrierCount > 0 → quotes_received (AC-Q2.4-3)
    - storedStatus === 'complete' → complete (AC-Q2.4-4)
  - [x] 2.3 Add any missing edge case tests if needed

- [x] Task 3: Create E2E test suite for status management (AC: 1-4)
  - [x] 3.1 Create `__tests__/e2e/quoting/quote-session-status.spec.ts`
  - [x] 3.2 Test AC-Q2.4-1: New session displays "Draft" badge with gray variant
  - [x] 3.3 Test AC-Q2.4-2: Requires Q3 forms - stub with comment
  - [x] 3.4 Test AC-Q2.4-3: Requires Q5 results - stub with comment
  - [x] 3.5 Test AC-Q2.4-4: Requires Q5 comparison - stub with comment
  - [x] 3.6 Test status badge visibility on list page
  - [x] 3.7 Test status badge visibility on detail page

- [x] Task 4: Add StatusBadge component tests for color variants (AC: 1-4)
  - [x] 4.1 Extend `__tests__/components/quoting/status-badge.test.tsx`
  - [x] 4.2 Test draft status has `status-default` variant class
  - [x] 4.3 Test in_progress status has `status-progress` variant class
  - [x] 4.4 Test quotes_received status has `status-info` variant class
  - [x] 4.5 Test complete status has `status-success` variant class

- [x] Task 5: Update sprint status (AC: all)
  - [x] 5.1 Update sprint-status.yaml: Q2-4 → in-progress → review

## Dev Notes

### Implementation Status

This story validates and tests functionality that was **already implemented** as part of Q2.1 (Quote Sessions List Page) and Q2.3 (Quote Session Detail Page). The core components exist:

| Component | Location | Status |
|-----------|----------|--------|
| StatusBadge | `src/components/quoting/status-badge.tsx` | ✅ Exists |
| calculateSessionStatus | `src/lib/quoting/service.ts:34-72` | ✅ Exists |
| Badge variants | `src/components/ui/badge.tsx:21-27` | ✅ Exists |
| Unit tests | `__tests__/lib/quoting/service.test.ts` | ✅ 18 tests |
| Component tests | `__tests__/components/quoting/status-badge.test.tsx` | ✅ 11 tests (7 original + 4 variant color tests) |
| E2E tests | `__tests__/e2e/quoting/quote-session-status.spec.ts` | ✅ 6 tests (+ 3 stubs for Q3/Q5) |

### Status Calculation Rules

Per tech spec, status is computed on read (not stored):

```
draft:
  - client_data is empty OR only has minimal data

in_progress:
  - client_data.personal has firstName + lastName
  - OR property data exists
  - OR vehicles/drivers exist

quotes_received:
  - At least one quote_result exists (carrierCount > 0)

complete:
  - storedStatus === 'complete' (set when comparison generated)
```

### Badge Color Mapping

| Status | Badge Variant | Color | Icon |
|--------|---------------|-------|------|
| draft | status-default | Slate/Gray | Circle |
| in_progress | status-progress | Amber | Clock |
| quotes_received | status-info | Blue | FileCheck |
| complete | status-success | Green | CheckCircle |

### E2E Test Limitations

- **AC-Q2.4-2** (in_progress): Cannot fully test until Q3 forms enable client data entry
- **AC-Q2.4-3** (quotes_received): Cannot fully test until Q5 implements quote result entry
- **AC-Q2.4-4** (complete): Cannot fully test until Q5 implements comparison generation

E2E tests will stub these scenarios with comments and verify the visual components render correctly.

### Project Structure Notes

- Alignment: Uses existing badge component system
- No new components required
- Tests extend existing test files

### References

- [Source: docs/sprint-artifacts/epics/epic-Q2/tech-spec.md#Story-Q2.4]
- [Source: src/components/quoting/status-badge.tsx]
- [Source: src/lib/quoting/service.ts#calculateSessionStatus]
- [Source: __tests__/lib/quoting/service.test.ts#calculateSessionStatus]
- [Source: __tests__/components/quoting/status-badge.test.tsx]

### Learnings from Previous Story

**From Story Q2-3 (Status: done)**

- **StatusBadge Usage**: StatusBadge component already integrated into detail page header
- **calculateSessionStatus()**: Function called from `transformQuoteSession()` in service layer
- **Test Infrastructure**: 48 tests added in Q2-3, 136 total quoting tests
- **Component Pattern**: Tab completion uses similar badge-based indicator pattern

[Source: docs/sprint-artifacts/epics/epic-Q2/stories/Q2-3-quote-session-detail-page/story.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-Q2/stories/Q2-4-quote-session-status/Q2-4-quote-session-status.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 11 StatusBadge component tests pass
- All 18 quoting service tests pass
- Build passes with no type errors

### Completion Notes List

- **Validation Complete**: Existing StatusBadge component and calculateSessionStatus function fully implement all 4 ACs
- **Test Coverage Added**: 4 new variant color tests verify correct CSS classes for each status
- **E2E Test Suite Created**: Comprehensive E2E tests for draft status display with stubs for Q3/Q5 dependent scenarios
- **Pattern Established**: Status variants follow established `status-*` naming convention from Design Refresh epic
- **No Code Changes**: Core functionality already existed from Q2.1/Q2.3; this story added test validation only

### File List

**New Files:**
- `__tests__/e2e/quoting/quote-session-status.spec.ts` - E2E test suite for status management (6 tests + 3 stubs)
- `docs/sprint-artifacts/epics/epic-Q2/stories/Q2-4-quote-session-status/Q2-4-quote-session-status.context.xml` - Story context

**Modified Files:**
- `__tests__/components/quoting/status-badge.test.tsx` - Added 4 variant color tests (7→11 tests)
- `docs/sprint-artifacts/sprint-status.yaml` - Updated Q2-4 status

### Change Log

- 2025-12-11: Story Q2.4 implementation complete - Validated existing status management implementation and added comprehensive test coverage
