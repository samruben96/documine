# Story 5.8: Retrieval Quality Optimization (Phase 1)

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.8
**Status:** Drafted
**Created:** 2025-12-01
**Prerequisites:** Story 5.6 (Conversation History & Follow-up Questions)

---

## User Story

As a **user asking questions about insurance documents**,
I want **more accurate and relevant answers with higher confidence**,
So that **I can trust the AI responses and spend less time verifying**.

---

## Background & Context

### Problem Statement

The current RAG pipeline exhibits several pain points:
- Chat responses often return "Not Found" confidence even for questions with clear answers
- Similarity scores frequently fall below the 0.60 threshold
- Users report needing to verify answers more often than expected
- Estimated current metrics: ~30% High Confidence, ~40% Not Found

### Research Findings

Based on technical research (2025-12-01), the following optimizations offer the highest ROI:

1. **Cohere Reranking**: Cross-encoder reranking can improve retrieval quality by 25-48%
2. **Hybrid Search**: Combining BM25 (keyword) with vector search improves exact-match queries by 10-20%
3. **Threshold Tuning**: Current thresholds may be too aggressive for reranked results

**Research Document:** `docs/research-technical-2025-12-01.md`

---

## Acceptance Criteria

### AC-5.8.1: Test Query Set Creation
**Given** we need to measure improvement objectively
**When** the test infrastructure is created
**Then** a test query set of 50 queries exists with:
- 15 simple lookup queries (policy numbers, dates, names)
- 10 table data queries (deductibles, coverage limits)
- 15 semantic questions (coverage questions, exclusions)
- 10 complex/multi-hop queries (comparisons, conditions)

### AC-5.8.2: Baseline Metrics Recording
**Given** the test query set exists
**When** baseline measurement is performed
**Then** the following metrics are recorded:
- Recall@5 for each query category
- Average similarity score per category
- Confidence level distribution (High/Needs Review/Not Found)
- Stored in `__tests__/fixtures/baseline-metrics.json`

### AC-5.8.3: Cohere Reranking Integration
**Given** vector search returns top 20 candidates
**When** reranking is applied
**Then**:
- Cohere Rerank 3.5 API reorders results by relevance
- Top 5 reranked results used for RAG context
- Reranker scores inform confidence calculation
- Latency increase < 300ms

### AC-5.8.4: Reranking Fallback
**Given** Cohere API is unavailable (timeout/error)
**When** a chat query is processed
**Then**:
- System falls back to vector-only search (top 5)
- Warning logged for monitoring
- User experience unaffected (no error shown)

### AC-5.8.5: Hybrid Search Implementation
**Given** a user query is received
**When** retrieval is performed
**Then**:
- PostgreSQL full-text search runs alongside vector search
- Results fused with alpha=0.7 (70% vector, 30% keyword)
- Exact matches (policy numbers, names) score higher

### AC-5.8.6: FTS Database Migration
**Given** the migration is applied
**When** querying the database
**Then**:
- `search_vector` tsvector column exists on document_chunks
- GIN index `idx_document_chunks_search` exists
- Auto-update trigger populates tsvector on insert/update

### AC-5.8.7: Confidence Threshold Adjustment
**Given** reranking produces different score distributions
**When** confidence is calculated
**Then** new thresholds apply:
- ≥0.75 similarity → High Confidence (green badge)
- 0.50-0.74 → Needs Review (amber badge)
- <0.50 → Not Found (gray badge)

### AC-5.8.8: High Confidence Target
**Given** the optimizations are deployed
**When** running the test query set
**Then** High Confidence responses ≥50% (up from ~30% baseline)

### AC-5.8.9: Not Found Reduction
**Given** the optimizations are deployed
**When** running the test query set
**Then** "Not Found" responses ≤25% (down from ~40% baseline)

### AC-5.8.10: Latency Requirement
**Given** reranking adds processing time
**When** measuring response latency
**Then** P95 response time remains <3 seconds (first token)

---

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/lib/chat/reranker.ts` | Cohere Rerank 3.5 integration |
| `src/lib/chat/metrics.ts` | Baseline/comparison metrics collection |
| `__tests__/fixtures/test-queries.json` | 50 stratified test queries |
| `__tests__/fixtures/baseline-metrics.json` | Baseline measurement results |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/chat/vector-search.ts` | Add hybrid search, increase to top 20 |
| `src/lib/chat/rag.ts` | Integrate reranker, update confidence calc |
| `src/lib/chat/confidence.ts` | Adjust thresholds |
| `.env.example` | Add COHERE_API_KEY |

### Database Migration

