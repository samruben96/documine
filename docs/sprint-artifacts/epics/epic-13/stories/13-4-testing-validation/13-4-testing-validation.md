# Story 13.4: Testing & Validation

**Epic:** 13 - LlamaParse Migration
**Status:** TODO
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

### AC-13.4.1: Large Document Test
- [ ] Upload 126-page insurance PDF (`25-26 CPKG Policy (CIN).PDF`)
- [ ] Processing completes in < 120 seconds
- [ ] All 126 pages extracted (verify page count)
- [ ] Document appears in library with correct status
- [ ] Chat retrieves context from document correctly

### AC-13.4.2: Previously Problematic Document
- [ ] Upload "foran auto nationwide.pdf"
- [ ] Processing completes in < 60 seconds
- [ ] No timeout or hang
- [ ] Document content is searchable via chat

### AC-13.4.3: Standard Quote Documents
- [ ] Test with 3+ different insurance quote PDFs
- [ ] All process successfully
- [ ] Extraction data populates correctly
- [ ] Chat provides accurate answers about coverage

### AC-13.4.4: Chat/RAG Validation
- [ ] Ask "What coverages are included?" - get relevant answer
- [ ] Ask about specific limits - get accurate numbers
- [ ] Verify source citations point to correct pages
- [ ] Test multi-document queries if applicable

### AC-13.4.5: Performance Benchmarks
- [ ] Document processing time < expected:
  - Small (1-10 pages): < 15 seconds
  - Medium (10-50 pages): < 30 seconds
  - Large (50-150 pages): < 90 seconds
- [ ] Memory usage stays within Edge Function limits
- [ ] No timeout errors

### AC-13.4.6: Error Handling Validation
- [ ] Test with corrupted PDF - graceful error
- [ ] Test with password-protected PDF - clear error message
- [ ] Test with non-PDF file - rejected appropriately
- [ ] Error messages are user-friendly

---

## Test Matrix

| Document | Pages | Expected Time | Status |
|----------|-------|---------------|--------|
| 25-26 CPKG Policy (CIN).PDF | 126 | < 120s | TODO |
| foran auto nationwide.pdf | ? | < 60s | TODO |
| QUOTE 25-26 Cyber Quote.pdf | 16 | < 20s | TODO |
| QUOTE 24-25 Cyber Quote.pdf | 13 | < 20s | TODO |
| [Additional test docs] | - | - | TODO |

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

- [ ] All test documents process successfully
- [ ] Performance benchmarks met
- [ ] Chat/RAG functionality verified
- [ ] Error handling tested
- [ ] No blocking issues identified
- [ ] Sign-off from Sam to proceed with cleanup (Story 13.3)

---

## Post-Validation Actions

After successful validation:
1. [ ] Execute Story 13.3 (Remove Document AI code)
2. [ ] Cancel Railway Docling service
3. [ ] Remove GCP Document AI credentials
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

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
