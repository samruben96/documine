# Tech Spec: Epic 15 - AI Buddy Core Chat

**Epic:** AI Buddy Core Chat
**Epic ID:** 15
**Author:** Sam
**Created:** 2025-12-07
**Status:** Draft

---

## Executive Summary

Epic 15 delivers the foundational conversational AI experience for AI Buddy - enabling users to ask questions and receive accurate, sourced answers with streaming responses. This epic builds upon the foundation established in Epic 14 (AI Buddy Foundation) and implements the core chat functionality that makes AI Buddy valuable.

**Key Deliverables:**
- Chat input component with send functionality
- Message display with markdown rendering
- Streaming chat API via Server-Sent Events (SSE)
- Conversation persistence and history
- Source citations with document references
- Confidence indicators (High/Medium/Low)
- Guardrail-aware AI responses (invisible compliance)

**FRs Covered:** FR1, FR2, FR5, FR7, FR8, FR9, FR10

---

## Technical Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Buddy Core Chat                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Chat Input  │────▶│  Chat API    │────▶│  OpenRouter  │    │
│  │  Component   │     │  /ai-buddy/  │     │  Claude 4.5  │    │
│  └──────────────┘     │  chat        │     └──────────────┘    │
│         │             └──────────────┘            │            │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Message     │     │  Conversation│     │  SSE Stream  │    │
│  │  Display     │◀────│  Storage     │◀────│  Response    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                              │                                  │
│                              ▼                                  │
│                       ┌──────────────┐                         │
│                       │  Audit Log   │                         │
│                       │  Recording   │                         │
│                       └──────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Points

| System | Integration | Purpose |
|--------|-------------|---------|
| Epic 14 Database | Supabase tables | Store conversations, messages |
| OpenRouter | REST API | AI responses via Claude Sonnet 4.5 |
| Existing Auth | Supabase Auth | User authentication |
| Existing Documents | Documents table | Source citations |
| Guardrails | ai_buddy_guardrails table | Compliance rules |

### Technology Stack

**Existing (from docuMINE):**
- Next.js 15 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- OpenAI client library (used for OpenRouter)
- shadcn/ui components
- Tailwind CSS 4

**New Dependencies (already in package.json):**
- `react-markdown` - Message content rendering
- `remark-gfm` - GitHub Flavored Markdown
- `sonner` - Toast notifications

**No new dependencies required.**

---

## Data Models

### Database Tables (from Epic 14)

**ai_buddy_conversations** (existing):
```sql
CREATE TABLE ai_buddy_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  project_id uuid REFERENCES ai_buddy_projects(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**ai_buddy_messages** (existing):
```sql
CREATE TABLE ai_buddy_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb,
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### TypeScript Types

```typescript
// src/types/ai-buddy.ts (extend existing)

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  confidence?: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface SourceCitation {
  documentId: string;
  documentName: string;
  page?: number;
  text: string;
  startOffset?: number;
  endOffset?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  agencyId: string;
  projectId?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  conversationId?: string;
  projectId?: string;
  message: string;
  attachments?: string[]; // Document IDs
}

export interface StreamEvent {
  type: 'chunk' | 'sources' | 'confidence' | 'done' | 'error';
  content?: string;
  citations?: SourceCitation[];
  level?: 'high' | 'medium' | 'low';
  conversationId?: string;
  messageId?: string;
  error?: string;
}
```

---

## API Specification

### POST /api/ai-buddy/chat

**Purpose:** Send a message and receive streaming AI response

**Authentication:** Required (Supabase Auth)

**Request:**
```typescript
{
  conversationId?: string;  // Continue existing or create new
  projectId?: string;       // Optional project context
  message: string;          // User's message (max 4000 chars)
  attachments?: string[];   // Document IDs for context
}
```

**Response:** Server-Sent Events stream
```
data: {"type":"chunk","content":"Based on the policy..."}
data: {"type":"chunk","content":" the liability limit is..."}
data: {"type":"sources","citations":[{"documentId":"...","documentName":"Policy.pdf","page":3,"text":"..."}]}
data: {"type":"confidence","level":"high"}
data: {"type":"done","conversationId":"...","messageId":"..."}
```

