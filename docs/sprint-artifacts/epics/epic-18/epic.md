# Epic 18: AI Buddy Personalization & Onboarding

**Status:** Backlog
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Create a personalized AI experience that learns user preferences from first interaction.

## Goal

AI Buddy knows the user and their preferences, making every interaction more relevant.

## Functional Requirements

- **FR26:** Users can set their display name and role
- **FR27:** Users can specify preferred lines of business (P&C, Commercial, Personal, Life)
- **FR28:** Users can maintain a list of favorite/preferred carriers
- **FR29:** Users can set agency information (name, states licensed)
- **FR30:** Users can choose communication style preference (formal/professional, casual/friendly)
- **FR31:** AI incorporates user preferences into response style and suggestions
- **FR32:** Users can reset their personalization settings to defaults
- **FR57:** New users complete a quick personalization flow (< 2 minutes)
- **FR58:** Onboarding collects: name, lines of business, top carriers
- **FR59:** System provides guided first conversation demonstrating AI capabilities
- **FR60:** System offers personalized suggestions based on onboarding answers
- **FR61:** Users can skip onboarding and complete personalization later
- **FR62:** Admins see onboarding completion status for their users

## Stories

| Story | Name | Description |
|-------|------|-------------|
| 18.1 | Onboarding Flow | 3-step welcome modal (name/role, LOB, carriers) |
| 18.2 | Skip Onboarding | Allow users to skip and complete later |
| 18.3 | Preferences Management | Settings page for all AI Buddy preferences |
| 18.4 | Agency Information | Agency name, licensed states, appointments |
| 18.5 | Preference-Aware Responses | AI tailors responses to user preferences |
| 18.6 | Reset Preferences | Reset all preferences to defaults |
| 18.7 | Guided First Conversation | Personalized greeting with suggestions |
| 18.8 | Admin Onboarding Status | Admin view of user onboarding completion |

## Dependencies

- Epic 17: AI Buddy Document Intelligence

## Technical Notes

- Preferences stored in `users.ai_buddy_preferences` JSONB column
- Onboarding flow < 2 minutes total
- Preferences injected into system prompt via prompt-builder

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 5)
