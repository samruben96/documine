# Story 10.11: Testing & Migration

**Epic:** Epic 10 - Enhanced Quote Extraction & Analysis
**Points:** 2
**Priority:** P0 - Quality Gate
**Status:** ready-for-dev

## Story

As a development team,
I want comprehensive tests and backward compatibility verification for the enhanced extraction schema,
so that we can confidently deploy Epic 10 to production without breaking existing functionality.

## Background

### What This Story Validates

Epic 10 introduced significant schema extensions to the quote extraction system:
- **Story 10.1:** 12 new coverage types (cyber, epli, d_and_o, crime, pollution, etc.)
- **Story 10.2:** PolicyMetadata interface (formType, policyType, retroactiveDate, etc.)
- **Story 10.3:** Enhanced CoverageItem (aggregateLimit, SIR, coinsurance, waitingPeriod)
- **Story 10.4:** Endorsements array with critical endorsement detection
- **Story 10.5:** CarrierInfo interface (AM Best rating, admitted status)
- **Story 10.6:** PremiumBreakdown interface (coveragePremiums, taxes, fees)
- **Story 10.7:** Gap analysis service with risk scoring
- **Story 10.10:** Updated extraction prompts with few-shot examples
- **Story 10.12:** Extraction at upload time with `extraction_data` column

### Current State

| Metric | Value | Notes |
|--------|-------|-------|
| Total Tests | 1346 | All passing as of Story 10.12 |
| EXTRACTION_VERSION | 3 | Bump from Epic 7 (version 2) |
| Test Coverage | ~80% | Target maintained |
| Schema Fields | 50+ new | Across 6 new interfaces |

### Key Files to Validate

| File | Description |
|------|-------------|
| `src/types/compare.ts` | Types and Zod schemas for all extraction data |
| `src/lib/compare/extraction.ts` | GPT-5.1 extraction service |
| `src/lib/compare/diff.ts` | Comparison diff engine |
| `src/lib/compare/gap-analysis.ts` | Gap detection service |
| `src/components/compare/comparison-table.tsx` | Enhanced comparison UI |
| `src/components/one-pager/*` | Enhanced PDF generation |
| `supabase/functions/process-document/index.ts` | Upload-time extraction |

## Acceptance Criteria

### AC-10.11.1: Backward Compatibility - Old Extractions Load
- [ ] Extractions from version 1 (Epic 7) display correctly in comparison table
- [ ] Extractions from version 2 (Epic 8/9) display correctly
- [ ] Missing new fields (policyMetadata, endorsements, etc.) render gracefully with fallbacks
- [ ] No errors thrown when new fields are `null` or `undefined`

### AC-10.11.2: Schema Validation Tests
- [ ] All Zod schemas parse valid extraction data without errors
- [ ] Zod schemas reject invalid data with appropriate error messages
- [ ] Nullable fields accept both `null` and valid values
- [ ] Required fields reject missing values
- [ ] Schema tests cover all 6 new interfaces (PolicyMetadata, Endorsement, CarrierInfo, PremiumBreakdown, CoveragePremium, GapAnalysis)

### AC-10.11.3: All Existing Tests Pass
- [ ] `npm run test` passes all 1346+ tests
- [ ] `npm run build` completes without TypeScript errors
- [ ] `npx tsc --noEmit` shows no type errors
- [ ] No regressions in existing functionality

### AC-10.11.4: New Feature Test Coverage
- [ ] Gap analysis service has comprehensive unit tests
- [ ] Enhanced comparison table has component tests
- [ ] Endorsement matrix displays correctly
- [ ] Premium breakdown table renders properly
- [ ] One-pager PDF includes all new sections

### AC-10.11.5: E2E Test Suite
- [ ] E2E test for full extraction flow (upload → extract → compare)
- [ ] E2E test for gap analysis display
- [ ] E2E test for endorsement matrix
- [ ] E2E test for one-pager with new sections

### AC-10.11.6: Performance Validation
- [ ] Extraction time < 60 seconds average (per document)
- [ ] Comparison page load < 5 seconds with pre-extracted data
- [ ] No memory leaks in extraction flow
- [ ] Document processing completes within timeout

### AC-10.11.7: Documentation Updated
- [ ] CLAUDE.md updated with Epic 10 patterns and conventions
- [ ] New schema fields documented in code comments
- [ ] Test coverage report generated

## Tasks / Subtasks

- [ ] **Task 1: Backward Compatibility Testing** (AC: 10.11.1)
  - [ ] Create mock v1 extraction data fixture
  - [ ] Create mock v2 extraction data fixture
  - [ ] Test comparison table renders v1 data without errors
  - [ ] Test comparison table renders v2 data without errors
  - [ ] Test one-pager renders with missing new fields
  - [ ] Test gap analysis handles null endorsements

- [ ] **Task 2: Schema Validation Tests** (AC: 10.11.2)
  - [ ] Test PolicyMetadata schema validation
  - [ ] Test Endorsement schema validation
  - [ ] Test CarrierInfo schema validation
  - [ ] Test PremiumBreakdown schema validation
  - [ ] Test GapAnalysis schema validation
  - [ ] Test full QuoteExtraction v3 schema

