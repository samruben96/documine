# Story 5.9: Chunking Optimization (Phase 2)

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.9
**Status:** Drafted
**Created:** 2025-12-01
**Prerequisites:** Story 5.8 (Retrieval Quality Optimization)

---

## User Story

As the **system processing insurance documents**,
I want **to chunk documents more intelligently**,
So that **semantic units remain intact and tables are preserved**.

---

## Background & Context

### Problem Statement

The current fixed-size chunking (1000 characters) has several issues:
- Semantic units (paragraphs, sections) are split inappropriately
- Tables are broken across chunks, destroying their structure
- Insurance documents have specific patterns (coverage sections, exclusions) that get fragmented
- Questions about table data often return "Not Found" due to chunking issues

### Research Findings

Based on technical research (2025-12-01):

1. **RecursiveCharacterTextSplitter**: 85-90% recall with 400-512 token chunks
2. **Table-Aware Chunking**: +20% improvement for table queries when tables preserved
3. **Overlap**: 10-20% overlap (50 tokens for 500-token chunks) maintains context

**Key Insight**: When table structure is destroyed by improper chunking, LLMs cannot perceive meaningful information. Insurance documents contain critical tables (coverage limits, deductibles, exclusions).

---

## Acceptance Criteria

### AC-5.9.1: Recursive Text Splitter Implementation
**Given** a document text needs chunking
**When** the recursive splitter processes it
**Then**:
- Chunk target size: 500 tokens
- Chunk overlap: 50 tokens
- Separators tried in order: `["\n\n", "\n", ". ", " "]`

### AC-5.9.2: Separator Hierarchy
**Given** the recursive splitter encounters text
**When** splitting is performed
**Then**:
- First attempts split on double newlines (paragraphs)
- Falls back to single newlines (lines)
- Falls back to sentences (". ")
- Finally splits on spaces (words)

### AC-5.9.3: Table Detection
**Given** Docling output contains table elements
**When** the chunking pipeline processes the document
**Then**:
- Tables are identified from Docling JSON structure
- Each table extracted as a separate entity
- Table boundaries respected

### AC-5.9.4: Tables as Single Chunks
**Given** a table is detected
**When** chunks are created
**Then**:
- Entire table emitted as single chunk (regardless of size)
- No splitting within table boundaries
- Large tables may exceed normal chunk size (acceptable)

### AC-5.9.5: Table Chunk Metadata
**Given** a table chunk is created
**When** stored in database
**Then**:
- `chunk_type = 'table'` metadata set
- Can be filtered/identified in queries

### AC-5.9.6: Table Summary Generation
**Given** a table chunk is created
**When** embedding is needed
**Then**:
- GPT generates concise summary of table contents
- Summary embedded for retrieval (not raw table)
- Raw table content stored for answer generation
- Summary stored in `summary` column

### AC-5.9.7: Batch Re-processing Pipeline
**Given** existing documents need re-chunking
**When** re-processing is triggered
**Then**:
- Documents processed in batches (configurable size)
- Progress tracked and logged
- Existing chunks preserved until cutover
- Rollback capability maintained

### AC-5.9.8: A/B Testing Capability
**Given** new chunks are generated
**When** comparing to old chunks
**Then**:
- Both chunk sets can coexist
- Feature flag controls which set is used
- Metrics can be compared side-by-side

### AC-5.9.9: Table Query Improvement
**Given** optimizations are deployed
**When** running table-related test queries
**Then** accuracy improves by ≥15% over baseline

### AC-5.9.10: No Latency Regression
**Given** new chunking is active
**When** measuring response latency
**Then** P95 remains <3 seconds (same as Story 5.8)

---

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/lib/documents/table-detection.ts` | Identify tables in Docling output |
| `src/lib/documents/reprocess.ts` | Batch re-processing pipeline |
| `scripts/reprocess-documents.ts` | CLI script for re-processing |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/documents/chunking.ts` | Replace fixed-size with recursive splitter |
| `supabase/functions/process-document/index.ts` | Use new chunking, table handling |

