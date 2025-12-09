# Epic Technical Specification: AI Buddy Guardrails & Compliance

Date: 2025-12-08
Author: Sam
Epic ID: 19
Status: Draft

---

## Overview

Epic 19 implements admin-controlled guardrails that enforce compliance while remaining invisible to end users. This is a critical E&O protection feature for insurance agencies, allowing principals to define restricted topics, enable compliance rules, and ensure all AI interactions include required disclosures - all without producers ever seeing "blocked" or "restricted" messages.

The "Invisible Guardrails" pattern is a novel UX approach where the AI naturally redirects conversations away from restricted topics using helpful alternatives rather than rejection messages. This maintains a positive user experience while ensuring complete compliance with agency policies and state chatbot disclosure laws.

**Key Value Proposition:** Principals get full control over what AI Buddy can and cannot discuss, with complete audit trails, while producers experience a helpful assistant that never feels restrictive.

**Prerequisites:** Epic 18 (Personalization & Onboarding) is complete - this epic extends the Settings page with admin guardrail controls.

## Objectives and Scope

### In Scope

- **Guardrail Admin UI** - Settings panel for admins to define restricted topics and toggle guardrail rules (FR35-37)
- **Restricted Topics Management** - Add/remove topics that AI will not discuss directly (e.g., "legal advice", "claims filing", "binding authority")
- **Guardrail Rule Toggles** - Enable/disable individual compliance rules (E&O disclaimer, state compliance warnings)
- **Immediate Effect** - Guardrail changes apply instantly to all agency users (no caching)
- **Enforcement Logging** - Audit log entries when guardrails redirect conversations (FR38)
- **Invisible Guardrails** - AI provides helpful redirections without "blocked" language (FR39)
- **AI Disclosure Message** - Configurable chatbot disclosure for state compliance (FR40-41)
- **Redirect Guidance** - Admins can customize how AI redirects each restricted topic

### Out of Scope

- **Carrier Restrictions** - Moved to Quoting feature per Architecture ADR-AIB-005
- **Per-user guardrail overrides** - Guardrails apply agency-wide only
- **Auto-detection of new compliance requirements** - Manual admin configuration only
- **State-specific auto-detection** - Admins manually configure disclosure requirements
- **Guardrail templates/presets** - Growth feature for future epic
- **Real-time guardrail analytics dashboard** - Basic audit log only for MVP

## System Architecture Alignment

### Component Integration

Epic 19 builds on existing AI Buddy infrastructure from Epics 14-18:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Buddy (Epics 14-18)                            │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────────┐    │
│  │ Chat Panel   │  │ Prompt Builder │  │ Settings Page (Epic 18)   │    │
│  │ (Epic 15)    │  │ (Epic 15.5)    │  │ AI Buddy Preferences Tab  │    │
│  └──────────────┘  └───────┬────────┘  └────────────┬──────────────┘    │
│                            │                         │                   │
│                            ▼                         ▼                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Epic 19: Guardrails & Compliance              │   │
│  │  • GuardrailAdminPanel component (new Settings section)          │   │
│  │  • RestrictedTopicsList component                                 │   │
│  │  • GuardrailToggle components                                     │   │
│  │  • AIDisclosureEditor component                                   │   │
│  │  • useGuardrails hook (implement)                                 │   │
│  │  • Guardrails API routes (implement)                              │   │
│  │  • ai_buddy_guardrails table (exists from Epic 14 migration)     │   │
│  │  • Prompt builder guardrail injection (enhance)                   │   │
│  │  • Audit logging for guardrail events                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Existing Infrastructure Reused

| Component | Location | Status |
|-----------|----------|--------|
| `ai_buddy_guardrails` table | Supabase | Exists (Epic 14 migration) |
| `ai_buddy_audit_logs` table | Supabase | Exists (Epic 14 migration) |
| `ai_buddy_permissions` table | Supabase | Exists (Epic 14 migration) |
| `buildSystemPrompt()` | `src/lib/ai-buddy/prompt-builder.ts` | Exists - needs guardrail injection |
| `auditLog()` | `src/lib/ai-buddy/audit-logger.ts` | Exists - needs guardrail event types |
| Settings page | `src/app/(dashboard)/settings/page.tsx` | Exists - add Guardrails admin section |
| `GuardrailToggle` | `src/components/ai-buddy/admin/guardrail-toggle.tsx` | Needs implementation |
| `useGuardrails` hook | `src/hooks/ai-buddy/use-guardrails.ts` | Needs implementation |

### Architecture Constraints

- **No Caching:** Guardrails must be loaded fresh on each chat API call to ensure FR37 "immediate effect"
- **Prompt Injection Only:** Guardrails enforced via system prompt, NOT post-processing (ADR-AIB-002)
- **Invisible Pattern:** AI must NEVER say "I cannot", "blocked", or "restricted" - always helpful redirect
- **Admin-Only Access:** Guardrail configuration requires `configure_guardrails` permission
- **Agency-Scoped:** Guardrails stored per-agency in `ai_buddy_guardrails` table
- **Audit Everything:** All guardrail enforcement events logged to `ai_buddy_audit_logs`

