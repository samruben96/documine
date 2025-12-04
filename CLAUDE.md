# Project: docuMINE

## GitHub Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| **documine** (main) | Next.js app, TypeScript code | https://github.com/samruben96/documine |
| **docling-for-documine** | Python Docling service | https://github.com/samruben96/docling-for-documine |

## Deployments

| Service | Platform | URL |
|---------|----------|-----|
| Docling Service | Railway | https://docling-for-documine-production.up.railway.app |
| Supabase | Supabase Cloud | Project ID: `nxuzurxiaismssiiydst` |

## Project Structure

Everything is inside the `documine` directory (git repo root):

- **Git repository:** `/Users/samruben/sams-tool/documine`
- **BMAD framework:** `/.bmad/` (local only, mostly gitignored)
- **BMAD project config:** `/.bmad/bmm/config.yaml` (tracked)
- **Project docs:** `/docs/` (tracked - all project artifacts)
- **Sprint artifacts:** `/docs/sprint-artifacts/`
- **Source code:** `/src/`

## Key Paths

```
documine/                     # ← GIT ROOT
├── .bmad/                    # BMAD framework (mostly gitignored)
│   ├── _cfg/                 # gitignored (installer configs)
│   ├── core/                 # gitignored (framework engine)
│   ├── docs/                 # gitignored (framework docs)
│   └── bmm/
│       ├── agents/           # gitignored (stock personas)
│       ├── workflows/        # gitignored (stock workflows)
│       ├── docs/             # gitignored (module docs)
│       └── config.yaml       # TRACKED (project-specific)
├── docs/                     # TRACKED (all project artifacts)
│   ├── sprint-artifacts/     # Stories, tech specs, sprint status
│   ├── deployment/           # Deployment guides
│   ├── architecture.md
│   ├── prd.md
│   └── ...
├── src/                      # TRACKED (application code)
├── __tests__/                # TRACKED (test files)
├── supabase/                 # TRACKED (Supabase functions)
├── package.json
└── .git/
```

**BMAD Framework Note:** Framework files exist locally for BMAD operation but are gitignored (like `node_modules`). Only `config.yaml` is tracked. Project artifacts in `docs/` are always tracked.

## Git Commands

All git commands run from the `documine` directory.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- Tailwind CSS + shadcn/ui
- Vitest + React Testing Library
- Zod for validation
- React Hook Form

## Testing

- Run tests: `npm run test`
- Run build: `npm run build`
- Dev server: `npm run dev`

## BMAD Workflow

This project uses the BMAD Method for development. Stories are tracked in `docs/sprint-artifacts/sprint-status.yaml`.

## Supabase

- **Project ID:** `nxuzurxiaismssiiydst`
- **Project Name:** Testing and messing
- **Region:** us-east-2

**IMPORTANT:** The Supabase MCP integration for this project can ONLY access this project ID: `nxuzurxiaismssiiydst`

Use this project ID for all Supabase MCP operations:
```
mcp__supabase__execute_sql(project_id: "nxuzurxiaismssiiydst", ...)
mcp__supabase__deploy_edge_function(project_id: "nxuzurxiaismssiiydst", ...)
```

## Document Processing

Document processing uses **Docling** (self-hosted) instead of LlamaParse. See `docs/deployment/docling.md` for deployment details.

- **Docling Service Repo:** https://github.com/samruben96/docling-for-documine
- **Production URL:** https://docling-for-documine-production.up.railway.app
- **TypeScript client:** `src/lib/docling/client.ts`
- **Edge Function:** `supabase/functions/process-document/index.ts`

**Local development:**
```bash
# Clone docling repo as sibling directory
cd .. && git clone https://github.com/samruben96/docling-for-documine.git
cd documine && docker-compose up docling
# Set DOCLING_SERVICE_URL=http://localhost:8000 in .env.local
```

## Known Issues / Bug Fixes

