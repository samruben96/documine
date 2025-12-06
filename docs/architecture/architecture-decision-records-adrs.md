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

## ADR-002: Docling for PDF Processing (SUPERSEDED 2025-12-05)

**Status:** ~~Accepted~~ **Superseded by ADR-009**

**Context:** Insurance PDFs have complex tables, multi-column layouts, and varying quality. Need 95%+ extraction accuracy. Original LlamaParse solution had 75% table accuracy and API cost concerns.

**Decision:** ~~Use self-hosted Docling service (IBM TableFormer model) for all PDF processing.~~

**Superseded Note:** Docling was replaced by Google Cloud Document AI in Epic 12 (2025-12-05). See ADR-009.

**Why superseded:**
- Docling hangs for 150+ seconds on complex insurance PDFs (e.g., `foran auto nationwide.pdf`)
- ~50% success rate on production documents
- Self-hosted infrastructure added maintenance burden
- Railway service ($5/month) provided no reliability guarantees

**Original Consequences (Historical):**
- (+) 97.9% table extraction accuracy (critical for insurance documents)
- (+) Zero API costs (self-hosted)
- (+) Full data privacy (documents never leave our infrastructure)
- (+) Same page marker format for backward compatibility
- (-) Requires self-managed infrastructure (Railway deployment)
- (-) **CRITICAL: 150+ second hangs on complex PDFs - production blocker**

**Migration Note:** Docling service at https://docling-for-documine-production.up.railway.app to be deprecated after Epic 12 completion. Cancel Railway subscription after migration.

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

**Status:** Implemented (2025-12-04)

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

## ADR-009: Google Cloud Document AI for PDF Processing (Epic 12)

**Status:** ~~In Progress~~ **ABANDONED (2025-12-06) - Superseded by ADR-010**

**Context:** Docling (ADR-002) proved unreliable for production insurance documents. Evidence:
- `foran auto nationwide.pdf` (1.3MB) stuck at 5% for 10+ minutes
- Edge Function logs show 504 timeouts at ~150 seconds
- ~50% success rate on complex insurance PDFs with tables
- Epic 11 async infrastructure (pg_cron, progress tracking) couldn't compensate for Docling's parsing latency

**Decision:** Replace Docling with Google Cloud Document AI for all document parsing.

**Why Document AI:**

| Feature | Docling (Railway) | Document AI (GCP) |
|---------|-------------------|-------------------|
| Parse Time (typical) | 30-120 seconds | 5-15 seconds |
| Parse Time (complex) | 150+ seconds (hangs) | 15-30 seconds |
| Success Rate | ~50% | ~99% |
| Table Extraction | Good when it works | Enterprise-grade |
| OCR Quality | Basic | GPU-accelerated |
| Cost | $5/month (Railway) | ~$1.50/1000 pages |
| Reliability | Self-managed | Google SLA (99.9%) |

**Architecture:**

```
BEFORE (Docling):
Upload → Edge Function → Docling API (Railway) → 30-150+ seconds
       [pg_cron job]

AFTER (Document AI):
Upload → Edge Function → Document AI API (GCP) → 5-30 seconds
       [pg_cron job]     [Service Account Auth]
```

**Implementation:**

1. **Authentication:** JWT-based service account auth (Deno-native, no npm package)
2. **API Endpoint:** `https://{region}-documentai.googleapis.com/v1/projects/{projectId}/locations/{region}/processors/{processorId}:process`
3. **Response Parsing:** Convert Document AI response to existing markdown + page markers format
4. **Error Handling:** Integrate with Epic 11 error classification (transient/recoverable/permanent)

