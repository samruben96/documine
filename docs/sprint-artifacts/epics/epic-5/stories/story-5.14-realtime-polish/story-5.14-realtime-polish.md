# Story 5.14: Realtime Updates Polish

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.14
**Status:** Done
**Created:** 2025-12-02
**Prerequisites:** Story 5.12 (Processing Progress Visualization)
**Type:** Bug Fix / Polish

---

## User Story

As a **user managing documents**,
I want **realtime updates to be smooth and consistent**,
So that **the UI reflects changes immediately without visual glitches or requiring page refresh**.

---

## Background & Context

### Current Issues (Discovered during Story 5.12 testing)

1. **Progress indicator jumps erratically** - Progress shows 100%, then jumps back, appears inconsistent
2. **Delete document requires page refresh** - After deleting a document, it remains in the sidebar until manual refresh

### Root Cause Analysis

**Issue 1: Progress jumping**
- Multiple data sources updating at different rates (realtime, polling, simulated progress)
- Simulated parsing progress may conflict with actual server progress updates
- Need to prioritize server data over simulated/estimated data

**Issue 2: Delete not reflecting in UI**
- Similar to the earlier status update issue
- DELETE events from realtime subscription may not be firing
- `documents` table realtime enabled but DELETE events need verification

---

## Acceptance Criteria

### AC-5.14.1: Smooth Progress Updates
**Given** a document is processing
**When** progress updates arrive from multiple sources
**Then** progress only increases (never jumps backward) and transitions smoothly

### AC-5.14.2: Delete Reflects Immediately
**Given** I delete a document
**When** the delete operation completes
**Then** the document is removed from the sidebar without page refresh

### AC-5.14.3: No Visual Glitches
**Given** the document list is displayed
**When** realtime events arrive (INSERT, UPDATE, DELETE)
**Then** the UI updates smoothly without flicker or duplicate entries

---

## Technical Approach

### Fix 1: Progress Update Logic
- Add monotonic progress constraint (never decrease)
- Prioritize server `progress_data` over simulated progress
- Clear simulated progress when server data arrives
- Add debouncing/throttling if updates are too frequent

### Fix 2: Delete Realtime Events
- Verify DELETE events are being received from Supabase realtime
- Check RLS policies allow DELETE event propagation
- Ensure `handleRealtimeChange` DELETE handler is working
- Add optimistic UI update on delete (remove immediately, restore on error)

### Fix 3: General Polish
- Review all realtime handlers for edge cases
- Add proper cleanup on component unmount
- Consider adding visual transition animations

---

## Implementation Tasks

- [x] Debug progress jumping - identify source of backward jumps
- [x] Implement monotonic progress constraint
- [x] Verify DELETE realtime events are working
- [x] Add optimistic delete (remove from UI immediately)
- [x] Test all realtime scenarios with Playwright
- [x] Ensure no console errors

---

## Definition of Done

- [x] Progress bar only increases, never jumps backward
- [x] Delete removes document from sidebar immediately
- [x] No visual glitches during realtime updates
- [x] No console errors
- [x] Playwright tests pass
- [x] Code review passed

---

## Related Stories

- Story 5.12: Processing Progress Visualization (parent feature)
- Story 4.4: Delete Documents (original delete implementation)

---

## Notes

These are polish issues discovered during Story 5.12 testing. The core functionality works but the UX needs refinement for a production-quality experience.

---

## Dev Agent Record

### Debug Log (2025-12-02)

**Audit findings:**
1. `useProcessingProgress` subscribes correctly when `documentIds.length > 0`, cleans up on unmount
2. `useDocumentStatus` handles DELETE events correctly (line 192-197)
3. Progress jumping caused by simulated progress overriding server data
4. Connection indicator only showed `useDocumentStatus.isConnected`, not combined state

### Implementation Summary

**AC-5.14.1/5.14.3 (Monotonic progress):**
- Added `progressSourceRef` to track which documents have received server data
- Simulated progress polling now skips documents with `source === 'server'`
- Added monotonic constraint in `updateProgressForJob` - only update if `total_progress` increased

**AC-5.14.4/5.14.5 (Optimistic delete):**
- Added `onOptimisticDelete` and `onRestoreDocument` callbacks to `DocumentList`
- `DeleteDocumentModal` now calls `onOptimisticDelete` immediately, closes modal, then calls server
- On server error, calls `onError` to restore document to state
- Parent `DocumentsPage` provides the actual state update callbacks

**AC-5.14.7 (Connection indicator):**
- Added `isProgressConnected` from `useProcessingProgress` hook
- Combined with `isConnected` from `useDocumentStatus` for accurate indicator

**AC-5.14.9 (Tab visibility):**
- Not implemented (SHOULD priority) - existing cleanup on unmount is sufficient for MVP

### Completion Notes

All core acceptance criteria implemented. Build passes, 821 tests pass. Ready for code review.

### File List

| File | Change |
|------|--------|
| `src/hooks/use-processing-progress.ts` | Added `progressSourceRef` tracking, monotonic constraint, skip simulation for server-sourced docs |
| `src/hooks/use-document-status.ts` | No changes (DELETE handling already worked) |
| `src/components/documents/document-list.tsx` | Added `onOptimisticDelete`/`onRestoreDocument` props, `documentToRestore` state, optimistic handlers |
| `src/components/documents/delete-document-modal.tsx` | Added `onOptimisticDelete`/`onError` props, optimistic delete flow |
| `src/app/(dashboard)/documents/page.tsx` | Added `handleOptimisticDelete`/`handleRestoreDocument`, combined `isAnyChannelConnected` |

### Change Log

- 2025-12-02: Story implementation complete - AC-5.14.1 through AC-5.14.7 implemented

---

## Code Review

**Reviewer:** Dev Agent (Amelia)
**Date:** 2025-12-02
**Outcome:** ✅ APPROVED

### AC Validation

| AC | Requirement | File:Line | Status |
|----|-------------|-----------|--------|
| AC-5.14.1 | Monotonic progress | `use-processing-progress.ts:186-190` | ✅ |
| AC-5.14.2 | Delete reflects immediately | `delete-document-modal.tsx:51-53` | ✅ |
| AC-5.14.3 | No visual glitches | Progress source tracking | ✅ |
| AC-5.14.4 | Optimistic delete flow | Modal closes before server call | ✅ |
| AC-5.14.5 | Restore on failure | `page.tsx:285-294` | ✅ |
| AC-5.14.7 | Connection indicator | `page.tsx:73` combined check | ✅ |
| AC-5.14.9 | Tab visibility | Deferred (SHOULD priority) | ⏭️ |

### Code Quality

**Strengths:**
- Clean separation of concerns with callbacks
- TypeScript typing throughout
- JSDoc comments reference AC IDs for traceability
- Proper ref cleanup (`progressSourceRef`, `jobMetadataRef`)
- Defensive coding (null checks, duplicate prevention)

**Minor Observations (non-blocking):**
- Edge case: If both realtime AND polling fail (MAX_CONSECUTIVE_ERRORS), UI could become stale. Current behavior (stop polling after 3 errors) is reasonable for MVP.

### Verification

- Build: ✅ Passes
- Tests: ✅ 821 tests pass
- Console errors: ✅ None

### Recommendation

**APPROVED** - Implementation correctly addresses all acceptance criteria. Ready for `*story-done`.

---

### Completion Notes

**Completed:** 2025-12-02
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing
