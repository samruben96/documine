# Story 18.4: Admin Onboarding Status

Status: done

## Story

As an agency admin,
I want to view the AI Buddy onboarding completion status for all users in my agency,
so that I can monitor adoption and identify users who may need assistance getting started.

## Acceptance Criteria

### AC-18.4.1: Admin Panel Section
Given I am an admin,
When I open the AI Buddy settings tab in Settings,
Then I see an "Onboarding Status" section at the bottom of the page.

### AC-18.4.2: User List Display
Given I view the Onboarding Status section,
When users exist in my agency,
Then I see a table showing each user's onboarding completion status.

### AC-18.4.3: User Row Information
Given I view the user list,
When I look at a user row,
Then I see: Name, Email, Onboarding Status (Completed/Skipped/Not Started), Completion Date.

### AC-18.4.4: Filter by Status
Given I view the list,
When I click a status filter button,
Then I can filter to see only users with that specific status (e.g., "Not Started").

### AC-18.4.5: Non-Admin Access Control
Given I do NOT have admin permissions,
When I view the AI Buddy settings tab,
Then I do not see the Onboarding Status section.

## Tasks / Subtasks

- [x] **Task 1: Create OnboardingStatusEntry Type** (AC: 18.4.2, 18.4.3)
  - [x] Add `OnboardingStatusEntry` interface to `src/types/ai-buddy.ts`
  - [x] Include fields: userId, email, fullName, onboardingCompleted, onboardingCompletedAt, onboardingSkipped
  - [x] Export type from module

- [x] **Task 2: Create Admin Onboarding Status API Endpoint** (AC: 18.4.2, 18.4.5)
  - [x] Create `src/app/api/ai-buddy/admin/onboarding-status/route.ts`
  - [x] Implement GET endpoint that returns `OnboardingStatusEntry[]`
  - [x] Use `requireAdminAuth()` from `@/lib/auth/admin` for permission check
  - [x] Query users table for agency members with `ai_buddy_preferences` JSONB
  - [x] Extract onboarding status fields from each user's preferences
  - [x] Return 403 for non-admin users

- [x] **Task 3: Create useOnboardingStatus Hook** (AC: 18.4.2, 18.4.4)
  - [x] Create `src/hooks/ai-buddy/use-onboarding-status.ts`
  - [x] Implement hook with `{ users, isLoading, error, filterByStatus }` return
  - [x] Fetch from `/api/ai-buddy/admin/onboarding-status`
  - [x] Add `filterByStatus` function to filter users by status locally
  - [x] Handle error states gracefully

- [x] **Task 4: Create OnboardingStatusTable Component** (AC: 18.4.2, 18.4.3, 18.4.4)
  - [x] Create `src/components/ai-buddy/admin/onboarding-status-table.tsx`
  - [x] Use shadcn/ui Table component for consistent styling
  - [x] Render columns: Name, Email, Status (badge), Completion Date
  - [x] Add status filter buttons above table (All, Completed, Skipped, Not Started)
  - [x] Add loading skeleton state
  - [x] Add empty state for no users or filtered results
  - [x] Add data-testid attributes for testing

- [x] **Task 5: Create OnboardingStatusSection Component** (AC: 18.4.1, 18.4.5)
  - [x] Create `src/components/ai-buddy/admin/onboarding-status-section.tsx`
  - [x] Wrap OnboardingStatusTable in a Card with header
  - [x] Accept `isAdmin` prop for conditional rendering
  - [x] Only render section if `isAdmin === true`
  - [x] Add section title and description

- [x] **Task 6: Integrate into AiBuddyPreferencesTab** (AC: 18.4.1, 18.4.5)
  - [x] Update `src/components/settings/ai-buddy-preferences-tab.tsx`
  - [x] Add `isAdmin` prop to component
  - [x] Conditionally render OnboardingStatusSection at bottom
  - [x] Update Settings page to pass `isAdmin` to AiBuddyPreferencesTab

- [x] **Task 7: Create Status Badge Component** (AC: 18.4.3)
  - [x] Create `src/components/ai-buddy/admin/onboarding-status-badge.tsx`
  - [x] Render different badge variants: green (Completed), yellow (Skipped), gray (Not Started)
  - [x] Use existing Badge component from shadcn/ui

