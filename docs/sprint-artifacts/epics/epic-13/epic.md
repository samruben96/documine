# Epic 13: LlamaParse Migration

**Status:** In Progress
**Priority:** P0 - Critical Infrastructure
**Created:** 2025-12-06
**Predecessor:** Epic 12 (Abandoned)

---

## Goal

Replace document parsing infrastructure with LlamaParse to achieve reliable, simple document processing for insurance PDFs of any size.

## Problem Statement

Epic 12 (Google Document AI migration) was abandoned after encountering 7 critical bugs related to:
- Batch processing complexity (GCS upload/download, sharding)
- Memory limits in Edge Functions (~150MB heap)
- Output format inconsistencies
- "Failed to process all documents" errors

The original problem remains: Docling on Railway hangs for 150+ seconds on complex insurance PDFs.

## Solution

**LlamaParse** offers a simpler, more reliable solution:

| Feature | LlamaParse | Document AI |
|---------|------------|-------------|
| API Complexity | Simple REST | GCS + batch + polling |
| Free Tier | 10,000 pages/month | None |
| Page Limit | Unlimited | 200 (batch) |
| Edge Function Compatible | Yes | No (memory issues) |
| Cost After Free | $3/1000 pages | $10/1000 pages |

## User Value

- **Reliability**: Documents that previously failed will process successfully
- **Speed**: Simple API = faster processing pipeline
- **Cost**: FREE for typical usage (10K pages/month)

---

## Stories

### Story 13.1: LlamaParse API Client (3 pts)
Create TypeScript client for LlamaParse API with:
- API key configuration
- File upload endpoint
- Response parsing to DoclingResult format
- Error handling and retries
- **Priority:** P0 - Foundation

### Story 13.2: Edge Function Integration (3 pts)
Replace Docling/Document AI calls in process-document edge function:
- Swap client implementation
- Maintain existing chunking pipeline
- Update progress reporting
- **Priority:** P0 - Core integration

### Story 13.3: Remove Document AI Code (2 pts)
Clean up abandoned Epic 12 code:
- Remove documentai-client.ts
- Remove GCP credential handling
- Remove batch processing logic
- Update environment variables
- **Priority:** P1 - Technical debt

### Story 13.4: Testing & Validation (2 pts)
End-to-end testing with real documents:
- Test with 126-page insurance PDF (previous failure)
- Test with "foran auto nationwide.pdf"
- Verify chat/RAG functionality works
- Performance benchmarking
- **Priority:** P0 - Quality gate

---

## Technical Notes

### LlamaParse API Overview

```typescript
// Simple REST API call
const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
  },
  body: formData, // PDF file
});

// Poll for results
const result = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`);
```

### Environment Variables Required

```
LLAMA_CLOUD_API_KEY=llx-...
```

### Migration Checklist

- [ ] Sign up for LlamaIndex Cloud account
- [ ] Generate API key
- [ ] Add to Supabase Edge Function secrets
- [ ] Implement client
- [ ] Test with large documents
- [ ] Remove Document AI code
- [ ] Cancel Railway Docling service (post-validation)

---

## Success Criteria

1. 126-page insurance PDF processes successfully
2. All existing chat/RAG functionality works
3. Processing time < 60 seconds for typical documents
4. Zero Document AI code remains in codebase
5. Cost stays within free tier for normal usage

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Epic created after Epic 12 abandonment | SM Agent |
