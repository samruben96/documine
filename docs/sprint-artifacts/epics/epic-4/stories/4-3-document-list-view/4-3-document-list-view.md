# Story 4.3: Document List View

Status: done

## Story

As a **user**,
I want to see all my uploaded documents in an organized list,
So that I can find and select documents for analysis.

## Acceptance Criteria

### AC-4.3.1: Document List Item Structure
- Documents displayed in sidebar list with document icon + filename + upload date
- Each list item shows: PDF icon, document name (display_name or filename), upload date
- Uses Trustworthy Slate color theme from UX spec

### AC-4.3.2: Relative Date Formatting
- Upload date shows relative format:
  - "Just now" for < 1 minute
  - "X minutes ago" for < 1 hour
  - "X hours ago" for < 24 hours
  - "Yesterday" for 1 day ago
  - "Nov 20" for older dates (short month format)
- Timezone-aware date formatting

### AC-4.3.3: Status Indicator Integration
- Status indicator visible for each document: Ready (✓ green), Processing (⟳ animated), Failed (✗ red)
- Reuse `DocumentStatus` component from Story 4.2
- Status updates in real-time via Supabase Realtime (already implemented in 4.2)

### AC-4.3.4: Sort Order
- List sorted by most recently uploaded first (created_at DESC)
- Order maintained when new documents are uploaded
- Order consistent across page navigation

### AC-4.3.5: Scrollable List
- List is scrollable when documents exceed viewport height
- Smooth scroll behavior
- Scroll position preserved on navigation return
- Custom scrollbar styling matching Slate theme

### AC-4.3.6: Search/Filter
- Search input at top of sidebar filters documents by filename match
- Case-insensitive partial match
- Debounced search (300ms) to prevent excessive queries
- Clear button (X) to reset search
- Empty search results show "No documents found matching '{query}'"

### AC-4.3.7: Document Selection and Navigation
- Clicking document navigates to `/documents/[id]` route
- Split view loads: Document Viewer + Chat Panel (placeholder for Epic 5)
- Document data passed to viewer component

