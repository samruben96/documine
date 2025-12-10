# Epic 22: UI Polish Sprint

**Status:** Ready for Development
**Created:** 2025-12-09
**Tech Spec:** [tech-spec.md](./tech-spec.md)

---

## Overview

Address the "clunky" UX feeling identified in Epic 20-21 retrospective. Quick polish sprint focusing on loading states, transitions, and visual consistency.

## Business Value

- Improved perceived performance through skeleton loaders
- Smoother, more professional feel with transitions
- Reduced user frustration during data loading
- Consistent visual language across the app

## Stories

| # | Story | Points | Priority |
|---|-------|--------|----------|
| 22.1 | [Settings Tab Skeletons](./stories/story-22.1-settings-tab-skeletons.md) | 3 | P0 |
| 22.2 | [Admin Panel Skeletons](./stories/story-22.2-admin-panel-skeletons.md) | 3 | P0 |
| 22.3 | [View Transitions & Chart Fix](./stories/story-22.3-view-transitions-chart-fix.md) | 2 | P1 |
| 22.4 | [Spacing Standardization](./stories/story-22.4-spacing-standardization.md) | 2 | P2 |

**Total Points:** 10

## Dependencies

- None - standalone polish epic

## Acceptance Criteria (Epic Level)

- [ ] All Settings tabs show skeleton loaders during data fetch
- [ ] All Admin panels show skeleton loaders during data fetch
- [ ] Pages transition smoothly without jarring jumps
- [ ] No Recharts console warnings
- [ ] Consistent spacing across all pages
- [ ] All tests pass
- [ ] No performance regression

## Technical Context

- Uses existing `Skeleton` component (`src/components/ui/skeleton.tsx`)
- Follows `TeamTabSkeleton` pattern for consistency
- Tailwind-only transitions (no new dependencies)
- See [tech-spec.md](./tech-spec.md) for full details

## Definition of Done

- [ ] All 4 stories completed
- [ ] Unit tests for new skeleton components
- [ ] Visual QA passed
- [ ] No console errors/warnings
- [ ] Code reviewed and merged
