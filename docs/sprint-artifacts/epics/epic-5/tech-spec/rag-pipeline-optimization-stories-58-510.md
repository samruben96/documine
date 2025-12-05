# RAG Pipeline Optimization Stories (5.8-5.10)

## Overview

Stories 5.8-5.10 were added based on technical research (2025-12-01) to address observed pain points in the RAG pipeline:
- Low confidence scores (frequently below 0.60 threshold)
- "Not Found" responses for answerable questions
- Chunking breaking semantic units inappropriately

**Research Document:** `docs/research-technical-2025-12-01.md`

## Story 5.8: Retrieval Quality Optimization (Phase 1)

**Objective:** Improve retrieval accuracy without re-embedding existing documents.

**Key Components:**

| Component | Responsibility | Location |
|-----------|---------------|----------|
| Reranker Service | Cohere Rerank 3.5 integration | `src/lib/chat/reranker.ts` |
| Hybrid Search | BM25 + Vector fusion | `src/lib/chat/vector-search.ts` |
| Metrics Service | Baseline/comparison metrics | `src/lib/chat/metrics.ts` |
| Test Query Set | 50 stratified queries | `__tests__/fixtures/test-queries.json` |

**New Dependencies:**

```bash
npm install cohere-ai
```

**Environment Variables:**

```bash
COHERE_API_KEY=xxx  # Required for reranking
```

**Database Migration:**

