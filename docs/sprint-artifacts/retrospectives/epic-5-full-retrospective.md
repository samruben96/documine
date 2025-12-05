# Epic 5 Full Retrospective: Document Q&A with Trust Transparency

**Date:** 2025-12-02
**Facilitator:** BMad Master (Party Mode)
**Participants:** Full BMAD Agent Team + Sam (Project Lead)
**Scope:** Complete Epic 5 Analysis (Stories 5.1-5.14)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| Epic | 5: Document Q&A with Trust Transparency |
| Stories Planned | 7 (5.1-5.7) |
| Stories Delivered | 14 (5.1-5.14) |
| Tests Added | 181+ |
| Production Bugs Found Post-Completion | 4 |
| Duration | 2025-11-30 to 2025-12-02 |

### Key Deliverables
- Split-view layout (document + chat side-by-side)
- RAG pipeline with hybrid search (vector + FTS)
- Cohere reranking for improved retrieval
- Real-time streaming responses via SSE
- Trust transparency UI (confidence badges, source citations)
- PDF viewer with react-pdf (zoom, navigation, highlights)
- Conversation history persistence
- Mobile responsive tabbed interface
- OpenRouter integration with Claude Sonnet 4.5
- Table-aware chunking optimization
- Processing progress visualization
- Docling PDF robustness improvements

---

## What Went Well

### Architectural Foundation

1. **Server-Sent Events (SSE) for streaming** - The right choice for perceived speed. Users see text appearing word-by-word instead of waiting 3-5 seconds for complete response.

2. **Clean module separation**:
   - `src/lib/chat/` - RAG pipeline, reranker, vector search
   - `src/lib/openai/` - Embeddings, LLM client
   - `src/hooks/` - Client-side state management
   - `src/components/chat/` - UI components

3. **OpenRouter abstraction (Story 5.10)** - Model evaluation led to Claude Sonnet 4.5 via OpenRouter. The abstraction layer enables model swaps without UI changes.

4. **Incremental optimization** - Stories 5.8-5.10 added hybrid search, chunking improvements, and model evaluation as progressive enhancements.

### Implementation Quality

1. **Story Context XML** - Having all relevant code, architecture decisions, and acceptance criteria in one place made development efficient.

2. **Mid-epic bug fixes** - Caught and fixed 4 major bugs during the epic (document viewer status, vector search 404, client/server boundary, chat validation). CLAUDE.md documentation prevented regression.

3. **Test coverage growth** - 507 → 688 tests (+181). RAG pipeline and confidence calculation have good unit test coverage.

4. **Docling foundation** - 97.9% table extraction accuracy from Story 4.8 made RAG answers much better.

### User Experience

1. **Split-view layout** - Document + Chat side by side enables instant answer verification.

2. **AI personality (Story 5.11)** - Warm, helpful tone with phrases like "Great question!" and "Your policy covers..." makes the AI feel like a knowledgeable colleague.

3. **Mobile tabbed interface** - Correctly adapts to [Document] | [Chat] tabs on mobile.

4. **Processing progress (Story 5.12)** - Visual feedback during long uploads dramatically improves perceived performance.

---

## What Didn't Go Well

### Testing Gaps

1. **Integration testing was weak** - Each story had unit tests, but no end-to-end tests verifying complete flows. BUG-1 (406 error) and BUG-3 (citation navigation) slipped through.

2. **RLS policy verification inconsistent** - Story 5.6 verified users could CREATE conversations but not READ them. Classic policy gap.

3. **Confidence scoring changed 3 times** without a dedicated test set:
   - Original: 0.85/0.60 thresholds
   - Story 5.8: 0.75/0.50 thresholds
   - Cohere reranker changed score distribution entirely

### Architectural Debt

1. **Score conflation** - Reranker overwrites `similarityScore` with `relevanceScore`. These are semantically different:
   - Vector similarity: Embedding distance
   - Relevance score: Answer relevance

   Should have kept both and used appropriate one for each purpose.

2. **No feature flags** - Cohere reranking couldn't be easily A/B tested or gradually rolled out.

3. **Conversation loading asymmetry** - Chat API creates conversations server-side with service role, but client loads via Supabase JS with RLS. Policy mismatch causes 406 errors.

### Process Issues

1. **Story commit bundling** - Bug fixes bundled with story commits instead of separate commits. Git history harder to read.

2. **Late bug discovery** - Found streaming, confidence, and personality bugs AFTER marking stories done.

3. **Scope creep** - Started with 7 stories, delivered 14. Good adaptability but indicates underestimated scope.

4. **Definition of Done not enforced** - Stories marked "done" but some ACs weren't verified in live app.

### Implementation Mistakes

1. **Client/server boundary confusion** - `calculateConfidence()` in 'use client' component caused server import failure. Pure utility functions should NEVER be in client components.

2. **Supabase Realtime + RLS complexity** - Progress visualization required explicit RLS policies for SELECT.

3. **PDF.js quirks** - Document viewer required canvas workarounds in next.config.ts.

### UX Gaps

1. **Silent failure on conversation load** - 406 error shows empty state with no error message.

2. **Confidence badge always shows** - "Hello!" getting "Not Found" badge is wrong UX.

3. **No citation navigation feedback** - Click registers but nothing happens visually.

4. **Tab switch resets state** - Mobile Document/Chat tabs feel like separate pages.

---

## Bugs Found Post-Completion

