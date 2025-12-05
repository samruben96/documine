# Story 5.6: Conversation History & Follow-up Questions

As a **user**,
I want **to ask follow-up questions and see conversation history**,
So that **I can have a natural dialogue about my document**.

**Acceptance Criteria:**

**Given** I've asked questions about a document
**When** I ask a follow-up question
**Then** the AI has context from previous messages:
- Understands references like "What about for that?" or "Tell me more"
- Maintains conversation thread
- Up to 10 previous messages included in context

**And** conversation history is:
- Visible in chat panel (scrollable)
- Persisted across browser sessions
- Per-document (each document has its own conversation)

**And** I can start a new conversation:
- "New Chat" button clears current conversation
- Old conversation still saved, can access via "History" (optional for MVP)

**And** returning to a document:
- Shows last conversation
- Can continue where left off

**Prerequisites:** Story 5.3

**Technical Notes:**
- Store conversations in conversations table (per document)
- Store messages in chat_messages table with conversation_id
- Load last N messages for context window
- Include previous messages in RAG prompt for follow-up context
- Consider conversation summarization for long threads (post-MVP)

---
