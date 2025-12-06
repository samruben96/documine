# Dev Agent Record

## Session: 2025-12-02

**Context Reference:** `5-9-chunking-optimization.context.xml`

**Implementation Summary:**

1. **Database Migration Applied:**
   - `chunk_type` (text/table) with CHECK constraint
   - `summary` (text, nullable) for table descriptions
   - `embedding_version` (integer, default 1) for A/B testing
   - Indexes: `idx_document_chunks_type`, `idx_document_chunks_version`

2. **Recursive Text Splitter Implemented:**
   - `recursiveCharacterTextSplitter()` with separator hierarchy
   - Falls through: `["\n\n", "\n", ". ", " "]`
   - Force word split as final fallback
   - Target: 500 tokens, overlap: 50 tokens

3. **Table-Aware Chunking Implemented:**
   - `extractTablesWithPlaceholders()` - detects markdown tables via regex
   - `generateTableSummary()` - rule-based (fast, per Story 5.8.1 constraints)
   - Tables preserved as single chunks regardless of size
   - Extract → placeholder → reinsert pattern

4. **Edge Function Updated & Deployed:**
   - `process-document/index.ts` - full table-aware chunking
   - New chunks stored with `embedding_version: 2`
   - Deployed: `npx supabase functions deploy process-document`

5. **Re-processing API Created:**
   - `GET /api/admin/reprocess-documents` - stats by version
   - `POST /api/admin/reprocess-documents` - batch re-process
   - Supports A/B testing (v1 vs v2 chunks)

**Key Design Decisions:**
- Rule-based table summaries (not GPT) - per Story 5.8.1 timeout constraints (~20s budget)
- Markdown table regex pattern (Docling outputs markdown)
- Version 2 for new chunks (version 1 preserved for rollback)
- Admin-only re-processing endpoint

**Files Changed:**
- `src/lib/documents/chunking.ts` - complete rewrite with table awareness
- `supabase/functions/process-document/index.ts` - synced chunking logic
- `src/app/api/admin/reprocess-documents/route.ts` - new endpoint
- `__tests__/unit/lib/documents/chunking.test.ts` - expanded to 44 tests

**Test Results:** 789 tests passing, build succeeds

---
