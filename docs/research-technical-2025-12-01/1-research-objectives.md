# 1. Research Objectives

## Technical Question

How can we optimize the RAG pipeline for docuMINE to improve retrieval accuracy and response quality for insurance document Q&A? Specifically:

1. **AI Model Selection** - Evaluate latest OpenAI models (GPT-5, o1 series, gpt-4o updates) for document Q&A
2. **Chunking Strategy** - Research advanced chunking approaches (semantic, hierarchical, section-aware)
3. **Embedding Models** - Evaluate alternatives to text-embedding-3-small
4. **Retrieval Optimization** - Hybrid search, re-ranking, threshold tuning

## Project Context

- **Application:** docuMINE - AI-powered document analysis for insurance agents
- **Current Implementation:**
  - Chat Model: GPT-4o
  - Embeddings: OpenAI text-embedding-3-small (1536 dimensions)
  - Document Processing: Docling (self-hosted) for PDF extraction
  - Chunking: Basic fixed-size (1000 chars) with page boundaries
  - Vector Search: pgvector with cosine similarity, top 5 chunks
  - Confidence Thresholds: ≥0.85 High, 0.60-0.84 Needs Review, <0.60 Not Found

- **Pain Points Observed:**
  - Chat responses often return "Not Found" confidence even for questions with clear answers
  - Similarity scores frequently below 0.60 threshold
  - Chunking may be splitting semantic units inappropriately
  - Response quality could be improved with better models

## Requirements and Constraints

### Functional Requirements

- Handle complex insurance policy documents (tables, coverage sections, legal language)
- Provide accurate answers with source citations
- Support multi-document analysis
- Maintain conversation context
- Stream responses for real-time UX

### Non-Functional Requirements

- **Accuracy:** Improve High Confidence responses by 15%+
- **Latency:** Response time <3 seconds for first token
- **Scalability:** Support concurrent users and large documents
- **Reliability:** 99.9% availability
- **Cost:** Reasonable API costs for production usage

### Technical Constraints

- **Platform:** Supabase (PostgreSQL + pgvector)
- **Language:** TypeScript/Next.js
- **Existing Infrastructure:** Must work with current pgvector setup
- **Budget:** Cost-conscious, avoid expensive models for all queries
- **Backward Compatibility:** Existing documents should continue to work
- **Re-embedding:** Acceptable if chunking strategy changes

---