### LlamaParse Replaced by Docling (Story 4.8, 2025-11-30)

**Issue:** LlamaParse API had multiple issues:
- Page separator placeholder case sensitivity (`{pageNumber}` vs `{page_number}`)
- 75% table extraction accuracy insufficient for insurance documents
- API costs accumulated with scale

**Resolution:** Migrated to self-hosted Docling service:
- 97.9% table extraction accuracy (IBM TableFormer model)
- Zero API costs
- Full data privacy
- Same page marker format (`--- PAGE X ---`) for backward compatibility

**Files Changed:**
- `src/lib/docling/client.ts` (new - replaces llamaparse client)
- `src/lib/documents/chunking.ts` (updated import)
- `supabase/functions/process-document/index.ts` (updated to call Docling)
- Docling Python service in separate repo: https://github.com/samruben96/docling-for-documine

**Environment Variable:** `DOCLING_SERVICE_URL` replaces `LLAMA_CLOUD_API_KEY`

### Epic 5 Chat Integration Bug Fixes (2025-12-01)

Multiple bugs were discovered during Story 5.6 implementation and resolved:

#### 1. Document Viewer Not Loading (Spinning Forever)
**Issue:** Document viewer showed infinite loading spinner for ready documents.
**Cause:** Code checked `status !== 'completed'` but documents have status `'ready'`.
**Fix:** Changed to `status !== 'ready'` in `src/app/(dashboard)/documents/[id]/page.tsx`.

#### 2. Vector Search 404 Error
**Issue:** `match_document_chunks` RPC function returned 404 for similarity search.
**Cause:** Function's search_path excluded pgvector's `extensions` schema, making `<=>` operator unavailable.
**Fix:** Applied migration with `SET search_path = public, extensions` to include pgvector operators.

#### 3. Chat Request Validation Error (`conversationId: null`)
**Issue:** Chat API returned "Invalid request: expected string, received null".
**Cause:** `useChat` hook sent `conversationId: null` but Zod expected `string | undefined`.
**Fix:** Only include `conversationId` in request body when truthy in `src/hooks/use-chat.ts`.

#### 4. Chat 500 Error - Client/Server Boundary Violation
**Issue:** Chat API returned 500 error with message "Attempted to call calculateConfidence() from the server but calculateConfidence is on the client".
**Cause:** `calculateConfidence()` was defined in `'use client'` component (`confidence-badge.tsx`) but called from server-side API route.
**Fix:** Created shared server-compatible module `src/lib/chat/confidence.ts`:
- Extracted `ConfidenceLevel` type and `calculateConfidence()` function
- Updated client component to re-export from shared module (backward compatible)
- Updated all server-side files to import from shared module:
  - `src/lib/chat/types.ts`
  - `src/lib/chat/rag.ts`
  - `src/lib/chat/service.ts`
  - `src/lib/chat/openai-stream.ts`

**Key Learning:** In Next.js App Router, functions exported from `'use client'` files cannot be called from server-side code (API routes, server components). Pure utility functions should be in separate non-client modules.

### Streaming & AI Personality Fixes (Story 5.11, 2025-12-01)

Three issues fixed post-implementation:

#### 1. Streaming Memory Leaks & Debug Logs
**Issue:** Memory leaks when navigating away during streaming; DEBUG console.logs in production.
**Fixes:**
- Added `AbortController` to `useChat` hook - cancels pending requests on unmount or new message
- Removed DEBUG console.log statements from `openai-stream.ts` and `route.ts`
- Added SSE parsing error logging (was silently ignored)

**Files Changed:**
- `src/hooks/use-chat.ts` - AbortController + SSE error logging
- `src/lib/chat/openai-stream.ts` - Removed DEBUG logs
- `src/app/api/chat/route.ts` - Removed DEBUG logs

