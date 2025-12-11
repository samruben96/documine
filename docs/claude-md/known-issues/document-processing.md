# Document Processing Issues

## LlamaParse Replaced by Docling (Story 4.8, 2025-11-30)

**Issue:** LlamaParse API had multiple issues:
- Page separator placeholder case sensitivity (`{pageNumber}` vs `{page_number}`)
- 75% table extraction accuracy insufficient for insurance documents
- API costs accumulated with scale

**Resolution:** Migrated to self-hosted Docling service:
- 97.9% table extraction accuracy (IBM TableFormer model)
- Zero API costs
- Full data privacy
- Same page marker format (`--- PAGE X ---`) for backward compatibility

**Files Changed:**
- `src/lib/docling/client.ts` (new - replaces llamaparse client)
- `src/lib/documents/chunking.ts` (updated import)
- `supabase/functions/process-document/index.ts` (updated to call Docling)
- Docling Python service in separate repo: https://github.com/samruben96/docling-for-documine

**Environment Variable:** `DOCLING_SERVICE_URL` replaces `LLAMA_CLOUD_API_KEY`

---

## PDF "page-dimensions" Error Handling (Story 5.13, 2025-12-02)

**Issue:** Some PDFs fail to parse with libpdfium error: "could not find the page-dimensions for the given page"

**Root Cause:** PDF format issue in libpdfium when performing cell matching during table extraction

**Reference:** https://github.com/docling-project/docling/issues/2536

**Resolution:** Implemented robust error handling and retry logic:

1. **Error Detection (AC-5.13.1):**
   - Edge Function detects "page-dimensions", "MediaBox", or "libpdfium" errors
   - Returns user-friendly message: "This PDF has an unusual format that our system can't process. Try re-saving it with Adobe Acrobat or a PDF converter."

2. **Retry with Fallback (AC-5.13.2):**
   - On page-dimensions error, retry with `?disable_cell_matching=true`
   - Docling service initializes two converters (standard and fallback)
   - Fallback converter disables `do_cell_matching` in table extraction

3. **Diagnostic Logging (AC-5.13.3):**
   - Logs PDF size, filename, error type for analysis
   - Structured logging helps identify problematic PDF patterns

4. **UI Error Display:**
   - Failed documents show user-friendly error in document viewer
   - Error message fetched from `processing_jobs.error_message`
   - `FailedDocumentView` component displays message prominently

**Files Changed:**
- `supabase/functions/process-document/index.ts` - Error detection, retry logic, user-friendly messages
- `src/app/(dashboard)/documents/[id]/page.tsx` - FailedDocumentView component
- `src/hooks/use-processing-progress.ts` - Added errorMap for error messages
- Docling service: `main.py` - Added `disable_cell_matching` query param, fallback converter

**User-Friendly Error Messages:**
```typescript
const USER_FRIENDLY_ERRORS = {
  'page-dimensions': 'This PDF has an unusual format that our system can\'t process. Try re-saving it with Adobe Acrobat or a PDF converter.',
  'timeout': 'Processing timeout: document too large or complex. Try splitting into smaller files.',
  'unsupported-format': 'This file format is not supported. Please upload a PDF, DOCX, or image file.',
};
```
