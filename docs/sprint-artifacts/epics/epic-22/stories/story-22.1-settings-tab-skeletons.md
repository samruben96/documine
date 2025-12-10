# Story 22.1: Settings Tab Skeletons

**Epic:** [Epic 22 - UI Polish Sprint](../epic.md)
**Points:** 3
**Priority:** P0

---

## User Story

**As a** user navigating to Settings tabs,
**I want to** see skeleton loading states while data loads,
**So that** I know the app is working and content is coming.

## Background

Currently, BrandingTab and UsageTab show nothing while their data loads. This creates a "clunky" feel where the UI appears frozen. Adding skeleton loaders provides immediate visual feedback.

## Acceptance Criteria

### AC-22.1.1: BrandingTab Skeleton
- [ ] Create `branding-tab-skeleton.tsx` component
- [ ] Skeleton matches structure of BrandingTab (logo area, color pickers, tagline)
- [ ] BrandingTab shows skeleton while `isLoading` is true
- [ ] Smooth transition from skeleton to content

### AC-22.1.2: UsageTab Skeleton
- [ ] Create `usage-tab-skeleton.tsx` component
- [ ] Skeleton matches structure (date picker, stat cards, chart area, table)
- [ ] UsageTab shows skeleton while `isLoading` is true
- [ ] Smooth transition from skeleton to content

### AC-22.1.3: Pattern Consistency
- [ ] Follow `TeamTabSkeleton` pattern exactly
- [ ] Use `Skeleton` component from `@/components/ui/skeleton`
- [ ] Realistic widths for text placeholders
- [ ] 3 placeholder rows for any tables

### AC-22.1.4: Tests
- [ ] Unit tests for BrandingTabSkeleton renders correctly
- [ ] Unit tests for UsageTabSkeleton renders correctly
- [ ] Integration test: BrandingTab shows skeleton during loading
- [ ] Integration test: UsageTab shows skeleton during loading

## Technical Notes

**Files to Create:**
- `src/components/settings/branding-tab-skeleton.tsx`
- `src/components/settings/usage-tab-skeleton.tsx`

**Files to Modify:**
- `src/components/settings/branding-tab.tsx` - Add loading state
- `src/components/settings/usage-tab.tsx` - Add loading state (if not present)

**Pattern Reference:**
```typescript
// See: src/components/settings/team-tab-skeleton.tsx
export function BrandingTabSkeleton() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Agency Branding</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo upload area */}
        <Skeleton className="h-24 w-24 rounded-lg" />
        {/* Color pickers */}
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        {/* Tagline */}
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}
```

## Test Commands

```bash
npm run test:components -- branding-tab
npm run test:components -- usage-tab
```

## Definition of Done

- [ ] Both skeleton components created
- [ ] Both tabs show skeletons during loading
- [ ] Unit tests passing
- [ ] Visual verification in browser
- [ ] Code reviewed
