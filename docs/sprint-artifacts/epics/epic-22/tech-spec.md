# docuMINE - Technical Specification

**Author:** Sam
**Date:** 2025-12-09
**Project Level:** Quick-Flow (Brownfield)
**Change Type:** UI Polish Sprint
**Development Context:** Epic 22 - Address "clunky" UX feeling

---

## Context

### Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| UI Best Practices Research | Loaded | Skeleton patterns, empty states, transitions |
| Epic 20-21 Retrospective | Loaded | "Clunky" feeling identified, UI polish recommended |
| Code Audit | Completed | Missing skeletons in Settings tabs |
| Visual Audit (Playwright) | Completed | App in good shape overall, minor gaps |

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| **Framework** | Next.js 16.0.7 | App Router |
| **React** | 19.2.0 | Latest |
| **UI Library** | shadcn/ui | Radix primitives |
| **Styling** | Tailwind CSS 4.x | tw-animate-css for animations |
| **Charts** | Recharts 3.5.1 | Usage analytics |
| **Testing** | Vitest 4.0.14 | Unit tests |
| **E2E** | Playwright 1.57.0 | Browser testing |

### Existing Codebase Structure

**Skeleton Pattern (established):**
```typescript
// src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }) {
  return (
    <div className={cn("bg-accent animate-pulse rounded-md", className)} {...props} />
  )
}
```

**Reference Implementation:**
- `src/components/settings/team-tab-skeleton.tsx` - Full skeleton for table loading
- Pattern: Create `{ComponentName}Skeleton` component with matching structure

**Animation Utilities:**
- `animate-pulse` - Loading shimmer (87 files using)
- `animate-spin` - Spinner rotation
- `animate-float` - Empty state icons
- `transition-all duration-200` - Hover effects

**File Organization:**
- Skeletons: Same folder as component or `components/ui/`
- Settings tabs: `src/components/settings/`
- Admin panels: `src/components/admin/`

---

## The Change

### Problem Statement

Users describe docuMINE as feeling "clunky" compared to modern apps. Specific issues:

1. **Missing loading states** - Settings tabs show nothing while data loads
2. **Abrupt transitions** - Views change instantly without smooth transitions
3. **Console warnings** - Recharts size warning during render
4. **Minor inconsistencies** - Gap spacing varies (gap-4 vs gap-6)

### Proposed Solution

Quick UI polish sprint (~4 stories) focusing on perceived performance and smoothness:

1. **Add skeleton loaders** to Settings tabs missing them
2. **Add subtle transitions** to view changes using Tailwind
3. **Fix Recharts warning** with proper container sizing
4. **Standardize spacing** across grids and layouts

### Scope

**In Scope:**

- Settings tabs: BrandingTab, UsageTab, Admin sub-panels skeleton loaders
- View transitions using Tailwind CSS (no new dependencies)
- Recharts ResponsiveContainer fix
- Spacing audit and standardization

**Out of Scope:**

- New features or functionality
- Major architectural changes
- Adding framer-motion or animation libraries
- Component library version upgrades
- Performance optimization (separate epic)

---

## Implementation Details

### Source Tree Changes

| File | Action | Change |
|------|--------|--------|
| `src/components/settings/branding-tab-skeleton.tsx` | CREATE | Skeleton for branding form |
| `src/components/settings/usage-tab-skeleton.tsx` | CREATE | Skeleton for usage analytics |
| `src/components/admin/admin-panel-skeleton.tsx` | CREATE | Shared skeleton for admin sub-panels |
| `src/components/settings/branding-tab.tsx` | MODIFY | Add loading state with skeleton |
| `src/components/settings/usage-tab.tsx` | MODIFY | Add loading state with skeleton |
| `src/components/admin/user-management-panel.tsx` | MODIFY | Add loading state |
| `src/components/admin/analytics/usage-analytics-panel.tsx` | MODIFY | Fix chart container sizing |
| `src/app/globals.css` | MODIFY | Add view transition utilities |
| `src/components/layout/header.tsx` | MODIFY | Add nav link transitions |

### Technical Approach

**1. Skeleton Loading States**

Follow established `TeamTabSkeleton` pattern:
```typescript
// New: branding-tab-skeleton.tsx
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
        <Skeleton className="h-10 w-full" /> {/* Logo upload */}
        <Skeleton className="h-10 w-full" /> {/* Color picker */}
        <Skeleton className="h-20 w-full" /> {/* Tagline */}
      </CardContent>
    </Card>
  );
}
```

**2. View Transitions (Tailwind-only)**

Add transition utilities to globals.css:
```css
/* View transition utilities */
.view-transition {
  @apply transition-opacity duration-150 ease-in-out;
}

.view-enter {
  @apply opacity-0;
}

.view-enter-active {
  @apply opacity-100;
}
```

Apply to page content wrappers:
```typescript
<div className="view-transition animate-in fade-in duration-200">
  {/* Page content */}
</div>
```

**3. Recharts Fix**

The warning "width(-1) and height(-1)" occurs when ResponsiveContainer renders before parent has dimensions.

