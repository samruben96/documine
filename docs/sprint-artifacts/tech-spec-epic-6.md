# Epic Technical Specification: Epic 5 Cleanup & Stabilization + UI Polish

Date: 2025-12-02
Updated: 2025-12-02 (Added UI Polish Stories 6.5-6.9)
Author: BMAD Team (Party Mode)
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 is a focused cleanup and polish epic that addresses:
1. **4 bugs** discovered during comprehensive Epic 5 testing
2. **5 UI polish items** identified through Party Mode UI exploration and research

These issues undermine the core "trust transparency" value proposition and professional appearance. They must be fixed before proceeding to Quote Comparison (now Epic 7).

This epic also establishes improved testing practices with Playwright E2E tests for each fix, ensuring we have regression protection going forward.

### Why This Epic Matters

**Bugs Found (Stories 6.1-6.4):**
1. **Conversations don't persist** (406 error) - Users lose their chat history
2. **Confidence badges are wrong** - Correct answers show "Not Found"
3. **Source citations don't navigate** - Click does nothing
4. **Mobile loses state** - Tab switching resets chat

**UI Polish Issues (Stories 6.5-6.9):**
5. **Stale "Coming in Epic 5" text** - Damages professional credibility
6. **"Connecting..." indicator** - No meaningful feedback to users
7. **No selected document highlight** - Users can't tell which document is active
8. **Bland empty state** - Doesn't guide users or inspire action
9. **Long filename truncation** - Names cut off without tooltip

These are not edge cases - they're core functionality and UX issues that erode user trust.

### Research Basis

UI polish stories (6.5-6.9) are informed by comprehensive research documented in:
- `docs/research-ui-best-practices-2025-12-02.md`

