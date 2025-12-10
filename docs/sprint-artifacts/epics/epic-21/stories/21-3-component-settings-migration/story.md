# Story 21.3: Component & Settings Migration

**Status:** Draft

---

## User Story

As an **agency admin**,
I want **the Admin panel to be a top-level Settings tab**,
So that **I can manage users, view analytics, and access audit logs without navigating through AI Buddy settings**.

---

## Acceptance Criteria

### AC-21.3.1: Components Moved to Admin Directory
**Given** admin components exist at `src/components/ai-buddy/admin/`
**When** the migration is complete
**Then** agency-wide components are at `src/components/admin/`
**And** AI Buddy specific components remain at `src/components/ai-buddy/admin/`

### AC-21.3.2: Hooks Moved to Admin Directory
**Given** admin hooks exist at `src/hooks/ai-buddy/`
**When** the migration is complete
**Then** agency-wide hooks are at `src/hooks/admin/`
**And** AI Buddy specific hooks remain at `src/hooks/ai-buddy/`

### AC-21.3.3: Admin Tab is Top-Level in Settings
**Given** admin functionality was a sub-tab under AI Buddy
**When** the migration is complete
**Then** Settings page has a top-level "Admin" tab
**And** Admin tab is only visible to users with admin permissions
**And** Admin tab has sub-tabs: Users, Usage, Audit, Subscription

### AC-21.3.4: AI Buddy Tab Shows Preferences Only
**Given** AI Buddy tab had both Preferences and Admin sub-tabs
**When** the migration is complete
**Then** AI Buddy tab only shows user preferences
**And** no Admin sub-tab exists under AI Buddy

### AC-21.3.5: All Imports Updated
**Given** files imported from old component/hook locations
**When** the migration is complete
**Then** all imports reference new paths
**And** build succeeds with no errors

### AC-21.3.6: Tests Updated
**Given** tests exist for admin components and hooks
**When** the migration is complete
**Then** test files are moved to new locations
**And** all tests pass

---

## Implementation Details

### Tasks / Subtasks

- [ ] Task 1: Create `src/components/admin/` directory structure
- [ ] Task 2: Move agency-wide components to `src/components/admin/`
- [ ] Task 3: Create `src/hooks/admin/` directory with index.ts
- [ ] Task 4: Move agency-wide hooks to `src/hooks/admin/`
- [ ] Task 5: Create `src/lib/admin/` for shared utilities (audit-logger, errors)
- [ ] Task 6: Create `src/components/settings/admin-tab.tsx` - new top-level admin tab
- [ ] Task 7: Update `src/app/(dashboard)/settings/page.tsx` - add Admin tab
- [ ] Task 8: Update `src/components/settings/ai-buddy-preferences-tab.tsx` - remove admin
- [ ] Task 9: Update all imports across codebase
- [ ] Task 10: Move test files to new locations
- [ ] Task 11: Update test imports
- [ ] Task 12: Run all tests, fix any failures

### Technical Summary

This is the largest story - moving files and updating the Settings UI. Key changes:

1. **Move components**: `src/components/ai-buddy/admin/{agency-wide}` → `src/components/admin/`
2. **Move hooks**: `src/hooks/ai-buddy/use-{admin}.ts` → `src/hooks/admin/`
3. **Move lib**: `src/lib/ai-buddy/{admin}` → `src/lib/admin/`
4. **Update Settings**: Add top-level Admin tab, simplify AI Buddy tab

### Project Structure Notes

- **Components to move:**
  - `user-management-panel.tsx`, `user-table.tsx`, `invite-user-dialog.tsx`, `role-change-dialog.tsx`, `remove-user-dialog.tsx`
  - `analytics/` folder (entire)
  - `audit-log/` folder (entire)
  - `owner/` folder (entire)

- **Components to keep at ai-buddy/admin:**
  - `guardrail-admin-panel.tsx`, `guardrail-*.tsx`
  - `restricted-topic-*.tsx`
  - `onboarding-*.tsx`
  - `ai-disclosure-editor.tsx`
  - `date-range-filter.tsx` (used by guardrails)

- **Hooks to move:**
  - `use-user-management.ts`
  - `use-usage-analytics.ts`
  - `use-audit-logs.ts`
  - `use-owner-settings.ts`

- **Lib files to move:**
  - `src/lib/ai-buddy/audit-logger.ts` → `src/lib/admin/audit-logger.ts`
  - Create `src/lib/admin/errors.ts` with agency-wide error codes

- **Expected test locations:**
  - `__tests__/components/admin/`
  - `__tests__/hooks/admin/`
  - `__tests__/e2e/admin/`

- **Prerequisites:** Story 21.2 (API routes moved)

### Key Code References

- `src/app/(dashboard)/settings/page.tsx` - Current Settings structure
- `src/components/settings/ai-buddy-preferences-tab.tsx` - Current AI Buddy tab
- `src/hooks/ai-buddy/index.ts` - Hook exports pattern

---

## Context References

**Tech-Spec:** [../tech-spec/index.md](../tech-spec/index.md) - Primary context document

**New Settings Structure:**
```
Settings
├── Account (existing)
├── Admin (NEW - top-level, admin-only)
│   ├── Users
│   ├── Usage Analytics
│   ├── Audit Log
│   └── Subscription
├── AI Buddy (preferences only)
└── Branding (existing)
```

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->
