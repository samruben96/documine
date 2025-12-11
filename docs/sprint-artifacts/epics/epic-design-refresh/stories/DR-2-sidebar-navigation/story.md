# Story DR.2: Sidebar Navigation Transformation

Status: done

## Story

As a **docuMINE user**,
I want **a vertical sidebar with icon + text navigation**,
So that **I can easily navigate between all app features**.

## Acceptance Criteria

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.2.1 | Sidebar width is w-56 (224px) on desktop |
| DR.2.2 | Sidebar has white background (bg-white) and slate-200 right border |
| DR.2.3 | Navigation includes: Dashboard, Documents, Chat w/ Docs, Compare, Quoting, AI Buddy, Reporting |
| DR.2.4 | Settings appears at bottom with border-t separator |
| DR.2.5 | Each nav item displays icon (w-5 h-5) + text label (text-sm font-medium) |
| DR.2.6 | Active nav item has bg-blue-50 background and text-primary color |
| DR.2.7 | Hover state on nav items shows bg-slate-100 |
| DR.2.8 | Nav items use: `flex items-center gap-3 px-3 py-2 rounded-lg` |
| DR.2.9 | Sidebar is always visible on desktop (lg: breakpoint) |
| DR.2.10 | Sidebar slides in from left on tablet/mobile when triggered |

## Tasks / Subtasks

- [x] Task 1: Create new navigation sidebar component (AC: DR.2.1, DR.2.2, DR.2.3, DR.2.4)
  - [x] 1.1 Create `AppNavSidebar` component in `src/components/layout/app-nav-sidebar.tsx`
  - [x] 1.2 Define navigation items array with href, label, and icon for each:
    - Dashboard (Home icon) → `/dashboard`
    - Documents (FileText icon) → `/documents`
    - Chat w/ Docs (MessageSquare icon) → `/chat-docs`
    - Compare (BarChart3 icon) → `/compare`
    - Quoting (Calculator icon) → `/quoting`
    - AI Buddy (Bot icon) → `/ai-buddy`
    - Reporting (BarChart2 icon) → `/reporting`
  - [x] 1.3 Implement sidebar container with w-56, bg-white, border-r border-slate-200
  - [x] 1.4 Add Settings nav item at bottom with border-t separator

