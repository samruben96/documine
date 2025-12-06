# Epic 10: Enhanced Quote Extraction & Analysis

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-10/stories/`](../sprint-artifacts/epics/epic-10/stories/)

**Status:** Drafted
**Priority:** P1 - Core Value Enhancement
**Created:** 2025-12-04

---

## Overview

Enhance the quote extraction engine to capture comprehensive insurance policy data that professional agents need for thorough quote analysis. This epic expands extraction beyond basic coverage limits to include policy forms, endorsements, carrier details, premium breakdowns, and gap analysis fields.

## Research Summary

Based on research into what insurance agents look for when analyzing quotes:

### Key Analysis Areas (from industry sources)

1. **Coverage Forms & Policy Type**
   - ISO vs proprietary forms (CG 0001, CP 0010, CA 0001, BP 0003)
   - Occurrence vs Claims-Made policies
   - Retroactive dates for claims-made coverage

2. **Limits & Deductibles**
   - Per-occurrence vs aggregate limits
   - Sublimits by coverage type
   - Self-insured retention (SIR) vs deductible
   - Coinsurance percentages

3. **Endorsements & Modifications**
   - Additional insured endorsements (CG 20 10, CG 20 37)
   - Waiver of subrogation
   - Primary and non-contributory wording
   - Coverage extensions and restrictions

4. **Carrier Evaluation**
   - AM Best rating
   - Admitted vs non-admitted (surplus lines)
   - Hidden costs with non-admitted carriers

5. **Premium Analysis**
   - Per-coverage premium allocation
   - Taxes, fees, broker fees
   - Payment terms and financing

6. **Gap Analysis**
   - Exclusions that shouldn't be there
   - Missing standard endorsements
   - Limit adequacy for business size

### Sources
- [Landesblosch - Comparing Business Insurance Quotes](https://www.landesblosch.com/blog/how-do-you-compare-different-business-insurance-quotes)
- [IIAT - CGL Forms and Endorsements](https://www.iiat.org/infocentral/cgl-forms-endorsements)
- [AmTrust - Coverage Checklists for Agents](https://amtrustfinancial.com/blog/agents/coverage-checklists-for-insurance-agents)
- [California Insurance Guide](https://www.insurance.ca.gov/01-consumers/105-type/95-guides/09-comm/commercialguide.cfm)
- [Sibro - Insurance Quote Comparison Sheets](https://sibro.xyz/how-to-create-professional-insurance-quote-comparison-sheets/)
- [IRMI Insurance Checklists](https://subscribe.irmi.com/irmi-insurance-checklists)

---

## Stories

### Story 10.1: Extended Coverage Types Schema
**Points:** 3

Expand the extraction schema to support additional coverage types commonly found in commercial policies.

**New Coverage Types:**
- Cyber Liability
- Professional Liability / E&O
- Workers Compensation
- Umbrella / Excess Liability
- Employment Practices Liability (EPLI)
- Pollution Liability
- Business Interruption / Loss of Income
- Commercial Auto / Fleet
- Inland Marine / Equipment
- Directors & Officers (D&O)
- Crime / Fidelity
- Builders Risk

**Acceptance Criteria:**
- [ ] Update `QuoteExtraction` type with new coverage categories
- [ ] Update extraction prompt to identify new coverage types
- [ ] Maintain backward compatibility with existing extractions
- [ ] Add coverage type icons/badges for UI display

---

### Story 10.2: Policy Form & Structure Metadata
**Points:** 2

Extract policy structure information that agents use to evaluate quote quality.

**New Fields:**
```typescript
interface PolicyMetadata {
  formType: 'iso' | 'proprietary' | 'manuscript';
  formNumbers: string[];           // CG 0001, CP 0010, etc.
  policyType: 'occurrence' | 'claims-made';
  retroactiveDate?: string;        // For claims-made
  extendedReportingPeriod?: string; // Tail coverage
  auditType?: 'annual' | 'monthly' | 'final' | 'none';
  cancellationTerms?: string;      // 30-day, 60-day, etc.
  paymentTerms?: string;           // Annual, quarterly, monthly
  admittedStatus: 'admitted' | 'non-admitted' | 'surplus';
}
```

**Acceptance Criteria:**
- [ ] Extract policy form numbers from declarations
- [ ] Identify occurrence vs claims-made policies
- [ ] Extract audit provisions
- [ ] Display policy metadata in comparison table

---

### Story 10.3: Enhanced Limits & Deductibles
**Points:** 2

Capture granular limit structures that vary by coverage type.

**Enhanced Fields:**
```typescript
interface EnhancedCoverage {
  // Existing
  type: CoverageType;
  name: string;
  limit: number;
  deductible: number;

