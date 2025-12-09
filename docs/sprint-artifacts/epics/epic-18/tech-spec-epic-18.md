# Epic Technical Specification: AI Buddy Personalization & Onboarding

Date: 2025-12-08
Author: Sam
Epic ID: 18
Status: Draft

---

## Overview

Epic 18 transforms AI Buddy from a generic assistant into a personalized companion that knows each user's preferences, workflow, and communication style. This epic implements the **Tier 1 (Explicit) Personalization** layer from the PRD - allowing users to set their name, role, lines of business, favorite carriers, and communication style through a streamlined onboarding flow and comprehensive preferences management.

The personalization data directly impacts AI responses through the existing `prompt-builder.ts` infrastructure (from Epic 15.5), which already has scaffolding for injecting user context into system prompts. This epic completes the data collection and storage layer, enabling AI responses that feel tailored to each agent's specific needs.

**Key Value Proposition:** Users who complete onboarding get responses that reference their preferred carriers, use appropriate terminology for their lines of business, and match their communication style - without needing to re-explain context in every conversation.

## Objectives and Scope

### In Scope

- **Onboarding flow** - 3-step welcome modal (<2 min) collecting name/role, lines of business, and favorite carriers
- **Skip & complete later** - Users can skip onboarding and complete preferences anytime
- **Guided first conversation** - Personalized AI greeting with suggestions based on onboarding answers
- **Preferences management UI** - Settings page for viewing/editing all AI Buddy preferences
- **Agency information** - Agency name and licensed states (auto-populated from agency record where possible)
- **Communication style** - Toggle between professional/formal and casual/friendly
- **Preference-aware AI responses** - AI incorporates preferences into response style and suggestions
- **Reset preferences** - One-click reset to defaults
- **Admin onboarding visibility** - Admins can see which users have completed onboarding

### Out of Scope

- **Tier 2 (Behavioral) learning** - Inferring preferences from usage patterns (Growth feature)
- **Tier 3 (Deep) learning** - Learning communication voice, binding patterns (Vision feature)
- **Proactive suggestions** - AI-initiated recommendations based on patterns
- **Per-user guardrail overrides** - Guardrails remain agency-level (Epic 19)
- **Onboarding completion enforcement** - Users can use AI Buddy without completing onboarding

## System Architecture Alignment

### Component Integration

Epic 18 builds on existing AI Buddy infrastructure from Epics 14-17:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Buddy (Epics 14-17)                            │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────────┐    │
│  │ Chat Panel   │  │ Prompt Builder │  │ Preferences API (stub)   │    │
│  │ (Epic 15)    │  │ (Epic 15.5)    │  │ (Epic 14 - to implement) │    │
│  └──────────────┘  └───────┬────────┘  └────────────┬──────────────┘    │
│                            │                         │                   │
│                            ▼                         ▼                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Epic 18: Personalization                      │   │
│  │  • OnboardingFlow component                                       │   │
│  │  • PreferencesForm component                                      │   │
│  │  • usePreferences hook (implement stub)                           │   │
│  │  • Preferences API routes (implement stub)                        │   │
│  │  • ai_buddy_preferences JSONB on users table (exists)            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Existing Infrastructure Reused

| Component | Location | Status |
|-----------|----------|--------|
| `UserPreferences` type | `src/types/ai-buddy.ts` | Exists - lines 91-101 |
| `ai_buddy_preferences` column | `users` table | Exists (JSONB, default `'{}'`) |
| `usePreferences` hook | `src/hooks/ai-buddy/use-preferences.ts` | Stub - needs implementation |
| `preferences` API routes | `src/app/api/ai-buddy/preferences/route.ts` | Stub - needs implementation |
| `buildUserContext()` | `src/lib/ai-buddy/prompt-builder.ts` | Exists - parses preferences |
| `ChipSelect` component | `src/components/ai-buddy/onboarding/chip-select.tsx` | Needs implementation |
| `ProgressSteps` component | `src/components/ai-buddy/onboarding/progress-steps.tsx` | Needs implementation |