## Detailed Design

### Services and Modules

| Module | Responsibility | Location |
|--------|---------------|----------|
| `GuardrailAdminPanel` | Admin section in Settings for guardrail management | `src/components/ai-buddy/admin/guardrail-admin-panel.tsx` |
| `RestrictedTopicsList` | Editable list of restricted topics with redirect guidance | `src/components/ai-buddy/admin/restricted-topics-list.tsx` |
| `RestrictedTopicEditor` | Dialog for adding/editing a restricted topic | `src/components/ai-buddy/admin/restricted-topic-editor.tsx` |
| `GuardrailToggleCard` | Toggle card for enabling/disabling guardrail rules | `src/components/ai-buddy/admin/guardrail-toggle-card.tsx` |
| `AIDisclosureEditor` | Text editor for AI disclosure message | `src/components/ai-buddy/admin/ai-disclosure-editor.tsx` |
| `GuardrailEnforcementLog` | Table showing guardrail enforcement events | `src/components/ai-buddy/admin/guardrail-enforcement-log.tsx` |
| `useGuardrails` | Hook for guardrails CRUD operations | `src/hooks/ai-buddy/use-guardrails.ts` |
| `useGuardrailLogs` | Hook for fetching guardrail enforcement logs | `src/hooks/ai-buddy/use-guardrail-logs.ts` |
| `loadGuardrails()` | Server function to load guardrails (no caching) | `src/lib/ai-buddy/guardrails.ts` |
| `injectGuardrails()` | Inject guardrails into system prompt | `src/lib/ai-buddy/prompt-builder.ts` |
| `logGuardrailEvent()` | Log guardrail enforcement to audit log | `src/lib/ai-buddy/audit-logger.ts` |

### Data Models and Contracts

**Existing Schema (ai_buddy_guardrails table):**

```sql
-- Already exists from Epic 14 migration
CREATE TABLE ai_buddy_guardrails (
  agency_id uuid PRIMARY KEY REFERENCES agencies(id),
  restricted_topics jsonb NOT NULL DEFAULT '[]',
  custom_rules jsonb NOT NULL DEFAULT '[]',
  eando_disclaimer boolean NOT NULL DEFAULT true,
  ai_disclosure_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);
```

**TypeScript Types:**

```typescript
// src/types/ai-buddy.ts - extend existing types

/**
 * A restricted topic that AI will not discuss directly
 */
export interface RestrictedTopic {
  id: string;                    // UUID for editing/deletion
  trigger: string;               // Topic keyword or phrase (e.g., "legal advice")
  description?: string;          // Admin description of why restricted
  redirectGuidance: string;      // How AI should redirect (e.g., "Suggest consulting an attorney")
  enabled: boolean;              // Can temporarily disable without deleting
  createdAt: string;
  createdBy?: string;            // User ID who created
}

/**
 * A custom guardrail rule (beyond restricted topics)
 */
export interface CustomGuardrailRule {
  id: string;
  name: string;                  // e.g., "State Compliance Warnings"
  description: string;           // Explanation for admin
  promptInjection: string;       // Text injected into system prompt when enabled
  enabled: boolean;
  isBuiltIn: boolean;            // true for system rules, false for custom
}

/**
 * Complete guardrails configuration for an agency
 */
export interface AgencyGuardrails {
  agencyId: string;
  restrictedTopics: RestrictedTopic[];
  customRules: CustomGuardrailRule[];
  eandoDisclaimer: boolean;      // Master toggle for E&O protection language
  aiDisclosureMessage: string | null;  // Chatbot disclosure for state compliance
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Default guardrails for new agencies
 */
export const DEFAULT_GUARDRAILS: Omit<AgencyGuardrails, 'agencyId' | 'updatedAt' | 'updatedBy'> = {
  restrictedTopics: [
    {
      id: 'default-legal',
      trigger: 'legal advice',
      description: 'Prevents AI from providing legal counsel',
      redirectGuidance: 'Suggest the user consult with a licensed attorney for legal questions.',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-claims',
      trigger: 'file a claim',
      description: 'Prevents AI from handling claims',
      redirectGuidance: 'Direct the user to contact their carrier directly or visit the carrier portal to file claims.',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'default-binding',
      trigger: 'binding authority',
      description: 'Prevents AI from discussing binding decisions',
      redirectGuidance: 'Explain that binding decisions require human review and suggest contacting the agency.',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ],
  customRules: [
    {
      id: 'builtin-eando',
      name: 'E&O Protection Language',
      description: 'Adds standard E&O disclaimer language to responses involving coverage advice',
      promptInjection: 'When discussing coverage, limits, or policy interpretation, always include: "Coverage is subject to policy terms and conditions. Please review the actual policy language or contact the carrier for confirmation."',
      enabled: true,
      isBuiltIn: true,
    },
    {
      id: 'builtin-state-compliance',
      name: 'State Compliance Warnings',
      description: 'Reminds users about state-specific requirements when relevant',
      promptInjection: 'When discussing state-specific coverage requirements or regulations, note that requirements vary by state and suggest verifying with the state insurance department if needed.',
      enabled: true,
      isBuiltIn: true,
    },
  ],
  eandoDisclaimer: true,
  aiDisclosureMessage: null,
};

/**
 * Guardrail enforcement audit log entry
 */
export interface GuardrailEnforcementEvent {
  id: string;
  agencyId: string;
  userId: string;
  conversationId: string;
  messageId: string;
  triggeredTopic?: string;       // Which restricted topic was triggered
  triggeredRule?: string;        // Which custom rule was applied
  userMessage: string;           // The message that triggered (truncated)
  redirectApplied: string;       // The redirect guidance used
  loggedAt: string;
}
```