Key sources include:
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [NN/g: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Smashing Magazine: Psychology of Trust in AI](https://www.smashingmagazine.com/2025/09/psychology-trust-ai-guide-measuring-designing-user-confidence/)

## Objectives and Scope

**In Scope:**
- Fix 4 identified bugs from Epic 5 (Stories 6.1-6.4)
- Implement 5 UI polish improvements (Stories 6.5-6.9)
- Add Playwright E2E tests for each fix
- Update CLAUDE.md with learnings
- Document RLS policies
- Document confidence thresholds

**Out of Scope:**
- Major new features
- Performance optimization beyond polish
- Complete UI redesign
- Quote comparison functionality

## Bug Analysis

### BUG-1: Conversation Loading 406 Error

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

### BUG-2: Confidence Score Always "Not Found"

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

### BUG-3: Source Citation Navigation Broken

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

### BUG-4: Mobile Tab State Lost

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

## Story Specifications

### Story 6.1: Fix Conversation Loading (406 Error)

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

### Story 6.2: Fix Confidence Score Calculation

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

### Story 6.3: Fix Source Citation Navigation

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

### Story 6.4: Fix Mobile Tab State Preservation

**Priority:** P1 - Important for mobile users

**Problem Statement:**
When switching between Document and Chat tabs on mobile, the chat history disappears and shows empty state.

**Root Cause Analysis:**
The responsive layout likely unmounts and remounts the ChatPanel component when switching tabs. If the chat state is only in component state (not loaded from database), it's lost on remount.

The `useConversation` hook should reload history on mount, but either:
- The hook isn't being called on remount
- The 406 error (BUG-1) prevents loading

**Dependencies:** Story 6.1 (406 fix) may resolve this.

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.4.1 | Chat history persists when switching to Document tab and back | Playwright: mobile viewport, send message, switch tabs, switch back |
| AC-6.4.2 | Chat input preserves draft text when switching tabs | Playwright: type in input, switch tabs, switch back, verify text |
| AC-6.4.3 | Loading state shown while fetching conversation | Playwright: verify loading indicator |
| AC-6.4.4 | Tab switch is instant (no full page reload) | Playwright: verify URL doesn't change |

**Implementation Approach:**

1. First, verify Story 6.1 is complete (406 fix). This may resolve the issue.

2. If still broken, investigate:
   - Is ChatPanel remounting? (add useEffect log)
   - Is useConversation refetching? (add fetch log)
   - Is the data coming back? (check network tab)

3. Potential fixes:
   - Use `key` prop to prevent remounting
   - Lift conversation state to page level
   - Use React context for chat state

**Test Plan:**
```typescript
// __tests__/e2e/mobile-tab-state.spec.ts
test('chat state persists across tab switches on mobile', async ({ page }) => {
  // Set viewport to mobile (390x844)
  // Navigate to document
  // Click Chat tab
  // Send message "Hello"
  // Wait for response
  // Click Document tab
  // Click Chat tab
  // Verify "Hello" message is visible
  // Verify response is visible
});
```

---

## UI Polish Stories (6.5-6.9)

These stories address UI/UX issues identified through Party Mode exploration and research.

### Story 6.5: Remove Stale UI Text & Fix Page Title

**Priority:** P0 - Embarrassment fix

**Problem Statement:**
The UI contains stale text that damages professional credibility:
1. "Coming in Epic 5" text appears in the main area - Epic 5 is complete
2. Browser tab shows "Create Next App" instead of "docuMINE"

**Evidence (from Playwright snapshot):**
```yaml
- paragraph [ref=e63]: Chat with your document
- paragraph [ref=e64]: Coming in Epic 5  # ← STALE
- Page Title: Create Next App  # ← WRONG
```

**User Impact:** First impression damage. Users perceive product as unfinished or unprofessional.

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.5.1 | "Coming in Epic 5" text removed from all pages | Visual inspection |
| AC-6.5.2 | Browser tab shows "docuMINE" or "docuMINE - Documents" | Playwright: check page.title() |
| AC-6.5.3 | No references to "Epic X" in user-facing UI | Grep codebase |
| AC-6.5.4 | Document page title shows document name | Playwright: verify title includes filename |

**Implementation Approach:**

1. Fix page title in `src/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'docuMINE',
  description: 'AI-powered document analysis for insurance agents',
};
```

2. Remove stale text in `src/app/(dashboard)/documents/[id]/page.tsx` and `src/app/(dashboard)/documents/page.tsx`

3. Add dynamic page titles for document pages:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const document = await getDocument(params.id);
  return {
    title: document ? `${document.filename} - docuMINE` : 'docuMINE',
  };
}
```

**Effort:** XS (15-30 minutes)

---

### Story 6.6: Connection Status & Realtime Indicator

**Priority:** P1 - User feedback improvement

**Problem Statement:**
The UI shows "Connecting..." without ever resolving to a meaningful state. Users don't know if the system is working.

**Evidence (from Playwright snapshot):**
```yaml
- generic [ref=e310]: Connecting...  # ← Never changes
```

**User Impact:** Uncertainty about system state. Users may think something is broken.

**Research Basis:**
> "Immediate responses or indicators to user inputs" - Core chatbot UX principle
> "Feedback principle: users need to know system state"

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.6.1 | Shows "Connected" with checkmark when realtime connected | Playwright: verify text change |
| AC-6.6.2 | Shows "Connecting..." with spinner during connection | Visual inspection |
| AC-6.6.3 | Shows "Offline" or reconnecting state if disconnected | Disconnect network, verify UI |
| AC-6.6.4 | Indicator is subtle, not distracting | Design review |
| AC-6.6.5 | Auto-reconnect attempts shown to user | Verify reconnection behavior |

**Implementation Approach:**

1. Update `src/hooks/use-realtime.ts` to expose connection state:
```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export function useRealtimeConnection() {
  const [state, setState] = useState<ConnectionState>('connecting');
  // ... existing logic with state updates
  return { state, isConnected: state === 'connected' };
}
```

2. Create `src/components/ui/connection-indicator.tsx`:
```typescript
export function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const indicators = {
    connecting: { icon: Spinner, text: 'Connecting...', color: 'text-muted-foreground' },
    connected: { icon: CheckCircle, text: 'Connected', color: 'text-green-600' },
    disconnected: { icon: WifiOff, text: 'Offline', color: 'text-red-600' },
    reconnecting: { icon: RefreshCw, text: 'Reconnecting...', color: 'text-yellow-600' },
  };
  // ... render based on state
}
```

3. Replace static "Connecting..." text with dynamic indicator.

**Effort:** S (1-2 hours)

---

### Story 6.7: Document Selection Visual Feedback

**Priority:** P1 - Navigation clarity

**Problem Statement:**
When a document is selected, there's no visual indication in the sidebar showing which document is currently active.

**Evidence (from Playwright snapshot):**
All document items have identical styling:
```yaml
- button "Knox Acuity quote.pdf Ready" [ref=e105]
- button "SJED Check List.pdf Ready" [ref=e134]
# No visual distinction for selected item
```

**User Impact:** Users can't quickly identify which document they're viewing, especially with similar filenames.

**Research Basis:**
> "Highlighting hover and active states provides users with important interaction cues"
> "Use color changes or subtle shadows to indicate hover and active states"

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.7.1 | Selected document has distinct background color | Visual inspection |
| AC-6.7.2 | Selected state persists across page navigation | Playwright: navigate, verify styling |
| AC-6.7.3 | Hover state distinct from selected state | Manual testing |
| AC-6.7.4 | Selection visible in both light and dark modes | Test both themes |
| AC-6.7.5 | Accessible - not relying on color alone | Add aria-selected attribute |

**Implementation Approach:**

1. Update `src/components/documents/document-list-item.tsx`:
```typescript
interface DocumentListItemProps {
  document: Document;
  isSelected: boolean;  // New prop
  onSelect: () => void;
}

