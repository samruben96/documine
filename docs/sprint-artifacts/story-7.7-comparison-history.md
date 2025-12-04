# Story 7.7: Comparison History

**Epic:** 7 - Quote Comparison
**Priority:** P1
**Effort:** L (6-8 hours)
**Added:** 2025-12-03
**Status:** done
**UX Review:** COMPLETE (2025-12-03)

---

## User Story

As a **user who has performed multiple quote comparisons**,
I want **to see a history of my past comparisons on the Compare page**,
So that **I can quickly revisit previous analyses without re-selecting and re-extracting documents**.

---

## Context

Currently, when a user navigates away from a comparison result, they lose access to that comparison. This story adds persistence and discoverability for comparison history, transforming the `/compare` page into a hub that shows both:

1. **New Comparison** action (current functionality)
2. **Comparison History** table listing past comparisons

This enables users to:
- Build up a library of comparisons over time
- Quickly reference past analyses
- Clean up old comparisons they no longer need

### Relationship to Epic 7 Scope

The original tech spec listed "Historical comparison - No tracking of quote changes over time" as out of scope. This story is different - it's about **persisting and surfacing past comparison sessions**, not tracking how the same quote changes over time.

---

## UX Design Decisions (Completed 2025-12-03)

> **UX Designer:** Sally | **Reviewed by:** Sam

### 1. Page Layout

**Decision: Option A - History as default view with "New Comparison" button**

- History table is the primary view when user visits `/compare`
- "New Comparison" button prominently positioned top-right
- First-time users see empty state with CTA to create first comparison
- Returning users immediately see their comparison history

**Rationale:** Users with history are more likely to revisit than create new. The empty state handles first-time users gracefully.

### 2. History Table Columns

| Column | Content | Notes |
|--------|---------|-------|
| **☐** | Checkbox for bulk selection | Header checkbox for select all |
| **Date** | Relative date (e.g., "2 days ago") | Tooltip shows absolute date/time |
| **Documents** | Filenames (display_name ?? filename) | Comma-separated, truncated with tooltip |
| **Status** | Badge: Complete / Partial / Failed | Color-coded status indicator |
| **Actions** | Delete icon | Individual row delete |

**Key decision:** Show **filenames** (not carrier names) for consistency with document list.

### 3. Empty State

```
       📊

   No comparisons yet

   Compare quotes side-by-side to see coverage
   differences at a glance.

   [+ Create Your First Comparison]
```

- Engaging headline stating the obvious
- Value proposition subhead (not just instructions)
- Clear CTA button

### 4. Deletion UX

| Aspect | Decision |
|--------|----------|
| **Individual delete** | Trash icon per row (visible on hover/focus) |
| **Bulk delete** | Checkbox column + "Delete Selected (N)" action bar |
| **Confirmation** | Dialog: "Delete N comparison(s)? You'll need to re-run extraction to recreate." |
| **Delete type** | Hard delete (no archive) |
| **UI update** | Optimistic - rows fade out immediately |

### 5. Search & Filter

| Feature | Implementation |
|---------|----------------|
| **Search** | Text input matching document filenames |
| **Date range** | From/To date inputs |
| **Quick presets** | "Last 7 days", "Last 30 days", "All time" dropdown |
| **Sort** | Default most-recent-first, clickable Date column header to toggle |

### Layout Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Compare Quotes                         [+ New Comparison]  │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search documents...  │ 📅 From: ___ To: ___ [Presets ▾] │
├─────────────────────────────────────────────────────────────┤
│  [🗑 Delete Selected (3)]                   Showing 15 of 42 │
├─────────────────────────────────────────────────────────────┤
│  ☐ │ Date ↓     │ Documents                    │ Status     │
│  ☑ │ 2 days ago │ progressive-quote.pdf, st... │ ✓ Complete │
│  ☑ │ Nov 28     │ allstate-2024.pdf, geico...  │ ✓ Complete │
│  ☑ │ Nov 25     │ liberty-mutual.pdf           │ ⚠ Partial  │
│  ☐ │ Nov 20     │ farmers-ins.pdf, nationw...  │ ✓ Complete │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### AC-7.7.1: History Table Display
**Given** I have performed one or more comparisons
**When** I visit the Compare page
**Then** I see a history table showing my past comparisons
**And** each row displays: checkbox, date, document filenames, status badge
**And** rows are sorted by most recent first (Date column sortable)

