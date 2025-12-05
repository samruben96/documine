# documine - Technical Specification: Epic 10

**Author:** Sam
**Date:** 2025-12-04
**Project Level:** Method (Full BMad)
**Change Type:** Feature Enhancement
**Development Context:** Brownfield (extending existing extraction system)

---

## Context

### Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| Architecture | ✅ Loaded | GPT-5.1 with zodResponseFormat, Supabase storage, OpenAI SDK 6.9.1 |
| PRD | ✅ Loaded | 95%+ accuracy requirement, trust transparency, source citations |
| Epic 10 Definition | ✅ Loaded | 11 stories, 26 points, industry research from IIAT/IRMI/AmTrust |
| Existing Extraction Code | ✅ Loaded | `src/lib/compare/extraction.ts`, `src/types/compare.ts` |
| Package.json | ✅ Loaded | Next.js 16, React 19, OpenAI 6.9.1, Zod 4.1.13 |

### Project Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.4 | App Router, SSR |
| React | 19.2.0 | UI Framework |
| TypeScript | 5.x | Language |
| Supabase | 2.84.0 | Database, Auth, Storage |
| OpenAI SDK | 6.9.1 | GPT-5.1 extraction with zodResponseFormat |
| Zod | 4.1.13 | Schema validation |
| Vitest | 4.0.14 | Unit testing |
| Playwright | 1.57.0 | E2E testing |
| @react-pdf/renderer | 4.3.1 | PDF generation |
| @tanstack/react-table | 8.21.3 | Comparison tables |

### Existing Codebase Structure

**Current Extraction System:**
- `src/types/compare.ts` - Types and Zod schemas for extraction
- `src/lib/compare/extraction.ts` - GPT-5.1 extraction service
- `src/lib/compare/diff.ts` - Comparison diff engine
- `src/components/compare/comparison-table.tsx` - UI component
- `src/components/one-pager/` - PDF generation components

**Current QuoteExtraction Schema:**
```typescript
interface QuoteExtraction {
  carrierName: string | null;
  policyNumber: string | null;
  namedInsured: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualPremium: number | null;
  coverages: CoverageItem[];      // 9 coverage types
  exclusions: ExclusionItem[];    // 7 exclusion categories
  deductibles: DeductibleItem[];
  extractedAt: string;
  modelUsed: string;
}
```

**Current Coverage Types (9):**
- general_liability, property, auto_liability, auto_physical_damage
- umbrella, workers_comp, professional_liability, cyber, other

---

## The Change

### Problem Statement

Independent insurance agents need comprehensive policy data to perform thorough quote analysis for clients. The current extraction captures basic coverage limits and deductibles, but agents also need:

1. **Policy form details** - Is this occurrence or claims-made? What ISO forms?
2. **Endorsement information** - Does it have CG 20 10? Waiver of subrogation?
3. **Carrier financial data** - AM Best rating, admitted status
4. **Premium breakdown** - Per-coverage allocation, taxes, fees
5. **Gap analysis** - What's missing compared to industry standards or other quotes?

Without this data, agents still manually hunt through PDFs to answer client questions about policy quality and contract requirements.

### Proposed Solution

Extend the existing extraction schema and GPT-5.1 extraction service to capture:

1. **12 additional coverage types** (D&O, EPLI, Pollution, Builders Risk, etc.)
2. **Policy metadata** (ISO form numbers, occurrence vs claims-made, audit provisions)
3. **Enhanced limits** (SIR vs deductible, aggregate limits, coinsurance)
4. **Endorsements array** (form numbers, broadening/restricting classification)
5. **Carrier information** (AM Best rating, admitted status)
6. **Premium breakdown** (per-coverage, taxes, fees)
7. **Automated gap analysis** (AI-powered identification of missing coverages/endorsements)

The extraction remains a single GPT-5.1 call using `zodResponseFormat` with an extended schema. UI components are updated to display new data with collapsible sections for progressive disclosure.

### Scope