- [x] Task 2: Implement nav item styling (AC: DR.2.5, DR.2.6, DR.2.7, DR.2.8)
  - [x] 2.1 Use `usePathname()` hook to determine active route
  - [x] 2.2 Apply base styles: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium`
  - [x] 2.3 Apply active state: `bg-blue-50 text-primary` when pathname matches href
  - [x] 2.4 Apply hover state: `hover:bg-slate-100` for inactive items
  - [x] 2.5 Apply icon styling: `w-5 h-5` for all icons, inherit text color

- [x] Task 3: Integrate sidebar into dashboard layout (AC: DR.2.9)
  - [x] 3.1 Update `src/app/(dashboard)/layout.tsx` to include AppNavSidebar
  - [x] 3.2 Ensure sidebar is always visible on `lg:` breakpoint (>=1024px)
  - [x] 3.3 Position sidebar fixed on left, main content offset by sidebar width
  - [x] 3.4 Maintain existing SplitView behavior for document pages

- [x] Task 4: Update mobile/tablet responsive behavior (AC: DR.2.10)
  - [x] 4.1 Keep existing Sheet component for mobile (<640px)
  - [x] 4.2 Update Sheet content to use new navigation items (same as sidebar)
  - [x] 4.3 Keep SidebarToggle in header for tablet/mobile trigger
  - [x] 4.4 Ensure sidebar slides in from left on tablet (640-1024px)

- [x] Task 5: Create Dashboard placeholder page
  - [x] 5.1 Dashboard page already existed at `/dashboard/page.tsx`
  - [x] 5.2 Contains welcome header, tool cards, feature links
  - [x] 5.3 Dashboard links to home icon in nav

- [x] Task 6: Create Quoting placeholder page
  - [x] 6.1 Create `/quoting/page.tsx` with "Coming Soon" message
  - [x] 6.2 Display informative placeholder with expected Quoting feature description

- [x] Task 7: Preserve existing document sidebar behavior
  - [x] 7.1 Keep current `Sidebar` component for document list functionality
  - [x] 7.2 Both coexist: AppNavSidebar in layout, Sidebar in SplitView
  - [x] 7.3 Removed duplicate MobileBottomNav from chat-docs page (now in layout)

- [x] Task 8: Write unit tests
  - [x] 8.1 Test all nav items render with correct icons and labels
  - [x] 8.2 Test active state applies correct classes for each route
  - [x] 8.3 Test hover state classes are present
  - [x] 8.4 Test Settings item appears at bottom with separator
  - [x] 8.5 Test sidebar width is w-56 (224px)
  - [x] 8.6 Test navigation links have correct hrefs

- [x] Task 9: Write E2E tests
  - [x] 9.1 Test navigation between all sidebar items
  - [x] 9.2 Test active state visual feedback on route change
  - [x] 9.3 Test responsive behavior at lg/md/sm breakpoints
  - [x] 9.4 Test mobile Sheet sidebar opens with correct nav items
  - [x] 9.5 Test Quoting placeholder page

## Dev Notes

### Major Architectural Change

This story transforms the sidebar from a **document-only list** to **full app navigation**. This is a significant change that affects the layout architecture.

**Current State:**
- Sidebar shows document list only
- Navigation is in the header (horizontal links)
- Sidebar uses `bg-slate-50` background
- Width is `w-60` (240px)

**Target State:**
- Sidebar becomes primary app navigation (vertical)
- Navigation moves from header to sidebar
- Sidebar uses `bg-white` background
- Width changes to `w-56` (224px)
- Document list remains in split-view context on document pages

### Component Architecture

```
AppNavSidebar (NEW)
├── Navigation section (flex-1)
│   ├── Dashboard nav item
│   ├── Documents nav item
│   ├── Compare nav item
│   ├── Quoting nav item
│   ├── AI Buddy nav item
│   └── Reporting nav item
└── Settings section (with border-t)
    └── Settings nav item

DocumentSidebar (EXISTING, renamed context)
└── Document list for /documents pages
```

### Navigation Items Reference

From mockup (`quoting-mockup.html:106-149`):

```tsx
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/quoting', label: 'Quoting', icon: Calculator },
  { href: '/ai-buddy', label: 'AI Buddy', icon: Bot },
  { href: '/reporting', label: 'Reporting', icon: BarChart2 },
];
```

### Active State Logic

```tsx
import { usePathname } from 'next/navigation';

const pathname = usePathname();

// Check if current path starts with nav item href
// Special case for dashboard: exact match only
const isActive = (href: string) => {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
};
```

### Layout Integration

The dashboard layout needs to accommodate both:
1. **AppNavSidebar** - Always visible on desktop, houses app navigation
2. **DocumentSidebar** - Context-specific for document pages (inside SplitView)

```tsx
// src/app/(dashboard)/layout.tsx
<div className="flex h-screen">
  <AppNavSidebar className="hidden lg:flex" />
  <main className="flex-1">{children}</main>
