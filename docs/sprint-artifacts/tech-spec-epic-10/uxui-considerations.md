# UX/UI Considerations

## UI Components Affected

| Component | Action | Changes |
|-----------|--------|---------|
| ComparisonTable | MODIFY | Collapsible sections, endorsement matrix |
| GapConflictBanner | MODIFY | Endorsement gaps, enhanced messaging |
| OnePagerPreview | MODIFY | Match PDF structure |
| OnePagerPdfDocument | MODIFY | New sections |
| EndorsementMatrix | CREATE | Side-by-side endorsement view |
| PremiumBreakdownTable | CREATE | Premium allocation display |

## UX Flow Changes

**Current:** User sees flat coverage/limits table
**New:** User sees expandable sections:
1. Policy Overview (always open) - Carrier, dates, type
2. Coverage Comparison (always open) - Limits, deductibles
3. Endorsements (collapsed) - Expandable matrix
4. Premium Breakdown (collapsed) - Expandable table
5. Gap Analysis (banner) - Highlighted warnings

## Visual Patterns

**Endorsement Matrix:**
- ✅ Green check for present
- ❌ Red X for missing
- ⚠️ Yellow warning for critical missing

**Premium Breakdown:**
- Bar chart visualization (optional enhancement)
- Clear $ formatting
- Per-coverage % of total

## Accessibility

- Collapsible sections use `aria-expanded`
- Icons have `aria-label` descriptions
- Color not only indicator (icons + text)
- Keyboard navigation for sections

---
