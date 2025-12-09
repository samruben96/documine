# Epic 19: AI Buddy Guardrails & Compliance

**Status:** Backlog
**Created:** 2025-12-07
**Updated:** 2025-12-08 (Stories consolidated: 19.1-19.3 merged into 19.1)
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Enable admin-controlled guardrails that enforce compliance while remaining invisible to users.

## Goal

Principals can protect their agency from E&O exposure while producers get helpful AI assistance.

## Functional Requirements

- **FR35:** Admins can define restricted topics that AI will not discuss
- **FR36:** Admins can enable/disable individual guardrail rules
- **FR37:** Guardrail changes take effect immediately for all agency users
- **FR38:** System logs all guardrail enforcement events (what was blocked, when, for whom)
- **FR39:** AI provides helpful redirection when a guardrail prevents a direct answer
- **FR40:** System displays AI disclosure message in compliance with state chatbot laws
- **FR41:** Admins can customize the AI disclosure message

**Note:** FR33-34 (carrier restrictions) deferred to Quoting feature per Architecture decision.

## Stories

| Story | Name | Description |
|-------|------|-------------|
| 19.1 | Guardrail Admin UI | Admin screen to define restricted topics, toggle rules on/off, changes apply immediately (FR35-37) |
| 19.2 | Enforcement Logging | Audit log for guardrail events (FR38) |
| 19.3 | Invisible Guardrails | Helpful redirects without blocking language (FR39) |
| 19.4 | AI Disclosure Message | Configurable chatbot disclosure for compliance (FR40-41) |

**Note:** Stories consolidated 2025-12-08. Original 19.1 (Restricted Topics), 19.2 (Guardrail Toggles), and 19.3 (Immediate Effect) merged into new 19.1 (Guardrail Admin UI) as they represent a single admin settings page. "Immediate effect" is an implementation constraint (no caching), not a separate feature.

## Dependencies

- Epic 18: AI Buddy Personalization & Onboarding

## Technical Notes

- "Invisible Guardrails" pattern - see Architecture document
- Guardrails enforced via system prompt injection
- No caching of guardrails (load fresh on each API call) - ensures FR37 "immediate effect"
- AI never says "I cannot" or "blocked" - always helpful redirect

## Learnings from Epic 18 (Retrospective)

**Patterns to Reuse:**
- Admin section pattern: `isAdmin` prop + `requireAdminAuth()` (from 18.4)
- Prompt builder extension: formatter functions (from 18.3)
- Settings tab integration pattern (from 18.2)
- Hook return interface pattern (from 18.1/18.2)

**Technical Debt Resolved (2025-12-08):**
- [x] PostgreSQL type casting documentation - Added to `docs/architecture/implementation-patterns.md`
- [x] E2E document preview tests - Added `__tests__/e2e/document-preview-modal.spec.ts`

**Infrastructure Ready:**
- [x] `ai_buddy_guardrails` table exists (Epic 14)
- [x] `ai_buddy_audit_logs` table exists (Epic 14)
- [x] Settings AI Buddy tab working (Epic 18)
- [x] Admin permission patterns established (Epic 18)

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md` (Novel Pattern: Invisible Guardrails)
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 6)
- Epic 18 Retrospective: `docs/sprint-artifacts/retrospectives/epic-18-retrospective.md`
