# Epic 12: Google Cloud Document AI Migration

**Status:** ❌ ABANDONED
**Priority:** P0 - Critical Infrastructure
**Created:** 2025-12-05
**Closed:** 2025-12-06
**Outcome:** Failed - Too complex for serverless environment

---

## Retrospective: Why This Epic Failed

### Summary
After 6 bug fixes in Story 12.6 alone, we determined that Google Document AI's batch processing is **fundamentally incompatible** with Supabase Edge Functions for large documents (100+ pages).

### Issues Encountered

| Bug | Issue | Root Cause |
|-----|-------|------------|
| Bug 1 | `metadata` vs `response` field mismatch | API version inconsistency |
| Bug 2 | `log.warn` method missing | Deno runtime differences |
| Bug 3 | GCS output file not found | Async naming conventions |
| Bug 4 | Empty document (0 pages, 0 text) | Batch output format differs from online |
| Bug 5 | Only 10/126 pages processed | Sharded output files not merged |
| Bug 6 | Memory limit exceeded | 150MB heap limit in Edge Functions |
| Bug 7 | "Failed to process all documents" | Unknown - final failure |

### Technical Barriers

1. **GCS Dependency**: Batch processing requires GCS upload/download workflow
2. **Output Sharding**: Large documents split across multiple JSON files
3. **Memory Limits**: Edge Functions have ~150MB heap limit
4. **Complex Polling**: Long-running operations require polling infrastructure
5. **Format Inconsistency**: Batch vs online output formats differ

### Decision
Abandon Document AI migration. Proceed with **LlamaParse** (Epic 13) which offers:
- Simple REST API (no GCS required)
- 10,000 FREE pages/month
- Works directly in Edge Functions
- No sharding complexity

### Lessons Learned
- Enterprise cloud services often have hidden complexity
- Batch processing APIs aren't designed for serverless
- Validate large document processing EARLY in migration
- Sometimes simpler solutions (LlamaParse) beat "enterprise" ones

---

## Original Goal

Replace the self-hosted Docling document parsing service with Google Cloud Document AI to solve critical reliability issues.

## Problem Statement

Docling, running on Railway, hangs for 150+ seconds on complex insurance PDFs (evidenced by `foran auto nationwide.pdf` stuck at 5% for 10+ minutes). This reliability issue directly impacts core product value.

## Solution

Google Cloud Document AI provides enterprise-grade, GPU-accelerated OCR with:
- 5-30 second processing times (vs 150+ seconds)
- ~99% reliability
- Cost: ~$1.50 per 1000 pages (~$0.08 per typical document)

After Epic 12 completion, Sam can cancel the Railway account hosting Docling.

## User Value

Users experience fast, reliable document processing. Documents that previously timed out or hung will process successfully in seconds.

---

## Stories

### Story 12.1: Connect GCP Document AI (2 pts)
- Sam has created GCP instance - needs help connecting
- Priority: P0 - foundation
- **Status:** Done

### Story 12.2: Create Document AI Parsing Service (3 pts)
- TypeScript service wrapping Document AI API
- Priority: P0 - core service
- **Status:** Done

### Story 12.3: Integrate into Edge Function (5 pts)
- Replace Docling call with Document AI call
- Priority: P0 - main integration
- **Status:** Drafted

### Story 12.4: Response Parsing (3 pts)
- Convert Document AI response to our internal format
- Priority: P0 - data compatibility
- **Status:** Backlog

### Story 12.5: Testing & Validation (2 pts)
- Test with foran auto nationwide.pdf and diverse documents
- Priority: P0 - quality gate
- **Status:** Backlog

### Story 12.6: Batch Processing for Large Documents (3 pts)
- Handle documents > 30 pages using Document AI batch processing API
- Split large PDFs into 30-page chunks, process in parallel, reassemble results
- Priority: P1 - essential for enterprise users with lengthy policy documents
- **Status:** Backlog
- **Note:** Online processing has 30-page limit (imageless mode). Batch processing supports up to 500 pages.

---

## Technical Notes

See full tech spec at: [`tech-spec/tech-spec-epic-12.md`](./tech-spec/tech-spec-epic-12.md)
