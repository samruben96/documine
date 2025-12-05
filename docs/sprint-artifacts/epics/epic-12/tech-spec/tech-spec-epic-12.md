# Epic Technical Specification: Google Cloud Document AI Migration

Date: 2025-12-05
Author: Sam
Epic ID: 12
Status: Draft

---

## Overview

Epic 12 replaces the self-hosted Docling document parsing service with Google Cloud Document AI to solve critical reliability issues. Docling, running on Railway, hangs for 150+ seconds on complex insurance PDFs (evidenced by `foran auto nationwide.pdf` stuck at 5% for 10+ minutes). Google Cloud Document AI provides enterprise-grade, GPU-accelerated OCR with 5-30 second processing times and ~99% reliability.

This migration is the highest priority work for docuMINE as document processing reliability directly impacts core product value. After Epic 12 completion, Sam can cancel the Railway account hosting Docling.

## Objectives and Scope

### In Scope

- Connect to Google Cloud Document AI API (Sam has already created GCP instance)
- Create TypeScript Document AI parsing service in Edge Function
- Replace Docling API call with Document AI API call
- Parse Document AI response into existing internal format (markdown + page markers)
- Test with diverse insurance documents including the failing `foran auto nationwide.pdf`
- Maintain all existing Epic 11 infrastructure (async jobs, progress tracking, error handling)

### Out of Scope

- Changes to async job queue architecture (already implemented in Epic 11)
- Changes to progress tracking UI (already implemented in Epic 11)
- Changes to chunking, embedding, or extraction logic (unchanged)
- Mobile-specific optimizations
- Batch processing (single document at a time, as currently implemented)

## System Architecture Alignment

### Current Architecture (Docling)

```
Upload → Create processing_job → Return immediately
            ↓
pg_cron → Pick up job → Call Edge Function
            ↓
Edge Function → Download PDF → Call Docling API (Railway) → 30-150+ seconds
            ↓
Chunk → Embed → Extract → Update status
```

### Target Architecture (Document AI)

```
Upload → Create processing_job → Return immediately
            ↓
pg_cron → Pick up job → Call Edge Function
            ↓
Edge Function → Download PDF → Call Document AI API (GCP) → 5-30 seconds
            ↓
Parse response → Chunk → Embed → Extract → Update status
```

### Alignment with Existing Architecture

- **Edge Function:** `supabase/functions/process-document/index.ts` - Single file change
- **Database:** No schema changes required
- **Progress tracking:** Uses existing `processing_jobs` stage/progress_percent columns
- **Error handling:** Uses existing error classification (transient/recoverable/permanent)
- **Realtime:** Existing subscriptions continue to work unchanged

## Detailed Design

### Services and Modules

| Module | Responsibility | Input | Output |
|--------|---------------|-------|--------|
| Document AI Client | Authenticate and call Document AI API | PDF buffer | Raw API response |
| Response Parser | Convert Document AI response to markdown | API response | Markdown + page markers |
| Edge Function (modified) | Replace Docling call with Document AI | Job ID | Processing result |

### Data Models and Contracts

**Document AI Request:**
```typescript
interface DocumentAIRequest {
  rawDocument: {
    content: string; // Base64-encoded PDF
    mimeType: string; // 'application/pdf'
  };
}
```

**Document AI Response (Simplified):**
```typescript
interface DocumentAIResponse {
  document: {
    text: string; // Full extracted text
    pages: Array<{
      pageNumber: number;
      dimension: { width: number; height: number };
      layout: { textAnchor: TextAnchor; boundingPoly: BoundingPoly };
      paragraphs: Array<Paragraph>;
      tables: Array<Table>;
    }>;
  };
}
```

**Internal Format (Unchanged):**
```typescript
interface DoclingResult {
  markdown: string;       // Preserved
  pageMarkers: PageMarker[]; // Preserved
  pageCount: number;       // Preserved
}
```

### APIs and Interfaces

**Google Cloud Document AI API:**
- **Endpoint:** `https://{region}-documentai.googleapis.com/v1/projects/{projectId}/locations/{region}/processors/{processorId}:process`
- **Method:** POST
- **Auth:** Service account JSON key (stored as Edge Function secret)
- **Request:** `{ rawDocument: { content: base64PDF, mimeType: "application/pdf" } }`
- **Response:** Document AI ProcessResponse

**Edge Function (Modified Interface):**
```typescript
// Existing signature preserved
async function parseDocumentWithRetry(
  docBuffer: Uint8Array,
  filename: string,
  serviceUrl: string // Now ignored, uses env vars for Document AI
): Promise<DoclingResult>
```

### Workflows and Sequencing

**Document Processing Sequence (Updated Step 5):**

```
1. Download PDF from Supabase Storage
2. Update progress: stage='downloading', progress=100%
3. **NEW: Encode PDF to base64**
4. **NEW: Call Document AI API with timeout**
5. **NEW: Parse Document AI response to markdown**
6. Update progress: stage='parsing', progress=100%
7. Chunk markdown into semantic segments (unchanged)
8. Generate embeddings (unchanged)
9. Extract quote data with GPT (unchanged)
10. Update document status to 'ready'
```

