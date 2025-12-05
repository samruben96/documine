# Implementation Tasks

## Task 1: Frontend Validation (P0)
- [ ] Add `MAX_FILE_SIZE_BYTES` constant (15MB)
- [ ] Add `validateFileSize()` function
- [ ] Update `upload-zone.tsx` to validate before upload
- [ ] Show error toast for oversized files
- [ ] Show warning toast for large files (>5MB)
- [ ] Add unit tests

## Task 2: Reduce Timeouts (P1)
- [ ] Reduce Docling timeout from 150s to 90s
- [ ] Add total processing timeout check (120s)
- [ ] Update error messages to be user-friendly
- [ ] Redeploy edge function

## Task 3: Progress Visibility (P2)
- [ ] Add `stage` column to `processing_jobs`
- [ ] Update edge function to report stage progress
- [ ] Add Realtime subscription to document-status component
- [ ] Display stage and elapsed time in UI
- [ ] Add tests

## Task 4: Documentation
- [ ] Update CLAUDE.md with file size limits
- [ ] Add troubleshooting guide for large documents
- [ ] Document recommended document sizes

---
