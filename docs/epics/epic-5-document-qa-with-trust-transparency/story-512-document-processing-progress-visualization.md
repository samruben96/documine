# Story 5.12: Document Processing Progress Visualization

As a **user uploading documents**,
I want **visual feedback on processing progress beyond just "Analyzing..."**,
So that **I understand what's happening and how long it might take**.

**Added 2025-12-02:** Enhancement story for improved UX during document processing.
**Completed 2025-12-02:** Full implementation with UX-approved design.

**Acceptance Criteria:**

**Given** a document is processing
**When** I view the document in the list
**Then** I see the current stage:
- "Downloading..." (5-10s)
- "Parsing document..." (1-5 min)
- "Chunking content..." (5-15s)
- "Generating embeddings..." (30s-2 min)

**And** I see a progress bar (0-100%) for that stage

**And** I see estimated time remaining (e.g., "~2 min remaining")

**And** the UI updates in real-time via Supabase Realtime

**And** the visual design is approved by UX Designer

**Prerequisites:** Story 5.8.1 (Large Document Processing)

**Technical Notes:**
- Add `progress_data` JSONB column to `processing_jobs` table
- Edge Function reports progress at each stage
- Frontend subscribes via Supabase Realtime
- New component: `src/components/documents/processing-progress.tsx`
- RLS policy added for authenticated users to SELECT processing_jobs

---