**Environment Variables:**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY  # JSON service account key (Edge Function secret)
DOCUMENT_AI_PROCESSOR_ID    # Processor ID from GCP Console
DOCUMENT_AI_LOCATION        # "us" or "eu"
```

**Consequences:**
- (+) 5-30 second processing vs 150+ seconds
- (+) ~99% reliability vs ~50%
- (+) Enterprise-grade OCR with GPU acceleration
- (+) Google SLA (99.9% availability)
- (+) Simpler infrastructure (no Railway to manage)
- (-) Cost: ~$0.08 per typical document
- (-) Vendor dependency on GCP (mitigated: standard Document AI API)
- (-) Requires service account key management

**Migration Strategy:**
- **Hard cutover** (no Docling fallback) - reliability is the goal
- All Epic 11 infrastructure (jobs, progress, errors) unchanged
- Only `supabase/functions/process-document/index.ts` modified

**Post-Migration Cleanup:**
1. Cancel Railway subscription (Docling service)
2. Remove `DOCLING_SERVICE_URL` environment variable
3. Remove Docling-specific code paths
4. Update CLAUDE.md to remove Docling references

**Stories:**
- 12.1: Connect GCP Document AI
- 12.2: Create Document AI Parsing Service
- 12.3: Integrate into Edge Function
- 12.4: Response Parsing
- 12.5: Testing & Validation

**Tech Spec Reference:** `docs/sprint-artifacts/epics/epic-12/tech-spec/`

**Abandonment Note (2025-12-06):** Epic 12 abandoned after Story 12.6 (Batch Processing) encountered 7 critical bugs:
- Memory limits in Edge Functions (~150MB heap)
- GCS upload/download complexity for batch processing
- Output format inconsistencies between online and batch modes
- Sharding logic failures for large documents
- "Failed to process all documents" errors

See ADR-010 for the replacement solution (LlamaParse).

---

## ADR-010: LlamaParse for PDF Processing (Epic 13)

**Status:** In Progress (2025-12-06)

**Context:** Google Document AI (ADR-009) was abandoned after batch processing proved fundamentally incompatible with Supabase Edge Functions. Story 12.6 encountered 7 critical bugs related to memory limits, GCS dependencies, and output format mismatches.

The core problem remains: need reliable PDF parsing for insurance documents of any size.

**Decision:** Migrate to LlamaParse for all PDF processing.

**Why LlamaParse:**

| Feature | Document AI | LlamaParse |
|---------|-------------|------------|
| API Complexity | GCS + batch + polling + sharding | Simple REST |
| Edge Function Compatible | No (memory issues) | Yes |
| Free Tier | None | 10,000 pages/month |
| Page Limit | 200 (batch) | Unlimited |
| Cost After Free | $10/1000 pages | $3/1000 pages |

**Architecture:**

```
BEFORE (Document AI - Epic 12):
Upload → Edge Function → GCS → Document AI Batch → GCS → Download → Parse
       [Memory issues]  [Complex]              [Sharding bugs]

AFTER (LlamaParse - Epic 13):
Upload → Edge Function → LlamaParse API → Markdown → Existing Pipeline
       [Simple]         [REST call]       [Direct response]
```

**API Flow:**
```typescript
// 1. Upload PDF
const { id: jobId } = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}` },
  body: formData,
}).then(r => r.json());

// 2. Poll for completion
let status = 'PENDING';
while (status === 'PENDING') {
  await delay(2000);
  const job = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`).then(r => r.json());
  status = job.status;
}

// 3. Get markdown result
const markdown = await fetch(
  `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`
).then(r => r.text());
```

**Page Marker Handling:**

LlamaParse outputs markdown with page markers in a different format than Docling:
- **Docling format:** `<!-- page: N -->`
- **LlamaParse format:** `---\n\n# Page N\n\n` or configurable via API

The `convertToDoclingResult()` function must:
1. Detect LlamaParse page markers (regex: `/^# Page (\d+)/m` or `---` separators)
2. Convert to internal `pageMarkers: number[]` array format
3. Preserve compatibility with existing chunking and citation systems

**Implementation Notes:**
- The existing `extractPageMarkers()` function in the Edge Function expects Docling's HTML comment format
- Story 13.1 must implement format detection or request Docling-compatible output from LlamaParse
- LlamaParse API supports `page_separator` option - evaluate using `<!-- page: {page_number} -->` format

**Environment Variables:**
```bash
LLAMA_CLOUD_API_KEY  # LlamaIndex Cloud API key (llx-...)
```

**Removed (Post-Migration):**
```bash
GCP_PROJECT_ID           # Document AI removed
GCP_LOCATION             # Document AI removed
GCP_PROCESSOR_ID         # Document AI removed
GCP_SERVICE_ACCOUNT_KEY  # Document AI removed
GCS_BUCKET               # Document AI removed
```

**Consequences:**
- (+) Simple REST API - no GCS, no batch, no sharding
- (+) Edge Function compatible (no memory issues)
- (+) 10K free pages/month (typical usage covered)
- (+) Lower cost after free tier ($3 vs $10 per 1000 pages)
- (+) No GCP credential management
- (-) New vendor dependency (LlamaIndex Cloud)
- (-) Page marker format differs (requires conversion)
- (-) Less control over OCR options

**Rollback Plan:**
If LlamaParse fails in production:
1. **Immediate:** Revert to Docling (Railway service still running)
2. **Short-term:** Investigate LlamaParse issues
3. **Long-term:** Consider Azure Document Intelligence as backup

**Stories:**
- 13.1: LlamaParse API Client
- 13.2: Edge Function Integration
- 13.3: Remove Document AI Code
- 13.4: Testing & Validation

**Tech Spec Reference:** `docs/sprint-artifacts/epics/epic-13/tech-spec/tech-spec-epic-13.md`

---
