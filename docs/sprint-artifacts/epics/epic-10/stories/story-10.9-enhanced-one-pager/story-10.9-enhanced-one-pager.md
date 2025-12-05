# Story 10.9: Enhanced One-Pager Template

Status: ready

## Story

As an insurance agent,
I want the one-pager PDF to include policy metadata, endorsements summary, premium breakdown, and gap highlights,
so that I can provide clients with professional, comprehensive quote documentation.

## Acceptance Criteria

### AC-10.9.1: Policy Metadata Section
- [ ] Add "Policy Details" section after Quote Overview
- [ ] Display policy type (Occurrence / Claims-Made) with explanation
- [ ] Show ISO form numbers if available (CG 0001, CP 0010, etc.)
- [ ] Display retroactive date for claims-made policies
- [ ] Show admitted status (Admitted / Non-Admitted / Surplus Lines)
- [ ] For comparison mode: Show as comparison row highlighting differences

### AC-10.9.2: AM Best Rating Display
- [ ] Add carrier rating to Quote Overview section
- [ ] Format: "A+ (Superior)" with rating explanation
- [ ] Color-code: Green for A++/A+, Blue for A/A-, Amber for B+ and below
- [ ] For comparison: Add AM Best Rating row to comparison table

### AC-10.9.3: Endorsements Summary Section
- [ ] Add "Key Endorsements" section after Coverage Highlights
- [ ] Single-quote mode: List endorsements with form numbers and type badges (broadening/restricting)
- [ ] Highlight critical endorsements (CG 20 10, CG 20 37, CG 24 04)
- [ ] Comparison mode: Show endorsement matrix (similar to Story 10.8)
- [ ] Limit to 8 endorsements with "+N more" indicator

### AC-10.9.4: Premium Breakdown Section
- [ ] Add "Premium Breakdown" section showing cost components
- [ ] Display: Base Premium, Taxes, Fees, Surplus Lines Tax (if applicable), Total
- [ ] Show per-coverage premium breakdown if available (collapsible in PDF)
- [ ] For comparison: Show side-by-side premium breakdown table
- [ ] Highlight lowest total with green indicator

### AC-10.9.5: Enhanced Gap Highlights
- [ ] Integrate new gap analysis from Story 10.7
- [ ] Show risk score badge in header area
- [ ] Add "Endorsement Gaps" subsection to Gaps section
- [ ] Show missing critical endorsements with importance badges
- [ ] Display limit concerns with current vs recommended values

### AC-10.9.6: PDF Layout Optimization
- [ ] Ensure enhanced content fits on 2 pages maximum
- [ ] Use smaller fonts for dense sections (endorsements, premium breakdown)
- [ ] Collapsible sections in HTML preview; all expanded in PDF
- [ ] Consistent section styling with primary color accents

### AC-10.9.7: HTML Preview Parity
- [ ] Update OnePagerPreview to match PDF output for all new sections
- [ ] Ensure live preview reflects form changes in real-time
- [ ] Preview shows all sections that will appear in PDF

## Tasks / Subtasks

- [ ] Task 1: Create PolicyMetadataSection component (AC: 10.9.1)
  - [ ] Create `src/components/one-pager/policy-metadata-section.tsx`
  - [ ] Accept extraction prop
  - [ ] Display policy type, forms, retroactive date, admitted status
  - [ ] Style with primary color accents

- [ ] Task 2: Add AM Best rating to Quote Overview (AC: 10.9.2)
  - [ ] Update QuoteOverview section in one-pager-preview.tsx
  - [ ] Add rating badge with color coding
  - [ ] Include rating explanation text

- [ ] Task 3: Create EndorsementsSummary component (AC: 10.9.3)
  - [ ] Create `src/components/one-pager/endorsements-summary.tsx`
  - [ ] Accept extractions array
  - [ ] Single-quote: List with form numbers and type badges
  - [ ] Comparison: Render mini endorsement matrix
  - [ ] Highlight critical endorsements

- [ ] Task 4: Create PremiumBreakdownSection component (AC: 10.9.4)
  - [ ] Create `src/components/one-pager/premium-breakdown-section.tsx`
  - [ ] Accept extractions array
  - [ ] Single-quote: Itemized breakdown
  - [ ] Comparison: Side-by-side table with best value indicator