- [ ] **Task 3: Gap Analysis Unit Tests** (AC: 10.11.4)
  - [ ] Test detectMissingCoverages with various scenarios
  - [ ] Test detectLimitConcerns with limit thresholds
  - [ ] Test detectEndorsementGaps with critical endorsements
  - [ ] Test risk score calculation weights
  - [ ] Test edge cases (empty coverages, no gaps)

- [ ] **Task 4: UI Component Tests** (AC: 10.11.4)
  - [ ] Test EndorsementMatrix renders correctly
  - [ ] Test PremiumBreakdownTable displays values
  - [ ] Test CollapsibleSection expands/collapses
  - [ ] Test GapConflictBanner displays risk score
  - [ ] Test source citations in enhanced table

- [ ] **Task 5: E2E Test Suite** (AC: 10.11.5)
  - [ ] Create `__tests__/e2e/epic-10-extraction.spec.ts`
  - [ ] Test document upload triggers extraction
  - [ ] Test comparison shows endorsement matrix
  - [ ] Test gap analysis banner appears
  - [ ] Test one-pager download includes new sections

- [ ] **Task 6: Performance Testing** (AC: 10.11.6)
  - [ ] Measure average extraction time on test corpus
  - [ ] Measure comparison page load time
  - [ ] Check for memory leaks in extraction hook
  - [ ] Validate document processing timeout handling

- [ ] **Task 7: Build Verification** (AC: 10.11.3)
  - [ ] Run `npm run test` - all tests pass
  - [ ] Run `npm run build` - no errors
  - [ ] Run `npx tsc --noEmit` - no type errors
  - [ ] Run `npx eslint src --ext .ts,.tsx` - no lint errors

- [ ] **Task 8: Documentation** (AC: 10.11.7)
  - [ ] Update CLAUDE.md with Epic 10 patterns
  - [ ] Document schema version history
  - [ ] Generate test coverage report

## Dev Notes

### Test Fixtures Required

Create mock extraction data for each schema version:

```typescript
// __tests__/fixtures/extraction-v1.ts
export const v1Extraction: QuoteExtraction = {
  carrierName: 'Test Carrier',
  policyNumber: 'POL-001',
  namedInsured: 'Test Corp',
  effectiveDate: '2025-01-01',
  expirationDate: '2026-01-01',
  annualPremium: 10000,
  coverages: [
    {
      type: 'general_liability',
      name: 'Commercial General Liability',
      limit: 1000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 1000,
      description: 'CGL Coverage',
      sourcePages: [1],
    },
  ],
  exclusions: [],
  deductibles: [],
  extractedAt: '2025-12-01T00:00:00Z',
  modelUsed: 'gpt-5.1',
  // v1: No new fields (all null/undefined)
  policyMetadata: null,
  endorsements: [],
  carrierInfo: null,
  premiumBreakdown: null,
};
```

### Backward Compatibility Patterns

```typescript
// Safe field access pattern
const amBestRating = extraction.carrierInfo?.amBestRating ?? 'N/A';
const endorsementCount = extraction.endorsements?.length ?? 0;
const hasGaps = (gaps?.missingCoverages?.length ?? 0) > 0;
```

### Schema Version History

| Version | Epic | Date | Changes |
|---------|------|------|---------|
| 1 | Epic 7 | 2025-12-03 | Initial schema (9 coverage types) |
| 2 | Epic 8-9 | 2025-12-03 | Rate limiting, branding |
| 3 | Epic 10 | 2025-12-04 | Enhanced extraction (12 new coverage types, 6 new interfaces) |

### Test Location Conventions

| Test Type | Location | Pattern |
|-----------|----------|---------|
| Unit tests | `__tests__/lib/` | `*.test.ts` |
| Component tests | `__tests__/components/` | `*.test.tsx` |
| Hook tests | `__tests__/hooks/` | `*.test.ts` |
| E2E tests | `__tests__/e2e/` | `*.spec.ts` |

### Project Structure Notes

- All tests must pass before merging
- TypeScript strict mode enabled
- ESLint rules enforced
- Coverage target: >80%

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-10.md#Testing-Strategy]
- [Source: docs/epics/epic-10-enhanced-quote-extraction.md#Story-10.11]
- [Source: src/types/compare.ts] - Schema definitions
- [Source: __tests__/types/compare.test.ts] - Existing schema tests

### Learnings from Previous Story (10.12)

**From Story 10-12-extraction-at-upload-time (Status: done)**

- **EXTRACTION_VERSION = 3**: All version checks should use this constant
- **OpenAI Structured Output Fix**: ALL properties must be in `required` arrays; nullable fields use `type: ['string', 'null']`
- **Edge Function Pattern**: 60s timeout with AbortController for extraction
- **Cache Hit/Miss Logging**: Performance monitoring in compare route
- **Test Baseline**: 1346 tests passing, use as regression baseline
- **QA Validation**: 32 coverages, 12 exclusions extracted from test document

[Source: docs/sprint-artifacts/story-10.12-extraction-at-upload-time.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/10-11-testing-migration.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

_Drafted: 2025-12-04_
_Author: SM Agent (Bob)_
