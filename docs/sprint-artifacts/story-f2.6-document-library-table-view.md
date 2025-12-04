# Story F2.6: Document Library Table View

Status: ready-for-dev

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

- [ ] Task 1: Create DocumentTable component (AC: 6.1, 6.6)
  - [ ] Use @tanstack/react-table with shadcn Table primitives
  - [ ] Define column definitions for all 6 columns
  - [ ] Implement sticky header with proper z-index
  - [ ] Add data-testid attributes for testing

- [ ] Task 2: Implement column sorting (AC: 6.2)
  - [ ] Add sortable header UI (arrows indicating sort direction)
  - [ ] Default sort: Date descending (newest first)
  - [ ] Type column sorts: quote before general

- [ ] Task 3: Render Tags column (AC: 6.3)
  - [ ] Display tag pills inline (reuse existing tag styles)
  - [ ] Truncate to 3 tags with "+N" indicator
  - [ ] Tooltip on hover shows all tags

- [ ] Task 4: Implement row interactions (AC: 6.4, 6.5)
  - [ ] Row click → navigate to document viewer
  - [ ] Hover state reveals action buttons (right side)
  - [ ] Actions: Open (primary), Rename, Delete
  - [ ] Keyboard navigation (Enter to open)

- [ ] Task 5: Integrate into /documents page (AC: 6.7, 6.8)
  - [ ] Replace DocumentCard grid with DocumentTable
  - [ ] Preserve existing search functionality
  - [ ] Keep Upload button in header
  - [ ] Empty state when no documents

- [ ] Task 6: Testing
  - [ ] Unit tests for DocumentTable component
  - [ ] Test sorting behavior
  - [ ] Test row click navigation
  - [ ] E2E test for table interactions

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
- @tanstack/react-table (check if installed, else add)

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story drafted via Party Mode decision |
