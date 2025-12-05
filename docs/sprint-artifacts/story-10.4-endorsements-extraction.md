# Story 10.4: Endorsements Extraction

**Epic:** Epic 10 - Enhanced Quote Extraction & Analysis
**Points:** 3
**Priority:** P0 - Critical for contract compliance
**Status:** DONE

## Story

As an insurance agent, I need endorsements extracted from quotes (CG 20 10, Waiver of Subrogation, etc.) so I can verify contract requirements are met and compare endorsement coverage across carriers.

## Acceptance Criteria

### AC-10.4.1: Endorsement Form Number Extraction
- [x] Extract form numbers exactly as they appear (CG 20 10, not CG2010)
- [x] `formNumber: string` required field
- [x] Preserve spaces in form numbers

### AC-10.4.2: Endorsement Type Classification
- [x] Classify as broadening, restricting, or conditional
- [x] `type: EndorsementType` enum field
- [x] TypeScript type: `EndorsementType = 'broadening' | 'restricting' | 'conditional'`

### AC-10.4.3: Endorsement Details
- [x] Extract endorsement name/title
- [x] Extract brief description of what endorsement does
- [x] Track affected coverage (null if policy-wide)

### AC-10.4.4: Critical Endorsement Detection
- [x] Prioritize finding: CG 20 10, CG 20 37, CG 24 04, CG 20 01
- [x] CRITICAL_ENDORSEMENTS constant for reference
- [x] Prompt emphasizes these endorsements

### AC-10.4.5: Endorsements Array
- [x] `endorsements: Endorsement[]` on QuoteExtraction
- [x] Empty array if no endorsements found
- [x] Each endorsement has sourcePages for citation

### AC-10.4.6: Zod Schema Validation
- [x] endorsementSchema validates all fields
- [x] Required: formNumber, name, type, description
- [x] Optional: affectedCoverage, sourcePages

## Implementation Summary

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/types/compare.ts` | MODIFY | Added EndorsementType type; Endorsement interface; endorsementSchema Zod; CRITICAL_ENDORSEMENTS constant |
| `src/lib/compare/extraction.ts` | MODIFY | Added comprehensive endorsement extraction instructions; few-shot example |
| `__tests__/types/compare.test.ts` | MODIFY | Added 5 tests for Endorsement schema validation |

### Types Added

```typescript
export type EndorsementType = 'broadening' | 'restricting' | 'conditional';

export interface Endorsement {
  formNumber: string;
  name: string;
  type: EndorsementType;
  description: string;
  affectedCoverage: string | null;
  sourcePages: number[];
}

export const CRITICAL_ENDORSEMENTS = [
  { formNumber: 'CG 20 10', name: 'Additional Insured - Owners, Lessees or Contractors', importance: 'critical' },
  { formNumber: 'CG 20 37', name: 'Additional Insured - Completed Operations', importance: 'critical' },
  { formNumber: 'CG 24 04', name: 'Waiver of Transfer of Rights (Waiver of Subrogation)', importance: 'critical' },
  { formNumber: 'CG 20 01', name: 'Primary and Non-Contributory', importance: 'recommended' },
] as const;
```

### Extraction Prompt Additions

Added to EXTRACTION_SYSTEM_PROMPT:
- Endorsement section indicators ("Endorsements", "Schedule of Forms", etc.)
- Form number preservation (CG 20 10, not CG2010)
- Type classification guide
- Critical endorsements list to prioritize
- Few-shot example for endorsement extraction

## Test Coverage

- 5 unit tests for Endorsement schema
- Tests for complete endorsement validation
- Tests for all endorsement types (broadening, restricting, conditional)
- Tests for required field validation
- Tests for affectedCoverage default to null
- Tests for CRITICAL_ENDORSEMENTS validation

## Notes

- Endorsements array defaults to empty if none found
- Form numbers preserved with spaces per industry standard
- Type classification helps identify coverage impact:
  - `broadening`: Adds coverage (Additional Insured, Blanket endorsements)
  - `restricting`: Limits coverage (Exclusions, Limitations)
  - `conditional`: Depends on circumstances (Audit provisions, Notice requirements)
- Critical endorsements are contract requirements that agents check first

---

_Implemented: 2025-12-04_
_Author: Claude (epic-yolo mode)_
