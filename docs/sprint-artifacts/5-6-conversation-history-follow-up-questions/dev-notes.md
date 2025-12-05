# Dev Notes

## Conversation Database Schema

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

## Race Condition Handling Pattern

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

## Streaming Buffer Pattern for Message Persistence

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

## Token Budget Management

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

## Chat Service Interface

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

## Updated API Contract

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

## RAG Prompt with History

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

## Empty State Example Questions

```typescript
// Insurance-relevant example questions for empty state
const EXAMPLE_QUESTIONS = [
  "What are the coverage limits?",
  "Is flood damage covered?",
  "What's the deductible for property damage?",
];
```

## Analytics Events (Recommended)

```typescript
// Track conversation engagement patterns
analytics.track('conversation_started', { documentId, conversationId });
analytics.track('follow_up_question_asked', { conversationId, questionNumber });
analytics.track('new_chat_created', { documentId, previousConversationId });
```

## Project Structure Notes

- Chat service: `src/lib/chat/service.ts` (new)
- Conversation hook: `src/hooks/use-conversation.ts` (new)
- Existing types in `src/lib/chat/types.ts` - use Conversation, ChatMessage interfaces
- Chat API route: `src/app/api/chat/route.ts` (modify)
- ChatPanel: `src/components/chat/chat-panel.tsx` (modify)
- Document page: `src/app/(dashboard)/documents/[id]/page.tsx` (modify)

## Learnings from Previous Story

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

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Story-5.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Acceptance-Criteria-Story-5.6]
- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Context-Window-Management] (10-message limit)
- [Source: docs/epics.md#Story-5.6-Conversation-History-Follow-up-Questions]
- [Source: docs/architecture.md#Data-Architecture] (conversations, chat_messages tables)
- [Source: docs/architecture.md#API-Response-Format] (error response patterns)
- [Source: docs/ux-design-specification.md#ChatMessage] (message display patterns)
- [Source: docs/ux-design-specification.md#Empty-State-Patterns] (empty states guide action)
- [Source: docs/ux-design-specification.md#Feedback-Patterns] (toast notifications)