**Error Response:**
```
data: {"type":"error","error":"Rate limit exceeded","code":"AIB_003"}
```

**Rate Limiting:**
- Default: 20 messages per minute
- Configurable via `ai_buddy_rate_limits` table

**Implementation Notes:**
- Use Edge Runtime for low latency
- Stream from OpenRouter with SSE
- Create conversation on first message if `conversationId` not provided
- Auto-generate title from first 50 chars of first message
- Log to audit table on completion
- Include guardrail context in system prompt

### GET /api/ai-buddy/conversations

**Purpose:** List user's conversations

**Query Parameters:**
- `projectId` (optional): Filter by project
- `search` (optional): Full-text search in messages
- `limit` (optional, default: 50): Max results
- `cursor` (optional): Pagination cursor

**Response:**
```typescript
{
  data: Conversation[];
  nextCursor?: string;
  error: null;
}
```

### GET /api/ai-buddy/conversations/[id]

**Purpose:** Get conversation with messages

**Response:**
```typescript
{
  data: {
    conversation: Conversation;
    messages: ChatMessage[];
  };
  error: null;
}
```

---

## Component Specifications

### ChatInput Component

**File:** `src/components/ai-buddy/chat/chat-input.tsx`

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}
```

**Behavior:**
- Enter sends message, Shift+Enter for newline
- Auto-expands up to 4 lines, then scrolls
- Character count shown when > 3500 chars
- Send button disabled when empty or disabled
- Attach button (📎) for document attachment
- Focus after send

**Visual:**
- Rounded input matching ChatGPT style
- Dark background (`#2d2d2d`)
- 14px font, `#ececec` text
- Send button: Primary blue when active

### ChatMessage Component

**File:** `src/components/ai-buddy/chat/chat-message.tsx`

**Props:**
```typescript
interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onCitationClick?: (citation: SourceCitation) => void;
}
```

**Behavior:**
- User messages: Blue avatar, right-aligned bubble
- AI messages: Green avatar, left-aligned bubble
- Markdown rendering with `react-markdown`
- Inline citations clickable
- Confidence badge below AI messages
- Timestamp on hover (relative format)

**Visual:**
- Avatar: 32px circle, initials or icon
- Message bubble: Max width 80%, rounded corners
- Code blocks: Syntax highlighted, dark theme
- Citations: Blue text with 📄 icon

### ChatMessageList Component

**File:** `src/components/ai-buddy/chat/chat-message-list.tsx`

**Props:**
```typescript
interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  streamingContent?: string;
  onCitationClick?: (citation: SourceCitation) => void;
}
```

**Behavior:**
- Scrollable container
- Auto-scroll to bottom on new messages
- Streaming indicator when loading
- Empty state when no messages
- Virtualization for long conversations (future)

### StreamingIndicator Component

**File:** `src/components/ai-buddy/chat/streaming-indicator.tsx`

**Props:**
```typescript
interface StreamingIndicatorProps {
  isVisible: boolean;
}
```

**Behavior:**
- Three animated dots
- Green AI avatar
- Shows while waiting for response

### SourceCitation Component

**File:** `src/components/ai-buddy/chat/source-citation.tsx`

**Props:**
```typescript
interface SourceCitationProps {
  citation: SourceCitation;
  onClick?: () => void;
}
```

**Behavior:**
- Inline display: `[📄 Document Name pg. X]`
- Clickable, opens document preview
- Tooltip shows quoted text
- Blue color (`#3b82f6`)

### ConfidenceBadge Component

**File:** `src/components/ai-buddy/chat/confidence-badge.tsx`

**Props:**
```typescript
interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
}
```

**Visual:**
- High: Green badge "High Confidence"
- Medium: Amber badge "Needs Review"
- Low: Gray badge "Not Found"
- Tooltip explains each level

---

## Hook Specifications

### useChat Hook

**File:** `src/hooks/ai-buddy/use-chat.ts`