| Bug | Severity | Description | Root Cause |
|-----|----------|-------------|------------|
| **BUG-1: 406 Conversations Error** | 🔴 HIGH | GET /conversations returns 406 | RLS policy allows INSERT but not SELECT |
| **BUG-2: Confidence Always "Not Found"** | 🔴 HIGH | Correct answers show wrong badge | Cohere scores below 0.50 threshold |
| **BUG-3: Citation No Navigation** | 🟡 MEDIUM | Clicking citation doesn't scroll PDF | Page change event not wired correctly |
| **BUG-4: Mobile Tab State Lost** | 🟡 MEDIUM | Tab switch loses chat history | Component remounts on responsive change |

---

## Key Learnings

### 1. Integration Testing is Non-Negotiable

**Before:** Unit tests per story, manual spot checking

**After:** Playwright E2E tests verifying complete user flows:
- Upload → Process → Chat → Verify answer → Click citation → See page
- Mobile: Same flow with tab switching
- Error cases: Bad PDF, timeout, rate limit

### 2. Score Semantics Matter

**Before:** `similarityScore` overloaded for both "vector distance" and "relevance"

**After:** Keep separate properties:
```typescript
interface RetrievedChunk {
  vectorSimilarity: number;  // Cosine similarity from pgvector
  relevanceScore?: number;   // Cohere reranker score (if used)
  confidenceScore: number;   // Computed score for UI badge
}
```

### 3. RLS Policies Need Symmetric Testing

For every table with RLS, test matrix:
- Can I INSERT? (anon and auth roles)
- Can I SELECT my own? (auth role)
- Can I SELECT others'? (should fail)
- Can I UPDATE my own?
- Can I DELETE my own?

### 4. Confidence UX Needs Context-Awareness

Query intent should influence confidence display:
- Greeting/conversational: Hide badge or show "Conversational"
- Document question: Show High/Needs Review/Not Found
- Follow-up question: Inherit from previous answer

### 5. Definition of Done Must Include Live Verification

```
Tests pass → PR approved → Merged →
Deployed to dev → Manual verification in browser →
Playwright smoke test passes → Done
```

### 6. Epic Scope Should Be Bounded

Cap epics at 8-10 stories. If discovering more work mid-epic:
- If < 2 stories: Add to current epic
- If 2-4 stories: Create follow-up "polish" epic
- If > 4 stories: Re-scope and split

### 7. CLAUDE.md is Living Memory

Every significant bug fix documented with:
- Issue description
- Root cause
- Files changed
- Key learning

---

## Recommendations for Epic 6

### 1. Create Epic 6 as Cleanup Epic
Move current Epic 6 (Quote Comparison) to Epic 7.

### 2. Implement Test-Driven Bug Fixing (TDBF)
```
Before ANY code changes:
1. Create Playwright test that FAILS for each bug
2. Commit the failing test

After fix:
3. Verify Playwright test PASSES
4. Commit fix with test passing
5. Add to CI/CD
```

### 3. Enhanced Definition of Done

For Epic 6 stories:
- [ ] Root cause documented
- [ ] Fix implemented
- [ ] Unit test added (if applicable)
- [ ] Playwright E2E test added
- [ ] Playwright test passes locally
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] PR reviewed
- [ ] Merged to main
- [ ] **Manual verification in browser** (screenshot in PR)
- [ ] CLAUDE.md updated with learning

### 4. Documentation Updates

Epic 6 should produce:
- Confidence threshold documentation in CLAUDE.md
- RLS policy summary table
- Error code inventory
- Playwright test catalog

---

## Team Reflections

**Winston (Architect):** "The architectural foundation is solid. The bugs are integration issues, not fundamental design problems. That's a good sign."

**Amelia (Developer):** "Story Context XML was a game-changer. Having everything in one place made development efficient. The client/server boundary lesson was painful but valuable."

**Sally (UX Designer):** "The AI personality work in Story 5.11 is the soul of docuMINE. The responses feel genuinely helpful. We got that right. The confidence badge bugs are frustrating because they undermine that trust."

**Murat (Test Architect):** "We need Playwright tests for critical paths. Unit tests passed but the integrated system had bugs. E2E testing is non-negotiable going forward."

**John (Product Manager):** "Epic 5 was a success despite these bugs. We shipped a working AI chat system with trust transparency. Epic 6 is about achieving excellence before building on top of it."

**Bob (Scrum Master):** "Definition of Done wasn't enforced rigorously. We marked stories done without live verification. That changes now."

**Mary (Analyst):** "The 406 error pattern - INSERT works but SELECT doesn't - is a classic RLS gap. We need a policy testing matrix for every table."

**Paige (Tech Writer):** "Documentation gaps around confidence thresholds, RLS policies, and error codes need to be filled. These aren't obvious from reading code."

---

## Conclusion

Epic 5 delivered the core value proposition of docuMINE: AI-powered document Q&A with trust transparency. The architecture is sound, the AI personality is excellent, and the user experience foundations are strong.

The bugs found are polish issues that undermine trust but don't break core functionality. Epic 6 will fix these issues and establish better testing practices before we proceed to Quote Comparison in Epic 7.

**Epic 5 Grade: B+**
- Functionality: A
- Architecture: A
- Testing: C+
- Polish: B-
- Documentation: B

---

## Retrospective Metadata

- **Generated:** 2025-12-02
- **Method:** BMAD Party Mode Multi-Agent Discussion
- **Analysis Tool:** Playwright MCP for live app testing
- **Duration:** ~2 hours comprehensive analysis
- **Next Action:** Create Epic 6 Cleanup specification
