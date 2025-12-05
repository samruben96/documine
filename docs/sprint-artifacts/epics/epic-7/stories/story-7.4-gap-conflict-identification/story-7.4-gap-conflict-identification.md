# Story 7.4: Gap & Conflict Identification

**Epic:** 7 - Quote Comparison
**Priority:** P0
**Effort:** M (4-6 hours)
**Added:** 2025-12-03
**Status:** Done
**Reviewed:** 2025-12-03
**Reviewer:** Senior Developer Agent (claude-opus-4-5-20251101)

---

## User Story

As a **user comparing insurance quotes**,
I want **to see coverage gaps and conflicts highlighted automatically**,
So that **I can identify potential issues before recommending a quote to my client**.

---

## Context

This is the fourth story in Epic 7: Quote Comparison. It enhances the comparison table (Story 7.3) with intelligent gap and conflict detection, helping users identify coverage mismatches across carriers.

Building on the DiffEngine and ComparisonTable from Story 7.3, this story adds:

1. **Gap Detection** - Coverage present in some quotes but missing in others
2. **Conflict Detection** - Same coverage with significantly different terms or exclusion mismatches
3. **Warning Banner** - Summary of gaps/conflicts with click-to-scroll navigation
4. **Visual Indicators** - Warning icons (⚠) and amber highlighting for flagged rows
5. **Severity Classification** - High/Medium/Low based on coverage type importance

This story surfaces the most critical comparison insights, enabling agents to quickly identify risks when evaluating quotes for clients.

---

## Previous Story Learnings

**From Story 7.3 (Comparison Table View) - Completed 2025-12-03:**

- **DiffEngine Created**: `src/lib/compare/diff.ts` with `buildComparisonRows()`, `calculateBestWorst()`, `detectDifference()`
- **ComparisonRow Interface**: Already has `hasDifference`, `bestIndex`, `worstIndex` properties to build on
- **CellValue Status**: Uses `'found' | 'not_found' | 'inferred'` - gap detection can leverage `not_found` status
- **ComparisonTable Component**: `src/components/compare/comparison-table.tsx` with CategoryHeader and sticky headers
- **64 Unit Tests**: Established patterns in `__tests__/lib/compare/diff.test.ts` and `__tests__/components/compare/comparison-table.test.tsx`

**Key Files to Build On:**
- `src/lib/compare/diff.ts` - Add `detectGaps()` and `detectConflicts()` functions
- `src/components/compare/comparison-table.tsx` - Add gap/conflict row styling
- `src/types/compare.ts` - GapWarning and ConflictWarning types already defined

**Patterns to Reuse:**
- Amber highlighting for differences (`bg-amber-50/50`)
- ValueIndicator pattern for warning icons
- CategoryHeader for summary sections
- Tooltip component for explanatory text

