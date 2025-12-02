# Story 5.6: Conversation History & Follow-up Questions

Status: done

## Story

As a **user**,
I want **to ask follow-up questions and see conversation history**,
So that **I can have a natural dialogue about my document**.

## Acceptance Criteria

### AC-5.6.1: Conversation History Visible in Chat Panel
- Conversation history visible in scrollable chat panel
- Messages displayed in chronological order (oldest first)
- User messages right-aligned with primary color bubble
- Assistant messages left-aligned with surface color bubble
- Chat panel auto-scrolls to latest message on new messages

### AC-5.6.2: Conversations Persisted to Database
- Conversations persisted to database (conversations + chat_messages tables)
- User message saved to database before AI processing begins
- Assistant message saved to database after streaming response completes
- Sources and confidence stored with assistant messages (JSONB)
- Conversation updated_at timestamp updated on each message
- If user message save fails, show error toast and do not proceed with AI call

### AC-5.6.3: Per-Document Conversations
- Each document has its own conversation (conversation.document_id)
- User can only access conversations for documents in their agency
- Creating a conversation for a document with existing conversation returns existing
- Conversation includes agency_id for RLS enforcement
- Race condition handled: concurrent requests get same conversation (not duplicates)

### AC-5.6.4: Returning to Document Shows Previous Conversation
- Returning to document shows previous conversation
- Messages loaded from database on document page mount
- Loading skeleton shown while fetching conversation history
- Empty state shown if no previous conversation: "Ask anything about this document" with 2-3 example questions relevant to insurance documents

### AC-5.6.5: Follow-up Questions Understand Context
- Follow-up questions understand context from conversation history
- Example: After asking "What is the liability limit?", asking "Is that per occurrence?" correctly references the liability limit
- Example: "Tell me more about that" expands on the previous answer
- Example: "What about property damage?" understands we're discussing coverage limits
- AI receives conversation history to maintain context

### AC-5.6.6: Last 10 Messages in RAG Prompt
- Last 10 individual messages included in RAG prompt (not 10 exchanges/20 messages)
- Messages formatted as role: content pairs
- Older messages beyond 10 are not included (token efficiency)
- Token budget validated: system prompt + document chunks + history must fit within 6000 tokens for history portion
- If history exceeds budget, truncate oldest messages first

### AC-5.6.7: New Chat Button Visible
- "New Chat" button visible in chat panel header
- Button styled as ghost button per UX spec
- Button disabled while AI is generating response
- Button icon: MessageSquarePlus from lucide-react
- Tooltip on hover: "Start a fresh conversation about this document"

### AC-5.6.8: New Chat Confirmation Dialog
- Clicking "New Chat" shows confirmation dialog: "Start a new conversation?"
- Dialog body: "This will clear the current conversation from view. Your conversation history will be saved."
- "Cancel" and "Start New" buttons in dialog
- Enter key confirms (starts new), Escape key cancels
- Modal uses Dialog component from shadcn/ui

### AC-5.6.9: New Chat Creates New Conversation
- Confirming "New Chat" creates new conversation record
- Chat panel clears and shows empty state with example questions
- New conversation_id generated for subsequent messages
- Old conversation remains in database (can be accessed later)

### AC-5.6.10: Old Conversations Not Deleted
- Old conversations remain in database (not deleted, just new one created)
- Only latest conversation shown for a document (by updated_at)
- Historical conversations preserved for audit/compliance
- No manual delete conversation feature in MVP

### AC-5.6.11: Error Handling for Database Operations
- If saving user message fails: show error toast "Failed to save message. Please try again."
- If saving assistant message fails: show warning toast but keep message visible in UI
- If loading conversation fails: show error state with retry button
- Network errors handled gracefully with user-friendly messages

### AC-5.6.12: Concurrent Access Handling
- Multiple browser tabs with same document share same conversation
- Race condition on conversation creation handled via database upsert pattern
- No duplicate conversations created for same document/user pair
- New messages from other tabs not auto-synced (acceptable for MVP)

