# Story 23.6: Interactive Data Table

Status: done

## Story

As an **insurance agent**,
I want **a sortable, filterable table displaying all my uploaded data rows**,
so that **I can explore and validate my data before and after report generation**.

## Acceptance Criteria

1. **AC-23.6.1**: Data table displays all rows from uploaded file
2. **AC-23.6.2**: Columns are sortable (click header to toggle ascending/descending/none)
3. **AC-23.6.3**: Global filter/search across all columns with debounced input
4. **AC-23.6.4**: Pagination for large datasets (>100 rows) with configurable page size
5. **AC-23.6.5**: Column-specific filters for numeric columns (min/max range) and date columns (date range picker)
6. **AC-23.6.6**: Table displays "No results found" when filter matches zero rows
7. **AC-23.6.7**: Table has proper ARIA labels and keyboard navigation for accessibility

## Tasks / Subtasks

- [x] **Task 1: Create ReportDataTable Component** (AC: 1, 7)
  - [x] Create `src/components/reporting/report-data-table.tsx`
  - [x] Use @tanstack/react-table for headless table logic (already installed)
  - [x] Render all columns from `GeneratedReport.dataTable.columns`
  - [x] Render all rows from `GeneratedReport.dataTable.rows`
  - [x] Add `role="grid"` and `aria-label` for accessibility
  - [x] Handle empty data state with centered message

- [x] **Task 2: Implement Column Sorting** (AC: 2)
  - [x] Add `SortingState` from @tanstack/react-table
  - [x] Make all column headers clickable for sorting
  - [x] Display sort indicator icon (ascending/descending arrow)
  - [x] Toggle cycle: none → ascending → descending → none
  - [x] Ensure keyboard accessible (Enter/Space to toggle sort)

- [x] **Task 3: Implement Global Search Filter** (AC: 3)
  - [x] Add `GlobalFilter` state using `useGlobalFilter` from react-table
  - [x] Create search input above table with magnifying glass icon
  - [x] Add 300ms debounce to avoid excessive filtering on keystrokes
  - [x] Filter across all columns (case-insensitive)
  - [x] Show "Clear" button when filter is active

- [x] **Task 4: Implement Pagination** (AC: 4)
  - [x] Add `PaginationState` from @tanstack/react-table
  - [x] Display pagination controls below table
  - [x] Show "Rows per page" dropdown (10, 25, 50, 100)
  - [x] Show "Page X of Y" indicator
  - [x] Add Previous/Next and First/Last buttons
  - [x] Only show pagination when rowCount > current page size

- [x] **Task 5: Implement Column Filters** (AC: 5)
  - [x] Add `ColumnFiltersState` from @tanstack/react-table
  - [x] For numeric columns: Add min/max inputs in header dropdown
  - [x] For date columns: Add date range picker in header dropdown
  - [x] For text columns: Add text filter with substring match
  - [x] Show filter indicator badge on columns with active filters

- [x] **Task 6: Handle Empty Results** (AC: 6)
  - [x] Display "No results found" when filters produce zero rows
  - [x] Show button to "Clear all filters"
  - [x] Maintain table structure (headers) even with no data

- [x] **Task 7: Replace DataTablePlaceholder in ReportView** (AC: 1)
  - [x] Update `src/components/reporting/report-view.tsx`
  - [x] Replace `DataTablePlaceholder` with `ReportDataTable`
  - [x] Pass `report.dataTable.columns`, `report.dataTable.rows`
  - [x] Pass `sortable` and `filterable` flags from dataTable config

- [x] **Task 8: Unit Tests** (AC: 1-7)
  - [x] Create `__tests__/components/reporting/report-data-table.test.tsx`
  - [x] Test table renders with correct row/column count
  - [x] Test sorting toggles work correctly
  - [x] Test global search filters data
  - [x] Test pagination changes page
  - [x] Test column filters work
  - [x] Test empty state displays correctly
  - [x] Test accessibility attributes present

- [x] **Task 9: E2E Tests** (AC: 1, 2, 3, 4)
  - [x] Update `__tests__/e2e/report-generation.spec.ts`
  - [x] Verify data table renders after report generation
  - [x] Test clicking header sorts data
  - [x] Test search input filters rows
  - [x] Test pagination navigation

## Dev Notes

### Learnings from Previous Story

**From Story 23.5 (Status: done)**

- **ReportView Component**: Located at `src/components/reporting/report-view.tsx` - contains `DataTablePlaceholder` to replace
- **ChartConfig Pattern**: Used `CHART_TYPE_CONFIG` for type → icon/label mapping - consider similar for column types
- **Recharts Already Integrated**: Charts working in ReportView, data table is the remaining placeholder
- **Test Patterns**: 35 unit tests in `report-chart.test.tsx` following describe/it pattern with comprehensive coverage
- **Accessibility Pattern**: Used `role="img"` and `aria-label` on chart containers - apply similar to table