```typescript
interface UseChatOptions {
  conversationId?: string;
  projectId?: string;
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent: string;
  error: Error | null;
  sendMessage: (content: string, attachments?: string[]) => Promise<void>;
  conversation: Conversation | null;
}
```

**Implementation:**
- Manages SSE connection to `/api/ai-buddy/chat`
- Handles streaming chunks, assembles full response
- Optimistic UI updates for user messages
- Stores completed messages in state
- Handles reconnection on error
- Clears streaming content when done

### useConversations Hook

**File:** `src/hooks/ai-buddy/use-conversations.ts`

```typescript
interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (projectId?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Promise<Conversation[]>;
}
```

---

## Library Functions

### Prompt Builder

**File:** `src/lib/ai-buddy/prompt-builder.ts`

```typescript
export interface PromptContext {
  userPreferences: UserPreferences;
  guardrails: GuardrailConfig;
  projectDocuments?: DocumentContext[];
  conversationHistory?: ChatMessage[];
}

export function buildSystemPrompt(context: PromptContext): string;
export function buildUserPrompt(message: string, attachments?: DocumentContext[]): string;
```

**System Prompt Structure:**
1. Base AI Buddy persona and capabilities
2. User preferences (communication style, LOB, carriers)
3. Guardrail rules (topic restrictions, E&O disclaimers)
4. Invisible guardrail instruction (never say "I cannot")
5. Citation format instructions
6. Confidence level guidelines

### AI Client

**File:** `src/lib/ai-buddy/ai-client.ts`

```typescript
export interface StreamOptions {
  messages: Array<{ role: string; content: string }>;
  onChunk: (content: string) => void;
  onSources?: (sources: SourceCitation[]) => void;
  onConfidence?: (level: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamChatCompletion(options: StreamOptions): Promise<void>;
```

**Implementation:**
- Use OpenRouter API via OpenAI client
- Model: `anthropic/claude-3.5-sonnet` (or latest)
- Stream responses with SSE
- Parse citations from response
- Determine confidence from RAG context

### Audit Logger

**File:** `src/lib/ai-buddy/audit-logger.ts`

```typescript
export interface AuditEntry {
  action: 'message_sent' | 'message_received' | 'guardrail_applied' | 'conversation_created';
  conversationId?: string;
  metadata: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void>;
```

### Guardrails Loader

**File:** `src/lib/ai-buddy/guardrails.ts`

```typescript
export interface GuardrailConfig {
  restrictedTopics: Array<{ trigger: string; redirect: string }>;
  eandoDisclaimer: boolean;
  aiDisclosureMessage?: string;
  customRules: string[];
}

export async function loadGuardrails(agencyId: string): Promise<GuardrailConfig>;
export function checkGuardrails(message: string, config: GuardrailConfig): GuardrailResult;
```

---

## Story Breakdown

### Story 15.1: Chat Input Component

**As a** user,
**I want** to type messages in a chat input box,
**So that** I can communicate with AI Buddy.

**Acceptance Criteria:**
- Rounded input box at bottom of chat area
- Placeholder "Message AI Buddy..."
- Send button (arrow icon) disabled when empty
- Enter sends, Shift+Enter for newline
- Auto-expands up to 4 lines
- Character count when > 3500 chars
- Input clears and refocuses after send

**Technical Tasks:**
1. Create `chat-input.tsx` component
2. Implement auto-expand textarea logic
3. Add keyboard event handling
4. Style per UX spec (dark theme)
5. Unit tests for component

**Estimate:** 3 points

---

### Story 15.2: Message Display Component

**As a** user,
**I want** to see my messages and AI responses in a chat format,
**So that** I can follow the conversation flow.

**Acceptance Criteria:**
- User messages: right-aligned, blue avatar
- AI messages: left-aligned, green avatar
- Chronological order (oldest at top)
- Auto-scroll to newest message
- Timestamps on hover (relative format)
- Markdown rendering (bold, lists, code blocks)
- Typing indicator during streaming

**Technical Tasks:**
1. Create `chat-message.tsx` component
2. Create `chat-message-list.tsx` container
3. Create `streaming-indicator.tsx`
4. Implement markdown rendering with react-markdown
5. Add auto-scroll behavior
6. Style per UX spec
7. Unit tests

