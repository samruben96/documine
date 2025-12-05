# Detailed Design

## Services and Modules

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

## Data Models and Contracts

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

## APIs and Interfaces

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

## Workflows and Sequencing

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
