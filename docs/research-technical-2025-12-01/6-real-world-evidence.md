# 6. Real-World Evidence

## 6.1 RAG Retrieval Improvements

**Databricks Research:** [Verified 2025]
- Reranking improves retrieval quality by up to 48%
- Hybrid retrieval with semantic ranker offers significant benefits

**Chroma's Tests:** [Verified 2025]
- RecursiveCharacterTextSplitter with 400-512 tokens delivered 85-90% recall
- Solid default for most teams without semantic chunking overhead

**Pinecone Studies:** [Verified 2025]
- Consistent NDCG@10 improvements with reranking across diverse domains

## 6.2 Insurance Document RAG

**Key Patterns Observed:**
- Tables are critical for insurance (coverage limits, deductibles, exclusions)
- Exact term matching matters (policy numbers, coverage names, dates)
- Section structure important (Definitions, Coverage A/B/C, Exclusions)
- Legal language benefits from larger context windows

## 6.3 Benchmark Validation

**OpenAI Embedding Benchmarks:**
- text-embedding-3-large: 80.5% RAG accuracy
- text-embedding-3-small: 75.8% RAG accuracy
- Improvement: +4.7% absolute accuracy

**E5 Family (Open Source):**
- E5-large-instruct: 100% Top-5 accuracy, 58% Top-1 accuracy
- Latency: 16ms (excellent for production)

---
