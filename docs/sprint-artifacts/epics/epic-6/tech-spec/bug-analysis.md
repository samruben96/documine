# Bug Analysis

## BUG-1: Conversation Loading 406 Error

**Severity:** 🔴 HIGH

**Evidence:**
```
Console: Failed to load resource: 406
URL: /rest/v1/conversations?select=*&document_id=eq.X&user_id=eq.Y
```

**Root Cause Analysis (Updated 2025-12-02):**

The migration file `00003_rls_policies.sql` shows SELECT policies DO exist:
```sql
CREATE POLICY "Conversations scoped to agency - SELECT" ON conversations
  FOR SELECT
  USING (agency_id = get_user_agency_id());
```

However, the policy uses `agency_id` comparison, but the client query filters by `user_id`:
```typescript
// use-conversation.ts:80-87
const { data: existingConversation, error: findError } = await supabase
  .from('conversations')
  .select('*')
  .eq('document_id', documentId)
  .eq('user_id', user.id)  // Query filters by user_id
  // RLS policy checks agency_id via get_user_agency_id()
```

**Possible Root Causes to Investigate:**
1. **`get_user_agency_id()` returns NULL** - If user record doesn't exist or agency_id is NULL, all comparisons fail
2. **Policy not applied to authenticated role** - Check if policy includes `TO authenticated`
3. **HTTP 406 = Accept header mismatch** - PostgREST returns 406 when client requests format server can't provide

**Investigation Steps for Story 6.1:**
```sql
-- 1. Verify user has agency_id set
SELECT id, agency_id FROM users WHERE id = auth.uid();

-- 2. Test helper function
SELECT get_user_agency_id();

-- 3. Check conversation's agency_id matches user's
SELECT c.id, c.agency_id, u.agency_id as user_agency
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.user_id = auth.uid();
```

**User Impact:** Conversations don't persist. Users return to document and see empty chat.

**Files to Investigate:**
- `supabase/migrations/00003_rls_policies.sql` - RLS policies (verified SELECT exists)
- `src/hooks/use-conversation.ts` - Client-side loading
- `src/lib/chat/service.ts` - Server-side creation (uses service role)
- Check if server-side creation sets correct `agency_id`

---

## BUG-2: Confidence Score Always "Not Found"

**Severity:** 🔴 HIGH

**Evidence:**
```
Query: "What is the total annual premium?"
Response: "Great question! Your total annual premium is $6,060.00..."
Badge: "Not Found" (gray) ❌ Should be: "High Confidence" (green)
```

**Root Cause:** In `src/lib/chat/reranker.ts:114`:
```typescript
similarityScore: result.relevanceScore,  // Cohere score replaces vector similarity
```

Cohere relevance scores have different distribution than vector similarity scores. A relevant result might have Cohere score of 0.3, but our threshold requires >= 0.50 for "needs_review" and >= 0.75 for "high".

**User Impact:** Users see contradictory UI - helpful answer with "Not Found" badge. Erodes trust.

**Files to Fix:**
- `src/lib/chat/reranker.ts` - Score handling
- `src/lib/chat/confidence.ts` - Threshold calibration or separate score
- `src/lib/chat/types.ts` - Add separate score properties

---

## BUG-3: Source Citation Navigation Broken

**Severity:** 🟡 MEDIUM

**Evidence:**
```
Action: Click "View page 2 in document"
Expected: PDF scrolls to page 2
Actual: PDF stays on page 1, no visual feedback
```

**Root Cause:** Page change event from citation click not properly wired to document viewer state.

**User Impact:** Users can't verify sources without manually navigating. Core trust feature broken.

**Files to Investigate:**
- `src/components/chat/source-citation.tsx` - Click handler
- `src/components/documents/document-viewer.tsx` - Page change handler
- `src/app/(dashboard)/documents/[id]/page.tsx` - State wiring

---

## BUG-4: Mobile Tab State Lost

**Severity:** 🟡 MEDIUM

**Evidence:**
```
Action: Desktop view → Resize to mobile → Click Chat tab
Expected: See conversation history
Actual: See empty state with suggested questions
```

**Root Cause:** Chat component remounts on responsive breakpoint change, losing client-side state. Conversation history should load from database via useConversation hook.

**User Impact:** Mobile users lose context when switching tabs.

**Files to Investigate:**
- `src/components/layout/split-view.tsx` - Responsive logic
- `src/hooks/use-conversation.ts` - Should reload on mount
- `src/components/chat/chat-panel.tsx` - State initialization

---
