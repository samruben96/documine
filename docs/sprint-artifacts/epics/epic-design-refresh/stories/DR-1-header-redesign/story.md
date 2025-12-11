# Story DR.1: Header Redesign

Status: done

## Story

As a **docuMINE user**,
I want **a clean, minimal header with the new logo treatment**,
So that **the app feels more polished and professional**.

## Acceptance Criteria

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.1.1 | Header displays blue square logo (w-8 h-8, bg-primary, rounded-lg) with "dM" text inside |
| DR.1.2 | "docuMINE" text appears next to logo with font-semibold text-lg styling |
| DR.1.3 | Logo + text links to `/dashboard` |
| DR.1.4 | Notification bell icon appears on right side of header |
| DR.1.5 | User avatar circle displays user initials (derived from email) |
| DR.1.6 | Clicking avatar opens dropdown menu with "Logout" option |
| DR.1.7 | Horizontal navigation links are removed from header |
| DR.1.8 | Header height is h-14 (56px) |
| DR.1.9 | Header has white background with slate-200 bottom border |
| DR.1.10 | Mobile hamburger menu opens sidebar (not separate Sheet menu) |

## Tasks / Subtasks

- [x] Task 1: Create logo icon component (AC: DR.1.1, DR.1.2, DR.1.3)
  - [x] 1.1 Add blue square container (w-8 h-8, bg-primary, rounded-lg)
  - [x] 1.2 Add "dM" text inside with white color and bold styling
  - [x] 1.3 Add "docuMINE" text next to logo (font-semibold text-lg)
  - [x] 1.4 Wrap in Link component pointing to `/dashboard`

- [x] Task 2: Add notification bell placeholder (AC: DR.1.4)
  - [x] 2.1 Import Bell icon from lucide-react
  - [x] 2.2 Add ghost button with Bell icon on right side of header
  - [x] 2.3 Add aria-label="Notifications (coming soon)" for accessibility

- [x] Task 3: Create user avatar with dropdown (AC: DR.1.5, DR.1.6)
  - [x] 3.1 Create helper function to derive initials from user email
  - [x] 3.2 Add avatar circle (w-8 h-8, rounded-full, bg-slate-200)
  - [x] 3.3 Display initials inside avatar (text-sm font-medium text-slate-600)
  - [x] 3.4 Import DropdownMenu components from @radix-ui
  - [x] 3.5 Wrap avatar in DropdownMenuTrigger
  - [x] 3.6 Add DropdownMenuContent with Logout option
  - [x] 3.7 Wire up existing handleLogout function to dropdown item

- [x] Task 4: Remove horizontal navigation (AC: DR.1.7)
  - [x] 4.1 Remove NavLinks component usage from desktop nav
  - [x] 4.2 Remove navItems array (will move to sidebar in DR.2)
  - [x] 4.3 Remove the desktop `<nav>` element with navigation links

- [x] Task 5: Update header styling (AC: DR.1.8, DR.1.9)
  - [x] 5.1 Ensure header height is h-14
  - [x] 5.2 Update border class to border-b border-slate-200
  - [x] 5.3 Ensure white background (bg-white)
  - [x] 5.4 Update dark mode classes for consistency

- [x] Task 6: Update mobile menu behavior (AC: DR.1.10)
  - [x] 6.1 Remove right-side Sheet menu for mobile navigation
  - [x] 6.2 Keep SidebarToggle for opening left-side sidebar
  - [x] 6.3 Update hamburger to trigger sidebar (prepare for DR.2 integration)
  - [x] 6.4 Remove mobile Sheet trigger button and SheetContent

- [x] Task 7: Write unit tests
  - [x] 7.1 Test logo renders with correct classes
  - [x] 7.2 Test logo links to /dashboard
  - [x] 7.3 Test bell icon is present with correct aria-label
  - [x] 7.4 Test avatar displays initials from email
  - [x] 7.5 Test dropdown opens on avatar click
  - [x] 7.6 Test logout option is present in dropdown
  - [x] 7.7 Test navigation links are NOT present