- [ ] Task 5: Enhance Gaps section (AC: 10.9.5)
  - [ ] Update gaps display with endorsement gaps
  - [ ] Add limit concerns with recommendations
  - [ ] Add risk score badge

- [ ] Task 6: Update OnePagerPreview with new sections (AC: 10.9.7)
  - [ ] Integrate PolicyMetadataSection
  - [ ] Integrate EndorsementsSummary
  - [ ] Integrate PremiumBreakdownSection
  - [ ] Update gaps display

- [ ] Task 7: Update PDF generation (AC: 10.9.6)
  - [ ] Create PDF versions of new section components
  - [ ] Add to downloadOnePagerPdf function
  - [ ] Optimize layout for 2-page limit
  - [ ] Use smaller fonts for dense content

- [ ] Task 8: Unit tests (AC: All)
  - [ ] Test PolicyMetadataSection rendering
  - [ ] Test EndorsementsSummary with various inputs
  - [ ] Test PremiumBreakdownSection calculations
  - [ ] Test preview/PDF parity

- [ ] Task 9: E2E tests (AC: 10.9.7)
  - [ ] Create `__tests__/e2e/enhanced-one-pager.spec.ts`
  - [ ] Test new sections appear in preview
  - [ ] Test PDF download includes new sections

- [ ] Task 10: Build and verify (AC: All)
  - [ ] Run `npm run build` - no errors
  - [ ] Run `npm test` - all tests pass

## Dev Notes

### Technical Approach

**Policy Metadata Section (Single Quote):**
```tsx
function PolicyMetadataSection({ extraction }: { extraction: QuoteExtraction }) {
  const metadata = extraction.policyMetadata;
  if (!metadata) return null;

  return (
    <div className="p-6 border-b">
      <SectionHeader title="Policy Details" icon={FileText} />
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Policy Type" value={
          metadata.policyType === 'occurrence' ? 'Occurrence' :
          metadata.policyType === 'claims-made' ? 'Claims-Made' : '—'
        } />
        {metadata.formNumbers.length > 0 && (
          <InfoRow label="ISO Forms" value={metadata.formNumbers.join(', ')} />
        )}
        {metadata.policyType === 'claims-made' && metadata.retroactiveDate && (
          <InfoRow label="Retro Date" value={formatDate(metadata.retroactiveDate)} />
        )}
        <InfoRow label="Carrier Status" value={
          extraction.carrierInfo?.admittedStatus === 'admitted' ? 'Admitted' :
          extraction.carrierInfo?.admittedStatus === 'non-admitted' ? 'Non-Admitted' :
          extraction.carrierInfo?.admittedStatus === 'surplus' ? 'Surplus Lines' : '—'
        } />
      </div>
    </div>
  );
}
```

**Endorsements Summary (Single Quote):**
```tsx
function EndorsementsSummary({ extraction }: { extraction: QuoteExtraction }) {
  const endorsements = extraction.endorsements || [];
  if (endorsements.length === 0) return null;

  const sortedEndorsements = [...endorsements].sort((a, b) => {
    const aIsCritical = CRITICAL_ENDORSEMENTS.some(ce => ce.formNumber === a.formNumber);
    const bIsCritical = CRITICAL_ENDORSEMENTS.some(ce => ce.formNumber === b.formNumber);
    if (aIsCritical && !bIsCritical) return -1;
    if (!aIsCritical && bIsCritical) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-6 border-b">
      <SectionHeader title="Key Endorsements" icon={FileCheck} badge={endorsements.length} />
      <div className="space-y-2">
        {sortedEndorsements.slice(0, 8).map((endorsement, i) => (
          <div key={i} className="flex items-center gap-2">
            <Badge variant={endorsement.type === 'broadening' ? 'default' : 'secondary'}>
              {endorsement.formNumber || 'Custom'}
            </Badge>
            <span className="text-sm">{endorsement.name}</span>
            {isCriticalEndorsement(endorsement) && (
              <Badge variant="outline" className="text-amber-600">Critical</Badge>
            )}
          </div>
        ))}
        {endorsements.length > 8 && (
          <p className="text-sm text-slate-500">+{endorsements.length - 8} more endorsements</p>
        )}
      </div>
    </div>
  );
}
```

