# Story Q2.5: Delete and Duplicate Quote Sessions

Status: done

## Story

As an **insurance agent**,
I want **to delete unwanted quote sessions and duplicate existing ones**,
So that **I can manage my quotes efficiently and save time on similar prospects**.

## Acceptance Criteria

1. **AC-Q2.5-1:** Given the user clicks "Delete" from the action menu on a quote session, when the confirmation dialog appears, then it displays "Delete this quote session? This cannot be undone."

2. **AC-Q2.5-2:** Given the user confirms deletion, when processed, then the session and all associated quote results are deleted from the database

3. **AC-Q2.5-3:** Given deletion succeeds, when complete, then a toast confirms "Quote session deleted" and the session is removed from the list immediately

4. **AC-Q2.5-4:** Given the user clicks "Duplicate" from the action menu on a quote session, when processed, then a new session is created with:
   - Prospect name: "[Original Name] (Copy)"
   - Same quote type
   - All client data copied
   - No quote results copied
   - Status: "Draft"

5. **AC-Q2.5-5:** Given duplication succeeds, when complete, then the user is navigated to the new session's detail page

## Tasks / Subtasks

- [x] Task 1: Implement delete session API endpoint (AC: 1, 2, 3)
  - [x] 1.1 Create `src/app/api/quoting/[id]/route.ts` DELETE handler
  - [x] 1.2 Verify cascade delete of quote_results via foreign key constraint
  - [x] 1.3 Return `{ data: { deleted: true } }` on success
  - [x] 1.4 Handle not found (404) and unauthorized (401) errors

- [x] Task 2: Implement duplicate session API endpoint (AC: 4, 5)
  - [x] 2.1 Create `src/app/api/quoting/[id]/duplicate/route.ts` POST handler
  - [x] 2.2 Fetch original session and verify access (RLS)
  - [x] 2.3 Create new session with "(Copy)" suffix and copied client_data
  - [x] 2.4 Return new session data with ID for redirect

- [x] Task 3: Add delete functionality to QuoteSessionCard action menu (AC: 1, 2, 3) [Pre-existing]
  - [x] 3.1 Add "Delete" option to DropdownMenu in `src/components/quoting/quote-session-card.tsx`
  - [x] 3.2 Create AlertDialog for delete confirmation
  - [x] 3.3 Wire up delete mutation to API endpoint
  - [x] 3.4 Show toast notification on success
  - [x] 3.5 Remove session from list with optimistic update

- [x] Task 4: Add duplicate functionality to QuoteSessionCard action menu (AC: 4, 5) [Pre-existing]
  - [x] 4.1 Add "Duplicate" option to DropdownMenu in `src/components/quoting/quote-session-card.tsx`
  - [x] 4.2 Wire up duplicate mutation to API endpoint
  - [x] 4.3 Handle loading state during duplication
  - [x] 4.4 Navigate to new session on success using router.push

- [x] Task 5: Update useQuoteSessions hook for delete/duplicate mutations (AC: all) [Pre-existing]
  - [x] 5.1 Add `deleteSession` mutation function
  - [x] 5.2 Add `duplicateSession` mutation function
  - [x] 5.3 Implement optimistic update for delete (remove from cache)
  - [x] 5.4 Invalidate query cache on duplicate (or add to cache)

- [x] Task 6: Write unit tests for service layer (AC: all)
  - [x] 6.1 Create `__tests__/lib/quoting/delete-duplicate.test.ts`
  - [x] 6.2 Test delete session removes associated quote_results
  - [x] 6.3 Test duplicate creates copy with "(Copy)" suffix
  - [x] 6.4 Test duplicate preserves client_data but not quote_results
  - [x] 6.5 Test duplicate sets status to "draft"

- [x] Task 7: Write component tests (AC: 1, 4)
  - [x] 7.1 Test AlertDialog renders with correct message for delete
  - [x] 7.2 Test confirmation triggers delete callback
  - [x] 7.3 Test cancel closes dialog without action
  - [x] 7.4 Test duplicate option triggers duplicate callback

- [x] Task 8: Write E2E tests (AC: all)
  - [x] 8.1 Create `__tests__/e2e/quoting/delete-duplicate.spec.ts`
  - [x] 8.2 Test delete flow: action menu → confirm → session removed
  - [x] 8.3 Test cancel delete: dialog closes, session remains
  - [x] 8.4 Test duplicate flow: action menu → duplicate → redirect to new session
  - [x] 8.5 Test duplicated session has "(Copy)" suffix and preserved data

- [x] Task 9: Verify build and run full test suite (AC: all)
  - [x] 9.1 Run `npm run build` - no type errors
  - [x] 9.2 Run `npm run test` - all quoting tests pass (117/117)
  - [x] 9.3 Verify existing Q2 tests still pass

## Dev Notes

### Implementation Approach

