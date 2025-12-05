# Acceptance Criteria

## AC-5.9.1: Recursive Text Splitter Implementation
**Given** a document text needs chunking
**When** the recursive splitter processes it
**Then**:
- Chunk target size: 500 tokens
- Chunk overlap: 50 tokens
- Separators tried in order: `["\n\n", "\n", ". ", " "]`

## AC-5.9.2: Separator Hierarchy
**Given** the recursive splitter encounters text
**When** splitting is performed
**Then**:
- First attempts split on double newlines (paragraphs)
- Falls back to single newlines (lines)
- Falls back to sentences (". ")
- Finally splits on spaces (words)

## AC-5.9.3: Table Detection
**Given** Docling output contains table elements
**When** the chunking pipeline processes the document
**Then**:
- Tables are identified from Docling JSON structure
- Each table extracted as a separate entity
- Table boundaries respected

## AC-5.9.4: Tables as Single Chunks
**Given** a table is detected
**When** chunks are created
**Then**:
- Entire table emitted as single chunk (regardless of size)
- No splitting within table boundaries
- Large tables may exceed normal chunk size (acceptable)

## AC-5.9.5: Table Chunk Metadata
**Given** a table chunk is created
**When** stored in database
**Then**:
- `chunk_type = 'table'` metadata set
- Can be filtered/identified in queries

## AC-5.9.6: Table Summary Generation
**Given** a table chunk is created
**When** embedding is needed
**Then**:
- GPT generates concise summary of table contents
- Summary embedded for retrieval (not raw table)
- Raw table content stored for answer generation
- Summary stored in `summary` column

## AC-5.9.7: Batch Re-processing Pipeline
**Given** existing documents need re-chunking
**When** re-processing is triggered
**Then**:
- Documents processed in batches (configurable size)
- Progress tracked and logged
- Existing chunks preserved until cutover
- Rollback capability maintained

## AC-5.9.8: A/B Testing Capability
**Given** new chunks are generated
**When** comparing to old chunks
**Then**:
- Both chunk sets can coexist
- Feature flag controls which set is used
- Metrics can be compared side-by-side

## AC-5.9.9: Table Query Improvement
**Given** optimizations are deployed
**When** running table-related test queries
**Then** accuracy improves by ≥15% over baseline

## AC-5.9.10: No Latency Regression
**Given** new chunking is active
**When** measuring response latency
**Then** P95 remains <3 seconds (same as Story 5.8)

---
