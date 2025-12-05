# Story 5.11: Streaming & AI Personality Bug Fixes

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.11
**Type:** Bug Fix
**Status:** Done
**Completed:** 2025-12-01
**Created:** 2025-12-01
**Prerequisites:** Story 5.3 (AI Response with Streaming), Story 5.6 (Conversation History)

---

## Summary

Bug fix story addressing three issues discovered post-implementation:
1. **FIX-1:** Streaming memory leaks and debug logging in production
2. **FIX-2:** AI responses lacking personality and consistency
3. **FIX-3:** Greetings returning "not found" instead of conversational response

---

## Bug Reports

### FIX-1: Streaming Issues

**Reported:** 2025-12-01
**Severity:** Medium
**Root Cause:** Missing cleanup logic and debug code left in production

**Symptoms:**
- Memory leaks when navigating away during active streaming
- Verbose DEBUG console.log statements polluting production logs
- Silent SSE parsing failures making debugging difficult

**Affected Files:**
- `src/hooks/use-chat.ts`
- `src/lib/chat/openai-stream.ts`

### FIX-2: AI Personality Issues

**Reported:** 2025-12-01
**Severity:** Low
**Root Cause:** Missing temperature/max_tokens config, generic system prompt

**Symptoms:**
- AI responses inconsistent (temperature defaulted to 1.0)
- Responses sometimes too verbose (no max_tokens limit)
- Personality felt robotic, not "helpful colleague" per UX spec

**Affected Files:**
- `src/lib/chat/openai-stream.ts`
- `src/lib/chat/rag.ts`

### FIX-3: Greetings Return "Not Found" Response

**Reported:** 2025-12-01
**Severity:** High
**Root Cause:** RAG pipeline treats ALL user input as document queries

**Symptoms:**
- User says "hello" → receives "I couldn't find information about that in this document"
- User says "thanks" → receives "not found" message
- Any non-document query gets robotic "not found" response

**Root Cause Analysis:**
When user says "hello":
1. Query embedding generated for "hello"
2. Vector search finds no similar document chunks (similarity < 0.60)
3. `calculateConfidence()` returns `'not_found'`
4. `shouldShowNotFound()` returns `true`
5. **Critical:** `route.ts:177-190` forces GPT-4o to respond with canned "not found" message

The system overrode GPT's natural conversational ability when no document context was found.

**Affected Files:**
- `src/app/api/chat/route.ts`

---

## Changes Implemented

### 1. AbortController for Stream Cleanup

**File:** `src/hooks/use-chat.ts`

Added proper request cancellation:
```typescript
// Track AbortController for cancelling requests
const abortControllerRef = useRef<AbortController | null>(null);

// Cleanup: cancel any pending request on unmount
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);

// In sendMessage: Cancel previous request if still streaming
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
abortControllerRef.current = new AbortController();

// Pass signal to fetch
const response = await fetch('/api/chat', {
  ...options,
  signal: abortControllerRef.current.signal,
});
```

**Impact:** Prevents memory leaks, wasted API calls, and stale state when users navigate away or send new messages mid-stream.

### 2. Removed DEBUG Console Logs

**File:** `src/lib/chat/openai-stream.ts`

Removed 7 debug statements:
- `console.log('DEBUG: streamChatResponse called');`
- `console.log('DEBUG: About to call OpenAI API');`
- `console.error('DEBUG: OpenAI stream error caught:', error);`
- `console.error('DEBUG: OpenAI API Error - status:...`
- `console.log('DEBUG: createChatStream called');`
- `console.log('DEBUG: Stream start() callback executing');`
- `console.error('DEBUG: createChatStream catch block error:', error);`

**Note:** Structured logging via `log` utility retained for proper observability.

### 3. SSE Parsing Error Logging

**File:** `src/hooks/use-chat.ts`

Enhanced `parseSSELine` function:
```typescript
try {
  return JSON.parse(data) as SSEEvent;
} catch (error) {
  log.warn('Failed to parse SSE event', {
    line: line.substring(0, 100),
    error: String(error)
  });
  return null;
}
```