  // New fields
  limitType: 'per_occurrence' | 'per_claim' | 'aggregate' | 'combined_single';
  aggregateLimit?: number;
  sublimits?: Sublimit[];
  selfInsuredRetention?: number;  // SIR (different from deductible)
  coinsurance?: number;           // Percentage (80%, 90%, 100%)
  waitingPeriod?: string;         // For business interruption
  indemnityPeriod?: string;       // Coverage duration
}

interface Sublimit {
  name: string;
  limit: number;
  description?: string;
}
```

**Acceptance Criteria:**
- [ ] Distinguish SIR from deductible
- [ ] Extract aggregate limits separately from per-occurrence
- [ ] Identify sublimits (e.g., hired auto, non-owned auto)
- [ ] Extract coinsurance percentages
- [ ] Display enhanced limits in comparison with clear labels

---

### Story 10.4: Endorsements Extraction
**Points:** 3

Extract policy endorsements that modify coverage.

**Endorsement Structure:**
```typescript
interface Endorsement {
  formNumber: string;        // CG 20 10, CG 20 37
  name: string;
  type: 'broadening' | 'restricting' | 'conditional';
  description: string;
  affectedCoverage?: string; // Which coverage it modifies
  sourcePages: number[];
}

// Common endorsements to detect
const CRITICAL_ENDORSEMENTS = [
  'Additional Insured - Owners, Lessees or Contractors',  // CG 20 10
  'Additional Insured - Completed Operations',             // CG 20 37
  'Waiver of Subrogation',
  'Primary and Non-Contributory',
  'Blanket Additional Insured',
  'Contractual Liability',
  'Employee Benefits Liability',
  'Stop Gap Coverage',
  'Pollution Liability Extension',
];
```

**Acceptance Criteria:**
- [ ] Extract endorsement form numbers and names
- [ ] Categorize as broadening vs restricting
- [ ] Highlight critical missing endorsements in gap analysis
- [ ] Show endorsement comparison between quotes

---

### Story 10.5: Carrier Information & Ratings
**Points:** 2

Extract and display carrier financial information.

**Carrier Fields:**
```typescript
interface CarrierInfo {
  name: string;
  amBestRating?: string;      // A++, A+, A, A-, B++, etc.
  amBestFinancialSize?: string; // Class I - XV
  naicCode?: string;
  admittedStatus: 'admitted' | 'non-admitted' | 'surplus';

  // Contact info (if in policy)
  claimsPhone?: string;
  claimsEmail?: string;
  underwriter?: string;
}
```

**Acceptance Criteria:**
- [ ] Extract carrier name (already have)
- [ ] Extract AM Best rating if present in policy
- [ ] Identify admitted vs surplus lines
- [ ] Display carrier ratings in comparison
- [ ] Add AM Best lookup API integration (optional)

---

### Story 10.6: Premium Breakdown
**Points:** 2

Extract detailed premium allocation.

**Premium Fields:**
```typescript
interface PremiumBreakdown {
  basePremium: number;
  coveragePremiums?: CoveragePremium[];  // Per-coverage allocation
  taxes: number;
  fees: number;
  brokerFee?: number;
  surplusLinesTax?: number;  // For non-admitted
  stampingFee?: number;
  totalPremium: number;

  // Payment info
  minimumPremium?: number;
  depositPremium?: number;
  paymentPlan?: string;
  installmentFee?: number;
}

interface CoveragePremium {
  coverage: string;
  premium: number;
}
```

**Acceptance Criteria:**
- [ ] Extract premium breakdown by coverage where available
- [ ] Identify taxes and fees separately
- [ ] Show total vs base premium comparison
- [ ] Display cost-per-coverage in one-pager

---

### Story 10.7: Automated Gap Analysis
**Points:** 3

Analyze extracted data to identify coverage gaps and concerns.

**Gap Analysis Fields:**
```typescript
interface GapAnalysis {
  missingCoverages: MissingCoverage[];
  limitConcerns: LimitConcern[];
  exclusionConcerns: ExclusionConcern[];
  endorsementGaps: EndorsementGap[];
  overallRiskScore: number;  // 1-100
}

