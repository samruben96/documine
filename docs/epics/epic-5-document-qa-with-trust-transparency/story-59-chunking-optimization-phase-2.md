# Story 5.9: Chunking Optimization (Phase 2)

As the **system processing insurance documents**,
I want **to chunk documents more intelligently**,
So that **semantic units remain intact and tables are preserved**.

**Acceptance Criteria:**

**Given** the current fixed-size chunking breaks semantic units
**When** documents are processed
**Then** chunking is improved through:

**RecursiveCharacterTextSplitter:**
- Replace fixed 1000-char chunking with recursive splitting
- Chunk size: 500 tokens with 50 token overlap
- Separators: `["\n\n", "\n", ". ", " "]`
- Preserves paragraphs and sentences as units

**Table-Aware Chunking:**
- Detect tables in Docling output (already structured)
- Tables emitted as single chunks regardless of size
- Table chunks include metadata: `chunk_type: 'table'`
- Table summaries generated for retrieval
- Raw table content stored for answer generation

**Document Re-processing Pipeline:**
- Batch re-processing for existing documents
- New embeddings stored in parallel with old
- A/B testing before cutover
- Rollback capability

**Success Metrics:**
- +15-20% improvement in semantic coherence
- +20% improvement for table-related queries
- No regression in response latency

**Prerequisites:** Story 5.8

**Technical Notes:**
- Update `src/lib/documents/chunking.ts` with recursive splitter
- Modify `supabase/functions/process-document/index.ts`
- Create migration for chunk metadata columns
- Parallel embedding storage for A/B testing
- Progress tracking for batch re-processing

---