- [x] Task 8: Update E2E tests
  - [x] 8.1 Update any tests that relied on header navigation links
  - [x] 8.2 Add test for avatar dropdown logout flow
  - [x] 8.3 Test header renders correctly at mobile breakpoint

## Dev Notes

### Component Changes

**File:** `src/components/layout/header.tsx`

**Current Implementation:**
- Text-only "docuMINE" logo
- Horizontal nav links (Documents, Compare, AI Buddy, Reporting, Settings)
- Logout button in nav
- Mobile hamburger opens right-side Sheet

**Target Implementation:**
```tsx
<header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
  {/* Left: Mobile menu trigger + Logo */}
  <div className="flex items-center gap-3">
    <SidebarToggle className="lg:hidden" />
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">dM</span>
      </div>
      <span className="font-semibold text-lg">docuMINE</span>
    </Link>
  </div>

  {/* Right: Bell + Avatar */}
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" className="rounded-full">
      <Bell className="h-5 w-5 text-slate-500" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 rounded-full bg-slate-200 p-0">
          <span className="text-sm font-medium text-slate-600">{userInitials}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
```

### User Initials Derivation

```typescript
function getUserInitials(email: string): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}
```

### Dependencies

All required dependencies are already installed:
- `lucide-react` (Bell, LogOut icons)
- `@radix-ui/react-dropdown-menu` (via shadcn/ui)

### Dark Mode Considerations

Ensure dark mode variants are maintained:
- `dark:bg-slate-900` for header background
- `dark:border-slate-800` for bottom border
- `dark:text-slate-400` for muted text

### Project Structure Notes

- Header component: `src/components/layout/header.tsx` (existing, refactor in place)
- DropdownMenu: `src/components/ui/dropdown-menu.tsx` (already exists via shadcn/ui)
- No new files needed for this story

### References