```sql
-- Migration: add_fulltext_search_support
ALTER TABLE document_chunks ADD COLUMN search_vector tsvector;

UPDATE document_chunks SET search_vector = to_tsvector('english', content);

CREATE INDEX idx_document_chunks_search ON document_chunks USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_chunks_search_vector_trigger
  BEFORE INSERT OR UPDATE ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

### New Dependencies

```bash
npm install cohere-ai
```

### Environment Variables

```bash
COHERE_API_KEY=xxx  # Required for reranking
```

---

## Implementation Tasks

### Task 1: Create Test Infrastructure
- [ ] Create test query set (50 queries, 4 categories)
- [ ] Create baseline metrics recording script
- [ ] Run baseline measurement on current implementation
- [ ] Store results in fixtures

### Task 2: Database Migration
- [ ] Create migration for tsvector column
- [ ] Create migration for GIN index
- [ ] Create migration for update trigger
- [ ] Apply to Supabase project
- [ ] Backfill existing chunks

### Task 3: Hybrid Search Implementation
- [ ] Update `vector-search.ts` with FTS query
- [ ] Implement score fusion (alpha=0.7)
- [ ] Increase candidate pool to 20
- [ ] Add unit tests for fusion algorithm

### Task 4: Cohere Reranker Integration
- [ ] Create `reranker.ts` module
- [ ] Implement Cohere API client
- [ ] Add fallback logic for API failures
- [ ] Add timeout handling (5s)
- [ ] Integrate into RAG pipeline

### Task 5: Confidence Threshold Update
- [ ] Update thresholds in `confidence.ts`
- [ ] Update unit tests
- [ ] Verify badge display unchanged

### Task 6: Testing & Validation
- [ ] Run test query set post-optimization
- [ ] Compare metrics to baseline
- [ ] Verify latency requirements
- [ ] Manual testing with real documents

---

## Test Strategy

### Unit Tests

```typescript
// reranker.test.ts
describe('Cohere Reranker', () => {
  it('reranks results by relevance score', async () => {
    const docs = ['doc1', 'doc2', 'doc3'];
    const query = 'test query';
    const result = await rerank(query, docs);
    expect(result).toHaveLength(3);
    expect(result[0].relevance_score).toBeGreaterThan(result[1].relevance_score);
  });

  it('falls back to original order on API failure', async () => {
    // Mock Cohere API failure
    const result = await rerank('query', ['doc1', 'doc2']);
    expect(result).toEqual(['doc1', 'doc2']); // Original order preserved
  });
});

// hybrid-search.test.ts
describe('Hybrid Search', () => {
  it('fuses FTS and vector scores with alpha=0.7', () => {
    const fused = fuseScores(0.8, 0.6, 0.7);
    expect(fused).toBeCloseTo(0.8 * 0.7 + 0.6 * 0.3);
  });

  it('handles missing FTS results', () => {
    const fused = fuseScores(0.9, null, 0.7);
    expect(fused).toBeCloseTo(0.9 * 0.7);
  });
});
```

### Integration Tests

- Test hybrid search against local Supabase
- Test reranker with mocked Cohere responses
- Verify end-to-end chat flow with optimizations

### E2E Test Checklist

- [ ] Run all 50 test queries
- [ ] Record new metrics
- [ ] Verify High Confidence ≥50%
- [ ] Verify Not Found ≤25%
- [ ] Verify P95 latency <3s
- [ ] Test with real insurance document

---

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| High Confidence % | ~30% | ≥50% | Automated on test set |
| Not Found % | ~40% | ≤25% | Automated on test set |
| Avg Similarity | ~0.55 | ≥0.70 | Automated on test set |
| P95 Latency | ~2s | <3s | Performance test |

---

## Rollback Plan

If optimizations cause issues:

1. **Disable Reranking**: Set `COHERE_RERANK_ENABLED=false` env var
2. **Revert Thresholds**: Change back to 0.85/0.60 thresholds
3. **Hybrid Search**: Can be disabled independently via feature flag
4. **Full Rollback**: Revert code changes, migration is additive (safe)

---

## Dependencies

- **Cohere Account**: Required for Rerank API access
- **Story 5.6 Complete**: Conversation history working
- **Existing Documents**: Need documents with chunks for testing

---

## Key Learnings from Story 5.11

**Critical Observation:** During Story 5.11 bug fixes, we discovered a UX mismatch:

**Example Query:** "Whats in the dwelling info"
**AI Response:** Excellent, accurate response citing page 1 with Coverage A ($373,000), Ordinance or Law (10%), etc.
**Badge Displayed:** "Not Found" (gray) - because similarity score was < 0.60

**Key Insights:**

1. **Don't Force LLM Responses**: Previously, the code forced GPT to respond with "I couldn't find information..." when confidence was low. This override was removed because:
   - GPT-4o is smart enough to give helpful responses even with low similarity scores
   - The system prompt already instructs how to handle missing context
   - Forcing responses blocked legitimate helpful answers

2. **Badge Doesn't Reflect Response Quality**: The confidence badge is based on vector similarity score, NOT on whether GPT actually found useful information. A query can:
   - Score low on similarity (< 0.60) → "Not Found" badge
   - But still get excellent GPT response from the retrieved context

3. **Current Thresholds May Be Too Strict**: The 0.60 threshold for "Not Found" may be too aggressive. Consider:
   - Lowering thresholds (as proposed in AC-5.8.7: 0.75/0.50)
   - Alternative: Use reranker scores instead of embedding similarity
   - Alternative: Post-response quality check

**Recommendation for This Story:**
- When implementing new thresholds (AC-5.8.7), test with queries like "dwelling info" that currently show false "not found"
- Consider whether badge should reflect embedding score OR reranker confidence
- Add test cases for queries that currently show wrong badge despite good responses

---

## Notes

- Cohere Rerank pricing: ~$1/1000 searches
- Migration backfill will take time for existing chunks
- Consider caching rerank results for identical queries (future optimization)

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Baseline metrics recorded
- [ ] Post-optimization metrics show improvement
- [ ] P95 latency <3 seconds verified
- [ ] Code reviewed and approved
- [ ] Migration applied to production
- [ ] Environment variables documented
- [ ] Merged to main branch