**In Scope:**
- Extended TypeScript types and Zod schemas
- Updated extraction prompt with new field mappings
- Enhanced comparison table with endorsement matrix
- Enhanced one-pager PDF template
- Gap analysis detection logic
- Schema migration (EXTRACTION_VERSION bump)
- Backward compatibility for existing extractions

**Out of Scope:**
- AM Best API integration (manual rating from document only)
- Industry-specific templates (future epic)
- AI-powered coverage recommendations (future epic)
- Multi-page one-pager (keep to 1-2 pages max)

---

## Implementation Details

### Source Tree Changes

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

### Technical Approach

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

### Existing Patterns to Follow

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

### Integration Points

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

## Development Context

### Relevant Existing Code

| File | Lines | Reference |
|------|-------|-----------|
| `src/types/compare.ts` | 20-41 | Current CoverageType enum |
| `src/types/compare.ts` | 107-126 | Current CoverageItem interface |
| `src/types/compare.ts` | 164-188 | Current QuoteExtraction interface |
| `src/types/compare.ts` | 232-288 | Zod schemas for extraction |
| `src/lib/compare/extraction.ts` | 38-73 | EXTRACTION_SYSTEM_PROMPT |
| `src/lib/compare/extraction.ts` | 331-411 | callGPTExtraction function |
| `src/lib/compare/diff.ts` | All | Comparison diff engine |
| `src/components/compare/gap-conflict-banner.tsx` | All | Gap display component |

### Dependencies

**Framework/Libraries (from package.json):**
- `openai@6.9.1` - GPT-5.1 extraction with zodResponseFormat
- `zod@4.1.13` - Schema validation
- `@tanstack/react-table@8.21.3` - Comparison table
- `@react-pdf/renderer@4.3.1` - One-pager PDF generation
- `lucide-react@0.554.0` - Icons

**Internal Modules:**
- `@/lib/compare/extraction` - Extraction service
- `@/lib/compare/diff` - Diff engine
- `@/types/compare` - Type definitions
- `@/lib/utils/logger` - Structured logging
- `@/components/compare/*` - Comparison UI components
- `@/components/one-pager/*` - PDF generation

### Configuration Changes

**Environment Variables:**
- No new environment variables required
- Existing `OPENAI_API_KEY` used for extraction

**Constants:**
```typescript
// src/types/compare.ts
export const EXTRACTION_VERSION = 2;  // Bump from 1

// src/lib/compare/extraction.ts - update timeout if needed
const EXTRACTION_TIMEOUT_MS = 90000;  // Consider increasing for larger schemas
```

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode
- ESLint with Next.js config
- 2-space indentation
- Single quotes for strings
- No semicolons (project style)

**Test Patterns:**
- Vitest for unit tests (`__tests__/`)
- Playwright for E2E (`__tests__/e2e/`)
- Test file naming: `*.test.ts`, `*.spec.ts`
- Coverage target: >80%

**File Organization:**
- Types in `src/types/`
- Services in `src/lib/`
- Components in `src/components/{feature}/`

### Test Framework & Standards

**Vitest Configuration:**
- Config: `vitest.config.ts`
- Environment: `happy-dom`
- Coverage: `@vitest/coverage-v8`

**Test Locations:**
- Unit: `__tests__/lib/`, `__tests__/components/`, `__tests__/hooks/`
- E2E: `__tests__/e2e/`

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Framework | Next.js | 16.0.4 |
| Language | TypeScript | 5.x |
| Database | Supabase PostgreSQL | Latest |
| AI Extraction | OpenAI GPT-5.1 | 2025-11-13 |
| Schema Validation | Zod | 4.1.13 |
| Testing | Vitest + Playwright | 4.0.14, 1.57.0 |
| Styling | Tailwind CSS | 4.x |
| PDF Generation | @react-pdf/renderer | 4.3.1 |

---

## Technical Details

### Extraction Prompt Engineering (Story 10.10)

**Challenge:** Current prompt is ~200 lines. Adding all new fields risks prompt degradation.