### Database Migration

```sql
-- Migration: add_chunk_metadata
ALTER TABLE document_chunks ADD COLUMN chunk_type varchar(20) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN summary text;

-- Index for filtering by chunk type
CREATE INDEX idx_document_chunks_type ON document_chunks(document_id, chunk_type);
```

### Chunking Algorithm

```typescript
// src/lib/documents/chunking.ts

interface ChunkConfig {
  chunkSize: number;      // 500 tokens (~2000 chars)
  chunkOverlap: number;   // 50 tokens (~200 chars)
  separators: string[];   // ["\n\n", "\n", ". ", " "]
}

const DEFAULT_CONFIG: ChunkConfig = {
  chunkSize: 2000,        // ~500 tokens in chars
  chunkOverlap: 200,      // ~50 tokens in chars
  separators: ["\n\n", "\n", ". ", " "],
};

export function recursiveCharacterTextSplitter(
  text: string,
  config: ChunkConfig = DEFAULT_CONFIG
): string[] {
  // Implementation:
  // 1. Find best separator that creates chunks under size limit
  // 2. Recursively split oversized chunks with next separator
  // 3. Merge undersized chunks respecting overlap
  // 4. Return final chunk array
}
```

### Table Detection

```typescript
// src/lib/documents/table-detection.ts

interface DoclingTable {
  type: 'table';
  content: string;
  rows: string[][];
  pageNumber: number;
}

export function extractTables(
  doclingOutput: DoclingDocument
): DoclingTable[] {
  // Find all table elements in Docling JSON
  // Extract structured content
  // Return array of table objects
}

export async function generateTableSummary(
  table: DoclingTable
): Promise<string> {
  // Use GPT to generate concise summary
  // Example: "Coverage limits table showing liability ($1M), property ($500K), and auto ($250K) coverage amounts with corresponding deductibles"
}
```

---

## Implementation Tasks

### Task 1: Database Migration
- [ ] Create migration for `chunk_type` column
- [ ] Create migration for `summary` column
- [ ] Create migration for type index
- [ ] Apply to Supabase project

### Task 2: Recursive Text Splitter
- [ ] Implement `recursiveCharacterTextSplitter` function
- [ ] Add separator hierarchy logic
- [ ] Implement overlap handling
- [ ] Add comprehensive unit tests

### Task 3: Table Detection
- [ ] Analyze Docling output format for tables
- [ ] Implement `extractTables` function
- [ ] Implement `generateTableSummary` with GPT
- [ ] Add unit tests with sample Docling JSON

### Task 4: Update Chunking Pipeline
- [ ] Integrate recursive splitter into chunking.ts
- [ ] Add table extraction before text chunking
- [ ] Handle page number preservation
- [ ] Update process-document Edge Function

### Task 5: Re-processing Pipeline
- [ ] Create batch processing script
- [ ] Implement progress tracking
- [ ] Add parallel chunk storage (old + new)
- [ ] Create feature flag for chunk set selection

### Task 6: Testing & Validation
- [ ] Run table-related test queries
- [ ] Compare metrics to Story 5.8 baseline
- [ ] Verify no latency regression
- [ ] Manual testing with real insurance documents

---

## Test Strategy

### Unit Tests

