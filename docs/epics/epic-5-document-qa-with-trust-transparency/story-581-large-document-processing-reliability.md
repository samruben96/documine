# Story 5.8.1: Large Document Processing Reliability

As a **user uploading large insurance documents**,
I want **reliable processing of documents up to 50 pages**,
So that **comprehensive policy documents don't fail or timeout**.

**Added 2025-12-02:** Bug fix story addressing processing timeouts for large documents.
**Completed 2025-12-02:** Implemented with 8MB file limit and timeout handling.

**Acceptance Criteria:**

**Given** a document larger than 20 pages
**When** the document is processed
**Then** processing completes successfully within 5 minutes
**And** progress is reported at each stage
**And** timeouts are handled gracefully with retry logic

**And** file size validation prevents uploads over 8MB:
- Client-side validation with clear error message
- Server-side validation as backup
- User sees "File too large. Maximum size is 8MB" toast

**Technical Notes:**
- Increased Edge Function timeout to 300 seconds
- Added progress reporting to processing_jobs table
- Implemented chunked processing for large documents
- Added file size validation (8MB limit for Docling)
- Files changed:
  - `supabase/functions/process-document/index.ts`
  - `src/components/documents/upload-zone.tsx`
  - `src/lib/documents/validation.ts`

---
