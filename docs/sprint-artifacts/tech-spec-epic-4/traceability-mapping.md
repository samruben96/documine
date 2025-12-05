# Traceability Mapping

| AC | FR | Spec Section | Component(s)/API(s) | Test Idea |
|----|-----|--------------|---------------------|-----------|
| AC-4.1.1 | FR8 | Upload Zone | `upload-zone.tsx` | Verify default UI state |
| AC-4.1.2 | FR8 | Upload Zone | `upload-zone.tsx` | Drag file over, verify hover state |
| AC-4.1.3 | FR8 | Upload Zone | `upload-zone.tsx` + react-dropzone | Click zone, verify file picker opens |
| AC-4.1.4 | FR8 | Upload Zone | `upload-zone.tsx` | Drop .docx file, verify rejection toast |
| AC-4.1.5 | FR8 | Upload Zone | `upload-zone.tsx` | Upload 60MB PDF, verify rejection |
| AC-4.1.6 | FR8 | Upload Zone | `upload-zone.tsx` | Drop 5 PDFs, verify parallel upload |
| AC-4.1.7 | FR8, FR27 | Upload Service | `upload.ts` + Supabase Storage | Verify storage path format |
| AC-4.1.8 | FR8 | Upload Service | `documents` table | Verify record created with processing status |
| AC-4.2.1 | FR8 | Progress Feedback | `upload-zone.tsx` | Upload large file, verify progress bar |
| AC-4.2.2 | FR8 | Progress Feedback | `upload-zone.tsx` | Verify filename displays during upload |
| AC-4.2.3 | FR8 | Progress Feedback | `upload-zone.tsx` | Click cancel during upload |
| AC-4.2.4 | FR12 | Progress Feedback | `upload-zone.tsx` | Verify shimmer after upload completes |
| AC-4.2.5 | FR12 | Progress Feedback | `document-list.tsx` | Verify checkmark on ready status |
| AC-4.2.6 | FR12 | Progress Feedback | Toast notification | Verify success toast message |
| AC-4.2.7 | FR34 | Progress Feedback | `document-list.tsx` | Fail processing, verify error UI |
| AC-4.2.8 | FR12 | Progress Feedback | Supabase Realtime | Navigate away, return, verify status persists |
| AC-4.3.1 | FR9 | Document List | `document-list.tsx` | Verify list item structure |
| AC-4.3.2 | FR9 | Document List | `document-list.tsx` | Upload doc, verify relative date |
| AC-4.3.3 | FR9 | Document List | `document-list.tsx` | Verify status icons display |
| AC-4.3.4 | FR9 | Document List | `document-list.tsx` | Upload 3 docs, verify sort order |
| AC-4.3.5 | FR9 | Document List | `document-list.tsx` | Upload 20 docs, verify scroll |
| AC-4.3.6 | FR9 | Document List | `document-list.tsx` | Type in search, verify filter |
| AC-4.3.7 | FR9 | Document List | `/documents/[id]/page.tsx` | Click doc, verify split view |
| AC-4.3.8 | FR9 | Document List | `document-list.tsx` | Click doc, verify selected style |
| AC-4.3.9 | FR9 | Document List | `/documents/page.tsx` | New user, verify empty state |
| AC-4.3.10 | FR32 | Document List | `sidebar.tsx` | Test at different viewport widths |
| AC-4.4.1 | FR10 | Delete Document | `document-list.tsx` | Verify delete action exists |
| AC-4.4.2 | FR10 | Delete Document | Confirmation modal | Click delete, verify modal text |
| AC-4.4.3 | FR10 | Delete Document | Confirmation modal | Verify body text |
| AC-4.4.4 | FR10 | Delete Document | Confirmation modal | Verify button styling |
| AC-4.4.5 | FR10 | Delete Document | `deleteDocument()` | Delete doc, verify DB cascade |
| AC-4.4.6 | FR10 | Delete Document | `deleteDocument()` | Delete doc, verify storage cleanup |
| AC-4.4.7 | FR10 | Delete Document | Toast notification | Verify success message |
| AC-4.4.8 | FR10 | Delete Document | Navigation | Delete viewed doc, verify redirect |
| AC-4.5.1 | FR11 | Rename Document | `document-list.tsx` | Verify rename action exists |
| AC-4.5.2 | FR11 | Rename Document | `document-list.tsx` | Click rename, verify inline edit |
| AC-4.5.3 | FR11 | Rename Document | `document-list.tsx` | Press Enter, press Escape |
| AC-4.5.4 | FR11 | Rename Document | Zod schema | Try invalid names |
| AC-4.5.5 | FR11 | Labels | `document-list.tsx` | Verify add label action |
| AC-4.5.6 | FR11 | Labels | Label input | Type label, verify autocomplete |
| AC-4.5.7 | FR11 | Labels | `document-list.tsx` | Add labels, verify pill display |
| AC-4.5.8 | FR11 | Labels | `document-list.tsx` | Click X on pill, verify removal |
| AC-4.5.9 | FR11 | Labels | Validation | Try adding 11th label |
| AC-4.5.10 | FR11 | Labels | `sidebar.tsx` | Select label, verify filter |
| AC-4.6.1 | FR12 | Processing Pipeline | Edge Function | Verify LlamaParse API call |
| AC-4.6.2 | FR12 | Processing Pipeline | Edge Function | Verify markdown output with tables |
| AC-4.6.3 | FR12 | Processing Pipeline | `chunking.ts` | Unit test chunking logic |
| AC-4.6.4 | FR12 | Processing Pipeline | `document_chunks` table | Verify page_number, chunk_index |
| AC-4.6.5 | FR12 | Processing Pipeline | `document_chunks` table | Verify bounding_box when present |
| AC-4.6.6 | FR12 | Processing Pipeline | Edge Function | Verify OpenAI embeddings call |
| AC-4.6.7 | FR12 | Processing Pipeline | `document_chunks` table | Verify chunks inserted |
| AC-4.6.8 | FR12 | Processing Pipeline | `documents` table | Verify status = 'ready' |
| AC-4.6.9 | FR12 | Processing Pipeline | `documents` table | Verify page_count stored |
| AC-4.6.10 | FR12 | Processing Pipeline | Edge Function | Mock LlamaParse failure, verify retry |
| AC-4.6.11 | FR12 | Processing Pipeline | Logs | Verify duration logged |
| AC-4.7.1 | FR33 | Queue Management | `processing_jobs` table | Verify FIFO ordering |
| AC-4.7.2 | FR33 | Queue Management | Edge Function | Upload 2 docs same agency, verify sequential |
| AC-4.7.3 | FR33 | Queue Management | Edge Function | Upload to 2 agencies, verify parallel |
| AC-4.7.4 | FR33 | Queue Management | `document-list.tsx` | Queue 3 docs, verify queue position display |
| AC-4.7.5 | FR33 | Queue Management | Scheduled function | Mock stale job, verify failure |
| AC-4.7.6 | FR33 | Queue Management | `document-list.tsx` | Failed doc, click Retry |
| AC-4.7.7 | FR33 | Queue Management | `uploadDocument()` | Upload 11 docs in hour, verify limit |
| AC-4.7.8 | FR33 | Queue Management | Toast notification | Verify rate limit message |
| AC-4.8.1 | FR12 | Docling Migration | `docling-service/` | Verify REST API responds to /parse endpoint |
| AC-4.8.2 | FR12 | Docling Migration | `docling-service/` | Upload PDF/DOCX/XLSX/image, verify markdown output |
| AC-4.8.3 | FR12 | Docling Migration | `docling-service/` | Verify page markers in output |
| AC-4.8.4 | FR12 | Docling Migration | Edge Function | Verify Edge Function calls Docling service |
| AC-4.8.5 | FR12 | Docling Migration | `src/lib/docling/client.ts` | Unit test client interface compatibility |
| AC-4.8.6 | FR12 | Docling Migration | `docling-service/` | Test complex table extraction |
| AC-4.8.7 | FR12 | Docling Migration | `docker-compose.yml` | Run docker-compose up, verify service starts |
| AC-4.8.8 | FR12 | Docling Migration | Edge Function | Verify logging and retry on failure |
| AC-4.8.9 | FR12 | Docling Migration | `document_chunks` table | Verify no schema changes needed |
| AC-4.8.10 | FR12 | Docling Migration | Vitest | All tests pass, build succeeds |
