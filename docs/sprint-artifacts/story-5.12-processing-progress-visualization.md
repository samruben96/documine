# Story 5.12: Document Processing Progress Visualization

**Epic:** 5 - Document Q&A with Trust Transparency
**Story ID:** 5.12
**Status:** Completed
**Created:** 2025-12-02
**Completed:** 2025-12-02
**UX Design Session:** 2025-12-02 (Party Mode)
**Prerequisites:** Story 5.8.1 (Large Document Processing)
**Type:** Enhancement
**UX Designer Required:** ~~Yes~~ ✅ Complete

---

## User Story

As a **user uploading documents**,
I want **visual feedback on processing progress beyond just "Analyzing..."**,
So that **I understand what's happening and how long it might take**.

---

## Background & Context

### Current Experience

Currently, users see:
- ✅ Upload progress bar (0-100%)
- ❌ "Analyzing..." spinner with no details
- ❌ No indication of processing stage
- ❌ No progress within the "Analyzing" phase

### Problem Statement

With Story 5.8.1 optimizations, documents can take **5-8 minutes** to process (large files on paid tier). Users need:
1. **Stage visibility**: What's happening now? (Downloading, Parsing, Embedding)
2. **Progress indication**: How much is complete?
3. **Time awareness**: Estimated time remaining

### User Impact

**Before (Current):**
- User uploads 30MB document
- Sees "Analyzing..." for 6 minutes
- Gets frustrated/confused
- May close browser thinking it's stuck

**After (This Story):**
- User uploads 30MB document
- Sees: "Parsing document... 45% complete (2 min remaining)"
- Feels informed and patient
- Waits confidently

---

## Acceptance Criteria

### AC-5.12.1: Processing Stages Display
**Given** a document is processing
**When** I view the document in the list
**Then** I see the current stage:
- "Downloading..." (5-10s)
- "Parsing document..." (1-5 min)
- "Chunking content..." (5-15s)
- "Generating embeddings..." (30s-2 min)

### AC-5.12.2: Progress Bar per Stage
**Given** a document is in a processing stage
**When** the stage reports progress
**Then** I see a progress bar (0-100%) for that stage

### AC-5.12.3: Estimated Time Remaining
**Given** a document is processing
**When** progress data is available
**Then** I see estimated time remaining (e.g., "~2 min remaining")

### AC-5.12.4: Real-time Updates
**Given** a document is processing
**When** progress changes
**Then** the UI updates in real-time via Supabase Realtime

### AC-5.12.5: Visual Design (UX Designer)
**Given** the UX designer reviews the design
**When** they provide mockups/guidance
**Then** the progress UI is:
- Clear and uncluttered
- Matches brand aesthetic
- Mobile-friendly
- Accessible (ARIA labels, color contrast)

---

## Technical Approach (High-Level)

### Option 1: Server-Sent Progress (Recommended)

**Edge Function Changes:**
- Add progress reporting to each stage
- Store progress in `processing_jobs.progress_data` JSON field
- Update periodically during long operations

**Frontend Changes:**
- Subscribe to `processing_jobs` table changes via Supabase Realtime
- Parse `progress_data` JSON to extract:
  - Current stage
  - Stage progress (0-100)
  - Estimated time remaining
- Update UI reactively

**Example `progress_data` structure:**
```json
{
  "stage": "parsing",
  "stage_progress": 45,
  "stage_name": "Parsing document",
  "estimated_seconds_remaining": 120,
  "total_progress": 30
}
```

### Option 2: Client-Side Estimation

**Edge Function Changes:**
- Minimal - just report stage transitions

**Frontend Changes:**
- Estimate progress based on file size + elapsed time
- Less accurate but simpler implementation

---

## Implementation Tasks (Skeleton)

