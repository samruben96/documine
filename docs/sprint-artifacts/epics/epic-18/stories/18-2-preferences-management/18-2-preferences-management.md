# Story 18.2: Preferences Management

Status: done

## Story

As an AI Buddy user,
I want to view and edit my preferences through a dedicated settings tab,
so that I can update my display name, role, lines of business, favorite carriers, communication style, and agency information at any time.

## Acceptance Criteria

### AC-18.2.1: AI Buddy Settings Tab
Given I open Settings,
When I see the tabs,
Then there is an "AI Buddy" tab for managing preferences.

### AC-18.2.2: Preferences Form Load
Given I open the AI Buddy preferences tab,
When the form loads,
Then I see my current preferences (display name, role, LOB, carriers, style).

### AC-18.2.3: Identity Section
Given I view the preferences form,
When I see the Identity section,
Then I can edit my display name and role.

### AC-18.2.4: Lines of Business Section
Given I view the preferences form,
When I see the Lines of Business section,
Then I can add/remove lines using a chip-based multi-select.

### AC-18.2.5: Favorite Carriers Section
Given I view the preferences form,
When I see the Favorite Carriers section,
Then I can add/remove carriers using a chip-based multi-select.

### AC-18.2.6: Agency Information Section
Given I view the preferences form,
When I see the Agency Information section,
Then I see agency name (read-only, from agency record) and can add licensed states.

### AC-18.2.7: Communication Style Toggle
Given I view the preferences form,
When I see the Communication Style section,
Then I see a toggle between "Professional" and "Casual".

### AC-18.2.8: Save Changes
Given I make changes to any preference,
When I click "Save Changes",
Then changes are saved and I see a success toast.

### AC-18.2.9: Reset Confirmation Dialog
Given I am viewing my preferences,
When I click "Reset to Defaults",
Then a confirmation dialog appears.

### AC-18.2.10: Reset Action
Given I confirm the reset,
When the action completes,
Then my preferences are reset to defaults (empty arrays, professional style).

### AC-18.2.11: Onboarding Re-Trigger After Reset
Given I reset preferences,
When I return to AI Buddy,
Then I see the onboarding modal again (since `onboardingCompleted` is reset).

### AC-18.2.12: Preference Update Reflection
Given I have updated my preferences,
When I return to AI Buddy,
Then the AI's behavior reflects my updated preferences (e.g., different communication style).

## Tasks / Subtasks

- [ ] **Task 1: Create PreferencesTab Component** (AC: 18.2.1, 18.2.2)
  - [ ] Create `src/components/settings/ai-buddy-preferences-tab.tsx`
  - [ ] Add tab to Settings page tabs array
  - [ ] Fetch preferences on mount via usePreferences hook
  - [ ] Pass preferences to PreferencesForm component
  - [ ] Handle loading state with skeleton UI

- [ ] **Task 2: Create PreferencesForm Component** (AC: 18.2.3-18.2.7)
  - [ ] Create `src/components/ai-buddy/preferences-form.tsx`
  - [ ] Props: preferences, onSave, isLoading
  - [ ] Use React Hook Form for form state management
  - [ ] Implement section-based layout with Card components

- [ ] **Task 3: Identity Section Implementation** (AC: 18.2.3)
  - [ ] Display name input field with validation (max 50 chars)
  - [ ] Role dropdown using existing USER_ROLES constant
  - [ ] Labels and placeholders matching onboarding flow

- [ ] **Task 4: Lines of Business Section** (AC: 18.2.4)
  - [ ] Reuse ChipSelect component from onboarding
  - [ ] Import LINES_OF_BUSINESS constant
  - [ ] No minimum selection required (unlike onboarding)
  - [ ] Visual feedback for selected items

- [ ] **Task 5: Favorite Carriers Section** (AC: 18.2.5)
  - [ ] Reuse ChipSelect component from onboarding
  - [ ] Import COMMON_CARRIERS constant
  - [ ] No minimum selection required
  - [ ] Allow custom carrier entry (input + Add button)

- [ ] **Task 6: Agency Information Section** (AC: 18.2.6)
  - [ ] Fetch agency name from agency record via useAgencyId hook
  - [ ] Display agency name as read-only field
  - [ ] Create LicensedStatesSelect component for US states
  - [ ] Support multi-select for licensed states

