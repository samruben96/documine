# Story F2.6: Document Library Table View

Status: done

## Story

As an insurance agent,
I want the document library to display documents in a sortable table format,
so that I can efficiently scan, sort, and find documents when working through my queue.

## Acceptance Criteria

1. **AC-F2-6.1:** Documents display in table with columns: Name, Type, Status, Tags, Date, Pages
2. **AC-F2-6.2:** All columns are sortable (click header to sort asc/desc)
3. **AC-F2-6.3:** Tags column shows inline tag pills (max 3 visible, "+N" overflow)
4. **AC-F2-6.4:** Row hover reveals action buttons (Open, Rename, Delete)
5. **AC-F2-6.5:** Row click navigates to /chat-docs/[id] document viewer
6. **AC-F2-6.6:** Table has sticky header for scrolling long lists
7. **AC-F2-6.7:** Search filters table rows by name OR tags (existing behavior preserved)
8. **AC-F2-6.8:** Empty state shows friendly message with upload prompt

## Tasks / Subtasks

- [x] Task 1: Create DocumentTable component (AC: 6.1, 6.6)
  - [x] Use @tanstack/react-table with shadcn Table primitives
  - [x] Define column definitions for all 6 columns
  - [x] Implement sticky header with proper z-index
  - [x] Add data-testid attributes for testing

- [x] Task 2: Implement column sorting (AC: 6.2)
  - [x] Add sortable header UI (arrows indicating sort direction)
  - [x] Default sort: Date descending (newest first)
  - [x] Type column sorts: quote before general

- [x] Task 3: Render Tags column (AC: 6.3)
  - [x] Display tag pills inline (reuse existing tag styles)
  - [x] Truncate to 3 tags with "+N" indicator
  - [x] Tooltip on hover shows all tags + summary

- [x] Task 4: Implement row interactions (AC: 6.4, 6.5)
  - [x] Row click → navigate to document viewer
  - [x] Hover state reveals action buttons (right side)
  - [x] Actions: Open (primary), Rename, Delete via DropdownMenu
  - [x] Keyboard navigation (Enter to open, Tab through rows)

- [x] Task 5: Integrate into /documents page (AC: 6.7, 6.8)
  - [x] Replace DocumentCard grid with DocumentTable
  - [x] Preserve existing search functionality (name OR tags)
  - [x] Keep Upload button in header
  - [x] Empty state when no documents

- [x] Task 6: Testing
  - [x] Verified table rendering in Playwright
  - [x] Tested sorting behavior (Name column)
  - [x] Tested row click navigation
  - [x] Fixed dropdown menu bug (Radix/shadcn conflict)

## Dev Notes

### Technical Approach

Use shadcn's Table component with @tanstack/react-table for:
- Declarative column definitions
- Built-in sorting state management
- Accessible keyboard navigation

### Component Structure

```
/documents page
└── DocumentTable
    ├── TableHeader (sticky, sortable)
    └── TableBody
        └── DocumentRow (per document)
            ├── NameCell (with file icon)
            ├── TypeCell (badge)
            ├── StatusCell (badge)
            ├── TagsCell (pills with overflow)
            ├── DateCell (relative date)
            └── PagesCell (count)
            └── ActionsCell (hover reveal)
```

### Existing Components to Reuse

- `DocumentStatusBadge` - Status column
- `DocumentTypeToggle` - Type column (or simplified badge)
- Tag pill styles from `DocumentCard`
- `formatRelativeDate` utility

### Party Mode Decision (2025-12-04)

Team consensus:
- Sally (UX): Table for scanability, horizontal space for tags
- Winston (Architect): Sortable columns are killer feature
- Amelia (Dev): 2-3 hour implementation with existing primitives
- John (PM): Insurance agents need productivity view, not browsing

## Dependencies

- Story F2-3 (AI Tagging) - COMPLETE
- @tanstack/react-table - already installed

## Dev Agent Record

### Context Reference

- Party Mode decision (2025-12-04)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

1. **Dropdown Menu Bug:** Actions dropdown wouldn't open when clicking ... button
   - Root cause: shadcn Button with asChild on DropdownMenuTrigger conflicted with Radix UI
   - Fix: Changed to native `<button>` element + added `modal={false}` to DropdownMenu

### Completion Notes List

1. **DocumentTable component:** `src/components/documents/document-table.tsx` with @tanstack/react-table
2. **Column definitions:** Name, Type, Status, Tags, Date, Pages + hidden Actions column
3. **Sorting:** SortableHeader component with arrow indicators, default Date desc
4. **Tags column:** 3 visible pills + "+N" overflow, tooltip with all tags + summary
5. **Row interactions:** Click navigates, hover reveals actions dropdown
6. **Dropdown fix:** Native button + modal={false} resolved Radix conflict
7. **Integration:** Replaced DocumentCard grid in /documents page

### File List

**New Files:**
- `src/components/documents/document-table.tsx` - Table component (368 lines)

**Modified Files:**
- `src/app/(dashboard)/documents/page.tsx` - Replaced grid with table

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story drafted via Party Mode decision |
| 2025-12-04 | 2.0 | Story implemented via epic-yolo - all 8 ACs met, dropdown bug fixed |