### APIs and Interfaces

**Guardrails Admin API:**

```typescript
// GET /api/ai-buddy/admin/guardrails
// Requires: configure_guardrails permission
// Response: { data: { guardrails: AgencyGuardrails }, error: null }

// PATCH /api/ai-buddy/admin/guardrails
// Requires: configure_guardrails permission
// Request: Partial<AgencyGuardrails>
// Response: { data: { guardrails: AgencyGuardrails }, error: null }

// POST /api/ai-buddy/admin/guardrails/topics
// Requires: configure_guardrails permission
// Request: Omit<RestrictedTopic, 'id' | 'createdAt' | 'createdBy'>
// Response: { data: { topic: RestrictedTopic }, error: null }

// PATCH /api/ai-buddy/admin/guardrails/topics/[id]
// Requires: configure_guardrails permission
// Request: Partial<RestrictedTopic>
// Response: { data: { topic: RestrictedTopic }, error: null }

// DELETE /api/ai-buddy/admin/guardrails/topics/[id]
// Requires: configure_guardrails permission
// Response: { data: { deleted: true }, error: null }

// POST /api/ai-buddy/admin/guardrails/reset
// Requires: configure_guardrails permission
// Response: { data: { guardrails: AgencyGuardrails }, error: null }
// Resets to DEFAULT_GUARDRAILS
```

**Implementation Example:**

```typescript
// src/app/api/ai-buddy/admin/guardrails/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { DEFAULT_GUARDRAILS } from '@/types/ai-buddy';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check permission
  const { data: permission } = await supabase
    .from('ai_buddy_permissions')
    .select('permission')
    .eq('user_id', user.id)
    .eq('permission', 'configure_guardrails')
    .single();

  if (!permission) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get user's agency
  const { data: userData } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!userData?.agency_id) {
    return NextResponse.json({ error: 'No agency found' }, { status: 400 });
  }

  // Load guardrails (NO CACHING - FR37 immediate effect)
  const { data: guardrails, error } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', userData.agency_id)
    .single();

  if (error && error.code !== 'PGRST116') { // Not "no rows"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return defaults if no guardrails configured
  const result = guardrails ? {
    agencyId: guardrails.agency_id,
    restrictedTopics: guardrails.restricted_topics || [],
    customRules: guardrails.custom_rules || [],
    eandoDisclaimer: guardrails.eando_disclaimer,
    aiDisclosureMessage: guardrails.ai_disclosure_message,
    updatedAt: guardrails.updated_at,
    updatedBy: guardrails.updated_by,
  } : {
    agencyId: userData.agency_id,
    ...DEFAULT_GUARDRAILS,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  };

  return NextResponse.json({ data: { guardrails: result } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check permission
  const { data: permission } = await supabase
    .from('ai_buddy_permissions')
    .select('permission')
    .eq('user_id', user.id)
    .eq('permission', 'configure_guardrails')
    .single();

  if (!permission) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const updates = await request.json();

  // Get user's agency
  const { data: userData } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!userData?.agency_id) {
    return NextResponse.json({ error: 'No agency found' }, { status: 400 });
  }

  // Use service client for upsert
  const serviceClient = createServiceClient();

  const { data: existing } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', userData.agency_id)
    .single();

  const merged = {
    agency_id: userData.agency_id,
    restricted_topics: updates.restrictedTopics ?? existing?.restricted_topics ?? [],
    custom_rules: updates.customRules ?? existing?.custom_rules ?? [],
    eando_disclaimer: updates.eandoDisclaimer ?? existing?.eando_disclaimer ?? true,
    ai_disclosure_message: updates.aiDisclosureMessage ?? existing?.ai_disclosure_message,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await serviceClient
    .from('ai_buddy_guardrails')
    .upsert(merged, { onConflict: 'agency_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the change
  await serviceClient.from('ai_buddy_audit_logs').insert({
    agency_id: userData.agency_id,
    user_id: user.id,
    action: 'guardrails_updated',
    metadata: { changes: Object.keys(updates) },
  });

  return NextResponse.json({ data: { guardrails: merged } });
}
```