**Estimate:** 5 points

---

### Story 15.3: Streaming Chat API

**As a** user,
**I want** AI responses to stream in real-time,
**So that** I see answers progressively without waiting.

**Acceptance Criteria:**
- Response streams via Server-Sent Events
- Streaming begins within 500ms
- Text appears progressively
- SSE format: chunk, sources, confidence, done
- Error handling with retry option
- Rate limiting enforcement

**Technical Tasks:**
1. Create `/api/ai-buddy/chat/route.ts`
2. Implement OpenRouter streaming integration
3. Create `ai-client.ts` wrapper
4. Implement SSE response format
5. Add rate limiting check
6. Create `use-chat.ts` hook for client
7. Integration tests

**Estimate:** 8 points

---

### Story 15.4: Conversation Persistence

**As a** user,
**I want** my conversations saved automatically,
**So that** I can continue them later.

**Acceptance Criteria:**
- New conversation created on first message
- Auto-generated title (first 50 chars)
- Full conversation history loads on return
- Conversations listed in sidebar "Recent" section
- Sorted by most recent activity
- AI retains context from previous messages

**Technical Tasks:**
1. Create conversation creation logic
2. Implement message storage
3. Create `use-conversations.ts` hook
4. Update sidebar to show conversations
5. Implement conversation loading
6. Add conversation context to AI prompt
7. Database integration tests

**Estimate:** 5 points

---

### Story 15.5: Source Citations

**As a** user,
**I want** AI responses to cite their sources,
**So that** I can verify information and trust the answers.

