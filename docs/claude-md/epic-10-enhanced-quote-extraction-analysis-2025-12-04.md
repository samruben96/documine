# Epic 10: Enhanced Quote Extraction & Analysis (2025-12-04)

## Schema Version History

| Version | Epic | Changes |
|---------|------|---------|
| 1 | Epic 7 | Initial schema (9 coverage types) |
| 2 | Epic 8-9 | Rate limiting, branding |
| 3 | Epic 10 | Enhanced extraction (12 new coverage types, 6 new interfaces) |

**Current Version:** `EXTRACTION_VERSION = 3` (in `src/types/compare.ts`)

## Epic 10 Coverage Types

Original 9 types (Epic 7):
- `general_liability`, `property`, `auto`, `workers_compensation`, `umbrella`, `professional_liability`, `cyber`, `directors_officers`, `epli`

New 12 types (Epic 10):
- `crime`, `pollution`, `inland_marine`, `builders_risk`, `business_interruption`, `product_liability`, `garage_liability`, `liquor_liability`, `medical_malpractice`, `fiduciary`, `excess`, `bop`

## Epic 10 Interfaces

Six new interfaces added to `src/types/compare.ts`:

```typescript
// PolicyMetadata - Form and policy type info
interface PolicyMetadata {
  formType: 'iso' | 'manuscript' | 'proprietary' | null;
  policyType: 'occurrence' | 'claims_made' | null;
  formNumbers: string[] | null;
  retroactiveDate: string | null;
  jurisdiction: string | null;
}

// Endorsement - Policy endorsements with type
interface Endorsement {
  formNumber: string;
  name: string;
  type: 'broadening' | 'restricting' | 'conditional';
  description: string;
  affectedCoverage: string | null;
  sourcePages: number[];
}

// CarrierInfo - Carrier details including ratings
interface CarrierInfo {
  amBestRating: string | null;
  amBestOutlook: string | null;
  admittedStatus: 'admitted' | 'non-admitted' | null;
  headquarters: string | null;
  naicCode: string | null;
}

// PremiumBreakdown - Itemized premium components
interface PremiumBreakdown {
  basePremium: number | null;
  coveragePremiums: CoveragePremium[];
  taxes: number | null;
  fees: number | null;
  brokerFee: number | null;
  surplusLinesTax: number | null;
  totalPremium: number;
  paymentPlan: string | null;
  sourcePages: number[];
}
```

## Enhanced CoverageItem Fields

New fields added to `CoverageItem` in Epic 10:

```typescript
interface CoverageItem {
  // Existing fields...
  aggregateLimit: number | null;      // NEW: Annual aggregate
  selfInsuredRetention: number | null; // NEW: SIR amount
  coinsurance: number | null;          // NEW: Coinsurance %
  waitingPeriod: string | null;        // NEW: BI waiting period
  indemnityPeriod: string | null;      // NEW: BI indemnity period
}
```

## Critical Endorsements

These endorsements are flagged as "critical" in the EndorsementMatrix:

```typescript
// src/types/compare.ts
export const CRITICAL_ENDORSEMENTS = [
  { formNumber: 'CG 20 10', name: 'Additional Insured - Owners, Lessees, Contractors' },
  { formNumber: 'CG 20 37', name: 'Additional Insured - Owners, Lessees, Contractors (Completed Ops)' },
  { formNumber: 'CG 24 04', name: 'Waiver of Transfer of Rights of Recovery' },
];
```

## Gap Analysis Service

**File:** `src/lib/compare/gap-analysis.ts`

```typescript
import { analyzeGaps, calculateRiskScore, getRiskLevel } from '@/lib/compare/gap-analysis';

// Analyze gaps between extractions
const result = analyzeGaps(extractions);
// Returns: { missingCoverages, limitConcerns, endorsementGaps, overallRiskScore }

// Risk score thresholds
getRiskLevel(0-29)  // 'low' - green
getRiskLevel(30-59) // 'medium' - amber
getRiskLevel(60-100) // 'high' - red
```

## Epic 10 UI Components

**Comparison Table Sections:**
- `CollapsibleSection` - Expandable/collapsible section with chevron
- `EndorsementMatrix` - Grid showing endorsements across quotes
- `PremiumBreakdownTable` - Premium component comparison

**Test IDs:**
- `data-testid="collapsible-section-{title}"` - Section toggle button
- `data-testid="endorsement-matrix"` - Endorsement grid
- `data-testid="premium-breakdown-table"` - Premium table
- `data-testid="gap-conflict-banner"` - Gap analysis banner
- `data-testid="risk-score-badge"` - Risk score indicator

## Backward Compatibility Pattern

Always use optional chaining and nullish coalescing for Epic 10 fields:

```typescript
// Safe field access
const amBestRating = extraction.carrierInfo?.amBestRating ?? 'N/A';
const endorsementCount = extraction.endorsements?.length ?? 0;
const hasGaps = (gaps?.missingCoverages?.length ?? 0) > 0;

// Check for Epic 10 data
const hasEpic10Data = extraction.policyMetadata !== null ||
                      extraction.endorsements.length > 0 ||
                      extraction.carrierInfo !== null ||
                      extraction.premiumBreakdown !== null;
```

## Extraction at Upload Time (Story 10.12)

Quote extraction now happens at upload time instead of comparison time:

1. Document uploaded → Docling processes → chunks created
2. `extractQuoteData()` runs with 60s timeout
3. Extraction stored in `documents.extraction_data` column
4. Comparison uses cached data from `extraction_data`

**Cache Pattern:**
```typescript
// In compare route
const cachedExtraction = document.extraction_data;
if (cachedExtraction) {
  return cachedExtraction as QuoteExtraction;
}
// Fallback to quote_extractions table
```

## Test Fixtures

Epic 10 includes test fixtures for backward compatibility:

- `__tests__/fixtures/extraction-v1.ts` - Epic 7 schema
- `__tests__/fixtures/extraction-v2.ts` - Epic 8/9 schema
- `__tests__/fixtures/extraction-v3.ts` - Epic 10 full schema

## Epic 10 Test Count

| Category | Test Count |
|----------|------------|
| Schema Validation | 44 |
| Gap Analysis | 33 |
| Backward Compatibility | 28 |
| UI Components | 67 |
| **Total Epic 10 Tests** | **172+** |
| **Project Total** | **1481** |