**Guardrail Enforcement Logs API:**

```typescript
// GET /api/ai-buddy/admin/guardrails/logs
// Requires: view_audit_logs permission
// Query: ?startDate=...&endDate=...&userId=...&limit=50
// Response: { data: { logs: GuardrailEnforcementEvent[] }, error: null }
```

### Workflows and Sequencing

**Guardrail Loading Flow (Chat API - No Caching):**

```
User sends message to /api/ai-buddy/chat
    │
    ▼
┌─────────────────────────────────────┐
│ Load guardrails from DB (FRESH)     │  ← NO CACHING for FR37
│ SELECT * FROM ai_buddy_guardrails   │
│ WHERE agency_id = user.agency_id    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Build system prompt with guardrails │
│ injectGuardrails(basePrompt, guard) │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Send to OpenRouter Claude           │
│ (guardrails in system prompt)       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Stream response to user             │
│ (AI follows guardrail instructions) │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Log guardrail context (async)       │
│ (which guardrails were active)      │
└─────────────────────────────────────┘
```

**Guardrail Admin Configuration Flow:**

```
Admin opens Settings → AI Buddy → Guardrails tab
    │
    ▼
┌─────────────────────────────────────┐
│ Load current guardrails via GET     │
│ /api/ai-buddy/admin/guardrails      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Display GuardrailAdminPanel:        │
│ • Restricted Topics list            │
│ • Guardrail Rule toggles            │
│ • AI Disclosure editor              │
└─────────────────────────────────────┘
    │
    ▼
Admin makes changes (add topic, toggle rule, edit disclosure)
    │
    ▼
┌─────────────────────────────────────┐
│ PATCH /api/ai-buddy/admin/guardrails│
│ Changes saved immediately           │
│ Toast: "Guardrails updated"         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Next chat API call loads fresh      │
│ guardrails - changes take effect    │
│ IMMEDIATELY (FR37)                  │
└─────────────────────────────────────┘
```

**Invisible Guardrail Redirect Flow:**

```
User asks about restricted topic (e.g., "Should I sue my carrier?")
    │
    ▼
┌─────────────────────────────────────┐
│ Guardrails loaded into system prompt│
│ Including: "legal advice" topic     │
│ Redirect: "Suggest consulting       │
│            a licensed attorney"     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Claude follows prompt instructions: │
│ "I'd recommend discussing that with │
│  a licensed attorney who can review │
│  your specific situation. They can  │
│  advise on your options. Is there   │
│  anything else I can help with?"    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Log guardrail enforcement (async):  │
│ • triggeredTopic: "legal advice"    │
│ • userMessage: "Should I sue..."    │
│ • redirectApplied: "Suggest..."     │
└─────────────────────────────────────┘
    │
    ▼
User sees helpful response, NOT "I cannot discuss that"
```

**AI Disclosure Message Flow:**

```
AI Disclosure configured: "You are chatting with an AI assistant..."
    │
    ▼
┌─────────────────────────────────────┐
│ User starts new conversation        │
│ OR enters AI Buddy for first time   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Display disclosure banner/message   │
│ at top of chat (non-dismissible)    │
│ OR include in first AI message      │
└─────────────────────────────────────┘
    │
    ▼
State compliance satisfied (FR40)
```

## Non-Functional Requirements

### Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| Guardrail load time | < 50ms | Single query, indexed by agency_id |
| Guardrails admin page load | < 300ms | Simple query, no complex joins |
| Guardrail save | < 500ms | Single upsert operation |
| Enforcement log query | < 1s | Indexed by agency_id + logged_at |
| Chat latency impact | < 100ms | Guardrail load is parallel with other setup |

**Critical:** No caching of guardrails to ensure FR37 "immediate effect". This is a deliberate trade-off - we accept ~50ms per chat call in exchange for instant guardrail updates.

### Security

- **Permission Checks:** All admin endpoints require `configure_guardrails` permission
- **Agency Isolation:** RLS ensures agencies can only see/modify their own guardrails
- **Input Validation:** Sanitize all topic triggers and redirect guidance (XSS prevention)
- **No Secrets in Guardrails:** Guardrail config contains no sensitive data
- **Audit Trail:** All guardrail changes logged with user ID and timestamp
- **Service Client Pattern:** Use verify-then-service pattern for mutations

### Reliability/Availability

- **Graceful Degradation:** If guardrails fail to load, use DEFAULT_GUARDRAILS
- **No Breaking Chat:** Guardrail loading errors should log but not block chat
- **Idempotent Saves:** Multiple saves of same config produce same result
- **Default Fallbacks:** New agencies get sensible default guardrails automatically

### Observability

