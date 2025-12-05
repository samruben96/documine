# Story 5.8: Retrieval Quality Optimization (Phase 1)

As a **user asking questions about insurance documents**,
I want **more accurate and relevant answers with higher confidence**,
So that **I can trust the AI responses and spend less time verifying**.

**Acceptance Criteria:**

**Given** the current RAG pipeline has low confidence scores
**When** I ask questions about my document
**Then** retrieval quality is improved through:

**Baseline Metrics Infrastructure:**
- Test query set of 50 queries (stratified by type: lookups, tables, semantic, complex)
- Baseline measurements: Recall@5, average similarity score, confidence distribution
- Metrics logged for comparison

**Cohere Reranking Integration:**
- Vector search retrieves top 20 candidates (up from 5)
- Cohere Rerank 3.5 API reorders results by relevance
- Top 5 reranked results used for RAG context
- Reranker scores inform confidence calculation
- Fallback to vector-only if Cohere unavailable

**Hybrid Search (BM25 + Vector):**
- PostgreSQL full-text search index on document_chunks.content
- Hybrid query combines FTS and vector similarity
- Alpha parameter: 0.7 (70% vector, 30% keyword)
- Improved exact-match queries (policy numbers, coverage names)

**Confidence Threshold Adjustment:**
- Thresholds tuned based on reranker scores
- New thresholds: ≥0.75 High, 0.50-0.74 Needs Review, <0.50 Not Found
- A/B testing capability for threshold comparison

**Success Metrics:**
- High Confidence responses increase from ~30% to >50%
- "Not Found" responses decrease from ~40% to <25%
- Average similarity score improves from ~0.55 to >0.70
- Response latency remains <3 seconds

**Prerequisites:** Story 5.6

**Technical Notes:**
- Cohere SDK: `npm install cohere-ai`
- Environment variable: `COHERE_API_KEY`
- Migration to add tsvector column and GIN index
- Update `src/lib/chat/rag.ts` for hybrid retrieval
- Create `src/lib/chat/reranker.ts` for Cohere integration
- Feature flags for A/B testing different configurations

---
