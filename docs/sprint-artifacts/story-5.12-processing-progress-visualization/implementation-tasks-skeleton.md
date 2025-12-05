# Implementation Tasks (Skeleton)

## Phase 1: Backend Infrastructure (P0) ✅ COMPLETE
- [x] Add `progress_data` JSONB column to `processing_jobs` table
- [x] Create progress reporting utility in Edge Function (`updateJobProgress`)
- [x] Update each stage to report progress:
  - Downloading: Start/end markers (fast stage)
  - Parsing: Start/end markers (Docling doesn't support page callbacks)
  - Chunking: Start/end markers (fast stage)
  - Embedding: Batches processed / total batches (precise)
- [x] Test progress updates via Supabase Realtime

## Phase 2: UX Design (P0) ✅ COMPLETE
- [x] **UX Designer**: Create mockups for progress states *(Party Mode 2025-12-02)*
- [x] **UX Designer**: Define animations/transitions *(shimmer on active stage)*
- [x] **UX Designer**: Review accessibility requirements *(ARIA labels, WCAG AA)*
- [x] **Dev**: Review and validate technical feasibility *(Amelia confirmed)*

## Phase 3: Frontend Implementation (P1) ✅ COMPLETE
- [x] Subscribe to `processing_jobs` changes in document list (`useProcessingProgress` hook)
- [x] Create `ProcessingProgress` component
- [x] Implement stage display (downloading, parsing, etc.)
- [x] Implement progress bar per stage
- [x] Implement time remaining calculation (range format)
- [x] Add to `DocumentListItem` or `DocumentStatus` component
- [x] Handle edge cases (stuck progress, errors → fallback to shimmer)

## Phase 4: Testing & Polish (P2) ✅ COMPLETE
- [x] Build passing
- [x] All 609 tests passing
- [x] Test mobile responsiveness (sm breakpoint styling)
- [x] Test accessibility (ARIA labels, aria-live)
- [ ] Manual testing with various file sizes (pending QA)
- [ ] Performance testing (Realtime subscription overhead)

---