#### 2. AI Personality Improvements
**Issue:** AI responses inconsistent (temperature=1.0 default) and lacking personality.
**Fixes:**
- Set `temperature: 0.7` for balanced factual/conversational responses
- Set `max_tokens: 1500` to prevent overly long responses
- Enhanced system prompt with personality guidelines, response style, example phrases

**Files Changed:**
- `src/lib/chat/openai-stream.ts` - Added temperature/max_tokens
- `src/lib/chat/rag.ts` - Rewrote SYSTEM_PROMPT with personality section

#### 3. Greetings/General Questions Return "Not Found" (FIX-3)
**Issue:** "hello" or "what can you tell me about this document?" returned "I couldn't find information about that in this document."
**Root Cause:** Code in route.ts forced GPT to respond with canned "not found" message when RAG confidence was low, regardless of query type.
**Fix:** Removed the forced "not found" override entirely. GPT now decides naturally based on the system prompt which says "If you can't find the information, be honest: 'I don't see that covered in this document'".

**Files Changed:**
- `src/lib/chat/intent.ts` - **NEW** - Query intent classifier (for logging/analytics)
- `src/app/api/chat/route.ts` - Removed forced "not found" override

**Key Learning:** Don't override LLM behavior with forced responses. The system prompt already instructs GPT how to handle missing context. GPT-4o is smart enough to respond conversationally to greetings, give helpful general answers, and say "not found" appropriately for unanswerable questions.

**Key Configuration:**
```typescript
// OpenAI parameters (openai-stream.ts)
temperature: 0.7,  // Balanced for insurance docs
max_tokens: 1500   // Reasonable response length
```

### PDF "page-dimensions" Error Handling (Story 5.13, 2025-12-02)

**Issue:** Some PDFs fail to parse with libpdfium error: "could not find the page-dimensions for the given page"
**Root Cause:** PDF format issue in libpdfium when performing cell matching during table extraction
**Reference:** https://github.com/docling-project/docling/issues/2536

**Resolution:** Implemented robust error handling and retry logic:

1. **Error Detection (AC-5.13.1):**
   - Edge Function detects "page-dimensions", "MediaBox", or "libpdfium" errors
   - Returns user-friendly message: "This PDF has an unusual format that our system can't process. Try re-saving it with Adobe Acrobat or a PDF converter."

2. **Retry with Fallback (AC-5.13.2):**
   - On page-dimensions error, retry with `?disable_cell_matching=true`
   - Docling service initializes two converters (standard and fallback)
   - Fallback converter disables `do_cell_matching` in table extraction

3. **Diagnostic Logging (AC-5.13.3):**
   - Logs PDF size, filename, error type for analysis
   - Structured logging helps identify problematic PDF patterns

4. **UI Error Display:**
   - Failed documents show user-friendly error in document viewer
   - Error message fetched from `processing_jobs.error_message`
   - `FailedDocumentView` component displays message prominently

**Files Changed:**
- `supabase/functions/process-document/index.ts` - Error detection, retry logic, user-friendly messages
- `src/app/(dashboard)/documents/[id]/page.tsx` - FailedDocumentView component
- `src/hooks/use-processing-progress.ts` - Added errorMap for error messages
- Docling service: `main.py` - Added `disable_cell_matching` query param, fallback converter

**User-Friendly Error Messages:**
```typescript
const USER_FRIENDLY_ERRORS = {
  'page-dimensions': 'This PDF has an unusual format that our system can\'t process. Try re-saving it with Adobe Acrobat or a PDF converter.',
  'timeout': 'Processing timeout: document too large or complex. Try splitting into smaller files.',
  'unsupported-format': 'This file format is not supported. Please upload a PDF, DOCX, or image file.',
};
```

### Conversation Loading 406 Error Fix (Story 6.1, 2025-12-02)

**Issue:** Users could not load their conversation history. The Supabase client returned HTTP 406 "Not Acceptable" when querying the conversations table.