**Key Integration Points**:
- `ReportView` receives `report.dataTable: { columns, rows, sortable, filterable }` from generation API
- Currently renders `DataTablePlaceholder` showing row/column counts
- Data already available in correct format for @tanstack/react-table

[Source: docs/sprint-artifacts/epics/epic-23/stories/23-5-charts-visualization/story.md#Dev-Agent-Record]

### Existing @tanstack/react-table Usage in Codebase

Reference implementation in `src/components/admin/user-management-panel.tsx`:
- Uses `useReactTable`, `getCoreRowModel`, `getPaginationRowModel`, `getSortedRowModel`
- Column definitions with `accessorKey` and `header`
- Pagination state with `pageIndex` and `pageSize`
- Already integrated with shadcn/ui Table components

### Relevant Architecture Patterns

- **shadcn/ui Table**: Use `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` from `@/components/ui/table`
- **Debounce Pattern**: Use `useMemo` with `lodash.debounce` or custom implementation
- **Pagination UI**: Follow pattern from UserManagementPanel with ChevronLeft/Right icons

### Technical Constraints

- **@tanstack/react-table Version**: Already installed in package.json
- **DataTable Format**: `{ columns: string[], rows: Record<string, unknown>[], sortable: boolean, filterable: boolean }`
- **Row Count**: Could be 10,000+ rows - must use virtualization or pagination for performance
- **Column Types**: `GeneratedReport.dataTable` doesn't include column types - infer from first non-null value

### Project Structure Notes

- Component: `src/components/reporting/report-data-table.tsx` (NEW)
- Update: `src/components/reporting/report-view.tsx`
- Tests: `__tests__/components/reporting/report-data-table.test.tsx`
- E2E: `__tests__/e2e/report-generation.spec.ts` (update)

### TypeScript Types Available

From `src/types/reporting.ts`:
- `GeneratedReport.dataTable` - Table data structure with columns, rows, sortable, filterable flags
- Column names are strings, rows are `Record<string, unknown>`

### Design Decisions

1. **No virtualization for MVP**: Pagination at 100 rows is sufficient; add virtualization if performance issues arise
2. **Column filters in dropdown**: Each column header has filter icon that opens popover with type-appropriate filter UI
3. **Date detection**: Infer column type from sample values (ISO date strings, numbers, text)
4. **Responsive behavior**: Table scrolls horizontally on mobile, headers sticky

### References

- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Interactive-Data-Table-Story-23.6]
- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#UI-Components]
- [Source: src/components/admin/user-management-panel.tsx] - @tanstack/react-table reference
- [Source: src/components/reporting/report-view.tsx] - DataTablePlaceholder to replace

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/23-6-interactive-data-table.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented all Tasks 1-9 in single session
- Build verified: TypeScript passes, no errors
- Unit tests: 46 tests in report-data-table.test.tsx (all pass)
- Report-view tests updated: 155 total tests pass across 6 test files
- E2E tests updated with 4 new data table tests

### Completion Notes List

- Created comprehensive ReportDataTable component with full @tanstack/react-table integration
- Implemented all 7 ACs: data display, sorting, global search, pagination, column filters, empty state, accessibility
- Used existing patterns from DocumentTable and UserManagementPanel for consistency
- Debounce implemented with `useDebouncedCallback` from `use-debounce` library (300ms)
- Column types inferred automatically from data (text, number, date)
- Column filter UI uses Popover component with type-appropriate inputs
- Pagination shows when dataset > page size (default 10 rows)
- Full keyboard accessibility with aria-sort, aria-label, focus indicators
- Removed DataTablePlaceholder from report-view.tsx

### File List

**New Files:**
- src/components/reporting/report-data-table.tsx
- __tests__/components/reporting/report-data-table.test.tsx

**Modified Files:**
- src/components/reporting/report-view.tsx (replaced DataTablePlaceholder with ReportDataTable)
- __tests__/components/reporting/report-view.test.tsx (updated tests for data table)
- __tests__/e2e/report-generation.spec.ts (added 4 new E2E tests for data table)

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-10 | 1.0 | Initial story draft |
| 2025-12-10 | 2.0 | Implementation complete - all 9 tasks done, 46 unit tests + 4 E2E tests |
| 2025-12-10 | 2.1 | Senior Developer Review notes appended |

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-10

### Outcome
✅ **APPROVED**

All 7 acceptance criteria are fully implemented with comprehensive test coverage. All 9 tasks verified complete with evidence. Code quality is high, following established patterns and best practices.

