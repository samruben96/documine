# RAG Pipeline Architecture (Implemented)

## Original Pipeline (Stories 5.1-5.6)

```
Query → [Embedding] → [Vector Search (Top 5)] → [RAG Context] → [GPT-4o]
```

## Current Production Pipeline (Stories 5.8-5.10 - Implemented 2025-12-02)

```
Query → [Embedding] → [Hybrid Search] → [Reranker] → [RAG Context] → [Claude]
              │              │               │              │           │
              ▼              ▼               ▼              ▼           ▼
         OpenAI         FTS + Vector    Cohere         Top 5       Claude
         3-small          Fusion        Rerank 3.5   Reranked    Sonnet 4.5
                            ↓
                    Top 20 Candidates
                            ↓
                    Reranked Top 5
```

**Key Improvements Shipped:**
- Hybrid search (BM25 + vector) with alpha=0.7
- Cohere Rerank 3.5 for cross-encoder reranking
- Table-aware chunking with preserved table structure
- Claude Sonnet 4.5 via OpenRouter for superior document understanding

## Hybrid Search Algorithm

```sql
-- Combines keyword (BM25) and vector similarity
-- Alpha = 0.7 (70% vector, 30% keyword)
WITH keyword_results AS (
  SELECT id, ts_rank(search_vector, plainto_tsquery('english', $query)) as keyword_score
  FROM document_chunks
  WHERE document_id = $doc_id AND search_vector @@ plainto_tsquery('english', $query)
),
vector_results AS (
  SELECT id, 1 - (embedding <=> $query_vector) as vector_score
  FROM document_chunks
  WHERE document_id = $doc_id
  ORDER BY embedding <=> $query_vector
  LIMIT 20
)
SELECT
  COALESCE(k.id, v.id) as id,
  COALESCE(k.keyword_score, 0) * 0.3 + COALESCE(v.vector_score, 0) * 0.7 as combined_score
FROM keyword_results k
FULL OUTER JOIN vector_results v ON k.id = v.id
ORDER BY combined_score DESC
LIMIT 20;
```

## Confidence Thresholds (Updated)

| Level | Original Threshold | Updated Threshold (with Reranking) |
|-------|-------------------|-----------------------------------|
| High Confidence | ≥0.85 | ≥0.75 |
| Needs Review | 0.60-0.84 | 0.50-0.74 |
| Not Found | <0.60 | <0.50 |

**Rationale:** Reranker scores have different distribution than raw vector similarity. Thresholds tuned based on research findings.

## Chunking Strategy (Implemented 2025-12-02)

| Aspect | Original | Production (Story 5.9) |
|--------|----------|----------------------|
| Method | Fixed 1000 characters | Recursive text splitter |
| Size | 1000 chars | 500 tokens |
| Overlap | None | 50 tokens |
| Separators | Single split | ["\n\n", "\n", ". ", " "] |
| Tables | Split with text | Preserved as single chunks |
| Metadata | page_number only | + chunk_type, summary |

**Implementation Details:**
- `src/lib/documents/chunking.ts` - Recursive splitter with table detection
- Tables detected via Docling markdown format and preserved intact
- Chunk metadata stored in `document_chunks.metadata` JSONB column

## Model Configuration (Story 5.10 - Implemented 2025-12-02)

```typescript
// src/lib/llm/config.ts - Configurable model selection
type LLMProvider = 'openrouter' | 'openai';
type ChatModel = 'claude-sonnet-4.5' | 'claude-haiku-4.5' | 'gemini-2.5-flash' | 'gpt-4o';
type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

interface ModelConfig {
  provider: LLMProvider;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  embeddingDimensions: 1536 | 3072;
}

// Default: Claude Sonnet 4.5 via OpenRouter
const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
};

// Cost comparison (per 1M tokens, via OpenRouter)
// Claude Sonnet 4.5: $3.00 input, $15.00 output
// Claude Haiku 4.5: $0.80 input, $4.00 output
// Gemini 2.5 Flash: $0.15 input, $0.60 output (cheapest)
// GPT-4o: $2.50 input, $10.00 output
```

---
