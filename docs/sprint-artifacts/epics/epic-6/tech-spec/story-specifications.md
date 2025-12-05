# Story Specifications

## Story 6.1: Fix Conversation Loading (406 Error)

**Priority:** P0 - Blocks other testing

**Problem Statement:**
Users cannot load their conversation history. The Supabase client returns HTTP 406 when querying the conversations table.

**Root Cause Analysis:**
HTTP 406 "Not Acceptable" in Supabase context typically means RLS policy rejection. The conversation is created server-side (service role bypasses RLS), but loaded client-side (RLS applies). The SELECT policy is either missing or incorrectly scoped.

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.1.1 | RLS policy allows users to SELECT their own conversations | SQL query in Supabase dashboard |
| AC-6.1.2 | Conversation history loads on document page | Playwright: navigate to doc, verify messages appear |
| AC-6.1.3 | Console shows no 406 errors | Playwright: check console messages |
| AC-6.1.4 | Conversation persists across page refresh | Playwright: send message, refresh, verify message appears |
| AC-6.1.5 | User cannot see other users' conversations | Manual test with different user |

**Implementation Approach:**

1. Query current RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'conversations';
```

2. Add/fix SELECT policy:
```sql
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (user_id = auth.uid());
```

3. Also check `chat_messages` table has SELECT policy scoped to agency_id.

**Test Plan:**
```typescript
// __tests__/e2e/conversation-persistence.spec.ts
test('conversation persists across page refresh', async ({ page }) => {
  // Login
  // Navigate to document
  // Send message "What is the premium?"
  // Wait for response
  // Refresh page
  // Verify message "What is the premium?" is visible
  // Verify response is visible
});
```

---

## Story 6.2: Fix Confidence Score Calculation

**Priority:** P0 - Core trust feature

**Problem Statement:**
The confidence badge shows "Not Found" even when the AI provides accurate, sourced answers. This contradicts the trust transparency UX.

**Root Cause Analysis:**
The Cohere reranker replaces `similarityScore` with `relevanceScore`. Cohere scores use a different distribution - a highly relevant result might score 0.3, but our thresholds expect >= 0.75 for "high confidence".

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| A: Keep original vector similarity for confidence | Simple, backward compatible | Reranker relevance not used |
| B: Recalibrate thresholds for Cohere scores | Uses reranker intelligence | Need to analyze score distribution |
| C: Separate properties for each score | Clean separation | More complex data model |

**Recommended: Option C** - Separate properties

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.2.1 | Chunk type has separate `vectorSimilarity` and `rerankerScore` properties | Code review |
| AC-6.2.2 | Confidence calculated from appropriate score (vector if no reranker, reranker if available) | Unit test |
| AC-6.2.3 | Query "What is the total annual premium?" shows "High Confidence" or "Needs Review" | Playwright test |
| AC-6.2.4 | Greeting "Hello!" shows no confidence badge OR "Conversational" indicator | Playwright test |
| AC-6.2.5 | Logging shows score distribution for debugging | Check server logs |

**Implementation Approach:**

1. Update `RetrievedChunk` type:
```typescript
interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber: number;
  boundingBox: BoundingBox | null;
  vectorSimilarity: number;      // Original pgvector score
  rerankerScore?: number;        // Cohere score (if used)
  // Remove: similarityScore (ambiguous)
}
```

2. Update confidence calculation:
```typescript
export function calculateConfidence(
  vectorScore: number | null,
  rerankerScore: number | null | undefined,
  queryIntent: QueryIntent
): ConfidenceLevel {
  // For greetings/conversational, return 'conversational' or null
  if (queryIntent === 'greeting' || queryIntent === 'general') {
    return 'conversational';
  }

  // Use reranker score if available with adjusted thresholds
  if (rerankerScore !== null && rerankerScore !== undefined) {
    if (rerankerScore >= 0.3) return 'high';
    if (rerankerScore >= 0.1) return 'needs_review';
    return 'not_found';
  }

  // Fall back to vector similarity
  if (vectorScore === null) return 'not_found';
  if (vectorScore >= 0.75) return 'high';
  if (vectorScore >= 0.50) return 'needs_review';
  return 'not_found';
}
```

3. Update UI to handle 'conversational' confidence (hide badge or show different indicator).

**Test Plan:**
```typescript
// __tests__/unit/confidence.test.ts
describe('calculateConfidence', () => {
  it('returns high for reranker score >= 0.3', () => {
    expect(calculateConfidence(0.4, 0.35, 'question')).toBe('high');
  });

  it('returns conversational for greeting intent', () => {
    expect(calculateConfidence(0.2, 0.1, 'greeting')).toBe('conversational');
  });
});

// __tests__/e2e/confidence-display.spec.ts
test('accurate answer shows appropriate confidence', async ({ page }) => {
  // Navigate to document with known content
  // Ask "What is the total annual premium?"
  // Wait for response containing "$6,060"
  // Verify confidence badge is NOT "Not Found"
});
```

---

## Story 6.3: Fix Source Citation Navigation

**Priority:** P1 - Important but not blocking

**Problem Statement:**
Clicking a source citation ("View page 2 in document") does not scroll the PDF viewer to the referenced page.

**Root Cause Analysis:**
The click handler exists but the page change event is not properly propagating to the document viewer state. Need to trace the event flow.

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.3.1 | Clicking citation scrolls PDF to correct page | Playwright: click citation, verify page number changes |
| AC-6.3.2 | Visual feedback on click (button shows active state) | Playwright: verify button styling change |
| AC-6.3.3 | Page number input updates to show current page | Playwright: verify page input value |
| AC-6.3.4 | Smooth scroll animation (not instant jump) | Manual verification |
| AC-6.3.5 | Works on mobile (switches to Document tab first) | Playwright: mobile viewport test |

**Implementation Approach:**

1. Trace event flow:
   - `SourceCitation` onClick → should call `onNavigateToPage(pageNumber)`
   - Parent should receive and update `currentPage` state
   - `DocumentViewer` should react to `currentPage` prop change
   - react-pdf should scroll to page

2. Debug with console.log at each step to find where chain breaks.

3. Likely fix: Ensure state is lifted properly or use context/callback.

**Test Plan:**
```typescript
// __tests__/e2e/citation-navigation.spec.ts
test('clicking citation navigates to correct page', async ({ page }) => {
  // Navigate to document
  // Ask question that returns sources
  // Wait for response with citations
  // Note current page number (likely 1)
  // Click "View page 2 in document"
  // Verify page number input shows "2"
  // Verify PDF content changed (can check accessibility tree)
});
```

---

## Story 6.4: DEFERRED to Future Epic F4

**Status:** Deferred (2025-12-02)

**Reason:** Mobile optimization is not a priority for MVP. The mobile tab state preservation bug has been moved to Future Epic F4: Mobile Optimization.

**Original Scope:** Fix mobile tab state preservation - chat history disappears when switching between Document and Chat tabs on mobile viewport.

**See:** Epic F4 in sprint-status.yaml for future implementation.

---