export function DocumentListItem({ document, isSelected, onSelect }: DocumentListItemProps) {
  return (
    <button
      onClick={onSelect}
      aria-selected={isSelected}
      className={cn(
        'w-full p-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-primary/10 border-l-2 border-primary'
      )}
    >
      {/* ... existing content */}
    </button>
  );
}
```

2. Pass selected state from parent based on URL params.

**Effort:** S (1-2 hours)

---

### Story 6.8: Empty State UX Improvement

**Priority:** P2 - Onboarding improvement

**Problem Statement:**
The empty state when no document is selected is bland and doesn't guide users effectively.

**Current State:**
```
Select a document
Choose a document from the sidebar to view and analyze it
```

**User Impact:** New users aren't inspired to take action. No clear value proposition shown.

**Research Basis:**
> "Two parts instruction, one part delight" - Empty state rule of thumb
> "Action-focused empty states urge users toward action to fill the space"
> "Clear CTA for primary action"

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.8.1 | Empty state has engaging headline | Visual inspection |
| AC-6.8.2 | Clear CTA button for upload (if no documents) | Playwright: verify button exists |
| AC-6.8.3 | Different messaging for "no documents" vs "select document" | Test both states |
| AC-6.8.4 | Visual illustration or icon | Design review |
| AC-6.8.5 | Responsive on mobile | Test mobile viewport |

**Implementation Approach:**

1. Create `src/components/documents/empty-state.tsx`:
```typescript
interface EmptyStateProps {
  variant: 'no-documents' | 'select-document';
  onUpload?: () => void;
}

