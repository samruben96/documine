# Epic 19: AI Buddy Guardrails & Compliance

**Status:** Backlog
**Created:** 2025-12-07
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
| 19.1 | Restricted Topics | Admin UI to define restricted topics with redirects |
| 19.2 | Guardrail Toggles | Enable/disable individual guardrail rules |
| 19.3 | Immediate Effect | Guardrail changes apply instantly |
| 19.4 | Enforcement Logging | Audit log for guardrail events |
| 19.5 | Invisible Guardrails | Helpful redirects without blocking language |
| 19.6 | AI Disclosure Message | Configurable chatbot disclosure for compliance |

## Dependencies

- Epic 18: AI Buddy Personalization & Onboarding

## Technical Notes

- "Invisible Guardrails" pattern - see Architecture document
- Guardrails enforced via system prompt injection
- No caching of guardrails (load fresh on each API call)
- AI never says "I cannot" or "blocked" - always helpful redirect

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md` (Novel Pattern: Invisible Guardrails)
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 6)
