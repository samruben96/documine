# Story 10.6: Premium Breakdown

**Epic:** Epic 10 - Enhanced Quote Extraction & Analysis
**Points:** 2
**Priority:** P1 - Important for premium analysis
**Status:** DONE

## Story

As an insurance agent, I need premium breakdown (per-coverage premiums, taxes, fees) extracted from quotes so I can explain costs to clients and compare value across carriers.

## Acceptance Criteria

### AC-10.6.1: Base Premium
- [x] Extract base premium before taxes/fees
- [x] `basePremium: number | null` field
- [x] Separate from total premium

### AC-10.6.2: Per-Coverage Premium
- [x] Extract itemized premium by coverage type
- [x] `coveragePremiums: CoveragePremium[]` array
- [x] Each item has coverage name and premium amount

### AC-10.6.3: Taxes
- [x] Extract state/local premium taxes
- [x] `taxes: number | null` field
- [x] Common component in premium schedules

### AC-10.6.4: Fees
- [x] Extract policy fees, inspection fees, etc.
- [x] `fees: number | null` field
- [x] Separate from taxes

### AC-10.6.5: Broker Fee
- [x] Extract broker/agent fee
- [x] `brokerFee: number | null` field
- [x] May be commission or explicit fee

### AC-10.6.6: Surplus Lines Tax
- [x] Extract surplus lines tax for non-admitted carriers
- [x] `surplusLinesTax: number | null` field
- [x] Usually 3-5% for non-admitted carriers

### AC-10.6.7: Total Premium
- [x] Extract total premium including all components
- [x] `totalPremium: number` required field
- [x] Only required field in premium breakdown

### AC-10.6.8: Payment Plan
- [x] Extract payment plan description
- [x] `paymentPlan: string | null` field
- [x] Common values: Annual, Semi-Annual, Quarterly, Monthly

## Implementation Summary

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/types/compare.ts` | MODIFY | Added CoveragePremium interface; PremiumBreakdown interface; coveragePremiumSchema and premiumBreakdownSchema Zod |
| `src/lib/compare/extraction.ts` | MODIFY | Added premium breakdown extraction instructions; few-shot example |
| `__tests__/types/compare.test.ts` | MODIFY | Added 6 tests for PremiumBreakdown schema validation |

### Types Added

```typescript
export interface CoveragePremium {
  coverage: string;
  premium: number;
}

export interface PremiumBreakdown {
  basePremium: number | null;
  coveragePremiums: CoveragePremium[];
  taxes: number | null;
  fees: number | null;
  brokerFee: number | null;
  surplusLinesTax: number | null;
  totalPremium: number;  // Required
  paymentPlan: string | null;
  sourcePages: number[];
}
```

### Extraction Prompt Additions

Added to EXTRACTION_SYSTEM_PROMPT:
- Premium schedule identification
- Base premium vs total premium distinction
- Per-coverage premium allocation
- Tax and fee separation
- Surplus lines tax for non-admitted carriers
- Payment plan options
- Few-shot example for premium breakdown

## Test Coverage

- 6 unit tests for PremiumBreakdown schema
- Tests for complete premium breakdown validation
- Tests for totalPremium required validation
- Tests for coverage premium item validation
- Tests for surplus lines tax handling
- Tests for default null handling

## Notes

- PremiumBreakdown is nullable at QuoteExtraction level
- totalPremium is the only required field (all others optional)
- coveragePremiums array shows how premium is allocated
- surplusLinesTax only applies to non-admitted carriers
- Payment plan helps agents discuss financing options

---

_Implemented: 2025-12-04_
_Author: Claude (epic-yolo mode)_