### AC-7.7.2: View Past Comparison
**Given** I see a comparison in my history
**When** I click on the row (not on checkbox or delete icon)
**Then** I navigate to `/compare/[id]` showing the full comparison
**And** the comparison loads from stored data (no re-extraction)

### AC-7.7.3: Delete Individual Comparison
**Given** I see a comparison in my history
**When** I click the delete (trash) icon on a row
**Then** I see a confirmation dialog
**And** upon confirmation, the comparison is removed from history
**And** the row fades out with optimistic UI update

### AC-7.7.4: Search & Date Range Filter
**Given** I have many comparisons in my history
**When** I type in the search field
**Then** the table filters to show matching comparisons
**And** search matches against document filenames
**When** I select a date range (From/To or preset)
**Then** the table filters to show comparisons within that range

### AC-7.7.5: Empty State
**Given** I have no past comparisons
**When** I visit the Compare page
**Then** I see "No comparisons yet" with value proposition text
**And** a "Create Your First Comparison" CTA button
**And** clicking CTA navigates to quote selection view

### AC-7.7.6: Pagination
**Given** I have more than 20 comparisons
**When** I view the history table
**Then** results are paginated (20 per page)
**And** pagination controls appear at bottom
**And** performance remains snappy

### AC-7.7.7: Bulk Delete
**Given** I have selected one or more comparisons via checkboxes
**When** I click "Delete Selected (N)" action
**Then** I see a confirmation dialog showing count
**And** upon confirmation, all selected comparisons are removed
**And** selected rows fade out with optimistic UI update
**And** selection state resets after deletion

### AC-7.7.8: Select All
**Given** I am viewing the history table
**When** I click the header checkbox
**Then** all visible rows are selected
**When** I click it again
**Then** all rows are deselected

---

## Tasks / Subtasks

- [x] Task 1: Database & API (AC: 7.7.1, 7.7.2, 7.7.3, 7.7.6, 7.7.7)
  - [x] Verify `comparisons` table has necessary fields (user_id, agency_id for RLS)
  - [x] RLS policies already exist for SELECT, INSERT, UPDATE, DELETE
  - [x] Create GET `/api/compare` endpoint to list user's comparisons
    - [x] Support pagination: `?page=1&limit=20`
    - [x] Support date range: `?from=2024-01-01&to=2024-12-31`
    - [x] Support search: `?search=filename`
    - [x] Return document filenames (join with documents table)
  - [x] Create DELETE `/api/compare/[id]` endpoint (single delete)
  - [x] Create DELETE `/api/compare` endpoint with body `{ ids: string[] }` (bulk delete)

- [x] Task 2: History Table Component (AC: 7.7.1, 7.7.8)
  - [x] Create `src/components/compare/comparison-history.tsx`
  - [x] Checkbox column with header "select all" checkbox
  - [x] Date column with relative date + tooltip for absolute
  - [x] Documents column with filenames, truncated with tooltip
  - [x] Status column with color-coded badge (Complete/Partial/Failed)
  - [x] Delete icon column (visible on hover/focus)
  - [x] Clickable rows navigate to `/compare/[id]`
  - [x] Sortable Date column header

- [x] Task 3: Search & Filter Controls (AC: 7.7.4)
  - [x] Search input with debounced filtering (200ms)
  - [x] Date range inputs (From/To)
  - [x] Quick preset dropdown: "Last 7 days", "Last 30 days", "All time"
  - [x] Client-side filtering for loaded data, server-side for pagination

- [x] Task 4: Delete Functionality (AC: 7.7.3, 7.7.7)
  - [x] Individual delete: trash icon triggers confirmation dialog
  - [x] Bulk delete: action bar appears when ≥1 selected
  - [x] Confirmation dialog with count: "Delete N comparison(s)?"
  - [x] Optimistic UI: rows fade out immediately
  - [x] Error handling: rows reappear with toast on failure
  - [x] Reset selection state after successful bulk delete

- [x] Task 5: Page Layout & Empty State (AC: 7.7.5, 7.7.6)
  - [x] Refactor `/compare` page: history table as default view
  - [x] "New Comparison" button top-right, navigates to quote selection
  - [x] Empty state component with icon, headline, value prop, CTA
  - [x] Pagination controls at bottom of table
  - [x] "Showing X of Y" count display

