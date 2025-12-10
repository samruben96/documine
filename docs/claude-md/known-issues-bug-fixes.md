# Known Issues / Bug Fixes

## LlamaParse Replaced by Docling (Story 4.8, 2025-11-30)

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
- Updated all server-side files to import from shared module:
  - `src/lib/chat/types.ts`
  - `src/lib/chat/rag.ts`
  - `src/lib/chat/service.ts`
  - `src/lib/chat/openai-stream.ts`

**Key Learning:** In Next.js App Router, functions exported from `'use client'` files cannot be called from server-side code (API routes, server components). Pure utility functions should be in separate non-client modules.

## Streaming & AI Personality Fixes (Story 5.11, 2025-12-01)

Three issues fixed post-implementation:

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

## PDF "page-dimensions" Error Handling (Story 5.13, 2025-12-02)

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

## Conversation Loading 406 Error Fix (Story 6.1, 2025-12-02)

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

## Confidence Score Calculation Fix (Story 6.2, 2025-12-02)

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

## AI Buddy Permissions RLS Policy Infinite Recursion (Story 20.3, 2025-12-09)

**Issue:** Usage Analytics API returned 403 Forbidden even for users with `view_usage_analytics` permission. Postgres logs showed: "infinite recursion detected in policy for relation `ai_buddy_permissions`".

**Root Cause:** The RLS policies on `ai_buddy_permissions` table had circular references:
- "Admins can view agency permissions" policy checked if user has `manage_users` permission
- This check queried the same `ai_buddy_permissions` table it was protecting
- Result: infinite recursion when any permission check occurred

**Problematic Policies Removed:**
```sql
-- These policies caused infinite recursion:
DROP POLICY "Admins can view agency permissions" ON ai_buddy_permissions;
DROP POLICY "Admins can manage agency permissions" ON ai_buddy_permissions;
DROP POLICY "Admins can delete agency permissions" ON ai_buddy_permissions;
```

**Resolution:** Removed the recursive policies, keeping only the simple self-referential policy:
```sql
-- This policy is safe - no recursion
CREATE POLICY "Users can view own permissions" ON ai_buddy_permissions
  FOR SELECT USING (user_id = auth.uid());
```

**Files Changed:**
- Database: Dropped 3 recursive RLS policies on `ai_buddy_permissions` table

**Key Learning:** When creating RLS policies, avoid policies that query the same table they protect. If admin permission checks are needed, either:
1. Use a separate function that bypasses RLS (`SECURITY DEFINER`)
2. Store admin status in a different table (e.g., `users.role`)
3. Use API-level permission checks instead of RLS for complex permission logic

**Note:** The `users.role` column is also required to be `'admin'` for the Settings page to query permissions at all. Both conditions must be met:
1. `users.role = 'admin'` (checked server-side in settings page)
2. `ai_buddy_permissions` has `view_usage_analytics` entry (checked in API route)

## Settings Page Whitespace Bug (AI Disclosure Editor, 2025-12-09)

**Issue:** Large whitespace appeared at the bottom of the Settings page when viewing AI Buddy Admin tab, causing the page to be almost twice as tall as needed.

**Root Cause:** The `sr-only` (screen reader only) class on a Label component uses `position: absolute`, but the parent container lacked `position: relative`. This caused the label to be positioned relative to a distant ancestor, extending the HTML element's scroll height to ~1730px instead of ~734px.

**Problematic Element:**
```tsx
// In src/components/ai-buddy/admin/ai-disclosure-editor.tsx
<div className="space-y-2">  {/* Missing position: relative */}
  <Label htmlFor="ai-disclosure-message" className="sr-only">
    AI Disclosure Message
  </Label>
```

**Resolution:** Added `relative` class to the parent container:
```tsx
<div className="space-y-2 relative">
  <Label htmlFor="ai-disclosure-message" className="sr-only">
```

