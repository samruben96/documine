# Story 10.8: Enhanced Comparison Table

Status: ready

## Story

As an insurance agent,
I want the comparison table to display endorsement matrices, premium breakdowns, carrier ratings, and policy metadata,
so that I can provide clients with comprehensive side-by-side quote analysis.

## Acceptance Criteria

### AC-10.8.1: Collapsible Sections
- [ ] Add collapsible section pattern to ComparisonTable
- [ ] Sections: Policy Overview (open), Coverage (open), Endorsements (collapsed), Premium Breakdown (collapsed)
- [ ] Each section has a chevron icon and click-to-toggle behavior
- [ ] Sections persist collapse state during session (not across reloads)

### AC-10.8.2: Policy Metadata Display
- [ ] Add "Policy Type" row showing "Occurrence" vs "Claims-Made" (from `policyMetadata.policyType`)
- [ ] Add "Form Numbers" row showing ISO forms (CG 0001, etc.)
- [ ] Add "Audit Provisions" row (if available)
- [ ] Display retroactive date for claims-made policies
- [ ] Highlight differences in policy type across quotes (amber background like other differences)

### AC-10.8.3: Carrier Information Display
- [ ] Add "AM Best Rating" row in Policy Overview section (from `carrierInfo.amBestRating`)
- [ ] Add "Admitted Status" row (Admitted/Non-Admitted/Surplus Lines)
- [ ] Display financial size class if available
- [ ] Color-code ratings: A++/A+ (green), A/A- (blue), B+ and below (amber)

### AC-10.8.4: Endorsement Matrix Section
- [ ] Create EndorsementMatrix component showing endorsements across quotes
- [ ] Rows: Each unique endorsement across all quotes
- [ ] Columns: One per quote (carrier name header)
- [ ] Cells: ✅ present, ❌ missing, with form number if available
- [ ] Highlight critical endorsements (CG 20 10, CG 20 37, CG 24 04) with badge
- [ ] Sort: Critical endorsements first, then alphabetical

### AC-10.8.5: Premium Breakdown Section
- [ ] Create PremiumBreakdownTable component
- [ ] Rows: Base Premium, Per-Coverage Premiums, Taxes, Fees, Surplus Lines Tax, Total
- [ ] Per-coverage premiums as sub-rows under "Coverage Premiums" parent
- [ ] Highlight lowest total premium (green indicator)
- [ ] Show payment plan information if available

### AC-10.8.6: Enhanced Gap Analysis Integration
- [ ] Pass new gap analysis data to GapConflictBanner (endorsement gaps, limit concerns)
- [ ] Risk score badge displays in comparison header area
- [ ] Clicking gap/conflict row scrolls to relevant section

### AC-10.8.7: Responsive & Accessible
- [ ] Collapsible sections use `aria-expanded` and `aria-controls`
- [ ] Endorsement matrix scrolls horizontally on mobile
- [ ] Premium numbers have `aria-label` for currency values
- [ ] Keyboard navigation: Enter/Space toggles sections

## Tasks / Subtasks

- [ ] Task 1: Create CollapsibleSection component (AC: 10.8.1)
  - [ ] Create `src/components/compare/collapsible-section.tsx`
  - [ ] Props: title, defaultOpen, badge (count), children
  - [ ] Chevron icon rotates on expand/collapse
  - [ ] ARIA attributes for accessibility

- [ ] Task 2: Update diff.ts to include new data (AC: 10.8.2, 10.8.3)
  - [ ] Add `policyMetadataRows` to ComparisonTableData
  - [ ] Add `carrierInfoRows` to ComparisonTableData
  - [ ] Create `buildPolicyMetadataRows()` function
  - [ ] Create `buildCarrierInfoRows()` function

- [ ] Task 3: Create EndorsementMatrix component (AC: 10.8.4)
  - [ ] Create `src/components/compare/endorsement-matrix.tsx`
  - [ ] Accept extractions array, return table with endorsement rows
  - [ ] Collect all unique endorsements across quotes
  - [ ] Render ✅/❌ cells with form numbers
  - [ ] Badge for critical endorsements

- [ ] Task 4: Create PremiumBreakdownTable component (AC: 10.8.5)
  - [ ] Create `src/components/compare/premium-breakdown-table.tsx`
  - [ ] Accept extractions array
  - [ ] Render base, coverage, taxes, fees, total rows
  - [ ] Highlight best (lowest) total

- [ ] Task 5: Update ComparisonTable with sections (AC: 10.8.1, 10.8.6)
  - [ ] Wrap existing rows in CollapsibleSection for each category
  - [ ] Add Endorsements and Premium Breakdown sections
  - [ ] Pass gapAnalysis to header for risk score badge

- [ ] Task 6: Add carrier/policy info rows (AC: 10.8.2, 10.8.3)
  - [ ] Add AM Best Rating row
  - [ ] Add Admitted Status row
  - [ ] Add Policy Type row
  - [ ] Color-code ratings