This story implements the delete and duplicate operations for quote sessions, completing Epic Q2's session management capabilities. The action menu (⋮) was established in Q2.1; this story wires up the Delete and Duplicate menu items to functional endpoints.

### Architecture Patterns

**Delete Operation:**
- Uses soft confirmation (AlertDialog) before hard delete
- Cascade delete handles `quote_results` cleanup via database constraint
- Optimistic UI update removes session from list immediately
- Toast notification confirms successful deletion

**Duplicate Operation:**
- Server-side duplication ensures data integrity
- New session gets "(Copy)" suffix appended to prospect_name
- Preserves `quote_type` and `client_data` JSONB
- Does NOT copy `quote_results` (quotes must be re-entered)
- New session starts with `status: 'draft'`
- Immediate redirect to new session's detail page

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| DELETE | `/api/quoting/[id]` | Delete session and cascade delete results |
| POST | `/api/quoting/[id]/duplicate` | Create copy of session |

### Error Handling

| Scenario | Response | UI Action |
|----------|----------|-----------|
| Session not found | 404 | Toast error, no list change |
| Unauthorized | 403 | Toast error, redirect to login |
| Delete failed | 500 | Toast error, keep in list |
| Duplicate failed | 500 | Toast error, stay on page |

### Project Structure Notes

- Delete handler extends existing `src/app/api/quoting/[id]/route.ts` (may already have GET/PATCH)
- Duplicate route is new: `src/app/api/quoting/[id]/duplicate/route.ts`
- AlertDialog component from shadcn/ui (already installed)
- Uses existing toast pattern with Sonner

### References