**Root Cause:** The `useConversation` hook used `.single()` modifier when querying for an existing conversation. Per Supabase/PostgREST behavior, `.single()` returns HTTP 406 (PGRST116) when 0 rows match the query - but we expected graceful handling of "no conversation exists yet" case.

**Reference:** https://github.com/orgs/supabase/discussions/2284

**Resolution:** Changed from `.single()` to `.maybeSingle()` in the conversation query:
- `.single()` - Throws 406 error if 0 or >1 rows match
- `.maybeSingle()` - Returns `null` data (no error) if 0 rows match, error only if >1 rows

**Files Changed:**
- `src/hooks/use-conversation.ts` - Changed `.single()` to `.maybeSingle()` on line 90, added error logging
- `__tests__/hooks/use-conversation.test.ts` - Updated mocks to use `maybeSingle()` instead of `single()`
- `__tests__/e2e/conversation-persistence.spec.ts` - **NEW** - Playwright E2E test for conversation persistence

**Key Learning:** When querying Supabase for a record that may or may not exist, always use `.maybeSingle()` instead of `.single()`. The `.single()` modifier is for cases where you expect exactly one row and want an error if that assumption is violated.

```typescript
// ❌ Bad - throws 406 when no conversation exists
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('document_id', documentId)
  .single();

// ✅ Good - returns null data gracefully when no conversation exists
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('document_id', documentId)
  .maybeSingle();
```

### Confidence Score Calculation Fix (Story 6.2, 2025-12-02)

**Issue:** Confidence badge showed "Not Found" even when AI provided accurate, sourced answers. Example: "What is the total annual premium?" returned correct answer with "Not Found" badge.

**Root Cause:** Bug at `src/lib/chat/reranker.ts:114` overwrote `similarityScore` with Cohere `relevanceScore`. Cohere reranker scores have a different distribution than vector similarity scores:
- Vector similarity (cosine): 0.0-1.0, relevant results >= 0.75
- Cohere relevance scores: different scale, highly relevant might score 0.3-0.5

The thresholds were calibrated for vector similarity (0.75/0.50), but were being applied to Cohere scores.

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

**Key Configuration:**
```typescript
// src/lib/chat/confidence.ts
const VECTOR_THRESHOLDS = { high: 0.75, needsReview: 0.50 };
const COHERE_THRESHOLDS = { high: 0.30, needsReview: 0.10 };

// Usage: reranker score takes precedence when available
calculateConfidence(vectorScore, rerankerScore, queryIntent);
```

**Cohere Model Name:** The correct model identifier is `rerank-v3.5` (NOT `rerank-english-v3.5`).
```typescript
// src/lib/chat/reranker.ts
const RERANK_MODEL = 'rerank-v3.5';  // ✅ Correct
// const RERANK_MODEL = 'rerank-english-v3.5';  // ❌ Returns 404
```

**Server Logging:** RAG pipeline now logs score distribution for debugging:
```typescript
log.info('RAG context retrieved', {
  vectorScore,
  rerankerScore,
  queryIntent,
  confidence,
  rerankerUsed,
});
```

## Playwright E2E Testing

Playwright was added for E2E testing in Epic 6. Configuration and tests are located at:

- **Config:** `playwright.config.ts`
- **Tests:** `__tests__/e2e/`

**Run E2E tests:**
```bash
# Run all E2E tests
npx playwright test

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run specific test file
npx playwright test conversation-persistence
```

**Test components have `data-testid` attributes:**
- `chat-panel` - Main chat panel container
- `chat-message` - Individual chat messages (with `data-role` attribute)
- `chat-input` - Message input textarea
- `suggested-questions` - Suggested questions container
- `document-list` - Document sidebar list

## OpenAI SDK Usage (Story 7.2, 2025-12-03)

### Structured Outputs with zodResponseFormat

For extracting structured data from documents, use OpenAI SDK's `zodResponseFormat` instead of function calling:

