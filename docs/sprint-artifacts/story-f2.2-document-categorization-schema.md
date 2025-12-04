# Story F2.2: Document Categorization Schema

Status: done

## Story

As an insurance agent,
I want to categorize documents as either "quote" or "general",
so that I can keep my comparison page focused on actual quote documents while still organizing all my uploads.

## Acceptance Criteria

1. **AC-F2-2.1:** `document_type` column added to documents table with constraint `(quote | general)`
2. **AC-F2-2.2:** Default type is 'quote' (backward compatible with existing documents)
3. **AC-F2-2.3:** UI toggle/dropdown to change document type on document card
4. **AC-F2-2.4:** Type change persists immediately (optimistic update pattern)
5. **AC-F2-2.5:** Type displayed as badge on document card/row (visual distinction)

## Tasks / Subtasks

- [x] Task 1: Database migration for document_type column (AC: 2.1, 2.2)
  - [x] Create migration file with ALTER TABLE statement
  - [x] Add column `document_type varchar(20) DEFAULT 'quote'`
  - [x] Add CHECK constraint `(document_type IN ('quote', 'general'))`
  - [x] Create index for filtering: `idx_documents_type ON documents(agency_id, document_type)`
  - [x] Apply migration via Supabase MCP
  - [x] Regenerate TypeScript types

- [x] Task 2: Update TypeScript types (AC: 2.1)
  - [x] Add `DocumentType = 'quote' | 'general'` type
  - [x] Update Document interface with `document_type` field
  - [x] Ensure database.types.ts reflects new column

- [x] Task 3: Create PATCH API endpoint for type update (AC: 2.4)
  - [x] Create/update `/api/documents/[id]/route.ts` with PATCH handler
  - [x] Validate request body with Zod schema
  - [x] Return updated document on success
  - [x] Handle authorization (user must be in same agency)

- [x] Task 4: Create DocumentTypeBadge component (AC: 2.5)
  - [x] Create `src/components/documents/document-type-badge.tsx`
  - [x] Visual distinction: Quote (blue/primary), General (gray/secondary)
  - [x] Clickable to open type selector

- [x] Task 5: Create DocumentTypeToggle component (AC: 2.3)
  - [x] Create `src/components/documents/document-type-toggle.tsx`
  - [x] Dropdown or segmented control with "Quote" / "General" options
  - [x] Accessible with keyboard navigation

- [x] Task 6: Integrate type toggle in DocumentCard (AC: 2.3, 2.4, 2.5)
  - [x] Update `document-card.tsx` to show DocumentTypeBadge
  - [x] Add click handler to open DocumentTypeToggle
  - [x] Implement optimistic update with rollback on error
  - [x] Show loading state during update

- [x] Task 7: Update useDocuments hook for optimistic updates (AC: 2.4)
  - [x] Add `updateDocumentType` function to documents page
  - [x] Implement optimistic UI update with state setter
  - [x] Handle error rollback

- [x] Task 8: Write unit tests
  - [x] Test DocumentTypeBadge rendering (14 tests)
  - [x] Test DocumentTypeToggle interactions (14 tests)
  - [x] Test DocumentCard type toggle integration (22 tests)
  - [x] Test error handling and rollback

- [x] Task 9: Write E2E test
  - [x] Test document card shows type toggle
  - [x] Test dropdown opens on click
  - [x] Test changing document type via UI
  - [x] Test type toggle disabled for processing documents

## Dev Notes

### Architecture Alignment

- **Database:** New column on `documents` table following existing patterns
- **API:** RESTful PATCH endpoint following established error handling patterns
- **UI:** Components in `src/components/documents/` with kebab-case naming
- **State:** SWR optimistic updates following existing `useDocuments` patterns

### Schema Migration

```sql
-- Add document categorization
ALTER TABLE documents
ADD COLUMN document_type varchar(20) DEFAULT 'quote'
  CHECK (document_type IN ('quote', 'general'));

-- Index for filtering (used in F2-4)
CREATE INDEX idx_documents_type ON documents(agency_id, document_type);
```

### API Contract

```typescript
// PATCH /api/documents/:id
// Request
{ "document_type": "quote" | "general" }

// Response (success)
{
  "data": { "id": string, "document_type": "quote" | "general" },
  "error": null
}

// Response (error)
{
  "data": null,
  "error": { "code": string, "message": string }
}
```

