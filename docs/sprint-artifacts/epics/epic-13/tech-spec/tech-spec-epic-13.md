# Tech Spec: Epic 13 - LlamaParse Migration

**Version:** 1.0
**Created:** 2025-12-06
**Status:** Draft

---

## Executive Summary

Replace document parsing infrastructure with LlamaParse after abandoning Google Document AI (Epic 12). LlamaParse offers a simpler API, generous free tier, and compatibility with Supabase Edge Functions.

---

## Architecture Overview

### Current State (Post-Epic 12 Abandonment)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Upload PDF     │────▶│  process-document    │────▶│  Document AI    │ ❌ BROKEN
│  (Frontend)     │     │  (Edge Function)     │     │  (Batch API)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                                              │
                        ┌──────────────────────┐              │
                        │  Docling (Railway)   │◀─────────────┘ Fallback
                        │  (Reliability issues)│
                        └──────────────────────┘
```

### Target State (Epic 13)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Upload PDF     │────▶│  process-document    │────▶│  LlamaParse     │
│  (Frontend)     │     │  (Edge Function)     │     │  (Cloud API)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                 │                           │
                                 │                           │
                                 ▼                           ▼
                        ┌──────────────────────┐     ┌─────────────────┐
                        │  DoclingResult       │◀────│  Markdown +     │
                        │  (Internal Format)   │     │  Page Markers   │
                        └──────────────────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌──────────────────────┐
                        │  Chunking + Embed    │
                        │  (Existing Pipeline) │
                        └──────────────────────┘
```

---

## LlamaParse API Integration

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parsing/upload` | POST | Upload PDF for parsing |
| `/api/parsing/job/{id}` | GET | Check job status |
| `/api/parsing/job/{id}/result/markdown` | GET | Get markdown result |

### Authentication

```typescript
headers: {
  'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
  'Content-Type': 'multipart/form-data'
}
```

### Request Flow

```typescript
// 1. Upload document
const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: formData,
});
const { id: jobId } = await uploadResponse.json();

// 2. Poll for completion
let status = 'PENDING';
while (status === 'PENDING') {
  await delay(2000);
  const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`);
  const job = await statusResponse.json();
  status = job.status;
}

// 3. Get result
const resultResponse = await fetch(
  `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`
);
const markdown = await resultResponse.text();
```

### Response Format

LlamaParse returns markdown with:
- Text content extracted from PDF
- Tables formatted as markdown tables
- Page markers (configurable)

---

## Page Marker Handling (Critical for Citations)

### Background

The existing citation system relies on page markers in the parsed output to:
1. Link chat responses to specific document pages
2. Enable "click to verify" source citations
3. Navigate PDF viewer to referenced pages

### Format Differences

| Parser | Page Marker Format | Example |
|--------|-------------------|---------|
| Docling | HTML comments | `<!-- page: 1 -->` |
| LlamaParse | Markdown headers or separators | `# Page 1` or `---` |

### Existing Code Dependency

The `extractPageMarkers()` function in `index.ts` expects Docling's HTML comment format:

```typescript
// Current implementation (Docling format)
function extractPageMarkers(markdown: string): number[] {
  const regex = /<!-- page: (\d+) -->/g;
  const markers: number[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    markers.push(parseInt(match[1], 10));
  }
  return markers;
}
```

### Solution Options

**Option A: Configure LlamaParse to output Docling-compatible format (Preferred)**
- LlamaParse API supports `page_separator` parameter
- Request format: `<!-- page: {page_number} -->`
- Minimal code changes - existing `extractPageMarkers()` works

**Option B: Dual-format detection in `convertToDoclingResult()`**
```typescript
function extractPageMarkers(markdown: string): number[] {
  // Try Docling format first
  const doclingRegex = /<!-- page: (\d+) -->/g;
  let markers = [...markdown.matchAll(doclingRegex)].map(m => parseInt(m[1], 10));

  if (markers.length === 0) {
    // Fallback to LlamaParse header format
    const llamaRegex = /^# Page (\d+)/gm;
    markers = [...markdown.matchAll(llamaRegex)].map(m => parseInt(m[1], 10));
  }

  return markers;
}
```

### Implementation Requirement

**Story 13.1 must verify** which page marker format LlamaParse returns by default and implement one of:
1. API configuration for Docling-compatible output (Option A)
2. Format detection logic (Option B)

### Testing Requirement

**Story 13.4 must verify:**
- Page markers are correctly extracted from LlamaParse output
- Chat source citations link to correct pages
- PDF viewer navigation works

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/process-document/llamaparse-client.ts` | LlamaParse API client |

### Modified Files

| File | Changes |
|------|---------|
| `supabase/functions/process-document/index.ts` | Replace parseDocument call |

### Deleted Files

| File | Reason |
|------|--------|
| `supabase/functions/process-document/documentai-client.ts` | Epic 12 abandoned |

---

## LlamaParse Client Design

### Interface

```typescript
// llamaparse-client.ts

export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
  pollingIntervalMs?: number;
  maxWaitTimeMs?: number;
}