- [ ] Task 7: Unit tests (AC: All)
  - [ ] Test CollapsibleSection toggle behavior
  - [ ] Test EndorsementMatrix with mock data
  - [ ] Test PremiumBreakdownTable calculations
  - [ ] Test buildPolicyMetadataRows()
  - [ ] Test buildCarrierInfoRows()

- [ ] Task 8: E2E tests (AC: 10.8.4, 10.8.5)
  - [ ] Create `__tests__/e2e/enhanced-comparison-table.spec.ts`
  - [ ] Test collapsible section toggle
  - [ ] Test endorsement matrix display
  - [ ] Test premium breakdown display

- [ ] Task 9: Build and verify (AC: All)
  - [ ] Run `npm run build` - no errors
  - [ ] Run `npm test` - all tests pass

## Dev Notes

### Technical Approach

**Collapsible Section Pattern:**
```tsx
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: number;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, badge, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 w-full p-2 hover:bg-slate-50"
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        <span className="font-semibold">{title}</span>
        {badge !== undefined && <Badge variant="secondary">{badge}</Badge>}
      </button>
      {isOpen && children}
    </div>
  );
}
```

**Endorsement Matrix Structure:**
```tsx
// Collect all unique endorsements across quotes
const allEndorsements = new Map<string, { name: string; formNumber: string; isCritical: boolean }>();
for (const extraction of extractions) {
  for (const endorsement of extraction.endorsements) {
    const key = endorsement.formNumber || endorsement.name;
    if (!allEndorsements.has(key)) {
      const isCritical = CRITICAL_ENDORSEMENTS.some(
        ce => ce.formNumber === endorsement.formNumber || ce.name === endorsement.name
      );
      allEndorsements.set(key, {
        name: endorsement.name,
        formNumber: endorsement.formNumber,
        isCritical
      });
    }
  }
}

// Sort: critical first, then alphabetical
const sortedEndorsements = [...allEndorsements.entries()].sort((a, b) => {
  if (a[1].isCritical && !b[1].isCritical) return -1;
  if (!a[1].isCritical && b[1].isCritical) return 1;
  return a[1].name.localeCompare(b[1].name);
});
```

**Carrier Rating Color Coding:**
```typescript
function getRatingColor(rating: string | null): string {
  if (!rating) return 'text-slate-400';
  if (rating.startsWith('A++') || rating.startsWith('A+')) return 'text-green-600';
  if (rating.startsWith('A')) return 'text-blue-600';
  return 'text-amber-600';
}
```

### File Locations

| File | Action | Purpose |
|------|--------|---------|
| `src/components/compare/collapsible-section.tsx` | CREATE | Reusable collapsible section |
| `src/components/compare/endorsement-matrix.tsx` | CREATE | Endorsement comparison matrix |
| `src/components/compare/premium-breakdown-table.tsx` | CREATE | Premium breakdown table |
| `src/lib/compare/diff.ts` | MODIFY | Add policy metadata and carrier info row builders |
| `src/components/compare/comparison-table.tsx` | MODIFY | Integrate collapsible sections and new components |
| `__tests__/components/compare/collapsible-section.test.tsx` | CREATE | CollapsibleSection tests |
| `__tests__/components/compare/endorsement-matrix.test.tsx` | CREATE | EndorsementMatrix tests |
| `__tests__/components/compare/premium-breakdown-table.test.tsx` | CREATE | PremiumBreakdownTable tests |
| `__tests__/e2e/enhanced-comparison-table.spec.ts` | CREATE | E2E tests |

### Project Structure Notes

- Follows existing component structure in `src/components/compare/`
- Reuses existing diff.ts patterns for row building
- Integrates with existing GapConflictBanner for gap analysis
- Uses shadcn/ui primitives (Badge, Button) for consistency

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-10.md#UI-Implementation]
- [Source: src/components/compare/comparison-table.tsx - Current implementation]
- [Source: src/lib/compare/diff.ts - Row building patterns]
- [Source: src/types/compare.ts - PolicyMetadata, CarrierInfo, Endorsement interfaces]

### Learnings from Previous Story

**From Story 10.7 (Automated Gap Analysis):**
- GapAnalysis integrated into ComparisonTableData via `buildComparisonRows()`
- GapConflictBanner already displays endorsement gaps, limit concerns, risk score
- Risk score badge uses color coding: green (<30), yellow (30-60), red (>60)
- `analyzeGaps()` function available at `src/lib/compare/gap-analysis.ts`

**Important - Story 10.12 Context (Extraction at Upload Time):**
- Extraction data now stored in `documents.extraction_data` JSONB column
- Pre-extracted data means instant comparison page load (no wait for extraction)
- All Epic 10 fields (policyMetadata, endorsements, carrierInfo, premiumBreakdown) should be available
- EXTRACTION_VERSION = 3 ensures cache hit uses latest schema

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/10-8-enhanced-comparison-table.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
