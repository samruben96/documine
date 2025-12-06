# Technical Implementation

## New Files

| File | Purpose |
|------|---------|
| `src/lib/documents/table-detection.ts` | Identify tables in Docling output |
| `src/lib/documents/reprocess.ts` | Batch re-processing pipeline |
| `scripts/reprocess-documents.ts` | CLI script for re-processing |

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/documents/chunking.ts` | Replace fixed-size with recursive splitter |
| `supabase/functions/process-document/index.ts` | Use new chunking, table handling |

## Database Migration

```sql
-- Migration: add_chunk_metadata
ALTER TABLE document_chunks ADD COLUMN chunk_type varchar(20) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN summary text;

-- Index for filtering by chunk type
CREATE INDEX idx_document_chunks_type ON document_chunks(document_id, chunk_type);
```

## Chunking Algorithm

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

## Table Detection

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