- **Audit Logging:**
  - `guardrails_updated` - When admin changes guardrail config
  - `guardrail_enforced` - When guardrail redirects a conversation
  - `disclosure_displayed` - When AI disclosure is shown to user
- **Metrics to Track:**
  - Guardrail enforcement rate per agency
  - Most triggered restricted topics
  - Config change frequency
- **Error Logging:**
  - Guardrail load failures
  - Permission denied attempts
  - Malformed guardrail configs

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `shadcn/ui Switch` | latest | Guardrail toggle components |
| `shadcn/ui Dialog` | latest | Restricted topic editor modal |
| `shadcn/ui Textarea` | latest | AI disclosure message editor |
| `shadcn/ui Card` | latest | Guardrail rule cards |
| `@tanstack/react-query` | ^5.x | Guardrails data fetching/caching on client |

### Internal Dependencies

| Component | Location | Usage |
|-----------|----------|-------|
| `buildSystemPrompt()` | `src/lib/ai-buddy/prompt-builder.ts` | Inject guardrails into prompt |
| `auditLog()` | `src/lib/ai-buddy/audit-logger.ts` | Log guardrail events |
| `usePermissions` | `src/hooks/ai-buddy/use-permissions.ts` | Check admin access |
| Settings page | `src/app/(dashboard)/settings/page.tsx` | Add Guardrails admin section |
| Chat API | `src/app/api/ai-buddy/chat/route.ts` | Load and apply guardrails |
| AI Buddy layout | `src/app/(dashboard)/ai-buddy/layout.tsx` | Display AI disclosure |

### Database Dependencies

- **Existing tables:** `ai_buddy_guardrails`, `ai_buddy_audit_logs`, `ai_buddy_permissions`, `users`, `agencies`
- **No new tables required:** All schema exists from Epic 14 migration
- **No migrations needed:** Using existing table structure

## Acceptance Criteria (Authoritative)

## Pre-Implementation Tasks (Before Story 19.1)

These tasks MUST be completed as part of Story 19.1 setup, before any feature implementation:

### P0 - Prerequisites (Blocking)

| Task | Description | Verification |
|------|-------------|--------------|
| **Verify `ai_buddy_guardrails` table** | Confirm table exists with expected schema from Epic 14 | Run: `SELECT * FROM ai_buddy_guardrails LIMIT 1;` |
| **Verify `ai_buddy_audit_logs` table** | Confirm audit log table exists | Run: `SELECT * FROM ai_buddy_audit_logs LIMIT 1;` |
| **Verify `configure_guardrails` permission** | Confirm permission exists in system | Check `ai_buddy_permissions` table |

### P1 - Pattern Setup (Story 19.1 Task 1)

| Task | Description | Pattern Source |
|------|-------------|----------------|
| **Reuse admin patterns from 18.4** | Apply `requireAdminAuth()` + `isAdmin` prop pattern | `src/components/ai-buddy/admin/onboarding-status-section.tsx` |
| **Extend prompt builder for guardrails** | Create `injectGuardrails()` function following 18.3 pattern | `src/lib/ai-buddy/prompt-builder.ts:formatCarriersContext()` |

### P2 - Technical Debt (Must Complete in Epic 19)

| Task | Origin | Description |
|------|--------|-------------|
| **Document PostgreSQL type casting** | Epic 16 | Add to architecture docs - 3 epics overdue |
| **Add E2E test for document preview** | Epic 17 | Test document preview modal flow - 2 epics overdue |

**IMPORTANT:** Story 19.1 should include these as Task 0 (Prerequisites) before feature implementation begins.

---

### Story 19.1: Guardrail Admin UI (FR35-37)

*Covers: Restricted topics management, guardrail rule toggles, immediate effect*

**AC-19.1.1:** Given I am an admin with `configure_guardrails` permission, when I open Settings → AI Buddy, then I see a "Guardrails" section with restricted topics and rule toggles.

**AC-19.1.2:** Given I view the Guardrails section, when I see the Restricted Topics list, then I see default topics (legal advice, claims filing, binding authority) with their redirect guidance.

**AC-19.1.3:** Given I view a restricted topic, when I look at its card, then I see: trigger phrase, description, redirect guidance, and enable/disable toggle.

**AC-19.1.4:** Given I click "Add Topic", when a dialog opens, then I can enter a trigger phrase, description, and redirect guidance.

**AC-19.1.5:** Given I fill out the Add Topic form, when I click "Save", then the topic is added to the list and the dialog closes.

**AC-19.1.6:** Given I click the edit button on a topic, when the editor opens, then I can modify the trigger, description, and redirect guidance.

**AC-19.1.7:** Given I click the delete button on a topic, when I confirm deletion, then the topic is removed from the list.

**AC-19.1.8:** Given I view the Guardrail Rules section, when I see the toggles, then I see built-in rules: "E&O Protection Language" and "State Compliance Warnings".