- [x] Task 6: Tests
  - [x] Unit tests for ComparisonHistory component (14 tests)
    - [x] Rendering with data
    - [x] Status badges display
    - [x] Relative dates display
    - [x] Selection state management
    - [x] Delete confirmation flow
    - [x] Pagination controls
  - [x] Unit tests for ComparisonHistoryFilters component (12 tests)
    - [x] Filter rendering
    - [x] Search debouncing
    - [x] Date range inputs
    - [x] Preset dropdown
    - [x] Clear filters
  - [x] E2E tests for comparison history flows
    - [x] History table display
    - [x] View past comparison
    - [x] Search and filter
    - [x] Individual delete
    - [x] Bulk delete with select all

---

## Dev Notes

### Database Considerations

The `comparisons` table already exists (created in Story 7.1/7.2). Verify it has:

```sql
-- Required fields for history feature
comparisons (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL,      -- For RLS
  user_id UUID NOT NULL,        -- For user-specific history
  document_ids UUID[],          -- Array of compared documents
  comparison_data JSONB,        -- Stores status, extractions, etc.
  created_at TIMESTAMPTZ,       -- For sorting
  updated_at TIMESTAMPTZ
);

-- RLS policies needed
CREATE POLICY "Users can view own comparisons"
  ON comparisons FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comparisons"
  ON comparisons FOR DELETE
  USING (user_id = auth.uid());
```

### API Endpoints

```typescript
// GET /api/compare - List comparisons with filtering
// Query params:
//   ?page=1&limit=20          - Pagination
//   ?search=filename          - Search document filenames
//   ?from=2024-01-01          - Date range start (ISO date)
//   ?to=2024-12-31            - Date range end (ISO date)

interface ListComparisonResponse {
  comparisons: ComparisonSummary[];
  totalCount: number;
  page: number;
  totalPages: number;
}

interface ComparisonSummary {
  id: string;
  createdAt: string;
  status: 'processing' | 'complete' | 'partial' | 'failed';
  documentCount: number;
  documentNames: string[];  // Filenames from joined documents table
}

// DELETE /api/compare/[id] - Single delete
Response: { success: true }

// DELETE /api/compare - Bulk delete
Request: { ids: string[] }
Response: { success: true, deletedCount: number }
```

### Component Structure

```
src/components/compare/
├── quote-selector.tsx           # Existing - for new comparisons
├── selection-counter.tsx        # Existing
├── comparison-table.tsx         # Story 7.3 - comparison results view
├── comparison-history.tsx       # NEW - history table with selection
├── comparison-history-filters.tsx # NEW - search + date range controls
└── comparison-empty-state.tsx   # NEW - empty state component
```

### Page State Management

The `/compare` page needs to manage two views:
1. **History view** (default) - Shows ComparisonHistory table
2. **New comparison view** - Shows QuoteSelector (existing)

Consider using URL state or simple React state:
```typescript
const [view, setView] = useState<'history' | 'new'>('history');
```