## Tasks / Subtasks

- [x] **Task 1: Create Chat Service for Conversation CRUD** (AC: 5.6.2, 5.6.3, 5.6.10, 5.6.11, 5.6.12)
  - [x] Create `src/lib/chat/service.ts` with conversation operations
  - [x] Implement `getOrCreateConversation(documentId, userId)` with upsert pattern for race condition safety
  - [x] Implement `getConversationMessages(conversationId)` function
  - [x] Implement `saveUserMessage(conversationId, content)` with error handling
  - [x] Implement `saveAssistantMessage(conversationId, content, sources, confidence)` function
  - [x] Implement `createNewConversation(documentId, userId)` for New Chat
  - [x] Add TypeScript types matching database schema
  - [x] Add proper error types and handling for all operations

- [x] **Task 2: Create useConversation Hook** (AC: 5.6.1, 5.6.4, 5.6.11)
  - [x] Create `src/hooks/use-conversation.ts` hook
  - [x] Implement loading state management for initial fetch
  - [x] Load conversation and messages on documentId change
  - [x] Expose messages, isLoading, error states
  - [x] Handle case where no conversation exists (empty state)
  - [x] Expose refetch function for after new message
  - [x] Implement error state with retry capability

- [x] **Task 3: Update Chat API Route for Conversation Persistence** (AC: 5.6.2, 5.6.6, 5.6.11)
  - [x] Update `src/app/api/chat/route.ts` to persist messages (already implemented in Story 5.3)
  - [x] Accept conversationId in request body
  - [x] Save user message before RAG processing (fail fast if save fails)
  - [x] Buffer streaming response content during generation
  - [x] Save assistant message after streaming completes (on done event)
  - [x] Include last 10 messages in RAG context
  - [x] Return conversationId and messageId in done event
  - [x] Handle and report save errors appropriately

- [x] **Task 4: Build RAG Prompt with Conversation History** (AC: 5.6.5, 5.6.6)
  - [x] Update `src/lib/chat/rag.ts` to accept conversation history (already implemented)
  - [x] Format messages as role: content pairs
  - [x] Limit to last 10 individual messages
  - [x] Implement token budget estimation (~4 chars per token)
  - [x] Truncate oldest messages if history exceeds 6000 token budget
  - [x] Place history between system prompt and current query

- [x] **Task 5: Update ChatPanel for History Display** (AC: 5.6.1, 5.6.4, 5.6.11)
  - [x] Update `src/components/chat/chat-panel.tsx` to use useConversation
  - [x] Render messages from database instead of local state only
  - [x] Add loading skeleton while fetching history
  - [x] Auto-scroll to bottom on new messages
  - [x] Create empty state component with example questions
  - [x] Handle error state with retry button

- [x] **Task 6: Implement New Chat Button** (AC: 5.6.7)
  - [x] Add "New Chat" button to chat panel header
  - [x] Use MessageSquarePlus icon from lucide-react
  - [x] Style as ghost button per UX spec
  - [x] Disable button while streaming response (check isStreaming state)
  - [x] Add Tooltip component with "Start a fresh conversation about this document"
  - [x] Position in header alongside document title

- [x] **Task 7: Implement New Chat Confirmation Dialog** (AC: 5.6.8, 5.6.9)
  - [x] Create confirmation dialog using shadcn/ui Dialog component
  - [x] Dialog title: "Start a new conversation?"
  - [x] Dialog body: "This will clear the current conversation from view. Your conversation history will be saved."
  - [x] Cancel button closes dialog (also Escape key)
  - [x] Start New button calls createNewConversation and clears panel (also Enter key)
  - [x] Add keyboard event handlers for Enter/Escape