**AC-19.1.9:** Given I toggle a guardrail rule off, when I save, then the rule is disabled and no longer injected into the system prompt.

**AC-19.1.10:** Given I make any change to guardrails, when I save, then changes are persisted immediately to the database.

**AC-19.1.11:** Given I save guardrail changes, when a producer uses AI Buddy in a new chat, then the updated guardrails are immediately in effect (no cache, no delay).

**AC-19.1.12:** Given I do NOT have `configure_guardrails` permission, when I open Settings → AI Buddy, then I do NOT see the Guardrails admin section.

### Story 19.2: Enforcement Logging (FR38)

*Covers: Audit log for guardrail enforcement events*

**AC-19.2.1:** Given a user asks about a restricted topic, when the AI redirects, then a guardrail enforcement event is logged to `ai_buddy_audit_logs`.

**AC-19.2.2:** Given a guardrail enforcement is logged, when I view the log entry, then I see: userId, conversationId, triggeredTopic, userMessage (truncated), redirectApplied, timestamp.

**AC-19.2.3:** Given I am an admin with `view_audit_logs` permission, when I open the Guardrails section, then I see an "Enforcement Log" subsection.

**AC-19.2.4:** Given I view the Enforcement Log, when there are logged events, then I see a table with columns: User, Triggered Topic, Message Preview, Date/Time.

**AC-19.2.5:** Given I view the Enforcement Log, when I click on an entry, then I can see the full details including the redirect guidance that was applied.

**AC-19.2.6:** Given I view the Enforcement Log, when I filter by date range, then I only see events within that range.

**AC-19.2.7:** Given guardrail enforcement logging, when logs are written, then they are append-only (cannot be deleted or modified).

### Story 19.3: Invisible Guardrails (FR39)

*Covers: Helpful redirections without blocking language*

**AC-19.3.1:** Given a user asks about a restricted topic (e.g., "Should I sue my carrier?"), when the AI responds, then it provides a helpful redirect WITHOUT saying "I cannot", "blocked", or "restricted".

**AC-19.3.2:** Given the restricted topic "legal advice" with redirect "Suggest consulting a licensed attorney", when triggered, then the AI response recommends consulting an attorney in a natural, helpful way.

**AC-19.3.3:** Given the restricted topic "file a claim" with redirect "Direct to carrier portal", when triggered, then the AI provides guidance on contacting the carrier or using their portal.

**AC-19.3.4:** Given the restricted topic "binding authority" with redirect "Requires human review", when triggered, then the AI explains binding requires agency review and offers other help.

**AC-19.3.5:** Given an admin adds a custom restricted topic with custom redirect guidance, when that topic is triggered, then the AI follows the custom redirect guidance.

**AC-19.3.6:** Given a restricted topic is disabled, when that topic comes up in conversation, then the AI discusses it normally (no redirect).

**AC-19.3.7:** Given the system prompt, when I inspect it (dev tools/logging), then I can verify restricted topics and their redirect guidance are injected correctly.

### Story 19.4: AI Disclosure Message (FR40-41)

*Covers: Configurable chatbot disclosure for state compliance*

**AC-19.4.1:** Given I am an admin, when I view the Guardrails section, then I see an "AI Disclosure" subsection with a text editor.

**AC-19.4.2:** Given I view the AI Disclosure editor, when it is empty, then I see placeholder text suggesting example disclosure language.

**AC-19.4.3:** Given I enter a disclosure message (e.g., "You are chatting with an AI assistant. This is not a licensed insurance agent."), when I save, then the message is persisted.

**AC-19.4.4:** Given a disclosure message is configured, when a user starts a new conversation in AI Buddy, then the disclosure is displayed prominently (banner or first message).

**AC-19.4.5:** Given the disclosure is displayed, when the user reads it, then it is clearly visible and cannot be dismissed/hidden.

**AC-19.4.6:** Given NO disclosure message is configured, when a user starts a conversation, then no disclosure banner/message is shown.

**AC-19.4.7:** Given I clear the disclosure message and save, when users start new conversations, then the disclosure no longer appears.