export function EmptyState({ variant, onUpload }: EmptyStateProps) {
  if (variant === 'no-documents') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileUp className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ready to analyze your documents</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Upload a policy, quote, or certificate and start asking questions in seconds
        </p>
        <Button onClick={onUpload} size="lg">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Select a document to get started</h2>
      <p className="text-muted-foreground max-w-md">
        Choose a document from the sidebar to view it and chat with AI about its contents
      </p>
    </div>
  );
}
```

2. Replace existing empty state in document pages.

**Effort:** S (1-2 hours)

---

### Story 6.9: Long Filename Handling

**Priority:** P2 - UX polish

**Problem Statement:**
Long filenames are truncated without any way for users to see the full name.

**Evidence:**
```yaml
- paragraph [ref=e81]: 10.17.26 Kritzman.Ruben IWGR SA rv7.18 - Stacey Jones Event Design.pdf
# This long name is truncated in the UI
```

**User Impact:** Users can't distinguish between similarly named documents. Insurance documents often have verbose naming conventions.

**Research Basis:**
> "Document Management UX: Clear identification of resources"
> "Tooltips reveal full information on hover"

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.9.1 | Long filenames truncate with ellipsis | Visual inspection |
| AC-6.9.2 | Tooltip shows full filename on hover | Playwright: hover, verify tooltip |
| AC-6.9.3 | Truncation doesn't break mid-word | Test various lengths |
| AC-6.9.4 | Tooltip works on mobile (long press or always visible) | Mobile testing |
| AC-6.9.5 | Truncation consistent across sidebar and header | Check both locations |

**Implementation Approach:**

1. Update `src/components/documents/document-list-item.tsx`:
```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

<Tooltip>
  <TooltipTrigger asChild>
    <p className="text-sm font-medium truncate max-w-[200px]">
      {document.filename}
    </p>
  </TooltipTrigger>
  <TooltipContent side="right" className="max-w-[300px]">
    <p className="break-all">{document.filename}</p>
  </TooltipContent>
</Tooltip>
```

2. Add shadcn/ui Tooltip component if not already installed:
```bash
npx shadcn@latest add tooltip
```

3. Apply same pattern to document header.

**Effort:** XS (30 minutes - 1 hour)

---

## Testing Strategy

### Test-Driven Bug Fixing (TDBF)

For each bug:

1. **Write failing Playwright test first**
   ```bash
   # Test should fail
   npx playwright test conversation-persistence --headed
   ```

2. **Commit failing test**
   ```bash
   git add __tests__/e2e/
   git commit -m "test: add failing test for BUG-X conversation loading"
   ```

3. **Implement fix**

4. **Verify test passes**
   ```bash
   npx playwright test conversation-persistence --headed
   ```

5. **Commit fix with passing test**
   ```bash
   git add .
   git commit -m "fix: resolve conversation loading 406 error (BUG-1)"
   ```

### Playwright Test Structure

```
__tests__/
├── e2e/
│   ├── conversation-persistence.spec.ts  # Story 6.1
│   ├── confidence-display.spec.ts        # Story 6.2
│   ├── citation-navigation.spec.ts       # Story 6.3
│   └── mobile-tab-state.spec.ts          # Story 6.4
├── fixtures/
│   └── test-documents/                   # PDFs for testing
└── playwright.config.ts
```

### CI Integration

Add to GitHub Actions:
```yaml
- name: Run Playwright Tests
  run: npx playwright test
  env:
    PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
```

---

## Definition of Done (Enhanced)

For each story in Epic 6:

- [ ] Root cause documented in story file
- [ ] Fix implemented
- [ ] Unit test added (if applicable)
- [ ] **Playwright E2E test added**
- [ ] **Playwright test passes locally**
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] PR reviewed
- [ ] Merged to main
- [ ] **Manual verification in browser** (screenshot in PR)
- [ ] CLAUDE.md updated with fix details

---

## Documentation Updates Required

### CLAUDE.md Additions

1. **Confidence Thresholds:**
```markdown
### Confidence Score Thresholds

| Score Type | High | Needs Review | Not Found |
|------------|------|--------------|-----------|
| Vector Similarity | >= 0.75 | 0.50 - 0.74 | < 0.50 |
| Cohere Reranker | >= 0.30 | 0.10 - 0.29 | < 0.10 |
```

2. **RLS Policy Summary:**
```markdown
### RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| documents | agency_id match | agency_id match | agency_id match | agency_id match |
| conversations | user_id match | user_id match | user_id match | user_id match |
| chat_messages | agency_id match | agency_id match | - | - |
```

3. **Error Codes:**
```markdown
### API Error Codes