- [x] **Task 8: Integrate Conversation Flow in Document Page** (AC: 5.6.3, 5.6.4, 5.6.12)
  - [x] Document page already passes documentId to ChatPanel
  - [x] useConversation and useChat hooks now sync conversation state
  - [x] Handle conversation state across source click navigation
  - [x] Ensure conversation persists across component re-renders

- [x] **Task 9: Testing and Verification** (AC: All)
  - [x] **Unit tests for chat service** (17 tests in `__tests__/lib/chat/service.test.ts`)
  - [x] **Hook tests for useConversation** (7 tests in `__tests__/hooks/use-conversation.test.ts`)
  - [x] **ChatPanel tests** (19 tests in `__tests__/components/chat/chat-panel.test.tsx`)
  - [x] Run build and verify no type errors
  - [x] Verify test baseline maintained (688 tests passing)

## Dev Notes

### Conversation Database Schema

```sql
-- Conversations table (already exists from Epic 1)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table (already exists from Epic 1)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  sources JSONB, -- Array of source citations
  confidence TEXT, -- 'high' | 'needs_review' | 'not_found'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for race condition handling (add if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_document_user
ON conversations(document_id, user_id)
WHERE updated_at = (SELECT MAX(updated_at) FROM conversations c2 WHERE c2.document_id = conversations.document_id AND c2.user_id = conversations.user_id);
```

### Race Condition Handling Pattern

```typescript
// Use upsert pattern to handle concurrent conversation creation
async function getOrCreateConversation(documentId: string, userId: string): Promise<Conversation> {
  // First try to get existing (most common case)
  const existing = await getLatestConversation(documentId, userId);
  if (existing) return existing;

  // If not exists, use INSERT ... ON CONFLICT or try-catch with unique violation
  try {
    return await createConversation(documentId, userId);
  } catch (error) {
    // If unique violation, another request created it - fetch and return
    if (isUniqueViolation(error)) {
      const created = await getLatestConversation(documentId, userId);
      if (created) return created;
    }
    throw error;
  }
}
```

### Streaming Buffer Pattern for Message Persistence

```typescript
// In chat API route - buffer response during streaming
export async function POST(request: Request) {
  const { conversationId, message } = await request.json();

  // 1. Save user message FIRST (fail fast)
  const userMsg = await saveUserMessage(conversationId, message);
  if (!userMsg) {
    return Response.json({ error: 'Failed to save message' }, { status: 500 });
  }

  // 2. Buffer for collecting streamed response
  let fullResponse = '';
  let sources: SourceCitation[] = [];
  let confidence: ConfidenceLevel | null = null;

  // 3. Stream response while buffering
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generateRAGResponse(message, conversationId)) {
        if (chunk.type === 'text') {
          fullResponse += chunk.content;
        } else if (chunk.type === 'source') {
          sources.push(chunk.content);
        } else if (chunk.type === 'confidence') {
          confidence = chunk.content;
        }

        controller.enqueue(encode(chunk));
      }

      // 4. Save complete assistant message
      const assistantMsg = await saveAssistantMessage(
        conversationId,
        fullResponse,
        sources,
        confidence
      );

      // 5. Send done event with IDs
      controller.enqueue(encode({
        type: 'done',
        content: { conversationId, messageId: assistantMsg.id }
      }));
      controller.close();
    }
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

### Token Budget Management

```typescript
// Estimate tokens (~4 characters per token for English text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate history to fit budget
function truncateHistoryToTokenBudget(
  messages: ChatMessage[],
  maxTokens: number = 6000
): ChatMessage[] {
  const result: ChatMessage[] = [];
  let tokenCount = 0;

  // Work backwards from most recent, keeping within budget
  for (let i = messages.length - 1; i >= 0 && result.length < 10; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (tokenCount + msgTokens > maxTokens) break;
    result.unshift(messages[i]);
    tokenCount += msgTokens;
  }

  return result;
}
```

### Chat Service Interface

```typescript
// src/lib/chat/service.ts
export interface ChatService {
  getOrCreateConversation(documentId: string, userId: string): Promise<Conversation>;
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
  saveUserMessage(conversationId: string, content: string): Promise<ChatMessage>;
  saveAssistantMessage(
    conversationId: string,
    content: string,
    sources: SourceCitation[] | null,
    confidence: ConfidenceLevel | null
  ): Promise<ChatMessage>;
  createNewConversation(documentId: string, userId: string): Promise<Conversation>;
}

