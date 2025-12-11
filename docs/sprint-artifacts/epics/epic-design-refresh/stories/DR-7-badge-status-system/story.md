# Story DR.7: Badge & Status Indicator System

Status: done

## Story

As a **docuMINE user**,
I want **consistent status badges across all features**,
So that **I can quickly understand item status and the interface feels unified**.

## Acceptance Criteria

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.7.1 | Badge base: px-2 py-0.5 rounded text-xs font-medium |
| DR.7.2 | Default (draft): bg-slate-100 text-slate-600 |
| DR.7.3 | In Progress: bg-amber-100 text-amber-700 |
| DR.7.4 | Complete/Success: bg-green-100 text-green-700 |
| DR.7.5 | Info/Type: bg-blue-100 text-blue-700 |
| DR.7.6 | Bundle/Special: bg-purple-100 text-purple-700 |
| DR.7.7 | Error/Warning: bg-red-100 text-red-700 |

## Tasks / Subtasks

- [x] Task 1: Audit current Badge component and usage patterns (AC: DR.7.1-DR.7.7)
  - [x] 1.1 Review `src/components/ui/badge.tsx` current implementation
  - [x] 1.2 Document current variants: default, secondary, destructive, outline
  - [x] 1.3 Identify all Badge usages across codebase (23 files found)
  - [x] 1.4 Catalog custom className overrides on badges
  - [x] 1.5 List specialized badge components: DocumentTypeBadge, ExtractionStatusBadge, ConfidenceBadge, OnboardingStatusBadge