**Strategy:**
1. **Structured sections** - Group related instructions (Endorsements, Carrier, Premium)
2. **Examples** - Add few-shot examples for complex extractions
3. **Mappings** - Clear field mappings (like existing coverage type mappings)
4. **Testing** - Benchmark accuracy before/after on test corpus

**New Prompt Sections (~150 additional lines):**

```
ENDORSEMENT EXTRACTION:
- Section indicators: "Endorsements", "Schedule of Forms", "Attached Forms"
- Extract form numbers exactly (preserve spaces: "CG 20 10" not "CG2010")
- Classification:
  * broadening: Adds coverage (Additional Insured, Blanket endorsements)
  * restricting: Limits coverage (Exclusions, Limitations)
  * conditional: Depends on circumstances (Audit provisions)

CRITICAL ENDORSEMENTS (prioritize finding these):
1. CG 20 10 - Additional Insured - Owners, Lessees or Contractors
2. CG 20 37 - Additional Insured - Owners, Lessees or Contractors - Completed Operations
3. CG 24 04 - Waiver of Transfer of Rights (Waiver of Subrogation)
4. CG 20 01 - Primary and Non-Contributory
5. Blanket Additional Insured (any form)

POLICY METADATA:
- Policy Type indicators:
  * "Occurrence" → occurrence
  * "Claims-Made", "Claims Made" → claims-made
- Form numbers appear on declarations page (CG 0001 = ISO CGL form)
- Retroactive date only applies to claims-made policies
- Audit provisions: look for "audit", "premium adjustment"

CARRIER INFORMATION:
- AM Best ratings: A++, A+, A, A-, B++, B+, B, B-, C++, C+, C, C-
- Financial Size Class: I through XV (Roman numerals)
- Admitted vs Non-Admitted: look for "surplus lines", "excess lines", "non-admitted"

PREMIUM BREAKDOWN:
- Look for itemized premium schedules
- Separate: base premium, taxes, fees, surplus lines tax
- Payment terms: annual, semi-annual, quarterly, monthly
```

### Gap Analysis Logic (Story 10.7)

**Detection Rules:**

```typescript
// Critical missing coverages (based on business type)
const CRITICAL_COVERAGES: CoverageType[] = [
  'general_liability',  // Always critical
  'property',           // If any property exposure
  'workers_comp',       // If employees in states requiring it
];

// Critical endorsements
const CRITICAL_ENDORSEMENTS = [
  { form: 'CG 20 10', name: 'Additional Insured - OLC', importance: 'critical' },
  { form: 'CG 20 37', name: 'Additional Insured - Completed Ops', importance: 'critical' },
  { form: 'Waiver of Subrogation', importance: 'critical' },
  { form: 'Primary and Non-Contributory', importance: 'recommended' },
];

// Limit adequacy (industry minimums)
const MINIMUM_LIMITS: Record<CoverageType, number> = {
  general_liability: 1000000,      // $1M per occurrence
  property: 500000,                // $500K building
  umbrella: 1000000,               // $1M umbrella
  professional_liability: 1000000, // $1M E&O
  cyber: 500000,                   // $500K cyber
};
```

**Gap Analysis Algorithm:**
1. Compare each quote against CRITICAL_COVERAGES → flag missing
2. Compare endorsements across quotes → flag inconsistencies
3. Check limits against MINIMUM_LIMITS → flag inadequate
4. Calculate overallRiskScore based on severity and count

### UI Implementation (Story 10.8)

**Collapsible Sections Pattern:**
```tsx
<ComparisonSection
  title="Policy Overview"
  defaultOpen={true}
>
  {/* Carrier, dates, policy type */}
</ComparisonSection>

<ComparisonSection
  title="Coverage Comparison"
  defaultOpen={true}
>
  {/* Existing coverage table */}
</ComparisonSection>

<ComparisonSection
  title="Endorsements"
  defaultOpen={false}
  badge={endorsementCount}
>
  <EndorsementMatrix quotes={extractions} />
</ComparisonSection>

<ComparisonSection
  title="Premium Breakdown"
  defaultOpen={false}
>
  <PremiumBreakdownTable quotes={extractions} />
</ComparisonSection>
```