// Error types
export class ConversationNotFoundError extends Error {
  code = 'CONVERSATION_NOT_FOUND' as const;
}
export class MessageSaveError extends Error {
  code = 'MESSAGE_SAVE_FAILED' as const;
}
```

### Updated API Contract

```typescript
// POST /api/chat - Updated request/response

// Request body (updated)
interface ChatRequest {
  documentId: string;
  message: string;
  conversationId: string;  // NEW: Required for persistence
}

// SSE Event types (updated)
type ChatEvent =
  | { type: 'text'; content: string }
  | { type: 'source'; content: SourceCitation }
  | { type: 'confidence'; content: ConfidenceLevel }
  | { type: 'done'; content: { conversationId: string; messageId: string } }  // UPDATED
  | { type: 'error'; content: { code: string; message: string } };  // NEW
```

### RAG Prompt with History

```typescript
// Format conversation history for RAG prompt
function formatConversationHistory(messages: ChatMessage[]): string {
  const truncated = truncateHistoryToTokenBudget(messages, 6000);
  return truncated
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
}

// Updated RAG prompt template
const promptWithHistory = `
${systemPrompt}

DOCUMENT CONTEXT:
${chunksContext}

CONVERSATION HISTORY:
${formatConversationHistory(previousMessages)}

USER QUESTION: ${userMessage}

Please answer based on the document context and conversation history. If the user references something from a previous message (like "that", "it", "more about this"), use the conversation history to understand what they mean.
`;
```

### Empty State Example Questions

```typescript
// Insurance-relevant example questions for empty state
const EXAMPLE_QUESTIONS = [
  "What are the coverage limits?",
  "Is flood damage covered?",
  "What's the deductible for property damage?",
];
```

### Analytics Events (Recommended)

```typescript
// Track conversation engagement patterns
analytics.track('conversation_started', { documentId, conversationId });
analytics.track('follow_up_question_asked', { conversationId, questionNumber });
analytics.track('new_chat_created', { documentId, previousConversationId });
```

### Project Structure Notes

- Chat service: `src/lib/chat/service.ts` (new)
- Conversation hook: `src/hooks/use-conversation.ts` (new)
- Existing types in `src/lib/chat/types.ts` - use Conversation, ChatMessage interfaces
- Chat API route: `src/app/api/chat/route.ts` (modify)
- ChatPanel: `src/components/chat/chat-panel.tsx` (modify)
- Document page: `src/app/(dashboard)/documents/[id]/page.tsx` (modify)

### Learnings from Previous Story

**From Story 5-5-document-viewer-with-highlight-navigation (Status: done)**

- **DocumentViewer exposed via forwardRef**: Use `useImperativeHandle` pattern for exposing methods
- **ChatPanel accepts onSourceClick**: Handler ready for integration, passes to ChatMessage
- **Split-view coordinates components**: Parent split-view wires up DocumentViewer ref with ChatPanel handler
- **Test patterns established**: 19 unit tests with mocking of react-pdf, follow patterns
- **MobileDocumentChatTabs has switchToDocument()**: For programmatic tab switching on mobile

**Key Integration Points:**
- Chat API already streams responses - need to add persistence before/after stream
- Conversation state needs to coordinate with streaming response handling
- New Chat should not interrupt active streaming (disable button while streaming)

**Files Created in Story 5.5:**
- `src/components/documents/document-viewer.tsx` - PDF viewer with highlight
- `__tests__/components/documents/document-viewer.test.tsx` - 19 tests

[Source: stories/5-5-document-viewer-with-highlight-navigation.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Story-5.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Acceptance-Criteria-Story-5.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Context-Window-Management] (10-message limit)
- [Source: docs/epics.md#Story-5.6-Conversation-History-Follow-up-Questions]
- [Source: docs/architecture.md#Data-Architecture] (conversations, chat_messages tables)
- [Source: docs/architecture.md#API-Response-Format] (error response patterns)
- [Source: docs/ux-design-specification.md#ChatMessage] (message display patterns)
- [Source: docs/ux-design-specification.md#Empty-State-Patterns] (empty states guide action)
- [Source: docs/ux-design-specification.md#Feedback-Patterns] (toast notifications)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/5-6-conversation-history-follow-up-questions.context.xml` (Generated: 2025-12-01)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Chat Service Extended** (`src/lib/chat/service.ts`):
   - Added `getConversationMessages()` for loading ALL messages (UI display)
   - Added `createNewConversation()` for New Chat feature
   - Added `truncateHistoryToTokenBudget()` for 6000-token max history
   - Added race condition handling in `getOrCreateConversation()` via unique constraint catch
   - Added token estimation constants (4 chars/token, 10 message limit)

