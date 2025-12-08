# Epic 15: AI Buddy Core Chat

**Status:** Backlog
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Deliver the core conversational AI experience with streaming responses, source citations, and confidence indicators.

## Goal

Users can ask insurance questions and receive accurate, sourced answers in real-time.

## Functional Requirements

- **FR1:** Users can start new conversations from the dashboard or within a Project
- **FR2:** Users can send messages and receive streaming AI responses in real-time
- **FR5:** Users can continue previous conversations with full context retained
- **FR7:** AI responses include source citations linking to specific document locations
- **FR8:** AI responses include confidence indicators ([High Confidence], [Needs Review], [Not Found])
- **FR9:** AI responds with "I don't know" when information is not available rather than hallucinating
- **FR10:** AI respects guardrails invisibly - responses stay within configured bounds

## Stories

| Story | Name | Points | Status | Description |
|-------|------|--------|--------|-------------|
| 15.1 | Chat Input Component | 3 | Done | Text input with send button, Enter to send, character limit |
| 15.2 | Message Display | 5 | Done | Chat bubbles with avatars, markdown, timestamps |
| 15.3 | Streaming Chat API | 8 | Done | SSE streaming via OpenRouter Claude |
| 15.4 | Conversation Persistence | 5 | Done | Save conversations, auto-generate titles |
| 15.5 | AI Response Quality & Attribution | 16 | Draft | Source citations, confidence indicators, guardrail-aware responses (merged from 15.5-15.7) |

**Note:** Stories 15.5, 15.6, and 15.7 were merged into a single story (15.5) due to tight coupling in prompt building, SSE parsing, and display logic. Approved by PM and SM on 2025-12-07.

## Dependencies

- Epic 14: AI Buddy Foundation

## Technical Notes

- OpenRouter Claude Sonnet 4.5 for AI responses
- SSE for streaming (Edge Runtime)
- RAG retrieval for document context
- Guardrail enforcement via system prompt injection

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 2)