**Note:** Database column `ai_buddy_preferences` defaults to empty JSON `'{}'`. Application-level defaults are applied in API routes and hooks.

### Architecture Constraints

- Preferences stored in `users.ai_buddy_preferences` JSONB column (per architecture.md ADR-AIB-003)
- Onboarding flow must complete in < 2 minutes (PRD requirement)
- Preferences injected via prompt-builder, NOT post-processing
- Use existing shadcn/ui components (Dialog, Sheet, Switch, Tabs)

## Detailed Design

### Services and Modules

| Module | Responsibility | Location |
|--------|---------------|----------|
| `OnboardingFlow` | 3-step modal wizard for initial preferences | `src/components/ai-buddy/onboarding/onboarding-flow.tsx` |
| `OnboardingStep` | Individual step container with progress | `src/components/ai-buddy/onboarding/onboarding-step.tsx` |
| `ChipSelect` | Multi-select chip group for LOB/carriers | `src/components/ai-buddy/onboarding/chip-select.tsx` (exists) |
| `ProgressSteps` | Step indicator (1/2/3) | `src/components/ai-buddy/onboarding/progress-steps.tsx` (exists) |
| `PreferencesTab` | Settings tab for AI Buddy preferences | `src/components/settings/ai-buddy-preferences-tab.tsx` |
| `PreferencesForm` | Editable form for all preferences | `src/components/ai-buddy/preferences-form.tsx` |
| `CommunicationStyleToggle` | Professional/Casual toggle | `src/components/ai-buddy/communication-style-toggle.tsx` |
| `usePreferences` | Hook for preferences CRUD | `src/hooks/ai-buddy/use-preferences.ts` (implement stub) |
| `useOnboarding` | Hook for onboarding state/flow | `src/hooks/ai-buddy/use-onboarding.ts` |
| `generatePersonalizedGreeting` | Generate AI greeting from preferences | `src/lib/ai-buddy/personalized-greeting.ts` |

### Data Models and Contracts

**Existing Schema (users table):**

```sql
-- Already exists from Epic 14 migration
ALTER TABLE users ADD COLUMN ai_buddy_preferences jsonb DEFAULT '{
  "lines_of_business": [],
  "favorite_carriers": [],
  "communication_style": "professional",
  "onboarding_completed": false
}';
```

**Extended UserPreferences Type:**

```typescript
// src/types/ai-buddy.ts - extend existing interface
export interface UserPreferences {
  // Identity (FR26)
  displayName?: string;
  role?: 'producer' | 'csr' | 'manager' | 'other';

  // Business context (FR27, FR28)
  linesOfBusiness?: string[];
  favoriteCarriers?: string[];

  // Agency info (FR29) - auto-populated from agency where possible
  agencyName?: string;
  licensedStates?: string[];

  // Communication (FR30)
  communicationStyle?: 'professional' | 'casual';

  // Onboarding status (FR57, FR62)
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  onboardingSkipped?: boolean;
  onboardingSkippedAt?: string;
}

// Predefined options for onboarding
export const LINES_OF_BUSINESS = [
  'Personal Auto',
  'Homeowners',
  'Commercial Auto',
  'Commercial Property',
  'General Liability',
  'Workers Compensation',
  'Professional Liability',
  'Umbrella/Excess',
  'Life Insurance',
  'Health Insurance',
] as const;

export const COMMON_CARRIERS = [
  'Progressive',
  'Travelers',
  'Hartford',
  'Safeco',
  'Liberty Mutual',
  'Nationwide',
  'State Farm',
  'Allstate',
  'USAA',
  'Chubb',
  'CNA',
  'AmTrust',
  'Employers',
  'Markel',
] as const;

export const USER_ROLES = [
  { value: 'producer', label: 'Producer/Agent' },
  { value: 'csr', label: 'Customer Service Rep' },
  { value: 'manager', label: 'Agency Manager' },
  { value: 'other', label: 'Other' },
] as const;
```

**Onboarding State Type:**

```typescript
// src/types/ai-buddy.ts
export interface OnboardingState {
  currentStep: 1 | 2 | 3;
  isOpen: boolean;
  isComplete: boolean;
  data: Partial<UserPreferences>;
}
```

