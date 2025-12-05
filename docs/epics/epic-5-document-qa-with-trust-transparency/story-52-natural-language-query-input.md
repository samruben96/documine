# Story 5.2: Natural Language Query Input

As a **user**,
I want **to ask questions about my document in plain English**,
So that **I can find information without learning special syntax**.

**Acceptance Criteria:**

**Given** I am in the chat panel with a document selected
**When** I type a question
**Then** the input field:
- Expands to accommodate multi-line questions (up to 4 lines visible)
- Shows character count if approaching limit (1000 chars)
- Accepts natural language: "What's the liability limit?", "Is flood covered?", "List all exclusions"

**And** when I send (Enter or click Send):
- Input clears
- My message appears in conversation (right-aligned, primary color bubble)
- "Thinking..." indicator appears (assistant bubble with animated dots)
- Input disabled while waiting

**And** example questions are suggested for empty conversations:
- "What's the coverage limit?"
- "Are there any exclusions?"
- "What's the deductible?"
- Clicking suggestion fills input

**Prerequisites:** Story 5.1

**Technical Notes:**
- Textarea with auto-resize
- Store messages in local state until response complete, then persist
- Use React refs for input focus management
- Debounce suggestion clicks to prevent double-send

---
