# Epic 5: Document Q&A with Trust Transparency

**Goal:** Enable users to have natural language conversations with their documents, with every answer backed by source citations and confidence indicators. This is the core value proposition of docuMINE.

**User Value:** Users can ask questions about their insurance documents and get accurate, verifiable answers in seconds instead of hunting through PDFs manually.

**FRs Addressed:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR32, FR34

---

## Story 5.1: Chat Interface Layout (Split View)

As a **user**,
I want **to see my document and chat side-by-side**,
So that **I can ask questions while viewing the source material**.

**Acceptance Criteria:**

**Given** I select a document from the sidebar
**When** the document view loads
**Then** I see a split view layout:
- Left panel: Document Viewer (flexible width, min 40%)
- Right panel: Chat Panel (360px fixed width on desktop)
- Resizable divider between panels (optional for MVP)

**And** the Chat Panel contains:
- Conversation history (scrollable)
- Input area at bottom with "Ask a question..." placeholder
- Send button (arrow icon)

**And** keyboard shortcuts work:
- Enter sends message (Shift+Enter for newline)
- Focus automatically in input when document opens

**And** responsive adaptation:
- Tablet: Both panels visible, narrower
- Mobile: Tabbed view (Document / Chat tabs), swipe to switch

**And** the layout follows UX spec:
- Trustworthy Slate colors
- System font
- Clean separation between panels

**Prerequisites:** Story 4.3

**Technical Notes:**
- Implement in `@/app/(dashboard)/documents/[id]/page.tsx`
- Use CSS Grid or Flexbox for split view
- Chat panel component: `@/components/chat/chat-panel.tsx`
- Mobile detection via media queries or resize observer

---

## Story 5.2: Natural Language Query Input

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

## Story 5.3: AI Response with Streaming & Trust Elements

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

## Story 5.4: Source Citation Display

As a **user**,
I want **to see exactly where in the document an answer came from**,
So that **I can verify the AI's response is accurate**.

**Acceptance Criteria:**

**Given** an AI response includes a source citation
**When** I view the response
**Then** the citation shows:
- "View in document →" or "Page X →" link
- Styled subtly (small text, muted color until hover)

**And** multiple sources show as:
- "Sources: Page 3, Page 7, Page 12" (links)
- Or expandable "View 3 sources" if many

**And** the citation includes:
- Page number
- Snippet preview on hover (optional for MVP)

**And** response messages are saved with source metadata:
```typescript
sources: [{
  documentId: string,
  pageNumber: number,
  text: string,  // the quoted passage
  boundingBox?: { x, y, width, height }
}]
```

**Prerequisites:** Story 5.3

**Technical Notes:**
- Sources extracted during RAG pipeline
- Store top 1-3 most relevant chunks as sources
- Source click handling in next story (5.5)

---

## Story 5.5: Document Viewer with Highlight Navigation

As a **user**,
I want **to click a source citation and see the relevant passage highlighted in the document**,
So that **I can quickly verify the answer**.

**Acceptance Criteria:**