- [x] **Task 8: Unit Tests - API Route** (AC: 18.4.2, 18.4.5)
  - [x] Test GET returns user list for admin
  - [x] Test 403 response for non-admin
  - [x] Test 401 response for unauthenticated
  - [x] Test correct status extraction from preferences JSONB

- [x] **Task 9: Unit Tests - Hook** (AC: 18.4.2, 18.4.4)
  - [x] Test successful data fetching
  - [x] Test error handling
  - [x] Test filterByStatus function for each status
  - [x] Test loading state

- [x] **Task 10: Unit Tests - Components** (AC: 18.4.1, 18.4.3, 18.4.4, 18.4.5)
  - [x] Test OnboardingStatusTable renders user rows correctly
  - [x] Test status badge variants
  - [x] Test filter button functionality
  - [x] Test OnboardingStatusSection renders only for admin
  - [x] Test AiBuddyPreferencesTab shows/hides section based on isAdmin

- [x] **Task 11: E2E Tests** (AC: All)
  - [x] Test admin can see onboarding status section
  - [x] Test non-admin cannot see onboarding status section
  - [x] Test status filter buttons work correctly
  - [x] Test user information displays correctly

## Dev Notes

### Existing Infrastructure to Leverage

| Component | Location | Usage |
|-----------|----------|-------|
| `requireAdminAuth()` | `src/lib/auth/admin.ts` | Permission check for API route |
| `isAdmin` check | `src/app/(dashboard)/settings/page.tsx` | Pattern for conditional admin UI |
| `AiBuddyPreferencesTab` | `src/components/settings/ai-buddy-preferences-tab.tsx` | Component to extend |
| `usePreferences` pattern | `src/hooks/ai-buddy/use-preferences.ts` | Pattern for new hook |
| `ai_buddy_preferences` | `users.ai_buddy_preferences` JSONB | Source of onboarding status |
| Table component | `@/components/ui/table` | For user list display |
| Badge component | `@/components/ui/badge` | For status indicators |
| Card component | `@/components/ui/card` | For section container |

### API Response Format

```typescript
// GET /api/ai-buddy/admin/onboarding-status
// Response:
{
  data: {
    users: OnboardingStatusEntry[]
  },
  error: null
}

// OnboardingStatusEntry:
{
  userId: string;
  email: string;
  fullName: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  onboardingSkipped: boolean;
}
```

### Status Badge Variants

| Status | Badge Variant | Color | Text |
|--------|---------------|-------|------|
| Completed | `default` (green) | bg-green-100 text-green-800 | "Completed" |
| Skipped | `secondary` (yellow) | bg-yellow-100 text-yellow-800 | "Skipped" |
| Not Started | `outline` (gray) | bg-gray-100 text-gray-600 | "Not Started" |

### Status Derivation Logic

```typescript
function deriveStatus(preferences: UserPreferences | null): 'completed' | 'skipped' | 'not_started' {
  if (!preferences) return 'not_started';
  if (preferences.onboardingCompleted) return 'completed';
  if (preferences.onboardingSkipped) return 'skipped';
  return 'not_started';
}
```

### Project Structure Notes

- Admin components go in `src/components/ai-buddy/admin/`
- Follow existing patterns from `src/components/settings/` for settings page integration
- Use the same Card/Table styling patterns from UsageTab and TeamTab
- Admin-only sections use conditional rendering based on `isAdmin` prop

### Architecture Patterns to Follow

1. **Permission Check Pattern**: Use `requireAdminAuth()` from `@/lib/auth/admin.ts`
2. **Conditional Admin UI**: Pass `isAdmin` from server component down to client
3. **Hook Pattern**: Follow `usePreferences` pattern for data fetching
4. **Component Composition**: OnboardingStatusSection → OnboardingStatusTable → rows

### Performance Requirements

| Metric | Target |
|--------|--------|
| API response | < 500ms |
| Table rendering | < 200ms (< 100 users expected) |
| Filter application | Instant (client-side) |

### Learnings from Previous Story

**From Story 18.3 (Preference-Aware AI Responses) - Status: done**

