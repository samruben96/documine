# Incident Report: Document Extraction Pipeline Not Working

**Date:** 2025-11-30
**Severity:** Critical
**Epic:** Epic 4 - Document Management
**Stories Affected:** 4-6 (Document Processing Pipeline), 4-7 (Processing Queue Management)
**Status:** RESOLVED

---

## Executive Summary

Document extraction was completely non-functional. Documents uploaded to the system remained stuck in "processing" status indefinitely, with zero chunks being created in the database. This was the core functionality of the product.

**Root Cause:** The Edge Function `process-document` was never being invoked after document upload. The code created a processing job record in the database but had no mechanism to actually trigger the Edge Function.

---

## Timeline

| Time | Event |
|------|-------|
| Upload | User uploads "Clemens RAM quote.pdf" |
| +0s | Document record created with status='processing' |
| +0s | Processing job record created with status='pending' |
| +∞ | **Nothing happens** - Edge Function never called |
| Investigation | Document stuck in processing, 0 chunks in database |

---

## Investigation Process

### Team Involved
- Explore Agent: Investigated document extraction flow and LlamaParse integration
- Explore Agent: Checked Supabase database schema and data state
- General-Purpose Agent: Researched LlamaParse best practices and alternatives

### Key Findings

1. **Database State Analysis**
   - Documents table: 1 record with status='processing', page_count=NULL
   - Document_chunks table: **0 records** (critical finding)
   - Processing_jobs table: Job existed but was never picked up

2. **Code Flow Analysis**
   - `uploadDocument()` in `actions.ts` calls `createProcessingJob()`
   - `createProcessingJob()` in `service.ts` only inserts a database record
   - **No HTTP call to Edge Function** - the missing link!

3. **Edge Function Status**
   - Edge Function code existed locally at `supabase/functions/process-document/index.ts`
   - Edge Function was **NOT deployed** to Supabase
   - Even if deployed, nothing would have triggered it

---

## Root Cause Analysis

### The Bug

```typescript
// service.ts - BEFORE (broken)
export async function createProcessingJob(documentId: string): Promise<ProcessingJob> {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('processing_jobs')
    .insert({ document_id: documentId, status: 'pending' })
    .select()
    .single();

  // ❌ MISSING: No code to invoke the Edge Function!
  return data;
}
```

### Why This Happened

1. **Assumption Gap**: The story implementation assumed a database trigger or webhook would invoke the Edge Function, but none was configured
2. **No Integration Test**: End-to-end testing wasn't performed to verify chunks appeared after upload
3. **Edge Function Not Deployed**: The function existed locally but was never deployed to production
4. **Secrets Not Set**: Even if deployed, the required API keys (OPENAI_API_KEY, LLAMA_CLOUD_API_KEY) weren't configured

---

## Resolution

### 1. Code Fix (`src/lib/documents/service.ts`)

```typescript
// service.ts - AFTER (fixed)
export async function createProcessingJob(documentId: string): Promise<ProcessingJob> {
  const serviceClient = createServiceClient();

  // Get document details for Edge Function
  const { data: document } = await serviceClient
    .from('documents')
    .select('storage_path, agency_id')
    .eq('id', documentId)
    .single();

  const { data, error } = await serviceClient
    .from('processing_jobs')
    .insert({ document_id: documentId, status: 'pending' })
    .select()
    .single();

  // ✅ NEW: Trigger Edge Function (fire-and-forget)
  triggerEdgeFunction(documentId, document.storage_path, document.agency_id)
    .catch(console.error);

  return data;
}

// ✅ NEW: HTTP call to Edge Function
async function triggerEdgeFunction(
  documentId: string,
  storagePath: string,
  agencyId: string
): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ documentId, storagePath, agencyId }),
  });
}
```

### 2. Edge Function Deployment

```bash
# Deployed via Supabase MCP tool
# Project ID: qfhzvkqbbtxvmwiixlhf
mcp__supabase__deploy_edge_function(
  project_id: "qfhzvkqbbtxvmwiixlhf",
  name: "process-document",
  files: [{ name: "index.ts", content: "..." }]
)
```

### 3. Secrets Configuration

```bash
# Set required API keys
npx supabase secrets set --env-file /tmp/secrets.env --project-ref qfhzvkqbbtxvmwiixlhf
# - OPENAI_API_KEY
# - LLAMA_CLOUD_API_KEY
```

---

## Verification

### Manual Trigger Test

```bash
curl -X POST "https://qfhzvkqbbtxvmwiixlhf.supabase.co/functions/v1/process-document" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"documentId":"86c702c9-...","storagePath":"...","agencyId":"..."}'

# Response:
{"success":true,"chunkCount":3,"pageCount":1,"documentId":"86c702c9-..."}
```

### Database Verification

| Metric | Before | After |
|--------|--------|-------|
| Document Status | `processing` | `ready` |
| Page Count | `null` | `1` |
| Chunks Created | `0` | `3` |
| Embeddings | None | 1536-dimensional vectors |

### Content Extracted

The "Clemens RAM quote.pdf" was correctly parsed as a Ram Mutual Homeowners Insurance Quote with:
- Applicant information
- Premium details ($1,393.25)
- Coverage tables (Dwelling, Property, Liability)
- Deductible options

---

## Lessons Learned

### What Went Wrong

1. **No End-to-End Testing**: Story acceptance only verified individual components, not the full flow
2. **Implicit Trigger Assumption**: No explicit verification that Edge Function would be invoked
3. **Deployment Gap**: Local Edge Function never deployed to production
4. **Missing Smoke Test**: No post-deployment verification that documents get processed

### Process Improvements

1. **Add E2E Tests for Critical Flows**
   - Upload document → verify chunks created
   - Should be part of CI/CD pipeline

2. **Deployment Checklist for Edge Functions**
   - [ ] Function deployed to Supabase
   - [ ] All required secrets set
   - [ ] Test invocation works
   - [ ] Verify logs show processing

3. **Integration Testing in Story DoD**
   - For pipeline stories, DoD must include end-to-end verification
   - "Chunks appear in database" should be an explicit acceptance criterion check

4. **Better Story Design**
   - Story 4-6 and 4-7 were implemented separately
   - The "glue" between upload action and Edge Function was nobody's responsibility
   - Consider stories that explicitly cover integration points

---

## Action Items for Epic 4 Retrospective

- [ ] Discuss: Why wasn't E2E testing caught as a gap?
- [ ] Discuss: How to prevent "orphaned" Edge Functions in future
- [ ] Add: Deployment verification step for Edge Functions
- [ ] Add: Smoke test for document processing after deployment
- [ ] Consider: Database trigger as backup invocation mechanism

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/documents/service.ts` | Added `triggerEdgeFunction()` and integrated into `createProcessingJob()` |
| `supabase/functions/process-document/index.ts` | Deployed to Supabase (no code changes) |
| Supabase Secrets | Added OPENAI_API_KEY, LLAMA_CLOUD_API_KEY |

---

## Related Documentation

- Story 4-6: Document Processing Pipeline (LlamaParse)
- Story 4-7: Processing Queue Management
- Edge Function: `supabase/functions/process-document/index.ts`
