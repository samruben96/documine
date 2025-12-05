# 7. Recommendations

## 7.1 Phase 1: Quick Wins (Week 1-2)

**Goal:** Improve retrieval without re-embedding existing documents

1. **Implement Cohere Reranking** [HIGH IMPACT]
   - Add Cohere Rerank 3.5 after vector search
   - Retrieve top 20 → rerank to top 5
   - Expected: +25-40% relevance improvement
   - Cost: ~$1/1000 queries

2. **Add Hybrid Search** [MEDIUM IMPACT]
   - Implement PostgreSQL full-text search alongside pgvector
   - Use alpha=0.7 (70% vector, 30% keyword)
   - Expected: +10-20% for keyword-heavy queries

3. **Adjust Confidence Thresholds** [LOW EFFORT]
   - Current thresholds may be too aggressive
   - Test with: ≥0.75 High, 0.50-0.74 Needs Review, <0.50 Not Found
   - Tune based on reranker scores

## 7.2 Phase 2: Chunking Optimization (Week 2-3)

**Goal:** Re-process documents with improved chunking

4. **Implement RecursiveCharacterTextSplitter** [MEDIUM IMPACT]
   - Replace fixed 1000-char with recursive splitting
   - Settings: chunk_size=500, chunk_overlap=50
   - Separators: `["\n\n", "\n", ". ", " "]`

5. **Add Table-Aware Chunking** [HIGH IMPACT]
   - Detect tables in Docling output (already structured)
   - Keep tables as complete chunks with metadata
   - Store table summaries for retrieval
   - Store raw table content for answer generation

6. **Re-embed All Documents**
   - Process documents through new chunking pipeline
   - Store new embeddings in parallel with old
   - A/B test before cutting over

## 7.3 Phase 3: Model Upgrades (Week 3-4)

**Goal:** Evaluate and implement model improvements

7. **Upgrade to GPT-5-mini or GPT-5.1** [MEDIUM IMPACT]
   - Better reasoning, adaptive thinking
   - Extended prompt caching (24h)
   - Cost-neutral or lower than GPT-4o

8. **Evaluate text-embedding-3-large** [MEDIUM IMPACT]
   - Test with 1536 dimensions (drop-in compatible)
   - Compare retrieval accuracy on test set
   - If significant improvement, migrate

## 7.4 Phase 4: Advanced (Future)

9. **Premium Query Mode with o1-mini**
   - For complex policy analysis questions
   - User-triggered "Deep Analysis" mode
   - Higher latency and cost acceptable

10. **Semantic Chunking Evaluation**
    - Test LangChain SemanticChunker on sample documents
    - Compare recall vs recursive (target: +3% improvement)
    - Only implement if cost/benefit favorable

---