```typescript
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const mySchema = z.object({
  field1: z.string().nullable().default(null),
  field2: z.number().nullable().default(null),
  items: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })),
});

const response = await openai.chat.completions.parse({
  model: 'gpt-5.1',
  messages: [...],
  response_format: zodResponseFormat(mySchema, 'my_extraction'),
  temperature: 0.1,  // Low for consistent extraction
});

const parsed = response.choices[0].message.parsed;  // Already typed!
```

**Key Points:**
- Use `.nullable().default(null)` for optional fields (not `.optional()`) to ensure consistent null handling
- `message.parsed` is automatically typed and validated against the Zod schema
- No manual JSON parsing or validation needed
- Model: `gpt-5.1` (400K context window)

**Files using this pattern:**
- `src/lib/compare/extraction.ts` - Quote data extraction
- `src/types/compare.ts` - Zod schemas with `quoteExtractionSchema`

### Future Consideration: @openai/agents SDK

For future multi-agent workflows, consider the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/):

```bash
npm install @openai/agents zod@3
```

**When to use:**
- Multi-agent coordination with handoffs
- Complex agentic workflows with guardrails
- Built-in tracing and debugging

**Current decision:** Not needed for single-extraction use case; zodResponseFormat is sufficient.

## Epic 8: Tech Debt & Production Hardening (2025-12-03)

### Database Security Hardening (Story 8.1)

**Issue:** Supabase security advisors flagged 7 functions with implicit `search_path` and leaked password protection disabled.

**Resolution:**
1. Applied migration to set explicit `search_path = public, extensions` on all 7 functions
2. Enabled leaked password protection via Supabase Dashboard (Auth > Attack Protection)

**Pattern for new functions:**
```sql
CREATE OR REPLACE FUNCTION my_function(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- Always include this
AS $$
BEGIN
  -- function body
END;
$$;
```

### RLS Policy Performance Optimization (Story 8.2)

**Issue:** 28 RLS policies re-evaluated `auth.uid()` for every row in result sets. With 100+ rows, this caused O(n) function call overhead.

**Resolution:** Wrapped `auth.uid()` calls in SELECT subqueries to evaluate once per query:

```sql
-- ❌ Bad - evaluates auth.uid() for every row
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO authenticated
USING (agency_id = (SELECT get_user_agency_id()));

-- ✅ Good - evaluates once, O(1)
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO authenticated
USING (agency_id = (SELECT (SELECT get_user_agency_id())));
```

**Verification:** Run `mcp__supabase__get_advisors` with `type: "performance"` - should show 0 `auth_rls_initplan` warnings.

### Rate Limiting Pattern (Story 8.5)

**Implementation:** Rate limits stored in Supabase `rate_limits` table, checked via RPC function.

```typescript
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit';

// In API route after authentication
const rateLimit = await checkRateLimit({
  entityType: RATE_LIMITS.compare.entityType,  // 'agency' or 'user'
  entityId: agencyId,
  endpoint: '/api/compare',
  limit: RATE_LIMITS.compare.limit,      // 10
  windowMs: RATE_LIMITS.compare.windowMs, // 3600000 (1 hour)
});

if (!rateLimit.allowed) {
  return rateLimitExceededResponse(rateLimit, 'Rate limit exceeded message');
}
```

**Configured limits:**
- `/api/compare`: 10 requests/hour per agency (high AI cost)
- `/api/chat`: 100 messages/hour per user (moderate AI cost)

### Supabase Advisor Commands

Use these to check database health:

```typescript
// Security advisors - check for vulnerabilities
mcp__supabase__get_advisors({ project_id: "nxuzurxiaismssiiydst", type: "security" })

// Performance advisors - check for optimization opportunities
mcp__supabase__get_advisors({ project_id: "nxuzurxiaismssiiydst", type: "performance" })
```

**Target state:** 0 WARN-level issues in both security and performance advisors.