</div>
```

### Dark Mode Considerations

Ensure dark mode compatibility:
- `dark:bg-slate-900` for sidebar background
- `dark:border-slate-800` for borders
- `dark:text-slate-300` for inactive items
- `dark:hover:bg-slate-800` for hover state
- `dark:bg-slate-800` for active state in dark mode

### Project Structure Notes

- New file: `src/components/layout/app-nav-sidebar.tsx`
- New file: `src/app/(dashboard)/dashboard/page.tsx`
- New file: `src/app/(dashboard)/quoting/page.tsx`
- Modified: `src/app/(dashboard)/layout.tsx`
- Modified: `src/components/layout/sidebar.tsx` (potentially rename/refactor)

### Learnings from Previous Story

**From Story DR-1-header-redesign (Status: done)**

- **Header refactored successfully**: New logo treatment with blue square "dM" icon, avatar dropdown with logout
- **Horizontal nav removed**: Navigation links removed from header, ready to be added to sidebar
- **SidebarToggle preserved**: The hamburger menu in header opens left-side sidebar (ready for this story)
- **Mobile Sheet removed from header**: The right-side Sheet was removed, mobile nav now uses left sidebar
- **Testing approach**: 19 unit tests + E2E tests - follow same comprehensive testing pattern

**Files to reference:**
- `src/components/layout/header.tsx` - See how SidebarToggle is used
- `__tests__/components/layout/header.test.tsx` - Testing patterns to follow

**Key integration point:**
- Header's SidebarToggle already triggers `setIsOpen()` from SidebarContext
- This story needs to ensure the new AppNavSidebar responds to that context

[Source: docs/sprint-artifacts/epics/epic-design-refresh/stories/DR-1-header-redesign/story.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/epics/epic-design-refresh/tech-spec.md#DR.2 - Sidebar Navigation]
- [Source: docs/sprint-artifacts/epics/epic-design-refresh/epic.md#Story DR.2]
- [Source: docs/features/quoting/mockups/quoting-mockup.html - Sidebar design (lines 106-149)]
- [Source: src/components/layout/sidebar.tsx - Current sidebar implementation]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-design-refresh/stories/DR-2-sidebar-navigation/DR-2-sidebar-navigation.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. **AppNavSidebar Component Created**: New `src/components/layout/app-nav-sidebar.tsx` with:
   - 8 navigation items (Dashboard, Documents, Chat w/ Docs, Compare, Quoting, AI Buddy, Reporting, Settings)
   - Active state detection using `usePathname()`
   - Desktop sidebar (lg:flex hidden), tablet sidebar (fixed slide-in), mobile Sheet
   - Dark mode support throughout
   - Settings at bottom with border-t separator

2. **Dashboard Layout Updated**: `src/app/(dashboard)/layout.tsx` now includes:
   - AppNavSidebar integrated in flex layout
   - MobileBottomNav consolidated here (removed from individual pages)
   - Main content flex-1 to fill remaining space

3. **Quoting Placeholder Page Created**: New `src/app/(dashboard)/quoting/page.tsx`:
   - "Coming Soon" card with Calculator icon
   - Feature preview list (enter once, copy to carriers, compare quotes, generate PDF)
   - Dark mode support

4. **MobileBottomNav Updated**: Added Dashboard (Home) link, removed Compare (accessible via sidebar)

5. **Chat-docs Page Cleanup**: Removed duplicate MobileBottomNav import and render (now in layout)

6. **Comprehensive Tests**:
   - 30 unit tests in `__tests__/components/layout/app-nav-sidebar.test.tsx`
   - E2E tests in `__tests__/e2e/sidebar-navigation.spec.ts`

### File List

**New Files:**
- `src/components/layout/app-nav-sidebar.tsx` - New app navigation sidebar component
- `src/app/(dashboard)/quoting/page.tsx` - Quoting placeholder page
- `__tests__/components/layout/app-nav-sidebar.test.tsx` - Unit tests (30 tests)
- `__tests__/e2e/sidebar-navigation.spec.ts` - E2E tests

**Modified Files:**
- `src/app/(dashboard)/layout.tsx` - Integrated AppNavSidebar and MobileBottomNav
- `src/components/layout/sidebar.tsx` - Updated MobileBottomNav with Dashboard link
- `src/app/(dashboard)/chat-docs/[id]/page.tsx` - Removed duplicate MobileBottomNav

## Senior Developer Review (AI)

### Review Date
2025-12-11

### Reviewer
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Review Scope
Full code review of Story DR.2 (Sidebar Navigation Transformation) implementation including:
- `src/components/layout/app-nav-sidebar.tsx`
- `src/app/(dashboard)/quoting/page.tsx`
- Unit tests (30 tests in `__tests__/components/layout/app-nav-sidebar.test.tsx`)
- E2E tests (`__tests__/e2e/sidebar-navigation.spec.ts`)

### Acceptance Criteria Verification

| AC ID | Description | Status | Evidence |
|-------|-------------|--------|----------|
| DR.2.1 | Sidebar width is w-56 (224px) on desktop | ✅ PASS | Line 160: `'w-56 shrink-0'` |
| DR.2.2 | Sidebar has white background and slate-200 right border | ✅ PASS | Lines 162-163: `'bg-white border-r border-slate-200'` |
| DR.2.3 | Navigation includes all 7 items | ✅ PASS | Lines 37-45: navItems array with Dashboard, Documents, Chat w/ Docs, Compare, Quoting, AI Buddy, Reporting |
| DR.2.4 | Settings at bottom with border-t separator | ✅ PASS | Lines 127-129: `<div className="p-3 border-t border-slate-200...">` |
| DR.2.5 | Icon (w-5 h-5) + text label (text-sm font-medium) | ✅ PASS | Lines 91, 100: Classes applied correctly |
| DR.2.6 | Active state: bg-blue-50 text-primary | ✅ PASS | Line 93: `'bg-blue-50 text-primary dark:bg-slate-800 dark:text-blue-400'` |
| DR.2.7 | Hover state: hover:bg-slate-100 | ✅ PASS | Line 95: `'hover:bg-slate-100 dark:hover:bg-slate-800'` |
| DR.2.8 | Base: flex items-center gap-3 px-3 py-2 rounded-lg | ✅ PASS | Line 91: All classes present |
| DR.2.9 | Always visible on desktop (lg: breakpoint) | ✅ PASS | Line 168: `'hidden lg:flex'` |
| DR.2.10 | Slides in from left on tablet/mobile | ✅ PASS | Lines 175-204: Tablet sidebar with transition + Mobile Sheet |

### Code Quality Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| Architecture | ✅ Excellent | Clean separation of NavLink, NavContent, and AppNavSidebar components |
| TypeScript | ✅ Excellent | Proper interfaces (NavItem, AppNavSidebarProps), no type issues |
| Accessibility | ✅ Excellent | `aria-current="page"` on active item (line 97) |
| Dark Mode | ✅ Excellent | All styles include dark: variants |
| Performance | ✅ Good | Uses `usePathname()` hook efficiently for route detection |
| Test Coverage | ✅ Excellent | 30 unit tests covering all ACs, E2E tests for navigation flows |

### Issues Found

**HIGH Severity:** None

**MEDIUM Severity:** None

**LOW Severity:**
1. **Advisory - Responsive Breakpoints:** The tablet sidebar (sm to lg) and mobile Sheet (below sm) provide good coverage, but consider if the 640px breakpoint is optimal for all device sizes.

### Recommendations

1. **Consider memoization:** The `navItems` array could use `useMemo` if re-renders become frequent, though current implementation is fine.
2. **Documentation:** Consider adding JSDoc to the `isActive` function explaining the dashboard special case.

### Test Results

- Unit Tests: 30/30 passing
- E2E Tests: Passing (verified via test suite)
- Production Build: ✅ Successful

### Review Outcome

**✅ APPROVED**

The implementation is clean, well-structured, and fully meets all acceptance criteria. Dark mode support is comprehensive, accessibility is properly addressed with `aria-current`, and the responsive behavior handles desktop, tablet, and mobile viewports correctly. The test coverage is excellent.

---

## Change Log

| Date | Change |
|------|--------|
| 2025-12-10 | Story created and drafted |
| 2025-12-10 | Implementation completed - all tasks done, tests passing, build successful |
| 2025-12-11 | Code review completed - APPROVED |
