# Epic Technical Specification: Document Q&A with Trust Transparency

Date: 2025-11-30
Author: Sam
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers docuMINE's core value proposition: the ability for users to ask natural language questions about their insurance documents and receive AI-powered answers with source citations and confidence indicators. This is the defining feature that differentiates docuMINE from generic AI tools - every answer is verifiable, building the trust that insurance agents require for client-facing work.

Building on the document processing infrastructure from Epic 4, this epic implements the conversational AI interface using a split-view layout (document + chat side-by-side), streaming responses via Server-Sent Events for perceived speed, the Trust-Transparent AI Response pattern with source citations and confidence badges, and full conversation history persistence. The implementation uses OpenAI GPT-4o for response generation, pgvector for semantic search retrieval, and follows the UX specification's "Invisible Technology" design philosophy where agents can ask questions and get verified answers in seconds.

This epic addresses the critical user journey: an agent asks "Is flood covered?" and gets the answer in seconds with a direct link to the exact policy language - speed they can feel, accuracy they can verify.

## Objectives and Scope

**In Scope:**
- Split-view layout with Document Viewer and Chat Panel side-by-side
- Natural language query input with suggested questions for empty conversations
- Streaming AI responses via Server-Sent Events (text appears word-by-word)
- Trust elements on every response: Confidence badges (High Confidence / Needs Review / Not Found) and Source citations
- Source citation links that scroll to and highlight the exact passage in the document
- PDF document viewer with text layer, page navigation, zoom controls, and highlight support
- Conversation history persisted per document in database
- Follow-up questions with context from previous messages (up to 10 messages)
- Responsive design: split view on desktop/tablet, tabbed interface on mobile
- RAG (Retrieval-Augmented Generation) pipeline using pgvector semantic search
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

**Out of Scope:**
- Quote comparison (Epic 6)
- Multi-document Q&A (asking across multiple documents simultaneously)
- Document editing or annotation
- Voice input
- Export conversation history
- AI-generated document summaries (post-MVP feature)
- Custom confidence thresholds per agency
- Conversation sharing between users
- Real-time collaborative chat

## System Architecture Alignment

**Components Referenced:**
- OpenAI GPT-4o for response generation with function calling
- OpenAI text-embedding-3-small for query embeddings (1536 dimensions)
- Supabase PostgreSQL with pgvector for semantic similarity search
- Supabase Realtime for potential future live updates (not used in MVP)
- Next.js 16 App Router for UI and streaming API routes
- react-pdf / pdfjs-dist for PDF rendering in document viewer
- shadcn/ui components for chat interface elements

**Architecture Constraints:**
- All conversations and messages scoped by `agency_id` via RLS policies (same isolation as documents)
- Streaming responses via Server-Sent Events from Next.js API route
- Query embeddings generated on-demand (not cached) for freshness
- RAG retrieval returns top 5 chunks filtered by document_id and agency_id
- Confidence scoring based on cosine similarity of top chunk (≥0.85 = High, 0.60-0.84 = Needs Review, <0.60 = Not Found)
- Source citations include page number and text excerpt for verification
- PDF viewer requires pdfjs worker loaded from CDN or bundled

**Key Decisions Applied:**
- ADR-003: Streaming AI Responses for perceived instant response
- ADR-004: Row Level Security for conversation isolation
- ADR-005: OpenAI as Sole AI Provider for consistent accuracy
- Novel Pattern: Trust-Transparent AI Responses (from Architecture doc)
- UX Principle: "Speed is a feature" - streaming text, skeleton loading

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Chat Panel | Conversation UI with message display and input | Document ID, User ID | Chat messages, user input | `src/components/chat/chat-panel.tsx` |
| Chat Message | Individual message display with trust elements | Message data | Rendered message with badges/citations | `src/components/chat/chat-message.tsx` |
| Chat Input | Text input with send functionality | None | User message text | `src/components/chat/chat-input.tsx` |
| Confidence Badge | Visual confidence indicator | Confidence level | Styled badge component | `src/components/chat/confidence-badge.tsx` |
| Source Citation | Clickable source reference | Source data | Citation link | `src/components/chat/source-citation.tsx` |
| Document Viewer | PDF rendering with highlights | Document ID, highlight coords | Rendered PDF | `src/components/documents/document-viewer.tsx` |
| Split View Layout | Side-by-side document + chat | Children components | Layout container | `src/components/layout/split-view.tsx` |
| Chat Service | Conversation CRUD operations | Conversation data | Database records | `src/lib/chat/service.ts` |
| RAG Pipeline | Retrieval-augmented generation | Query, document ID | AI response with sources | `src/lib/chat/rag.ts` |
| Embeddings Service | Query embedding generation | Query text | 1536-dim vector | `src/lib/openai/embeddings.ts` |
| Vector Search | Semantic similarity search | Query vector, document ID | Ranked chunks | `src/lib/chat/vector-search.ts` |
| Chat API Route | Streaming chat endpoint | Message, document ID | SSE stream | `src/app/api/chat/route.ts` |
| useChat Hook | Client-side chat state management | Document ID | Messages, send function | `src/hooks/use-chat.ts` |

### Data Models and Contracts

**Existing Tables Used (from Epic 1):**

```sql
-- Conversations table (already exists)
-- Structure: id, agency_id, document_id, user_id, created_at, updated_at

-- Chat messages table (already exists)
-- Structure: id, conversation_id, agency_id, role, content, sources, confidence, created_at

-- Document chunks table (from Epic 4)
-- Structure: id, document_id, agency_id, content, page_number, chunk_index, bounding_box, embedding vector(1536), created_at
```