```sql
-- Migration: add_fulltext_search_support
-- Add tsvector column for full-text search
ALTER TABLE document_chunks ADD COLUMN search_vector tsvector;

-- Populate tsvector column
UPDATE document_chunks SET search_vector = to_tsvector('english', content);

-- Create GIN index for FTS performance
CREATE INDEX idx_document_chunks_search ON document_chunks USING GIN(search_vector);

-- Create trigger to auto-update tsvector on insert/update
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

**Hybrid Search Query:**

```sql
-- Hybrid search combining FTS and vector similarity
WITH keyword_results AS (
  SELECT id, ts_rank(search_vector, plainto_tsquery('english', $1)) as keyword_score
  FROM document_chunks
  WHERE document_id = $2 AND search_vector @@ plainto_tsquery('english', $1)
),
vector_results AS (
  SELECT id, 1 - (embedding <=> $3) as vector_score
  FROM document_chunks
  WHERE document_id = $2
  ORDER BY embedding <=> $3
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

**Acceptance Criteria:**

| AC | Description | Test Approach |
|----|-------------|---------------|
| AC-5.8.1 | Test query set created with 50 queries covering lookups, tables, semantic, complex | Manual verification of query diversity |
| AC-5.8.2 | Baseline metrics recorded: Recall@5, avg similarity, confidence distribution | Unit test for metrics calculation |
| AC-5.8.3 | Cohere Rerank integrated with top 20 → top 5 reranking | Integration test with Cohere API |
| AC-5.8.4 | Fallback to vector-only when Cohere unavailable | Mock Cohere failure, verify fallback |
| AC-5.8.5 | Hybrid search combines FTS and vector with alpha=0.7 | Unit test for fusion algorithm |
| AC-5.8.6 | PostgreSQL FTS index added via migration | Verify index exists after migration |
| AC-5.8.7 | Confidence thresholds updated: ≥0.75/0.50-0.74/<0.50 | Unit test for threshold logic |
| AC-5.8.8 | High Confidence responses ≥50% on test set | E2E test with baseline comparison |
| AC-5.8.9 | "Not Found" responses ≤25% on test set | E2E test with baseline comparison |
| AC-5.8.10 | Response latency <3 seconds | Performance test |

## Story 5.9: Chunking Optimization (Phase 2)

**Objective:** Improve chunking to preserve semantic units and tables.

**Key Components:**

| Component | Responsibility | Location |
|-----------|---------------|----------|
| Recursive Chunker | LangChain-style recursive splitting | `src/lib/documents/chunking.ts` |
| Table Detector | Identify tables in Docling output | `src/lib/documents/table-detection.ts` |
| Re-processing Pipeline | Batch document re-embedding | `src/lib/documents/reprocess.ts` |

**Chunking Algorithm:**

```typescript
interface ChunkConfig {
  chunkSize: number;      // 500 tokens
  chunkOverlap: number;   // 50 tokens
  separators: string[];   // ["\n\n", "\n", ". ", " "]
}

function recursiveCharacterTextSplitter(
  text: string,
  config: ChunkConfig
): string[] {
  // 1. Try to split by first separator
  // 2. If chunks too large, recursively split with next separator
  // 3. Maintain overlap between chunks
  // 4. Preserve metadata (page numbers)
}

function preserveTables(
  doclingOutput: DoclingDocument
): Chunk[] {
  // 1. Identify table elements in Docling output
  // 2. Extract table content as single chunk
  // 3. Generate table summary for retrieval
  // 4. Store both summary and raw content
}
```

**Table Chunk Schema:**

```typescript
interface TableChunk {
  id: string;
  documentId: string;
  agencyId: string;
  content: string;           // Raw table content
  summary: string;           // GPT-generated summary for retrieval
  pageNumber: number;
  chunkIndex: number;
  chunkType: 'table';        // New metadata field
  embedding: number[];       // Embed the summary, not raw content
  createdAt: Date;
}
```

**Database Migration:**

```sql
-- Migration: add_chunk_metadata
ALTER TABLE document_chunks ADD COLUMN chunk_type varchar(20) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN summary text;

-- Index for filtering by chunk type
CREATE INDEX idx_document_chunks_type ON document_chunks(document_id, chunk_type);
```

**Acceptance Criteria:**

| AC | Description | Test Approach |
|----|-------------|---------------|
| AC-5.9.1 | RecursiveCharacterTextSplitter implemented with 500/50 config | Unit test for chunking |
| AC-5.9.2 | Separators used in order: \n\n, \n, ". ", " " | Unit test for separator hierarchy |
| AC-5.9.3 | Tables detected in Docling output | Unit test with sample Docling JSON |
| AC-5.9.4 | Tables emitted as single chunks regardless of size | Unit test for table handling |
| AC-5.9.5 | Table chunks include chunk_type='table' metadata | Database query verification |
| AC-5.9.6 | Table summaries generated for retrieval | Integration test with OpenAI |
| AC-5.9.7 | Batch re-processing pipeline implemented | Manual test with sample docs |
| AC-5.9.8 | A/B testing capability for old vs new chunks | Feature flag verification |
| AC-5.9.9 | +15% improvement in table-related queries | E2E test with table queries |
| AC-5.9.10 | No regression in response latency | Performance test |

## Story 5.10: Model Evaluation (Phase 3)

**Objective:** Evaluate and recommend optimal AI model configuration using OpenRouter for multi-provider access.

**Updated 2025-12-02:** Based on Party Mode research, the decision is to use **OpenRouter** for multi-model access with **Claude Sonnet 4.5** as the primary model for insurance document Q&A.

**Key Components:**

| Component | Responsibility | Location |
|-----------|---------------|----------|
| LLM Config | Multi-provider model selection via OpenRouter | `src/lib/llm/config.ts` |
| LLM Client | OpenRouter/OpenAI client factory | `src/lib/llm/client.ts` |
| Evaluation Runner | Compare models on test set | `scripts/model-evaluation.ts` |
| Metrics Dashboard | Visual comparison | `src/app/(dashboard)/admin/metrics/page.tsx` |

**Why Claude for Insurance Documents (Party Mode Research):**

1. **Superior structured document handling** - Claude Sonnet 4 outperforms GPT-4o in text processing, formatting, and structure-preserving tasks
2. **Better instruction following** - More consistent behavior with "do not alter" instructions, less hallucination
3. **Larger context window** - Claude: 200K tokens vs GPT-4o: 128K tokens (critical for full policy ingestion)
4. **Table comprehension** - Insurance docs are 60%+ tables; Claude excels at preserving table structure

**OpenRouter Benefits:**
- Single API, multiple providers (Anthropic, OpenAI, Google, Mistral)
- Automatic failover if one provider is down
- Easy A/B testing across different model architectures
- No vendor lock-in

**Model Hierarchy:**

| Rank | Model | OpenRouter ID | Use Case |
|------|-------|---------------|----------|
| 🥇 Primary | **Claude Sonnet 4.5** | `anthropic/claude-sonnet-4.5` | Complex queries, tables, citations |
| 🥈 Cost-Opt | **Gemini 2.5 Flash** | `google/gemini-2.5-flash` | High-volume, 1M context |
| 🥉 Fast | **Claude Haiku 4.5** | `anthropic/claude-haiku-4.5` | Simple lookups, low latency |
| 🔄 Fallback | **GPT-4o** | `openai/gpt-4o` | Backup if others unavailable |

**Model Configuration:**

```typescript
// src/lib/llm/config.ts
export type LLMProvider = 'openrouter' | 'openai';

export type ChatModel =
  | 'claude-sonnet-4.5'    // anthropic/claude-sonnet-4.5 (PRIMARY)
  | 'claude-haiku-4.5'     // anthropic/claude-haiku-4.5 (fast)
  | 'gemini-2.5-flash'     // google/gemini-2.5-flash (cost-optimized)
  | 'gpt-4o';              // openai/gpt-4o (fallback)

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

export const OPENROUTER_MODEL_IDS: Record<ChatModel, string> = {
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gpt-4o': 'openai/gpt-4o',
};

export interface ModelConfig {
  provider: LLMProvider;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  embeddingDimensions: 1536 | 3072;
}

export const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5',  // Claude as primary
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
};

// Get OpenAI-compatible client for configured provider
export function getLLMClient() {
  const config = getModelConfig();
  if (config.provider === 'openrouter') {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
        'X-Title': 'docuMINE',
      },
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Feature flag for A/B testing
export function getModelConfigForUser(userId: string): ModelConfig {
  const useNewModel = hashUserId(userId) % 2 === 0;
  if (useNewModel && process.env.AB_TEST_MODEL) {
    return { ...getModelConfig(), chatModel: process.env.AB_TEST_MODEL as ChatModel };
  }
  return getModelConfig();
}
```

**Environment Variables:**

```bash
# LLM Provider Configuration (OpenRouter recommended)
LLM_PROVIDER=openrouter                    # openrouter | openai
LLM_CHAT_MODEL=claude-sonnet-4.5           # claude-sonnet-4.5 | claude-haiku-4.5 | gemini-2.5-flash | gpt-4o

# API Keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx          # Get from openrouter.ai/keys
OPENAI_API_KEY=sk-xxxxx                    # Still needed for embeddings

# Embedding Configuration (still uses OpenAI directly)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMS=1536

# A/B Testing (optional)
AB_TEST_MODEL=claude-haiku-4.5             # Model for test group
AB_TEST_ENABLED=false
```

**Evaluation Metrics:**

```typescript
interface EvaluationResult {
  model: string;
  provider: string;
  testSetSize: number;
  metrics: {
    accuracy: number;           // % of correct answers
    avgLatency: number;         // Time to first token (ms)
    avgCost: number;            // Cost per query ($)
    highConfidenceRate: number; // % with high confidence
    notFoundRate: number;       // % with not found
  };
  breakdown: {
    lookupQueries: MetricSet;
    tableQueries: MetricSet;
    semanticQueries: MetricSet;
    complexQueries: MetricSet;
  };
}
```

**Acceptance Criteria:**

| AC | Description | Test Approach |
|----|-------------|---------------|
| AC-5.10.1 | Config supports Claude Sonnet 4.5, Claude Haiku 4.5, Gemini 2.5 Flash, GPT-4o via OpenRouter | Unit test for config |
| AC-5.10.2 | Embedding config supports 3-small and 3-large | Unit test for config |
| AC-5.10.3 | Feature flag enables per-user model selection | Integration test |
| AC-5.10.4 | Evaluation script runs on 50 query test set | Manual execution |
| AC-5.10.5 | Metrics collected: accuracy, latency, cost | Script output verification |
| AC-5.10.6 | Results documented with recommendations | Document review |
| AC-5.10.7 | Cost analysis completed | Spreadsheet/report |
| AC-5.10.8 | No regression from baseline (or justified trade-off) | Comparison analysis |

**Research Sources:**
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Programming Rankings](https://openrouter.ai/rankings/programming) - Claude Sonnet 4.5 ranked #1
- [Claude vs GPT-4o Comparison](https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o)
- [Best LLMs for Document Processing 2025](https://algodocs.com/best-llm-models-for-document-processing-in-2025/)

## Story 5.11: Streaming & AI Personality Bug Fixes

**Added 2025-12-01:** Bug fix story addressing issues discovered during Epic 5 implementation.

**Issues Fixed:**

1. **Streaming Memory Leaks** - Added AbortController to useChat hook for proper cleanup on unmount
2. **DEBUG Console Logs** - Removed debug logging from production code
3. **AI Personality** - Set temperature=0.7, max_tokens=1500, enhanced system prompt
4. **Greeting Handling** - Removed forced "not found" override for low-confidence queries

**Files Changed:**
- `src/hooks/use-chat.ts` - AbortController, SSE error logging
- `src/lib/chat/openai-stream.ts` - Temperature/max_tokens, removed DEBUG logs
- `src/lib/chat/rag.ts` - Personality-enhanced system prompt
- `src/lib/chat/intent.ts` - NEW - Query intent classifier
- `src/app/api/chat/route.ts` - Removed forced "not found" override

**Status:** Done (2025-12-01)

## Story 5.12: Document Processing Progress Visualization

**Added 2025-12-02:** Enhancement story for improved UX during document processing.

**Objective:** Provide visual feedback on processing progress beyond "Analyzing..." spinner.

**Prerequisites:** Story 5.8.1 (Large Document Processing)

**Problem Statement:**
With Story 5.8.1 optimizations, documents can take 5-8 minutes to process (large files on paid tier). Users need:
1. Stage visibility: What's happening now? (Downloading, Parsing, Embedding)
2. Progress indication: How much is complete?
3. Time awareness: Estimated time remaining

**Key Components:**

| Component | Responsibility | Location |
|-----------|---------------|----------|
| ProcessingProgress | Progress display component | `src/components/documents/processing-progress.tsx` |
| Progress Reporter | Edge Function progress updates | `supabase/functions/process-document/progress.ts` |
| Realtime Subscription | Live progress updates | Uses existing Supabase Realtime |

**Technical Approach:**

**Option 1: Server-Sent Progress (Recommended)**
- Add `progress_data` JSONB column to `processing_jobs` table
- Edge Function reports progress at each stage
- Frontend subscribes via Supabase Realtime
- UI updates reactively

**Progress Data Structure:**
```typescript
interface ProgressData {
  stage: 'downloading' | 'parsing' | 'chunking' | 'embedding';
  stage_progress: number;      // 0-100
  stage_name: string;          // "Parsing document"
  estimated_seconds_remaining: number;
  total_progress: number;      // 0-100
}
```

**Processing Stages:**
| Stage | Duration | Progress Source |
|-------|----------|-----------------|
| Downloading | 5-10s | Bytes downloaded / total |
| Parsing | 1-5 min | Pages parsed / total (if available) |
| Chunking | 5-15s | Chunks created / estimated |
| Embedding | 30s-2 min | Batches processed / total |

**Database Migration:**
```sql
-- Migration: add_progress_data_column
ALTER TABLE processing_jobs ADD COLUMN progress_data JSONB;
```

**Acceptance Criteria:**

| AC | Description | Test Approach |
|----|-------------|---------------|
| AC-5.12.1 | Processing stages display (Downloading, Parsing, Chunking, Embedding) | Manual test with upload |
| AC-5.12.2 | Progress bar per stage (0-100%) | Visual verification |
| AC-5.12.3 | Estimated time remaining shown | Manual test timing |
| AC-5.12.4 | Real-time updates via Supabase Realtime | Network inspection |
| AC-5.12.5 | UX design approved (requires UX Designer) | Design review |

**Dependencies:**
- Supabase Realtime (already in use)
- `processing_jobs` table (exists)
- UX Designer availability

**Risks:**
- Docling may not report page-level progress → use time-based estimation
- Realtime updates too frequent → throttle to 1-2 per second
- UX design delay → can implement basic version first

**Status:** Drafted (awaiting UX design)

## New Dependencies (Stories 5.8-5.12)

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| cohere-ai | ^7.x | Reranking API | 5.8 |

**No other new dependencies required** - LangChain-style chunking will be implemented from scratch to avoid heavy dependency.

## Architecture Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                     UPDATED RAG PIPELINE                         │
│                                                                   │
│  Query → [Embedding] → [Hybrid Search] → [Reranker] → [LLM]     │
│              │              │                │           │        │
│              ▼              ▼                ▼           ▼        │
│         OpenAI         FTS + Vector      Cohere      GPT-4o+    │
│         3-small           Fusion         Rerank                  │
│                            ↓                                      │
│                    Top 20 Candidates                             │
│                            ↓                                      │
│                    Reranked Top 5                                │
│                            ↓                                      │
│                    RAG Context → LLM                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  UPDATED CHUNKING PIPELINE                       │
│                                                                   │
│  Docling → [Table Detection] → [Recursive Split] → [Embed]      │
│     │            │                    │               │          │
│     ▼            ▼                    ▼               ▼          │
│   JSON      Tables as          Text Chunks       OpenAI         │
│   Output    Single Chunks     (500 tokens)      Embeddings      │
│                  ↓                    ↓               ↓          │
│            Summary Gen          Overlap 50        Vector        │
│                  ↓                    ↓           Storage        │
│            Embed Summary        Embed Content                    │
└─────────────────────────────────────────────────────────────────┘
```

## Test Strategy for 5.8-5.10

**Test Query Set Categories:**

| Category | Count | Example Queries |
|----------|-------|-----------------|
| Simple Lookups | 15 | "What is the policy number?", "What is the effective date?" |
| Table Data | 10 | "What are the deductibles?", "What are the coverage limits?" |
| Semantic Questions | 15 | "Is flood damage covered?", "What exclusions apply to property damage?" |
| Complex/Multi-hop | 10 | "Compare the liability and property coverage limits", "What conditions must be met for a claim?" |

**Baseline Measurement Process:**

1. Run all 50 queries against current implementation
2. Record: similarity scores, confidence levels, response accuracy (manual)
3. Store baseline in `__tests__/fixtures/baseline-metrics.json`
4. Compare after each optimization phase

**Success Criteria:**

| Metric | Baseline (Est.) | Target | Measurement |
|--------|-----------------|--------|-------------|
| High Confidence % | ~30% | >50% | Automated |
| Not Found % | ~40% | <25% | Automated |
| Avg Similarity | ~0.55 | >0.70 | Automated |
| P50 Latency | ~2s | <3s | Automated |
| Table Query Accuracy | ~60% | >80% | Manual review |
