# Architecture Decision Records (ADRs)

## ADR-001: Supabase-Native over T3 Stack

**Status:** Accepted

**Context:** Need database, vector search, file storage, and authentication. T3 Stack (Prisma + NextAuth) is popular but adds complexity when integrating pgvector and storage.

**Decision:** Use Supabase as unified backend platform.

**Consequences:**
- (+) Single platform for DB, vectors, storage, auth
- (+) Native RLS simplifies multi-tenancy
- (+) Generated types without ORM overhead
- (-) Vendor lock-in (mitigated: Postgres is portable)
- (-) Less flexible than raw AWS

---

## ADR-002: Docling for PDF Processing (Updated 2025-11-30)

**Status:** Accepted (Updated from LlamaParse)

**Context:** Insurance PDFs have complex tables, multi-column layouts, and varying quality. Need 95%+ extraction accuracy. Original LlamaParse solution had 75% table accuracy and API cost concerns.

**Decision:** Use self-hosted Docling service (IBM TableFormer model) for all PDF processing.

**Consequences:**
- (+) 97.9% table extraction accuracy (critical for insurance documents)
- (+) Zero API costs (self-hosted)
- (+) Full data privacy (documents never leave our infrastructure)
- (+) Same page marker format for backward compatibility
- (-) Requires self-managed infrastructure (Railway deployment)
- (-) Slightly longer processing time for large documents

**Migration Note:** Completed Story 4.8 (2025-11-30). Docling service deployed at https://docling-for-documine-production.up.railway.app

---

## ADR-003: Streaming AI Responses

**Status:** Accepted

**Context:** AI responses can take 3-10 seconds. Users need perceived speed.

**Decision:** Stream responses via Server-Sent Events, show text as it generates.

**Consequences:**
- (+) Perceived instant response
- (+) User can read while response completes
- (+) Can show sources as soon as identified
- (-) More complex client-side handling
- (-) Can't cache responses (always streamed)

---

## ADR-004: Row Level Security for Multi-Tenancy

**Status:** Accepted

**Context:** Multiple agencies share the platform. Data isolation is critical (insurance data is sensitive).

**Decision:** Use Postgres RLS policies with agency_id on all tables.