**No Schema Changes Required** - Epic 1 schema already includes all needed tables for conversations and messages.

**TypeScript Types:**

```typescript
// src/types/chat.ts

export interface Conversation {
  id: string;
  agencyId: string;
  documentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  agencyId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceCitation[] | null;
  confidence: ConfidenceLevel | null;
  createdAt: Date;
}

export interface SourceCitation {
  documentId: string;
  pageNumber: number;
  text: string;  // The exact quoted passage
  boundingBox?: BoundingBox;
  chunkId: string;
  similarityScore: number;
}

export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Streaming response types
export interface StreamEvent {
  type: 'text' | 'source' | 'confidence' | 'done' | 'error';
  content: string | SourceCitation | ConfidenceLevel | DonePayload | ErrorPayload;
}

export interface DonePayload {
  conversationId: string;
  messageId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// RAG types
export interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber: number;
  boundingBox: BoundingBox | null;
  similarityScore: number;
}

export interface RAGContext {
  chunks: RetrievedChunk[];
  topScore: number;
  confidence: ConfidenceLevel;
}

// Chat request/response
export interface ChatRequest {
  documentId: string;
  message: string;
  conversationId?: string;
}

// Zod Schemas
export const chatRequestSchema = z.object({
  documentId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  conversationId: z.string().uuid().optional(),
});

export const sourceSchema = z.object({
  documentId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  text: z.string(),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  chunkId: z.string().uuid(),
  similarityScore: z.number().min(0).max(1),
});
```

### APIs and Interfaces

**Chat API Route (Streaming):**

```typescript
// POST /api/chat - Streaming chat endpoint
// Request: { documentId: string; message: string; conversationId?: string }
// Response: Server-Sent Events stream

// Stream event format:
data: {"type": "text", "content": "The liability"}
data: {"type": "text", "content": " limit is"}
data: {"type": "text", "content": " $1,000,000"}
data: {"type": "source", "content": {"pageNumber": 3, "text": "...", "chunkId": "..."}}
data: {"type": "confidence", "content": "high"}
data: {"type": "done", "content": {"conversationId": "...", "messageId": "..."}}
data: [DONE]

// Error event:
data: {"type": "error", "content": {"code": "RATE_LIMIT", "message": "Too many requests"}}
```

**Conversation API Routes:**

```typescript
// GET /api/conversations?documentId={id} - Get conversation for document
// Response: { data: Conversation & { messages: ChatMessage[] }; error: null }

// POST /api/conversations - Create new conversation
// Request: { documentId: string }
// Response: { data: Conversation; error: null }

// DELETE /api/conversations/[id] - Delete conversation (clear history)
// Response: { data: { deleted: true }; error: null }
```

**Document URL API (for PDF viewer):**

```typescript
// GET /api/documents/[id]/url - Get signed URL for PDF viewing
// Response: { data: { url: string; expiresAt: string }; error: null }
// Note: Already implemented in Epic 4
```

**Server Actions:**

```typescript
// src/app/(dashboard)/documents/[id]/actions.ts

export async function sendMessage(
  documentId: string,
  message: string,
  conversationId?: string
): Promise<ReadableStream> {
  // 1. Validate input
  // 2. Get or create conversation
  // 3. Save user message
  // 4. Generate query embedding
  // 5. Retrieve relevant chunks via vector search
  // 6. Build RAG prompt with context
  // 7. Stream GPT-4o response
  // 8. Extract sources and confidence
  // 9. Save assistant message
  // 10. Return stream
}

export async function getConversation(
  documentId: string
): Promise<{ conversation: Conversation; messages: ChatMessage[] } | null> {
  // Get latest conversation for document, or null if none
}

export async function clearConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  // Delete conversation and all messages
}
```

### Workflows and Sequencing

**Chat Query Flow:**

```
User types question and presses Enter
    │
    ├─> 1. Client-side validation
    │       - Check message not empty
    │       - Check message ≤ 1000 characters
    │       - If invalid: show inline error
    │
    ├─> 2. Optimistic UI update
    │       - Add user message to conversation (right-aligned bubble)
    │       - Show "Thinking..." indicator (animated dots)
    │       - Disable input while waiting
    │
    ├─> 3. POST to /api/chat
    │       - Payload: { documentId, message, conversationId? }
    │       - Open SSE connection
    │
    ├─> 4. Server: Validate and prepare
    │       - Validate request with Zod schema
    │       - Verify document exists and user has access (RLS)
    │       - Get or create conversation for this document
    │       - Save user message to database
    │
    ├─> 5. Server: Generate query embedding
    │       POST to OpenAI embeddings API
    │       - Model: text-embedding-3-small
    │       - Returns: 1536-dimension vector
    │
    ├─> 6. Server: Vector similarity search
    │       SELECT * FROM document_chunks
    │       WHERE document_id = $1
    │       ORDER BY embedding <=> $query_embedding
    │       LIMIT 5
    │       - Returns: top 5 most similar chunks with scores
    │
    ├─> 7. Server: Determine confidence
    │       - If top_score >= 0.85: "high"
    │       - If top_score >= 0.60: "needs_review"
    │       - If top_score < 0.60 or no chunks: "not_found"
    │
    ├─> 8. Server: Build RAG prompt
    │       - System prompt: Insurance document assistant persona
    │       - Include conversation history (last 10 messages)
    │       - Include retrieved chunks with page numbers
    │       - Instruction: cite sources, express uncertainty
    │
    ├─> 9. Server: Stream GPT-4o response
    │       POST to OpenAI chat completions (stream: true)
    │       - Model: gpt-4o
    │       - For each token: emit SSE text event
    │
    ├─> 10. Client: Process stream events
    │        - type: "text" → append to message content
    │        - type: "source" → store source citation
    │        - type: "confidence" → store confidence level
    │        - type: "done" → finalize message display
    │        - type: "error" → show error toast
    │
    ├─> 11. Server: Save assistant message
    │        INSERT INTO chat_messages
    │        (conversation_id, agency_id, role, content, sources, confidence)
    │        VALUES ($1, $2, 'assistant', $3, $4, $5)
    │
    └─> 12. Client: Display complete response
            - Show full message text
            - Show confidence badge
            - Show source citation links
            - Re-enable input for follow-up
```