[Source: docs/sprint-artifacts/story-7.3-comparison-table-view.md#Dev-Agent-Record]

---

## Acceptance Criteria

### AC-7.4.1: Gap Identification
**Given** quotes with different coverage types
**When** one or more quotes are missing a coverage present in others
**Then** the missing coverage row is flagged as a gap
**And** the gap includes which documents have vs. don't have the coverage

### AC-7.4.2: Gap Visual Indicators
**Given** a row identified as a coverage gap
**When** viewing the comparison table
**Then** the row displays:
- Warning icon (⚠) in the field name column
- Amber background highlighting (stronger than difference highlight)
- "Not included" or "—" in cells for missing coverage
**And** the gap is visually distinct from simple differences

### AC-7.4.3: Conflict Detection
**Given** quotes with the same coverage type
**When** there are significant term differences
**Then** conflicts are identified for:
- Exclusion mismatches (e.g., flood excluded in one quote but included in another)
- Limit variance > 50% difference from the highest limit
- Deductible variance > 100% difference from the lowest deductible

### AC-7.4.4: Summary Banner
**Given** gaps and/or conflicts are detected
**When** viewing the comparison page
**Then** a summary banner appears above the table showing:
- "X potential gaps, Y conflicts identified" message
- Collapsible list of specific issues
- Each issue is clickable to scroll to the relevant row

### AC-7.4.5: Click-to-Scroll Navigation
**Given** the summary banner with gap/conflict items
**When** I click on a specific gap or conflict
**Then** the comparison table scrolls to that row
**And** the row is temporarily highlighted (pulse animation)

### AC-7.4.6: Severity Classification
**Given** gaps or conflicts are detected
**When** calculating severity
**Then** severity is assigned based on coverage type:
- **High**: General Liability, Property, Workers' Comp (core coverages)
- **Medium**: Auto Liability, Professional Liability, Umbrella
- **Low**: Cyber, other specialized coverages
**And** high severity items appear first in the summary banner

---

## Tasks / Subtasks

- [x] Task 1: Extend DiffEngine with Gap Detection (AC: 7.4.1, 7.4.6)
  - [x] Add `detectGaps()` function to `src/lib/compare/diff.ts`
  - [x] Identify coverage types present in some quotes but missing in others
  - [x] Calculate severity based on coverage type mapping
  - [x] Return `GapWarning[]` with documentsMissing, documentsPresent, severity
  - [x] Add `COVERAGE_SEVERITY` constant mapping

- [x] Task 2: Extend DiffEngine with Conflict Detection (AC: 7.4.3, 7.4.6)
  - [x] Add `detectConflicts()` function to `src/lib/compare/diff.ts`
  - [x] Detect limit variance conflicts (>50% from highest)
  - [x] Detect deductible variance conflicts (>100% from lowest)
  - [x] Detect exclusion mismatches (present in some, absent in others)
  - [x] Return `ConflictWarning[]` with description and affected documents

- [x] Task 3: Create GapConflictBanner Component (AC: 7.4.4, 7.4.5, 7.4.6)
  - [x] Create `src/components/compare/gap-conflict-banner.tsx`
  - [x] Display summary count: "X gaps, Y conflicts"
  - [x] Collapsible list of issues with severity icons
  - [x] Sort by severity (high → medium → low)
  - [x] Implement click handler for scroll-to-row

- [x] Task 4: Add Gap/Conflict Row Styling (AC: 7.4.2)
  - [x] Update `ComparisonRow` interface with `isGap` and `gapSeverity` fields
  - [x] Add warning icon (⚠) component for gap rows
  - [x] Implement stronger amber background for gaps vs differences
  - [x] Add row ID/ref for scroll targeting

- [x] Task 5: Integrate with Comparison Page (AC: 7.4.4, 7.4.5)
  - [x] Update `src/app/(dashboard)/compare/[id]/page.tsx`
  - [x] Call `detectGaps()` and `detectConflicts()` with extraction data
  - [x] Render GapConflictBanner above ComparisonTable
  - [x] Wire scroll-to-row functionality with smooth scroll
  - [x] Add pulse animation on scroll target

- [x] Task 6: Unit Tests
  - [x] Test gap detection with various coverage combinations
  - [x] Test conflict detection thresholds (50% limit, 100% deductible)
  - [x] Test severity classification for all coverage types
  - [x] Test exclusion mismatch detection
  - [x] Extend existing diff.test.ts

- [x] Task 7: E2E Tests
  - [x] Test banner appears when gaps/conflicts exist
  - [x] Test click-to-scroll navigation works
  - [x] Test no banner when all coverages match
  - [x] Test severity ordering in banner

---

## Dev Notes

### Gap Detection Algorithm

```typescript
// src/lib/compare/diff.ts - Addition

function detectGaps(extractions: QuoteExtraction[]): GapWarning[] {
  const gaps: GapWarning[] = [];
  const allCoverageTypes = new Set<CoverageType>();

  // Collect all coverage types across all quotes
  extractions.forEach(e =>
    e.coverages.forEach(c => allCoverageTypes.add(c.type))
  );

  // Check each type for gaps
  allCoverageTypes.forEach(type => {
    const present: number[] = [];
    const missing: number[] = [];

    extractions.forEach((e, i) => {
      if (e.coverages.some(c => c.type === type)) {
        present.push(i);
      } else {
        missing.push(i);
      }
    });

    // Gap exists if some have it and some don't
    if (missing.length > 0 && present.length > 0) {
      gaps.push({
        field: COVERAGE_TYPE_LABELS[type],
        documentsMissing: missing,
        documentsPresent: present,
        severity: COVERAGE_SEVERITY[type]
      });
    }
  });

  // Sort by severity: high → medium → low
  return gaps.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
}
```

### Coverage Severity Mapping

```typescript
const COVERAGE_SEVERITY: Record<CoverageType, 'high' | 'medium' | 'low'> = {
  general_liability: 'high',
  property: 'high',
  workers_comp: 'high',
  auto_liability: 'medium',
  professional_liability: 'medium',
  umbrella: 'medium',
  auto_physical_damage: 'low',
  cyber: 'low',
  other: 'low',
};
```

### Conflict Detection Thresholds

| Conflict Type | Threshold | Description |
|---------------|-----------|-------------|
| Limit Variance | >50% | If lowest limit is <50% of highest limit |
| Deductible Variance | >100% | If highest deductible is >2x lowest deductible |
| Exclusion Mismatch | Binary | Exclusion present in some quotes, absent in others |

### Banner Component Structure

```tsx
// src/components/compare/gap-conflict-banner.tsx

interface GapConflictBannerProps {
  gaps: GapWarning[];
  conflicts: ConflictWarning[];
  onItemClick: (field: string) => void;
}

function GapConflictBanner({ gaps, conflicts, onItemClick }: GapConflictBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalIssues = gaps.length + conflicts.length;

  if (totalIssues === 0) return null;

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="font-medium">
              {gaps.length} potential gap{gaps.length !== 1 ? 's' : ''},
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} identified
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          {/* Gap items with severity badges */}
          {gaps.map(gap => (
            <button
              key={gap.field}
              onClick={() => onItemClick(gap.field)}
              className="flex items-center gap-2 py-1 hover:bg-amber-100 w-full text-left"
            >
              <SeverityBadge severity={gap.severity} />
              <span>{gap.field}: Missing in Quote {gap.documentsMissing.map(i => i + 1).join(', ')}</span>
            </button>
          ))}
          {/* Conflict items */}
          {conflicts.map(conflict => (
            <button
              key={conflict.field}
              onClick={() => onItemClick(conflict.field)}
              className="flex items-center gap-2 py-1 hover:bg-amber-100 w-full text-left"
            >
              <span className="text-red-600">⚠</span>
              <span>{conflict.description}</span>
            </button>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
```

### Scroll-to-Row Implementation

```typescript
// Scroll handler in comparison page
function scrollToRow(field: string) {
  const rowElement = document.querySelector(`[data-field="${field}"]`);
  if (rowElement) {
    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Add pulse animation
    rowElement.classList.add('animate-pulse-highlight');
    setTimeout(() => {
      rowElement.classList.remove('animate-pulse-highlight');
    }, 2000);
  }
}
```

### Project Structure Notes

```
src/lib/compare/
├── extraction.ts     # GPT extraction service (Story 7.2) ✅
├── diff.ts           # DiffEngine (Story 7.3) ✅ - EXTEND with detectGaps/detectConflicts
└── service.ts        # CompareService orchestration (future)

src/components/compare/
├── quote-selector.tsx       # Selection interface (Story 7.1) ✅
├── selection-counter.tsx    # Selection count (Story 7.1) ✅
├── extraction-card.tsx      # Extraction display (Story 7.2) ✅
├── comparison-table.tsx     # Side-by-side table (Story 7.3) ✅ - EXTEND with gap styling
├── gap-conflict-banner.tsx  # Warning summary (NEW)
└── severity-badge.tsx       # Severity indicator (NEW - optional, can inline)
```

### CSS Animation

```css
/* Add to globals.css or component */
@keyframes pulse-highlight {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgb(254 243 199); } /* amber-100 */
}

.animate-pulse-highlight {
  animation: pulse-highlight 0.5s ease-in-out 2;
}
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Story-7.4]
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Gap-Detection-Algorithm]
- [Source: docs/epics.md#Story-7.4]
- [Source: docs/sprint-artifacts/story-7.3-comparison-table-view.md]

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/7-4-gap-conflict-identification.context.xml`

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

None required - clean implementation.

### Completion Notes List

1. **Gap Detection (AC-7.4.1, AC-7.4.6)**
   - Implemented `detectGaps()` function identifying coverage present in some quotes but missing in others
   - Added `COVERAGE_SEVERITY` mapping with high/medium/low classifications
   - Gaps sorted by severity in returned array
   - 23 unit tests covering various coverage combinations

2. **Conflict Detection (AC-7.4.3, AC-7.4.6)**
   - Implemented `detectConflicts()` with three conflict types:
     - `limit_variance`: Flags when lowest limit <50% of highest
     - `deductible_variance`: Flags when highest deductible >2x lowest
     - `exclusion_mismatch`: Flags when exclusion present in some quotes but not others
   - Uses `EXCLUSION_SEVERITY` mapping for exclusion-based conflicts

3. **GapConflictBanner Component (AC-7.4.4, AC-7.4.5)**
   - New component at `src/components/compare/gap-conflict-banner.tsx`
   - Collapsible banner with summary counts ("X gaps, Y conflicts")
   - Severity badges (High/Medium/Low) with color coding
   - Click-to-scroll navigation with flash highlight effect
   - 14 unit tests covering rendering and interactions

4. **Row Styling (AC-7.4.2)**
   - Extended `ComparisonRow` interface with `isGap`, `gapSeverity`, `isConflict`, `conflictSeverity`
   - Gap rows: amber background + warning icon
   - Conflict rows: red-tinted background + warning icon
   - Added `data-field` attribute for scroll targeting

5. **Integration (AC-7.4.5)**
   - Updated comparison page to compute gaps/conflicts from extractions
   - `buildComparisonRows()` now includes gaps/conflicts in output
   - Rows automatically annotated with gap/conflict flags
   - Smooth scroll with 2-second ring highlight animation

6. **Test Coverage**
   - 37 unit tests (23 gap/conflict detection + 14 banner component)
   - E2E test spec created with 7 test cases using route mocking
   - All 1025 project tests passing
   - Build successful with no TypeScript errors

### File List

**New Files:**
- `src/components/compare/gap-conflict-banner.tsx` - Summary banner component
- `__tests__/lib/compare/gap-conflict-detection.test.ts` - Gap/conflict detection tests
- `__tests__/components/compare/gap-conflict-banner.test.tsx` - Banner component tests
- `__tests__/e2e/gap-conflict-display.spec.ts` - E2E test spec

**Modified Files:**
- `src/lib/compare/diff.ts` - Added `detectGaps()`, `detectConflicts()`, `annotateRowsWithIssues()`, types
- `src/components/compare/comparison-table.tsx` - Added gap/conflict row styling, warning icons
- `src/app/(dashboard)/compare/[id]/page.tsx` - Integrated GapConflictBanner, scroll-to-row
- `docs/sprint-artifacts/sprint-status.yaml` - Story status update
- `docs/sprint-artifacts/story-7.4-gap-conflict-identification.md` - This file

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (Bob) | Created story from Epic 7 Tech Spec via create-story workflow |
| 2025-12-03 | Dev Agent | Implemented all 7 tasks with 59 tests |
| 2025-12-03 | Senior Dev | Code Review: APPROVED - all 6 ACs verified |

---

## Code Review Notes

### Review Summary

| Category | Status |
|----------|--------|
| **Acceptance Criteria** | ✅ ALL PASS (6/6) |
| **Tests** | ✅ 59 passing (23 gap/conflict + 14 banner + 22 table) |
| **Build** | ✅ PASSES |
| **Code Quality** | ✅ EXCELLENT |

### Verified Implementations

- **AC-7.4.1:** `detectGaps()` at `diff.ts:738-781` - correctly identifies coverage gaps
- **AC-7.4.2:** Row annotation via `annotateRowsWithIssues()` - amber/red styling applied
- **AC-7.4.3:** `detectConflicts()` with 50% limit, 100% deductible, exclusion mismatch thresholds
- **AC-7.4.4:** `GapConflictBanner` component with collapsible issue list
- **AC-7.4.5:** Click-to-scroll with `data-field` targeting and flash highlight
- **AC-7.4.6:** `COVERAGE_SEVERITY` mapping + severity sorting

### Decision: ✅ APPROVED FOR MERGE

Excellent implementation with comprehensive test coverage and clean architecture.