**Files Changed:**
- `src/components/ai-buddy/admin/ai-disclosure-editor.tsx` - Added `relative` class to sr-only label's parent

**Key Learning:** When using `sr-only` (or any `position: absolute` element), ensure a positioned ancestor exists to contain it. Otherwise, the absolutely positioned element can extend the page layout unexpectedly.

## Admin Permission Checks Failing Due to RLS (Story 21.3-21.5, 2025-12-09)

**Issue:** Admin tab sub-tabs (Users, Usage Analytics, Audit Log, AI Buddy) showed permission errors (403 Forbidden) even though the user had all required permissions in the database.

**Symptoms:**
- Settings page Admin tab visible but sub-tabs showed "Failed to load: {permission} required"
- User Management: "Forbidden: manage_users permission required"
- Usage Analytics: "view_usage_analytics permission required"
- Guardrails Enforcement Log: "Failed to verify permissions"

**Root Cause:** The RLS policy `Users can view own permissions` on `agency_permissions` table uses `auth.uid()` which doesn't resolve correctly in Next.js server contexts (API routes, server components). The `auth.uid()` call returns `null` instead of the authenticated user's ID, causing all permission checks to fail.

**Affected Code Patterns:**
```typescript
// ❌ Bad - RLS auth.uid() fails in server context
const supabase = await createClient();
const { data: permissions } = await supabase
  .from('agency_permissions')
  .select('permission')
  .eq('user_id', authUser.id);  // RLS blocks this even though user_id matches

// ✅ Good - Service client bypasses RLS
const serviceClient = createServiceClient();
const { data: permissions } = await serviceClient
  .from('agency_permissions')
  .select('permission')
  .eq('user_id', authUser.id);  // Works because RLS bypassed
```

**Resolution:** Updated all admin permission checks to use `createServiceClient()` instead of the regular `createClient()`. This is safe because:
1. User authentication is verified first via `supabase.auth.getUser()`
2. We only query permissions for the authenticated user's own `user_id`
3. The service client bypasses RLS but the code still enforces proper authorization

**Files Changed:**

1. **`src/app/(dashboard)/settings/page.tsx`** (lines 118-124)
   - Permissions query now uses `createServiceClient()` to fetch user permissions for Admin tab visibility

2. **`src/app/api/admin/users/route.ts`** (GET, POST, DELETE handlers)
   - All three handlers now use `createServiceClient()` for `manage_users` permission checks
   - Service client initialized early, before permission check

3. **`src/app/api/admin/analytics/route.ts`**
   - Permission check for `view_usage_analytics` now uses `createServiceClient()`

4. **`src/lib/auth/admin.ts`** (`requireAdminAuth()` function)
   - Added `createServiceClient` import
   - Step 4 permission check now uses service client
   - This fixes ALL routes using `requireAdminAuth()` helper

5. **`src/app/api/ai-buddy/admin/guardrails/logs/route.ts`**
   - Uses `createServiceClient()` for audit log queries
   - Changed `users!inner(email)` to `users(email)` (left join) to prevent 500 errors when user records don't exist

**Key Learning:** In Next.js App Router with Supabase, RLS policies that use `auth.uid()` may not work reliably in server contexts because the auth context isn't always properly propagated. For permission checks in API routes:

1. Always verify authentication first with `supabase.auth.getUser()`
2. Use `createServiceClient()` for permission table queries
3. Manually enforce authorization by checking the authenticated user's ID

**Pattern for Admin API Routes:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Get authenticated user (regular client is fine for auth)
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return unauthorized();

  // 2. Check permissions with service client (bypasses RLS)
  const serviceClient = createServiceClient();
  const { data: permissions } = await serviceClient
    .from('agency_permissions')
    .select('permission')
    .eq('user_id', user.id);

  const hasPermission = permissions?.some(p => p.permission === 'required_permission');
  if (!hasPermission) return forbidden();

  // 3. Proceed with service client for cross-user queries
  // ... rest of handler
}
```
