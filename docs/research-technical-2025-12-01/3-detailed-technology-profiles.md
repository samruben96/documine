# 3. Detailed Technology Profiles

## 3.1 GPT-5 Series (Released August 2025)

**Source:** [OpenAI GPT-5 Announcement](https://openai.com/index/introducing-gpt-5/) [Verified 2025]

**Overview:**
GPT-5 represents a significant leap in intelligence, featuring state-of-the-art performance across coding, math, writing, health, visual perception, and more. It is a unified system that knows when to respond quickly and when to think longer to provide expert-level responses.

**Key Capabilities:**
- **Unified Reasoning:** Combines reasoning and non-reasoning under a common interface
- **Adaptive Thinking:** Dynamically adjusts thinking time based on task complexity
- **Variants:** gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-chat
- **Context Window:** Up to 196K tokens in thinking mode

**Availability:**
- Free tier: Limited access
- Plus ($20/month): Higher limits
- Pro ($200/month): Unlimited GPT-5, limited GPT-5 Pro

**Relevance to docuMINE:** [High Confidence]
GPT-5-mini offers a compelling upgrade path with 50% lower input costs than GPT-4o while providing improved reasoning capabilities beneficial for insurance document analysis.

## 3.2 GPT-5.1 (Released November 2025)

**Source:** [OpenAI GPT-5.1 for Developers](https://openai.com/index/gpt-5-1-for-developers/) [Verified 2025]

**Key Features:**
- **Adaptive Reasoning:** Dynamically adapts thinking time based on complexity
- **No Reasoning Mode:** `reasoning_effort: none` for faster responses on simple tasks
- **Extended Prompt Caching:** 24-hour cache retention with 90% cheaper cached tokens
- **New Tools:** `apply_patch` for code editing, `shell` for command execution

**Pricing:**
- Aligned with GPT-5 pricing
- Cached input tokens: 90% cheaper than uncached

**Relevance to docuMINE:** [High Confidence]
The adaptive reasoning and extended caching are excellent for document Q&A where some questions are simple lookups and others require analysis.

## 3.3 o1 Series (Reasoning Models)

**Source:** [OpenAI Learning to Reason](https://openai.com/index/learning-to-reason-with-llms/) [Verified 2025]

**Overview:**
The o1 series uses chain-of-thought reasoning, spending more time "thinking" before generating answers. Significantly outperforms GPT-4o on reasoning-heavy tasks.

**Benchmark Performance:**
- IMO qualifying exam: 83% (GPT-4o: 13%)
- MMLU: Outperforms GPT-4o on 54/57 subcategories
- GPQA-diamond: First model to surpass human PhD experts
- Codeforces: Elo 1807 (93rd percentile) vs GPT-4o's 808 (11th percentile)

**Trade-offs:**
- Slower response times
- 6-10x more expensive than GPT-4o
- No multimodal capabilities (o1 original)
- Best for complex reasoning, not simple Q&A

**Relevance to docuMINE:** [Medium Confidence]
o1-mini could be valuable for complex insurance policy analysis questions, but the cost and latency may be prohibitive for general Q&A. Consider as a "premium" mode for complex queries.

## 3.4 text-embedding-3-large

**Source:** [OpenAI New Embedding Models](https://openai.com/index/new-embedding-models-and-api-updates/) [Verified 2025]

**Key Features:**
- **Dimensions:** 3072 default, configurable down to 256
- **Matryoshka Representation Learning:** Shortened embeddings maintain quality
- **MIRACL Performance:** 54.9% (vs 31.4% for ada-002)
- **MTEB Performance:** 64.6% (vs 61% for ada-002)

**Pricing:** $0.13/1M tokens (6.5x more than small)

**Upgrade Path Options:**
1. **Full upgrade:** Use 3072 dimensions (requires re-embedding + index rebuild)
2. **Drop-in upgrade:** Use 1536 dimensions (maintains pgvector compatibility)
3. **Hybrid:** New docs at 3072, legacy at 1536 (complex)

**Relevance to docuMINE:** [High Confidence]
The 3072-dimension model provides meaningfully better retrieval accuracy. The Matryoshka feature allows starting with 1536 dimensions (compatible with current setup) and upgrading later.

## 3.5 RecursiveCharacterTextSplitter

**Source:** [LangChain Documentation](https://python.langchain.com/v0.1/docs/modules/data_connection/document_transformers/recursive_text_splitter/) [Verified 2025]

**Overview:**
Tries to split text using separators in order: `["\n\n", "\n", " ", ""]`. Keeps paragraphs, then sentences, then words together as long as possible.

**Best Practices:**
- Chunk size: 400-512 tokens delivers 85-90% recall
- Overlap: 10-20% (50-100 tokens for 500-token chunks)
- Use `from_language()` for Markdown-aware splitting

**Implementation:**
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""]
)
```

**Relevance to docuMINE:** [High Confidence]
Recommended as the baseline improvement over fixed-size chunking. Low complexity, good results.

## 3.6 Table-Aware Chunking

**Source:** [LangChain RAG on Tables](https://blog.langchain.com/benchmarking-rag-on-tables/) [Verified 2025]

**Key Insight:**
When table structure is destroyed by improper chunking, LLMs cannot perceive meaningful information. Insurance documents contain critical tables (coverage limits, deductibles, exclusions).

**Strategies:**
1. **Page-boundary splitting:** Many tables respect page boundaries
2. **LLM summarization:** Summarize tables, store both summary and raw text
3. **Structure preservation:** Tools like Unstructured.io, PDFPlumber preserve layout
4. **Vision-guided chunking:** Use multimodal models to detect table boundaries

**Docling Integration:**
Since docuMINE uses Docling (which has 97.9% table extraction with IBM TableFormer), we can:
1. Parse tables as structured data
2. Store table content as complete chunks with metadata
3. Generate table summaries for retrieval
4. Keep tables intact regardless of size

**Relevance to docuMINE:** [High Confidence]
Critical for insurance documents. Docling already provides excellent table extraction—we need to preserve this in chunking.

## 3.7 Hybrid Search (BM25 + Vector)

**Source:** [Weaviate Hybrid Search](https://weaviate.io/blog/hybrid-search-explained) [Verified 2025]

**Overview:**
Combines keyword search (BM25) and semantic search (vectors). BM25 excels at exact matches (policy numbers, names, dates), while vectors handle semantic similarity.

**Fusion Methods:**
- **Reciprocal Rank Fusion (RRF):** Merges results by rank
- **Relative Score Fusion:** Normalizes and merges scores
- **Alpha parameter:** Controls balance (0.7 = 70% vector, 30% keyword)

**Implementation with pgvector:**
PostgreSQL supports full-text search natively. Combine with pgvector:
```sql
-- Hybrid search combining FTS and vector similarity
WITH keyword_results AS (
  SELECT id, ts_rank(to_tsvector('english', content), query) as keyword_score
  FROM document_chunks, plainto_tsquery('english', $1) query
  WHERE to_tsvector('english', content) @@ query
),
vector_results AS (
  SELECT id, 1 - (embedding <=> $2) as vector_score
  FROM document_chunks
  ORDER BY embedding <=> $2
  LIMIT 20
)
SELECT COALESCE(k.id, v.id) as id,
       COALESCE(k.keyword_score, 0) * 0.3 + COALESCE(v.vector_score, 0) * 0.7 as combined_score
FROM keyword_results k
FULL OUTER JOIN vector_results v ON k.id = v.id
ORDER BY combined_score DESC
LIMIT 10;
```

**Relevance to docuMINE:** [High Confidence]
Insurance queries often include exact terms (policy numbers, coverage names). Hybrid search will significantly improve these queries.

## 3.8 Reranking with Cross-Encoders

**Source:** [Pinecone Rerankers](https://www.pinecone.io/learn/series/rag/rerankers/) [Verified 2025]

**Overview:**
Cross-encoders process query and document together, enabling understanding of complex interactions like negation, temporal relationships, and entity-specific context.

**Key Benefits:**
- Much more accurate than bi-encoders (embedding models)
- Understands query-document relationships bi-encoders miss
- Research shows up to 48% improvement in retrieval quality

**Top Rerankers (2025):**
1. **Cohere Rerank 3.5:** Enterprise-ready, <100ms latency, 25% better than embedding-only
2. **Qwen3-Reranker-8B:** Most accurate, open-source
3. **Jina Reranker:** Strong multilingual capabilities

**Two-Stage Architecture:**
1. First stage: Fast vector search retrieves top 20-50 candidates
2. Second stage: Reranker scores and reorders to top 5-10

**Implementation with Cohere:**
```typescript
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

async function rerankResults(query: string, documents: string[]) {
  const response = await cohere.rerank({
    model: 'rerank-v3.5',
    query: query,
    documents: documents,
    topN: 5,
  });
  return response.results;
}
```

**Pricing:** Cohere Rerank: $1/1000 searches

**Relevance to docuMINE:** [High Confidence]
Reranking is the highest-impact improvement available. Cohere's API makes integration straightforward.

---
