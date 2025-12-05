# Story F2.1: Document Library Page

Status: done

## Story

As an insurance agent,
I want a dedicated document library page at `/documents`,
so that I can view, manage, and organize all my agency's uploaded documents in one place.

## Acceptance Criteria

1. **AC-F2-1.1:** Dedicated `/documents` route exists and is accessible from header navigation
2. **AC-F2-1.2:** Page displays all agency documents in a grid or list view
3. **AC-F2-1.3:** Each document shows: filename, upload date, page count, status, type badge, tags
4. **AC-F2-1.4:** Click on document navigates to `/chat-docs/[id]` viewer
5. **AC-F2-1.5:** Upload button opens upload modal/zone
6. **AC-F2-1.6:** Empty state shows when no documents exist

## Tasks / Subtasks

- [x] Task 0: Route restructure - move current pages (prerequisite)
  - [x] Move `src/app/(dashboard)/documents/page.tsx` → `src/app/(dashboard)/chat-docs/page.tsx`
  - [x] Move `src/app/(dashboard)/documents/[id]/page.tsx` → `src/app/(dashboard)/chat-docs/[id]/page.tsx`
  - [x] Move `src/app/(dashboard)/documents/actions.ts` → `src/app/(dashboard)/chat-docs/actions.ts`
  - [x] Update all internal imports/links to use `/chat-docs/[id]`
  - [x] Add redirect from `/documents/[id]` → `/chat-docs/[id]` for backward compat

- [x] Task 1: Create NEW `/documents` library page route (AC: 1.1)
  - [x] Create `src/app/(dashboard)/documents/page.tsx` as library page
  - [x] Header navigation already points to `/documents` - no change needed
  - [x] Ensure route is protected by auth middleware

- [x] Task 2: Implement document grid/list view (AC: 1.2)
  - [x] Create `DocumentLibraryPage` component with responsive layout
  - [x] Create `DocumentCard` component for grid view
  - [x] Use existing `useDocuments` hook to fetch agency documents
  - [x] Add loading skeleton state during fetch

- [x] Task 3: Display document metadata (AC: 1.3)
  - [x] Show filename with truncation and tooltip for long names
  - [x] Display upload date formatted (relative time)
  - [x] Show page count (handle null for processing docs)
  - [x] Display status badge (processing | ready | failed)
  - [x] Show document type badge (quote | general) - note: defaults to "quote" until F2-2 schema
  - [x] Display labels/tags if available

- [x] Task 4: Implement document navigation (AC: 1.4)
  - [x] Make `DocumentCard` clickable with cursor pointer
  - [x] Navigate to `/chat-docs/[id]` on click using Next.js router
  - [x] Add hover state for visual feedback

- [x] Task 5: Integrate upload functionality (AC: 1.5)
  - [x] Add "Upload" button in page header
  - [x] Reuse existing `UploadZone` component in modal/dialog
  - [x] Trigger document list refresh after successful upload

- [x] Task 6: Implement empty state (AC: 1.6)
  - [x] Create empty state variant for document library
  - [x] Display upload CTA when no documents exist
  - [x] Use consistent empty state styling from Epic 6

- [x] Task 7: Write tests
  - [x] Unit tests for `DocumentCard` component (16 tests)
  - [x] E2E test for full page functionality (12 tests)

## Dev Notes

### Route Restructure Decision (2025-12-04)

**IMPORTANT:** The current `/documents` page is the document viewer/chat experience. Per user decision:

| Current Route | New Route | Purpose |
|---------------|-----------|---------|
| `/documents` (page.tsx) | `/chat-docs` | Sidebar + split view chat experience |
| `/documents/[id]` | `/chat-docs/[id]` | Individual document viewer + chat |
| (NEW) | `/documents` | Document Library (this story) |

**Migration Steps:**
1. Move existing `/documents/*` to `/chat-docs/*`
2. Create new `/documents` as library page
3. Add redirect for backward compatibility

### Architecture Alignment

- **Route:** `/app/(dashboard)/documents/page.tsx` - NEW library page (replaces old chat page)
- **Components:** Create in `src/components/documents/` following existing conventions
- **Data Fetching:** Use `useDocuments` hook (SWR pattern, 5-minute stale time)
- **UI:** Use shadcn/ui components (Card, Badge, Button, Dialog) per design system

### Component Structure

```
src/components/documents/
├── document-library-page.tsx  # Main page container
├── document-card.tsx          # Grid item with metadata
├── document-grid.tsx          # Responsive grid layout
└── upload-dialog.tsx          # Modal wrapper for UploadZone
```

### Existing Components to Reuse

- `UploadZone` - existing upload component from Epic 4
- `Badge` - shadcn/ui badge for status/type
- `Tooltip` - for truncated filenames
- `Skeleton` - for loading states
- `EmptyState` - reuse pattern from Epic 6 (document-list-empty.tsx)

### Database Schema (Existing)

```sql
-- documents table (existing)
documents (
  id uuid primary key,
  agency_id uuid not null,
  filename text not null,
  status text not null, -- 'processing' | 'ready' | 'failed'
  page_count integer,
  created_at timestamptz,
  -- New columns added in F2-2:
  document_type varchar(20), -- 'quote' | 'general'
  ai_tags text[],
  ai_summary text
)
```

### Dependencies

- This story creates the UI foundation
- Document type badge will show "quote" for all docs until F2-2 adds the schema
- Tags will be empty until F2-3 implements AI tagging

### Performance Considerations

