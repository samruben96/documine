# Story 5.13: Docling PDF Parsing Robustness

As a **user uploading various PDF documents**,
I want **robust handling of PDFs that cause parsing errors**,
So that **documents don't fail silently and I get clear feedback**.

**Added 2025-12-02:** Bug fix story for Docling libpdfium page-dimensions errors.

**Status:** Drafted

**Acceptance Criteria:**

**Given** a PDF that causes libpdfium page-dimensions errors
**When** the document is processed
**Then** the error is caught gracefully
**And** the document is marked as 'failed' with a helpful error message
**And** the user sees actionable feedback (e.g., "This PDF format is not supported")

**Technical Notes:**
- Handle `libpdfium` errors in Edge Function
- Add retry logic with alternative parsing strategy
- Improve error messages in processing_jobs table

---