Fix pattern:
```typescript
// Wrap chart in sized container
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

**4. Spacing Standardization**

Audit and standardize to:
- Grid gaps: `gap-6` (24px) for card grids
- Section spacing: `space-y-6` for vertical sections
- Card padding: `p-6` for card content

### Existing Patterns to Follow

**Skeleton Pattern (from TeamTabSkeleton):**
- Match structure of actual component
- Use `Skeleton` component from `@/components/ui/skeleton`
- Include realistic widths (`w-28`, `w-40`, etc.)
- Render 3 placeholder rows for tables

**Loading State Pattern:**
```typescript
const { data, isLoading } = useHook();

if (isLoading) {
  return <ComponentSkeleton />;
}

return <ActualComponent data={data} />;
```

**Transition Pattern (existing in codebase):**
- `transition-all duration-200` for hover effects
- `transition-colors` for color changes
- `ease-in-out` for smooth acceleration

### Integration Points

| Integration | Details |
|-------------|---------|
| **Skeleton UI** | Uses existing `@/components/ui/skeleton` |
| **Tailwind CSS** | tw-animate-css already installed |
| **Settings hooks** | `useAgencyBranding`, `useUsageAnalytics` have `isLoading` |
| **Admin hooks** | `useUsers`, `useAuditLogs` have `isLoading` |

---

## Development Context

### Relevant Existing Code

| File | Reference |
|------|-----------|
| `src/components/settings/team-tab-skeleton.tsx` | **Primary pattern** - Copy structure |
| `src/components/settings/team-tab.tsx:15-20` | Loading state implementation |
| `src/components/admin/analytics/usage-trend-chart.tsx` | Recharts usage |
| `src/app/globals.css` | Animation utilities location |

### Dependencies

**Framework/Libraries (already installed):**

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 4.x | Styling |
| tw-animate-css | 1.4.0 | Animation utilities |
| @radix-ui/react-* | various | UI primitives |
| recharts | 3.5.1 | Charts |

**Internal Modules:**

- `@/components/ui/skeleton` - Skeleton component
- `@/components/ui/card` - Card components
- `@/lib/utils` - cn() utility

### Configuration Changes

None required - all utilities already available.

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode
- Functional components with hooks
- Named exports for components
- `cn()` for className merging

**Test Patterns:**
- Vitest with React Testing Library
- File pattern: `__tests__/components/{path}/{name}.test.tsx`
- Happy-dom for DOM testing

**File Organization:**
- Skeletons co-located with components
- One component per file
- Index exports for folders

### Test Framework & Standards

| Aspect | Standard |
|--------|----------|
| **Framework** | Vitest 4.0.14 |
| **DOM** | happy-dom |
| **Assertions** | @testing-library/jest-dom |
| **User Events** | @testing-library/user-event |
| **Coverage** | vitest --coverage |

---

## Implementation Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20.x |
| **Framework** | Next.js 16.0.7 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.x |
| **Components** | shadcn/ui (Radix) |
| **State** | React hooks |
| **Testing** | Vitest + RTL + Playwright |

---

## Technical Details

### Skeleton Component Specifications

**BrandingTabSkeleton:**
- Logo upload placeholder: `h-24 w-24 rounded-lg`
- Color picker row: `h-10 w-full`
- Tagline textarea: `h-20 w-full`
- Save button: `h-10 w-32`

**UsageTabSkeleton:**
- Date range picker: `h-10 w-48`
- Stat cards (4): `h-24 w-full` in grid
- Chart area: `h-[300px] w-full`
- User table: 3 skeleton rows

**AdminPanelSkeleton (shared):**
- Header with search: `h-10 w-64`
- Table header: static text
- Table rows: 5 skeleton rows with appropriate widths

### Transition Specifications

| Transition | Duration | Easing |
|------------|----------|--------|
| Page fade-in | 200ms | ease-out |
| Tab content | 150ms | ease-in-out |
| Hover states | 200ms | ease-in-out |
| Loading to content | 150ms | ease-out |

### Chart Container Fix

```typescript
// Before (causes warning):
<ResponsiveContainer>
  <LineChart />
</ResponsiveContainer>

// After (fixed):
<div className="h-[300px] w-full min-h-[200px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart />
  </ResponsiveContainer>