Or use query param: `/compare?view=new`

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md]
- [Source: docs/prd.md#FR20-FR26]
- [Pattern: docs/sprint-artifacts/story-6.7-document-list-ux-polish.md] - Empty state pattern

---

## Dev Agent Record

### Context Reference

`docs/sprint-artifacts/7-7-comparison-history.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes

- All 8 acceptance criteria (AC-7.7.1 through AC-7.7.8) implemented and tested
- RLS policies already existed for comparisons table - no migration needed
- Added GET and DELETE endpoints to existing `/api/compare/route.ts`
- Added DELETE endpoint for single comparison at `/api/compare/[id]/route.ts`
- Compare page refactored to show history as default view with "New Comparison" button
- Search filtering uses 200ms debounce via `useDebouncedValue` hook
- Optimistic UI for delete operations with fade-out animation
- 26 unit tests passing for history components
- Full test suite (1097 tests) passes
- Build passes with no errors

### File List

**New Files:**
- `src/components/compare/comparison-history.tsx` - History table with selection, sorting, pagination
- `src/components/compare/comparison-history-filters.tsx` - Search, date range, preset dropdown
- `src/components/compare/comparison-empty-state.tsx` - Empty state with CTA
- `__tests__/components/compare/comparison-history.test.tsx` - 14 unit tests
- `__tests__/components/compare/comparison-history-filters.test.tsx` - 12 unit tests
- `__tests__/e2e/compare-history.spec.ts` - E2E tests for history flows

**Modified Files:**
- `src/app/api/compare/route.ts` - Added GET (list with pagination/filters) and DELETE (bulk) endpoints
- `src/app/api/compare/[id]/route.ts` - Added DELETE endpoint for single comparison
- `src/app/(dashboard)/compare/page.tsx` - Refactored for history-first layout with view toggle

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM | Created story per scrum master request - UX review required |
| 2025-12-03 | UX (Sally) | UX Design complete: Layout, columns, empty state, deletion, search/filter decisions |
| 2025-12-03 | Sam | Requested: filenames (not carriers), date range filter, bulk delete |
| 2025-12-03 | UX (Sally) | Updated ACs (7.7.1-7.7.8), tasks (1-6), dev notes to reflect final UX decisions |
| 2025-12-03 | Dev (Amelia) | Implementation complete - all 6 tasks done, 26 tests passing, build verified |
| 2025-12-03 | SR (Dev) | Code review complete - APPROVED with no issues |

---

## Code Review Notes

**Reviewed by:** Senior Developer (Amelia)
**Date:** 2025-12-03
**Verdict:** ✅ **APPROVED**

### Acceptance Criteria Verification

| AC | Status | Notes |
|----|--------|-------|
| AC-7.7.1 | ✅ PASS | History table renders checkbox, date, documents, status columns. Sorted by most recent. Date column sortable. |
| AC-7.7.2 | ✅ PASS | Row click navigates to `/compare/[id]`. Click handlers correctly exclude checkbox and delete button clicks. |
| AC-7.7.3 | ✅ PASS | Delete icon triggers AlertDialog confirmation. Optimistic UI with fade-out. Error handling rolls back on failure. |
| AC-7.7.4 | ✅ PASS | Search input with 200ms debounce. Date range From/To inputs. Presets dropdown (7 days, 30 days, All time). |
| AC-7.7.5 | ✅ PASS | Empty state with icon, headline, value proposition, CTA button. Triggers `onNewComparison` callback. |
| AC-7.7.6 | ✅ PASS | Pagination at 20 per page. Previous/Next buttons with disabled states. Page X of Y display. |
| AC-7.7.7 | ✅ PASS | Bulk delete action bar appears when ≥1 selected. Confirmation dialog shows count. Selection resets after delete. |
| AC-7.7.8 | ✅ PASS | Header checkbox selects/deselects all visible rows. `allSelected` and `someSelected` states tracked. |

### Code Quality Assessment

**Strengths:**
1. **Clean separation of concerns** - Filters component is properly extracted and reusable
2. **TypeScript types** - Strong typing with `ComparisonSummary`, `HistoryFilters`, `ListComparisonResponse`
3. **Optimistic UI** - Delete operations use fade animation (`fadingIds` state) with proper rollback on error
4. **Debounced search** - Uses `useDebouncedValue` hook (200ms) to prevent excessive API calls
5. **Accessibility** - Proper `aria-label` attributes on checkboxes and buttons
6. **Error handling** - Both API and UI handle errors gracefully with toast notifications

**API Design:**
- GET endpoint properly supports pagination, search, and date range filters
- DELETE endpoints use proper HTTP methods and return appropriate status codes
- Zod validation on request bodies
- RLS policies enforced via `agency_id` and `user_id` filters

**Test Coverage:**
- 26 unit tests covering all major functionality
- E2E tests cover history table, search, filtering, and delete flows
- Tests properly use `@vitest-environment happy-dom` directive

### Security Review

| Check | Status | Notes |
|-------|--------|-------|
| Authentication | ✅ | All endpoints verify `supabase.auth.getUser()` |
| Authorization | ✅ | Agency and user ID validated before operations |
| Input validation | ✅ | Zod schemas on POST/DELETE bodies |
| SQL injection | ✅ | Uses Supabase client with parameterized queries |
| XSS | ✅ | No dangerouslySetInnerHTML usage |

### Performance Considerations

- Pagination limits to 20 items per request
- Client-side search filtering on loaded data (server-side for paginated data)
- No N+1 queries - document names fetched in single batch

### Recommendations (Optional Enhancements)

None required for approval. Potential future enhancements:
- Consider adding sort direction to URL params for shareable links
- Could add keyboard navigation for row selection (shift+click for range select)

### Summary

Implementation is clean, well-tested, and follows project patterns. All 8 acceptance criteria verified. Code is production-ready.