### APIs and Interfaces

**Preferences API (Implement Existing Stubs):**

```typescript
// GET /api/ai-buddy/preferences
// Response: { data: { preferences: UserPreferences }, error: null }

// PATCH /api/ai-buddy/preferences
// Request: Partial<UserPreferences>
// Response: { data: { preferences: UserPreferences }, error: null }

// POST /api/ai-buddy/preferences/reset
// Response: { data: { preferences: UserPreferences }, error: null }
// Resets to defaults (empty arrays, professional style, onboarding not completed)
```

**Implementation:**

```typescript
// src/app/api/ai-buddy/preferences/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_PREFERENCES: UserPreferences = {
  linesOfBusiness: [],
  favoriteCarriers: [],
  communicationStyle: 'professional',
  onboardingCompleted: false,
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('users')
    .select('ai_buddy_preferences, full_name')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...(data.ai_buddy_preferences as UserPreferences || {}),
    displayName: data.full_name || undefined,
  };

  return NextResponse.json({ data: { preferences } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await request.json();

  // Validate updates (basic type checking)
  if (updates.linesOfBusiness && !Array.isArray(updates.linesOfBusiness)) {
    return NextResponse.json({ error: 'Invalid linesOfBusiness' }, { status: 400 });
  }

  // Use service client for update (RLS pattern from Epic 15)
  const serviceClient = createServiceClient();

  // Get current preferences
  const { data: current } = await supabase
    .from('users')
    .select('ai_buddy_preferences')
    .eq('id', user.id)
    .single();

  const merged = {
    ...(current?.ai_buddy_preferences as UserPreferences || {}),
    ...updates,
  };

  const { error } = await serviceClient
    .from('users')
    .update({ ai_buddy_preferences: merged })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { preferences: merged } });
}
```

**Admin Onboarding Status Endpoint:**

```typescript
// GET /api/ai-buddy/admin/onboarding-status
// Response: { data: { users: OnboardingStatusEntry[] } }

export interface OnboardingStatusEntry {
  userId: string;
  email: string;
  fullName: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  onboardingSkipped: boolean;
}
```

### Workflows and Sequencing

**Onboarding Flow (FR57-FR61):**

```
User navigates to AI Buddy for first time
    │
    ▼
┌─────────────────────────────────────┐
│ Check: onboardingCompleted?         │
└─────────────────────────────────────┘
    │               │
    Yes             No
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────────────────────────┐
│ Show AI │   │ Step 1: Welcome + Name/Role     │
│ Buddy   │   │ [Your name] [Role dropdown]     │
│ page    │   │ [Get Started] [Skip for now]    │
└─────────┘   └─────────────────────────────────┘
                    │
                    ▼
              ┌─────────────────────────────────┐
              │ Step 2: Lines of Business       │
              │ [Chip multi-select grid]        │
              │ [Back] [Continue]               │
              └─────────────────────────────────┘
                    │
                    ▼
              ┌─────────────────────────────────┐
              │ Step 3: Favorite Carriers       │
              │ [Chip multi-select grid]        │
              │ [Back] [Start Chatting →]       │
              └─────────────────────────────────┘
                    │
                    ▼
              ┌─────────────────────────────────┐
              │ Save preferences                │
              │ Set onboardingCompleted = true  │
              │ Navigate to AI Buddy chat       │
              │ Show personalized greeting      │
              └─────────────────────────────────┘
```

**Skip Flow:**

```
User clicks "Skip for now" at any step
    │
    ▼
Set onboardingSkipped = true
Set onboardingSkippedAt = now()
Close modal
Show AI Buddy with generic greeting
(User can complete onboarding via Settings later)
```

**Personalized Greeting Generation (FR59-FR60):**