- [Source: docs/sprint-artifacts/epics/epic-design-refresh/tech-spec.md#DR.1 - Header Redesign]
- [Source: docs/sprint-artifacts/epics/epic-design-refresh/epic.md#Story DR.1]
- [Source: docs/features/quoting/mockups/quoting-mockup.html - Header design reference]
- [Source: docs/architecture/uiux-architecture.md - Layout Architecture]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-design-refresh/stories/DR-1-header-redesign/DR-1-header-redesign.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Implemented new header with blue square logo, "dM" text, "docuMINE" brand
- Added Bell icon button with accessibility aria-label
- Added user avatar dropdown with initials derived from email via `getUserInitials()` helper
- Removed all horizontal navigation (NavLinks, navItems, desktop nav)
- Removed right-side Sheet mobile menu, kept SidebarToggle for left sidebar
- Updated header styling: h-14, bg-white, border-slate-200, dark mode variants
- Created 19 unit tests covering all ACs in `__tests__/components/layout/header.test.tsx`
- Created E2E tests in `__tests__/e2e/header.spec.ts`
- Updated `__tests__/e2e/document-library.spec.ts` to use sidebar navigation instead of header nav

### File List

- `src/components/layout/header.tsx` (modified)
- `__tests__/components/layout/header.test.tsx` (new)
- `__tests__/e2e/header.spec.ts` (new)
- `__tests__/e2e/document-library.spec.ts` (modified)

## Change Log

| Date | Change |
|------|--------|
| 2025-12-10 | Story created and drafted |
| 2025-12-10 | Implementation complete - all tasks done |
| 2025-12-10 | Senior Developer Review notes appended |

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-10

### Outcome
✅ **APPROVED**

All 10 acceptance criteria verified implemented with code evidence. All 8 tasks verified complete. Tests passing. Build successful. No security or code quality issues found.

### Summary

The header redesign story has been fully implemented according to specifications. The new header features:
- Clean logo treatment with blue square "dM" icon + "docuMINE" text
- Notification bell placeholder with accessibility label
- User avatar dropdown with initials derived from email
- Horizontal navigation removed (moved to sidebar in DR.2)
- Proper responsive behavior with SidebarToggle for mobile

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity (Advisory):**
- Note: Mobile hamburger opens existing sidebar; full sidebar navigation will be implemented in DR.2

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| DR.1.1 | Blue square logo (w-8 h-8, bg-primary, rounded-lg) with "dM" | ✅ IMPLEMENTED | header.tsx:70-72 |
| DR.1.2 | "docuMINE" text (font-semibold text-lg) | ✅ IMPLEMENTED | header.tsx:73 |
| DR.1.3 | Logo + text links to /dashboard | ✅ IMPLEMENTED | header.tsx:69 |
| DR.1.4 | Notification bell icon on right side | ✅ IMPLEMENTED | header.tsx:79-86 |
| DR.1.5 | User avatar displays initials | ✅ IMPLEMENTED | header.tsx:90-98, getUserInitials:24-35 |
| DR.1.6 | Avatar dropdown with Logout option | ✅ IMPLEMENTED | header.tsx:88-110 |
| DR.1.7 | Horizontal nav links removed | ✅ IMPLEMENTED | No nav element in header.tsx |
| DR.1.8 | Header height h-14 | ✅ IMPLEMENTED | header.tsx:64 |
| DR.1.9 | White bg + slate-200 border | ✅ IMPLEMENTED | header.tsx:64 |
| DR.1.10 | Mobile hamburger opens sidebar | ✅ IMPLEMENTED | header.tsx:68 (SidebarToggle) |

**Summary: 10 of 10 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Logo icon component | [x] Complete | ✅ VERIFIED | header.tsx:69-74 |
| Task 2: Notification bell | [x] Complete | ✅ VERIFIED | header.tsx:79-86 |
| Task 3: Avatar dropdown | [x] Complete | ✅ VERIFIED | header.tsx:88-110 |
| Task 4: Remove horizontal nav | [x] Complete | ✅ VERIFIED | No NavLinks, no navItems, no nav element |
| Task 5: Header styling | [x] Complete | ✅ VERIFIED | header.tsx:64 |
| Task 6: Mobile menu behavior | [x] Complete | ✅ VERIFIED | SidebarToggle used, Sheet removed |
| Task 7: Unit tests | [x] Complete | ✅ VERIFIED | 19 tests in header.test.tsx |
| Task 8: E2E tests | [x] Complete | ✅ VERIFIED | header.spec.ts, document-library.spec.ts updated |

**Summary: 8 of 8 tasks verified complete, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- **Unit Tests:** 19 tests covering all ACs
  - getUserInitials: 6 tests for edge cases
  - Header component: 13 tests for logo, bell, avatar, dropdown, styling
- **E2E Tests:** Comprehensive coverage
  - Logo display and navigation
  - Avatar dropdown and logout flow
  - Mobile hamburger opens sidebar
  - Document library updated to use sidebar navigation
- **No test gaps identified**

### Architectural Alignment

- ✅ Follows tech spec exactly (tech-spec.md#DR.1)
- ✅ Uses existing shadcn/ui components (DropdownMenu, Button)
- ✅ Maintains dark mode compatibility
- ✅ Accessible (aria-labels on interactive elements)
- ✅ No new dependencies added (lucide-react already in bundle)

### Security Notes

- No security concerns
- User email only used for initials derivation (no sensitive data exposure)
- Logout uses existing secure authentication action
- No XSS vectors introduced

### Best-Practices and References

- [shadcn/ui DropdownMenu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [lucide-react Icons](https://lucide.dev/icons)

### Action Items

**Code Changes Required:**
- None - all acceptance criteria satisfied

**Advisory Notes:**
- Note: Continue with DR.2 (Sidebar Navigation) to complete the navigation redesign
- Note: Mobile bottom nav will be updated in DR.9 to match sidebar