export interface LlamaParseResult {
  markdown: string;
  pageCount: number;
  jobId: string;
}

export async function parseDocumentWithLlamaParse(
  fileBuffer: ArrayBuffer,
  filename: string,
  config: LlamaParseConfig,
  onProgress?: (stage: string, percent: number) => Promise<void>
): Promise<LlamaParseResult>;
```

### Conversion to DoclingResult

```typescript
function convertToDoclingResult(llamaResult: LlamaParseResult): DoclingResult {
  // Extract page markers from markdown
  const pageMarkers = extractPageMarkers(llamaResult.markdown);

  return {
    markdown: llamaResult.markdown,
    pageMarkers,
    pageCount: llamaResult.pageCount,
  };
}
```

---

## Environment Variables

### Required

| Variable | Description | Where |
|----------|-------------|-------|
| `LLAMA_CLOUD_API_KEY` | LlamaIndex Cloud API key | Supabase Edge Function secrets |

### Removed (Post-Migration)

| Variable | Reason |
|----------|--------|
| `GCP_PROJECT_ID` | Document AI removed |
| `GCP_LOCATION` | Document AI removed |
| `GCP_PROCESSOR_ID` | Document AI removed |
| `GCP_SERVICE_ACCOUNT_KEY` | Document AI removed |
| `GCS_BUCKET` | Document AI removed |

---

## Error Handling

### LlamaParse Error Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `PENDING` | Processing | Continue polling |
| `SUCCESS` | Complete | Fetch result |
| `ERROR` | Failed | Retry or report error |

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};
```

---

## Testing Strategy

### Unit Tests

- `__tests__/lib/llamaparse/client.test.ts` - Mock API responses
- Verify markdown parsing
- Verify page marker extraction

### Integration Tests

- Test with real PDFs (requires API key)
- Verify full pipeline: upload → parse → chunk → embed

### E2E Tests

- Upload 126-page insurance PDF
- Verify document appears in library
- Verify chat works with document context

---

## Migration Checklist

### Pre-Migration

- [ ] Create LlamaIndex Cloud account
- [ ] Generate API key
- [ ] Test API with curl/Postman
- [ ] Add API key to Supabase secrets

### Implementation

- [ ] Story 13.1: Create llamaparse-client.ts
- [ ] Story 13.2: Integrate into Edge Function
- [ ] Story 13.3: Remove Document AI code
- [ ] Story 13.4: E2E testing

### Post-Migration

- [ ] Monitor production processing
- [ ] Verify cost stays within free tier
- [ ] Cancel Railway Docling service
- [ ] Remove GCP credentials

---

## Cost Analysis

### LlamaParse Pricing

| Tier | Pages/Month | Cost |
|------|-------------|------|
| Free | 10,000 | $0 |
| Paid | Additional | $3/1000 pages |

### Expected Usage

- Typical document: 20-50 pages
- Estimated monthly uploads: 100-200 documents
- Estimated pages/month: 2,000-10,000

**Conclusion**: Free tier should cover typical usage.

---

## Rollback Plan

If LlamaParse fails in production:

1. **Immediate**: Revert to Docling (still deployed on Railway)
2. **Short-term**: Investigate LlamaParse issues
3. **Long-term**: Consider Azure Document Intelligence as backup

---

## Timeline

| Story | Estimate | Dependencies |
|-------|----------|--------------|
| 13.1 | 3 pts | API key ready |
| 13.2 | 3 pts | 13.1 complete |
| 13.3 | 2 pts | 13.2 tested |
| 13.4 | 2 pts | 13.2 complete |

**Total**: 10 story points
**Estimated Duration**: 2-3 days

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-12-06 | 1.0 | Initial tech spec | SM Agent |
| 2025-12-06 | 1.1 | Added Page Marker Handling section with format differences, solution options, and testing requirements | Claude |
