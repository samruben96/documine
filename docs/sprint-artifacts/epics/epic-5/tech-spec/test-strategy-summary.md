# Test Strategy Summary

## Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | RAG pipeline, confidence calculation, prompt building, Zod schemas | Vitest | 90%+ for core logic |
| Integration | Chat API endpoint, vector search, conversation CRUD | Vitest + Supabase local | All server actions |
| Component | Chat panel, message display, input handling, PDF viewer controls | Vitest + Testing Library | Key user interactions |
| E2E | Full question-answer flow with real PDF | Manual for MVP, Playwright later | Critical paths |

## Key Test Scenarios

**Chat Input (Story 5.2):**
- Empty message rejected
- Message at character limit accepted
- Message over limit rejected with error
- Enter sends, Shift+Enter adds newline
- Input disabled during streaming
- Suggested questions populate input on click

**Streaming Response (Story 5.3):**
- Response streams word-by-word
- Partial text visible during stream
- Confidence badge appears after stream completes
- Correct badge color for each confidence level
- "Not found" message when low confidence
- Error states render correctly (timeout, rate limit, generic)

**RAG Pipeline (Core):**
- Query embedding generated correctly (1536 dimensions)
- Vector search returns relevant chunks (mock test)
- Confidence calculated correctly from similarity scores
- Prompt includes document context and conversation history
- Sources extracted and formatted correctly

**Source Citations (Story 5.4):**
- Citation link renders with page number
- Multiple sources formatted correctly
- Clicking citation scrolls PDF viewer
- Highlight appears and fades after 3 seconds

**Conversation History (Story 5.6):**
- Messages persist to database
- History loads when returning to document
- New Chat creates new conversation
- Follow-up questions include context

**Responsive Design (Story 5.7):**
- Split view at desktop width
- Tabbed view at mobile width
- Touch targets meet 44x44px minimum
- Trust elements visible on all sizes

## Test Data

```typescript
// Test fixtures
const mockChunks: RetrievedChunk[] = [
  {
    id: 'chunk-1',
    content: 'The liability limit is $1,000,000 per occurrence.',
    pageNumber: 3,
    boundingBox: { x: 100, y: 200, width: 400, height: 50 },
    similarityScore: 0.92,
  },
  {
    id: 'chunk-2',
    content: 'Flood damage is excluded from this policy.',
    pageNumber: 7,
    boundingBox: null,
    similarityScore: 0.78,
  },
];

const mockConversation: Conversation = {
  id: 'conv-123',
  agencyId: 'agency-456',
  documentId: 'doc-789',
  userId: 'user-101',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-123',
    agencyId: 'agency-456',
    role: 'user',
    content: 'What is the liability limit?',
    sources: null,
    confidence: null,
    createdAt: new Date(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-123',
    agencyId: 'agency-456',
    role: 'assistant',
    content: 'According to page 3, the liability limit is $1,000,000 per occurrence.',
    sources: [mockChunks[0]],
    confidence: 'high',
    createdAt: new Date(),
  },
];
```

## Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| OpenAI Chat Completions | MSW or manual mock with streaming response |
| OpenAI Embeddings | Mock fixed 1536-dim vector response |
| Supabase Database | Supabase local for integration, mock for unit |
| Vector Search (pgvector) | Mock similarity query results |
| PDF.js | Mock document loading for component tests |

## SSE Streaming Test Approach

```typescript
// Testing streaming responses requires special handling
describe('Chat API streaming', () => {
  it('streams response tokens', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'doc-123', message: 'What is covered?' }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const events: StreamEvent[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        if (line === 'data: [DONE]') continue;
        const event = JSON.parse(line.slice(6)) as StreamEvent;
        events.push(event);
      }
    }

    // Verify events
    expect(events.some(e => e.type === 'text')).toBe(true);
    expect(events.some(e => e.type === 'confidence')).toBe(true);
    expect(events.some(e => e.type === 'done')).toBe(true);
  });
});
```

## Manual E2E Test Checklist

Before marking epic complete, manually verify with real insurance PDF:

- [ ] Upload a real insurance policy PDF (use test document from Epic 4)
- [ ] Ask: "What is the liability limit?" - verify relevant answer with citation
- [ ] Ask: "Is flood covered?" - verify answer mentions exclusions or coverage
- [ ] Click source citation - verify PDF scrolls and highlights
- [ ] Wait 3 seconds - verify highlight fades
- [ ] Ask follow-up: "Tell me more about that" - verify context maintained
- [ ] Click "New Chat" - verify conversation clears
- [ ] Ask question with no answer in document - verify "Not Found" badge
- [ ] Test on mobile device - verify tabbed interface works
- [ ] Test on tablet - verify split view with narrower panels
