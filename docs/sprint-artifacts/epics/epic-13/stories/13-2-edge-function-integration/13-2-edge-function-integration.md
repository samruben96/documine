# Story 13.2: Edge Function Integration

**Epic:** 13 - LlamaParse Migration
**Status:** TODO
**Priority:** P0 - Core Integration
**Points:** 3
**Created:** 2025-12-06

---

## User Story

**As a** user uploading documents
**I want** my PDFs processed by LlamaParse
**So that** I get reliable document parsing without timeouts or failures

---

## Background

Replace the Docling/Document AI calls in `process-document` Edge Function with LlamaParse. The existing chunking and embedding pipeline remains unchanged.

---

## Acceptance Criteria

### AC-13.2.1: Replace Parser Call
- [ ] Import `parseDocumentWithLlamaParse` from llamaparse-client
- [ ] Replace `parseDocumentWithRetry()` implementation
- [ ] Pass file buffer and filename to LlamaParse client
- [ ] Convert result to DoclingResult format

### AC-13.2.2: Progress Reporting
- [ ] Report 'parsing' stage during upload
- [ ] Report 'parsing' progress during polling (0-90%)
- [ ] Report 'parsing' complete at 100%
- [ ] Maintain existing progress callback interface

### AC-13.2.3: Error Handling
- [ ] Catch LlamaParse errors
- [ ] Map to existing error categories (transient, permanent)
- [ ] Update processing_jobs with appropriate error info
- [ ] Return user-friendly error messages

### AC-13.2.4: Backward Compatibility
- [ ] Output same DoclingResult format
- [ ] Existing chunking pipeline works unchanged
- [ ] Existing embedding pipeline works unchanged
- [ ] Page markers work for citations

### AC-13.2.5: Environment Configuration
- [ ] Read `LLAMA_CLOUD_API_KEY` from environment
- [ ] Fail fast if API key not configured
- [ ] Log configuration on startup (without exposing key)

---

## Technical Design

### Current Flow (To Replace)

```typescript
// index.ts - parseDocumentWithRetry()
async function parseDocumentWithRetry(...) {
  // Currently calls Document AI or Docling
  // This needs to call LlamaParse instead
}
```

### New Flow

```typescript
import { parseDocumentWithLlamaParse, convertToDoclingResult } from './llamaparse-client.ts';

async function parseDocumentWithRetry(
  fileBuffer: ArrayBuffer,
  filename: string,
  documentId: string,
  onProgress?: ProgressCallback
): Promise<DoclingResult> {
  const apiKey = Deno.env.get('LLAMA_CLOUD_API_KEY');
  if (!apiKey) {
    throw new Error('LLAMA_CLOUD_API_KEY not configured');
  }

  const result = await parseDocumentWithLlamaParse(
    fileBuffer,
    filename,
    { apiKey },
    async (stage, percent) => {
      if (onProgress) {
        await onProgress('parsing', percent);
      }
    }
  );

  return convertToDoclingResult(result);
}
```

### Error Mapping

| LlamaParse Error | Error Category | User Message |
|------------------|----------------|--------------|
| Upload failed | transient | "Upload failed, please try again" |
| Polling timeout | transient | "Processing took too long, please retry" |
| Parse error | permanent | "Document could not be parsed" |
| API key invalid | permanent | "Service configuration error" |

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/process-document/index.ts` | Replace parser call |

---

## Testing Requirements

### Integration Tests
- [ ] Upload document through UI
- [ ] Verify LlamaParse is called (check logs)
- [ ] Verify DoclingResult returned
- [ ] Verify chunking completes
- [ ] Verify embedding completes

### E2E Tests
- [ ] Full upload → process → chat flow
- [ ] Verify document appears in library
- [ ] Verify chat retrieves context correctly

---

## Definition of Done

- [ ] LlamaParse called for all document uploads
- [ ] Progress reporting works in UI
- [ ] Errors handled gracefully
- [ ] Existing tests pass
- [ ] New integration tests pass
- [ ] Code reviewed

---

## Dependencies

- Story 13.1 complete (LlamaParse client exists)
- API key configured in Supabase secrets

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
