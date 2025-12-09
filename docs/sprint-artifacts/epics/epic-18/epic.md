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

## Stories (Consolidated)

*Original 8 stories merged to 4 for implementation efficiency. See tech-spec-epic-18.md for details.*

| Story | Name | Description | Points | Original Stories |
|-------|------|-------------|--------|------------------|
| 18.1 | Onboarding Flow & Guided Start | 3-step welcome modal + skip option + personalized greeting | 5 | 18.1, 18.2, 18.7 |
| 18.2 | Preferences Management | Settings tab for all preferences + agency info + reset | 5 | 18.3, 18.4, 18.6 |
| 18.3 | Preference-Aware AI Responses | AI uses preferences in responses (carriers, LOB, style) | 3 | 18.5 |
| 18.4 | Admin Onboarding Status | Admin view of user onboarding completion | 2 | 18.8 |

**Total Points:** 15

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
