# Story 10.7: Automated Gap Analysis

Status: done

## Story

As an insurance agent,
I want automated gap analysis that identifies missing coverages, inadequate limits, and missing endorsements,
so that I can quickly identify risks and coverage holes for my clients.

## Acceptance Criteria

### AC-10.7.1: Missing Coverages Detection
- [x] Identify coverages present in some quotes but missing in others (extends existing detectGaps)
- [x] Flag critical coverages (GL, Property, Workers' Comp) with high importance
- [x] Return `MissingCoverage[]` array with importance and reason

### AC-10.7.2: Limit Concerns Detection
- [x] Compare limits against industry minimum thresholds
- [x] Flag inadequate limits based on MINIMUM_LIMITS configuration
- [x] Return `LimitConcern[]` with currentLimit, recommendedMinimum, and reason
- [x] Minimum thresholds:
  - General Liability: $1,000,000 per occurrence
  - Property: $500,000
  - Umbrella: $1,000,000
  - Professional Liability: $1,000,000
  - Cyber: $500,000

### AC-10.7.3: Endorsement Gap Detection
- [x] Compare quotes against CRITICAL_ENDORSEMENTS list
- [x] Identify endorsements present in some quotes but missing in others
- [x] Return `EndorsementGap[]` with endorsement, formNumber, importance, reason, presentIn
- [x] Critical endorsements:
  - CG 20 10 (Additional Insured - OLC)
  - CG 20 37 (Additional Insured - Completed Ops)
  - CG 24 04 (Waiver of Subrogation)
  - Primary and Non-Contributory

### AC-10.7.4: Overall Risk Score
- [x] Calculate overallRiskScore (0-100, higher = more gaps/risk)
- [x] Weight factors:
  - Critical missing coverages: +25 each
  - Medium missing coverages: +10 each
  - Inadequate limits: +15 each
  - Missing critical endorsements: +20 each
  - Missing recommended endorsements: +5 each
- [x] Cap at 100

### AC-10.7.5: GapAnalysis Interface
- [x] Create GapAnalysis type with all sub-interfaces
- [x] Add to QuoteExtraction as optional field (for single-quote analysis)
- [x] Create standalone `analyzeGaps()` function for comparison analysis
- [x] Integrate with existing ComparisonTableData

### AC-10.7.6: Gap Analysis Banner Enhancement
- [x] Update GapConflictBanner to display endorsement gaps
- [x] Show risk score badge (green <30, yellow 30-60, red >60)
- [x] List missing critical endorsements prominently

## Tasks / Subtasks

- [x] Task 1: Create GapAnalysis types (AC: 10.7.5)
  - [x] Add GapAnalysis, MissingCoverage, LimitConcern, EndorsementGap interfaces to `src/types/compare.ts`
  - [x] Add Zod schemas for validation
  - [x] Export types and constants

- [x] Task 2: Create gap-analysis.ts service (AC: 10.7.1, 10.7.2, 10.7.3, 10.7.4)
  - [x] Create `src/lib/compare/gap-analysis.ts`
  - [x] Implement `analyzeGaps(extractions: QuoteExtraction[]): GapAnalysis`
  - [x] Implement `detectMissingCoverages()` - reuse/extend existing detectGaps logic
  - [x] Implement `detectLimitConcerns()` - compare against MINIMUM_LIMITS
  - [x] Implement `detectEndorsementGaps()` - compare against CRITICAL_ENDORSEMENTS
  - [x] Implement `calculateRiskScore()` - weighted sum of all concerns

- [x] Task 3: Integrate with diff.ts (AC: 10.7.5)
  - [x] Update `buildComparisonRows()` to call `analyzeGaps()`
  - [x] Add `gapAnalysis` to `ComparisonTableData` interface
  - [x] Ensure existing gaps/conflicts still work alongside new analysis

- [x] Task 4: Update GapConflictBanner (AC: 10.7.6)
  - [x] Add endorsement gaps section to banner
  - [x] Add risk score badge component
  - [x] Style high/medium/low severity consistently

- [x] Task 5: Unit tests (AC: All)
  - [x] Create `__tests__/lib/compare/gap-analysis.test.ts`
  - [x] Test missing coverage detection
  - [x] Test limit concern detection
  - [x] Test endorsement gap detection
  - [x] Test risk score calculation
  - [x] Test edge cases (no gaps, all gaps, single quote)

- [x] Task 6: E2E test (AC: 10.7.6)
  - [x] Create `__tests__/e2e/gap-analysis-display.spec.ts`
  - [x] Test gap analysis banner displays correctly
  - [x] Test risk score badge appears

- [x] Task 7: Build and test (AC: All)
  - [x] Run `npm run build` - no errors
  - [x] Run `npm test` - all tests pass

## Dev Notes

### Technical Approach

**Reuse Existing Gap Detection:**
The existing `detectGaps()` in `diff.ts` (line 777) already identifies coverages present in some quotes but missing in others. Story 10.7 extends this with:
1. Limit adequacy checking
2. Endorsement gap detection
3. Risk score calculation

**GapAnalysis Interface (from Tech Spec):**
```typescript
interface GapAnalysis {
  missingCoverages: MissingCoverage[];
  limitConcerns: LimitConcern[];
  endorsementGaps: EndorsementGap[];
  overallRiskScore: number;  // 0-100 (higher = more gaps)
}

interface MissingCoverage {
  coverageType: CoverageType;
  importance: 'critical' | 'recommended' | 'optional';
  reason: string;
  presentIn: string[];  // Carrier names with this coverage
}

interface LimitConcern {
  coverage: string;
  currentLimit: number;
  recommendedMinimum: number;
  reason: string;
  documentIndex: number;  // Which quote has inadequate limit
}

interface EndorsementGap {
  endorsement: string;
  formNumber: string | null;
  importance: 'critical' | 'recommended';
  reason: string;
  presentIn: string[];  // Carrier names with this endorsement
}
```

**Constants (from Tech Spec):**
```typescript
const MINIMUM_LIMITS: Partial<Record<CoverageType, number>> = {
  general_liability: 1000000,      // $1M per occurrence
  property: 500000,                // $500K
  umbrella: 1000000,               // $1M
  professional_liability: 1000000, // $1M
  cyber: 500000,                   // $500K
};

const CRITICAL_ENDORSEMENTS = [
  { form: 'CG 20 10', name: 'Additional Insured - Owners, Lessees or Contractors', importance: 'critical' },
  { form: 'CG 20 37', name: 'Additional Insured - Completed Operations', importance: 'critical' },
  { form: 'CG 24 04', name: 'Waiver of Subrogation', importance: 'critical' },
  { form: 'Primary and Non-Contributory', name: 'Primary and Non-Contributory', importance: 'recommended' },
];
```

### Risk Score Calculation

```typescript
function calculateRiskScore(analysis: Omit<GapAnalysis, 'overallRiskScore'>): number {
  let score = 0;

  // Missing coverages
  for (const mc of analysis.missingCoverages) {
    if (mc.importance === 'critical') score += 25;
    else if (mc.importance === 'recommended') score += 10;
    else score += 5;
  }

  // Limit concerns
  score += analysis.limitConcerns.length * 15;

  // Endorsement gaps
  for (const eg of analysis.endorsementGaps) {
    if (eg.importance === 'critical') score += 20;
    else score += 5;
  }

  return Math.min(100, score);
}
```

### File Locations

| File | Action | Purpose |
|------|--------|---------|
| `src/types/compare.ts` | MODIFY | Add GapAnalysis, MissingCoverage, LimitConcern, EndorsementGap interfaces |
| `src/lib/compare/gap-analysis.ts` | CREATE | Gap analysis service with analyzeGaps(), detection functions |
| `src/lib/compare/diff.ts` | MODIFY | Integrate analyzeGaps() into buildComparisonRows() |
| `src/components/compare/gap-conflict-banner.tsx` | MODIFY | Add endorsement gaps, risk score badge |
| `__tests__/lib/compare/gap-analysis.test.ts` | CREATE | Unit tests for gap analysis |
| `__tests__/e2e/gap-analysis-display.spec.ts` | CREATE | E2E tests for UI display |

### Project Structure Notes

- Follows existing pattern in `src/lib/compare/` for comparison services
- Reuses COVERAGE_SEVERITY from diff.ts for importance mapping
- Integrates with existing GapConflictBanner component

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-10.md#Technical-Approach - Gap Analysis Logic]
- [Source: docs/epics/epic-10-enhanced-quote-extraction.md#Story-10.7]
- [Source: src/lib/compare/diff.ts#detectGaps - Existing gap detection to extend]
- [Source: src/types/compare.ts#CRITICAL_ENDORSEMENTS - Already defined in Story 10.4]

### Learnings from Previous Story

**From Story 10.6 (Premium Breakdown):**
- Nullable pattern works well: `field: Type | null`
- Zod schemas use `.nullable().default(null)` for optional fields
- Types are already extended in compare.ts - just add GapAnalysis-related interfaces

### Important: Story 10.12 Context (Extraction at Upload Time)

**Story 10.12 is DONE** - Extraction now happens at document upload time:

- **Extraction data location:** `documents.extraction_data` JSONB column (not just `quote_extractions` table)
- **EXTRACTION_VERSION = 3** - Current schema version for cache invalidation
- **Comparison cache hit logic:** `/api/compare` checks `documents.extraction_data` first before on-demand extraction
- **Chat RAG integration:** `getStructuredExtractionData()`, `formatStructuredContext()` in `src/lib/chat/rag.ts`
- **Document Library:** Now shows carrier name, premium from `extraction_data`

**Impact on Gap Analysis:**
- Gap analysis can potentially access `documents.extraction_data` for single-quote analysis
- Pre-extracted data means instant gap analysis on comparison page (no wait)
- Source citations preserved via `sourcePages` arrays in all extracted fields
- Consider adding `gapAnalysis` field to stored extraction (future enhancement)

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/10-7-automated-gap-analysis.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build: ✅ Passed (Next.js 16.0.4)
- Unit Tests: ✅ 33 tests passing in gap-analysis.test.ts
- Component Tests: ✅ 21 tests passing in gap-conflict-banner.test.tsx
- All Compare Tests: ✅ 286 tests passing across 14 files

### Completion Notes List

**Implementation Summary:**

1. **Types (src/types/compare.ts):**
   - Added `GapImportance` type: 'critical' | 'recommended' | 'optional'
   - Added `MissingCoverage`, `LimitConcern`, `EndorsementGap`, `GapAnalysis` interfaces
   - Added `MINIMUM_LIMITS`, `CRITICAL_COVERAGES`, `RECOMMENDED_COVERAGES` constants
   - Added Zod schemas for all new types

2. **Gap Analysis Service (src/lib/compare/gap-analysis.ts):**
   - `detectMissingCoverages()` - Identifies coverages in some quotes but not others
   - `detectLimitConcerns()` - Compares limits against MINIMUM_LIMITS thresholds
   - `detectEndorsementGaps()` - Compares against CRITICAL_ENDORSEMENTS list
   - `calculateRiskScore()` - Weighted sum capped at 100
   - `analyzeGaps()` - Main entry point, returns complete GapAnalysis
   - `getRiskLevel()` - Maps score to low/medium/high for UI

3. **Integration (src/lib/compare/diff.ts):**
   - Added `gapAnalysis` field to `ComparisonTableData` interface
   - Integrated `analyzeGaps()` call in `buildComparisonRows()`
   - Existing gaps/conflicts continue to work alongside new analysis

4. **UI Enhancement (src/components/compare/gap-conflict-banner.tsx):**
   - Added `RiskScoreBadge` component with color-coded display (green/yellow/red)
   - Added `ImportanceBadge` component for endorsement importance
   - Added `EndorsementGapItem` component showing form number, name, reason
   - Added `LimitConcernItem` component showing current vs recommended limits
   - Updated banner to show total issue count instead of separate gap/conflict counts
   - Sections: Coverage Gaps, Limit Concerns, Missing Endorsements, Conflicts

5. **Tests:**
   - 33 unit tests for gap analysis logic
   - 21 component tests for banner display (including 7 new tests for gap analysis features)
   - E2E tests for gap analysis display on comparison page

### File List

| File | Action |
|------|--------|
| `src/types/compare.ts` | MODIFIED - Added gap analysis types, constants, Zod schemas |
| `src/lib/compare/gap-analysis.ts` | CREATED - Gap analysis service with all detection functions |
| `src/lib/compare/diff.ts` | MODIFIED - Integrated analyzeGaps(), added gapAnalysis to interface |
| `src/components/compare/gap-conflict-banner.tsx` | MODIFIED - Added endorsement gaps, limit concerns, risk score badge |
| `src/app/(dashboard)/compare/[id]/page.tsx` | MODIFIED - Pass gapAnalysis to GapConflictBanner |
| `__tests__/lib/compare/gap-analysis.test.ts` | CREATED - 33 unit tests |
| `__tests__/components/compare/gap-conflict-banner.test.tsx` | MODIFIED - Added 7 new tests for gap analysis features |
| `__tests__/e2e/gap-analysis-display.spec.ts` | CREATED - E2E tests for UI display |
| `docs/sprint-artifacts/story-10.7-automated-gap-analysis.md` | MODIFIED - Marked complete |

## Code Review

### Senior Dev Code Review: ✅ APPROVED

**Reviewer:** Claude Opus 4.5
**Date:** 2025-12-04
**Commit:** `feee1a4`

### Code Quality Assessment

| File | Assessment | Notes |
|------|------------|-------|
| `src/lib/compare/gap-analysis.ts` | ✅ Excellent | Clear separation of concerns, well-documented with JSDoc, proper constants for weights |
| `src/types/compare.ts` | ✅ Good | Clean type definitions, Zod schemas provided, follows existing patterns |
| `src/lib/compare/diff.ts` | ✅ Good | Clean integration at line 712, no breaking changes to existing functionality |
| `src/components/compare/gap-conflict-banner.tsx` | ✅ Good | Extracted sub-components, proper accessibility (aria-label, aria-expanded), data-testid attributes |

### Strengths

1. **Architecture:**
   - Dedicated detection functions for each gap type (`detectMissingCoverages`, `detectLimitConcerns`, `detectEndorsementGaps`)
   - Clean helper functions (`getCoverageImportance`, `getCarrierName`, `getCoverageLabel`)
   - Early returns for edge cases (e.g., `extractions.length < 2`)

2. **Code Quality:**
   - JSDoc comments reference specific acceptance criteria
   - Proper use of constants for risk weights and coverage reasons
   - Sorting by importance priority for consistent output
   - `getRiskLevel()` exported separately for UI reuse

3. **UI Components:**
   - `RiskScoreBadge`, `ImportanceBadge`, `EndorsementGapItem`, `LimitConcernItem` properly extracted
   - Currency formatting via `Intl.NumberFormat`
   - Responsive styling with Tailwind classes

4. **Testing:**
   - 33 unit tests covering all detection functions and edge cases
   - 7 new component tests for gap analysis features
   - Playwright E2E tests for UI display

### Acceptance Criteria Verification

| AC | Status |
|---|---|
| AC-10.7.1: Missing Coverages Detection | ✅ |
| AC-10.7.2: Limit Concerns Detection | ✅ |
| AC-10.7.3: Endorsement Gap Detection | ✅ |
| AC-10.7.4: Overall Risk Score | ✅ |
| AC-10.7.5: GapAnalysis Interface | ✅ |
| AC-10.7.6: Banner Enhancement | ✅ |

### Build & Test Status

- **Build:** ✅ Passing (Next.js 16.0.4)
- **Unit Tests:** ✅ 33 tests in gap-analysis.test.ts
- **Component Tests:** ✅ 21 tests in gap-conflict-banner.test.tsx
- **All Compare Tests:** ✅ 286 tests across 14 files

### Recommendation

**APPROVED FOR MERGE** - Implementation is solid, well-tested, and follows project patterns.
