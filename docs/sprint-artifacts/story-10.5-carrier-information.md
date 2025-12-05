# Story 10.5: Carrier Information & Ratings

**Epic:** Epic 10 - Enhanced Quote Extraction & Analysis
**Points:** 2
**Priority:** P1 - Important for carrier comparison
**Status:** DONE

## Story

As an insurance agent, I need carrier information (AM Best rating, admitted status, NAIC code) extracted from quotes so I can assess carrier financial strength and regulatory status.

## Acceptance Criteria

### AC-10.5.1: AM Best Rating Extraction
- [x] Extract AM Best rating (A++, A+, A, A-, B++, etc.)
- [x] `amBestRating: string | null` field
- [x] Accept all standard AM Best rating formats

### AC-10.5.2: AM Best Financial Size Class
- [x] Extract Financial Size Class (I through XV in Roman numerals)
- [x] `amBestFinancialSize: string | null` field
- [x] Important for understanding carrier capacity

### AC-10.5.3: NAIC Code
- [x] Extract NAIC code for carrier identification
- [x] `naicCode: string | null` field
- [x] Usually 5-digit number

### AC-10.5.4: Admitted Status
- [x] Identify admitted vs non-admitted/surplus lines
- [x] `admittedStatus: AdmittedStatus | null` field
- [x] TypeScript type: `AdmittedStatus = 'admitted' | 'non-admitted' | 'surplus'`

### AC-10.5.5: Claims Contact
- [x] Extract claims department phone number
- [x] `claimsPhone: string | null` field
- [x] Useful for client reference

### AC-10.5.6: Underwriter
- [x] Extract underwriter name
- [x] `underwriter: string | null` field
- [x] Track individual handling the account

## Implementation Summary

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/types/compare.ts` | MODIFY | Added CarrierInfo interface; carrierInfoSchema Zod; AdmittedStatus type already existed |
| `src/lib/compare/extraction.ts` | MODIFY | Added carrier information extraction instructions |
| `__tests__/types/compare.test.ts` | MODIFY | Added 4 tests for CarrierInfo schema validation |

### Types Added

```typescript
export interface CarrierInfo {
  amBestRating: string | null;
  amBestFinancialSize: string | null;
  naicCode: string | null;
  admittedStatus: AdmittedStatus | null;
  claimsPhone: string | null;
  underwriter: string | null;
  sourcePages: number[];
}
```

### Extraction Prompt Additions

Added to EXTRACTION_SYSTEM_PROMPT:
- AM Best Rating formats (A++ through C-)
- AM Best Financial Size Class (I-XV)
- NAIC code identification
- Admitted vs non-admitted/surplus lines indicators
- Claims contact information
- Underwriter name extraction

## Test Coverage

- 4 unit tests for CarrierInfo schema
- Tests for complete carrier info validation
- Tests for all admitted status values
- Tests for all AM Best rating formats (12 ratings)
- Tests for default null handling

## Notes

- CarrierInfo is nullable at QuoteExtraction level
- AM Best ratings are free-form strings (not enum) to handle variations
- Admitted status affects guaranty fund protection and surplus lines taxes
- NAIC code enables carrier lookup in industry databases
- Claims phone and underwriter are convenience fields for agents

---

_Implemented: 2025-12-04_
_Author: Claude (epic-yolo mode)_