**Consequences:**
- (+) Database-level enforcement (can't bypass in app code)
- (+) Works for database AND storage
- (+) Simpler than application-level filtering
- (-) Must remember to include agency_id in all tables
- (-) Slightly more complex queries (though Supabase handles this)

---

## ADR-005: OpenRouter Multi-Provider Integration (Story 5.10)

**Status:** Implemented (2025-12-02)

**Context:** Original decision was OpenAI-only for simplicity. Party Mode research (2025-12-02) identified Claude Sonnet 4.5 as superior for insurance document Q&A due to:
- Better structured document handling and table comprehension
- More consistent instruction following with less hallucination
- 200K token context (vs 128K for GPT-4o)
- Strong performance on "do not alter" instructions (critical for citations)

**Decision:** Use OpenRouter as unified API gateway with Claude Sonnet 4.5 as primary model.

**Model Hierarchy:**
| Rank | Model | Use Case |
|------|-------|----------|
| 🥇 Primary | Claude Sonnet 4.5 | Complex queries, tables, citations |
| 🥈 Cost-Opt | Gemini 2.5 Flash | High-volume, cost-sensitive |
| 🥉 Fast | Claude Haiku 4.5 | Simple lookups, low latency |
| 🔄 Fallback | GPT-4o | If others unavailable |

**Configuration (Environment Variables):**
```bash
LLM_PROVIDER=openrouter           # openrouter | openai
LLM_CHAT_MODEL=claude-sonnet-4.5  # claude-sonnet-4.5 | claude-haiku-4.5 | gemini-2.5-flash | gpt-4o
OPENROUTER_API_KEY=sk-or-v1-xxx   # OpenRouter API key
OPENAI_API_KEY=sk-xxx             # Still needed for embeddings
```

**Consequences:**
- (+) Access to best model for each task (Claude for docs, GPT for embeddings)
- (+) Single API for multiple providers (Anthropic, OpenAI, Google)
- (+) Automatic failover if one provider is down
- (+) Easy A/B testing across model architectures
- (+) No vendor lock-in (config-based switching)
- (-) Additional dependency on OpenRouter
- (-) Slightly higher latency vs direct API (~50ms overhead)

**Implementation:** `src/lib/llm/config.ts` - Centralized configuration with OpenRouter client factory

**Research Sources:**
- [OpenRouter Programming Rankings](https://openrouter.ai/rankings/programming) - Claude Sonnet 4.5 ranked #1
- [Claude vs GPT-4o Comparison](https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o)
- [Best LLMs for Document Processing 2025](https://algodocs.com/best-llm-models-for-document-processing-in-2025/)

---

## ADR-006: RAG Pipeline Optimization (Stories 5.8-5.10)

**Status:** Implemented (2025-12-02)

**Context:** Initial RAG implementation (Stories 5.1-5.6) showed lower than expected confidence scores (~30% High Confidence, ~40% Not Found). Technical research identified optimization opportunities.

**Decision:** Implement three-phase optimization:

**Phase 1 - Retrieval Quality (Story 5.8):**
- Add Cohere Rerank 3.5 for cross-encoder reranking
- Implement hybrid search (BM25 + vector, alpha=0.7)
- Adjust confidence thresholds: ≥0.75 High, 0.50-0.74 Needs Review, <0.50 Not Found
- Target: >50% High Confidence, <25% Not Found

**Phase 2 - Chunking Optimization (Story 5.9):**
- Replace fixed 1000-char chunking with recursive text splitter (500 tokens, 50 overlap)
- Preserve tables as single chunks with GPT-generated summaries
- Add chunk_type metadata for differentiated retrieval

**Phase 3 - Model Evaluation (Story 5.10):**
- Evaluate GPT-4o vs GPT-5-mini vs GPT-5.1
- Compare text-embedding-3-small vs 3-large
- Implement configurable model selection with feature flags

**Consequences:**
- (+) Expected 20-48% improvement in retrieval quality
- (+) Better handling of table queries in insurance documents
- (+) Cost optimization potential (GPT-5-mini is 90% cheaper)
- (-) Additional dependency on Cohere API (with fallback)
- (-) Requires document re-processing for chunking changes

**New Dependencies:**
- `cohere-ai` - Reranking API
- `COHERE_API_KEY` environment variable

**Database Changes:**
```sql
-- Story 5.8: Full-text search support
ALTER TABLE document_chunks ADD COLUMN search_vector tsvector;
CREATE INDEX idx_document_chunks_search ON document_chunks USING GIN(search_vector);

-- Story 5.9: Chunk metadata
ALTER TABLE document_chunks ADD COLUMN chunk_type varchar(20) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN summary text;
```

---

## ADR-007: GPT-5.1 for Structured Extraction (Story 7.2)

**Status:** Decided (2025-12-03)

**Context:** Quote comparison (Epic 7) requires extracting structured data from insurance documents. Need reliable function calling with complex nested schemas (coverages, exclusions, source references). Evaluated GPT-4o, GPT-5, and GPT-5.1.

**Decision:** Use GPT-5.1 directly (not via OpenRouter) for structured quote extraction.

**Model Details:**
| Attribute | Value |
|-----------|-------|
| Model ID | `gpt-5.1` |
| Version | 2025-11-13 |
| Context Window | 400K tokens (272K input + 128K output) |
| Input Cost | $1.25 / 1M tokens |
| Output Cost | $10.00 / 1M tokens |

**Why GPT-5.1 over alternatives:**

| Feature | GPT-5.1 | GPT-4o | Claude Sonnet 4.5 |
|---------|---------|--------|-------------------|
| Context Window | 400K | 128K | 200K |
| CFG Support | Yes | No | No |
| Function Calling | Native + Free-form | Native | Tool Use |
| Schema Adherence | Excellent | Good | Good |
| Input Cost | $1.25/1M | $2.50/1M | $3.00/1M |

**Key GPT-5.1 Features Used:**
1. **Context-Free Grammar (CFG)** - Constrain output to match exact extraction schema
2. **400K Context** - Handle large insurance documents (30+ pages) without truncation
3. **Improved Structured Output** - Better JSON generation and schema adherence
4. **Native Function Calling** - More reliable than Claude's tool use for complex schemas

**Consequences:**
- (+) 50% cheaper than GPT-4o for input tokens
- (+) 3x larger context window than GPT-4o
- (+) CFG prevents format drift in extraction
- (+) Same API key as embeddings (OPENAI_API_KEY)
- (-) Requires direct OpenAI API (not via OpenRouter)
- (-) Slightly slower than GPT-4o for simple tasks

**Implementation:**
```typescript
// src/lib/compare/extraction.ts
const EXTRACTION_MODEL = 'gpt-5.1';  // Version 2025-11-13

// Uses function calling with CFG constraints
const response = await openai.chat.completions.create({
  model: EXTRACTION_MODEL,
  messages: [...],
  tools: [{ type: 'function', function: extractQuoteDataFunction }],
  tool_choice: { type: 'function', function: { name: 'extract_quote_data' } },
});
```

**Research Sources:**
- [Introducing GPT-5 for Developers | OpenAI](https://openai.com/index/introducing-gpt-5-for-developers/)
- [GPT-5 New Params and Tools | OpenAI Cookbook](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools)
- [GPT-5 Function Calling Tutorial | DataCamp](https://www.datacamp.com/tutorial/gpt-5-function-calling-tutorial)

---

## ADR-008: Extraction at Upload Time (Story 10.12)

**Status:** Proposed (2025-12-04)

**Context:** Quote extraction currently runs on-demand during comparison flow. This means:
- Chat Q&A uses only unstructured chunks (no access to structured policy data)
- Comparisons have 20-30s extraction wait
- Document library can't show carrier/premium metadata

**Decision:** Run GPT-5.1 extraction during document processing (after AI tagging) for quote documents.

**Implementation:**
```
Upload → Docling → Chunks → Embeddings → AI Tagging → GPT-5.1 Extraction → Ready
                                              │                  │
                                              ▼                  ▼
                                    document_type        documents.extraction_data
                                    (quote/general)          (JSONB)
```

**Database Changes:**
```sql
ALTER TABLE documents
ADD COLUMN extraction_data JSONB DEFAULT NULL,
ADD COLUMN extraction_version INTEGER DEFAULT NULL,
ADD COLUMN extraction_error TEXT DEFAULT NULL;
```

**Gating Logic:**
- Only run for `document_type = 'quote'` or `null` (backward compat)
- Skip for `document_type = 'general'`
- 60-second timeout with graceful degradation

**Consequences:**
- (+) Chat can answer "What's the deductible?" from structured data with source citations
- (+) Comparisons use cached extraction (instant load)
- (+) Document library shows carrier, premium, policy number
- (+) Source citations preserved via `sourcePages` arrays
- (-) Adds 10-30s to document processing time
- (-) Adds ~$0.03-0.08 cost per quote document

**Hybrid Chat Strategy:**
```typescript
if (documentHasExtraction && isDirectFieldQuery(query)) {
  // Return structured answer with high confidence + source citation
  return { answer, confidence: 'high', sources: extractedField.sourcePages };
}
// Fallback to standard RAG for complex queries
return ragPipeline(query, chunks);
```

---
