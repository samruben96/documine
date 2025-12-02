# Story 5.14: Realtime Updates Polish

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.14
**Status:** Drafted
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

- [ ] Debug progress jumping - identify source of backward jumps
- [ ] Implement monotonic progress constraint
- [ ] Verify DELETE realtime events are working
- [ ] Add optimistic delete (remove from UI immediately)
- [ ] Test all realtime scenarios with Playwright
- [ ] Ensure no console errors

---

## Definition of Done

- [ ] Progress bar only increases, never jumps backward
- [ ] Delete removes document from sidebar immediately
- [ ] No visual glitches during realtime updates
- [ ] No console errors
- [ ] Playwright tests pass
- [ ] Code review passed

---

## Related Stories

- Story 5.12: Processing Progress Visualization (parent feature)
- Story 4.4: Delete Documents (original delete implementation)

---

## Notes

These are polish issues discovered during Story 5.12 testing. The core functionality works but the UX needs refinement for a production-quality experience.
