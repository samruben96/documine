# Story 5.8: AI Model & Chunking Strategy Optimization - Session Prompt

## Overview

This prompt is for starting a new Claude Code session to research and implement improvements to docuMINE's AI response quality. The story focuses on two areas:
1. **AI Model Upgrade**: Evaluate GPT-5, GPT-5.1, or other newer OpenAI models
2. **Advanced Chunking Strategies**: Improve document chunking for better RAG retrieval

---

## Session Start Prompt

Copy and paste everything below this line into a new Claude Code session:

---

```
I'm working on the docuMINE project and need to create and implement Story 5.8 using the BMAD Method.

## Project Context

docuMINE is an AI-powered document analysis platform for insurance agents. The current implementation uses:
- **AI Model**: GPT-4o for chat completions
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Document Processing**: Docling (self-hosted) for PDF extraction
- **Chunking**: Basic fixed-size chunking with page boundaries
- **Vector Search**: pgvector with cosine similarity

### Current Pain Points Observed
1. Chat responses often return "Not Found" confidence even for questions with clear answers in the document
2. Similarity scores are frequently below 0.60 threshold, triggering low confidence
3. Chunking may be splitting semantic units inappropriately
4. The current GPT-4o model may have better alternatives now (GPT-5, GPT-5.1, o1, etc.)

## Story 5.8 Objectives

### 1. AI Model Research & Evaluation
- Research available OpenAI models (GPT-5, GPT-5.1, o1-preview, o1-mini, gpt-4o-2024-11-20, etc.)
- Compare capabilities, pricing, latency, and accuracy for document Q&A use case
- Evaluate if newer models provide better context understanding and response quality
- Consider reasoning models (o1 series) for complex insurance document analysis
- Document findings with recommendations

### 2. Advanced Chunking Strategy Research & Implementation
Research and implement improved chunking strategies:
- **Semantic Chunking**: Split on semantic boundaries rather than fixed sizes
- **Hierarchical Chunking**: Parent-child chunk relationships for context
- **Sliding Window with Overlap**: Configurable overlap to maintain context
- **Section-Aware Chunking**: Use document structure (headers, sections)
- **Table-Aware Chunking**: Keep tables intact as single chunks
- **Sentence-Based Chunking**: Use sentence boundaries with grouping
- **LangChain/LlamaIndex patterns**: Evaluate industry-standard approaches

### 3. Retrieval Optimization
- Evaluate hybrid search (keyword + semantic)
- Consider re-ranking strategies (cross-encoder)
- Tune similarity thresholds based on testing
- Implement chunk metadata for better filtering

## BMAD Workflow Instructions

Please use the BMAD Method workflows in this order:

### Phase 1: Research (Use Analyst + Architect Agents)
1. Run `/bmad:bmm:workflows:research` with type "technical" to:
   - Research OpenAI's latest model offerings and capabilities
   - Research chunking strategies and RAG best practices
   - Evaluate LangChain, LlamaIndex, and other frameworks
   - Document findings

2. Use web search to find:
   - OpenAI API documentation for newest models
   - Benchmarks comparing GPT-4o vs GPT-5 vs o1 series
   - Best practices for insurance document RAG systems
   - Academic papers on chunking strategies

### Phase 2: Story Creation (Use PM + SM Agents)
3. Run `/bmad:bmm:workflows:create-story` to create Story 5.8 with:
   - Clear acceptance criteria for both model upgrade and chunking improvements
   - Testable metrics (similarity score improvements, response quality)
   - Implementation tasks broken down by component
   - Rollback strategy if new model doesn't perform well

### Phase 3: Implementation Planning (Use Architect Agent)
4. Run `/bmad:bmm:workflows:story-context` to gather:
   - Current implementation files:
     - `src/lib/openai/embeddings.ts`
     - `src/lib/chat/openai-stream.ts`
     - `src/lib/chat/rag.ts`
     - `src/lib/documents/chunking.ts`
     - `supabase/functions/process-document/index.ts`
   - Database schema for document_chunks table
   - Current confidence thresholds and scoring logic

### Phase 4: Implementation (Use Dev Agent)
5. Run `/bmad:bmm:workflows:dev-story` to implement:
   - Model configuration changes (if upgrading)
   - New chunking strategy module
   - A/B testing capability for comparing approaches
   - Metrics collection for retrieval quality

## Key Files to Review

```
src/lib/openai/embeddings.ts          # Embedding generation
src/lib/chat/openai-stream.ts         # Chat completion with GPT-4o
src/lib/chat/rag.ts                   # RAG pipeline orchestration
src/lib/chat/vector-search.ts         # pgvector similarity search
src/lib/chat/confidence.ts            # Confidence scoring thresholds
src/lib/documents/chunking.ts         # Current chunking implementation
src/lib/docling/client.ts             # Docling integration
supabase/functions/process-document/  # Document processing pipeline
```

## Success Metrics

Story should be considered successful if:
1. Average similarity scores improve by 15%+ on test queries
2. "High Confidence" responses increase from current baseline
3. Response quality subjectively improves on sample questions
4. No regression in response latency (or acceptable trade-off)
5. Implementation is backward compatible with existing documents

## Questions to Answer During Research

1. What are the latest OpenAI models available and their pricing?
2. Is GPT-5 or GPT-5.1 available? What are their capabilities?
3. Should we use o1-preview for complex reasoning tasks?
4. What chunking strategy works best for insurance policy documents (tables, coverage sections)?
5. Should we re-embed existing documents if we change chunking strategy?
6. What's the cost impact of model upgrades?
7. Are there better embedding models than text-embedding-3-small?

## Constraints

- Must maintain backward compatibility with existing conversations
- Should not require re-uploading documents (re-processing acceptable)
- Supabase/pgvector architecture must be preserved
- Budget considerations for API costs
- Implementation should be phased and reversible

Please start by running the research workflow to gather information on the latest AI models and chunking strategies.
```

---

## Additional Context for Reference

### Current Architecture
- **Embeddings**: 1536 dimensions, stored in pgvector
- **Chunking**: Max 1000 chars with page boundary preservation
- **Similarity Search**: Top 5 chunks by cosine similarity
- **Confidence Thresholds**: ≥0.85 High, 0.60-0.84 Needs Review, <0.60 Not Found

### Sprint Status
- Epic 5: Stories 5.1-5.6 complete
- Story 5.7 (Responsive Chat Experience) in backlog
- Story 5.8 would be new addition for optimization

### Related Documentation
- `/docs/architecture.md` - System architecture
- `/docs/sprint-artifacts/tech-spec-epic-5.md` - Epic 5 technical spec
- `/docs/sprint-artifacts/sprint-status.yaml` - Current sprint tracking