## Non-Functional Requirements

### Performance

| Metric | Current (Docling) | Target (Document AI) | Measurement |
|--------|-------------------|----------------------|-------------|
| Parse time (typical) | 30-120 seconds | 5-15 seconds | Edge Function logs |
| Parse time (complex) | 150+ seconds (timeout) | 15-30 seconds | Edge Function logs |
| Success rate | ~50% on complex PDFs | >99% | Processing job completion |
| API latency | 30s+ | <5s | Network response time |

### Security

- **Authentication:** Service account key stored as Supabase Edge Function secret
- **Data in transit:** TLS 1.2+ to Document AI API
- **Data at rest:** Google manages encryption; docuMINE doesn't store raw PDF beyond processing
- **Access control:** Service account has minimal permissions (documentai.documents.process only)
- **No PII logging:** Document content not logged; only metadata

### Reliability/Availability

| Aspect | Specification |
|--------|--------------|
| API availability | Google SLA: 99.9% |
| Timeout handling | 60-second timeout, graceful fallback |
| Retry behavior | 2 retries with exponential backoff (1s, 2s) |
| Error recovery | Existing stuck job detector (5-minute reset) |

### Observability

- **Logging:** Structured JSON logs with processing time, page count, success/failure
- **Metrics:** Existing Edge Function duration metric in Supabase dashboard
- **Tracing:** Document ID logged for correlation
- **Alerts:** Monitor for processing_jobs stuck in 'processing' > 10 minutes

## Dependencies and Integrations

### Runtime Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database/Storage client |
| google-auth-library | TBD | Service account authentication |

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Google Cloud Document AI | PDF parsing | ~$1.50/1000 pages (~$0.08/doc) |
| Supabase Edge Functions | Execution environment | Included in plan |
| Railway (Docling) | **TO BE DEPRECATED** | Currently $5/month |

### Integration Points

- **Input:** Supabase Storage (documents bucket)
- **Processing:** Google Cloud Document AI
- **Output:** Supabase Database (document_chunks, processing_jobs)
- **Notification:** Supabase Realtime (progress updates)

## Acceptance Criteria (Authoritative)

### Story 12.1: Connect GCP Document AI

- **AC-12.1.1:** Service account credentials configured as Edge Function secret
- **AC-12.1.2:** Document AI API endpoint URL configured via environment variable
- **AC-12.1.3:** Authentication verified with test API call
- **AC-12.1.4:** Connection errors produce actionable error messages

### Story 12.2: Create Document AI Parsing Service

- **AC-12.2.1:** TypeScript service encapsulates Document AI API call
- **AC-12.2.2:** PDF content encoded as base64 before sending
- **AC-12.2.3:** Service handles API response with proper typing
- **AC-12.2.4:** Timeout set to 60 seconds with AbortController
- **AC-12.2.5:** Retry logic: 2 retries with exponential backoff

### Story 12.3: Integrate into Edge Function

- **AC-12.3.1:** `parseDocument()` function replaced with Document AI call
- **AC-12.3.2:** `parseDocumentWithRetry()` wrapper updated
- **AC-12.3.3:** Progress updates continue at parsing stage (0%, 100%)
- **AC-12.3.4:** Error classification applied to Document AI errors
- **AC-12.3.5:** Docling-specific code paths removed

### Story 12.4: Response Parsing

- **AC-12.4.1:** Document AI text extracted with page boundaries
- **AC-12.4.2:** Markdown output compatible with existing chunker
- **AC-12.4.3:** Page markers format: `--- PAGE X ---` preserved
- **AC-12.4.4:** Tables converted to markdown table format
- **AC-12.4.5:** Page count accurately reported

### Story 12.5: Testing & Validation

- **AC-12.5.1:** `foran auto nationwide.pdf` processes successfully in < 60 seconds
- **AC-12.5.2:** All existing tests pass (1514 tests)
- **AC-12.5.3:** E2E test verifies document upload to 'ready' status
- **AC-12.5.4:** Error handling test verifies graceful failure
- **AC-12.5.5:** Build passes without errors

### Story 12.6: Batch Processing for Large Documents

