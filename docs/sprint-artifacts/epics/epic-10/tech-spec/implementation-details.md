# Implementation Details

## Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/compare.ts` | MODIFY | Add 12 coverage types, PolicyMetadata, Endorsement, CarrierInfo, PremiumBreakdown, GapAnalysis interfaces |
| `src/lib/compare/extraction.ts` | MODIFY | Update EXTRACTION_VERSION to 2, extend Zod schemas, update system prompt |
| `src/lib/compare/diff.ts` | MODIFY | Add comparison logic for endorsements, carrier ratings, gap analysis |
| `src/lib/compare/gap-analysis.ts` | CREATE | Gap detection service (missing coverages, endorsement gaps, limit concerns) |
| `src/components/compare/comparison-table.tsx` | MODIFY | Add collapsible sections for endorsements, premium breakdown |
| `src/components/compare/endorsement-matrix.tsx` | CREATE | Side-by-side endorsement comparison view |
| `src/components/compare/gap-banner.tsx` | MODIFY | Enhanced gap/conflict display |
| `src/components/one-pager/one-pager-pdf-document.tsx` | MODIFY | Add policy metadata, endorsements summary, premium breakdown sections |
| `src/components/one-pager/one-pager-preview.tsx` | MODIFY | Match PDF structure for preview |
| `__tests__/lib/compare/extraction.test.ts` | MODIFY | Add tests for new schema fields |
| `__tests__/lib/compare/gap-analysis.test.ts` | CREATE | Gap detection test suite |
| `__tests__/e2e/enhanced-extraction.spec.ts` | CREATE | E2E tests for enhanced extraction flow |

## Technical Approach

**Schema Evolution Strategy (from Winston):**
1. **Extend existing types** - Don't replace, add optional fields
2. **Bump EXTRACTION_VERSION** - From 1 to 2 to invalidate cached extractions
3. **Backward compatible rendering** - Old extractions display without new fields
4. **Graceful nulls** - All new fields use `.nullable().default(null)` in Zod

**Extended QuoteExtraction Interface:**
```typescript
interface QuoteExtraction {
  // Existing fields (unchanged)
  carrierName: string | null;
  policyNumber: string | null;
  namedInsured: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualPremium: number | null;
  coverages: CoverageItem[];
  exclusions: ExclusionItem[];
  deductibles: DeductibleItem[];
  extractedAt: string;
  modelUsed: string;

  // NEW: Epic 10 fields
  policyMetadata: PolicyMetadata | null;
  endorsements: Endorsement[];
  carrierInfo: CarrierInfo | null;
  premiumBreakdown: PremiumBreakdown | null;
}

// Story 10.2: Policy Form & Structure
interface PolicyMetadata {
  formType: 'iso' | 'proprietary' | 'manuscript';
  formNumbers: string[];              // CG 0001, CP 0010, etc.
  policyType: 'occurrence' | 'claims-made';
  retroactiveDate: string | null;     // For claims-made
  extendedReportingPeriod: string | null;
  auditType: 'annual' | 'monthly' | 'final' | 'none' | null;
  admittedStatus: 'admitted' | 'non-admitted' | 'surplus';
  sourcePages: number[];
}

// Story 10.4: Endorsements
interface Endorsement {
  formNumber: string;           // CG 20 10, CG 20 37
  name: string;
  type: 'broadening' | 'restricting' | 'conditional';
  description: string;
  affectedCoverage: string | null;
  sourcePages: number[];
}

// Story 10.5: Carrier Information
interface CarrierInfo {
  amBestRating: string | null;      // A++, A+, A, A-, B++, etc.
  amBestFinancialSize: string | null;
  naicCode: string | null;
  admittedStatus: 'admitted' | 'non-admitted' | 'surplus';
  claimsPhone: string | null;
  underwriter: string | null;
  sourcePages: number[];
}

// Story 10.6: Premium Breakdown
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

interface CoveragePremium {
  coverage: string;
  premium: number;
}
```