**Endorsement Matrix:**
| Endorsement | Quote A | Quote B | Quote C |
|-------------|---------|---------|---------|
| Additional Insured (CG 20 10) | ✅ | ✅ | ❌ |
| Waiver of Subrogation | ✅ | ❌ | ✅ |
| Primary & Non-Contributory | ❌ | ✅ | ❌ |

---

## Development Setup

```bash
# Already cloned and set up (existing project)
cd documine

# Ensure dependencies installed
npm install

# Start local dev server
npm run dev

# Run tests
npm test

# Run E2E tests
npx playwright test

# Type check
npx tsc --noEmit
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b epic-10-enhanced-extraction`
2. Verify dev environment: `npm run dev`
3. Review existing extraction tests: `npm test -- extraction`
4. Prepare test documents: 5 commercial insurance quotes with varied formats

### Implementation Steps (Story Order)

**Phase 1: Foundation (Stories 10.1 + 10.10)**

1. **Story 10.1: Extended Coverage Types**
   - Add 12 new coverage types to `CoverageType`
   - Update `COVERAGE_TYPES` array
   - Update extraction prompt mappings
   - Add tests for new type recognition

2. **Story 10.10: Extraction Prompt Engineering**
   - Extend `EXTRACTION_SYSTEM_PROMPT` with new sections
   - Add few-shot examples
   - Benchmark accuracy on test corpus
   - Iterate until 95%+ accuracy maintained

**Phase 2: Data Fields (Stories 10.2-10.6, parallel)**

3. **Story 10.2: Policy Metadata**
   - Add `PolicyMetadata` interface
   - Add Zod schema
   - Update extraction prompt
   - Add tests

4. **Story 10.3: Enhanced Limits**
   - Extend `CoverageItem` with new fields
   - Add SIR vs deductible distinction
   - Update Zod schema
   - Add tests

5. **Story 10.4: Endorsements (Priority)**
   - Add `Endorsement` interface
   - Add endorsements array to extraction
   - Critical endorsement detection
   - Add tests

6. **Story 10.5: Carrier Information**
   - Add `CarrierInfo` interface
   - AM Best rating extraction
   - Admitted status detection
   - Add tests

7. **Story 10.6: Premium Breakdown**
   - Add `PremiumBreakdown` interface
   - Per-coverage premium extraction
   - Taxes/fees separation
   - Add tests

**Phase 3: Analysis (Story 10.7)**

8. **Story 10.7: Gap Analysis**
   - Create `gap-analysis.ts` service
   - Implement detection rules
   - Calculate risk scores
   - Add tests

**Phase 4: UI/UX (Stories 10.8-10.9)**

9. **Story 10.8: Enhanced Comparison Table**
   - Add collapsible sections
   - Create `EndorsementMatrix` component
   - Create `PremiumBreakdownTable` component
   - Add tests

10. **Story 10.9: Enhanced One-Pager**
    - Update `OnePagerPdfDocument`
    - Add policy metadata section
    - Add endorsements summary
    - Add premium breakdown
    - Add tests

**Phase 5: Testing (Story 10.11)**

11. **Story 10.11: Testing & Migration**
    - Backward compatibility testing
    - Schema migration testing
    - Performance testing
    - Accuracy benchmarking report

**Phase 6: Pipeline Integration (Story 10.12)**

12. **Story 10.12: Extraction at Upload Time** (NEW - 2025-12-04)
    - Trigger GPT-5.1 extraction when document processing completes
    - Store `extraction_data` JSONB in documents table
    - Skip extraction for `document_type='general'` documents
    - Enable chat Q&A to use structured data for direct field queries
    - Show carrier/premium in document library
    - Comparisons use pre-extracted data (cache hit optimization)
    - Source citations preserved for structured data answers
    - 60-second timeout, graceful degradation on failure

### Testing Strategy

**Unit Tests (per story):**
- Schema validation for all new interfaces
- Zod schema parsing edge cases
- Gap analysis detection rules
- UI component rendering