```typescript
// src/lib/ai-buddy/personalized-greeting.ts
export function generatePersonalizedGreeting(preferences: UserPreferences): string {
  const parts: string[] = [];

  // Personalized welcome
  if (preferences.displayName) {
    parts.push(`Hi ${preferences.displayName}! 👋`);
  } else {
    parts.push("Hi there! 👋");
  }

  parts.push("I'm AI Buddy, your personal insurance assistant.");

  // LOB-specific suggestions
  if (preferences.linesOfBusiness?.length) {
    const lob = preferences.linesOfBusiness[0];
    parts.push(`\n\nSince you work with ${lob}, here are some things I can help with:`);
    parts.push(getSuggestionsForLOB(lob));
  } else {
    parts.push("\n\nHere are some things I can help with:");
    parts.push("• Explain policy coverage and exclusions");
    parts.push("• Compare quotes from different carriers");
    parts.push("• Draft client communications");
  }

  parts.push("\n\nWhat would you like to work on today?");

  return parts.join('\n');
}
```

**Preferences Update Flow:**

```
User opens Settings → AI Buddy tab
    │
    ▼
Load current preferences via GET /api/ai-buddy/preferences
    │
    ▼
Display PreferencesForm with current values
    │
    ▼
User edits fields (debounced auto-save OR explicit Save button)
    │
    ▼
PATCH /api/ai-buddy/preferences with changes
    │
    ▼
Optimistic update + toast confirmation
```

## Non-Functional Requirements

### Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| Onboarding modal open | < 200ms | Lazy load only when needed |
| Step transition | < 100ms | Client-side state, no API calls between steps |
| Save preferences | < 500ms | Single API call at end of flow |
| Load preferences | < 300ms | Cached via React Query, invalidate on update |
| Greeting generation | < 50ms | Client-side string building, no AI call |

### Security

- **Input validation:** Sanitize displayName (XSS prevention), validate role enum
- **Rate limiting:** Inherit existing API rate limits (100 req/min)
- **RLS policies:** Users can only read/update their own preferences
- **No sensitive data:** Preferences contain no PII beyond display name (already in users table)
- **Admin access:** Onboarding status endpoint requires `view_usage_analytics` permission

### Reliability/Availability

- **Graceful degradation:** If preferences fail to load, use defaults (empty arrays, professional style)
- **Offline support:** Onboarding requires connectivity; show error if offline
- **Skip recovery:** If user skips, preferences are minimal but functional
- **Preferences reset:** Reset action is idempotent, can retry on failure

### Observability