**Extended Coverage Types (Story 10.1):**
```typescript
export type CoverageType =
  // Existing (9)
  | 'general_liability' | 'property' | 'auto_liability'
  | 'auto_physical_damage' | 'umbrella' | 'workers_comp'
  | 'professional_liability' | 'cyber' | 'other'
  // NEW (12)
  | 'epli'                    // Employment Practices Liability
  | 'd_and_o'                 // Directors & Officers
  | 'crime'                   // Crime / Fidelity
  | 'pollution'               // Pollution Liability
  | 'inland_marine'           // Inland Marine / Equipment
  | 'builders_risk'           // Builders Risk
  | 'business_interruption'   // Business Interruption / Loss of Income
  | 'product_liability'       // Product Liability
  | 'garage_liability'        // Garage Liability
  | 'liquor_liability'        // Liquor Liability
  | 'medical_malpractice'     // Medical Malpractice
  | 'fiduciary';              // Fiduciary Liability
```

**Enhanced CoverageItem (Story 10.3):**
```typescript
interface CoverageItem {
  // Existing
  type: CoverageType;
  name: string;
  limit: number | null;
  sublimit: number | null;
  limitType: LimitType | null;
  deductible: number | null;
  description: string;
  sourcePages: number[];

  // NEW: Enhanced limit details
  aggregateLimit: number | null;
  selfInsuredRetention: number | null;  // SIR (different from deductible)
  coinsurance: number | null;           // Percentage (80, 90, 100)
  waitingPeriod: string | null;         // For business interruption
  indemnityPeriod: string | null;       // Coverage duration
}
```

**Gap Analysis (Story 10.7):**
```typescript
interface GapAnalysis {
  missingCoverages: MissingCoverage[];
  limitConcerns: LimitConcern[];
  endorsementGaps: EndorsementGap[];
  overallRiskScore: number;  // 1-100 (higher = more gaps)
}

interface MissingCoverage {
  coverageType: CoverageType;
  importance: 'critical' | 'recommended' | 'optional';
  reason: string;
  presentIn: string[];  // Which quotes have it
}

interface EndorsementGap {
  endorsement: string;
  formNumber: string | null;
  importance: 'critical' | 'recommended';
  reason: string;
  presentIn: string[];  // Which quotes have it
}

interface LimitConcern {
  coverage: string;
  currentLimit: number;
  recommendedMinimum: number;
  reason: string;
}
```

## Existing Patterns to Follow

**From existing `extraction.ts`:**
- Use `zodResponseFormat` for structured outputs (line 358)
- Temperature 0.1 for consistent extraction (line 359)
- MAX_RETRIES = 3 with exponential backoff (lines 29-31)
- EXTRACTION_TIMEOUT_MS = 60000 (line 31)
- Cache in `quote_extractions` table with version invalidation (lines 234-294)

**From existing `compare.ts` types:**
- All extracted items include `sourcePages: number[]`
- Use `.nullable().default(null)` for optional Zod fields
- Follow COVERAGE_TYPES and EXCLUSION_CATEGORIES patterns

**Extraction Prompt Pattern (extend existing):**
```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an expert insurance document analyst.
...existing prompt...

ENDORSEMENT EXTRACTION:
- Look for "Endorsements", "Forms", "Attached Forms" sections
- Extract form numbers exactly as shown (CG 20 10, not CG2010)
- Classify as broadening (adds coverage), restricting (limits coverage), or conditional
- Critical endorsements to identify:
  * Additional Insured (CG 20 10, CG 20 37)
  * Waiver of Subrogation (CG 24 04)
  * Primary and Non-Contributory (CG 20 01)

POLICY METADATA:
- Identify "Occurrence" vs "Claims-Made" from policy form
- Extract ISO form numbers from declarations (CG 0001, CP 0010, CA 0001)
- Look for retroactive date on claims-made policies
- Check for audit provisions (annual, monthly, final only)

CARRIER INFORMATION:
- Extract AM Best rating if shown (A++, A+, A, A-, B++, etc.)
- Identify admitted vs non-admitted/surplus lines status
- Look for NAIC code, claims contact information

PREMIUM BREAKDOWN:
- Extract per-coverage premium if itemized
- Separate base premium from taxes and fees
- Identify surplus lines taxes for non-admitted carriers
`;
```

## Integration Points

**Database:**
- `quote_extractions.extracted_data` JSONB - stores full extraction
- `quote_extractions.extraction_version` - bump to 2
- No new tables needed (schema extends existing JSONB structure)

**Existing Components:**
- `ComparisonTable` - extend with collapsible sections
- `GapConflictBanner` - enhance with endorsement gaps
- `OnePagerPdfDocument` - add new sections

**External APIs:**
- OpenAI GPT-5.1 (existing) - extended prompt
- No new external APIs

---
