# 8. Architecture Decision Record (ADR)

## ADR-001: RAG Pipeline Optimization

**Status:** Proposed

**Context:**
docuMINE's current RAG pipeline uses GPT-4o, text-embedding-3-small (1536 dims), fixed-size chunking (1000 chars), and vector-only search with top-5 retrieval. Users report low confidence scores and "Not Found" responses for answerable questions.

**Decision Drivers:**
- Improve High Confidence responses by 15%+
- Handle insurance documents with tables effectively
- Maintain backward compatibility
- Keep costs reasonable
- Minimize implementation risk

**Considered Options:**
1. Model upgrades only (GPT-5, o1)
2. Embedding upgrades only (3-large)
3. Chunking improvements only
4. Retrieval optimization only (hybrid + reranking)
5. Comprehensive phased approach (recommended)

**Decision:**
Implement comprehensive phased optimization starting with retrieval (lowest risk, highest impact), then chunking, then model upgrades.

**Consequences:**

**Positive:**
- Expected 20-30% improvement in retrieval quality
- Better handling of insurance tables and exact terms
- Phased approach reduces risk
- Each phase delivers measurable value

**Negative:**
- Requires re-processing documents (Phase 2)
- Additional API cost for reranking (~$1/1000 queries)
- Increased system complexity

**Neutral:**
- Model upgrades are straightforward and reversible
- Embedding upgrade may require index rebuild

**Implementation Notes:**
- Start with Cohere Reranking (immediate impact)
- Implement hybrid search in parallel with vector search
- Test chunking changes on subset before full re-processing
- Use feature flags for A/B testing

---