- **usePreferences hook**: Complete implementation pattern to follow at `src/hooks/ai-buddy/use-preferences.ts`
- **Prompt builder pattern**: Extended successfully - shows how to add new preference-related functionality
- **Test patterns**: 70 unit tests + E2E tests - follow similar coverage approach
- **Service client pattern**: Used for API updates when RLS issues arise
- **Graceful degradation**: Always handle empty/undefined preferences

**Files Created in 18.3:**
- `__tests__/e2e/ai-buddy/preference-aware-responses.spec.ts` - E2E test pattern to follow

**Architecture Notes:**
- Preferences are stored in `users.ai_buddy_preferences` JSONB column
- `onboardingCompleted` and `onboardingSkipped` fields available in preferences
- Admin check pattern established in `src/app/(dashboard)/settings/page.tsx`

[Source: docs/sprint-artifacts/epics/epic-18/stories/18-3-preference-aware-responses/18-3-preference-aware-responses.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/epics/epic-18/tech-spec-epic-18.md#Story-18.4] - Acceptance criteria and API contract
- [Source: docs/features/ai-buddy/prd.md] - FR62 (Admin onboarding visibility)
- [Source: docs/features/ai-buddy/architecture.md#API-Contracts] - Admin endpoint patterns
- [Source: src/lib/auth/admin.ts] - requireAdminAuth helper
- [Source: src/app/(dashboard)/settings/page.tsx] - isAdmin pattern
- [Source: src/components/settings/ai-buddy-preferences-tab.tsx] - Component to extend

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-18/stories/18-4-admin-onboarding-status/18-4-admin-onboarding-status.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 47 unit tests passing
- TypeScript compilation clean

### Completion Notes List

- Implemented admin-only onboarding status panel in AI Buddy Settings tab
- API endpoint uses `requireAdminAuth()` for proper permission checking
- Hook provides client-side filtering for instant filter interactions
- Table shows Name, Email, Status badge, and Completion Date
- Filter buttons: All, Completed, Skipped, Not Started
- Status derived from `ai_buddy_preferences` JSONB column
- Admin sees section via `isAdmin` prop passed from server component
- Non-admin users cannot see the section (conditional render)

### File List

**Types:**
- `src/types/ai-buddy.ts` (modified - added OnboardingStatusEntry, OnboardingStatus, deriveOnboardingStatus)

**API:**
- `src/app/api/ai-buddy/admin/onboarding-status/route.ts` (new)

**Hooks:**
- `src/hooks/ai-buddy/use-onboarding-status.ts` (new)
- `src/hooks/ai-buddy/index.ts` (modified - added export)

**Components:**
- `src/components/ai-buddy/admin/onboarding-status-badge.tsx` (new)
- `src/components/ai-buddy/admin/onboarding-status-table.tsx` (new)
- `src/components/ai-buddy/admin/onboarding-status-section.tsx` (new)
- `src/components/ai-buddy/admin/index.ts` (new - barrel export)
- `src/components/settings/ai-buddy-preferences-tab.tsx` (modified - added isAdmin prop and section)
- `src/app/(dashboard)/settings/page.tsx` (modified - pass isAdmin to AiBuddyPreferencesTab)

**Tests:**
- `__tests__/app/api/ai-buddy/admin/onboarding-status/route.test.ts` (new - 7 tests)
- `__tests__/hooks/ai-buddy/use-onboarding-status.test.ts` (new - 10 tests)
- `__tests__/components/ai-buddy/admin/onboarding-status-badge.test.tsx` (new - 4 tests)
- `__tests__/components/ai-buddy/admin/onboarding-status-table.test.tsx` (new - 12 tests)
- `__tests__/components/ai-buddy/admin/onboarding-status-section.test.tsx` (new - 7 tests)
- `__tests__/components/settings/ai-buddy-preferences-tab.test.tsx` (modified - added 3 tests)
- `__tests__/e2e/ai-buddy/admin-onboarding-status.spec.ts` (new - 6 E2E tests)

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-08 | SM Agent | Initial story draft created from tech spec |
| 2025-12-08 | Dev Agent | Implemented all tasks - 47 unit tests passing |