- **Logging:** Log onboarding completion/skip events with user_id
- **Metrics:** Track onboarding completion rate, skip rate, time-to-complete
- **Audit:** Preference changes logged to `ai_buddy_audit_logs` (action: 'preferences_updated')
- **Analytics:** Track which LOBs and carriers are most commonly selected

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@tanstack/react-query` | ^5.x | Preferences caching and mutation |
| `shadcn/ui Dialog` | latest | Onboarding modal |
| `shadcn/ui Tabs` | latest | Settings page tabs |
| `shadcn/ui Switch` | latest | Communication style toggle |

### Internal Dependencies

| Component | Location | Usage |
|-----------|----------|-------|
| `buildUserContext()` | `src/lib/ai-buddy/prompt-builder.ts` | Consumes preferences for AI context |
| `useChat` | `src/hooks/ai-buddy/use-chat.ts` | Loads preferences for personalized greeting |
| `AiBuddyLayout` | `src/app/(dashboard)/ai-buddy/layout.tsx` | Triggers onboarding check |
| Settings page | `src/app/(dashboard)/settings/page.tsx` | Add AI Buddy tab |
| `users` table | Supabase | `ai_buddy_preferences` JSONB column |

### Database Dependencies

- **Existing tables:** `users`, `agencies`, `ai_buddy_audit_logs`
- **No new tables required:** Preferences stored in JSONB column
- **No migrations needed:** `ai_buddy_preferences` column already exists

## Acceptance Criteria (Authoritative)

**Note:** Stories consolidated from 8 to 4 for implementation efficiency.

### Story 18.1: Onboarding Flow & Guided Start (Merged: 18.1 + 18.2 + 18.7)

*Covers: FR57, FR58, FR59, FR60, FR61*

**AC-18.1.1:** Given I am a new user navigating to AI Buddy for the first time, when the page loads, then a modal wizard opens with Step 1 (Welcome + Name/Role).

**AC-18.1.2:** Given I am on Step 1, when I enter my name and select my role from the dropdown, then I can click "Continue" to proceed to Step 2.

**AC-18.1.3:** Given I am on Step 2 (Lines of Business), when I see the chip selection grid, then I can select multiple lines of business (at least one required to continue).

**AC-18.1.4:** Given I am on Step 3 (Favorite Carriers), when I select my preferred carriers, then I can click "Start Chatting" to complete onboarding.

**AC-18.1.5:** Given I complete Step 3, when onboarding saves, then my preferences are persisted and `onboardingCompleted` is set to true.

**AC-18.1.6:** Given I complete onboarding, when the chat loads, then I see a personalized greeting that references my name and selected lines of business.

**AC-18.1.7:** Given I see suggestions in the greeting, when I read them, then they are relevant to my selected lines of business (e.g., "Explain personal auto coverage limits" for Personal Auto).

**AC-18.1.8:** Given I am on any onboarding step, when I click "Skip for now", then the modal closes, `onboardingSkipped` is set to true, and I see AI Buddy with a generic greeting.

**AC-18.1.9:** Given I skipped onboarding, when I return to AI Buddy later, then I do NOT see the onboarding modal again (unless I reset preferences).

**AC-18.1.10:** Given I am on Step 2 or 3, when I click "Back", then I return to the previous step with my selections preserved.

**AC-18.1.11:** Given the entire onboarding flow, when I time my completion, then it takes less than 2 minutes.

### Story 18.2: Preferences Management (Merged: 18.3 + 18.4 + 18.6)

*Covers: FR26, FR27, FR28, FR29, FR30, FR31, FR32*

**AC-18.2.1:** Given I open Settings, when I see the tabs, then there is an "AI Buddy" tab for managing preferences.

**AC-18.2.2:** Given I open the AI Buddy preferences tab, when the form loads, then I see my current preferences (display name, role, LOB, carriers, style).

**AC-18.2.3:** Given I view the preferences form, when I see the Identity section, then I can edit my display name and role.

**AC-18.2.4:** Given I view the preferences form, when I see the Lines of Business section, then I can add/remove lines using a chip-based multi-select.

**AC-18.2.5:** Given I view the preferences form, when I see the Favorite Carriers section, then I can add/remove carriers using a chip-based multi-select.

**AC-18.2.6:** Given I view the preferences form, when I see the Agency Information section, then I see agency name (read-only, from agency record) and can add licensed states.

**AC-18.2.7:** Given I view the preferences form, when I see the Communication Style section, then I see a toggle between "Professional" and "Casual".

**AC-18.2.8:** Given I make changes to any preference, when I click "Save Changes", then changes are saved and I see a success toast.

**AC-18.2.9:** Given I am viewing my preferences, when I click "Reset to Defaults", then a confirmation dialog appears.

**AC-18.2.10:** Given I confirm the reset, when the action completes, then my preferences are reset to defaults (empty arrays, professional style).

**AC-18.2.11:** Given I reset preferences, when I return to AI Buddy, then I see the onboarding modal again (since `onboardingCompleted` is reset).

**AC-18.2.12:** Given I have updated my preferences, when I return to AI Buddy, then the AI's behavior reflects my updated preferences (e.g., different communication style).

### Story 18.3: Preference-Aware AI Responses

*Covers: FR31 (AI incorporation)*

**AC-18.3.1:** Given I have set my preferred carriers (e.g., Progressive, Travelers), when I ask "Which carrier should I use?", then the AI references my preferred carriers in its response.

**AC-18.3.2:** Given I have set my lines of business (e.g., Commercial Property), when I ask a general question, then the AI contextualizes examples to my LOB where relevant.

**AC-18.3.3:** Given I have set communication style to "Casual", when the AI responds, then it uses a more conversational tone (e.g., "Hey!", contractions, less formal language).

**AC-18.3.4:** Given I have set communication style to "Professional", when the AI responds, then it uses a formal tone (e.g., "Good day", no contractions, structured responses).

**AC-18.3.5:** Given I have set my agency name and licensed states, when I ask about state-specific regulations, then the AI prioritizes information for my licensed states.

**AC-18.3.6:** Given my preferences are loaded, when I check the system prompt (dev tools/logging), then I can verify my preferences are injected into the prompt context.

**AC-18.3.7:** Given I have no preferences set (new user, skipped onboarding), when I chat, then the AI uses professional style and generic examples (graceful degradation).

### Story 18.4: Admin Onboarding Status

*Covers: FR62*

**AC-18.4.1:** Given I am an admin, when I open the AI Buddy admin panel (Settings → AI Buddy → Admin), then I see an "Onboarding Status" section.

**AC-18.4.2:** Given I view the Onboarding Status section, when users exist in my agency, then I see a list showing each user's onboarding completion status.

**AC-18.4.3:** Given I view the user list, when I look at a user row, then I see: Name, Email, Onboarding Status (Completed/Skipped/Not Started), Completion Date.

**AC-18.4.4:** Given I view the list, when I filter by status, then I can see only users who have "Not Started" onboarding.

**AC-18.4.5:** Given I do NOT have admin permissions, when I try to access the admin panel, then I do not see the Onboarding Status section.

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
|----|--------------|---------------|-----------|
| AC-18.1.1 | Workflows | `OnboardingFlow`, `useOnboarding` | Navigate to AI Buddy as new user, verify modal opens |
| AC-18.1.2 | Data Models | `OnboardingStep`, name input, role dropdown | Enter name, select role, click Continue |
| AC-18.1.3 | Services | `ChipSelect`, LOB options | Select multiple LOBs, verify Continue enabled |
| AC-18.1.4 | Services | `ChipSelect`, carriers | Select carriers, click Start Chatting |
| AC-18.1.5 | APIs | PATCH preferences, `onboardingCompleted` | Verify API call with correct payload |
| AC-18.1.6 | Workflows | `generatePersonalizedGreeting` | Complete onboarding, verify greeting text |
| AC-18.1.7 | Workflows | `getSuggestionsForLOB` | Select "Personal Auto", verify relevant suggestions |
| AC-18.1.8 | Workflows | Skip flow, `onboardingSkipped` | Click Skip, verify modal closes, generic greeting |
| AC-18.1.9 | Data Models | `onboardingSkipped` check | Skip, refresh, verify no modal |
| AC-18.1.10 | Services | Back button state preservation | Select on Step 2, go back, return, verify preserved |
| AC-18.1.11 | Performance | Full flow timing | Time complete onboarding < 2 min |
| AC-18.2.1 | Services | `PreferencesTab`, Settings page | Open Settings, verify AI Buddy tab exists |
| AC-18.2.2 | APIs | GET preferences | Load tab, verify form populated |
| AC-18.2.3 | Services | Identity section form | Edit name/role, verify field updates |
| AC-18.2.4 | Services | `ChipSelect` for LOB | Add/remove LOBs via chips |
| AC-18.2.5 | Services | `ChipSelect` for carriers | Add/remove carriers via chips |
| AC-18.2.6 | Data Models | Agency info (read-only) | Verify agency name displayed, states editable |
| AC-18.2.7 | Services | `CommunicationStyleToggle` | Toggle between Professional/Casual |
| AC-18.2.8 | APIs | PATCH preferences | Make changes, save, verify toast |
| AC-18.2.9 | Services | Reset confirmation dialog | Click Reset, verify dialog appears |
| AC-18.2.10 | APIs | POST preferences/reset | Confirm reset, verify defaults applied |
| AC-18.2.11 | Workflows | Onboarding re-trigger | Reset, go to AI Buddy, verify modal appears |
| AC-18.2.12 | Integration | Full flow | Update style, verify AI tone changes |
| AC-18.3.1 | APIs - Chat | `buildUserContext`, prompt | Set carriers, ask question, check response |
| AC-18.3.2 | APIs - Chat | LOB context in prompt | Set LOB, ask general question |
| AC-18.3.3 | Integration | Casual style | Set casual, verify AI tone |
| AC-18.3.4 | Integration | Professional style | Set professional, verify AI tone |
| AC-18.3.5 | APIs - Chat | State context | Set states, ask state question |
| AC-18.3.6 | Observability | Prompt logging | Dev tools verify preferences in prompt |
| AC-18.3.7 | Reliability | Graceful degradation | No preferences, verify default behavior |
| AC-18.4.1 | Services | Admin panel section | Admin opens Settings, verify section visible |
| AC-18.4.2 | APIs | GET admin/onboarding-status | Verify user list returned |
| AC-18.4.3 | Services | User row display | Verify columns: Name, Email, Status, Date |
| AC-18.4.4 | Services | Status filter | Filter by "Not Started", verify results |
| AC-18.4.5 | Security | Permission check | Non-admin, verify section hidden |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Users skip onboarding frequently** | Medium | Make onboarding value clear, show "complete setup" reminder in Settings |
| **Preferences not persisting** | High | Optimistic updates + server confirmation, error toasts |
| **AI ignoring preferences** | Medium | Verify prompt-builder integration with unit tests |
| **Onboarding modal UX friction** | Medium | Keep to 3 steps, allow skip, remember progress if interrupted |

### Assumptions

- `ai_buddy_preferences` JSONB column already exists on users table (from Epic 14 migration)
- `buildUserContext()` function in prompt-builder already parses UserPreferences type
- Users have internet connectivity when completing onboarding
- < 100 users per agency (for admin onboarding status list)

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Should we send onboarding completion email? | PM | **Decision: No** - not MVP |
| Should admins be able to trigger onboarding for users? | PM | **Decision: No** - users self-serve |
| Should we collect "years of experience" in onboarding? | PM | **Decision: No** - keep it minimal |
| Show onboarding progress if user closes mid-flow? | Dev | **Decision: Yes** - store step in localStorage |

## Test Strategy Summary

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| `OnboardingFlow` | Step transitions, skip behavior, data collection |
| `ChipSelect` | Multi-select, min/max selection, custom chips |
| `PreferencesForm` | Form validation, field rendering, submit handling |
| `usePreferences` | CRUD operations, optimistic updates, error handling |
| `useOnboarding` | State management, step navigation, persistence |
| `generatePersonalizedGreeting` | Greeting text based on various preference combinations |
| `buildUserContext` | Preference parsing for prompt (already exists) |

### Integration Tests

| Flow | Test Focus |
|------|------------|
| Onboarding complete → Preferences saved | End-to-end data persistence |
| Preferences update → AI response change | Verify AI uses updated preferences |
| Reset → Onboarding re-triggered | Full reset flow |
| Admin status → User list accuracy | Permission check + data accuracy |

### E2E Tests

| Scenario | Steps |
|----------|-------|
| New user onboarding | Navigate to AI Buddy → Complete 3 steps → Verify personalized greeting |
| Skip onboarding | Navigate → Click Skip → Verify generic greeting → Verify no modal on return |
| Preferences update | Settings → AI Buddy tab → Edit preferences → Save → Verify in AI Buddy |
| Reset preferences | Settings → Reset → Confirm → Verify onboarding modal appears |
| Admin view | Admin login → Settings → Verify onboarding status table |

### Accessibility Tests

- Onboarding modal keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements for step changes
- Focus management when modal opens/closes
- Color contrast on chip selection states

---

## Story Summary

| Story | Title | Points | FRs | Original Stories |
|-------|-------|--------|-----|------------------|
| 18.1 | Onboarding Flow & Guided Start | 5 | FR57-61 | 18.1, 18.2, 18.7 |
| 18.2 | Preferences Management | 5 | FR26-32 | 18.3, 18.4, 18.6 |
| 18.3 | Preference-Aware AI Responses | 3 | FR31 | 18.5 |
| 18.4 | Admin Onboarding Status | 2 | FR62 | 18.8 |

**Total Points:** 15 (reduced from ~20 by merging)
**Total FRs Covered:** 13 (FR26-32, FR57-62)
**Stories Consolidated:** 8 → 4