- [Source: docs/features/quoting/architecture.md#API-Contracts]
- [Source: docs/features/quoting/epics.md#Story-Q2.5]
- [Source: docs/sprint-artifacts/epics/epic-Q2/tech-spec.md#Story-Q2.5]
- [Source: docs/features/quoting/prd.md#FR4-FR5]

### Learnings from Previous Story

**From Story Q2-4 (Status: done)**

- **StatusBadge Component**: Available at `src/components/quoting/status-badge.tsx` - use for displaying "Draft" status on duplicated session
- **calculateSessionStatus()**: Located in `src/lib/quoting/service.ts:34-72` - new duplicated sessions will compute as "draft" automatically
- **Test Infrastructure**: 18 quoting service tests exist in `__tests__/lib/quoting/service.test.ts` - extend for delete/duplicate
- **E2E Pattern**: E2E tests in `__tests__/e2e/quoting/quote-session-status.spec.ts` demonstrate quoting E2E patterns
- **Validation Only Story**: Q2-4 was validation/testing; actual CRUD operations were built in Q2.1-Q2.3

[Source: docs/sprint-artifacts/epics/epic-Q2/stories/Q2-4-quote-session-status/story.md#Dev-Agent-Record]

### Existing Infrastructure to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| DropdownMenu | Already in QuoteSessionCard | Add Delete/Duplicate items |
| AlertDialog | shadcn/ui | Delete confirmation |
| toast (Sonner) | Existing pattern | Success/error notifications |
| useQuoteSessions | `src/hooks/quoting/use-quote-sessions.ts` | Add mutations |
| Router | next/navigation | Navigate to duplicated session |

### FRs Addressed

- **FR4:** Users can delete quote sessions they no longer need
- **FR5:** Users can duplicate an existing quote session as a starting point for a new quote

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-Q2/stories/Q2-5-delete-duplicate-sessions/Q2-5-delete-duplicate-sessions.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build initially failed due to using non-existent `profiles` table; fixed to use `users` table per existing pattern in `/api/quoting/route.ts`

### Completion Notes List

- **Key Finding**: UI (Tasks 3-5) was already fully implemented in previous stories - hooks, handlers, AlertDialog, toast notifications all wired and functional
- **Backend Implementation**: Added DELETE handler to existing route file; created new duplicate endpoint
- **Service Layer**: Added `deleteQuoteSession` and `duplicateQuoteSession` functions to `src/lib/quoting/service.ts`
- **Test Results**: 117 quoting tests pass; 13 new tests added for delete/duplicate functionality

### File List

**Modified:**
- `src/app/api/quoting/[id]/route.ts` - Added DELETE handler (AC-Q2.5-2, AC-Q2.5-3)
- `src/lib/quoting/service.ts` - Added `deleteQuoteSession`, `duplicateQuoteSession` functions
- `__tests__/components/quoting/quote-session-card.test.tsx` - Updated header comments for Q2.5

**Created:**
- `src/app/api/quoting/[id]/duplicate/route.ts` - POST handler for session duplication (AC-Q2.5-4, AC-Q2.5-5)
- `__tests__/lib/quoting/delete-duplicate.test.ts` - 13 service layer tests
- `__tests__/components/quoting/delete-confirmation.test.tsx` - 9 AlertDialog tests
- `__tests__/e2e/quoting/delete-duplicate.spec.ts` - E2E tests for delete/duplicate flows

### Change Log

- 2025-12-11: Story Q2.5 drafted - Delete and Duplicate Quote Sessions implementation plan
- 2025-12-11: Story Q2.5 implemented - DELETE handler, duplicate endpoint, service functions, and comprehensive test coverage
- 2025-12-11: Senior Developer Review - APPROVED

## Senior Developer Review (AI)

### Review Metadata

- **Reviewer:** Sam
- **Date:** 2025-12-11
- **Outcome:** ✅ **APPROVED**
- **Agent Model:** Claude Opus 4.5 (claude-opus-4-5-20251101)

### Summary

Story Q2.5 implements delete and duplicate functionality for quote sessions. All 5 acceptance criteria are fully implemented with evidence. All 14 tasks verified complete. Build passes, 117 quoting tests pass. Code follows established patterns and architectural constraints.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-Q2.5-1 | Delete confirmation dialog displays message | ✅ IMPLEMENTED | `src/app/(dashboard)/quoting/page.tsx:139-141` |
| AC-Q2.5-2 | Cascade delete session and quote_results | ✅ IMPLEMENTED | `src/lib/quoting/service.ts:247-268` |
| AC-Q2.5-3 | Toast "Quote session deleted", removed from list | ✅ IMPLEMENTED | `page.tsx:72-73`, `use-quote-sessions.ts:173-175` |
| AC-Q2.5-4 | Duplicate with "(Copy)" suffix, same type, copied data | ✅ IMPLEMENTED | `src/lib/quoting/service.ts:283-323` |
| AC-Q2.5-5 | Navigate to new session after duplicate | ✅ IMPLEMENTED | `src/app/(dashboard)/quoting/page.tsx:86` |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Description | Marked | Verified | Evidence |
|------|-------------|--------|----------|----------|
| 1.1 | DELETE handler | [x] | ✅ | `route.ts:86-141` |
| 1.2 | Cascade delete | [x] | ✅ | FK constraint per Q1 |
| 1.3 | Return { deleted: true } | [x] | ✅ | `route.ts:132` |
| 1.4 | 404/401 errors | [x] | ✅ | `route.ts:114-125` |
| 2.1 | Duplicate POST handler | [x] | ✅ | `duplicate/route.ts:43-102` |
| 2.2 | Fetch + RLS verify | [x] | ✅ | `service.ts:289-301` |
| 2.3 | "(Copy)" suffix | [x] | ✅ | `service.ts:309` |
| 2.4 | Return new session | [x] | ✅ | `duplicate/route.ts:93` |
| 3-5 | UI wiring | [x] | ✅ | Pre-existing from Q2.1-Q2.3 |
| 6.1-6.5 | Service tests | [x] | ✅ | `delete-duplicate.test.ts` (13 tests) |
| 7.1-7.4 | Component tests | [x] | ✅ | `delete-confirmation.test.tsx` (9 tests) |
| 8.1-8.5 | E2E tests | [x] | ✅ | `delete-duplicate.spec.ts` |
| 9.1 | Build passes | [x] | ✅ | Build successful |
| 9.2-9.3 | Tests pass | [x] | ✅ | 117 quoting tests pass |

**Summary: 14 of 14 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Key Findings

**No High or Medium Severity Issues**

**Advisory Notes:**
- Note: Service layer relies on Supabase RLS for authorization (correct pattern, not a finding)
- Note: UI implementation was already complete from previous stories - this story added backend support

### Test Coverage and Gaps

| Test Type | Count | Coverage |
|-----------|-------|----------|
| Service layer (delete/duplicate) | 13 tests | All edge cases covered |
| Component (AlertDialog) | 9 tests | Confirmation behavior verified |
| E2E (flows) | 5 scenarios | Delete/duplicate journeys |
| **Total Quoting Tests** | **117** | All passing |

No test gaps identified for story scope.

### Architectural Alignment

- ✅ API routes follow `successResponse`/`errorResponse` helper pattern
- ✅ Service layer separation maintained (`deleteQuoteSession`, `duplicateQuoteSession`)
- ✅ Hook pattern consistent (`useQuoteSessions` with optimistic updates)
- ✅ Matches tech-spec API contracts for DELETE and POST /duplicate
- ✅ RLS policies handle agency-scoped authorization

### Security Notes

- ✅ Authentication required for all endpoints (verified via `getUser()`)
- ✅ Authorization via Supabase RLS policies (agency scoping)
- ✅ No sensitive data exposed in API responses
- ✅ Delete confirmation prevents accidental data loss
- ✅ No injection risks identified

### Action Items

**Code Changes Required:**
None - all acceptance criteria met, all tasks verified.

**Advisory Notes:**
- Note: Consider adding rate limiting for delete operations in production (future enhancement)