### Component Structure

```
src/components/documents/
├── document-type-badge.tsx     # Visual badge (NEW)
├── document-type-toggle.tsx    # Type selector dropdown (NEW)
├── document-card.tsx           # Updated to include type toggle
└── ... (existing)
```

### Optimistic Update Pattern

```typescript
// In useDocuments hook
const updateDocumentType = async (docId: string, type: DocumentType) => {
  // 1. Store previous state
  const previousDocs = data;

  // 2. Optimistically update UI
  mutate(
    docs => docs?.map(d => d.id === docId ? { ...d, document_type: type } : d),
    false // Don't revalidate yet
  );

  // 3. Make API call
  try {
    await fetch(`/api/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ document_type: type })
    });
    mutate(); // Revalidate on success
  } catch (error) {
    // 4. Rollback on error
    mutate(previousDocs, false);
    throw error;
  }
};
```

### Learnings from Previous Story

**From Story F2-1 (Status: done)**

- **Route Structure Confirmed**: Document library at `/documents`, viewer at `/chat-docs/[id]`
- **DocumentCard Component**: Already shows placeholder type badge - update to use real data
- **Reuse Patterns**: Follow existing badge styling from DocumentStatusBadge
- **Testing Pattern**: Follow 16 unit tests + E2E pattern established in F2-1

[Source: docs/sprint-artifacts/story-f2.1-document-library-page.md#Dev-Agent-Record]

### Dependencies

- Story F2-1 (Document Library Page) - COMPLETE
- Existing: `useDocuments` hook, `DocumentCard` component, PATCH pattern from label updates

### Testing Strategy

| Level | Scope | Target |
|-------|-------|--------|
| Unit | Components, API | DocumentTypeBadge, DocumentTypeToggle, PATCH handler |
| Integration | Hook + API | useDocuments optimistic update |
| E2E | User flow | Change type, verify persistence |

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-f2.md#Story-F2-2]
- [Source: docs/architecture.md#Data-Architecture]
- [Source: docs/architecture.md#API-Response-Format]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/f2-2-document-categorization-schema.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation was smooth with no major issues.

### Completion Notes List

1. **Database Migration:** Applied `add_document_type_column` migration via Supabase MCP adding `document_type varchar(20) DEFAULT 'quote'` with CHECK constraint
2. **TypeScript Types:** Regenerated `database.types.ts` with new column, added `DocumentType` to `src/types/index.ts`
3. **PATCH API:** Created `/api/documents/[id]/route.ts` with Zod validation and agency-scoped authorization
4. **DocumentTypeBadge:** Blue styling for Quote, gray for General with icons
5. **DocumentTypeToggle:** Dropdown using shadcn DropdownMenu with descriptions
6. **DocumentCard Integration:** Toggle replaces hardcoded badge, stopPropagation prevents card navigation when clicking toggle
7. **Optimistic Updates:** Implemented in documents page with rollback on API error
8. **Unit Tests:** 50 tests total (14 badge + 14 toggle + 22 card)
9. **E2E Tests:** 5 tests for document type categorization flow

### File List

**New Files:**
- `src/components/documents/document-type-badge.tsx` - Visual badge component
- `src/components/documents/document-type-toggle.tsx` - Dropdown toggle component
- `src/app/api/documents/[id]/route.ts` - PATCH endpoint for type updates
- `__tests__/components/documents/document-type-badge.test.tsx` - 14 unit tests
- `__tests__/components/documents/document-type-toggle.test.tsx` - 14 unit tests

**Modified Files:**
- `src/types/database.types.ts` - Added document_type column
- `src/types/index.ts` - Added DocumentType type
- `src/components/documents/document-card.tsx` - Integrated type toggle
- `src/app/(dashboard)/documents/page.tsx` - Added handleTypeChange with optimistic updates
- `__tests__/components/documents/document-card.test.tsx` - Added 5 tests for type toggle
- `__tests__/e2e/document-library.spec.ts` - Added 5 E2E tests for type categorization

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story drafted via create-story workflow |
| 2025-12-04 | 2.0 | Story implemented - all acceptance criteria met, 50 unit tests + 5 E2E tests passing |
