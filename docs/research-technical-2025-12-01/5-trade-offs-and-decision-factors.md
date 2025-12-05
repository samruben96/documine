# 5. Trade-offs and Decision Factors

## 5.1 Key Trade-offs

**Model Upgrade (GPT-4o → GPT-5.1):**
- **Gain:** Better reasoning, adaptive thinking, extended caching
- **Sacrifice:** Slightly higher complexity, new API features
- **When to choose:** When response quality is paramount

**Embedding Upgrade (3-small → 3-large):**
- **Gain:** +5% retrieval accuracy, better multilingual
- **Sacrifice:** 6.5x embedding cost, requires re-embedding
- **When to choose:** When retrieval accuracy is the bottleneck

**Chunking Upgrade (Fixed → Recursive + Table-Aware):**
- **Gain:** Better semantic coherence, preserved tables
- **Sacrifice:** Re-processing all documents
- **When to choose:** Always (high impact, low risk)

**Hybrid + Reranking:**
- **Gain:** +30-48% retrieval relevance
- **Sacrifice:** +$1/1000 queries, +250ms latency
- **When to choose:** When retrieval quality matters (always for RAG)

## 5.2 Priority Matrix for docuMINE

| Optimization | Impact | Effort | Risk | Priority |
|--------------|--------|--------|------|----------|
| Hybrid Search | High | Medium | Low | **P1** |
| Cohere Reranking | Very High | Low | Low | **P1** |
| RecursiveCharacterTextSplitter | Medium | Low | Low | **P1** |
| Table-Aware Chunking | High | Medium | Low | **P1** |
| text-embedding-3-large | Medium | High | Medium | **P2** |
| GPT-5-mini upgrade | Medium | Low | Low | **P2** |
| Semantic Chunking | Low | High | Medium | **P3** |
| o1 for complex queries | Medium | Low | Medium | **P3** |

---
