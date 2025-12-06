# Story 7.3: Comparison Table View

**Epic:** 7 - Quote Comparison
**Priority:** P0
**Effort:** M (4-6 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **user comparing insurance quotes**,
I want **to see extracted quote data in a side-by-side table**,
So that **I can easily compare coverage details across carriers and make informed decisions**.

---

## Context

This is the third story in Epic 7: Quote Comparison. It delivers the core comparison visualization that users interact with after extraction completes. Building on Story 7.1's selection interface and Story 7.2's extraction service, this story implements:

1. **ComparisonTable Component** - Side-by-side table with carrier columns
2. **Difference Highlighting** - Visual indicators for values that differ across quotes
3. **Best/Worst Value Indicators** - Green (●) for best, red (○) for worst per field type
4. **Not Found Handling** - Graceful display for missing values
5. **Sticky Headers** - First column and header row remain visible while scrolling

This story enables users to visually compare extracted data at a glance, which is the primary value proposition of Epic 7.

---

## Previous Story Learnings

**From Story 7.2 (Quote Data Extraction) - Completed 2025-12-03:**

- **ExtractionService Created**: `src/lib/compare/extraction.ts` with GPT-5.1 zodResponseFormat
- **Types Defined**: `src/types/compare.ts` includes QuoteExtraction, CoverageItem, ExclusionItem types
- **Comparison Page Exists**: `src/app/(dashboard)/compare/[id]/page.tsx` with polling for extraction status
- **API Endpoints**: POST `/api/compare` and GET `/api/compare/[id]` return comparison data
- **ExtractionCard Component**: Basic card display of extraction results already implemented
- **21 Unit Tests**: Schema validation tests established in `__tests__/lib/compare/extraction.test.ts`

**Key Files to Build On:**
- `src/types/compare.ts` - QuoteExtraction type to consume
- `src/app/(dashboard)/compare/[id]/page.tsx` - Comparison result page (enhance)
- `src/lib/compare/extraction.ts` - Extraction service returns QuoteExtraction[]

**Patterns to Reuse:**
- Design system: Electric Blue accent (#3b82f6) from Story 6.8
- Sticky table patterns from existing document list
- Badge component from shadcn/ui

[Source: docs/sprint-artifacts/story-7.2-quote-data-extraction.md#Dev-Agent-Record]

---

## Acceptance Criteria

### AC-7.3.1: Table Column Structure
**Given** a comparison with extracted quote data
**When** I view the comparison table
**Then** I see columns for:
- Field name (first column, sticky)
- Quote 1, Quote 2, Quote 3, Quote 4 (as applicable)
**And** column headers display carrier names from extraction

### AC-7.3.2: Row Coverage
**Given** extracted data from all quotes
**When** the table renders
**Then** rows are displayed for:
- All coverage types found across any quote
- Deductibles for each coverage type
- Annual premium
- Effective dates
- Expiration dates
- Named insured

### AC-7.3.3: Best Value Highlighting
**Given** a row with comparable numeric values
**When** values differ across quotes
**Then** the best value is marked with green indicator (●)
**And** the worst value is marked with red indicator (○)
**And** best/worst logic follows:
- Coverage limits: higher is better
- Deductibles: lower is better
- Premium: lower is better

### AC-7.3.4: Difference Highlighting
**Given** a row where values differ across quotes
**When** the table renders
**Then** the row has a subtle highlight (amber-50 or similar)
**And** the highlight draws attention without being distracting

### AC-7.3.5: Not Found Display
**Given** a field that exists in some quotes but not others
**When** viewing the table
**Then** missing values display as "—" in muted text
**And** the cell is visually distinct (gray background or italic text)
**And** "Not found" cells are excluded from best/worst comparison

### AC-7.3.6: Sticky Header and Column
**Given** a comparison table with many rows
**When** I scroll vertically
**Then** the header row (carrier names) remains visible
**And** when I scroll horizontally (on mobile/narrow screens)
**Then** the first column (field names) remains visible

### AC-7.3.7: Empty State Handling
**Given** extraction failed for all documents
**When** viewing the comparison page
**Then** I see an error state with:
- Clear message explaining the failure
- Option to retry extraction
- Link back to quote selection

### AC-7.3.8: Responsive Layout
**Given** I view the comparison on a tablet or smaller screen
**When** there are 3-4 quotes
**Then** the table scrolls horizontally
**And** touch/swipe gestures work naturally
**And** the table remains readable at smaller sizes

---

## Tasks / Subtasks

- [x] Task 1: Create DiffEngine Utility (AC: 7.3.3, 7.3.4, 7.3.5)
  - [x] Create `src/lib/compare/diff.ts`
  - [x] Implement `buildComparisonRows()` function
  - [x] Implement `calculateBestWorst()` function per field type
  - [x] Implement `detectDifferences()` function
  - [x] Handle null/undefined values correctly

- [x] Task 2: Create ComparisonTable Component (AC: 7.3.1, 7.3.2)
  - [x] Create `src/components/compare/comparison-table.tsx`
  - [x] Define ComparisonTableProps interface
  - [x] Render header row with carrier names
  - [x] Render data rows from DiffEngine output
  - [x] Map coverage types to human-readable labels

- [x] Task 3: Implement Visual Indicators (AC: 7.3.3, 7.3.4, 7.3.5)
  - [x] Add best value indicator (● green)
  - [x] Add worst value indicator (○ red)
  - [x] Add difference row highlighting (subtle amber)
  - [x] Style "not found" cells appropriately

- [x] Task 4: Implement Sticky Behavior (AC: 7.3.6)
  - [x] Apply sticky positioning to header row
  - [x] Apply sticky positioning to first column
  - [x] Handle z-index layering correctly
  - [x] Test on various screen sizes

- [x] Task 5: Integrate with Comparison Page (AC: 7.3.7, 7.3.8)
  - [x] Update `src/app/(dashboard)/compare/[id]/page.tsx`
  - [x] Replace ExtractionCard grid with ComparisonTable
  - [x] Handle loading/error states
  - [x] Add error state with retry option

- [x] Task 6: Unit Tests
  - [x] Test DiffEngine best/worst calculation
  - [x] Test difference detection
  - [x] Test null value handling
  - [x] Test coverage type mapping

- [x] Task 7: E2E Tests
  - [x] Test table renders with mock data
  - [x] Test sticky headers work correctly
  - [x] Test horizontal scroll on mobile

---

## Dev Notes

### DiffEngine Implementation

The DiffEngine transforms QuoteExtraction[] into ComparisonRow[] for table rendering:

```typescript
// src/lib/compare/diff.ts

interface ComparisonRow {
  field: string;                    // Display name (e.g., "General Liability - Limit")
  fieldType: FieldType;             // For best/worst logic
  values: CellValue[];              // One per document
  hasDifference: boolean;           // Triggers row highlight
  bestIndex: number | null;         // Index of best value
  worstIndex: number | null;        // Index of worst value
}

type FieldType =
  | 'coverage_limit'    // Higher is better
  | 'deductible'        // Lower is better
  | 'premium'           // Lower is better
  | 'date'              // N/A for best/worst
  | 'text';             // N/A for best/worst

interface CellValue {
  displayValue: string;             // Formatted for display
  rawValue: number | string | null; // For comparison
  status: 'found' | 'not_found' | 'inferred';
}

// Main entry point
function buildComparisonRows(extractions: QuoteExtraction[]): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // 1. Add header fields (carrier, dates, premium)
  rows.push(buildCarrierRow(extractions));
  rows.push(buildPremiumRow(extractions));
  rows.push(buildDateRow('effectiveDate', extractions));
  rows.push(buildDateRow('expirationDate', extractions));

  // 2. Collect all coverage types across all quotes
  const allCoverageTypes = collectAllCoverageTypes(extractions);

  // 3. Add coverage limit rows
  for (const coverageType of allCoverageTypes) {
    rows.push(buildCoverageLimitRow(coverageType, extractions));
    rows.push(buildCoverageDeductibleRow(coverageType, extractions));
  }

  // 4. Add exclusion summary row
  rows.push(buildExclusionCountRow(extractions));

  return rows;
}
```

### Best/Worst Logic Table

| Field Type | Best Value | Worst Value | Icon Colors |
|------------|------------|-------------|-------------|
| coverage_limit | Highest | Lowest | Green ● / Red ○ |
| deductible | Lowest | Highest | Green ● / Red ○ |
| premium | Lowest | Highest | Green ● / Red ○ |
| date | N/A | N/A | No indicators |
| text | N/A | N/A | No indicators |

### Coverage Type Labels

```typescript
const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  general_liability: 'General Liability',
  property: 'Property',
  auto_liability: 'Auto Liability',
  auto_physical_damage: 'Auto Physical Damage',
  umbrella: 'Umbrella/Excess',
  workers_comp: "Workers' Compensation",
  professional_liability: 'Professional Liability (E&O)',
  cyber: 'Cyber Liability',
  other: 'Other Coverage',
};
```

### Table Structure (HTML/CSS)

```tsx
// Sticky header + sticky first column pattern
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead className="sticky top-0 z-20 bg-white">
      <tr>
        <th className="sticky left-0 z-30 bg-white">Field</th>
        {carriers.map(c => <th>{c}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr className={row.hasDifference ? 'bg-amber-50' : ''}>
          <td className="sticky left-0 z-10 bg-white">{row.field}</td>
          {row.values.map((v, i) => (
            <td className={v.status === 'not_found' ? 'text-muted-foreground' : ''}>
              {v.displayValue}
              {i === row.bestIndex && <span className="text-green-600">●</span>}
              {i === row.worstIndex && <span className="text-red-600">○</span>}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Project Structure Notes

```
src/lib/compare/
├── extraction.ts     # GPT extraction service (Story 7.2) ✅
├── diff.ts           # DiffEngine for table rows (NEW)
└── service.ts        # CompareService orchestration (future)

src/components/compare/
├── quote-selector.tsx     # Selection interface (Story 7.1) ✅
├── selection-counter.tsx  # Selection count (Story 7.1) ✅
├── extraction-card.tsx    # Extraction display (Story 7.2) ✅
├── comparison-table.tsx   # Side-by-side table (NEW)
└── comparison-row.tsx     # Individual row (NEW - optional)
```

### Value Formatting

```typescript
function formatValue(value: number | string | null, fieldType: FieldType): string {
  if (value === null || value === undefined) return '—';

  switch (fieldType) {
    case 'coverage_limit':
    case 'deductible':
    case 'premium':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value as number);
    case 'date':
      return new Date(value as string).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    default:
      return String(value);
  }
}
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Story-7.3]
- [Source: docs/architecture.md#Trust-Transparent-AI-Responses]
- [Source: docs/epics.md#Story-7.3]
- [Source: docs/sprint-artifacts/story-7.2-quote-data-extraction.md]

---

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/7-3-comparison-table-view.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **DiffEngine (src/lib/compare/diff.ts)** - Created comprehensive utility for transforming QuoteExtraction[] to ComparisonRow[] with:
   - `buildComparisonRows()` - Main entry point that builds headers, basic info rows, coverage rows, and summary rows
   - `calculateBestWorst()` - Determines best/worst indices based on field type (higher-is-better for limits, lower-is-better for premium/deductibles)
   - `detectDifference()` - Compares cell values to determine if a row should be highlighted
   - `formatCurrency()`, `formatDate()`, `formatValue()` - Value formatting utilities
   - Exports `COVERAGE_TYPE_LABELS` for human-readable coverage names

2. **ComparisonTable Component (src/components/compare/comparison-table.tsx)** - Created React component with:
   - ValueIndicator sub-component for best (●) and worst (○) indicators with tooltips
   - TableCell sub-component with sticky positioning and conditional styling
   - TableRow component with difference highlighting (amber background)
   - CategoryHeader for section dividers
   - Sticky header row (z-20) and sticky first column (z-10) with proper z-index layering
   - Empty state handling for no comparison data

3. **Date Formatting Fix** - Modified `formatDate()` to parse ISO date strings (YYYY-MM-DD) as local dates instead of UTC to prevent timezone issues displaying dates like "Jan 14" when expecting "Jan 15"

4. **Unit Tests** - 64 total tests passing:
   - `__tests__/lib/compare/diff.test.ts` - 42 tests for DiffEngine utility
   - `__tests__/components/compare/comparison-table.test.tsx` - 22 tests for component rendering

5. **E2E Tests** - Created `__tests__/e2e/comparison-table.spec.ts` with 13 test cases covering:
   - AC-7.3.1 through AC-7.3.8 acceptance criteria
   - Loading state, table structure, basic info rows, best value indicators
   - Difference highlighting, not found handling, sticky behavior, error states

6. **Integration** - Updated `src/app/(dashboard)/compare/[id]/page.tsx` to:
   - Import and render ComparisonTable in ExtractionSummaryView
   - Keep summary ExtractionCards for quick overview
   - Added enhanced FailedView with retry and back navigation options

### File List

**New Files Created:**
- `src/lib/compare/diff.ts` - DiffEngine utility (~380 lines)
- `src/components/compare/comparison-table.tsx` - ComparisonTable component (~310 lines)
- `__tests__/lib/compare/diff.test.ts` - DiffEngine unit tests (42 tests)
- `__tests__/components/compare/comparison-table.test.tsx` - Component unit tests (22 tests)
- `__tests__/e2e/comparison-table.spec.ts` - E2E tests (13 test cases × 3 browsers)

**Files Modified:**
- `src/app/(dashboard)/compare/[id]/page.tsx` - Integrated ComparisonTable component

---

## Code Review Notes

### Review Date: 2025-12-03
### Reviewer: Claude Opus 4.5 (Code Review Agent)
### Outcome: **APPROVED**

#### Acceptance Criteria Validation

| AC | Status | Evidence |
|----|--------|----------|
| AC-7.3.1 Table Column Structure | ✅ PASS | `comparison-table.tsx:258-293` - Field header + carrier headers with numbered badges |
| AC-7.3.2 Row Coverage | ✅ PASS | `diff.ts:549-566` - All basic info, coverage, and summary rows |
| AC-7.3.3 Best Value Highlighting | ✅ PASS | `diff.ts:184-223` calculateBestWorst(), `comparison-table.tsx:54-92` ValueIndicator |
| AC-7.3.4 Difference Highlighting | ✅ PASS | `diff.ts:250-264` detectDifference(), `comparison-table.tsx:148` bg-amber-50/50 |
| AC-7.3.5 Not Found Display | ✅ PASS | `diff.ts:109,122,156` return '—', `comparison-table.tsx:115` italic muted styling |
| AC-7.3.6 Sticky Header/Column | ✅ PASS | `comparison-table.tsx:256` sticky top-0 z-20, `:159` sticky left-0 z-10 |
| AC-7.3.7 Empty State Handling | ✅ PASS | `compare/[id]/page.tsx:244-272` FailedView with retry + back options |
| AC-7.3.8 Responsive Layout | ✅ PASS | `comparison-table.tsx:249-251` overflow-x-auto container |

#### Task Validation

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: DiffEngine Utility | ✅ COMPLETE | `src/lib/compare/diff.ts` (574 lines) with all functions |
| Task 2: ComparisonTable Component | ✅ COMPLETE | `src/components/compare/comparison-table.tsx` (311 lines) |
| Task 3: Visual Indicators | ✅ COMPLETE | Green ●, red ○, amber highlight, muted "—" |
| Task 4: Sticky Behavior | ✅ COMPLETE | z-30/z-20/z-10 layering verified |
| Task 5: Page Integration | ✅ COMPLETE | ComparisonTable rendered in ExtractionSummaryView |
| Task 6: Unit Tests | ✅ COMPLETE | 64 tests (42 diff + 22 component) |
| Task 7: E2E Tests | ✅ COMPLETE | 13 test cases in comparison-table.spec.ts |

#### Code Quality Assessment

**Strengths:**
1. Well-structured separation of concerns (DiffEngine utility vs React component)
2. Comprehensive type definitions with JSDoc comments
3. Proper accessibility (aria-labels, scope attributes, semantic HTML)
4. Memoization for expensive calculations (`useMemo` for tableData and rowsWithCategories)
5. Dark mode support throughout
6. Thorough test coverage (64 unit tests + 13 E2E tests)

**Architecture Alignment:**
- Follows Epic 7 tech spec patterns
- Uses shadcn/ui components (Tooltip, Badge, Card)
- Consistent with Electric Blue design system from Story 6.8
- No new dependencies added

**Security Review:**
- No user input vulnerabilities (table renders extracted data only)
- No API changes or new database operations
- Pre-existing security advisories (function search_path) unrelated to this story

**Risk Assessment:** LOW
- Pure UI component with well-tested data transformation
- No breaking changes to existing functionality
- All tests passing (64 unit + build success)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (Bob) | Created story from Epic 7 Tech Spec |
| 2025-12-03 | Dev Agent (Amelia) | Implemented all tasks, 64 unit tests + 13 E2E tests passing, marked for review |
| 2025-12-03 | Code Review Agent (Claude Opus 4.5) | Code review APPROVED - all 8 ACs validated, all 7 tasks complete |
