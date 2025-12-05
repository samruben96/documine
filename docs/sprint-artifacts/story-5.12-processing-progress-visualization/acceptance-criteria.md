# Acceptance Criteria

## AC-5.12.1: Processing Stages Display
**Given** a document is processing
**When** I view the document in the list
**Then** I see the current stage:
- "Downloading..." (5-10s)
- "Parsing document..." (1-5 min)
- "Chunking content..." (5-15s)
- "Generating embeddings..." (30s-2 min)

## AC-5.12.2: Progress Bar per Stage
**Given** a document is in a processing stage
**When** the stage reports progress
**Then** I see a progress bar (0-100%) for that stage

## AC-5.12.3: Estimated Time Remaining
**Given** a document is processing
**When** progress data is available
**Then** I see estimated time remaining (e.g., "~2 min remaining")

## AC-5.12.4: Real-time Updates
**Given** a document is processing
**When** progress changes
**Then** the UI updates in real-time via Supabase Realtime

## AC-5.12.5: Visual Design (UX Designer)
**Given** the UX designer reviews the design
**When** they provide mockups/guidance
**Then** the progress UI is:
- Clear and uncluttered
- Matches brand aesthetic
- Mobile-friendly
- Accessible (ARIA labels, color contrast)

---