**AC-19.4.8:** Given the disclosure message, when it is displayed, then it meets WCAG 2.1 AA accessibility requirements (contrast, screen reader support).

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
|----|--------------|---------------|-----------|
| AC-19.1.1 | Services | `GuardrailAdminPanel`, Settings page | Admin opens Settings, verify Guardrails section visible |
| AC-19.1.2 | Data Models | `RestrictedTopicsList`, DEFAULT_GUARDRAILS | Verify default topics displayed |
| AC-19.1.3 | Services | `RestrictedTopicCard` | Verify all fields displayed on topic card |
| AC-19.1.4 | Services | `RestrictedTopicEditor` dialog | Click Add, verify dialog opens with empty form |
| AC-19.1.5 | APIs | POST topics endpoint | Fill form, save, verify topic added |
| AC-19.1.6 | Services | `RestrictedTopicEditor` edit mode | Click edit, verify form populated, save changes |
| AC-19.1.7 | APIs | DELETE topics endpoint | Delete topic, verify removed from list |
| AC-19.1.8 | Data Models | `GuardrailToggleCard`, DEFAULT_GUARDRAILS | Verify built-in rules displayed with toggles |
| AC-19.1.9 | APIs | PATCH guardrails | Toggle off, verify prompt no longer includes rule |
| AC-19.1.10 | APIs | PATCH guardrails | Make change, verify DB updated immediately |
| AC-19.1.11 | Workflows | Chat API, loadGuardrails() | Admin changes, producer chats, verify new guardrails active |
| AC-19.1.12 | Security | Permission check | Non-admin opens Settings, verify section hidden |
| AC-19.2.1 | Workflows | `logGuardrailEvent()` | Trigger topic, verify audit log entry created |
| AC-19.2.2 | Data Models | `GuardrailEnforcementEvent` | Check log entry has all required fields |
| AC-19.2.3 | Services | `GuardrailEnforcementLog` | Admin opens section, verify log table visible |
| AC-19.2.4 | Services | `GuardrailEnforcementLog` table | Verify correct columns displayed |
| AC-19.2.5 | Services | Log entry detail view | Click entry, verify full details shown |
| AC-19.2.6 | APIs | GET logs with date filter | Filter by dates, verify filtered results |
| AC-19.2.7 | Security | RLS append-only policy | Try to update/delete log, verify failure |
| AC-19.3.1 | Workflows | `injectGuardrails()`, Claude response | Ask restricted question, verify no blocking language |
| AC-19.3.2 | Workflows | Legal advice topic | Trigger legal topic, verify attorney recommendation |
| AC-19.3.3 | Workflows | Claims topic | Trigger claims topic, verify carrier portal guidance |
| AC-19.3.4 | Workflows | Binding topic | Trigger binding topic, verify agency review guidance |
| AC-19.3.5 | APIs | Custom topic | Admin adds topic, trigger it, verify custom redirect |
| AC-19.3.6 | Workflows | Disabled topic | Disable topic, trigger it, verify normal response |
| AC-19.3.7 | Observability | Prompt logging | Inspect system prompt, verify guardrails present |
| AC-19.4.1 | Services | `AIDisclosureEditor` | Admin opens Guardrails, verify Disclosure section |
| AC-19.4.2 | Services | Placeholder text | View empty editor, verify placeholder shown |
| AC-19.4.3 | APIs | PATCH guardrails | Save disclosure, verify persisted |
| AC-19.4.4 | Workflows | AI Buddy layout | Configure disclosure, start chat, verify displayed |
| AC-19.4.5 | Services | Disclosure banner | Verify banner visible, no dismiss button |
| AC-19.4.6 | Workflows | No disclosure | Clear disclosure, start chat, verify no banner |
| AC-19.4.7 | APIs | Clear disclosure | Clear and save, verify removed |
| AC-19.4.8 | Accessibility | WCAG compliance | Run accessibility check on disclosure banner |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **AI doesn't follow guardrails perfectly** | High | Use Claude (best instruction following), test thoroughly, log all enforcement events |
| **Admin misconfigures guardrails** | Medium | Provide default guardrails, add "reset to defaults" option |
| **Guardrail load latency impacts chat** | Low | Single indexed query (~50ms), parallel with other setup |
| **Users find ways around guardrails** | Medium | Audit logging catches attempts, iterate on prompt engineering |
| **State disclosure requirements vary** | Low | Make disclosure fully customizable, provide examples |

### Assumptions

- `ai_buddy_guardrails` table exists from Epic 14 migration
- `ai_buddy_audit_logs` table exists with append-only RLS
- `ai_buddy_permissions` table has `configure_guardrails` and `view_audit_logs` permissions
- Claude (via OpenRouter) follows system prompt guardrail instructions reliably
- Admins understand what topics to restrict (no AI-suggested guardrails)
- One guardrail config per agency (not per-user)

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Should we detect guardrail triggers on the server before sending to AI? | Dev | **Decision: No** - let AI handle naturally via prompt |
| Should disclosure appear as banner or first AI message? | UX | **Decision: Banner** - more prominent, doesn't disappear with scroll |
| Should we rate-limit guardrail config changes? | PM | **Decision: No** - trust admins, log all changes |
| What happens if guardrails fail to load? | Dev | **Decision: Use defaults** - fail open with safe defaults |

## Test Strategy Summary

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| `GuardrailAdminPanel` | Renders correctly, permission check |
| `RestrictedTopicsList` | Add/edit/delete topics, list rendering |
| `RestrictedTopicEditor` | Form validation, submit handling |
| `GuardrailToggleCard` | Toggle state, save on change |
| `AIDisclosureEditor` | Text input, character count, save |
| `GuardrailEnforcementLog` | Table rendering, filtering, pagination |
| `useGuardrails` | CRUD operations, error handling |
| `loadGuardrails()` | DB query, default fallback |
| `injectGuardrails()` | Prompt construction, topic injection |
| `logGuardrailEvent()` | Audit log creation |