```typescript
// chunking.test.ts
describe('RecursiveCharacterTextSplitter', () => {
  it('splits on paragraph boundaries first', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = recursiveCharacterTextSplitter(text, { chunkSize: 50 });
    expect(chunks).toHaveLength(3);
  });

  it('maintains overlap between chunks', () => {
    const text = 'Long paragraph...'; // 1000+ chars
    const chunks = recursiveCharacterTextSplitter(text, {
      chunkSize: 500,
      chunkOverlap: 100
    });
    // Verify overlap exists between consecutive chunks
    expect(chunks[0].slice(-50)).toContain(chunks[1].slice(0, 50));
  });

  it('handles text smaller than chunk size', () => {
    const text = 'Short text.';
    const chunks = recursiveCharacterTextSplitter(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });
});

// table-detection.test.ts
describe('Table Detection', () => {
  it('extracts tables from Docling output', () => {
    const docling = { /* sample Docling JSON with table */ };
    const tables = extractTables(docling);
    expect(tables).toHaveLength(1);
    expect(tables[0].type).toBe('table');
  });

  it('preserves table structure', () => {
    const docling = { /* multi-row table */ };
    const tables = extractTables(docling);
    expect(tables[0].rows.length).toBeGreaterThan(1);
  });
});
```

### Integration Tests

- Test full chunking pipeline with sample documents
- Verify table chunks stored with correct metadata
- Test summary generation with mocked GPT

### E2E Test Checklist

- [ ] Process new document with new chunking
- [ ] Verify tables preserved as single chunks
- [ ] Run table test queries
- [ ] Verify ≥15% improvement on table queries
- [ ] Test re-processing on existing document
- [ ] Verify A/B testing capability works

---

## Success Metrics

| Metric | Baseline (5.8) | Target | Measurement |
|--------|----------------|--------|-------------|
| Table Query Accuracy | ~60% | ≥75% | Manual review |
| Semantic Coherence | Baseline | +15% | Automated eval |
| P95 Latency | <3s | <3s | Performance test |
| Chunk Quality | N/A | Tables intact | Manual inspection |

---

## Rollback Plan

If chunking changes cause issues:

1. **Feature Flag**: Switch back to old chunks via flag
2. **Preserve Old Chunks**: Don't delete until cutover confirmed
3. **Revert Code**: Can revert chunking.ts changes independently
4. **Migration Safe**: New columns are additive, won't break existing

---

## Dependencies

- **Story 5.8 Complete**: Retrieval optimizations in place
- **Docling Output**: Need to understand exact JSON format
- **GPT Access**: For table summary generation

---

## Key Learnings from Story 5.11

**Critical Observation:** During Story 5.11 bug fixes, we discovered important RAG behavior:

**Example Query:** "Whats in the dwelling info"
**Result:** GPT gave an excellent response with specific coverage amounts from page 1, but the confidence badge showed "Not Found"

**Relevance to Chunking:**

1. **Chunk Quality Matters More Than Similarity Score**: Even with low similarity scores (< 0.60), if the correct chunk is retrieved, GPT can extract and present the information accurately. This suggests:
   - Chunk semantic coherence is crucial
   - Tables being split hurts retrieval AND comprehension
   - Better chunks → better retrieval → higher confidence scores

2. **Current Chunking May Be Hurting Similarity Scores**: The "dwelling info" query likely:
   - Found relevant chunks but with fragmented content
   - Embedding similarity suffered due to content fragmentation
   - Better semantic chunking should improve scores

3. **Don't Rely on Code to Override LLM**: Story 5.11 removed forced "not found" responses because:
   - GPT-4o is smart enough to handle retrieved context intelligently
   - System prompt already guides behavior
   - Code overrides blocked legitimate good responses

**Recommendation for This Story:**
- Include "dwelling info" style queries in test cases
- Measure if new chunking improves similarity scores (not just response quality)
- Track whether improved chunking reduces false "not found" badges
- Tables preserved as single chunks should significantly improve table query similarity scores

---

## Notes

- Table summary generation adds ~$0.001 per table (GPT-4o-mini)
- Re-processing all documents may take hours depending on count
- Consider processing new documents first, backfill later
- Large tables may impact context window - monitor token usage

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Migration applied successfully
- [ ] Table queries show ≥15% improvement
- [ ] No latency regression
- [ ] Re-processing pipeline working
- [ ] A/B testing capability verified
- [ ] Code reviewed and approved
- [ ] Merged to main branch