2. **useConversation Hook Created** (`src/hooks/use-conversation.ts`):
   - Loads existing conversation and messages on mount
   - Handles empty state (no conversation yet)
   - Exposes `createNew()` for New Chat flow
   - Exposes `refetch()` for reloading after changes
   - Error handling with user-friendly messages

3. **useChat Hook Extended** (`src/hooks/use-chat.ts`):
   - Added `UseChatOptions` interface for initial state
   - Added sync effects to coordinate with useConversation
   - Passes conversationId to API for proper persistence

4. **ChatPanel Updated** (`src/components/chat/chat-panel.tsx`):
   - Integrated useConversation for loading history
   - Added loading skeleton (ChatLoadingSkeleton)
   - Added error state with retry (ChatErrorState)
   - Added New Chat button with MessageSquarePlus icon
   - Added confirmation dialog using shadcn Dialog
   - Updated empty state text: "Ask anything about this document"

5. **shadcn Tooltip Added** (`src/components/ui/tooltip.tsx`):
   - Installed via `npx shadcn@latest add tooltip`
   - Used for New Chat button hover tooltip

6. **Tests Added/Updated**:
   - `__tests__/lib/chat/service.test.ts` - 17 new tests for chat service
   - `__tests__/hooks/use-conversation.test.ts` - 7 new tests for hook
   - `__tests__/components/chat/chat-panel.test.tsx` - Updated existing + 11 new tests

### File List

**New Files:**
- `src/hooks/use-conversation.ts`
- `src/components/ui/tooltip.tsx`
- `__tests__/lib/chat/service.test.ts`
- `__tests__/hooks/use-conversation.test.ts`

**Modified Files:**
- `src/lib/chat/service.ts`
- `src/hooks/use-chat.ts`
- `src/components/chat/chat-panel.tsx`
- `__tests__/components/chat/chat-panel.test.tsx`

## Code Review Notes

<!-- To be filled by code review workflow -->

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-01 | Bob (Scrum Master) | Initial story draft via create-story workflow |
| 2025-12-01 | BMAD Team (Party Mode) | Enhanced with team review: added AC-5.6.11 (error handling), AC-5.6.12 (concurrent access), expanded tasks with specific test counts, added streaming buffer pattern, token budget management, race condition handling, API contract docs |
| 2025-12-01 | BMAD Context Workflow | Story context XML generated with 8 docs, 11 code artifacts, 12 constraints, 6 interfaces, 28 test ideas |
| 2025-12-01 | Amelia (Dev Agent) | Story 5.6 implementation complete. Added useConversation hook, extended chat service with token budget truncation, updated ChatPanel with New Chat button and confirmation dialog. 688 tests passing. |