| Code | HTTP Status | User Message |
|------|-------------|--------------|
| VALIDATION_ERROR | 400 | Invalid request: {details} |
| UNAUTHORIZED | 401 | Authentication required |
| DOCUMENT_NOT_FOUND | 404 | Document not found |
| RATE_LIMIT | 429 | Too many requests. Please wait. |
```

---

## Story Order & Dependencies

```
Story 6.1 (406 Error)
    │
    └──► Story 6.4 (Mobile Tab) - May be resolved by 6.1

Story 6.2 (Confidence) - Independent

Story 6.3 (Citation Nav) - Independent

Story 6.5 (Stale Text) - Independent, P0

Story 6.6 (Connection Status) - Independent

Story 6.7 (Selection Highlight) - Independent

Story 6.8 (Empty State) - Independent

Story 6.9 (Filename Tooltip) - Independent
```

**Recommended Order:**

| Order | Story | Priority | Effort | Rationale |
|-------|-------|----------|--------|-----------|
| 1 | 6.5 | P0 | XS | Quick win, removes embarrassment |
| 2 | 6.1 | P0 | S | Unblocks 6.4 and testing |
| 3 | 6.2 | P0 | M | Core trust feature |
| 4 | 6.3 | P1 | S | UX fix |
| 5 | 6.4 | P1 | S | Verify after 6.1 |
| 6 | 6.6 | P1 | S | User feedback |
| 7 | 6.7 | P1 | S | Navigation clarity |
| 8 | 6.9 | P2 | XS | Quick polish |
| 9 | 6.8 | P2 | S | Onboarding improvement |

**Total Estimated Effort:** ~8-12 hours (4 bugs + 5 polish)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 406 fix breaks existing functionality | Low | High | Comprehensive Playwright tests |
| Cohere threshold calibration wrong | Medium | Medium | Log scores, analyze distribution, iterate |
| Mobile fix requires architecture change | Low | Medium | Try simple fixes first, escalate if needed |
| Playwright tests flaky | Medium | Low | Use proper waits, retry logic |

---

## Success Criteria

Epic 6 is complete when:

**Bug Fixes (Stories 6.1-6.4):**
1. All 4 bugs are fixed and verified via Playwright
2. No console errors on document page load
3. Confidence badges match answer quality
4. Citation clicks navigate PDF correctly
5. Mobile tab switching preserves state

**UI Polish (Stories 6.5-6.9):**
6. No stale "Epic X" text in UI
7. Page title shows "docuMINE" (and document name when applicable)
8. Connection status indicator works correctly
9. Selected document visually highlighted in sidebar
10. Empty state is engaging with clear CTA
11. Long filenames show tooltip on hover

**Quality Gates:**
12. All existing tests pass
13. Build succeeds
14. CLAUDE.md updated with learnings
15. RLS policy documentation added
16. UI research documented

---

## Non-Functional Requirements

### Performance
- **No performance degradation**: All fixes maintain existing response times
- **Realtime indicator**: Connection state updates within 500ms of actual state change
- **Tooltip hover delay**: Standard 300ms delay for filename tooltips

### Security
- **RLS policy verification**: Story 6.1 must verify policy allows SELECT for user's own rows only
- **No cross-user data access**: Conversation loading must not expose other users' data
- **Audit logging**: Failed RLS attempts should be logged for security review

### Reliability
- **Graceful degradation**: If conversation loading fails, show empty state with retry option
- **Connection recovery**: Realtime indicator must show reconnection attempts
- **Error boundaries**: UI errors should not crash entire document page

### Observability
- **Score logging**: Story 6.2 must log vector similarity, reranker score, and final confidence for debugging
- **RLS error logging**: 406 errors should log policy name that rejected
- **Client-side error tracking**: Console errors captured for debugging

---

## Pre-Story Verification Checklist

**CRITICAL: Complete before starting ANY story implementation**

### For Each Bug Fix Story (6.1-6.4)

Before writing code:
- [ ] Reproduce bug in local environment
- [ ] Document exact steps to reproduce
- [ ] Capture console errors/network requests
- [ ] Write failing Playwright test
- [ ] Commit failing test with message `test: add failing test for BUG-X`

After implementing fix:
- [ ] Playwright test passes
- [ ] Manual verification in browser (desktop)
- [ ] Manual verification in browser (mobile viewport)
- [ ] No new console errors
- [ ] `npm run build` passes
- [ ] `npm run test` passes

### For Each UI Polish Story (6.5-6.9)

Before writing code:
- [ ] Take "before" screenshot
- [ ] Identify all affected files
- [ ] Check for existing components/patterns to reuse
- [ ] Write Playwright test for expected behavior

After implementing:
- [ ] Take "after" screenshot
- [ ] Visual comparison shows improvement
- [ ] No regressions in other areas
- [ ] Responsive at all breakpoints (mobile, tablet, desktop)
- [ ] Dark mode still works (if applicable)

---

## RLS Policy Testing Matrix

**Learning from Epic 5:** RLS policies need symmetric testing for all operations.

### Required Tests for Story 6.1

| Table | Operation | Test Case | Expected Result |
|-------|-----------|-----------|-----------------|
| conversations | SELECT | Own conversation by document_id + user_id | ✅ Returns data |
| conversations | SELECT | Other user's conversation | ❌ Empty result (not 406) |
| conversations | SELECT | Different agency conversation | ❌ Empty result |
| conversations | INSERT | Create with own user_id/agency_id | ✅ Success |
| conversations | INSERT | Create with other user_id | ❌ Policy rejection |
| chat_messages | SELECT | Messages for own conversation | ✅ Returns data |
| chat_messages | SELECT | Messages for other user's conversation | ❌ Empty result |

### SQL Verification Queries

```sql
-- Run as authenticated user to verify policies
-- 1. Check policy definitions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual::text
FROM pg_policies
WHERE tablename IN ('conversations', 'chat_messages')
ORDER BY tablename, cmd;