**Source Citation Click Flow:**

```
User clicks source citation link
    │
    ├─> 1. Get source data
    │       - pageNumber, boundingBox, text
    │
    ├─> 2. Scroll document viewer
    │       - Call documentViewer.scrollToPage(pageNumber)
    │       - Smooth scroll animation
    │
    ├─> 3. Apply highlight
    │       - If boundingBox available:
    │           Draw semi-transparent yellow overlay at coords
    │       - If only page number:
    │           Flash page border/background
    │
    ├─> 4. Highlight timeout
    │       - Start 3-second timer
    │       - Fade out highlight gradually
    │       - User can click elsewhere to dismiss early
    │
    └─> 5. Mobile behavior
            - Switch to Document tab
            - Then scroll and highlight
```

**Conversation History Management:**

```
User returns to document
    │
    ├─> 1. Load conversation
    │       SELECT * FROM conversations
    │       WHERE document_id = $1 AND user_id = $2
    │       ORDER BY updated_at DESC
    │       LIMIT 1
    │
    ├─> 2. Load messages
    │       SELECT * FROM chat_messages
    │       WHERE conversation_id = $1
    │       ORDER BY created_at ASC
    │
    ├─> 3. Display history
    │       - Render all previous messages
    │       - Scroll to bottom
    │
    ├─> 4. New Chat action
    │       - User clicks "New Chat"
    │       - Confirmation: "Start a new conversation?"
    │       - Create new conversation record
    │       - Clear chat panel
    │
    └─> 5. Context for follow-ups
            - Include last 10 messages in RAG prompt
            - Enables "Tell me more" style questions
```

**RAG Prompt Template:**

```typescript
const systemPrompt = `You are a helpful insurance document assistant for docuMINE.
Your role is to answer questions about the uploaded insurance policy document.

CRITICAL RULES:
1. ONLY answer based on the provided document context
2. ALWAYS cite the page number when referencing information
3. If information is not in the document, say "I couldn't find that information in this document"
4. Be conversational but professional - like a knowledgeable coworker
5. Express uncertainty when the document is ambiguous
6. Never invent or hallucinate information

Use language like:
- "According to page X, ..."
- "The document states that..."
- "I found this on page X..."
- "I'm not seeing information about that in this document"`;

const contextPrompt = `
DOCUMENT CONTEXT (from the uploaded policy):
${chunks.map(c => `[Page ${c.pageNumber}]: ${c.content}`).join('\n\n')}