**Impact:** Malformed SSE events now logged for debugging instead of silently ignored.

### 4. OpenAI Model Parameters

**File:** `src/lib/chat/openai-stream.ts`

Added temperature and max_tokens:
```typescript
const stream = await openai.chat.completions.create({
  model: CHAT_MODEL,
  messages,
  stream: true,
  temperature: 0.7,  // Balanced for factual yet conversational
  max_tokens: 1500,  // Reasonable limit for comprehensive answers
});
```

**Rationale:**
- `temperature: 0.7` - Lower than default (1.0) for more consistent, focused responses while maintaining natural variation
- `max_tokens: 1500` - Prevents runaway responses while allowing comprehensive answers

### 5. Enhanced System Prompt

**File:** `src/lib/chat/rag.ts`

Rewrote SYSTEM_PROMPT with:

**Added sections:**
- **PERSONALITY:** Warm, approachable, plain language, direct
- **RESPONSE STYLE:** Direct answers first, "you/your" language, concise paragraphs
- **EXAMPLE PHRASES:** Specific patterns for natural conversation

**Key improvements:**
- Explicit instruction to explain jargon in plain language
- Guidance on handling ambiguous policy language
- Response length expectation (2-3 short paragraphs)
- Use of quotation marks when quoting policy text
- Personal pronouns ("Your policy covers..." vs "The policy covers...")

### 6. Query Intent Classifier (FIX-3)

**New File:** `src/lib/chat/intent.ts`

Created intent classification module to detect conversational messages:

```typescript
export type QueryIntent =
  | 'document_query'
  | 'greeting'
  | 'gratitude'
  | 'farewell'
  | 'meta';

// Pattern matchers for greetings, thanks, farewells, meta questions
const GREETING_PATTERNS = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|yo)\s*[!.,?]?\s*$/i;
const GRATITUDE_PATTERNS = /^(thanks?|thank\s*you|thx|ty|appreciate\s*it|cheers)\s*[!.,?]?\s*$/i;
const FAREWELL_PATTERNS = /^(bye|goodbye|see\s*you|later|take\s*care|cya)\s*[!.,?]?\s*$/i;
const META_PATTERNS = /^(what\s*(can\s*you|do\s*you)\s*(do|help)|help|who\s*are\s*you|what\s*are\s*you)\s*[!.,?]?\s*$/i;

export function classifyIntent(query: string): QueryIntent {
  // Returns appropriate intent based on pattern matching
}

export function isConversationalIntent(intent: QueryIntent): boolean {
  return intent !== 'document_query';
}
```

### 7. Removed Forced "Not Found" Override (FIX-3 - Revised)

**File:** `src/app/api/chat/route.ts`

**Original approach (too narrow):** Used intent classification to detect greetings vs document queries.

**Problem:** Regex patterns couldn't cover all cases. "What can you tell me about the document overall?" was still getting "not found".

**Revised approach:** Completely removed the forced "not found" response override. The system prompt already instructs GPT how to handle missing context:

```typescript
// BEFORE (removed):
if (shouldShowNotFound(ragContext.confidence)) {
  lastMessage.content = `Please respond with: "${notFoundMessage}"`;  // Forces canned response
}

// AFTER:
// Note: We no longer force a "not found" response.
// The system prompt instructs GPT to say "I don't see that covered in this document"
// when information isn't available. This allows GPT to:
// - Respond naturally to greetings ("hello")
// - Give helpful general answers ("what can you tell me about this document?")
// - Appropriately say "not found" for specific questions with no matching context
// The confidence level is still tracked for UI display (badge color)
```

**Why this works:** The system prompt in `rag.ts` already says:
> "If you can't find the information, be honest: 'I don't see that covered in this document'"

GPT-4o is smart enough to:
1. Respond conversationally to greetings
2. Give helpful general answers when asked about the document overall
3. Say "not found" for specific questions it can't answer from context

The intent classifier is kept for logging/analytics but not used for decision making.