</div>
```

---

## Development Setup

```bash
# Clone and install
git clone <repo>
cd documine
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run specific test suites
npm run test:components
npm run test:admin
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b epic-22-ui-polish`
2. Verify dev environment: `npm run dev`
3. Review existing skeletons: `src/components/settings/team-tab-skeleton.tsx`

### Implementation Steps

**Story 22.1: Settings Tab Skeletons**
1. Create `branding-tab-skeleton.tsx`
2. Create `usage-tab-skeleton.tsx`
3. Update `branding-tab.tsx` to use skeleton during loading
4. Update usage tab to use skeleton during loading
5. Write unit tests for skeletons

**Story 22.2: Admin Panel Skeletons**
1. Create shared `admin-panel-skeleton.tsx`
2. Update `user-management-panel.tsx` with loading state
3. Update `usage-analytics-panel.tsx` with loading state
4. Update `audit-log-panel.tsx` with loading state
5. Write unit tests

**Story 22.3: View Transitions & Chart Fix**
1. Add transition utilities to `globals.css`
2. Apply fade-in to main page wrappers
3. Fix Recharts container sizing
4. Test transitions in browser
5. Verify no console warnings

**Story 22.4: Spacing Standardization**
1. Audit grid gaps across pages
2. Standardize to `gap-6` for card grids
3. Ensure consistent `space-y-6` for sections
4. Visual verification across all pages

### Testing Strategy

| Test Type | Coverage |
|-----------|----------|
| **Unit Tests** | Skeleton components render correctly |
| **Integration** | Loading states transition to content |
| **Visual** | Manual verification of transitions |
| **E2E** | Page loads without console errors |

### Acceptance Criteria

**Story 22.1:**
- [ ] BrandingTab shows skeleton while loading
- [ ] UsageTab shows skeleton while loading
- [ ] Skeletons match actual component structure
- [ ] Tests pass

**Story 22.2:**
- [ ] Admin panels show skeletons during data fetch
- [ ] Consistent skeleton pattern across all panels
- [ ] Tests pass

**Story 22.3:**
- [ ] Pages fade in smoothly on navigation
- [ ] No Recharts console warnings
- [ ] Transitions feel smooth, not jarring
- [ ] No performance regression

**Story 22.4:**
- [ ] Consistent gap-6 on card grids
- [ ] Consistent space-y-6 for sections
- [ ] Visual consistency across pages

---

## Developer Resources

### File Paths Reference

**New Files:**
- `src/components/settings/branding-tab-skeleton.tsx`
- `src/components/settings/usage-tab-skeleton.tsx`
- `src/components/admin/admin-panel-skeleton.tsx`

**Modified Files:**
- `src/components/settings/branding-tab.tsx`
- `src/components/settings/usage-tab.tsx`
- `src/components/admin/user-management-panel.tsx`
- `src/components/admin/analytics/usage-analytics-panel.tsx`
- `src/components/admin/audit-log/audit-log-panel.tsx`
- `src/app/globals.css`

### Key Code Locations

| Code | Location |
|------|----------|
| Skeleton component | `src/components/ui/skeleton.tsx` |
| TeamTabSkeleton pattern | `src/components/settings/team-tab-skeleton.tsx` |
| Usage chart | `src/components/admin/analytics/usage-trend-chart.tsx` |
| Global styles | `src/app/globals.css` |

### Testing Locations

| Type | Location |
|------|----------|
| Component tests | `__tests__/components/settings/` |
| Admin tests | `__tests__/components/admin/` |
| E2E tests | `__tests__/e2e/` |

### Documentation to Update

- `docs/sprint-artifacts/sprint-status.yaml` - Add Epic 22 status
- `CLAUDE.md` - No changes needed

---

## UX/UI Considerations

### UI Components Affected

| Component | Change |
|-----------|--------|
| BrandingTab | Add skeleton loading state |
| UsageTab | Add skeleton loading state |
| Admin panels | Add skeleton loading states |
| Page wrappers | Add fade-in transition |

### Visual Patterns

**Skeleton shimmer:**
- Background: `bg-accent` (subtle gray)
- Animation: `animate-pulse` (1.5s ease-in-out infinite)
- Border radius: `rounded-md`

**Transitions:**
- Duration: 150-200ms
- Easing: ease-out for enters, ease-in-out for hovers
- No jarring jumps or flashes

### Accessibility

- [ ] Skeleton components have appropriate ARIA attributes
- [ ] Transitions respect `prefers-reduced-motion`
- [ ] Loading states announced to screen readers

---

## Testing Approach

### Test Strategy

**Unit Tests (Vitest):**
```typescript
describe('BrandingTabSkeleton', () => {
  it('renders skeleton elements', () => {
    render(<BrandingTabSkeleton />);
    expect(screen.getAllByRole('presentation')).toHaveLength(4);
  });
});
```

**Integration Tests:**
```typescript
describe('BrandingTab', () => {
  it('shows skeleton while loading', () => {
    render(<BrandingTab />);
    expect(screen.getByTestId('branding-skeleton')).toBeInTheDocument();
  });

  it('shows content after loading', async () => {
    render(<BrandingTab />);
    await waitFor(() => {
      expect(screen.queryByTestId('branding-skeleton')).not.toBeInTheDocument();
    });
  });
});
```

**Visual/Manual:**
- Navigate through all Settings tabs
- Verify smooth skeleton-to-content transitions
- Check console for Recharts warnings
- Verify spacing consistency

---

## Deployment Strategy

### Deployment Steps

1. Merge to main branch
2. Vercel auto-deploys to preview
3. Visual QA on preview URL
4. Promote to production

### Rollback Plan

1. Revert commit via GitHub
2. Vercel auto-redeploys previous version
3. No database changes to rollback

### Monitoring

- Check Vercel deployment logs
- Verify no console errors in production
- Monitor Core Web Vitals (LCP, CLS)
