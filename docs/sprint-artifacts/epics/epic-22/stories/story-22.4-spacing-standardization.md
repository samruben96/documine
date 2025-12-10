# Story 22.4: Spacing Standardization

**Epic:** [Epic 22 - UI Polish Sprint](../epic.md)
**Points:** 2
**Priority:** P2

---

## User Story

**As a** user viewing the app,
**I want** consistent spacing throughout,
**So that** the app feels cohesive and well-designed.

## Background

Code audit revealed minor spacing inconsistencies:
- Some grids use `gap-4`, others use `gap-6`
- Section spacing varies between `space-y-4` and `space-y-6`
- These create subtle visual inconsistency

## Acceptance Criteria

### AC-22.4.1: Audit Spacing Patterns
- [ ] Review all page layouts for grid gaps
- [ ] Document current spacing usage
- [ ] Identify inconsistencies

### AC-22.4.2: Standardize Grid Gaps
- [ ] Card grids: Standardize to `gap-6`
- [ ] Dashboard tool cards: `gap-6`
- [ ] Settings content grids: `gap-6`
- [ ] Admin panel grids: `gap-6`

### AC-22.4.3: Standardize Section Spacing
- [ ] Vertical sections: `space-y-6`
- [ ] Card content: `space-y-4` (tighter for card interiors)
- [ ] Form fields: `space-y-4`

### AC-22.4.4: Visual Verification
- [ ] All pages reviewed visually
- [ ] Spacing feels consistent throughout
- [ ] No layout breaks from changes

### AC-22.4.5: Tests
- [ ] Visual regression check (manual)
- [ ] Existing tests still pass

## Technical Notes

**Spacing Standards:**

| Context | Spacing | Tailwind Class |
|---------|---------|----------------|
| Card grids | 24px | `gap-6` |
| Section spacing | 24px | `space-y-6` or `mt-6` |
| Card content | 16px | `space-y-4` |
| Form fields | 16px | `space-y-4` |
| Inline elements | 8px | `gap-2` |

**Pages to Review:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/documents/page.tsx`
- `src/app/(dashboard)/compare/page.tsx`
- `src/app/(dashboard)/one-pager/page.tsx`
- `src/app/(dashboard)/ai-buddy/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- All Settings tab components
- All Admin panel components

**Common Patterns:**
```typescript
// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map(card => <Card key={card.id} />)}
</div>

// Page sections
<div className="space-y-6">
  <PageHeader />
  <ContentSection />
  <AnotherSection />
</div>

// Card content
<CardContent className="space-y-4">
  <Field />
  <Field />
</CardContent>
```

## Test Commands

```bash
# Run full test suite to ensure no breaks
npm test

# Visual verification
npm run dev
# Navigate through all pages
```

## Definition of Done

- [ ] All grid gaps standardized to gap-6
- [ ] All section spacing standardized to space-y-6
- [ ] Visual verification across all pages
- [ ] No layout breaks
- [ ] All tests passing
- [ ] Code reviewed