### Phase 1: Backend Infrastructure (P0) ✅ COMPLETE
- [x] Add `progress_data` JSONB column to `processing_jobs` table
- [x] Create progress reporting utility in Edge Function (`updateJobProgress`)
- [x] Update each stage to report progress:
  - Downloading: Start/end markers (fast stage)
  - Parsing: Start/end markers (Docling doesn't support page callbacks)
  - Chunking: Start/end markers (fast stage)
  - Embedding: Batches processed / total batches (precise)
- [x] Test progress updates via Supabase Realtime

### Phase 2: UX Design (P0) ✅ COMPLETE
- [x] **UX Designer**: Create mockups for progress states *(Party Mode 2025-12-02)*
- [x] **UX Designer**: Define animations/transitions *(shimmer on active stage)*
- [x] **UX Designer**: Review accessibility requirements *(ARIA labels, WCAG AA)*
- [x] **Dev**: Review and validate technical feasibility *(Amelia confirmed)*

### Phase 3: Frontend Implementation (P1) ✅ COMPLETE
- [x] Subscribe to `processing_jobs` changes in document list (`useProcessingProgress` hook)
- [x] Create `ProcessingProgress` component
- [x] Implement stage display (downloading, parsing, etc.)
- [x] Implement progress bar per stage
- [x] Implement time remaining calculation (range format)
- [x] Add to `DocumentListItem` or `DocumentStatus` component
- [x] Handle edge cases (stuck progress, errors → fallback to shimmer)

### Phase 4: Testing & Polish (P2) ✅ COMPLETE
- [x] Build passing
- [x] All 609 tests passing
- [x] Test mobile responsiveness (sm breakpoint styling)
- [x] Test accessibility (ARIA labels, aria-live)
- [ ] Manual testing with various file sizes (pending QA)
- [ ] Performance testing (Realtime subscription overhead)

---

## UX Design Decisions (Party Mode 2025-12-02)

**Participants:** Sally (UX), Amelia (Dev), Winston (Architect), John (PM), Bob (SM), Murat (Test)

### Approved Visual Design

**Pattern:** Step indicator + progress bar (honest about stages, precise where possible)

**Desktop Layout:**
```
┌──────────────────────────────────────────────────┐
│   📄 insurance-policy.pdf                        │
│                                                  │
│   ✓────●────○────○                               │
│   ↓    ↓    ↓    ↓                               │
│  Load  Read  Prep  Index                         │
│                                                  │
│   Reading document...                            │
│   ████████░░░░░░░░░░  45%                        │
│                                                  │
│   ~2-4 min remaining                             │
└──────────────────────────────────────────────────┘
```

**Mobile Layout (Condensed):**
```
┌──────────────────────┐
│ 📄 insurance-pol...  │
│ ✓─●─○─○  Reading...  │
│ ████░░░░░░░ ~2-4 min │
└──────────────────────┘
```

**Stage Name Mapping:**
| Technical | User-Friendly | Display Text |
|-----------|---------------|--------------|
| downloading | Load | "Loading file..." |
| parsing | Read | "Reading document..." |
| chunking | Prep | "Preparing content..." |
| embedding | Index | "Indexing for search..." |

### Design System Colors (Trustworthy Slate)

| Element | Color | Hex |
|---------|-------|-----|
| Completed stage | emerald-500 | #10b981 |
| Active stage | slate-600 + shimmer | #475569 |
| Pending stage | slate-300 | #cbd5e1 |
| Progress bar fill | slate-600 | #475569 |
| Time estimate text | slate-400 | #94a3b8 |

### Key Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Visual pattern | Step indicator + progress bar | Honest about stages without false precision |
| Stage names | User-friendly (Load, Read, Prep, Index) | More approachable than technical jargon |
| Placement | Inline in document list | No modal interruption, natural flow |
| Time display | Ranges ("2-4 min") not exact | Manage expectations honestly |
| Hover behavior | Nothing extra (MVP) | Ship simple, iterate later |
| Slow processing | "Taking longer than usual - hang tight!" | Reassuring, not alarming |

### Progress Data Accuracy by Stage

| Stage | Progress Source | Accuracy |
|-------|-----------------|----------|
| Downloading | bytes downloaded / total | Precise |
| Parsing | Time-based estimation | Approximate (Docling no page callback) |
| Chunking | Fast, just show complete | N/A (5-15s) |
| Embedding | batches / total batches | Precise (20 chunks/batch) |

### Technical Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data storage | `progress_data` JSONB column | Flexible, easy to extend |
| Realtime subscription | New channel, client-side filter | Simple, low volume, no schema change |
| Component | New `ProcessingProgress` component | Clean separation from status badge |
| Integration point | `document-list-item.tsx` | Replace badge when processing |

### Accessibility Requirements

- `aria-label` with full context: "Document processing: stage 2 of 4, parsing document, 45 percent complete, approximately 2 to 4 minutes remaining"
- `aria-live="polite"` on stage changes
- Minimum 44x44px touch targets
- Color contrast ≥ 4.5:1 (WCAG AA)

### New Files to Create

```
src/components/documents/processing-progress.tsx  // New component
src/hooks/use-processing-progress.ts              // Realtime subscription
```

---

## ~~Open Questions for UX Designer~~ (Resolved)

1. ~~**Visual design**: Linear progress bar? Circular? Step indicator?~~ → **Step indicator + progress bar**
2. ~~**Stage names**: Technical ("Parsing") vs user-friendly ("Reading document")?~~ → **User-friendly (Load, Read, Prep, Index)**
3. ~~**Placement**: Inline in document list? Modal? Expandable detail?~~ → **Inline**
4. ~~**Animations**: Smooth transitions between stages?~~ → **Shimmer on active stage**
5. ~~**Mobile**: How to display on small screens?~~ → **Condensed single-line layout**
6. ~~**Accessibility**: Color blindness considerations? Screen reader text?~~ → **Full ARIA labels, WCAG AA contrast**
7. ~~**Error states**: How to show "stuck" or "slow" progress?~~ → **Friendly message: "Taking longer than usual"**

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| User confusion during processing | Common | Rare |
| Browser tab closures during processing | Unknown | <5% |
| User satisfaction with processing feedback | Low | High |
| Processing stage visibility | 0% (just spinner) | 100% |

---

## Dependencies

- Supabase Realtime subscription (already in use)
- `processing_jobs` table (exists)
- Edge Function access to report progress
- UX Designer availability

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docling doesn't report page-level progress | Medium | Use time-based estimation |
| Realtime updates too frequent (performance) | Medium | Throttle updates to 1-2 per second |
| UX design delay | Low | Can implement basic version first |
| Progress inaccurate (estimation errors) | Low | Better to have estimate than nothing |

---

## Related Stories

- Story 5.8.1: Large Document Processing (timeouts, retry)
- Story 5.7: Responsive Chat Experience
- Story 4.7: Queue Management (processing_jobs table)

---

## Definition of Done

- [x] UX design mockups approved *(Party Mode 2025-12-02)*
- [x] `progress_data` column added to database *(Migration 2025-12-02)*
- [x] Edge Function reports progress for all stages *(Deployed 2025-12-02)*
- [x] Frontend subscribes to progress updates via Realtime *(useProcessingProgress hook)*
- [x] Progress UI displays current stage + progress bar *(ProcessingProgress component)*
- [x] Time remaining estimation shown *(Range format: "2-4 min")*
- [x] Mobile responsive *(Condensed inline layout)*
- [x] Accessibility validated *(ARIA labels, aria-live)*
- [ ] Manual testing with 5MB, 20MB, 50MB documents *(Pending QA)*
- [ ] Code review passed *(Pending)*
- [x] Deployed to production *(Edge Function deployed)*

---

## Notes

- This is a **UX-heavy story** - design should drive implementation
- Can be implemented incrementally:
  1. Basic stage display
  2. Progress bars
  3. Time estimation
  4. Polish/animations
- Consider analytics: Track which stages take longest (inform future optimizations)

---

## Known Issues (Post-Implementation Discovery)

**Status:** ✅ **FIXED** (2025-12-02)

**Issue ID:** BUG-5.12.1
**Discovered:** 2025-12-02 (post-deployment testing)
**Resolved:** 2025-12-02 (migration `enable_processing_jobs_realtime_v2`)

### Root Cause Analysis

The processing progress loader component and hooks are correctly implemented, but **infrastructure issues prevent data from reaching the client**:

| Issue | Component | Problem | Impact |
|-------|-----------|---------|--------|
| 1. Realtime not enabled | `processing_jobs` table | Table not added to Supabase realtime publication | Updates never broadcast |
| 2. RLS blocks client access | Database RLS policies | Service-role-only policies on `processing_jobs` | Clients can't subscribe |
| 3. Silent update failures | Edge Function | Progress updates may fail without throwing | No data reaches DB |
| 4. Empty progressMap | `useProcessingProgress` hook | Hook connects but receives no data | Component shows fallback |

### Result

- Hook reports `isConnected=true` (channel subscription succeeds)
- But no UPDATE events ever arrive
- `progressMap` stays empty
- Component falls back to `DocumentStatusBadge` ("Processing" spinner)
- **User sees old "Analyzing..." behavior, not the new progress indicator**

### Required Fixes (In Priority Order)

#### Fix 1: Enable Realtime on `processing_jobs` Table
```sql
-- Run in Supabase Dashboard → SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;
```
Or via Supabase Dashboard: Settings → Replication → Enable realtime for `processing_jobs`

#### Fix 2: Add Client-Readable RLS Policy
Current policies only allow `service_role`:
```sql
-- Current (blocks clients):
CREATE POLICY "Jobs service role only - SELECT" ON processing_jobs
  FOR SELECT USING (auth.role() = 'service_role');
```

**Option A:** Allow authenticated users to read jobs for their documents:
```sql
CREATE POLICY "Users can view their document jobs" ON processing_jobs
  FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN agency_members am ON d.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );
```

**Option B:** Create a client-accessible view with limited fields:
```sql
CREATE VIEW processing_jobs_progress AS
SELECT
  document_id,
  status,
  progress_data,
  started_at
FROM processing_jobs;
-- Enable realtime on view instead
```

#### Fix 3: Verify `progress_data` Column Exists
```sql
-- Check if column exists:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'processing_jobs' AND column_name = 'progress_data';

-- Add if missing:
ALTER TABLE processing_jobs ADD COLUMN IF NOT EXISTS progress_data JSONB;
```

### Implementation Status

| Component | Code Complete | Infrastructure Complete | Working |
|-----------|---------------|------------------------|---------|
| `ProcessingProgress` component | ✅ | N/A | ✅ |
| `useProcessingProgress` hook | ✅ | N/A | ✅ |
| Edge Function progress updates | ✅ | ✅ | ✅ |
| Realtime publication | N/A | ✅ | ✅ |
| RLS policies for clients | N/A | ✅ | ✅ |
| `progress_data` column | N/A | ✅ | ✅ |

### Fixes Applied (2025-12-02)

Migration: `enable_processing_jobs_realtime_v2`

1. ✅ **Enabled realtime** on `processing_jobs` table
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;
   ```

2. ✅ **Added RLS policy** for client access
   ```sql
   CREATE POLICY "Users can view processing jobs for their documents"
   ON processing_jobs FOR SELECT
   USING (document_id IN (
     SELECT d.id FROM documents d
     JOIN users u ON d.agency_id = u.agency_id
     WHERE u.id = auth.uid()
   ));
   ```

3. ✅ **Verified `progress_data` column** exists (JSONB, nullable)

### Additional Fixes (2025-12-02 - Session 2)

**Issue:** Document status not updating from "Processing" to "Ready" without page refresh.

**Root Cause:** Multiple issues:
1. `documents` table not added to Supabase realtime publication
2. Filtered realtime subscriptions require `REPLICA IDENTITY FULL`
3. Polling fallback only triggered when processing docs existed in state (chicken-and-egg problem)

**Fixes Applied:**

1. ✅ **Migration: `enable_documents_realtime`**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE documents;
   ```

2. ✅ **Migration: `set_documents_replica_identity_full`**
   ```sql
   ALTER TABLE documents REPLICA IDENTITY FULL;
   ```

3. ✅ **Updated `useDocumentStatus` hook** (`src/hooks/use-document-status.ts`):
   - Added initial fetch on mount to catch changes during navigation
   - Changed polling to always run (not just when processing docs exist)
   - This catches the transition TO "processing" status, not just FROM it

4. ✅ **Updated `useProcessingProgress` hook** (`src/hooks/use-processing-progress.ts`):
   - Added polling fallback (3 second interval) to catch missed realtime updates
   - Added initial data fetch on mount
   - Simulated progress for parsing stage (Docling doesn't provide intermediate callbacks)

### Additional Fixes (2025-12-02 - Session 3)

**Issue 1:** React duplicate key error "Encountered two children with the same key"

**Root Cause:** Race condition between upload completion, realtime INSERT, and polling all trying to add the same document to state.

**Fixes Applied:**

1. ✅ **Updated `useDocumentStatus` hook** (`src/hooks/use-document-status.ts:83-120`):
   - Added `seenIds` Set in `fetchDocumentStatuses` to prevent duplicates when merging
   - Documents are now deduplicated before updating state
   ```typescript
   const seenIds = new Set<string>();
   for (const latestDoc of latestDocs) {
     if (seenIds.has(latestDoc.id)) continue;
     seenIds.add(latestDoc.id);
     // ... merge logic
   }
   ```

2. ✅ **Updated documents page** (`src/app/(dashboard)/documents/page.tsx:196-203`):
   - Added duplicate check when adding uploaded document to prevent race with realtime INSERT
   ```typescript
   setDocuments((prev) => {
     if (prev.some((doc) => doc.id === result.document!.id)) {
       return prev;
     }
     return [result.document!, ...prev];
   });
   ```

**Issue 2:** Console error spam "Failed to fetch document statuses" when auth session invalid

**Root Cause:** Polling runs every 5 seconds regardless of previous failures, causing hundreds of error logs when session expires or browser loses connection.

**Fixes Applied:**

3. ✅ **Added error handling with backoff** to both hooks:

   **`useDocumentStatus` hook** (`src/hooks/use-document-status.ts`):
   - Added `consecutiveErrorsRef` to track consecutive failures
   - Added `MAX_CONSECUTIVE_ERRORS = 3` constant
   - Only log first error, suppress repeats
   - Stop polling after 3 consecutive errors
   - Reset counter on successful fetch

   **`useProcessingProgress` hook** (`src/hooks/use-processing-progress.ts`):
   - Same error handling pattern applied
   - Prevents "Failed to fetch processing progress" spam

### Playwright Testing Results (2025-12-02 - Session 3)

**Test Document:** Knox Acuity quote.pdf

| Test Case | Result |
|-----------|--------|
| Document upload | ✅ Pass |
| Progress indicator shows | ✅ Pass - Stage 2/4 "Reading document" displayed |
| Step indicators (Load→Read→Prep→Index) | ✅ Pass |
| Progress bar updates | ✅ Pass - 6% shown during parsing |
| Time estimate shown | ✅ Pass - "~2-4 min remaining" |
| Status transition Processing→Ready | ✅ Pass - Automatic, no refresh needed |
| Console errors (duplicate key) | ✅ Pass - No errors |
| Console errors (polling spam) | ✅ Pass - No spam after fix |

**Verified:** 821 tests passing, build successful.

---

## Future Enhancements (Out of Scope)

- Pausable/resumable processing
- Cancel processing mid-stage
- Detailed logs viewer ("Show what went wrong")
- Processing speed graph over time

---

## Code Review (2025-12-02)

**Reviewer:** Senior Developer
**Review Date:** 2025-12-02
**Review Outcome:** ✅ **APPROVED** (with minor observations for follow-up)

### Summary

Story 5.12 implementation is **well-executed** with clean, maintainable code that meets all acceptance criteria. The multi-session debugging effort demonstrates thorough problem-solving, and the final solution addresses both the feature requirements and infrastructure complexities.

### Acceptance Criteria Review

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-5.12.1 | Processing stages display | ✅ PASS | STAGES config with Load/Read/Prep/Index labels |
| AC-5.12.2 | Progress bar per stage | ✅ PASS | `stage_progress` shown with animated bar |
| AC-5.12.3 | Estimated time remaining | ✅ PASS | Range format ("2-4 min") per UX decision |
| AC-5.12.4 | Real-time updates | ✅ PASS | Realtime + polling fallback |
| AC-5.12.5 | Visual design (UX) | ✅ PASS | Step indicator, shimmer animation, mobile-responsive |

### Code Quality Assessment

#### Strengths

1. **Clean Component Architecture**
   - `ProcessingProgress` component has single responsibility
   - Proper separation: hook (`useProcessingProgress`) handles data, component handles display
   - Compact variant (`ProcessingProgressCompact`) for constrained spaces

2. **Robust Error Handling**
   - `MAX_CONSECUTIVE_ERRORS` constant prevents infinite polling on auth failures
   - Graceful fallback to "Analyzing..." shimmer when no progress data
   - Errors logged once, not spammed

3. **Accessibility Excellence**
   - Full ARIA labels: "Document processing: stage 2 of 4, parsing document, 45 percent complete..."
   - `aria-live="polite"` for stage changes
   - `role="progressbar"` with proper value attributes
   - Screen reader-friendly text formatting

4. **Defensive Programming**
   - `parseProgressData()` validates all fields before casting
   - Duplicate document prevention with `seenIds` Set
   - Progress simulation only increases (prevents jumps backward)

5. **Performance Considerations**
   - `hasChanges` check avoids unnecessary re-renders
   - Cleanup on unmount prevents memory leaks
   - Proper interval cleanup with `clearInterval`

#### Minor Observations (Non-Blocking)

1. **Progress Jumping Issue** (Tracked in Story 5.14)
   - Multiple data sources (realtime, polling, simulated) can cause visual inconsistency
   - Fix planned: monotonic progress constraint + priority to server data

2. **Magic Numbers**
   - `STAGE_WEIGHTS` could use inline documentation explaining the percentages
   - `simulateParsingProgress` default 120s could be configurable

3. **Type Safety**
   - `Json` type from database.types allows loose typing in `parseProgressData`
   - Consider stricter Zod schema validation (low priority)

### Testing Verification

| Test Type | Status |
|-----------|--------|
| Unit tests | ✅ 821 tests passing |
| Build | ✅ Successful |
| Playwright (manual) | ✅ All scenarios verified |
| Accessibility | ✅ ARIA labels implemented |
| Mobile responsive | ✅ Condensed layout at sm breakpoint |

### Security Review

- ✅ No sensitive data exposed in progress updates
- ✅ RLS policies properly scope data access
- ✅ No SQL injection vectors
- ✅ No XSS vulnerabilities

### Files Reviewed

| File | Lines Changed | Assessment |
|------|---------------|------------|
| `src/components/documents/processing-progress.tsx` | 296 (new) | Clean, well-documented |
| `src/hooks/use-processing-progress.ts` | 412 (new) | Robust error handling |
| `src/hooks/use-document-status.ts` | ~80 modified | Good polling fallback |
| `src/components/documents/document-list-item.tsx` | ~10 modified | Clean integration |
| `src/app/(dashboard)/documents/page.tsx` | ~20 modified | Proper hook usage |

### Follow-Up Items (Story 5.14)

The following items are tracked in Story 5.14 for polish:
1. Progress indicator jumping/inconsistency
2. Delete document not reflecting in sidebar without refresh

### Conclusion

**Story 5.12 is approved for completion.** The implementation successfully delivers the user value of visible processing progress with professional UX design. The infrastructure debugging (realtime, RLS, polling) demonstrates thorough engineering. Minor polish issues are appropriately tracked in Story 5.14.

**Recommendation:** Mark as DONE, proceed with Story 5.14 for realtime polish.