### Summary
Story 23.6 implements a fully-featured interactive data table component (`ReportDataTable`) that integrates seamlessly into the `ReportView` component. The implementation uses @tanstack/react-table v8 with proper headless table patterns, comprehensive accessibility features, and excellent test coverage (46 unit tests + 4 E2E tests). The code follows established project patterns and architectural guidelines.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity (Advisory):**
- Note: Some unit tests emit `act(...)` warnings in stderr due to debounced state updates. These are harmless timing-related warnings and do not affect test correctness or production behavior.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-23.6.1 | Data table displays all rows from uploaded file | ✅ IMPLEMENTED | `report-data-table.tsx:516-537` renders rows via `table.getRowModel().rows`, `report-view.tsx:267-274` passes `report.dataTable` props |
| AC-23.6.2 | Columns are sortable (click header to toggle ascending/descending/none) | ✅ IMPLEMENTED | `report-data-table.tsx:161-202` `SortableHeader` component with `toggleSorting()`, aria-sort attributes at lines 597-603 |
| AC-23.6.3 | Global filter/search across all columns with debounced input | ✅ IMPLEMENTED | `report-data-table.tsx:382-397` uses `useDebouncedCallback` (300ms), global filter at lines 553-580 |
| AC-23.6.4 | Pagination for large datasets (>100 rows) with configurable page size | ✅ IMPLEMENTED | `report-data-table.tsx:661-744` pagination controls, page size selector (10/25/50/100), First/Prev/Next/Last buttons |
| AC-23.6.5 | Column-specific filters for numeric columns (min/max range) and date columns (date range picker) | ✅ IMPLEMENTED | `report-data-table.tsx:207-349` `ColumnFilter` component with type-specific inputs (text/number/date) |
| AC-23.6.6 | Table displays "No results found" when filter matches zero rows | ✅ IMPLEMENTED | `report-data-table.tsx:617-638` empty state with "Clear all filters" button |
| AC-23.6.7 | Table has proper ARIA labels and keyboard navigation for accessibility | ✅ IMPLEMENTED | `report-data-table.tsx:584-588` `role="grid"`, `aria-label`, `aria-rowcount`; sort buttons have keyboard handlers (183-188), focus-visible classes |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create ReportDataTable Component | ✅ Complete | ✅ VERIFIED | `src/components/reporting/report-data-table.tsx` exists (749 lines), uses @tanstack/react-table, role="grid" at line 585 |
| Task 2: Implement Column Sorting | ✅ Complete | ✅ VERIFIED | `SortingState` at line 373, `SortableHeader` component (161-202), keyboard accessible (183-188) |
| Task 3: Implement Global Search Filter | ✅ Complete | ✅ VERIFIED | `useDebouncedCallback` at line 382, search input (553-580), clear button (569-578) |
| Task 4: Implement Pagination | ✅ Complete | ✅ VERIFIED | `PaginationState` at line 376, controls at 661-744, page size dropdown with 10/25/50/100 options |
| Task 5: Implement Column Filters | ✅ Complete | ✅ VERIFIED | `ColumnFiltersState` at line 374, `ColumnFilter` component (207-349), type-specific inputs |
| Task 6: Handle Empty Results | ✅ Complete | ✅ VERIFIED | Empty state at lines 617-638, "Clear all filters" button at 627-634 |
| Task 7: Replace DataTablePlaceholder in ReportView | ✅ Complete | ✅ VERIFIED | `report-view.tsx:29` imports `ReportDataTable`, line 267-274 renders it, no `DataTablePlaceholder` remains |
| Task 8: Unit Tests | ✅ Complete | ✅ VERIFIED | `__tests__/components/reporting/report-data-table.test.tsx` (571 lines), 46 tests all passing |
| Task 9: E2E Tests | ✅ Complete | ✅ VERIFIED | `__tests__/e2e/report-generation.spec.ts` has 4 data table tests (329-420) |

**Summary: 9 of 9 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

**Unit Tests:**
- 46 tests in `report-data-table.test.tsx` covering all ACs
- 24 tests in `report-view.test.tsx` including data table integration
- All tests passing

**E2E Tests:**
- 4 new tests for data table: render verification, sorting, search filtering, pagination
- Tests integrated into existing `report-generation.spec.ts`

**Coverage Assessment:** Excellent - comprehensive coverage of all features and edge cases

### Architectural Alignment

**Tech-Spec Compliance:**
- ✅ Uses @tanstack/react-table v8 (as specified)
- ✅ Follows shadcn/ui Table component patterns
- ✅ Uses `useDebouncedCallback` from `use-debounce` (as specified)
- ✅ Props interface matches `GeneratedReport.dataTable` structure
- ✅ Pagination default 10 rows with 10/25/50/100 options (as specified)

**Pattern Adherence:**
- ✅ Follows existing `DocumentTable` and `UserManagementPanel` patterns
- ✅ Uses established component structure (Card/CardHeader/CardContent)
- ✅ Consistent with project's accessibility patterns

### Security Notes

No security concerns identified. Component renders data passed via props with proper escaping via React.

### Best-Practices and References

- [@tanstack/react-table v8 documentation](https://tanstack.com/table/v8)
- [WCAG 2.1 AA accessibility guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library best practices](https://testing-library.com/docs/react-testing-library/intro/)

### Action Items

**Code Changes Required:**
None - all acceptance criteria satisfied.

**Advisory Notes:**
- Note: Consider wrapping test state updates in `act()` to eliminate warnings (low priority, cosmetic only)
- Note: Future enhancement: Add virtualization for datasets >10K rows if performance issues arise