### Integration Tests

| Flow | Test Focus |
|------|------------|
| Admin saves guardrails → Producer sees effect | End-to-end immediate effect |
| Restricted topic triggered → Audit log created | Enforcement logging |
| Guardrail config update → Audit log created | Config change logging |
| Permission denied → Section hidden | Authorization flow |

### E2E Tests

| Scenario | Steps |
|----------|-------|
| Admin configures guardrails | Login as admin → Settings → Add topic → Toggle rule → Save → Verify persisted |
| Guardrail immediate effect | Admin saves guardrail → Producer opens chat → Ask restricted question → Verify redirect |
| Enforcement log review | Trigger guardrail → Admin views log → Verify entry visible |
| AI disclosure | Admin sets disclosure → User starts chat → Verify banner visible |
| Permission check | Login as producer → Settings → Verify no Guardrails section |

### Accessibility Tests

- Guardrail admin panel keyboard navigation
- Screen reader support for toggle states
- AI disclosure banner contrast ratio (WCAG AA)
- Focus management in topic editor dialog

---

## Story Summary

| Story | Title | Points | FRs | Description |
|-------|-------|--------|-----|-------------|
| 19.1 | Guardrail Admin UI | 5 | FR35-37 | Admin screen for restricted topics, rule toggles, immediate effect |
| 19.2 | Enforcement Logging | 3 | FR38 | Audit log for guardrail enforcement events |
| 19.3 | Invisible Guardrails | 3 | FR39 | Helpful redirects without blocking language |
| 19.4 | AI Disclosure Message | 2 | FR40-41 | Configurable chatbot disclosure for state compliance |

**Total Points:** 13
**Total FRs Covered:** 7 (FR35-41)
**Stories:** 4

---

## Learnings from Epic 18 (Retrospective)

### Patterns to Reuse

Epic 18 established several patterns that directly apply to Epic 19:

**1. Admin-Only Section Pattern (from Story 18.4)**
```typescript
// Settings page passes isAdmin prop
<AiBuddyPreferencesTab isAdmin={isAdmin} />

// Component conditionally renders admin section
{isAdmin && <GuardrailAdminPanel />}
```

**2. Prompt Builder Formatter Pattern (from Story 18.3)**
```typescript
// Clean formatter functions for prompt injection
export function injectGuardrails(guardrails: AgencyGuardrails): string {
  const sections: string[] = [];

  // Restricted topics
  if (guardrails.restrictedTopics?.length) {
    const topicInstructions = guardrails.restrictedTopics
      .filter(t => t.enabled)
      .map(t => `- If user asks about "${t.trigger}": ${t.redirectGuidance}`)
      .join('\n');
    sections.push(`RESTRICTED TOPICS (redirect naturally, never say "blocked"):\n${topicInstructions}`);
  }

  // Custom rules
  guardrails.customRules
    .filter(r => r.enabled)
    .forEach(r => sections.push(r.promptInjection));

  return sections.join('\n\n');
}
```

**3. API Permission Check Pattern (from Story 18.4)**
```typescript
// Use requireAdminAuth() for admin-only endpoints
import { requireAdminAuth } from '@/lib/auth/admin';

export async function GET() {
  const { user, error } = await requireAdminAuth('configure_guardrails');
  if (error) return NextResponse.json({ error }, { status: 403 });
  // ... rest of handler
}
```

**4. Hook Return Interface Pattern (from Story 18.2)**
```typescript
interface UseGuardrailsReturn {
  guardrails: AgencyGuardrails | null;
  isLoading: boolean;
  error: string | null;
  updateGuardrails: (updates: Partial<AgencyGuardrails>) => Promise<void>;
  addTopic: (topic: Omit<RestrictedTopic, 'id' | 'createdAt'>) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  resetGuardrails: () => Promise<void>;
  refetch: () => Promise<void>;
}
```

### Technical Debt to Address in Epic 19

From Epic 18 retrospective, these items have been carried forward:

| Item | Origin Epic | Priority | Notes |
|------|-------------|----------|-------|
| PostgreSQL type casting documentation | Epic 16 | P1 | 3 epics overdue - MUST address |
| E2E document preview tests | Epic 17 | P1 | 2 epics overdue - MUST address |

**Recommendation:** Block at least one story in Epic 19 until these are completed, or formally remove from backlog with documented rationale.

### Infrastructure Verified Ready

From Epic 18:
- [x] Settings page AI Buddy tab exists and works
- [x] `isAdmin` prop pattern established and tested
- [x] Prompt builder extension pattern proven (formatters)
- [x] Admin permission check patterns working
- [x] Toast notification infrastructure ready
- [x] Test patterns established (unit + E2E)
