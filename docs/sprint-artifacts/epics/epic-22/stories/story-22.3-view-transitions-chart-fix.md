# Story 22.3: View Transitions & Chart Fix

**Epic:** [Epic 22 - UI Polish Sprint](../epic.md)
**Points:** 2
**Priority:** P1

---

## User Story

**As a** user navigating the app,
**I want** smooth transitions between views,
**So that** the app feels polished and professional.

**As a** developer,
**I want** to fix the Recharts console warning,
**So that** the console is clean during development.

## Background

1. **Transitions:** Views change instantly, creating a jarring experience. Adding subtle fade-in transitions improves perceived quality.

2. **Chart Warning:** Recharts logs "width(-1) and height(-1)" warning when ResponsiveContainer renders before parent has dimensions.

## Acceptance Criteria

### AC-22.3.1: View Transition Utilities
- [ ] Add transition utilities to `globals.css`
- [ ] Support fade-in for page content
- [ ] Use Tailwind's built-in animation classes
- [ ] No new dependencies (no framer-motion)

### AC-22.3.2: Apply Transitions
- [ ] Dashboard page content fades in
- [ ] Settings tab content transitions smoothly
- [ ] Admin panel content transitions on sub-tab switch
- [ ] Transitions are subtle (150-200ms)

### AC-22.3.3: Recharts Fix
- [ ] Identify all ResponsiveContainer usages
- [ ] Wrap in properly sized parent containers
- [ ] No more console warnings about width/height
- [ ] Charts still render correctly and responsively

### AC-22.3.4: Reduced Motion Support
- [ ] Respect `prefers-reduced-motion` media query
- [ ] Disable transitions for users who prefer reduced motion

### AC-22.3.5: Tests
- [ ] Visual verification of transitions
- [ ] Console check - no Recharts warnings
- [ ] E2E test confirms no console errors on Settings > Admin > Usage Analytics

## Technical Notes

**Files to Modify:**
- `src/app/globals.css` - Add transition utilities
- `src/components/admin/analytics/usage-trend-chart.tsx` - Fix container
- Various page layouts - Apply transition classes

**Transition CSS:**
```css
/* Add to globals.css */
@layer utilities {
  .view-fade-in {
    animation: fadeIn 200ms ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .view-fade-in {
    animation: none;
  }
}
```

**Recharts Fix:**
```typescript
// Before (causes warning):
<ResponsiveContainer>
  <LineChart data={data} />
</ResponsiveContainer>

// After (fixed):
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} />
  </ResponsiveContainer>
</div>
```

**Chart Files to Check:**
- `src/components/admin/analytics/usage-trend-chart.tsx`

## Test Commands

```bash
# Visual verification
npm run dev
# Navigate to Settings > Admin > Usage Analytics
# Check browser console for warnings

# E2E
npx playwright test --grep "usage analytics"
```

## Definition of Done

- [ ] Transition utilities added to globals.css
- [ ] Page content has subtle fade-in
- [ ] Recharts warning eliminated
- [ ] Reduced motion respected
- [ ] Visual verification complete
- [ ] Code reviewed