**Given** an AI response has a source citation
**When** I click the citation link
**Then** the document viewer:
- Scrolls to the relevant page (smooth scroll)
- Highlights the cited passage with yellow background (#fef08a)
- Highlight includes slight padding around text

**And** the highlight behavior:
- Highlight appears immediately on scroll
- Fades after 3 seconds (or click elsewhere)
- Can click highlight to keep it visible

**And** if bounding box data is available:
- Highlight exact region in rendered PDF
- Draw semi-transparent overlay

**And** if only page number is available:
- Scroll to top of page
- Flash the page (subtle pulse animation)

**And** document viewer features:
- PDF rendering with text layer (for selection)
- Page navigation (previous/next, page number input)
- Zoom controls (fit width, zoom in/out)
- Current page indicator: "Page X of Y"

**Prerequisites:** Story 5.4

**Technical Notes:**
- Use react-pdf or pdf.js for PDF rendering
- PDF viewer component: `@/components/documents/document-viewer.tsx`
- Maintain viewer state: current page, zoom level
- Sync scroll position to page number
- Text layer enables text selection and search
- Highlight coordinates from document_chunks.bounding_box

---

## Story 5.6: Conversation History & Follow-up Questions

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

## Story 5.7: Responsive Chat Experience

As a **mobile/tablet user**,
I want **to ask questions about documents on smaller screens**,
So that **I can use docuMINE on any device**.

**Acceptance Criteria:**

**Given** I am on a tablet or mobile device
**When** I view a document
**Then** the layout adapts:

**Tablet (640-1024px):**
- Split view maintained but narrower
- Sidebar collapsed by default (hamburger toggle)
- Chat panel 40% width

**Mobile (<640px):**
- Tabbed interface: [Document] [Chat] tabs
- Swipe gesture to switch tabs
- Tab indicator shows current view
- Chat input fixed at bottom of screen

**And** touch-friendly interactions:
- All buttons minimum 44x44px touch targets
- Tap source citation → switch to Document tab + scroll to source
- No hover-dependent features (tooltips on tap instead)

**And** the experience maintains:
- Same trust elements (confidence, citations)
- Same streaming response feel
- Document readable at mobile zoom levels

**Prerequisites:** Story 5.5

**Technical Notes:**
- Use CSS media queries for breakpoint detection
- Tab state managed in React state
- Touch events for swipe (optional: use library)
- Test on actual mobile devices

---

## Story 5.8: Retrieval Quality Optimization (Phase 1)

As a **user asking questions about insurance documents**,
I want **more accurate and relevant answers with higher confidence**,
So that **I can trust the AI responses and spend less time verifying**.

**Acceptance Criteria:**

**Given** the current RAG pipeline has low confidence scores
**When** I ask questions about my document
**Then** retrieval quality is improved through:

**Baseline Metrics Infrastructure:**
- Test query set of 50 queries (stratified by type: lookups, tables, semantic, complex)
- Baseline measurements: Recall@5, average similarity score, confidence distribution
- Metrics logged for comparison

**Cohere Reranking Integration:**
- Vector search retrieves top 20 candidates (up from 5)
- Cohere Rerank 3.5 API reorders results by relevance
- Top 5 reranked results used for RAG context
- Reranker scores inform confidence calculation
- Fallback to vector-only if Cohere unavailable

**Hybrid Search (BM25 + Vector):**
- PostgreSQL full-text search index on document_chunks.content
- Hybrid query combines FTS and vector similarity
- Alpha parameter: 0.7 (70% vector, 30% keyword)
- Improved exact-match queries (policy numbers, coverage names)

**Confidence Threshold Adjustment:**
- Thresholds tuned based on reranker scores
- New thresholds: ≥0.75 High, 0.50-0.74 Needs Review, <0.50 Not Found
- A/B testing capability for threshold comparison

**Success Metrics:**
- High Confidence responses increase from ~30% to >50%
- "Not Found" responses decrease from ~40% to <25%
- Average similarity score improves from ~0.55 to >0.70
- Response latency remains <3 seconds

**Prerequisites:** Story 5.6

**Technical Notes:**
- Cohere SDK: `npm install cohere-ai`
- Environment variable: `COHERE_API_KEY`
- Migration to add tsvector column and GIN index
- Update `src/lib/chat/rag.ts` for hybrid retrieval
- Create `src/lib/chat/reranker.ts` for Cohere integration
- Feature flags for A/B testing different configurations

---

## Story 5.8.1: Large Document Processing Reliability

As a **user uploading large insurance documents**,
I want **reliable processing of documents up to 50 pages**,
So that **comprehensive policy documents don't fail or timeout**.

**Added 2025-12-02:** Bug fix story addressing processing timeouts for large documents.
**Completed 2025-12-02:** Implemented with 8MB file limit and timeout handling.

**Acceptance Criteria:**

**Given** a document larger than 20 pages
**When** the document is processed
**Then** processing completes successfully within 5 minutes
**And** progress is reported at each stage
**And** timeouts are handled gracefully with retry logic

**And** file size validation prevents uploads over 8MB:
- Client-side validation with clear error message
- Server-side validation as backup
- User sees "File too large. Maximum size is 8MB" toast

**Technical Notes:**
- Increased Edge Function timeout to 300 seconds
- Added progress reporting to processing_jobs table
- Implemented chunked processing for large documents
- Added file size validation (8MB limit for Docling)
- Files changed:
  - `supabase/functions/process-document/index.ts`
  - `src/components/documents/upload-zone.tsx`
  - `src/lib/documents/validation.ts`

---

## Story 5.9: Chunking Optimization (Phase 2)

As the **system processing insurance documents**,
I want **to chunk documents more intelligently**,
So that **semantic units remain intact and tables are preserved**.

**Acceptance Criteria:**

**Given** the current fixed-size chunking breaks semantic units
**When** documents are processed
**Then** chunking is improved through:

**RecursiveCharacterTextSplitter:**
- Replace fixed 1000-char chunking with recursive splitting
- Chunk size: 500 tokens with 50 token overlap
- Separators: `["\n\n", "\n", ". ", " "]`
- Preserves paragraphs and sentences as units

**Table-Aware Chunking:**
- Detect tables in Docling output (already structured)
- Tables emitted as single chunks regardless of size
- Table chunks include metadata: `chunk_type: 'table'`
- Table summaries generated for retrieval
- Raw table content stored for answer generation

**Document Re-processing Pipeline:**
- Batch re-processing for existing documents
- New embeddings stored in parallel with old
- A/B testing before cutover
- Rollback capability

**Success Metrics:**
- +15-20% improvement in semantic coherence
- +20% improvement for table-related queries
- No regression in response latency

**Prerequisites:** Story 5.8

**Technical Notes:**
- Update `src/lib/documents/chunking.ts` with recursive splitter
- Modify `supabase/functions/process-document/index.ts`
- Create migration for chunk metadata columns
- Parallel embedding storage for A/B testing
- Progress tracking for batch re-processing

---

## Story 5.10: Model Evaluation (Phase 3)

As a **system administrator**,
I want **to evaluate and potentially upgrade AI models via OpenRouter**,
So that **response quality and cost-efficiency are optimized with multi-provider flexibility**.

**Updated 2025-12-02:** Based on Party Mode research, decision is to use **OpenRouter** for multi-model access with **Claude Sonnet 4.5** as primary model.

**Acceptance Criteria:**

**Given** OpenRouter provides multi-provider access
**When** evaluating model configurations
**Then** the following are assessed:

**OpenRouter Integration:**
- Configure OpenRouter as primary LLM provider
- Support model hierarchy: Claude Sonnet 4.5 (primary), Claude Haiku 4.5 (fast), Gemini 2.5 Flash (cost-opt), GPT-4o (fallback)
- Environment variables: `OPENROUTER_API_KEY`, `LLM_PROVIDER`, `LLM_CHAT_MODEL`

**Why Claude for Insurance Documents:**
- Superior structured document handling
- Better instruction following, less hallucination
- 200K context window (vs GPT-4o 128K)
- Excellent table comprehension (60%+ of insurance docs are tables)

**Embedding Model Evaluation:**
- Compare text-embedding-3-small vs text-embedding-3-large
- Test with 1536 dimensions (drop-in compatible)
- Test with 3072 dimensions (if retrieval improvement significant)
- Measure retrieval accuracy improvement

**A/B Testing Framework:**
- Feature flag for model selection per request
- Metrics collection for comparison
- User feedback mechanism (optional)

**Cost Analysis:**
- Calculate cost impact of model changes
- Document ROI of improvements
- Recommend optimal configuration

**Success Metrics:**
- Clear recommendation with supporting data
- No regression in response quality
- Cost-neutral or improved cost-efficiency

**Prerequisites:** Story 5.9

**Technical Notes:**
- New config module: `src/lib/llm/config.ts`
- OpenRouter client factory: `src/lib/llm/client.ts`
- Update `src/lib/chat/openai-stream.ts` to use `getLLMClient()`
- Feature flags for A/B testing

---

## Story 5.11: Streaming & AI Personality Bug Fixes

As a **user asking questions about documents**,
I want **streaming responses that are reliable and conversational**,
So that **I have a pleasant chat experience without technical issues**.

**Added 2025-12-01:** Bug fix story addressing issues discovered during Epic 5 implementation.

**Acceptance Criteria:**

**Given** the chat streaming implementation
**When** users interact with the chat
**Then** the following issues are fixed:

**Streaming Reliability:**
- AbortController properly cancels pending requests on unmount
- No memory leaks when navigating away during streaming
- SSE parsing errors logged (not silently ignored)
- DEBUG console.logs removed from production

**AI Personality:**
- Temperature set to 0.7 for balanced responses
- Max tokens set to 1500 for reasonable length
- System prompt enhanced with personality guidelines
- Greetings and general questions handled naturally (not forced "not found")

**Query Intent Classification:**
- New intent classifier identifies query types (greeting, lookup, analysis, etc.)
- GPT decides naturally when to say "not found" based on context
- No forced overrides that break conversational flow

**Prerequisites:** Story 5.6

**Technical Notes:**
- `src/hooks/use-chat.ts` - AbortController
- `src/lib/chat/openai-stream.ts` - Temperature/max_tokens
- `src/lib/chat/rag.ts` - Enhanced system prompt
- `src/lib/chat/intent.ts` - NEW query classifier
- `src/app/api/chat/route.ts` - Removed forced "not found" override

---

## Story 5.12: Document Processing Progress Visualization

As a **user uploading documents**,
I want **visual feedback on processing progress beyond just "Analyzing..."**,
So that **I understand what's happening and how long it might take**.

**Added 2025-12-02:** Enhancement story for improved UX during document processing.
**Completed 2025-12-02:** Full implementation with UX-approved design.

**Acceptance Criteria:**

**Given** a document is processing
**When** I view the document in the list
**Then** I see the current stage:
- "Downloading..." (5-10s)
- "Parsing document..." (1-5 min)
- "Chunking content..." (5-15s)
- "Generating embeddings..." (30s-2 min)

**And** I see a progress bar (0-100%) for that stage

**And** I see estimated time remaining (e.g., "~2 min remaining")

**And** the UI updates in real-time via Supabase Realtime

**And** the visual design is approved by UX Designer

**Prerequisites:** Story 5.8.1 (Large Document Processing)

**Technical Notes:**
- Add `progress_data` JSONB column to `processing_jobs` table
- Edge Function reports progress at each stage
- Frontend subscribes via Supabase Realtime
- New component: `src/components/documents/processing-progress.tsx`
- RLS policy added for authenticated users to SELECT processing_jobs

---

## Story 5.13: Docling PDF Parsing Robustness

As a **user uploading various PDF documents**,
I want **robust handling of PDFs that cause parsing errors**,
So that **documents don't fail silently and I get clear feedback**.

**Added 2025-12-02:** Bug fix story for Docling libpdfium page-dimensions errors.

**Status:** Drafted

**Acceptance Criteria:**

**Given** a PDF that causes libpdfium page-dimensions errors
**When** the document is processed
**Then** the error is caught gracefully
**And** the document is marked as 'failed' with a helpful error message
**And** the user sees actionable feedback (e.g., "This PDF format is not supported")

**Technical Notes:**
- Handle `libpdfium` errors in Edge Function
- Add retry logic with alternative parsing strategy
- Improve error messages in processing_jobs table

---

## Story 5.14: Realtime Progress Polish

As a **user watching document processing**,
I want **smooth progress updates without visual glitches**,
So that **the experience feels polished and professional**.

**Added 2025-12-02:** Polish story for realtime progress visualization.

**Status:** Drafted

**Acceptance Criteria:**

**Given** a document is being processed
**When** progress updates arrive via Realtime
**Then** the progress bar animates smoothly (no jumping)
**And** deleted documents are immediately removed from the list
**And** status transitions are visually smooth

**Technical Notes:**
- Implement progress smoothing/interpolation
- Subscribe to DELETE events for immediate removal
- Add CSS transitions for status changes

---
