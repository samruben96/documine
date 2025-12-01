# Story 3.6: Settings UX Enhancements

Status: done

## Story

As an **agency admin**,
I want the Settings page to feel responsive and polished,
So that managing my team feels effortless and professional.

## Vision

> The Settings page should feel like a *conversation*, not a *command line*. Every action gives immediate feedback. Every state is clearly communicated. Admins feel powerful; members feel informed. No one feels confused.

## Acceptance Criteria

### AC-3.6.1: Optimistic Role Changes
- When admin changes a user's role, UI updates immediately
- Loading indicator shown inline (not blocking)
- On success: Change persists, toast confirms
- On error: UI reverts to previous state, error toast shown
- User never waits for server to see visual feedback

### AC-3.6.2: Smooth Invite Refresh
- After successful invitation, team list refreshes without full page reload
- Scroll position preserved
- New invitation appears in pending list seamlessly
- Uses `router.refresh()` instead of `window.location.reload()`

### AC-3.6.3: Contextual Remove Button
- Desktop: Remove button appears on row hover (reduces visual clutter)
- Mobile/Touch: Remove button always visible (no hover on touch devices)
- Disabled state for current user's row clearly communicated
- Smooth fade-in transition on hover

### AC-3.6.4: Helpful Empty States
- When no pending invitations exist:
  - Show friendly message: "No pending invitations"
  - Include subtle prompt: "Invite team members to get started"
  - Optional: Small illustration or icon for visual interest
- Empty state maintains visual consistency with populated state

### AC-3.6.5: Skeleton Loading States
- Initial page load shows skeleton shimmer for team member rows
- Skeleton matches actual content layout (name, email, role, date columns)
- Uses shadcn/ui `<Skeleton>` component for consistency
- Replaces any full-screen spinners with contextual loading

### AC-3.6.6: Subtle Success Animations
- Role change: Brief highlight/pulse on updated row
- Member removal: Smooth fade-out animation before row disappears
- Invitation sent: New row slides in or fades in
- Animations are subtle (200-300ms), not distracting

### AC-3.6.7: View-Only Mode Indicator
- Non-admin members see clear "View only" indicator on Team section
- Indicator explains context: "Contact an admin to manage team members"
- Uses muted styling (not alarming, just informative)
- Positioned near section header for visibility

## Tasks / Subtasks

- [x] **Task 1: Implement optimistic role updates** (AC: 3.6.1)
  - [x] Refactor `handleRoleChange` in `team-tab.tsx` to use `useOptimistic` or local state pattern
  - [x] Update UI immediately on change, before server response
  - [x] Handle error case: revert to previous role value
  - [x] Show inline loading indicator during server call
  - [x] Maintain existing toast notifications

- [x] **Task 2: Replace page reload with router refresh** (AC: 3.6.2)
  - [x] Import `useRouter` from `next/navigation` in `team-tab.tsx`
  - [x] Replace `window.location.reload()` with `router.refresh()`
  - [x] Test that new invitations appear without losing scroll position
  - [x] Verify client state (modals, form data) is preserved

- [x] **Task 3: Add hover-reveal remove button** (AC: 3.6.3)
  - [x] Add CSS for opacity transition on remove button
  - [x] Show button on row hover (desktop)
  - [x] Detect touch device and always show button (mobile fallback)
  - [x] Ensure disabled state styling remains clear
  - [x] Test on both desktop and mobile viewports

- [x] **Task 4: Create empty invitation state** (AC: 3.6.4)
  - [x] Design empty state layout within existing card structure
  - [x] Add message: "No pending invitations"
  - [x] Add subtle CTA or helper text
  - [x] Ensure visual consistency with populated table view

- [x] **Task 5: Add skeleton loading states** (AC: 3.6.5)
  - [x] Import `Skeleton` from shadcn/ui (or add if not installed)
  - [x] Create skeleton row component matching team member row layout
  - [x] Show skeleton during initial data fetch
  - [x] Replace any existing spinner-based loading with skeletons

- [x] **Task 6: Implement subtle animations** (AC: 3.6.6)
  - [x] Add CSS transitions for row state changes
  - [x] Highlight effect on role change (brief background pulse)
  - [x] Fade-out on member removal
  - [x] Fade-in for new content (invitations)
  - [x] Keep animations under 300ms for snappy feel

- [x] **Task 7: Add view-only mode indicator** (AC: 3.6.7)
  - [x] Add conditional banner/badge for non-admin users
  - [x] Position near Team Members card header
  - [x] Use muted/info styling (not warning/error)
  - [x] Include brief explanation text

- [x] **Task 8: Testing and verification** (All ACs)
  - [x] Verify all animations work smoothly
  - [x] Test optimistic updates with simulated slow/failed responses
  - [x] Test on mobile viewport for touch-friendly behavior
  - [x] Verify existing tests still pass
  - [x] Run build to check for type errors

## Dev Notes

### Technical Approach

**Optimistic Updates (AC-3.6.1):**
React 19 introduced `useOptimistic` hook, but we can also achieve this with local state management. Pattern:
```typescript
const [optimisticRole, setOptimisticRole] = useState(member.role);

const handleRoleChange = (newRole) => {
  const previousRole = optimisticRole;
  setOptimisticRole(newRole); // Immediate UI update

  startTransition(async () => {
    const result = await changeUserRole(member.id, newRole);
    if (!result.success) {
      setOptimisticRole(previousRole); // Revert on error
      toast.error(result.error);
    }
  });
};
```

**Router Refresh (AC-3.6.2):**
```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();

// Instead of: window.location.reload()
router.refresh(); // Revalidates server components, preserves client state
```