-- 2. Test SELECT on conversations (should return own rows)
SELECT id, document_id, user_id, created_at
FROM conversations
WHERE document_id = 'test-doc-id';

-- 3. Verify get_user_agency_id() function works
SELECT get_user_agency_id();
```

---

## Score Semantics Documentation

**Learning from Epic 5:** Score conflation caused confidence badge bugs.

### Score Types and Their Meanings

| Score | Source | Range | Meaning |
|-------|--------|-------|---------|
| `vectorSimilarity` | pgvector cosine distance | 0.0 - 1.0 | How similar chunk embedding is to query embedding |
| `rerankerScore` | Cohere rerank API | 0.0 - 1.0 | How relevant chunk is to answering the query |
| `confidenceScore` | Computed | 0.0 - 1.0 | Score used for UI badge display |

### Score Flow Diagram

```
Query → Embedding → pgvector search → vectorSimilarity (0.0-1.0)
                                           ↓
                           [If reranker enabled]
                                           ↓
                    Cohere rerank → rerankerScore (0.0-1.0)
                                           ↓
                    calculateConfidence() → UI Badge
```

### Threshold Calibration (Story 6.2)

**Vector Similarity Thresholds (current):**
| Range | Confidence Level |
|-------|-----------------|
| >= 0.75 | High |
| 0.50 - 0.74 | Needs Review |
| < 0.50 | Not Found |

**Cohere Reranker Thresholds (proposed):**
| Range | Confidence Level |
|-------|-----------------|
| >= 0.30 | High |
| 0.10 - 0.29 | Needs Review |
| < 0.10 | Not Found |

**Note:** Thresholds should be calibrated with actual score distribution logging.

---

## Appendix A: Playwright Test Commands

```bash
# Install Playwright (if not already)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test conversation-persistence

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate test from recording
npx playwright codegen http://localhost:3000