**Premium Breakdown (Single Quote):**
```tsx
function PremiumBreakdownSection({ extraction }: { extraction: QuoteExtraction }) {
  const breakdown = extraction.premiumBreakdown;
  if (!breakdown) return null;

  return (
    <div className="p-6 border-b">
      <SectionHeader title="Premium Breakdown" icon={DollarSign} />
      <div className="space-y-2">
        {breakdown.basePremium && (
          <PremiumRow label="Base Premium" value={formatCurrency(breakdown.basePremium)} />
        )}
        {breakdown.coveragePremiums.map((cp, i) => (
          <PremiumRow key={i} label={cp.coverage} value={formatCurrency(cp.premium)} indent />
        ))}
        {breakdown.taxes && (
          <PremiumRow label="Taxes" value={formatCurrency(breakdown.taxes)} />
        )}
        {breakdown.fees && (
          <PremiumRow label="Fees" value={formatCurrency(breakdown.fees)} />
        )}
        {breakdown.surplusLinesTax && (
          <PremiumRow label="Surplus Lines Tax" value={formatCurrency(breakdown.surplusLinesTax)} />
        )}
        <div className="border-t pt-2 mt-2">
          <PremiumRow label="Total Premium" value={formatCurrency(breakdown.totalPremium)} bold />
        </div>
        {breakdown.paymentPlan && (
          <p className="text-xs text-slate-500 mt-2">Payment: {breakdown.paymentPlan}</p>
        )}
      </div>
    </div>
  );
}
```

### PDF Layout Strategy

**Page 1:**
- Agency Header (branding)
- Client Information
- Quote Overview with AM Best Rating
- Policy Details (metadata)
- Coverage Comparison or Coverage Highlights

**Page 2 (if needed):**
- Endorsements Summary
- Premium Breakdown
- Gaps & Recommendations
- Agent Notes
- Footer

**Font Sizes for PDF:**
- Headers: 14pt
- Section titles: 12pt
- Body text: 10pt
- Dense sections (endorsements, premium): 9pt
- Footer: 8pt

### File Locations

| File | Action | Purpose |
|------|--------|---------|
| `src/components/one-pager/policy-metadata-section.tsx` | CREATE | Policy metadata display |
| `src/components/one-pager/endorsements-summary.tsx` | CREATE | Endorsements list/matrix |
| `src/components/one-pager/premium-breakdown-section.tsx` | CREATE | Premium breakdown table |
| `src/components/one-pager/one-pager-preview.tsx` | MODIFY | Integrate new sections |
| `src/lib/one-pager/pdf-generator.ts` | MODIFY | Add new sections to PDF |
| `__tests__/components/one-pager/policy-metadata-section.test.tsx` | CREATE | Unit tests |
| `__tests__/components/one-pager/endorsements-summary.test.tsx` | CREATE | Unit tests |
| `__tests__/components/one-pager/premium-breakdown-section.test.tsx` | CREATE | Unit tests |
| `__tests__/e2e/enhanced-one-pager.spec.ts` | CREATE | E2E tests |

### Project Structure Notes

- Follows existing one-pager component patterns
- Reuses formatting functions from `src/lib/compare/diff.ts`
- Integrates with existing gap detection from `src/lib/compare/gap-analysis.ts`
- PDF generation uses @react-pdf/renderer (already installed)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-10.md#Story-10.9]
- [Source: src/components/one-pager/one-pager-preview.tsx - Current implementation]
- [Source: src/types/compare.ts - PolicyMetadata, Endorsement, PremiumBreakdown interfaces]
- [Source: docs/sprint-artifacts/story-10.8-enhanced-comparison-table.md - Parallel UI work]

### Learnings from Previous Story

**From Story 10.8 (Enhanced Comparison Table):**
- CollapsibleSection component can be reused for HTML preview
- Endorsement matrix pattern from EndorsementMatrix component
- Premium breakdown table pattern from PremiumBreakdownTable component
- Same data sources: policyMetadata, endorsements, carrierInfo, premiumBreakdown

**From Story 10.7 (Automated Gap Analysis):**
- `analyzeGaps()` provides MissingCoverage[], LimitConcern[], EndorsementGap[]
- Risk score 0-100 with color coding (green/yellow/red)
- Gap data available via `detectGaps()` or new gap analysis service

**Important - Story 10.12 Context (Extraction at Upload Time):**
- Extraction data pre-loaded from `documents.extraction_data`
- All Epic 10 fields available immediately (no extraction wait)
- Instant one-pager generation for pre-processed documents

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/10-9-enhanced-one-pager.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