**Integration Tests:**
- Full extraction flow with mock GPT response
- Cache invalidation on version bump
- Backward compatibility: v1 extractions still load

**E2E Tests:**
- Upload quote → extract → view enhanced comparison
- Endorsement matrix displays correctly
- Gap analysis banners appear
- One-pager includes new sections

**Accuracy Benchmarking (Story 10.11):**
- 5 real commercial quotes (varied carriers)
- Pre/post accuracy comparison
- Target: 95%+ on existing fields, 90%+ on new fields
- Document extraction accuracy in test report

### Acceptance Criteria Summary

| Story | Key ACs |
|-------|---------|
| 10.1 | 12 new coverage types extracted correctly |
| 10.2 | Policy type (occurrence/claims-made) identified 95%+ |
| 10.3 | SIR distinguished from deductible, aggregates extracted |
| 10.4 | Critical endorsements (CG 20 10, etc.) detected 95%+ |
| 10.5 | AM Best rating extracted when present |
| 10.6 | Per-coverage premium breakdown when itemized |
| 10.7 | Missing coverages, endorsement gaps flagged |
| 10.8 | Collapsible sections, endorsement matrix works |
| 10.9 | One-pager includes new sections, fits 2 pages max |
| 10.10 | Existing extraction accuracy maintained 95%+ |
| 10.11 | All tests pass, v1 extractions backward compatible |
| 10.12 | Extraction at upload, chat uses structured data, source citations work |

---

## Developer Resources

### File Paths Reference

**Types:**
- `src/types/compare.ts` - All extraction types
- `src/types/database.types.ts` - Generated Supabase types

**Services:**
- `src/lib/compare/extraction.ts` - Extraction service
- `src/lib/compare/diff.ts` - Diff engine
- `src/lib/compare/gap-analysis.ts` - NEW: Gap detection

**Components:**
- `src/components/compare/comparison-table.tsx` - Main comparison UI
- `src/components/compare/endorsement-matrix.tsx` - NEW: Endorsement comparison
- `src/components/compare/gap-conflict-banner.tsx` - Gap display
- `src/components/one-pager/one-pager-pdf-document.tsx` - PDF generation

**Tests:**
- `__tests__/lib/compare/extraction.test.ts`
- `__tests__/lib/compare/gap-analysis.test.ts` - NEW
- `__tests__/components/compare/endorsement-matrix.test.tsx` - NEW
- `__tests__/e2e/enhanced-extraction.spec.ts` - NEW

### Key Code Locations

| Purpose | File:Line |
|---------|-----------|
| CoverageType enum | `src/types/compare.ts:20` |
| QuoteExtraction interface | `src/types/compare.ts:164` |
| Zod extraction schema | `src/types/compare.ts:278` |
| EXTRACTION_VERSION | `src/types/compare.ts:194` |
| System prompt | `src/lib/compare/extraction.ts:38` |
| GPT extraction call | `src/lib/compare/extraction.ts:331` |
| Diff engine | `src/lib/compare/diff.ts:1` |
| Gap detection | `src/lib/compare/gap-analysis.ts` - NEW |

### Testing Locations

- Unit: `__tests__/lib/compare/`
- Component: `__tests__/components/compare/`
- E2E: `__tests__/e2e/`

### Documentation to Update

- `CLAUDE.md` - Add Epic 10 patterns and conventions
- `docs/architecture.md` - Document enhanced extraction schema
- `docs/epics/epic-10-enhanced-quote-extraction.md` - Update with implementation notes

---

## UX/UI Considerations

### UI Components Affected

| Component | Action | Changes |
|-----------|--------|---------|
| ComparisonTable | MODIFY | Collapsible sections, endorsement matrix |
| GapConflictBanner | MODIFY | Endorsement gaps, enhanced messaging |
| OnePagerPreview | MODIFY | Match PDF structure |
| OnePagerPdfDocument | MODIFY | New sections |
| EndorsementMatrix | CREATE | Side-by-side endorsement view |
| PremiumBreakdownTable | CREATE | Premium allocation display |