interface MissingCoverage {
  coverageType: string;
  importance: 'critical' | 'recommended' | 'optional';
  reason: string;
}

interface LimitConcern {
  coverage: string;
  currentLimit: number;
  recommendedMinimum: number;
  reason: string;
}

interface ExclusionConcern {
  exclusion: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface EndorsementGap {
  endorsement: string;
  reason: string;
  formNumber?: string;
}
```

**Acceptance Criteria:**
- [ ] Identify missing standard coverages for business type
- [ ] Flag inadequate limits based on industry standards
- [ ] Highlight unusual exclusions
- [ ] Identify missing critical endorsements
- [ ] Display gap analysis summary in one-pager

---

### Story 10.8: Enhanced Comparison Table
**Points:** 2

Update comparison UI to display new extraction fields.

**New Comparison Sections:**
- Policy Structure (form type, occurrence/claims-made)
- Coverage Comparison (with enhanced limit display)
- Endorsements Comparison
- Premium Breakdown Comparison
- Carrier Ratings Comparison
- Gap Analysis Summary

**Acceptance Criteria:**
- [ ] Add collapsible sections for new data categories
- [ ] Show endorsement comparison matrix
- [ ] Display premium breakdown side-by-side
- [ ] Highlight differences with visual indicators
- [ ] Mobile-responsive design for new sections

---

### Story 10.9: Enhanced One-Pager Template
**Points:** 2

Update one-pager PDF to include new extraction data.

**New Sections:**
- Policy Overview (form type, effective dates, carrier rating)
- Enhanced Coverage Table (with sublimits, SIR)
- Key Endorsements Summary
- Premium Breakdown
- Gap Analysis Highlights
- Agent Recommendations

**Acceptance Criteria:**
- [ ] Add policy metadata section
- [ ] Show endorsements in organized format
- [ ] Include premium breakdown
- [ ] Highlight gaps and recommendations
- [ ] Maintain single-page format where possible (expand to 2 pages if needed)

---

### Story 10.10: Extraction Prompt Engineering
**Points:** 3

Refine GPT prompts to accurately extract new fields.

**Tasks:**
- Update system prompt with new field definitions
- Add examples for each new field type
- Test with diverse policy documents
- Handle missing data gracefully
- Optimize token usage

**Acceptance Criteria:**
- [ ] New prompt extracts all new fields accurately
- [ ] Maintains extraction accuracy for existing fields
- [ ] Handles policies without certain sections
- [ ] Document extraction accuracy metrics
- [ ] Create test suite with sample policies

---

### Story 10.11: Testing & Migration
**Points:** 2

Ensure backward compatibility and create migration path.

**Tasks:**
- Schema migration for new fields
- Test with existing extractions
- Update TypeScript types
- Add validation for new fields
- Performance testing with larger extractions

**Acceptance Criteria:**
- [ ] Existing comparisons continue to work
- [ ] New fields gracefully degrade when not present
- [ ] No breaking changes to API
- [ ] All existing tests pass
- [ ] New tests for enhanced extraction

---

## Technical Considerations

### Schema Changes
- `quote_extractions.extracted_data` JSONB column is flexible
- New fields added to TypeScript types with optional modifiers
- Zod schemas updated for validation

### Extraction Pipeline
- Larger context window needed for full policy analysis
- Consider chunking strategies for long policies
- May need multiple extraction passes for complex policies

### UI/UX
- Progressive disclosure - don't overwhelm users
- Collapsible sections for detailed data
- Clear visual hierarchy
- Mobile considerations for complex tables

### Performance
- Extraction time may increase with new fields
- Consider caching extraction results
- Lazy loading for comparison details

---

## Success Metrics

1. **Extraction Accuracy:** >90% accuracy on new fields
2. **Agent Satisfaction:** Positive feedback on gap analysis
3. **Comparison Usefulness:** Agents can identify best quote faster
4. **One-Pager Value:** Clients understand policy differences

---

## Dependencies

- Epic 9 complete (one-pager foundation)
- GPT-5.1 context window (400K tokens) for full policy analysis
- Sample policies for testing new extraction

---

## Future Considerations

- AM Best API integration for real-time ratings
- Industry-specific extraction templates (construction, healthcare, etc.)
- AI-powered coverage recommendations
- Integration with agency management systems