- **AC-12.6.1:** Page count detection before processing (count pages in PDF)
- **AC-12.6.2:** Documents ≤15 pages use online/sync processing
- **AC-12.6.3:** Documents >15 pages use batch processing via GCS
- **AC-12.6.4:** Batch processing uploads PDF to GCS bucket
- **AC-12.6.5:** Batch processing polls for completion (max 5 minutes)
- **AC-12.6.6:** Batch processing downloads results from GCS
- **AC-12.6.7:** Progress updates reflect batch processing stages
- **AC-12.6.8:** GCS bucket configured with auto-delete (24h TTL)

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section | Components | Test Approach |
|--------------------|-------------------|------------|---------------|
| AC-12.1.1 | Security | Edge Function secrets | Manual verification |
| AC-12.1.2 | APIs/Interfaces | Environment variables | Unit test |
| AC-12.1.3 | APIs/Interfaces | Auth client | Integration test |
| AC-12.1.4 | Error handling | Error messages | Unit test |
| AC-12.2.1 | Services/Modules | documentai.ts | Unit test |
| AC-12.2.2 | Data Models | Base64 encoding | Unit test |
| AC-12.2.3 | Data Models | Response typing | Unit test |
| AC-12.2.4 | Performance | Timeout handling | Unit test |
| AC-12.2.5 | Reliability | Retry logic | Unit test |
| AC-12.3.1-5 | Services/Modules | index.ts | Integration test |
| AC-12.4.1-5 | Data Models | Response parser | Unit test |
| AC-12.5.1 | Performance | E2E processing | E2E test |
| AC-12.5.2-5 | Test Strategy | All tests | CI pipeline |
| AC-12.6.1 | Services/Modules | Page count detection | Unit test |
| AC-12.6.2-3 | Workflows | Processing mode selection | Unit test |
| AC-12.6.4-6 | Services/Modules | GCS integration | Integration test |
| AC-12.6.7 | Observability | Progress tracking | E2E test |
| AC-12.6.8 | Infrastructure | GCS bucket lifecycle | Manual verification |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Document AI API rate limits | Low | Medium | Monitor usage; implement backoff |
| Different output format than Docling | Medium | Medium | Build adapter layer; extensive testing |
| GCP credentials exposure | Low | High | Use Edge Function secrets; rotate keys |
| Cost overruns | Low | Low | Monitor usage; set budget alerts |
| Table extraction quality differs | Medium | Medium | Test with table-heavy documents |

### Assumptions

- Sam has already created a GCP project with Document AI enabled
- Service account credentials will be provided for Edge Function configuration
- Document AI processor is already created and configured
- No significant differences in text extraction quality vs Docling
- Existing async infrastructure (pg_cron, Realtime) remains unchanged

### Open Questions

| Question | Owner | Due |
|----------|-------|-----|
| What is the Document AI processor ID? | Sam | Before Story 12.1 |
| Which GCP region is the processor in? | Sam | Before Story 12.1 |
| What is the monthly page budget? | Sam | Before Story 12.5 |

## Test Strategy Summary

### Test Levels

| Level | Coverage | Tools |
|-------|----------|-------|
| Unit | Document AI client, response parser | Vitest |
| Integration | Edge Function + Document AI API | Vitest + mock |
| E2E | Full upload-to-ready flow | Playwright |
| Manual | Production document validation | Real insurance PDFs |

### Key Test Cases

1. **Happy path:** Upload PDF → Document AI → Chunk → Embed → Ready
2. **Timeout handling:** Document AI takes > 60s → Graceful error
3. **Retry success:** First call fails → Retry succeeds
4. **Invalid PDF:** Corrupted file → Recoverable error classification
5. **foran auto nationwide.pdf:** The litmus test → Must complete < 60s

### Test Documents

| Document | Purpose | Expected Result |
|----------|---------|-----------------|
| `foran auto nationwide.pdf` | Complex insurance | Process < 60s |
| Simple 2-page PDF | Baseline | Process < 10s |
| Scanned image PDF | OCR capability | Process successfully |
| Multi-table quote | Table extraction | Tables in markdown |

### Coverage Goals

- **Unit tests:** 90%+ on new code
- **Integration tests:** Document AI client tested against real API
- **E2E tests:** At least 2 new specs for document processing
- **Regression:** All 1514 existing tests must pass

### Test Document Location

Test documents should be placed in `docs/test-documents/` directory:
- `foran auto nationwide.pdf` - Complex insurance (litmus test)
- Additional test PDFs as needed

---

## Implementation Notes (Party Mode Validation)

### Deno Compatibility

Supabase Edge Functions run on Deno, not Node.js. The `google-auth-library` npm package may not work directly. Options:

1. **Recommended:** Use raw `fetch()` with manually signed JWT for service account authentication
2. **Alternative:** Use `google-auth-library` via npm compatibility layer (may have issues)

```typescript
// Deno-native approach for GCP auth
async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  // Sign JWT with RS256 using service account private key
  // Exchange for access token via POST to https://oauth2.googleapis.com/token
}
```

### Migration Strategy

**Hard cutover** (no Docling fallback):
- The entire purpose of Epic 12 is reliability
- Running both services adds complexity without benefit
- If Document AI fails, we fix it rather than fall back to broken Docling

### Post-Migration Cleanup

After Epic 12 is validated in production:
1. Cancel Railway subscription (Docling service)
2. Remove `DOCLING_SERVICE_URL` environment variable
3. Remove Docling-specific error handling code
4. Update CLAUDE.md to remove Docling references

---

## Approval

| Role | Name | Status |
|------|------|--------|
| Architect | Winston | Approved |
| Senior Dev | Charlie | Approved |
| QA Engineer | Dana | Approved |
| Product Owner | Alice | Approved |
| Scrum Master | Bob | Approved |

**Tech Spec Status:** Ready for Implementation