**Acceptance Criteria:**
- Inline citations: `[📄 Document Name pg. X]`
- Citations styled in blue (#3b82f6)
- Tooltip shows quoted text on hover
- Click opens document preview to page
- SSE includes citation data
- No citations for general knowledge

**Technical Tasks:**
1. Create `source-citation.tsx` component
2. Implement citation parsing from AI response
3. Add citation extraction to prompt
4. Store citations in message `sources` column
5. Integrate with document preview
6. Unit tests

**Estimate:** 5 points

---

### Story 15.6: Confidence Indicators

**As a** user,
**I want** to see how confident AI Buddy is in its answers,
**So that** I know when to verify information myself.

**Acceptance Criteria:**
- Confidence badge below each AI response
- High (green): from attached documents
- Medium (amber): general knowledge, verify
- Low (gray): information not available
- Hover tooltip explains each level
- SSE includes confidence data

**Technical Tasks:**
1. Create `confidence-badge.tsx` component
2. Implement confidence calculation logic
3. Add confidence to AI prompt instructions
4. Store in message `confidence` column
5. Style per UX spec
6. Unit tests

**Estimate:** 3 points

---

### Story 15.7: Guardrail-Aware Responses

**As a** user,
**I want** AI Buddy to stay within agency guidelines invisibly,
**So that** I get helpful responses without feeling restricted.

**Acceptance Criteria:**
- AI never says "I cannot", "blocked", or "restricted"
- Restricted topics get helpful redirects
- AI says "I don't know" when appropriate (no hallucination)
- Guardrail events logged to audit (admin-visible)
- Changes apply immediately

**Technical Tasks:**
1. Create `guardrails.ts` loader
2. Create `prompt-builder.ts` with guardrail injection
3. Implement invisible guardrail prompts
4. Add guardrail logging to audit
5. Create `audit-logger.ts` helper
6. Integration tests for guardrail scenarios

**Estimate:** 8 points

---

## Implementation Plan

### Phase 1: Core Components (Stories 15.1, 15.2)
- Chat input component
- Message display components
- Streaming indicator
- Basic styling

### Phase 2: Chat API (Story 15.3)
- API route implementation
- OpenRouter integration
- SSE streaming
- useChat hook

### Phase 3: Persistence (Story 15.4)
- Conversation CRUD
- Message storage
- Sidebar integration
- History loading

### Phase 4: Citations & Confidence (Stories 15.5, 15.6)
- Citation component
- Confidence badge
- AI prompt instructions
- Document preview integration

### Phase 5: Guardrails (Story 15.7)
- Guardrail loading
- Prompt building
- Audit logging
- Testing edge cases

---

## Testing Strategy

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| ChatInput | Input handling, keyboard events, validation |
| ChatMessage | Rendering variants, markdown, citations |
| ChatMessageList | Scrolling, empty states, streaming |
| ConfidenceBadge | All levels, tooltips |
| SourceCitation | Click handling, formatting |

### Integration Tests

| Scenario | Test Coverage |
|----------|---------------|
| Send message flow | Input → API → Response → Display |
| Conversation persistence | Create → Store → Load |
| Citation display | API → Parse → Render → Click |
| Guardrail enforcement | Restricted topic → Redirect response |

### E2E Tests

| Journey | Test Coverage |
|---------|---------------|
| First conversation | Open AI Buddy → Type → Send → Response |
| Continue conversation | Load existing → Send → Context retained |
| Document citation | Attach doc → Ask question → Click citation |

---

## Security Considerations

### Input Validation
- Message length: Max 4000 characters
- Rate limiting: 20/min default
- Sanitize message content before storage

### Authentication
- All endpoints require valid Supabase session
- RLS policies enforce user-only access
- Agency isolation via agency_id

### Audit Trail
- All messages logged to audit table
- Guardrail events recorded
- Immutable logs (append-only)

### AI Safety
- System prompt prevents PII extraction
- Guardrails block harmful content
- No direct database access from AI

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First token | < 500ms | Time from send to first chunk |
| Full response | < 10s | 95th percentile |
| Message save | < 100ms | Database insert time |
| Conversation load | < 500ms | All messages fetched |
| Chat input | 60 FPS | No jank while typing |

### Optimizations
- Edge Runtime for API routes
- SSE streaming (no buffering)
- React Query for conversation caching
- Optimistic UI for user messages
- Debounced auto-save

---

## Dependencies

### Blocking
- **Epic 14 complete:** Database schema, API structure, page layout

### Non-Blocking
- Document preview component (can stub initially)
- Project context (general chat works without projects)

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenRouter rate limits | Medium | High | Implement retry with backoff |
| Large message handling | Low | Medium | Truncate context, paginate history |
| Guardrail bypass | Low | High | Test extensively, monitor logs |
| SSE browser support | Low | Low | Modern browsers all support |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chat completion rate | > 95% | Messages with responses / total |
| Response accuracy | User feedback | Confidence badge accuracy |
| Guardrail compliance | 100% | No restricted content in responses |
| User engagement | > 5 msgs/session | Average messages per conversation |

---

## Related Documents

- [AI Buddy PRD](../../../features/ai-buddy/prd.md)
- [AI Buddy Architecture](../../../features/ai-buddy/architecture.md)
- [AI Buddy UX Design](../../../features/ai-buddy/ux-design/ux-design-specification.md)
- [AI Buddy Epics](../../../features/ai-buddy/epics.md)
- [Epic 14 Tech Spec](../epic-14/tech-spec.md)

---

## Appendix

### Environment Variables

```bash
# Already configured in docuMINE
OPENROUTER_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### OpenRouter Configuration

```typescript
// Model selection
const MODEL = 'anthropic/claude-3.5-sonnet';

// API endpoint
const OPENROUTER_URL = 'https://openrouter.ai/api/v1';
```

### SSE Response Format Reference

```typescript
// Chunk event - partial content
data: {"type":"chunk","content":"Based on..."}

// Sources event - citations
data: {"type":"sources","citations":[
  {"documentId":"uuid","documentName":"Policy.pdf","page":3,"text":"..."}
]}

// Confidence event
data: {"type":"confidence","level":"high"}

// Done event - completion
data: {"type":"done","conversationId":"uuid","messageId":"uuid"}

// Error event
data: {"type":"error","error":"Rate limit exceeded","code":"AIB_003"}
```

---

_Tech Spec generated via BMad Method Epic Tech Context workflow_
_Epic 15 of AI Buddy feature module_
