# Story 8.6: Fix Pre-existing Test Failure

**Epic:** 8 - Tech Debt & Production Hardening
**Priority:** P1
**Effort:** S (1-2 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **developer**,
I want **all tests to pass consistently**,
So that **CI/CD pipelines are reliable and code quality is maintained**.

---

## Context

The tech spec identified a potentially failing `useAgencyId > returns agencyId after loading` test from Epic 5. Upon investigation, this test was already passing (fixed during Epic 6), but the test file had `act()` warnings indicating improper async handling.

### Investigation Findings

1. **Test Status:** All 1097 tests already passing - no failures
2. **Code Quality Issue:** `act()` warnings in `useAgencyId` tests
3. **Root Cause:** Async state updates in the hook completed after synchronous test assertions

---

## Acceptance Criteria

### AC-8.6.1: useAgencyId Test Passes
**Given** the `useAgencyId` hook test
**When** `npm run test` is executed
**Then** `useAgencyId > returns agencyId after loading` passes ✅ (was already passing)

### AC-8.6.2: No New Test Failures
**Given** the test fix
**When** the full test suite runs
**Then** no new test failures are introduced

### AC-8.6.3: All Tests Passing
**Given** the test suite
**When** `npm run test` is executed
**Then** all 1097 tests pass

---

## Tasks / Subtasks

- [x] Task 1: Investigate Test Status (AC: 8.6.1) ✅
  - [x] Ran test suite - all 1097 tests passing
  - [x] Found test was already fixed, but had `act()` warnings

- [x] Task 2: Fix act() Warnings (AC: 8.6.2, 8.6.3) ✅
  - [x] Updated `starts with loading state` test to wait for async updates
  - [x] Eliminated React `act()` warnings from test output

- [x] Task 3: Verify Full Suite (AC: 8.6.2, 8.6.3) ✅
  - [x] Ran `npm run test` - 1097 tests pass
  - [x] Ran `npm run build` - build successful
  - [x] No act() warnings in useAgencyId tests

---

## Dev Notes

### The act() Warning Fix

The `useAgencyId` hook triggers async state updates (auth check + database query). The "starts with loading state" test checked initial state synchronously, but the hook's async operations completed after the test, triggering React's `act()` warning.

**Fix:** Added `waitFor` to let async updates complete before test cleanup:

```typescript
// Before (caused act() warning)
it('starts with loading state', () => {
  const { result } = renderHook(() => useAgencyId());
  expect(result.current.isLoading).toBe(true);
  // Hook continues async work after this...
});

// After (clean)
it('starts with loading state', async () => {
  const { result } = renderHook(() => useAgencyId());
  expect(result.current.isLoading).toBe(true);
  // Wait for async updates to complete
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
});
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-8.md#Story-8.6]
- [React Testing Library: act() documentation](https://testing-library.com/docs/react-testing-library/api/#act)

---

## Dev Agent Record

### Context Reference

N/A - Story implemented directly from tech spec investigation

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) as Amelia (Dev Agent)

### Completion Notes List

1. **Investigation (2025-12-03)**
   - Ran test suite - all 1097 tests already passing
   - Identified that the test was fixed during Epic 6 (Story 6.8)
   - Found `act()` warnings in test output

2. **act() Warning Fix (2025-12-03)**
   - Updated `starts with loading state` test to await async updates
   - Verified warnings eliminated from test output

3. **Verification (2025-12-03)**
   - 1097 tests pass
   - Build successful
   - No act() warnings

### File List

- `__tests__/hooks/use-document-status.test.ts` (modified - fixed act() warning)

---

## Senior Developer Review (AI)

### Reviewer
Sam (Senior Developer)

### Date
2025-12-03

### Outcome
✅ **APPROVED** - All acceptance criteria verified.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-8.6.1 | useAgencyId test passes | ✅ | Test passing in suite |
| AC-8.6.2 | No new failures | ✅ | 1097 tests pass |
| AC-8.6.3 | All tests passing | ✅ | npm run test shows 1097 passed |

**Summary:** 3 of 3 acceptance criteria verified ✅

### Code Quality Notes

- act() warning fix follows React Testing Library best practices
- Async test handling is now correct

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (BMad Master) | Story drafted from tech spec |
| 2025-12-03 | Dev (Amelia) | Investigation + act() warning fix complete |
| 2025-12-03 | Reviewer (Senior Dev) | Senior Developer Review: APPROVED |