### AC-4.3.8: Selected Document Styling
- Selected document shows left border accent (primary color #475569)
- Selected document has darker background (#f1f5f9)
- Visual selection state persists across interactions
- Only one document can be selected at a time

### AC-4.3.9: Empty State
- When no documents exist, show centered upload zone
- Message: "Upload your first document to get started"
- Upload zone is functional (drag-drop works)
- Clean, minimal design per UX spec

### AC-4.3.10: Responsive Sidebar Behavior
- Desktop (>1024px): Sidebar always visible at 240px width
- Tablet (640-1024px): Collapsible sidebar with hamburger toggle
- Mobile (<640px): Sidebar hidden, bottom navigation with Documents tab
- Smooth transition animations between states

## Tasks / Subtasks

- [x] **Task 1: Create DocumentList sidebar component** (AC: 4.3.1, 4.3.4, 4.3.5)
  - [x] Create `src/components/documents/document-list.tsx`
  - [x] Implement document list item with icon, filename, date
  - [x] Add scrollable container with custom scrollbar
  - [x] Query documents sorted by created_at DESC
  - [x] Integrate with existing realtime subscription from 4.2

- [x] **Task 2: Add relative date formatting** (AC: 4.3.2)
  - [x] Create `src/lib/utils/date.ts` with formatRelativeDate helper
  - [x] Handle all date ranges: just now, minutes, hours, yesterday, older
  - [x] Write unit tests for date formatting

- [x] **Task 3: Integrate status indicators** (AC: 4.3.3)
  - [x] Import DocumentStatus component from 4.2
  - [x] Display appropriate status for each document
  - [x] Ensure realtime updates work with list

- [x] **Task 4: Implement search functionality** (AC: 4.3.6)
  - [x] Add search input at top of sidebar
  - [x] Implement debounced search (300ms)
  - [x] Filter documents client-side for MVP
  - [x] Add clear button and empty results message

- [x] **Task 5: Implement document selection and navigation** (AC: 4.3.7, 4.3.8)
  - [x] Create `/documents/[id]/page.tsx` route
  - [x] Implement selection state management
  - [x] Add selected document styling (left border, darker bg)
  - [x] Create placeholder split view layout

- [x] **Task 6: Implement empty state** (AC: 4.3.9)
  - [x] Create empty state component with upload zone
  - [x] Add "Upload your first document" message
  - [x] Ensure upload zone is functional

- [x] **Task 7: Implement responsive sidebar** (AC: 4.3.10)
  - [x] Create `src/components/layout/sidebar.tsx` with responsive logic
  - [x] Add hamburger toggle for tablet
  - [x] Implement bottom navigation for mobile
  - [x] Add smooth transition animations

- [x] **Task 8: Create split view layout component** (AC: 4.3.7)
  - [x] Create `src/components/layout/split-view.tsx`
  - [x] Sidebar + main content layout
  - [x] Placeholder for document viewer and chat panel (Epic 5)

- [x] **Task 9: Testing and verification** (AC: All)
  - [x] Write component tests for DocumentList
  - [x] Test relative date formatting
  - [x] Test search filtering
  - [x] Test selection state
  - [x] Test responsive breakpoints
  - [x] Test empty state
  - [x] Run build and verify no type errors
  - [x] Verify existing tests still pass

## Dev Notes

### Technical Approach

**Document List Query:**
```typescript
// In document-list.tsx or hook
const { data: documents } = await supabase
  .from('documents')
  .select('id, filename, display_name, status, created_at')
  .eq('agency_id', agencyId)
  .order('created_at', { ascending: false });
```

**Relative Date Formatting:**
```typescript
// src/lib/utils/date.ts
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

**Search with Debounce:**
```typescript
// Use useDebouncedValue hook or implement inline
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebouncedValue(searchQuery, 300);

const filteredDocuments = documents.filter(doc =>
  (doc.displayName || doc.filename)
    .toLowerCase()
    .includes(debouncedQuery.toLowerCase())
);
```

**Selection State Management:**
```typescript
// Use URL param for selected document (enables back button)
// /documents/[id] route params
const params = useParams<{ id: string }>();
const selectedId = params.id;

// Or use local state if simpler for MVP
const [selectedId, setSelectedId] = useState<string | null>(null);
```

**Responsive Sidebar CSS:**
```typescript
// Tailwind classes for responsive behavior
<aside className={cn(
  "w-60 border-r bg-slate-50 flex flex-col",
  "lg:relative lg:block",  // Desktop: always visible
  "md:absolute md:z-10",   // Tablet: overlay
  !isOpen && "md:hidden",  // Tablet: hidden when closed
  "max-md:hidden"          // Mobile: always hidden (use bottom nav)
)}>
```

### Dependencies

**Already Installed:**
- `@supabase/supabase-js` ^2.84.0 - Database queries
- `lucide-react` ^0.554.0 - Icons (FileText, Search, X, Menu)
- `sonner` ^2.0.7 - Toast notifications

**No new dependencies required** - Can use native Intl.DateTimeFormat for dates

### Files to Create

- `src/components/documents/document-list.tsx` - Main sidebar document list
- `src/components/documents/document-list-item.tsx` - Individual list item
- `src/components/documents/document-list-empty.tsx` - Empty state component
- `src/components/layout/sidebar.tsx` - Responsive sidebar wrapper
- `src/components/layout/split-view.tsx` - Two-panel layout component
- `src/lib/utils/date.ts` - Date formatting utilities
- `src/app/(dashboard)/documents/[id]/page.tsx` - Document detail route
- `__tests__/lib/utils/date.test.ts` - Date formatting tests
- `__tests__/components/documents/document-list.test.tsx` - Component tests

### Files to Modify

- `src/app/(dashboard)/documents/page.tsx` - Integrate DocumentList, handle selection
- `src/app/(dashboard)/layout.tsx` - Add responsive sidebar
- `src/hooks/use-document-status.ts` - May need to extend for list integration

### Project Structure Notes

- Follows existing component patterns from Stories 4.1 and 4.2
- Sidebar goes in `src/components/layout/` per architecture spec
- Document components in `src/components/documents/`
- Utility functions in `src/lib/utils/`

### Learnings from Previous Story

**From Story 4-2-upload-progress-status-feedback (Status: done)**

- **DocumentStatus Component**: Already created at `src/components/documents/document-status.tsx` - reuse for status display
- **Realtime Hook**: `src/hooks/use-document-status.ts` provides live updates - integrate with document list
- **Documents Page**: `src/app/(dashboard)/documents/page.tsx` has basic structure - extend with sidebar layout
- **Server Actions**: `src/app/(dashboard)/documents/actions.ts` has document operations - reuse for fetching
- **Test Baseline**: 379 tests passing - maintain this baseline
- **Shimmer Animation**: Already defined in `globals.css` - available for loading states
- **XMLHttpRequest Upload**: Progress tracking pattern available in `upload.ts`

[Source: stories/4-2-upload-progress-status-feedback.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-4.md#Story-4.3]
- [Source: docs/epics.md#Story-4.3-Document-List-View]
- [Source: docs/architecture.md#Project-Structure]
- [Source: docs/ux-design-specification.md#Sidebar-Navigation]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-3-document-list-view.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation followed existing patterns from Stories 4.1 and 4.2
- Reused DocumentStatusBadge component for compact status display in list
- Used useDocumentStatus hook for realtime updates
- Created useDebouncedValue hook for search debouncing
- Added custom scrollbar CSS to globals.css

### Completion Notes List

- ✅ All 10 acceptance criteria implemented
- ✅ 418 tests passing (379 original + 39 new)
- ✅ Build passes with no type errors
- ✅ Responsive sidebar with hamburger toggle (tablet) and bottom nav (mobile)
- ✅ Split view layout with placeholder for Epic 5 document viewer + chat

### File List

**Created:**
- `src/lib/utils/date.ts` - Relative date formatting utility
- `src/hooks/use-debounce.ts` - Debounce hook for search
- `src/components/documents/document-list.tsx` - Main document list component
- `src/components/documents/document-list-item.tsx` - Individual list item
- `src/components/documents/document-list-empty.tsx` - Empty state component
- `src/components/layout/sidebar.tsx` - Responsive sidebar wrapper + MobileBottomNav
- `src/components/layout/split-view.tsx` - Split view layout + placeholders
- `src/app/(dashboard)/documents/[id]/page.tsx` - Document detail route
- `__tests__/lib/utils/date.test.ts` - Date formatting tests (14 tests)
- `__tests__/components/documents/document-list.test.tsx` - DocumentList tests (13 tests)
- `__tests__/components/documents/document-list-item.test.tsx` - DocumentListItem tests (12 tests)

**Modified:**
- `src/app/(dashboard)/documents/page.tsx` - Integrated sidebar layout
- `src/app/(dashboard)/layout.tsx` - Updated for full-height layout
- `src/app/globals.css` - Added custom scrollbar styling

## Code Review

### Review Outcome: ✅ APPROVED

**Reviewer:** Senior Developer Code Review (Dev Agent)
**Date:** 2025-11-30
**Model:** Claude Opus 4.5

### AC Validation Matrix

| AC ID | Requirement | Status | Evidence |
|-------|------------|--------|----------|
| AC-4.3.1 | Doc list item: PDF icon + filename + upload date | ✅ Pass | `document-list-item.tsx:52-68` |
| AC-4.3.2 | Relative date formatting | ✅ Pass | `date.ts:21-35` |
| AC-4.3.3 | Status indicator (Ready/Processing/Failed) | ✅ Pass | `document-list-item.tsx:70-73` |
| AC-4.3.4 | Sorted by created_at DESC | ✅ Pass | Pre-sorted from getDocuments action |
| AC-4.3.5 | Scrollable list with custom scrollbar | ✅ Pass | `document-list.tsx:105`, `globals.css:135-156` |
| AC-4.3.6 | Search with 300ms debounce | ✅ Pass | `document-list.tsx:44-57`, `use-debounce.ts:14-28` |
| AC-4.3.7 | Click → /documents/[id] | ✅ Pass | `document-list.tsx:60-62`, `[id]/page.tsx` |
| AC-4.3.8 | Selected styling (#475569, #f1f5f9) | ✅ Pass | `document-list-item.tsx:47-48` |
| AC-4.3.9 | Empty state with upload zone | ✅ Pass | `document-list-empty.tsx:21-40` |
| AC-4.3.10 | Responsive sidebar behavior | ✅ Pass | `sidebar.tsx:62-123`, `MobileBottomNav:130-200` |

### Code Quality Assessment

**Strengths:**
- Clean component architecture with single responsibility
- Proper TypeScript typing, no `any` usage
- Accessibility: `aria-current`, `aria-label`, `aria-expanded`
- Performance: `useMemo` for filtering, debounced search
- Comprehensive test coverage (39 new tests)
- Well-documented with AC references in comments

**Minor Observations (Non-Blocking):**
- Unused `id` prop in `document-list-item.tsx` (acceptable for future use)
- Unused imports in `[id]/page.tsx` (for Epic 5 integration)

### Security Review

| Check | Status |
|-------|--------|
| XSS Prevention | ✅ Pass |
| Input Sanitization | ✅ Pass |
| Auth Boundaries | ✅ Pass |
| No secrets exposed | ✅ Pass |

### Test Results

- **39 new tests** (14 date, 13 document-list, 12 document-list-item)
- **418 total tests passing**
- **Build passes** with no TypeScript errors

### Verdict

All 10 acceptance criteria fully implemented and tested. Code follows established patterns and conventions. No blocking issues found.

**Recommendation:** Mark story as DONE

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-30 | Bob (Scrum Master) | Initial story draft via create-story workflow (YOLO mode) |
| 2025-11-30 | Bob (Scrum Master) | Story context generated, status changed to ready-for-dev |
| 2025-11-30 | Amelia (Dev Agent) | All tasks completed, 418 tests passing, status changed to review |
| 2025-11-30 | Dev Agent (Code Review) | Code review APPROVED, all 10 ACs validated |
| 2025-11-30 | Amelia (Dev Agent) | Story marked DONE, committed and pushed to main |

### Completion Notes
**Completed:** 2025-11-30
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing
**Git Commit:** 5f76240 - feat(story-4.3): Document List View with Sidebar Navigation
