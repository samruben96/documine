# Story DR.3: Page Layout & Background Update

Status: done

## Story

As a **docuMINE user**,
I want **consistent page layouts with slate-50 backgrounds**,
So that **content cards stand out and the app feels cohesive**.

## Acceptance Criteria

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.3.1 | Main content area has bg-slate-50 background |
| DR.3.2 | Content uses max-w-5xl mx-auto centering (or max-w-4xl where appropriate) |
| DR.3.3 | Page padding is p-6 |
| DR.3.4 | Page titles use text-2xl font-semibold text-slate-900 |
| DR.3.5 | Subtitles use text-slate-500 text-sm mt-1 |

## Tasks / Subtasks

- [x] Task 1: Audit current page layouts (AC: DR.3.1, DR.3.2, DR.3.3)
  - [x] 1.1 Document current background colors used across all dashboard pages
  - [x] 1.2 Document current max-width and centering patterns
  - [x] 1.3 Document current padding values used
  - [x] 1.4 List all pages to update:
    - Dashboard (`/dashboard`)
    - Documents list (`/documents`)
    - Document detail (`/documents/[id]`)
    - Chat w/ Docs (`/chat-docs/[id]`)
    - Compare pages (`/compare`, `/compare/[id]`)
    - AI Buddy (`/ai-buddy`)
    - Reporting (`/reporting`)
    - Settings (`/settings`)
    - Quoting placeholder (`/quoting`)

- [x] Task 2: Verify layout.tsx base styles (AC: DR.3.1)
  - [x] 2.1 Confirm `src/app/(dashboard)/layout.tsx` has `bg-slate-50` on main container
  - [x] 2.2 Ensure dark mode variant `dark:bg-slate-950` is present
  - [x] 2.3 Verify background propagates to all child pages correctly

- [x] Task 3: Create page header component pattern (AC: DR.3.4, DR.3.5)
  - [x] 3.1 Create `PageHeader` component in `src/components/layout/page-header.tsx` with:
    - `title` prop: renders as `<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">`
    - Optional `subtitle` prop: renders as `<p className="text-slate-500 text-sm mt-1">`
    - Optional `actions` slot: renders action buttons on the right
  - [x] 3.2 Export PageHeader from layout components index if exists