- [ ] **Task 7: Communication Style Toggle** (AC: 18.2.7)
  - [ ] Create `src/components/ai-buddy/communication-style-toggle.tsx`
  - [ ] Use shadcn Switch component
  - [ ] Labels: "Professional" / "Casual"
  - [ ] Description text for each style option

- [ ] **Task 8: Save Functionality** (AC: 18.2.8)
  - [ ] "Save Changes" button at bottom of form
  - [ ] Disable button when no changes detected (dirty state)
  - [ ] Call PATCH /api/ai-buddy/preferences on save
  - [ ] Show success toast via sonner
  - [ ] Handle error state with error toast

- [ ] **Task 9: Reset Preferences API** (AC: 18.2.9, 18.2.10, 18.2.11)
  - [ ] Add POST /api/ai-buddy/preferences/reset endpoint
  - [ ] Reset to DEFAULT_PREFERENCES constant
  - [ ] Set onboardingCompleted = false
  - [ ] Set onboardingSkipped = false
  - [ ] Return updated preferences object

- [ ] **Task 10: Reset Confirmation Dialog** (AC: 18.2.9)
  - [ ] Create confirmation dialog using shadcn AlertDialog
  - [ ] Title: "Reset AI Buddy Preferences?"
  - [ ] Description: "This will clear all your preferences and show the onboarding flow again."
  - [ ] Actions: "Cancel" / "Reset Preferences"

- [ ] **Task 11: Reset Flow Integration** (AC: 18.2.10, 18.2.11)
  - [ ] Call reset API on confirm
  - [ ] Show success toast: "Preferences reset successfully"
  - [ ] Reload preferences form with defaults
  - [ ] Verify onboarding modal appears on next AI Buddy visit

- [ ] **Task 12: Add Settings Tab Integration** (AC: 18.2.1)
  - [ ] Update `src/app/(dashboard)/settings/page.tsx`
  - [ ] Import AiBuddyPreferencesTab component
  - [ ] Add "AI Buddy" tab with FileUser icon
  - [ ] Position after existing tabs

- [ ] **Task 13: Unit Tests** (AC: All)
  - [ ] Test PreferencesTab mounting and loading
  - [ ] Test PreferencesForm field rendering
  - [ ] Test ChipSelect interactions in settings context
  - [ ] Test CommunicationStyleToggle state changes
  - [ ] Test Save button disabled/enabled states
  - [ ] Test reset confirmation dialog flow
  - [ ] Test API route handlers (reset endpoint)

- [ ] **Task 14: E2E Tests** (AC: All)
  - [ ] Test navigating to Settings > AI Buddy tab
  - [ ] Test editing each preference field
  - [ ] Test Save Changes flow with success toast
  - [ ] Test Reset flow with confirmation dialog
  - [ ] Test that onboarding appears after reset
  - [ ] Test preference updates reflect in AI Buddy

## Dev Notes

### Components to Create

| Component | Location | Purpose |
|-----------|----------|---------|
| `AiBuddyPreferencesTab` | `src/components/settings/ai-buddy-preferences-tab.tsx` | Settings page tab container |
| `PreferencesForm` | `src/components/ai-buddy/preferences-form.tsx` | Full preferences edit form |
| `CommunicationStyleToggle` | `src/components/ai-buddy/communication-style-toggle.tsx` | Professional/Casual switch |
| `LicensedStatesSelect` | `src/components/ai-buddy/licensed-states-select.tsx` | US states multi-select |

### Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `ChipSelect` | `src/components/ai-buddy/onboarding/chip-select.tsx` | LOB and Carriers selection |
| `usePreferences` | `src/hooks/ai-buddy/use-preferences.ts` | CRUD operations (already implemented in 18.1) |
| `useAgencyId` | `src/hooks/use-agency-id.ts` | Get current agency for name display |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ai-buddy/preferences` | Fetch current preferences (exists) |
| PATCH | `/api/ai-buddy/preferences` | Update preferences (exists) |
| POST | `/api/ai-buddy/preferences/reset` | Reset to defaults (NEW) |

### Default Preferences (for reset)

```typescript
const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: undefined,
  role: undefined,
  linesOfBusiness: [],
  favoriteCarriers: [],
  agencyName: undefined,
  licensedStates: [],
  communicationStyle: 'professional',
  onboardingCompleted: false,
  onboardingSkipped: false,
};
```

### US States Constant

```typescript
// src/types/ai-buddy.ts - add to existing file
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  // ... all 50 states + DC
  { value: 'WY', label: 'Wyoming' },
] as const;
```

### Form Layout

```
┌────────────────────────────────────────────────────┐
│ AI Buddy Preferences                               │
├────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐   │
│ │ Identity                                      │   │
│ │ [Display Name: _______________]              │   │
│ │ [Role: Select... ▼]                          │   │
│ └──────────────────────────────────────────────┘   │
│                                                    │
│ ┌──────────────────────────────────────────────┐   │
│ │ Lines of Business                             │   │
│ │ [Personal Auto] [Homeowners] [GL] [WC] ...   │   │
│ └──────────────────────────────────────────────┘   │
│                                                    │
│ ┌──────────────────────────────────────────────┐   │
│ │ Favorite Carriers                             │   │
│ │ [Progressive] [Travelers] [Hartford] ...     │   │
│ └──────────────────────────────────────────────┘   │
│                                                    │
│ ┌──────────────────────────────────────────────┐   │
│ │ Agency Information                            │   │
│ │ Agency Name: ABC Insurance Agency (read-only)│   │
│ │ Licensed States: [CA] [TX] [NY] ...          │   │
│ └──────────────────────────────────────────────┘   │
│                                                    │
│ ┌──────────────────────────────────────────────┐   │
│ │ Communication Style                           │   │
│ │ ○ Professional - Formal, structured responses│   │
│ │ ● Casual - Friendly, conversational tone     │   │
│ └──────────────────────────────────────────────┘   │
│                                                    │
│ [Save Changes]                    [Reset to Defaults] │
└────────────────────────────────────────────────────┘
```

### Project Structure Notes

- Settings page already has a tabs structure (`src/app/(dashboard)/settings/page.tsx`)
- Follow existing tab pattern for consistent UI
- Use shadcn Card for section grouping
- Reuse existing toast infrastructure via sonner

### Architecture Patterns to Follow

1. **Verify-Then-Service Pattern**: Used by existing preferences API (from Story 18.1)
2. **Hook Return Pattern**: Follow `UsePreferencesReturn` interface
3. **Component Composition**: Sections as separate Card components within form
4. **Optimistic Updates**: Show changes immediately, revert on error

### Performance Requirements

| Metric | Target |
|--------|--------|
| Tab load | < 300ms |
| Save changes | < 500ms |
| Reset action | < 500ms |
| Form validation | Instant (client-side) |

### Learnings from Previous Story

**From Story 18.1 (Onboarding Flow & Guided Start) - Status: done**

- **API Routes**: `src/app/api/ai-buddy/preferences/route.ts` - Full GET/PATCH implementation available for reuse
- **Hook**: `src/hooks/ai-buddy/use-preferences.ts` - Complete implementation with optimistic updates, reuse directly
- **ChipSelect**: `src/components/ai-buddy/onboarding/chip-select.tsx` - Reusable component with minSelection prop
- **Constants**: `LINES_OF_BUSINESS`, `COMMON_CARRIERS`, `USER_ROLES` available in `src/types/ai-buddy.ts`
- **CSS Variables**: `--sidebar-hover` and `--sidebar-active` for consistent hover states
- **Test Coverage**: 60 unit tests + E2E suite - maintain similar coverage for this story

**Interfaces to Reuse:**
- `UserPreferences` type in `src/types/ai-buddy.ts`
- `UsePreferencesReturn` interface in `src/hooks/ai-buddy/use-preferences.ts`
- Pattern from `ai-buddy-context.tsx` for state management

**Files Created in 18.1:**
- `src/app/api/ai-buddy/preferences/route.ts` - Reuse GET/PATCH
- `src/hooks/ai-buddy/use-preferences.ts` - Reuse hook directly
- `src/components/ai-buddy/onboarding/chip-select.tsx` - Import for form
- `src/types/ai-buddy.ts` - Constants and types ready

[Source: docs/sprint-artifacts/epics/epic-18/stories/18-1-onboarding-flow-guided-start/18-1-onboarding-flow-guided-start.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/epics/epic-18/tech-spec-epic-18.md#Story-18.2]
- [Source: docs/features/ai-buddy/prd.md#Personalization] - FR26-FR32
- [Source: docs/features/ai-buddy/architecture.md#Data-Architecture] - ai_buddy_preferences column
- [Source: docs/sprint-artifacts/epics/epic-18/stories/18-1-onboarding-flow-guided-start/18-1-onboarding-flow-guided-start.md] - Previous story learnings

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-18/stories/18-2-preferences-management/18-2-preferences-management.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All 12 acceptance criteria implemented
- Created 4 new components: AiBuddyPreferencesTab, PreferencesForm, CommunicationStyleToggle, LicensedStatesSelect
- Added POST /api/ai-buddy/preferences/reset endpoint for reset functionality
- Updated usePreferences hook to use dedicated reset API
- Added US_STATES constant to types/ai-buddy.ts
- Integrated AI Buddy tab into Settings page
- 36 unit tests pass (4 test files)
- 19 E2E tests created covering all acceptance criteria
- Build passes without TypeScript errors
- Installed shadcn alert and popover components

**Post-Implementation Refinements (User Feedback):**
- Made LOB and Carriers steps optional in onboarding (no selection required)
- Added "You can always change these in Settings later." hint to onboarding Step 1
- Added "Select All" / "Clear All" button to ChipSelect component
- Enabled showSelectAll on LOB and Carriers steps in onboarding flow
- Updated onboarding test to reflect optional LOB step behavior

### File List

**New Files Created:**
- `src/components/settings/ai-buddy-preferences-tab.tsx` - Settings tab container
- `src/components/ai-buddy/preferences-form.tsx` - Main preferences edit form
- `src/components/ai-buddy/communication-style-toggle.tsx` - Professional/Casual toggle
- `src/components/ai-buddy/licensed-states-select.tsx` - US states multi-select
- `src/app/api/ai-buddy/preferences/reset/route.ts` - Reset preferences API endpoint
- `src/components/ui/alert.tsx` - shadcn Alert component (installed)
- `src/components/ui/popover.tsx` - shadcn Popover component (installed)
- `__tests__/components/settings/ai-buddy-preferences-tab.test.tsx` - Tab tests
- `__tests__/components/ai-buddy/preferences-form.test.tsx` - Form tests
- `__tests__/components/ai-buddy/communication-style-toggle.test.tsx` - Toggle tests
- `__tests__/api/ai-buddy/preferences-reset.test.ts` - API tests
- `__tests__/e2e/ai-buddy/preferences-settings.spec.ts` - E2E tests

**Modified Files:**
- `src/app/(dashboard)/settings/page.tsx` - Added AI Buddy tab
- `src/hooks/ai-buddy/use-preferences.ts` - Updated resetPreferences to use API
- `src/types/ai-buddy.ts` - Added US_STATES constant
- `src/components/ai-buddy/onboarding/chip-select.tsx` - Added showSelectAll prop with Select All/Clear All button
- `src/components/ai-buddy/onboarding/onboarding-flow.tsx` - Made LOB/Carriers optional, added settings hint, enabled showSelectAll
- `__tests__/components/ai-buddy/onboarding/onboarding-flow.test.tsx` - Updated test for optional LOB step

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-08

### Outcome
✅ **APPROVED**

All 12 acceptance criteria are fully implemented with comprehensive test coverage. Code quality is excellent, following established patterns and best practices.

### Summary

Story 18.2 successfully implements a complete AI Buddy Preferences Management system with:
- Settings tab integration with skeleton loading states
- Full preferences form with 5 sections (Identity, LOB, Carriers, Agency, Style)
- Save functionality with dirty state detection and toast notifications
- Reset flow with confirmation dialog and API endpoint
- Post-implementation refinements for optional LOB/Carriers selection and Select All functionality

### Key Findings

**No blocking issues found.**

**LOW Severity:**
- Task checkboxes in story file are not marked complete (`[ ]`) but implementation is verified. Recommend updating checkboxes for documentation accuracy.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-18.2.1 | AI Buddy Settings Tab | ✅ IMPLEMENTED | `settings/page.tsx:125` |
| AC-18.2.2 | Preferences Form Load | ✅ IMPLEMENTED | `ai-buddy-preferences-tab.tsx:32,118-128` |
| AC-18.2.3 | Identity Section | ✅ IMPLEMENTED | `preferences-form.tsx:164-218` |
| AC-18.2.4 | Lines of Business Section | ✅ IMPLEMENTED | `preferences-form.tsx:220-240` |
| AC-18.2.5 | Favorite Carriers Section | ✅ IMPLEMENTED | `preferences-form.tsx:242-319` |
| AC-18.2.6 | Agency Information Section | ✅ IMPLEMENTED | `preferences-form.tsx:321-355` |
| AC-18.2.7 | Communication Style Toggle | ✅ IMPLEMENTED | `preferences-form.tsx:357-376` |
| AC-18.2.8 | Save Changes | ✅ IMPLEMENTED | `preferences-form.tsx:131-148,414-421` |
| AC-18.2.9 | Reset Confirmation Dialog | ✅ IMPLEMENTED | `preferences-form.tsx:380-412` |
| AC-18.2.10 | Reset Action | ✅ IMPLEMENTED | `preferences/reset/route.ts:20-32` |
| AC-18.2.11 | Onboarding Re-Trigger | ✅ IMPLEMENTED | `preferences/reset/route.ts:28-29` |
| AC-18.2.12 | Preference Update Reflection | ✅ IMPLEMENTED | API persistence + hook refetch |

**Summary: 12 of 12 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: PreferencesTab Component | [ ] | ✅ COMPLETE | `ai-buddy-preferences-tab.tsx` |
| Task 2: PreferencesForm Component | [ ] | ✅ COMPLETE | `preferences-form.tsx` |
| Task 3: Identity Section | [ ] | ✅ COMPLETE | Input + Select components |
| Task 4: Lines of Business | [ ] | ✅ COMPLETE | ChipSelect integration |
| Task 5: Favorite Carriers | [ ] | ✅ COMPLETE | ChipSelect + custom input |
| Task 6: Agency Information | [ ] | ✅ COMPLETE | `licensed-states-select.tsx` |
| Task 7: Communication Style | [ ] | ✅ COMPLETE | `communication-style-toggle.tsx` |
| Task 8: Save Functionality | [ ] | ✅ COMPLETE | isDirty + toast |
| Task 9: Reset API | [ ] | ✅ COMPLETE | `preferences/reset/route.ts` |
| Task 10: Reset Dialog | [ ] | ✅ COMPLETE | AlertDialog |
| Task 11: Reset Flow | [ ] | ✅ COMPLETE | API + toast + reload |
| Task 12: Settings Tab | [ ] | ✅ COMPLETE | `settings/page.tsx` |
| Task 13: Unit Tests | [ ] | ✅ COMPLETE | 36+ tests, 4 files |
| Task 14: E2E Tests | [ ] | ✅ COMPLETE | 19 E2E tests |

**Summary: 14 of 14 tasks verified complete, 0 false completions**

### Test Coverage and Gaps

**Unit Tests:** 36+ tests across 4 test files
- `ai-buddy-preferences-tab.test.tsx` - Tab mounting/loading
- `preferences-form.test.tsx` - Form field rendering, save/reset flows
- `communication-style-toggle.test.tsx` - Toggle state changes
- `preferences-reset.test.ts` - API route handlers

**E2E Tests:** 19 tests in `preferences-settings.spec.ts`
- Navigation to AI Buddy tab
- Form field interactions
- Save changes flow
- Reset confirmation dialog

**All 2235 project tests pass.**

### Architectural Alignment

✅ Follows verify-then-service pattern for API routes
✅ Uses React Hook Form with Zod validation
✅ Reuses ChipSelect component from Story 18.1
✅ Integrates with existing Settings page tabs structure
✅ Uses shadcn/ui components (AlertDialog, Select, Switch, etc.)
✅ Proper TypeScript types throughout

### Security Notes

✅ Authentication required for reset API (401 on missing auth)
✅ Service client used only after user verification
✅ No sensitive data exposure in API responses
✅ Proper error handling without leaking internal details

### Best-Practices and References

- [React Hook Form Best Practices](https://react-hook-form.com/advanced-usage)
- [Radix UI AlertDialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Action Items

**Advisory Notes:**
- Note: Consider updating task checkboxes in story file for documentation accuracy (no action required for code)
- Note: Post-implementation refinements (Select All, optional LOB) were well-handled based on user feedback