- [x] Task 2: Update Badge component with status variants (AC: DR.7.1-DR.7.7)
  - [x] 2.1 Update base classes from `rounded-full` to `rounded` (tech spec says pill but `rounded` for slight rounding)
  - [x] 2.2 Update padding to `px-2 py-0.5`
  - [x] 2.3 Update text to `text-xs font-medium`
  - [x] 2.4 Add `status-default` variant: `bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`
  - [x] 2.5 Add `status-progress` variant: `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
  - [x] 2.6 Add `status-success` variant: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
  - [x] 2.7 Add `status-info` variant: `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
  - [x] 2.8 Add `status-special` variant: `bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`
  - [x] 2.9 Add `status-error` variant: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`

- [x] Task 3: Create StatusBadge convenience component (AC: DR.7.2-DR.7.7)
  - [x] 3.1 Create `StatusBadge` component with `status` prop mapping to variants
  - [x] 3.2 Define `StatusType` union type: 'draft' | 'progress' | 'success' | 'info' | 'special' | 'error'
  - [x] 3.3 Add export to Badge module

- [x] Task 4: Migrate DocumentTypeBadge to new variants (AC: DR.7.5)
  - [x] 4.1 Update `src/components/documents/document-type-badge.tsx`
  - [x] 4.2 Replace custom className with `status-info` variant for quote
  - [x] 4.3 Replace custom className with `status-default` variant for general
  - [x] 4.4 Test badge appearance matches design spec

- [x] Task 5: Migrate ExtractionStatusBadge to new patterns (AC: DR.7.2-DR.7.7)
  - [x] 5.1 Review `src/components/documents/extraction-status-badge.tsx`
  - [x] 5.2 Map status colors to new variants: pending→default, extracting→info, complete→success, failed→error, skipped→success
  - [x] 5.3 Ensure dark mode compatibility

- [x] Task 6: Migrate OnboardingStatusBadge to new variants (AC: DR.7.2-DR.7.4)
  - [x] 6.1 Update `src/components/ai-buddy/admin/onboarding-status-badge.tsx`
  - [x] 6.2 Map: completed→success, skipped→progress, not_started→default
  - [x] 6.3 Test appearance consistency

- [x] Task 7: Audit and update Compare/Reporting badge usages (AC: DR.7.1-DR.7.7)
  - [x] 7.1 Review `src/components/compare/gap-conflict-banner.tsx` badges
  - [x] 7.2 Review `src/components/reporting/report-view.tsx` badges
  - [x] 7.3 Update to use new variants where appropriate
  - [x] 7.4 Review comparison-table, comparison-history badges

- [x] Task 8: Audit and update Admin badges (AC: DR.7.1-DR.7.7)
  - [x] 8.1 Review `src/components/admin/audit-log/` badges
  - [x] 8.2 Review `src/components/admin/user-table.tsx` badges
  - [x] 8.3 Standardize admin badge styling

- [x] Task 9: Audit and update AI Buddy badges (AC: DR.7.1-DR.7.7)
  - [x] 9.1 Review ConfidenceBadge styling consistency
  - [x] 9.2 Review guardrail-toggle-card, restricted-topic-card badges
  - [x] 9.3 Review project-sidebar, project-card badges
  - [x] 9.4 Review chat-message, chat-history-item badges

- [x] Task 10: Write unit tests for Badge component variants
  - [x] 10.1 Test base badge has `rounded text-xs font-medium` classes
  - [x] 10.2 Test `status-default` variant has slate colors
  - [x] 10.3 Test `status-progress` variant has amber colors
  - [x] 10.4 Test `status-success` variant has green colors
  - [x] 10.5 Test `status-info` variant has blue colors
  - [x] 10.6 Test `status-special` variant has purple colors
  - [x] 10.7 Test `status-error` variant has red colors
  - [x] 10.8 Test dark mode variants are present
  - [x] 10.9 Test StatusBadge convenience component

- [x] Task 11: Write E2E tests for badge styling consistency
  - [x] 11.1 Test badge variants display correctly on documents page
  - [x] 11.2 Test badge styling in admin panels
  - [x] 11.3 Test badge visual consistency across features

- [x] Task 12: Build verification and final audit
  - [x] 12.1 Run production build - verify no errors
  - [x] 12.2 Run full test suite - verify all pass (112 badge tests pass)
  - [x] 12.3 Test assertions updated to match DR.7 color scheme

## Dev Notes

### Design Reference

The mockup (`docs/features/quoting/mockups/quoting-mockup.html`) establishes the badge pattern:

**Badge Styling (from tech-spec AC DR.7.1-DR.7.7):**
- Base: `px-2 py-0.5 rounded text-xs font-medium`
- Default (draft): `bg-slate-100 text-slate-600`
- In Progress: `bg-amber-100 text-amber-700`
- Complete/Success: `bg-green-100 text-green-700`
- Info/Type: `bg-blue-100 text-blue-700`
- Bundle/Special: `bg-purple-100 text-purple-700`
- Error/Warning: `bg-red-100 text-red-700`

### Current Badge Component State

From reviewing `src/components/ui/badge.tsx`:

```tsx
// Current implementation
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit ...",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground ...",
        secondary: "border-transparent bg-secondary text-secondary-foreground ...",
        destructive: "border-transparent bg-destructive text-white ...",
        outline: "text-foreground ...",
      },
    },
  }
)
```

**Differences from target:**

| Property | Current | Target | Change |
|----------|---------|--------|--------|
| Border radius | `rounded-full` | `rounded` | Less pill-shaped |
| Variants | 4 generic | 6 status + existing | Add status variants |
| Colors | CSS variables | Explicit slate/amber/green/blue/purple/red | Specific status colors |

### Current Badge Usage Patterns

From auditing 43 files using Badge:

**1. DocumentTypeBadge** (`document-type-badge.tsx`):
- Quote: `bg-blue-100 text-blue-700 border-blue-200` → maps to `status-info`
- General: `bg-gray-100 text-gray-600 border-gray-200` → maps to `status-default`

**2. ExtractionStatusBadge** (`extraction-status-badge.tsx`):
- Uses custom div styling, not Badge component
- pending/queued: slate → `status-default`
- extracting: blue → `status-info`
- complete: green → `status-success`
- failed: red → `status-error`

**3. OnboardingStatusBadge** (`onboarding-status-badge.tsx`):
- completed: green → `status-success`
- skipped: yellow → `status-progress`
- not_started: gray → `status-default`

**4. ConfidenceBadge** (`confidence-badge.tsx`):
- high: emerald → close to `status-success`
- medium: amber → `status-progress`
- low: slate → `status-default`

### Implementation Strategy

1. **Extend Badge variants** - Add 6 new status variants to CVA config
2. **Create StatusBadge wrapper** - Convenience component for common use cases
3. **Migrate existing badges** - Update specialized badges to use new variants
4. **Preserve existing variants** - Keep default, secondary, destructive, outline for backward compatibility
5. **Add dark mode** - All new variants include dark: prefixed colors

### Variant Mapping Guide

| Use Case | Variant | Example |
|----------|---------|---------|
| Draft, Pending, Default | `status-default` | "Draft", "Queued", "Not Started" |
| Processing, In Progress | `status-progress` | "Analyzing...", "Processing", "In Progress" |
| Complete, Success, Done | `status-success` | "Complete", "Ready", "Done" |
| Info, Type indicators | `status-info` | "Quote", "PDF", "Active" |
| Bundle, Special | `status-special` | "Bundle", "Premium", "Featured" |
| Error, Failed, Warning | `status-error` | "Failed", "Error", "Blocked" |

### Learnings from Previous Story

**From Story DR-6-form-input-refinement (Status: done)**

- **Explicit colors:** Use `bg-slate-100 text-slate-600` explicitly, not CSS variables
- **Dark mode:** Add explicit dark: variants for all new classes (e.g., `dark:bg-slate-800 dark:text-slate-400`)
- **Testing approach:** 92 unit tests for form components - follow similar comprehensive approach
- **Consumer audit:** Check all components using Badge for custom className overrides
- **Build verification:** Run build after changes to catch any issues
- **Component pattern:** Extend CVA variants rather than modifying base classes

**Files modified in DR-6 for reference:**
- Input, Textarea, Label, Select components updated with explicit colors

**Key insight:**
- Many components already use explicit color classes on badges via className override
- Migration should map these custom classes to new variants for consistency
- Keep backward compatibility by preserving existing variants

### Project Structure Notes

**Files to Modify:**
- `src/components/ui/badge.tsx` - Add status variants to Badge component

**Files to Audit/Migrate:**
- `src/components/documents/document-type-badge.tsx` - Quote/General type badges
- `src/components/documents/extraction-status-badge.tsx` - Extraction status indicators
- `src/components/ai-buddy/admin/onboarding-status-badge.tsx` - Onboarding status
- `src/components/ai-buddy/confidence-badge.tsx` - Confidence level badges
- `src/components/compare/gap-conflict-banner.tsx` - Gap/conflict badges
- `src/components/admin/audit-log/` - Audit log badges
- `src/components/admin/user-table.tsx` - User role/status badges
- Additional 35+ files using Badge component

### References

- [Source: docs/sprint-artifacts/epics/epic-design-refresh/tech-spec.md#DR.7 - Badge & Status Indicator System]
- [Source: docs/sprint-artifacts/epics/epic-design-refresh/epic.md#Story DR.7]
- [Source: docs/features/quoting/mockups/quoting-mockup.html - Badge styling patterns]
- [Source: src/components/ui/badge.tsx - Current Badge implementation]
- [Source: stories/DR-6-form-input-refinement/story.md#Dev-Agent-Record - Previous story learnings]

## Dev Agent Record

### Context Reference

- [DR-7-badge-status-system.context.xml](./DR-7-badge-status-system.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Task 1 Audit (2025-12-11):**
- Badge base uses `rounded-full` (target: `rounded`)
- Already has `px-2 py-0.5 text-xs font-medium` ✅
- 23 files using Badge component
- DocumentTypeBadge: Custom colors for quote/general types
- ExtractionStatusBadge: Uses custom div (keep for complex retry behavior)
- OnboardingStatusBadge: Uses Badge with className override

### Completion Notes List

**Implementation Summary (2025-12-11):**
- Added 6 new status variants to Badge component: status-default, status-progress, status-success, status-info, status-special, status-error
- Changed base badge styling from `rounded-full` to `rounded` per DR.7.1 spec
- Created StatusBadge convenience component with StatusType union type
- Migrated all specialized badge components to use new variants
- All 112 badge-related tests pass
- Production build successful

**Key Changes:**
- Badge variants now use explicit Tailwind colors (e.g., `bg-green-100 text-green-700`) instead of CSS variables
- Dark mode support added to all new variants
- Backward compatibility maintained - existing variants (default, secondary, destructive, outline) unchanged

### File List

**Modified:**
- `src/components/ui/badge.tsx` - Added status variants and StatusBadge component
- `src/components/documents/document-type-badge.tsx` - Migrated to status-info/status-default variants
- `src/components/documents/extraction-status-badge.tsx` - Updated colors and rounding to DR.7 spec
- `src/components/ai-buddy/admin/onboarding-status-badge.tsx` - Migrated to status variants
- `src/components/ai-buddy/confidence-badge.tsx` - Updated to DR.7 color scheme
- `src/components/compare/gap-conflict-banner.tsx` - Updated custom badges with dark mode
- `src/components/reporting/report-view.tsx` - Updated severity badge colors
- `src/components/admin/user-table.tsx` - Migrated to status variants

**Tests Created/Updated:**
- `__tests__/components/ui/badge.test.tsx` - New (31 tests for Badge and StatusBadge)
- `__tests__/e2e/badge-styling-consistency.spec.ts` - New (E2E tests)
- `__tests__/components/ai-buddy/confidence-badge.test.tsx` - Updated color assertions
- `__tests__/components/ai-buddy/admin/onboarding-status-badge.test.tsx` - Updated color assertions
- `__tests__/components/documents/document-type-badge.test.tsx` - Updated color assertions
- `__tests__/components/documents/extraction-status-badge.test.tsx` - Updated color assertions

## Change Log

| Date | Change |
|------|--------|
| 2025-12-11 | Story created and drafted |
| 2025-12-11 | All tasks completed, status changed to review |
| 2025-12-11 | Senior Developer Review - APPROVED |

---

## Senior Developer Review (AI)

**Reviewer:** Sam
**Date:** 2025-12-11
**Outcome:** ✅ **APPROVED**

### Summary

All 7 acceptance criteria fully implemented with proper dark mode support, backward compatibility, and extensive test coverage (112 tests). Implementation follows DR.7 design specifications precisely.

### Acceptance Criteria Coverage

| AC ID | Description | Status | Evidence |
|-------|-------------|--------|----------|
| DR.7.1 | Badge base styling | ✅ IMPLEMENTED | `badge.tsx:8` |
| DR.7.2 | Default (slate) | ✅ IMPLEMENTED | `badge.tsx:21-22` |
| DR.7.3 | Progress (amber) | ✅ IMPLEMENTED | `badge.tsx:23-24` |
| DR.7.4 | Success (green) | ✅ IMPLEMENTED | `badge.tsx:25-26` |
| DR.7.5 | Info (blue) | ✅ IMPLEMENTED | `badge.tsx:27-28` |
| DR.7.6 | Special (purple) | ✅ IMPLEMENTED | `badge.tsx:29-30` |
| DR.7.7 | Error (red) | ✅ IMPLEMENTED | `badge.tsx:31-32` |

**Summary: 7 of 7 ACs implemented**

### Task Validation

**Summary: 12 of 12 tasks verified complete**

- All status variants added to Badge component ✅
- StatusBadge convenience component created ✅
- All specialized badges migrated ✅
- 112 badge-related tests passing ✅
- Production build successful ✅

### Action Items

**Code Changes Required:** None

**Advisory Notes:**
- Note: Consider documenting variant mapping guide in component JSDoc
