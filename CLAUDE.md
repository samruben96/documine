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
