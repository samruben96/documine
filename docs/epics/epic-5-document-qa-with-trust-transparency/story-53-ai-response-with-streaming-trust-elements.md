# Story 5.3: AI Response with Streaming & Trust Elements

As a **user**,
I want **to receive AI answers that stream in with source citations and confidence indicators**,
So that **I can read answers quickly and verify their accuracy**.

**Acceptance Criteria:**

**Given** I send a question
**When** the AI processes my query
**Then** the response streams in:
- Text appears word-by-word (50-100ms per word)
- Feels immediate, not waiting for full response
- User can read while more text appears

**And** when response completes, trust elements appear:
- Confidence badge: [✓ High Confidence] (green #d1fae5), [⚠ Needs Review] (amber #fef3c7), or [○ Not Found] (gray #f1f5f9)
- Source citation: "View in document →" link
- Badge uses 11px font, subtle but visible

**And** confidence thresholds:
- ≥85% similarity score → High Confidence
- 60-84% → Needs Review
- <60% or no relevant chunks → Not Found

**And** "Not Found" responses are clear:
- "I couldn't find information about that in this document."
- Suggests rephrasing or notes document may not contain that info
- [○ Not Found] badge

**And** error handling:
- API timeout → "I'm having trouble processing that. Please try again."
- Rate limit → "Too many requests. Please wait a moment."
- Generic error → "Something went wrong. Please try again." + retry button

**Prerequisites:** Story 5.2, Story 4.6

**Technical Notes:**
- API route: POST `/api/chat` with streaming response
- Use Server-Sent Events for streaming
- Stream format: `data: {"type": "text", "content": "..."}\n\n`
- Confidence calculated from vector similarity scores
- Store messages in chat_messages table after completion
- Reference Architecture doc "Trust-Transparent AI Responses" pattern

---