**Touch Detection (AC-3.6.3):**
```typescript
// CSS-based approach using hover media query
@media (hover: hover) {
  .remove-button { opacity: 0; }
  .row:hover .remove-button { opacity: 1; }
}
@media (hover: none) {
  .remove-button { opacity: 1; } /* Always visible on touch */
}
```

**Skeleton Component (AC-3.6.5):**
shadcn/ui provides `<Skeleton>` component. If not installed:
```bash
npx shadcn@latest add skeleton
```

### Dependencies
- No new packages required
- shadcn/ui Skeleton component (may need to add)
- Existing: React 19, Next.js 16, Tailwind CSS

### Files to Modify
- `src/components/settings/team-tab.tsx` (primary changes)
- `src/app/(dashboard)/settings/page.tsx` (loading states)
- Possibly add: `src/components/settings/team-member-skeleton.tsx`

### Out of Scope
- Changes to server actions (already optimized in 3.3)
- Changes to modal components (already polished)
- New features or functionality (this is polish only)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/3-6-settings-ux-enhancements.context.xml

### Agent Model Used

- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Used React 19's `useOptimistic` hook for optimistic role updates
- Used CSS media queries `@media (hover: hover/none)` for touch detection
- Used Tailwind's `group` class for hover-reveal pattern
- Used `duration-300` for all animations to stay under 300ms

### Completion Notes List

- ✅ AC-3.6.1: Implemented optimistic role updates using `useOptimistic` hook. UI updates immediately on role change, reverts on error via router.refresh()
- ✅ AC-3.6.2: Replaced `window.location.reload()` with `router.refresh()` in handleInviteSuccess
- ✅ AC-3.6.3: Remove button hidden by default on desktop (`[@media(hover:hover)]:opacity-0`), appears on row hover, always visible on touch devices
- ✅ AC-3.6.4: Empty invitation state shows centered icon, "No pending invitations" message, and "Invite team members to get started" prompt
- ✅ AC-3.6.5: Created TeamTabSkeleton component with shadcn/ui Skeleton matching team table layout, wrapped TeamTab in Suspense
- ✅ AC-3.6.6: Added 300ms transitions for row opacity/scale, green highlight pulse on role change success, fade-out on member removal
- ✅ AC-3.6.7: Non-admin users see "View only" badge with Eye icon next to title, plus "Contact an admin to manage team members" in description
- All 280 tests pass
- Build succeeds with no TypeScript errors

### File List

**Modified:**
- documine/src/components/settings/team-tab.tsx
- documine/src/app/(dashboard)/settings/page.tsx

**Created:**
- documine/src/components/settings/team-tab-skeleton.tsx
- documine/src/components/ui/skeleton.tsx (via shadcn/ui)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-28 | Party Mode (Bob, Sally, John, Winston, Amelia, Mary, Murat) | Initial story draft via collaborative party mode session |
| 2025-11-29 | Amelia (Dev Agent) | Implemented all 7 ACs: optimistic updates, router.refresh(), hover-reveal, empty states, skeleton loading, animations, view-only indicator |
| 2025-11-29 | Senior Developer Review (AI) | Code review APPROVED - all ACs verified with evidence |

## Senior Developer Review (AI)

**Reviewer:** Sam
**Date:** 2025-11-29
**Outcome:** ✅ **APPROVED**

### Summary

Solid UX polish implementation. All 7 acceptance criteria verified with file:line evidence. React 19 useOptimistic hook used correctly, CSS media queries for touch detection, proper skeleton loading architecture. 280 tests pass, build succeeds.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|---|---|---|---|
| 3.6.1 | Optimistic Role Changes | ✅ IMPLEMENTED | `team-tab.tsx:85-89,102,257-259` |
| 3.6.2 | Smooth Invite Refresh | ✅ IMPLEMENTED | `team-tab.tsx:4,171-174` |
| 3.6.3 | Contextual Remove Button | ✅ IMPLEMENTED | `team-tab.tsx:276-285` |
| 3.6.4 | Helpful Empty States | ✅ IMPLEMENTED | `team-tab.tsx:312-319` |
| 3.6.5 | Skeleton Loading States | ✅ IMPLEMENTED | `page.tsx:133`, `team-tab-skeleton.tsx` |
| 3.6.6 | Subtle Success Animations | ✅ IMPLEMENTED | `team-tab.tsx:109-111,127-138,231-235` |
| 3.6.7 | View-Only Mode Indicator | ✅ IMPLEMENTED | `team-tab.tsx:184-199` |

**Summary:** 7 of 7 ACs implemented

### Task Completion Validation

| Task | Status | Evidence |
|---|---|---|
| Task 1: Optimistic role updates | ✅ VERIFIED | `team-tab.tsx:85-120` |
| Task 2: Router refresh | ✅ VERIFIED | `team-tab.tsx:4,171-174` |
| Task 3: Hover-reveal button | ✅ VERIFIED | `team-tab.tsx:276-285` |
| Task 4: Empty invitation state | ✅ VERIFIED | `team-tab.tsx:312-319` |
| Task 5: Skeleton loading | ✅ VERIFIED | `page.tsx:6,133`, `team-tab-skeleton.tsx` |
| Task 6: Subtle animations | ✅ VERIFIED | `team-tab.tsx:231-235` |
| Task 7: View-only indicator | ✅ VERIFIED | `team-tab.tsx:184-199` |
| Task 8: Testing & verification | ✅ VERIFIED | 280 tests pass, build succeeds |

**Summary:** 8 of 8 tasks verified complete

### Advisory Notes

- Note: Consider adding unit tests for optimistic update behavior in future sprint
- Note: Unused `previousRole` variable at line 96 could be removed for clarity (useOptimistic handles rollback via re-render)

### Action Items

None - APPROVED for merge