- Use SWR for data caching
- Lazy load upload modal
- Virtualize list if >100 documents (future enhancement)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-f2.md#Story-F2-1]
- [Source: docs/architecture.md#UI/UX-Architecture]
- [Source: docs/architecture.md#Project-Structure]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/f2-1-document-library-page.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- All 6 Acceptance Criteria implemented
- Route restructure completed: `/documents/*` → `/chat-docs/*`
- New document library page at `/documents` with grid view
- DocumentCard component with metadata display
- Upload functionality via dialog
- Empty state with upload CTA
- Backward compatibility redirect from `/documents/[id]` → `/chat-docs/[id]`
- 16 unit tests + 12 E2E tests

### File List

**New Files:**
- `src/app/(dashboard)/documents/page.tsx` - Document Library page
- `src/app/(dashboard)/documents/[id]/page.tsx` - Redirect for backward compat
- `src/components/documents/document-card.tsx` - Grid card component
- `__tests__/components/documents/document-card.test.tsx` - Unit tests
- `__tests__/e2e/document-library.spec.ts` - E2E tests

**Moved Files:**
- `src/app/(dashboard)/documents/page.tsx` → `src/app/(dashboard)/chat-docs/page.tsx`
- `src/app/(dashboard)/documents/[id]/page.tsx` → `src/app/(dashboard)/chat-docs/[id]/page.tsx`
- `src/app/(dashboard)/documents/actions.ts` → `src/app/(dashboard)/chat-docs/actions.ts`

**Updated Files:**
- `src/components/documents/delete-document-modal.tsx` - Import path update
- `src/components/documents/document-list.tsx` - Import path update
- `src/components/documents/document-list-item.tsx` - Import path update
- `src/components/documents/label-input.tsx` - Import path update
- `src/components/documents/label-filter.tsx` - Import path update
- `src/components/documents/document-labels.tsx` - Import path update
- `__tests__/components/documents/delete-document-modal.test.tsx` - Mock path fix
- `__tests__/app/dashboard/documents/rename-document.test.ts` - Import path fix

---

## Senior Developer Review (AI)

### Reviewer: Sam
### Date: 2025-12-04
### Outcome: ✅ APPROVE

### Summary

Story F2-1 (Document Library Page) implements a dedicated `/documents` route with a responsive grid view for document management. All 6 acceptance criteria are fully implemented with evidence verified in source code. The route restructure from `/documents` → `/chat-docs` was executed cleanly with backward-compatible redirects. Build and all 1223 tests pass.

### Key Findings

**No blocking issues found.** Implementation is clean and follows established patterns.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-F2-1.1 | Dedicated /documents route accessible from header | ✅ IMPLEMENTED | `src/app/(dashboard)/documents/page.tsx:44`, `src/components/layout/header.tsx:22` |
| AC-F2-1.2 | Grid view of agency documents | ✅ IMPLEMENTED | `src/app/(dashboard)/documents/page.tsx:343-360` |
| AC-F2-1.3 | Document metadata display | ✅ IMPLEMENTED | `src/components/documents/document-card.tsx:79-140` |
| AC-F2-1.4 | Click navigates to /chat-docs/[id] | ✅ IMPLEMENTED | `src/components/documents/document-card.tsx:53-55` |
| AC-F2-1.5 | Upload button opens modal | ✅ IMPLEMENTED | `src/app/(dashboard)/documents/page.tsx:233-249` |
| AC-F2-1.6 | Empty state when no documents | ✅ IMPLEMENTED | `src/app/(dashboard)/documents/page.tsx:303-325` |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Description | Marked | Verified | Evidence |
|------|-------------|--------|----------|----------|
| 0 | Route restructure | ✅ | ✅ VERIFIED | Files moved to `/chat-docs/`, redirect at `documents/[id]/page.tsx:21` |
| 1 | Create /documents library route | ✅ | ✅ VERIFIED | `src/app/(dashboard)/documents/page.tsx` |
| 2 | Grid/list view | ✅ | ✅ VERIFIED | Grid at line 343, loading skeleton at line 282 |
| 3 | Document metadata display | ✅ | ✅ VERIFIED | DocumentCard component with all metadata fields |
| 4 | Document navigation | ✅ | ✅ VERIFIED | `router.push('/chat-docs/${id}')` on click |
| 5 | Upload functionality | ✅ | ✅ VERIFIED | Dialog with UploadZone at line 233 |
| 6 | Empty state | ✅ | ✅ VERIFIED | Empty state with upload CTA, data-testid |
| 7 | Tests | ✅ | ✅ VERIFIED | 16 unit tests + 12 E2E tests |

**Summary: 7 of 7 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- **Unit Tests:** 16 tests for DocumentCard component (`document-card.test.tsx`)
- **E2E Tests:** 12 tests for document library functionality (`document-library.spec.ts`)
- **All 1223 tests passing** ✓
- **Build passing** ✓
- **No coverage gaps identified**

### Architectural Alignment

- ✓ Follows dashboard route group pattern (`/app/(dashboard)/`)
- ✓ Components in `src/components/documents/` with kebab-case naming
- ✓ Uses shadcn/ui components (Card, Badge, Button, Dialog)
- ✓ Server actions for data fetching
- ✓ Responsive grid with mobile/tablet/desktop breakpoints
- ✓ Proper data-testid attributes for E2E testing
- ✓ Reused existing components (UploadZone, DocumentStatusBadge, LabelPill)
- ✓ Backward-compatible redirect for old `/documents/[id]` URLs

### Security Notes

- No security concerns identified
- RLS policies already protect documents by agency_id
- Authentication checked via middleware

### Best-Practices and References

- [Next.js App Router Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [SWR Data Fetching](https://swr.vercel.app/)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Action Items

**Advisory Notes:**
- Note: Document type badge defaults to "quote" until F2-2 adds categorization schema (as designed)
- Note: Tags/labels display ready for F2-3 AI tagging feature

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story F2-1 implemented - Document Library Page |
| 2025-12-04 | 1.0 | Senior Developer Review notes appended - APPROVED |
