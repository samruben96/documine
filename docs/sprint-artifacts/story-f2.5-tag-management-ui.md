# Story F2.5: Tag Management UI

Status: done

## Story

As an insurance agent,
I want to add, edit, and remove tags on my documents,
so that I can organize documents with custom tags beyond AI-generated ones.

## Acceptance Criteria

1. **AC-F2-5.1:** Tags are editable in the document viewer header
2. **AC-F2-5.2:** Can add new tags by clicking "Add tag" and typing
3. **AC-F2-5.3:** Can remove tags by clicking the X button on each tag
4. **AC-F2-5.4:** Tag changes save automatically via API
5. **AC-F2-5.5:** Maximum 10 tags per document enforced
6. **AC-F2-5.6:** Tags support Enter to add, Escape to cancel, Backspace to delete last

## Tasks / Subtasks

- [x] Task 1: Create TagEditor component (AC: 5.1, 5.2, 5.3, 5.5, 5.6)
  - [x] Display existing tags with X button for removal
  - [x] "Add tag" button that shows input field
  - [x] Enter key adds tag, Escape cancels, Backspace removes last
  - [x] Max 10 tags enforcement
  - [x] Loading state during save

- [x] Task 2: Extend PATCH /api/documents/[id] endpoint (AC: 5.4)
  - [x] Accept ai_tags array in request body
  - [x] Validate: max 10 tags, max 30 chars per tag
  - [x] Update database and return new tags

- [x] Task 3: Integrate TagEditor into document viewer (AC: 5.1, 5.4)
  - [x] Replace static tag display with TagEditor
  - [x] Add handleTagsChange function to call API
  - [x] Optimistic state updates
  - [x] Error handling with toast

## Dev Agent Record

### Completion Notes

- TagEditor component at `src/components/documents/tag-editor.tsx`
- API extended to handle ai_tags updates
- Document viewer integrated with live tag editing
- Keyboard shortcuts: Enter (add), Escape (cancel), Backspace (delete last when empty)

### Files Changed

- `src/components/documents/tag-editor.tsx` (new)
- `src/app/api/documents/[id]/route.ts` (extended)
- `src/app/(dashboard)/chat-docs/[id]/page.tsx` (integrated TagEditor)

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story implemented |
