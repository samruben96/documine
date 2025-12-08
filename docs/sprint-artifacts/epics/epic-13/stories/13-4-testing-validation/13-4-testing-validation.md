# Story 13.4: Testing & Validation

**Epic:** 13 - LlamaParse Migration
**Status:** done
**Priority:** P0 - Quality Gate
**Points:** 2
**Created:** 2025-12-06

---

## User Story

**As a** product owner
**I want** comprehensive testing of the LlamaParse migration
**So that** I'm confident the system works for all document types before removing fallbacks

---

## Background

This is the quality gate for Epic 13. Before removing Document AI code and canceling the Railway Docling service, we must verify LlamaParse handles all document types reliably.

### Key Test Documents

1. **126-page insurance PDF** - Failed with Document AI (memory limit)
2. **foran auto nationwide.pdf** - Hung with Docling (150+ seconds)
3. **Various quote documents** - Standard insurance quotes

---

## Acceptance Criteria

### AC-13.4.1: Large Document Test ✅
- [x] Upload 126-page insurance PDF (`25-26 CPKG Policy (CIN).PDF`)
- [x] Processing completes in < 120 seconds
- [x] All 126 pages extracted (verify page count)
- [x] Document appears in library with correct status
- [x] Chat retrieves context from document correctly

### AC-13.4.2: Previously Problematic Document ✅
- [x] Upload "foran auto nationwide.pdf"
- [x] Processing completes in < 60 seconds
- [x] No timeout or hang
- [x] Document content is searchable via chat

### AC-13.4.3: Standard Quote Documents ✅
- [x] Test with 3+ different insurance quote PDFs
- [x] All process successfully
- [x] Extraction data populates correctly
- [x] Chat provides accurate answers about coverage

### AC-13.4.4: Chat/RAG Validation ✅
- [x] Ask "What coverages are included?" - get relevant answer
- [x] Ask about specific limits - get accurate numbers
- [x] Verify source citations point to correct pages
- [x] Test multi-document queries if applicable

### AC-13.4.5: Performance Benchmarks ✅
- [x] Document processing time < expected:
  - Small (1-10 pages): < 15 seconds
  - Medium (10-50 pages): < 30 seconds
  - Large (50-150 pages): < 90 seconds
- [x] Memory usage stays within Edge Function limits
- [x] No timeout errors

### AC-13.4.6: Error Handling Validation ✅
- [x] Test with corrupted PDF - graceful error
- [x] Test with password-protected PDF - clear error message
- [x] Test with non-PDF file - rejected appropriately
- [x] Error messages are user-friendly

---

## Test Matrix

| Document | Pages | Expected Time | Status |
|----------|-------|---------------|--------|
| 25-26 CPKG Policy (CIN).PDF | 126 | < 120s | ✅ PASS |
| foran auto nationwide.pdf | ? | < 60s | ✅ PASS |
| QUOTE 25-26 Cyber Quote.pdf | 16 | < 20s | ✅ PASS |
| QUOTE 24-25 Cyber Quote.pdf | 13 | < 20s | ✅ PASS |
| [Additional test docs] | - | - | ✅ PASS |

---

## Chat Test Scenarios

### Scenario 1: Coverage Query
```
User: "What general liability coverage is included?"
Expected: Answer with specific limits and page references
```

### Scenario 2: Premium Query
```
User: "What is the total annual premium?"
Expected: Specific dollar amount with source citation
```

### Scenario 3: Comparison Query
```
User: "How does the cyber coverage compare between the two quotes?"
Expected: Comparison of limits/deductibles from both documents
```

---

## Performance Logging

Track these metrics during testing:

```typescript
{
  documentId: string,
  filename: string,
  pageCount: number,
  fileSizeMB: number,
  llamaParseTimeMs: number,
  chunkingTimeMs: number,
  embeddingTimeMs: number,
  totalTimeMs: number,
  success: boolean,
  errorMessage?: string
}
```

---

## Rollback Criteria

If ANY of the following occur, pause migration:

1. Large document (100+ pages) fails consistently
2. Processing time > 3x expected
3. Chat retrieval accuracy drops significantly
4. Memory errors occur
5. API rate limiting issues

---

## Definition of Done

- [x] All test documents process successfully
- [x] Performance benchmarks met
- [x] Chat/RAG functionality verified
- [x] Error handling tested
- [x] No blocking issues identified
- [x] Sign-off from Sam to proceed with cleanup (Story 13.3) - N/A, 13.3 already complete

---

## Post-Validation Actions

After successful validation:
1. [x] ~~Execute Story 13.3 (Remove Document AI code)~~ - ALREADY COMPLETE (2025-12-06)
2. [ ] Cancel Railway Docling service
3. [ ] Remove GCP Document AI credentials (if any remain in Supabase secrets)
4. [ ] Update monitoring/alerting for LlamaParse

---

## Dependencies

- Story 13.2 complete (LlamaParse integrated)
- Test documents available
- LlamaParse API key has sufficient quota

---

## Notes

- Keep Railway Docling running until validation complete
- Document any LlamaParse quirks discovered during testing
- Note if markdown format differs from Docling (may need chunker adjustments)

---

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/epics/epic-13/stories/13-4-testing-validation/13-4-testing-validation.context.xml`

### Completion Notes
- **2025-12-07:** Manual testing completed by Sam. All test documents processed successfully with LlamaParse. Performance benchmarks met. Chat/RAG functionality verified with accurate source citations. No blocking issues identified. Epic 13 LlamaParse migration validated and complete.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
| 2025-12-07 | Context file generated, status → ready-for-dev | Story Context Workflow |
| 2025-12-07 | Manual testing completed, all ACs verified, status → done | Sam + Dev Agent |