# Run specific test by name
npx playwright test -g "confidence badge"

# Run tests with specific browser
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright test --project=firefox
```

---

## Appendix B: Debug Commands for Each Bug

### BUG-1: 406 Error Debug

```bash
# Check Supabase RLS policies
npx supabase db dump --schema public | grep -A 10 "conversations"

# Test policy locally
curl -X GET 'http://localhost:54321/rest/v1/conversations?select=*&document_id=eq.XXX&user_id=eq.YYY' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT"
```

### BUG-2: Confidence Score Debug

```javascript
// Add to src/lib/chat/reranker.ts temporarily
console.log('Score debug:', {
  vectorSimilarity: chunk.vectorSimilarity,
  rerankerScore: result.relevanceScore,
  queryIntent: intent,
  finalConfidence: confidence
});
```

### BUG-3: Citation Navigation Debug

```javascript
// Add to source-citation.tsx onClick handler
console.log('Citation click:', { targetPage, currentPage });

// Add to document-viewer.tsx
useEffect(() => {
  console.log('Page changed to:', currentPage);
}, [currentPage]);
```

### BUG-4: Mobile Tab Debug

```javascript
// Add to chat-panel.tsx
useEffect(() => {
  console.log('ChatPanel mounted, conversation:', conversation?.id);
  return () => console.log('ChatPanel unmounting');
}, []);
```

---

## Appendix C: Component Dependencies

### Existing Components to Reuse

| Component | Path | Usage in Epic 6 |
|-----------|------|-----------------|
| Tooltip | `src/components/ui/tooltip.tsx` | Story 6.9 (filename tooltip) |
| Button | `src/components/ui/button.tsx` | Story 6.8 (empty state CTA) |
| Badge | `src/components/ui/badge.tsx` | Story 6.6 (connection indicator) |

### New Components to Create

| Component | Path | Story |
|-----------|------|-------|
| ConnectionIndicator | `src/components/ui/connection-indicator.tsx` | 6.6 |
| EmptyState | `src/components/documents/empty-state.tsx` | 6.8 |

---

## Appendix D: Files Changed Per Story

| Story | Files to Modify | Files to Create |
|-------|-----------------|-----------------|
| 6.1 | `supabase/migrations/00008_*.sql` | `__tests__/e2e/conversation-persistence.spec.ts` |
| 6.2 | `src/lib/chat/reranker.ts`, `src/lib/chat/confidence.ts`, `src/lib/chat/types.ts` | `__tests__/e2e/confidence-display.spec.ts` |
| 6.3 | `src/components/chat/source-citation.tsx`, `src/app/(dashboard)/documents/[id]/page.tsx` | `__tests__/e2e/citation-navigation.spec.ts` |
| 6.4 | `src/components/layout/split-view.tsx`, `src/hooks/use-conversation.ts` | `__tests__/e2e/mobile-tab-state.spec.ts` |
| 6.5 | `src/app/layout.tsx`, `src/app/(dashboard)/documents/[id]/page.tsx` | - |
| 6.6 | `src/hooks/use-realtime.ts` | `src/components/ui/connection-indicator.tsx` |
| 6.7 | `src/components/documents/document-list-item.tsx` | - |
| 6.8 | `src/app/(dashboard)/documents/page.tsx` | `src/components/documents/empty-state.tsx` |
| 6.9 | `src/components/documents/document-list-item.tsx` | - |

---

## Appendix E: CLAUDE.md Updates Checklist

After Epic 6 completion, add to CLAUDE.md:

- [ ] Confidence score thresholds table (vector + reranker)
- [ ] RLS policy summary table for all tables
- [ ] Query intent classification explanation
- [ ] Score semantics documentation
- [ ] Bug fix learnings for each of the 4 bugs

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-12-02_
_Updated: 2025-12-02 (Added recommendations from Epic 5 retrospective)_
_Source: Epic 5 Full Retrospective (Party Mode Analysis)_