### UX Flow Changes

**Current:** User sees flat coverage/limits table
**New:** User sees expandable sections:
1. Policy Overview (always open) - Carrier, dates, type
2. Coverage Comparison (always open) - Limits, deductibles
3. Endorsements (collapsed) - Expandable matrix
4. Premium Breakdown (collapsed) - Expandable table
5. Gap Analysis (banner) - Highlighted warnings

### Visual Patterns

**Endorsement Matrix:**
- ✅ Green check for present
- ❌ Red X for missing
- ⚠️ Yellow warning for critical missing

**Premium Breakdown:**
- Bar chart visualization (optional enhancement)
- Clear $ formatting
- Per-coverage % of total

### Accessibility

- Collapsible sections use `aria-expanded`
- Icons have `aria-label` descriptions
- Color not only indicator (icons + text)
- Keyboard navigation for sections

---

## Testing Approach

### Test Framework & Standards

**Framework:** Vitest 4.0.14 + Playwright 1.57.0
**Coverage Target:** >80% for new code

### Test Categories

**1. Schema Validation (High Volume)**
```typescript
describe('Enhanced QuoteExtraction Schema', () => {
  it('validates PolicyMetadata with all fields')
  it('validates PolicyMetadata with minimal fields')
  it('validates Endorsement array')
  it('validates CarrierInfo with AM Best rating')
  it('validates PremiumBreakdown with itemized costs')
  it('handles null fields gracefully')
  it('rejects invalid coverage types')
  it('rejects invalid policy types')
})
```

**2. Gap Analysis Logic (Medium Volume)**
```typescript
describe('Gap Analysis Service', () => {
  it('detects missing critical coverages')
  it('detects missing critical endorsements')
  it('detects inadequate limits')
  it('calculates risk score correctly')
  it('handles quotes with no gaps')
  it('compares endorsements across multiple quotes')
})
```

**3. Backward Compatibility (Critical)**
```typescript
describe('Backward Compatibility', () => {
  it('loads v1 extraction without new fields')
  it('renders v1 extraction in UI')
  it('cache invalidates on version bump')
  it('new extraction includes all fields')
})
```

**4. E2E Tests**
```typescript
describe('Enhanced Extraction E2E', () => {
  it('extracts endorsements from uploaded quote')
  it('displays endorsement matrix in comparison')
  it('shows gap analysis banner for missing endorsements')
  it('includes new sections in one-pager PDF')
})
```

---

## Deployment Strategy

### Deployment Steps

1. Merge to main branch
2. CI/CD runs all tests (unit + E2E)
3. Deploy to Vercel preview
4. Verify enhanced extraction on preview
5. Deploy to production
6. Monitor extraction success rates

### Rollback Plan

1. If extraction accuracy drops: revert prompt changes
2. If cache issues: manually invalidate via SQL
3. If UI breaks: revert component changes, keep schema
4. Full rollback: revert entire epic branch

### Monitoring

**Extraction Metrics:**
- Extraction success rate (target: >95%)
- Average extraction time (target: <90s)
- New field population rate (target: >80% for endorsements)

**Error Tracking:**
- GPT-5.1 API errors
- Schema validation failures
- Cache hit/miss rates

---

## Team Consensus (Party Mode Input)

**Key decisions validated by team:**

1. ✅ **Schema Evolution** - Extend, don't replace (Winston)
2. ✅ **Priority Order** - Endorsements + Gap Analysis first (John)
3. ✅ **Prompt Strategy** - Careful prompt engineering, benchmark before/after (Amelia)
4. ✅ **UI Pattern** - Collapsible sections, progressive disclosure (Sally)
5. ✅ **Testing** - Accuracy benchmarking with real quotes (Murat)
6. ✅ **Story Order** - 10.1+10.10 → 10.2-10.6 → 10.7 → 10.8-10.9 → 10.11 (Bob)

---

_Generated by BMad Tech-Spec Workflow with Party Mode input_
_Date: 2025-12-04_
_For: Sam_