- [x] Task 4: Update Dashboard page (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 4.1 Update `/dashboard/page.tsx` with `max-w-5xl mx-auto p-6`
  - [x] 4.2 Update page title to use `text-2xl font-semibold text-slate-900`
  - [x] 4.3 Add subtitle if appropriate
  - [x] 4.4 Verify cards contrast well against slate-50 background

- [x] Task 5: Update Documents list page (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 5.1 Review `/documents/page.tsx` - note: uses SplitView layout
  - [x] 5.2 For SplitView pages, apply p-6 padding within the content area
  - [x] 5.3 Update page title styling if standalone header exists
  - [x] 5.4 Ensure document cards have proper contrast

- [x] Task 6: Update Document detail page (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 6.1 Update `/documents/[id]/page.tsx` content padding
  - [x] 6.2 Ensure consistent header/back navigation styling
  - [x] 6.3 Apply proper typography to section headers

- [x] Task 7: Update Chat w/ Docs page (AC: DR.3.2, DR.3.3)
  - [x] 7.1 Review `/chat-docs/[id]/page.tsx` layout
  - [x] 7.2 Apply appropriate padding where applicable
  - [x] 7.3 Note: Chat UI may have unique layout needs - preserve functionality

- [x] Task 8: Update Compare pages (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 8.1 Update `/compare/page.tsx` (comparison list/selection)
  - [x] 8.2 Update `/compare/[id]/page.tsx` (comparison detail)
  - [x] 8.3 Apply `max-w-5xl mx-auto p-6` pattern
  - [x] 8.4 Update page titles to use proper typography

- [x] Task 9: Update AI Buddy pages (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 9.1 Review `/ai-buddy/page.tsx` and related layouts
  - [x] 9.2 Apply padding pattern where appropriate
  - [x] 9.3 Note: Chat interface may have full-height layout - preserve functionality

- [x] Task 10: Update Reporting page (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 10.1 Update `/reporting/page.tsx` with `max-w-5xl mx-auto p-6`
  - [x] 10.2 Update page title typography
  - [x] 10.3 Ensure report cards and charts have proper contrast

- [x] Task 11: Update Settings page (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 11.1 Update `/settings/page.tsx` with appropriate max-width
  - [x] 11.2 Apply p-6 padding pattern
  - [x] 11.3 Update section titles to use proper typography
  - [x] 11.4 Ensure form sections have proper card contrast

- [x] Task 12: Update Quoting placeholder (AC: DR.3.2, DR.3.3, DR.3.4, DR.3.5)
  - [x] 12.1 Update `/quoting/page.tsx` with `max-w-5xl mx-auto p-6`
  - [x] 12.2 Ensure "Coming Soon" card has proper styling

- [x] Task 13: Write unit tests
  - [x] 13.1 Test PageHeader component renders title with correct classes
  - [x] 13.2 Test PageHeader renders subtitle when provided
  - [x] 13.3 Test PageHeader renders actions slot correctly
  - [x] 13.4 Test PageHeader dark mode class variants

- [x] Task 14: Write E2E tests
  - [x] 14.1 Visual test: Verify bg-slate-50 background on multiple pages
  - [x] 14.2 Visual test: Verify page title typography consistency
  - [x] 14.3 Visual test: Verify content centering on wide screens
  - [x] 14.4 Test dark mode: backgrounds switch correctly

## Dev Notes

### Design Reference

The mockup (`docs/features/quoting/mockups/quoting-mockup.html`) establishes the page layout pattern:

- **Main background**: `bg-slate-50` (lines 103-104)
- **Content centering**: `max-w-5xl mx-auto` or `max-w-4xl mx-auto` depending on content width needs
- **Page padding**: `p-6`
- **Page title**: `text-2xl font-semibold` (visible in mockup headers)

### Current Layout State

The dashboard layout (`src/app/(dashboard)/layout.tsx`) already has:
- `bg-slate-50 dark:bg-slate-950` on the main container
- Flex layout with sidebar and main content area

**DR.3.1 may already be satisfied** at the layout level, but individual pages may override this.

### Pages to Update

| Page | Route | Layout Type | Notes |
|------|-------|-------------|-------|
| Dashboard | `/dashboard` | Standard | Welcome page with cards |
| Documents | `/documents` | SplitView | Document sidebar + content |
| Document Detail | `/documents/[id]` | SplitView | Tabs with PDF viewer |
| Chat w/ Docs | `/chat-docs/[id]` | Full-height | Chat interface |
| Compare List | `/compare` | Standard | Comparison selection |
| Compare Detail | `/compare/[id]` | Full-height | Comparison table |
| AI Buddy | `/ai-buddy` | Full-height | Chat interface |
| Reporting | `/reporting` | Standard | Report generation |
| Settings | `/settings` | Standard | Settings tabs |
| Quoting | `/quoting` | Standard | Placeholder |

### Special Layout Considerations

1. **SplitView pages** (Documents, Document Detail, Chat w/ Docs):
   - Use split-view component with left sidebar
   - Padding should be applied to the content area, not the container
   - May have their own scroll containers

2. **Full-height pages** (AI Buddy, Chat):
   - Chat interfaces need `h-full` for proper scrolling
   - Padding may need to be applied to header area only
   - Don't add padding that breaks chat scroll behavior

3. **Standard pages** (Dashboard, Reporting, Settings, Compare List, Quoting):
   - Can use `max-w-5xl mx-auto p-6` pattern directly
   - Content is scrollable within the container

### PageHeader Component Pattern

```tsx
// src/components/layout/page-header.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
```

### Dark Mode Support

All new styling must include dark mode variants:
- `bg-slate-50` → `dark:bg-slate-950`
- `text-slate-900` → `dark:text-slate-100`
- `text-slate-500` → `dark:text-slate-400`

### Learnings from Previous Story

**From Story DR-2-sidebar-navigation (Status: done)**

- **Layout successfully updated**: `src/app/(dashboard)/layout.tsx` now has `bg-slate-50 dark:bg-slate-950`
- **Flex layout structure**: Main container is `flex-1 overflow-hidden` - pages inherit this
- **SplitView preserved**: Document pages continue to use SplitView component
- **AppNavSidebar integration**: Sidebar is fixed, main content flexes to fill remaining space
- **MobileBottomNav**: Now in layout, not in individual pages

**Key insight from DR.2:**
- Layout already has the background color (AC DR.3.1 partially complete)
- Individual pages need their content containers updated for padding and max-width
- Some pages (AI Buddy, Chat) use full-height layouts that shouldn't have the standard max-width

**Testing pattern:**
- 30 unit tests for AppNavSidebar
- E2E tests for navigation
- Follow same comprehensive testing approach

[Source: docs/sprint-artifacts/epics/epic-design-refresh/stories/DR-2-sidebar-navigation/story.md#Dev-Agent-Record]

### Project Structure Notes

- **Modify**: Various page files in `src/app/(dashboard)/*/page.tsx`
- **Create**: `src/components/layout/page-header.tsx` (optional - can inline pattern if simpler)
- **Tests**: Unit tests for PageHeader, E2E visual tests for layout consistency

### References

- [Source: docs/sprint-artifacts/epics/epic-design-refresh/tech-spec.md#DR.3 - Page Layout & Background]
- [Source: docs/sprint-artifacts/epics/epic-design-refresh/epic.md#Story DR.3]
- [Source: docs/features/quoting/mockups/quoting-mockup.html - Page layout patterns]
- [Source: src/app/(dashboard)/layout.tsx - Current dashboard layout]

## Dev Agent Record

### Context Reference

- [DR-3-page-layout-background.context.xml](./DR-3-page-layout-background.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No significant issues encountered.

### Completion Notes List

1. **Layout Background (AC-DR.3.1)**: Verified `bg-slate-50 dark:bg-slate-950` is already present in `src/app/(dashboard)/layout.tsx` from Story DR.2
2. **Dashboard Page**: Updated from `max-w-6xl` to `max-w-5xl`, changed `px-4 sm:px-6 lg:px-8 py-8` to `p-6`
3. **Documents Page**: Fixed title color from `text-slate-800` to `text-slate-900`
4. **Document Detail Page**: Just a redirect to `/chat-docs/[id]`, no changes needed
5. **Chat w/ Docs Page**: Uses SplitView with unique layout needs, no max-width changes needed
6. **Compare Pages**: Updated titles from `text-xl` to `text-2xl` on both `/compare` and `/compare/[id]`
7. **AI Buddy Page**: Already compliant - uses `text-2xl` and `bg-slate-50`
8. **Reporting Page**: Updated both header instances from `text-xl` to `text-2xl`
9. **Settings Page**: Already compliant - uses `text-2xl font-semibold text-slate-900`
10. **Quoting Page**: Updated from `max-w-4xl px-4 sm:px-6 lg:px-8 py-12` to `max-w-5xl p-6`
11. **One-Pager Page**: Updated two titles from `text-xl` to `text-2xl`
12. **PageHeader Component**: Created reusable component with title, subtitle, actions, and icon props

### File List

#### Created Files
- `src/components/layout/page-header.tsx` - Reusable PageHeader component
- `__tests__/components/layout/page-header.test.tsx` - 16 unit tests for PageHeader
- `__tests__/e2e/page-layout-consistency.spec.ts` - E2E tests for layout consistency

#### Modified Files
- `src/app/(dashboard)/dashboard/page.tsx` - Updated max-width and padding
- `src/app/(dashboard)/documents/page.tsx` - Fixed title color to text-slate-900
- `src/app/(dashboard)/compare/page.tsx` - Updated title to text-2xl
- `src/app/(dashboard)/compare/[id]/page.tsx` - Updated title to text-2xl
- `src/app/(dashboard)/reporting/page.tsx` - Updated both titles to text-2xl
- `src/app/(dashboard)/quoting/page.tsx` - Updated max-width and padding
- `src/app/(dashboard)/one-pager/page.tsx` - Updated titles to text-2xl
- `docs/sprint-artifacts/epics/epic-design-refresh/stories/DR-3-page-layout-background/story.md` - Updated status and tasks

## Change Log

| Date | Change |
|------|--------|
| 2025-12-10 | Story created and drafted |
| 2025-12-10 | Implementation complete - all pages updated with consistent layout |