CONVERSATION HISTORY:
${previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

USER QUESTION: ${userMessage}

Please answer the question based on the document context. Cite specific page numbers.`;
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| First token latency | < 500ms | OpenAI streaming API starts immediately | NFR3 |
| Full response time | < 5 seconds for typical queries | GPT-4o with streaming, ~100 tokens/sec | NFR3 |
| Vector search latency | < 100ms | pgvector IVFFlat index, top 5 chunks | General |
| Query embedding generation | < 200ms | OpenAI text-embedding-3-small | General |
| PDF viewer initial load | < 2 seconds | react-pdf with lazy worker loading | General |
| Page navigation | < 100ms | Virtualized page rendering | General |
| Highlight scroll + render | < 300ms | Smooth scroll + CSS animation | UX Spec |
| Conversation history load | < 500ms | Single query with message join, indexed | General |
| Message persistence | < 200ms | Async save, doesn't block UI | General |

**Performance Optimizations:**
- Streaming responses provide perceived instant feedback
- Query embeddings generated on-demand (not cached) - freshness over speed
- PDF worker loaded from CDN to reduce bundle size
- Conversation messages loaded in single query with proper indexes
- Optimistic UI updates for user messages (appear instantly)
- Skeleton loading states per UX spec (no spinners > 200ms)

### Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data encrypted in transit | TLS 1.3 via Supabase/Vercel | NFR6 |
| Data encrypted at rest | AES-256 via Supabase managed | NFR7 |
| Conversation isolation | RLS policies on conversations and chat_messages tables | NFR10 |
| Document access verification | Verify document.agency_id matches user's agency before RAG | NFR10 |
| API input validation | Zod schemas validate all chat requests | Security best practice |
| Message length limits | 1000 character max per message | DoS prevention |
| Rate limiting | 20 messages per minute per user | Abuse prevention |
| No PII in logs | Sanitize user messages before logging | Privacy |
| OpenAI API key protection | Server-side only, never exposed to client | Security best practice |

**RLS Policies for Chat:**

```sql
-- Conversations scoped to agency
CREATE POLICY "Conversations scoped to agency" ON conversations
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Chat messages scoped to agency
CREATE POLICY "Messages scoped to agency" ON chat_messages
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can only query their agency's document chunks
CREATE POLICY "Chunks scoped to agency" ON document_chunks
  FOR SELECT USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

### Reliability/Availability

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Chat API availability | 99.9% | Vercel Edge + OpenAI SLA | NFR22 |
| Graceful degradation | Informative errors | Clear error messages when AI unavailable | FR34 |
| OpenAI timeout handling | 30 second timeout | Abort and show retry option | General |
| Conversation persistence | No message loss | Save to DB after each exchange | General |
| PDF viewer fallback | Show error state | If PDF fails to load, show retry option | FR34 |

**Error Recovery:**

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| OpenAI API timeout | 30s without response | Show "Taking longer than expected..." then error with retry |
| OpenAI rate limit (429) | HTTP 429 response | Show "Too many requests. Please wait a moment." |
| Vector search returns no chunks | Empty result set | Return "not_found" confidence, suggest rephrasing |
| Document not found | 404 from document query | Redirect to /documents with error toast |
| Stream connection dropped | SSE disconnect | Show partial response + "Connection lost. Retry?" |
| Invalid document ID | Zod validation fail | Return 400 with clear error message |

### Observability

| Signal | Type | Implementation |
|--------|------|----------------|
| Chat query received | Event log | `log.info('Chat query', { documentId, messageLength, userId })` |
| RAG retrieval complete | Event log | `log.info('RAG retrieval', { documentId, chunksRetrieved, topScore, confidence })` |
| OpenAI request sent | Event log | `log.info('OpenAI request', { model, promptTokens })` |
| Response streamed | Event log | `log.info('Response complete', { documentId, responseTokens, duration })` |
| Chat error | Error log | `log.error('Chat error', error, { documentId, step })` |
| Vector search latency | Metric | Track query time in ms |
| OpenAI latency | Metric | Track time-to-first-token and total duration |
| Confidence distribution | Metric | Track high/needs_review/not_found ratios |

**Key Metrics to Track:**
- Queries per day/user/agency
- Average response time (first token, complete)
- Confidence level distribution (are users getting useful answers?)
- Error rate by type (timeout, rate limit, not found)
- Conversation length (messages per conversation)
- Source citation click rate (are users verifying?)

## Dependencies and Integrations

### NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database queries, RLS-enforced access |
| @supabase/ssr | ^0.7.0 | Server-side Supabase client for API routes |
| openai | ^6.9.1 | GPT-4o chat completions + embeddings |
| zod | ^4.1.13 | Request validation (use `.issues` not `.errors`) |
| sonner | ^2.0.7 | Toast notifications for errors |
| lucide-react | ^0.554.0 | Icons (Send, MessageSquare, FileText, etc.) |
| next | 16.0.4 | App Router with streaming response support |

### New Dependencies Required

| Package | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| react-pdf | ^9.2.1 | PDF rendering in document viewer | `npm install react-pdf` |
| pdfjs-dist | ^4.10.38 | PDF.js worker for react-pdf | `npm install pdfjs-dist` |

**Installation Command:**
```bash
npm install react-pdf pdfjs-dist
```

**Note:** react-pdf requires PDF.js worker configuration. Add to `next.config.ts`:
```typescript
// next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};
```

### External Services

| Service | Purpose | API Documentation |
|---------|---------|-------------------|
| OpenAI GPT-4o | Response generation with streaming | https://platform.openai.com/docs/api-reference/chat |
| OpenAI Embeddings | Query embedding (text-embedding-3-small) | https://platform.openai.com/docs/guides/embeddings |
| Supabase PostgreSQL | Conversations, messages, vector search | https://supabase.com/docs/guides/database |
| pgvector | Semantic similarity search | https://github.com/pgvector/pgvector |

### Environment Variables

**Already Configured (from previous epics):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**No new environment variables required for Epic 5.**

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Chat Panel  │  │ Chat Input   │  │   Document Viewer     │  │
│  │  (messages)  │  │ (useChat)    │  │   (react-pdf)         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                      │               │
│         └────────────┬────┴──────────────────────┘               │
│                      │                                           │
│              ┌───────▼───────┐                                   │
│              │ /api/chat     │ ◄── Streaming SSE endpoint        │
│              │ (POST)        │                                   │
│              └───────┬───────┘                                   │
└──────────────────────┼──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Supabase   │ │  OpenAI     │ │  OpenAI     │
│  PostgreSQL │ │  Embeddings │ │  GPT-4o     │
│  +pgvector  │ │  API        │ │  Streaming  │
└─────────────┘ └─────────────┘ └─────────────┘
      │
      │ Vector similarity search:
      │ SELECT * FROM document_chunks
      │ WHERE document_id = $1
      │ ORDER BY embedding <=> $query_vector
      │ LIMIT 5
      │
      └──► Returns top 5 chunks with similarity scores
```

### Database Tables Used

**From Epic 1 (no changes needed):**
- `conversations` - Stores conversation sessions per document
- `chat_messages` - Stores individual messages with sources/confidence
- `document_chunks` - Vector embeddings for RAG retrieval (from Epic 4)
- `documents` - Document metadata for access verification

**Indexes Required (already created in Epic 1):**
- `idx_conversations_document` on conversations(document_id)
- `idx_chat_messages_conversation` on chat_messages(conversation_id)
- `idx_document_chunks_embedding` using IVFFlat for vector search
- `idx_document_chunks_document` on document_chunks(document_id)

## Acceptance Criteria (Authoritative)

### Story 5.1: Chat Interface Layout (Split View)

1. **AC-5.1.1:** Document view page (`/documents/[id]`) displays split-view layout with Document Viewer on left (min 40% width) and Chat Panel on right (360px fixed width on desktop)
2. **AC-5.1.2:** Chat Panel contains scrollable conversation history area and fixed input area at bottom
3. **AC-5.1.3:** Input area displays placeholder text "Ask a question..."
4. **AC-5.1.4:** Send button (arrow icon) is visible next to input
5. **AC-5.1.5:** Pressing Enter sends message (Shift+Enter inserts newline)
6. **AC-5.1.6:** Input automatically receives focus when document page loads
7. **AC-5.1.7:** On tablet (640-1024px): both panels visible, chat panel 40% width, sidebar collapsed
8. **AC-5.1.8:** On mobile (<640px): tabbed interface with [Document] and [Chat] tabs
9. **AC-5.1.9:** Mobile tabs show current view indicator
10. **AC-5.1.10:** Layout uses Trustworthy Slate color theme (#475569 primary, system font stack)

### Story 5.2: Natural Language Query Input

11. **AC-5.2.1:** Input field accepts free-form natural language text
12. **AC-5.2.2:** Input expands to accommodate multi-line questions (up to 4 visible lines)
13. **AC-5.2.3:** Character count displays when approaching 1000 character limit
14. **AC-5.2.4:** Messages over 1000 characters are rejected with inline error
15. **AC-5.2.5:** Empty conversations show 3 suggested questions: "What's the coverage limit?", "Are there any exclusions?", "What's the deductible?"
16. **AC-5.2.6:** Clicking a suggested question fills the input field
17. **AC-5.2.7:** After sending: input clears, user message appears (right-aligned, primary color bubble)
18. **AC-5.2.8:** "Thinking..." indicator with animated dots appears while waiting for response
19. **AC-5.2.9:** Input is disabled while response is streaming

### Story 5.3: AI Response with Streaming & Trust Elements

20. **AC-5.3.1:** Response text streams in word-by-word (approximately 50-100ms between words)
21. **AC-5.3.2:** User can read text as it appears (not waiting for complete response)
22. **AC-5.3.3:** After streaming completes, confidence badge appears below response
23. **AC-5.3.4:** High Confidence badge: green background (#d1fae5), checkmark icon (✓), text "High Confidence"
24. **AC-5.3.5:** Needs Review badge: amber background (#fef3c7), warning icon (⚠), text "Needs Review"
25. **AC-5.3.6:** Not Found badge: gray background (#f1f5f9), circle icon (○), text "Not Found"
26. **AC-5.3.7:** Confidence thresholds: ≥0.85 similarity = High, 0.60-0.84 = Needs Review, <0.60 = Not Found
27. **AC-5.3.8:** "Not Found" responses include message: "I couldn't find information about that in this document."
28. **AC-5.3.9:** API timeout (>30s) shows: "I'm having trouble processing that. Please try again." with Retry button
29. **AC-5.3.10:** Rate limit error shows: "Too many requests. Please wait a moment."
30. **AC-5.3.11:** Generic errors show: "Something went wrong. Please try again." with Retry button

### Story 5.4: Source Citation Display

31. **AC-5.4.1:** Source citation link appears after confidence badge: "View in document →" or "Page X →"
32. **AC-5.4.2:** Citation link styled subtly (small text, muted color, underline on hover)
33. **AC-5.4.3:** Multiple sources show as: "Sources: Page 3, Page 7, Page 12" (each page is a link)
34. **AC-5.4.4:** If more than 3 sources, show expandable "View X sources"
35. **AC-5.4.5:** Source data includes: documentId, pageNumber, text excerpt, chunkId, similarityScore
36. **AC-5.4.6:** Source citations are saved with assistant message in database (sources JSONB column)

### Story 5.5: Document Viewer with Highlight Navigation

37. **AC-5.5.1:** PDF renders with text layer enabled (text is selectable)
38. **AC-5.5.2:** Page navigation controls: previous/next buttons, page number input, "Page X of Y" display
39. **AC-5.5.3:** Zoom controls: fit-to-width button, zoom in (+), zoom out (-)
40. **AC-5.5.4:** Clicking source citation scrolls document viewer to target page (smooth scroll)
41. **AC-5.5.5:** Source passage highlighted with yellow background (#fef08a)
42. **AC-5.5.6:** Highlight includes slight padding around text
43. **AC-5.5.7:** Highlight fades out after 3 seconds (gradual fade animation)
44. **AC-5.5.8:** User can click elsewhere to dismiss highlight early
45. **AC-5.5.9:** If only page number available (no bounding box): page border flashes with subtle pulse
46. **AC-5.5.10:** On mobile: clicking citation switches to Document tab, then scrolls to source

### Story 5.6: Conversation History & Follow-up Questions

47. **AC-5.6.1:** Conversation history visible in scrollable chat panel
48. **AC-5.6.2:** Conversations persisted to database (conversations + chat_messages tables)
49. **AC-5.6.3:** Each document has its own conversation (conversation.document_id)
50. **AC-5.6.4:** Returning to document shows previous conversation
51. **AC-5.6.5:** Follow-up questions understand context: "Tell me more", "What about that?" work correctly
52. **AC-5.6.6:** Last 10 messages included in RAG prompt for context
53. **AC-5.6.7:** "New Chat" button visible in chat panel header
54. **AC-5.6.8:** Clicking "New Chat" shows confirmation: "Start a new conversation?"
55. **AC-5.6.9:** Confirming "New Chat" creates new conversation record, clears chat panel
56. **AC-5.6.10:** Old conversations remain in database (not deleted, just new one created)

### Story 5.7: Responsive Chat Experience

57. **AC-5.7.1:** Desktop (>1024px): Split view with 360px chat panel
58. **AC-5.7.2:** Tablet (640-1024px): Split view with narrower panels, sidebar hamburger menu
59. **AC-5.7.3:** Mobile (<640px): Tabbed [Document] | [Chat] interface
60. **AC-5.7.4:** Mobile tabs can be switched by tapping
61. **AC-5.7.5:** All touch targets minimum 44x44px
62. **AC-5.7.6:** Mobile chat input fixed at bottom of screen
63. **AC-5.7.7:** Trust elements (confidence badges, citations) display on all screen sizes
64. **AC-5.7.8:** Streaming response feels identical across devices
65. **AC-5.7.9:** Document remains readable at mobile zoom levels
66. **AC-5.7.10:** Tooltips show on tap (not hover) for touch devices

## Traceability Mapping

| AC | FR | Spec Section | Component(s)/API(s) | Test Idea |
|----|-----|--------------|---------------------|-----------|
| AC-5.1.1 | FR13 | Chat Layout | `split-view.tsx`, `/documents/[id]/page.tsx` | Measure panel widths at desktop viewport |
| AC-5.1.2 | FR13 | Chat Layout | `chat-panel.tsx` | Verify scroll on long conversations |
| AC-5.1.3 | FR13 | Chat Layout | `chat-input.tsx` | Check placeholder text renders |
| AC-5.1.4 | FR13 | Chat Layout | `chat-input.tsx` | Verify send button visible and clickable |
| AC-5.1.5 | FR13 | Chat Layout | `chat-input.tsx` | Press Enter, verify send; Shift+Enter verify newline |
| AC-5.1.6 | FR13 | Chat Layout | `chat-input.tsx` | Page load, verify input has focus |
| AC-5.1.7 | FR32 | Responsive | `split-view.tsx` | Test at 800px viewport width |
| AC-5.1.8 | FR32 | Responsive | `split-view.tsx` | Test at 500px viewport width |
| AC-5.1.9 | FR32 | Responsive | `split-view.tsx` | Verify tab indicator shows active tab |
| AC-5.1.10 | FR32 | Responsive | Global styles | Verify color values in computed styles |
| AC-5.2.1 | FR13 | Query Input | `chat-input.tsx` | Type various questions, verify accepted |
| AC-5.2.2 | FR13 | Query Input | `chat-input.tsx` | Type 4+ lines, verify expansion |
| AC-5.2.3 | FR13 | Query Input | `chat-input.tsx` | Type 950+ chars, verify counter appears |
| AC-5.2.4 | FR13 | Query Input | `chat-input.tsx` | Type 1001+ chars, verify error |
| AC-5.2.5 | FR13 | Query Input | `chat-panel.tsx` | New document, verify suggestions display |
| AC-5.2.6 | FR13 | Query Input | `chat-panel.tsx` | Click suggestion, verify input populated |
| AC-5.2.7 | FR13 | Query Input | `chat-message.tsx` | Send message, verify bubble styling |
| AC-5.2.8 | FR13 | Query Input | `chat-panel.tsx` | Send message, verify thinking indicator |
| AC-5.2.9 | FR13 | Query Input | `chat-input.tsx` | During stream, verify input disabled |
| AC-5.3.1 | FR14 | Streaming | `/api/chat`, `useChat.ts` | Time between tokens during stream |
| AC-5.3.2 | FR14 | Streaming | `chat-message.tsx` | Verify partial text visible during stream |
| AC-5.3.3 | FR16 | Trust Elements | `chat-message.tsx` | Verify badge appears after stream ends |
| AC-5.3.4 | FR16 | Trust Elements | `confidence-badge.tsx` | High confidence, verify exact colors |
| AC-5.3.5 | FR16 | Trust Elements | `confidence-badge.tsx` | Needs review, verify exact colors |
| AC-5.3.6 | FR16 | Trust Elements | `confidence-badge.tsx` | Not found, verify exact colors |
| AC-5.3.7 | FR16 | Trust Elements | `rag.ts` | Unit test confidence calculation |
| AC-5.3.8 | FR19 | Not Found | `chat-message.tsx` | Mock low-score response, verify message |
| AC-5.3.9 | FR34 | Error Handling | `useChat.ts` | Mock timeout, verify error UI + retry |
| AC-5.3.10 | FR34 | Error Handling | `useChat.ts` | Mock 429, verify error message |
| AC-5.3.11 | FR34 | Error Handling | `useChat.ts` | Mock 500, verify generic error + retry |
| AC-5.4.1 | FR15 | Citations | `source-citation.tsx` | Verify citation renders with page number |
| AC-5.4.2 | FR15 | Citations | `source-citation.tsx` | Check computed styles for subtle appearance |
| AC-5.4.3 | FR15 | Citations | `source-citation.tsx` | Response with 3 sources, verify format |
| AC-5.4.4 | FR15 | Citations | `source-citation.tsx` | Response with 5 sources, verify expandable |
| AC-5.4.5 | FR15 | Citations | `/api/chat` | Verify source data structure in response |
| AC-5.4.6 | FR15 | Citations | `chat_messages` table | Query DB, verify sources JSONB populated |
| AC-5.5.1 | FR17 | PDF Viewer | `document-viewer.tsx` | Select text in PDF, verify works |
| AC-5.5.2 | FR17 | PDF Viewer | `document-viewer.tsx` | Click next/prev, verify page changes |
| AC-5.5.3 | FR17 | PDF Viewer | `document-viewer.tsx` | Click zoom controls, verify scale changes |
| AC-5.5.4 | FR17 | PDF Viewer | `document-viewer.tsx` | Click citation, verify smooth scroll |
| AC-5.5.5 | FR17 | PDF Viewer | `document-viewer.tsx` | Verify highlight color is #fef08a |
| AC-5.5.6 | FR17 | PDF Viewer | `document-viewer.tsx` | Verify highlight has padding |
| AC-5.5.7 | FR17 | PDF Viewer | `document-viewer.tsx` | Wait 3s, verify highlight fades |
| AC-5.5.8 | FR17 | PDF Viewer | `document-viewer.tsx` | Click elsewhere, verify dismiss |
| AC-5.5.9 | FR17 | PDF Viewer | `document-viewer.tsx` | Citation without bbox, verify page flash |
| AC-5.5.10 | FR17, FR32 | PDF Viewer | `document-viewer.tsx` | Mobile: click citation, verify tab switch |
| AC-5.6.1 | FR18 | Conversation | `chat-panel.tsx` | Multiple messages, verify scroll |
| AC-5.6.2 | FR18 | Conversation | DB tables | Query conversations and chat_messages |
| AC-5.6.3 | FR18 | Conversation | `conversations` table | Verify document_id foreign key |
| AC-5.6.4 | FR18 | Conversation | `getConversation()` | Return to doc, verify history loads |
| AC-5.6.5 | FR18 | Conversation | `/api/chat`, RAG prompt | Ask "tell me more", verify context used |
| AC-5.6.6 | FR18 | Conversation | `rag.ts` | Verify prompt includes last 10 messages |
| AC-5.6.7 | FR18 | Conversation | `chat-panel.tsx` | Verify New Chat button visible |
| AC-5.6.8 | FR18 | Conversation | `chat-panel.tsx` | Click New Chat, verify confirmation modal |
| AC-5.6.9 | FR18 | Conversation | `clearConversation()` | Confirm, verify new conversation created |
| AC-5.6.10 | FR18 | Conversation | DB | After new chat, query old conversation exists |
| AC-5.7.1 | FR32 | Responsive | `split-view.tsx` | Test at 1200px viewport |
| AC-5.7.2 | FR32 | Responsive | `split-view.tsx` | Test at 800px viewport |
| AC-5.7.3 | FR32 | Responsive | `split-view.tsx` | Test at 500px viewport |
| AC-5.7.4 | FR32 | Responsive | `split-view.tsx` | Tap tabs, verify switch |
| AC-5.7.5 | FR32 | Responsive | All components | Measure touch targets |
| AC-5.7.6 | FR32 | Responsive | `chat-input.tsx` | Mobile viewport, verify fixed bottom |
| AC-5.7.7 | FR32 | Responsive | `chat-message.tsx` | Mobile viewport, verify trust elements |
| AC-5.7.8 | FR32 | Responsive | `useChat.ts` | Test streaming on mobile device |
| AC-5.7.9 | FR32 | Responsive | `document-viewer.tsx` | Mobile zoom, verify readable |
| AC-5.7.10 | FR32 | Responsive | Tooltips | Tap on mobile, verify tooltip shows |

### FR Coverage Summary

| FR | Description | Stories | ACs | Status |
|----|-------------|---------|-----|--------|
| FR13 | Natural language Q&A | 5.1, 5.2 | AC-5.1.1 to AC-5.2.9 | ✓ Covered |
| FR14 | Extract answers from documents | 5.3 | AC-5.3.1, AC-5.3.2 | ✓ Covered |
| FR15 | Source citations on answers | 5.4 | AC-5.4.1 to AC-5.4.6 | ✓ Covered |
| FR16 | Confidence indicators | 5.3 | AC-5.3.3 to AC-5.3.7 | ✓ Covered |
| FR17 | Click-to-view source in document | 5.5 | AC-5.5.1 to AC-5.5.10 | ✓ Covered |
| FR18 | Follow-up questions (conversation) | 5.6 | AC-5.6.1 to AC-5.6.10 | ✓ Covered |
| FR19 | Clear "not found" responses | 5.3 | AC-5.3.8 | ✓ Covered |
| FR32 | Responsive design | 5.1, 5.7 | AC-5.1.7 to AC-5.1.10, AC-5.7.* | ✓ Covered |
| FR34 | Clear error messages | 5.3 | AC-5.3.9 to AC-5.3.11 | ✓ Covered |

**Coverage: 9/9 FRs (100%)**

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R1 | OpenAI API rate limits during high usage | Users get rate limit errors | Medium | Rate limiting on our side (20 msg/min), show clear error message, implement backoff |
| R2 | Vector search returns irrelevant chunks | Wrong answers despite high confidence | Medium | Tune chunk size/overlap in Epic 4, test with real insurance PDFs, adjust retrieval count |
| R3 | Confidence thresholds produce false positives | Users trust wrong answers | Medium | Test thresholds with diverse queries, consider user feedback mechanism post-MVP |
| R4 | PDF.js worker loading performance | Slow initial document render | Medium | Lazy load worker, skeleton loading state, consider CDN-hosted worker |
| R5 | Streaming connection dropped on mobile | Incomplete responses | Low | Detect disconnect, show partial response + retry option |
| R6 | OpenAI model changes affect response quality | Inconsistent user experience | Low | Pin to specific model version (gpt-4o-2024-05-13), test before upgrading |
| R7 | Large documents overwhelm context window | GPT-4o context limits exceeded | Low | Limit to top 5 chunks (~2500 tokens), summarize if needed |
| R8 | Bounding box data unavailable from Docling | Highlights can't show exact location | Medium | Fallback to page-level highlight with flash animation |
| R9 | Follow-up context makes prompts too large | Token limits, slow responses | Low | Limit to last 10 messages, summarize older context if needed |

### Assumptions

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | Epic 4 document processing produces quality chunks | RAG quality depends on chunking quality |
| A2 | Confidence thresholds (0.85/0.60) work for insurance docs | Industry-standard RAG thresholds, may need tuning |
| A3 | Users understand confidence badges | UX spec validated this pattern, but needs user testing |
| A4 | 5 chunks provide sufficient context for answers | Balance between context and token cost |
| A5 | GPT-4o produces accurate insurance-related responses | Tested in prototyping, but not exhaustively |
| A6 | 10 messages of history is sufficient for follow-ups | Typical conversation length, can adjust |
| A7 | Users primarily use desktop for document analysis | Insurance agents typically work on desktop |
| A8 | 1000 character message limit is sufficient | Typical questions are much shorter |
| A9 | OpenAI API remains available and performant | 99.9% SLA historically |
| A10 | react-pdf handles all insurance PDF formats | Standard PDFs should work, scanned docs via Docling OCR |

### Open Questions

| ID | Question | Owner | Status | Decision |
|----|----------|-------|--------|----------|
| Q1 | Should we cache query embeddings for repeated questions? | Architect | Decided | No - freshness over speed, queries vary |
| Q2 | Should users be able to rate response quality? | PM | Deferred | Post-MVP feature, useful for threshold tuning |
| Q3 | How to handle multi-page answers (answer spans pages)? | Architect | Decided | Show first source, list additional sources |
| Q4 | Should conversation history be shareable between team members? | PM | Decided | No for MVP - conversations are per-user |
| Q5 | What if user asks about multiple documents at once? | PM | Decided | Out of scope - single document Q&A only |
| Q6 | Should we show retrieval scores to users? | UX | Decided | No - confidence badges are user-friendly abstraction |
| Q7 | How to handle very long PDF documents (100+ pages)? | Architect | Open | Test performance, may need pagination or lazy loading |
| Q8 | Should we pre-populate suggested questions based on document type? | PM | Deferred | Use generic suggestions for MVP, personalize later |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | RAG pipeline, confidence calculation, prompt building, Zod schemas | Vitest | 90%+ for core logic |
| Integration | Chat API endpoint, vector search, conversation CRUD | Vitest + Supabase local | All server actions |
| Component | Chat panel, message display, input handling, PDF viewer controls | Vitest + Testing Library | Key user interactions |
| E2E | Full question-answer flow with real PDF | Manual for MVP, Playwright later | Critical paths |

### Key Test Scenarios

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

### Test Data

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

### Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| OpenAI Chat Completions | MSW or manual mock with streaming response |
| OpenAI Embeddings | Mock fixed 1536-dim vector response |
| Supabase Database | Supabase local for integration, mock for unit |
| Vector Search (pgvector) | Mock similarity query results |
| PDF.js | Mock document loading for component tests |

### SSE Streaming Test Approach

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

### Manual E2E Test Checklist

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

## Definition of Done

### Story-Level DoD

- [ ] All acceptance criteria verified and passing
- [ ] TypeScript compiles without errors (`npm run build` succeeds)
- [ ] Unit tests written for new utility functions (Vitest)
- [ ] Integration tests for chat API endpoint
- [ ] Component tests for chat panel interactions
- [ ] No console errors in browser during manual testing
- [ ] Responsive design verified at desktop, tablet, mobile breakpoints
- [ ] Loading states use skeleton/shimmer (no spinners > 200ms)
- [ ] Error states display user-friendly messages
- [ ] Code reviewed and approved
- [ ] Merged to main branch

### Epic-Level DoD

- [ ] All 7 stories complete and passing DoD
- [ ] All 66 acceptance criteria verified
- [ ] New dependencies installed (react-pdf, pdfjs-dist)
- [ ] PDF.js worker configured in next.config.ts
- [ ] End-to-end chat flow tested with real insurance PDF
- [ ] Streaming response verified (text appears word-by-word)
- [ ] Confidence badges display correctly (all 3 levels)
- [ ] Source citation highlights working (scroll + fade)
- [ ] Conversation history persists across sessions
- [ ] Mobile tabbed interface functional
- [ ] Cross-agency isolation verified (cannot see other agency chats)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] Sprint status updated to reflect epic completion

### FR Coverage Verification

| FR | Description | Stories | Status |
|----|-------------|---------|--------|
| FR13 | Natural language Q&A | 5.1, 5.2 | ◯ |
| FR14 | Extract answers from documents | 5.3 | ◯ |
| FR15 | Source citations on answers | 5.4 | ◯ |
| FR16 | Confidence indicators | 5.3 | ◯ |
| FR17 | Click-to-view source in document | 5.5 | ◯ |
| FR18 | Follow-up questions (conversation) | 5.6 | ◯ |
| FR19 | Clear "not found" responses | 5.3 | ◯ |
| FR32 | Responsive design | 5.7 | ◯ |
| FR34 | Clear error messages | 5.3 | ◯ |

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-11-30_
_With contributions from: Winston (Architect), Mary (Analyst), John (PM), Sally (UX), Amelia (Dev), Bob (SM), Murat (TEA), Paige (Tech Writer)_