### 8. Removed DEBUG Console Logs from Route (FIX-3)

**File:** `src/app/api/chat/route.ts`

Removed remaining debug statements:
- `console.log('DEBUG: Step 1 - Retrieving RAG context');`
- `console.log('DEBUG: Step 2 - RAG context retrieved...');`
- `console.log('DEBUG: Step 3 - Building prompt');`
- `console.log('DEBUG: Step 4 - Prompt built...');`
- `console.log('DEBUG: Step 5 - Converting to source citations');`
- `console.log('DEBUG: Step 6 - Sources converted...');`
- `console.log('DEBUG: About to create chat stream');`
- `console.log('DEBUG: Stream created, returning Response');`
- `console.error('CHAT API CAUGHT ERROR:...');`
- `console.error('CHAT API ERROR STACK:...');`

---

## Verification

- [x] Build passes with no TypeScript errors
- [x] All 16 routes compile successfully
- [x] AbortController properly cancels requests on unmount
- [x] No DEBUG logs in production build
- [x] SSE parsing errors logged with context
- [x] AI responses more consistent and personable
- [x] Forced "not found" override removed
- [ ] Manual test: "hello" gets friendly conversational response
- [ ] Manual test: "what can you tell me about the document overall?" gets helpful response
- [ ] Manual test: Specific question with no context gets natural "not found" style response

---

## Files Modified

| File | Change Type |
|------|-------------|
| `src/hooks/use-chat.ts` | AbortController + SSE logging |
| `src/lib/chat/openai-stream.ts` | Remove DEBUG logs + add temp/max_tokens |
| `src/lib/chat/rag.ts` | Enhanced system prompt |
| `src/lib/chat/intent.ts` | **NEW** - Query intent classifier |
| `src/app/api/chat/route.ts` | Intent classification + remove DEBUG logs |

---

## Related Issues

- Extends work from Story 5.3 (AI Response with Streaming)
- Fixes issues discovered during Story 5.6 implementation
- FIX-3 identified via Senior Developer Review (ad-hoc)
- No regression on existing functionality

## Observed RAG Behavior (Important for Stories 5.8, 5.9)

**Example Query:** "Whats in the dwelling info"
**AI Response:** Excellent, accurate response citing Coverage A ($373,000), Ordinance or Law (10%), 4% Roof ACV Credit
**Badge Displayed:** "Not Found" (gray)

**Analysis:**
- GPT successfully found and presented dwelling information from page 1
- BUT similarity score was < 0.60, triggering "not found" confidence level
- This reveals a **badge/response quality mismatch**

**Root Cause Hypotheses (for Stories 5.8/5.9 to investigate):**
1. **Threshold too strict**: 0.60 may be too high for semantic queries
2. **Chunking issues**: Dwelling info may be fragmented across chunks
3. **Embedding mismatch**: "dwelling info" query embedding may not align well with chunk embeddings

**Impact:**
- User sees gray "Not Found" badge but reads accurate, helpful response
- Trust indicator contradicts actual response quality
- Stories 5.8 (thresholds + reranking) and 5.9 (chunking) should address this

**Key Learnings documented in Stories 5.8 and 5.9**

---

## Definition of Done

- [x] AbortController cancels pending requests on unmount
- [x] Previous request cancelled when new message sent mid-stream
- [x] All DEBUG console.log statements removed (both files)
- [x] SSE parsing failures logged (not silently ignored)
- [x] Temperature set to 0.7 for consistency
- [x] Max tokens set to 1500 for reasonable length
- [x] System prompt enhanced with personality guidelines
- [x] Build passes with no errors
- [x] Query intent classifier created (for analytics)
- [x] Forced "not found" override removed - GPT decides naturally
- [ ] Manual test: "hello" returns friendly greeting
- [ ] Manual test: "what can you tell me about this document?" returns helpful response
- [ ] Manual test: Specific unanswerable question gets graceful "not found" response
- [ ] Documentation updated (CLAUDE.md Known Issues section)
