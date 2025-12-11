# Chat & AI Issues

## Epic 5 Chat Integration Bug Fixes (2025-12-01)

Multiple bugs were discovered during Story 5.6 implementation and resolved:

### 1. Document Viewer Not Loading (Spinning Forever)
**Issue:** Document viewer showed infinite loading spinner for ready documents.
**Cause:** Code checked `status !== 'completed'` but documents have status `'ready'`.
**Fix:** Changed to `status !== 'ready'` in `src/app/(dashboard)/documents/[id]/page.tsx`.

### 2. Vector Search 404 Error
**Issue:** `match_document_chunks` RPC function returned 404 for similarity search.
**Cause:** Function's search_path excluded pgvector's `extensions` schema, making `<=>` operator unavailable.
**Fix:** Applied migration with `SET search_path = public, extensions` to include pgvector operators.

### 3. Chat Request Validation Error (`conversationId: null`)
**Issue:** Chat API returned "Invalid request: expected string, received null".
**Cause:** `useChat` hook sent `conversationId: null` but Zod expected `string | undefined`.
**Fix:** Only include `conversationId` in request body when truthy in `src/hooks/use-chat.ts`.

### 4. Chat 500 Error - Client/Server Boundary Violation
**Issue:** Chat API returned 500 error with message "Attempted to call calculateConfidence() from the server but calculateConfidence is on the client".
**Cause:** `calculateConfidence()` was defined in `'use client'` component (`confidence-badge.tsx`) but called from server-side API route.
**Fix:** Created shared server-compatible module `src/lib/chat/confidence.ts`:
- Extracted `ConfidenceLevel` type and `calculateConfidence()` function
- Updated client component to re-export from shared module (backward compatible)
- Updated all server-side files to import from shared module

**Key Learning:** In Next.js App Router, functions exported from `'use client'` files cannot be called from server-side code. Pure utility functions should be in separate non-client modules.

---

## Streaming & AI Personality Fixes (Story 5.11, 2025-12-01)

### 1. Streaming Memory Leaks & Debug Logs
**Issue:** Memory leaks when navigating away during streaming; DEBUG console.logs in production.
**Fixes:**
- Added `AbortController` to `useChat` hook - cancels pending requests on unmount or new message
- Removed DEBUG console.log statements from `openai-stream.ts` and `route.ts`
- Added SSE parsing error logging (was silently ignored)

**Files Changed:**
- `src/hooks/use-chat.ts` - AbortController + SSE error logging
- `src/lib/chat/openai-stream.ts` - Removed DEBUG logs
- `src/app/api/chat/route.ts` - Removed DEBUG logs

### 2. AI Personality Improvements
**Issue:** AI responses inconsistent (temperature=1.0 default) and lacking personality.
**Fixes:**
- Set `temperature: 0.7` for balanced factual/conversational responses
- Set `max_tokens: 1500` to prevent overly long responses
- Enhanced system prompt with personality guidelines, response style, example phrases

**Files Changed:**
- `src/lib/chat/openai-stream.ts` - Added temperature/max_tokens
- `src/lib/chat/rag.ts` - Rewrote SYSTEM_PROMPT with personality section

### 3. Greetings/General Questions Return "Not Found" (FIX-3)
**Issue:** "hello" or "what can you tell me about this document?" returned "I couldn't find information about that in this document."
**Root Cause:** Code forced GPT to respond with canned "not found" message when RAG confidence was low.
**Fix:** Removed the forced "not found" override entirely. GPT now decides naturally based on the system prompt.

**Key Learning:** Don't override LLM behavior with forced responses. The system prompt already instructs GPT how to handle missing context.

**Key Configuration:**
```typescript
// OpenAI parameters (openai-stream.ts)
temperature: 0.7,  // Balanced for insurance docs
max_tokens: 1500   // Reasonable response length
```

---

## Confidence Score Calculation Fix (Story 6.2, 2025-12-02)

**Issue:** Confidence badge showed "Not Found" even when AI provided accurate, sourced answers.

**Root Cause:** Bug at `src/lib/chat/reranker.ts:114` overwrote `similarityScore` with Cohere `relevanceScore`. The thresholds were calibrated for vector similarity but applied to Cohere scores.

**Resolution:**
1. **Removed bug:** Deleted line 114 in `reranker.ts` that overwrote `similarityScore`
2. **Dual thresholds:** Added separate threshold sets for vector vs Cohere scores
3. **Intent detection:** Added 'conversational' confidence level for greetings/meta queries

**Confidence Thresholds:**

| Score Type | High Confidence | Needs Review | Not Found |
|------------|-----------------|--------------|-----------|
| Vector (cosine) | >= 0.75 | 0.50 - 0.74 | < 0.50 |
| Cohere (reranker) | >= 0.30 | 0.10 - 0.29 | < 0.10 |

**Confidence Levels:**
- `high` - Green badge, checkmark icon
- `needs_review` - Amber badge, warning icon
- `not_found` - Gray badge, circle icon
- `conversational` - Blue badge, message icon (for greetings, thanks, etc.)

**Files Changed:**
- `src/lib/chat/reranker.ts` - Removed line 114 bug
- `src/lib/chat/confidence.ts` - Dual-threshold logic, 'conversational' level
- `src/lib/chat/rag.ts` - Updated calculateConfidence call with rerankerScore and queryIntent
- `src/components/chat/confidence-badge.tsx` - Added 'conversational' badge variant
- `__tests__/lib/chat/confidence.test.ts` - 43 tests for all confidence paths
- `__tests__/e2e/confidence-display.spec.ts` - E2E tests for badge display

**Cohere Model Name:** The correct model identifier is `rerank-v3.5` (NOT `rerank-english-v3.5`).
```typescript
// src/lib/chat/reranker.ts
const RERANK_MODEL = 'rerank-v3.5';  // Correct
```
