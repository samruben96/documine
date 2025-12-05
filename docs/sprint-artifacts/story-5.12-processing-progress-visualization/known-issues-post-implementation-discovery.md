# Known Issues (Post-Implementation Discovery)

**Status:** ✅ **FIXED** (2025-12-02)

**Issue ID:** BUG-5.12.1
**Discovered:** 2025-12-02 (post-deployment testing)
**Resolved:** 2025-12-02 (migration `enable_processing_jobs_realtime_v2`)

## Root Cause Analysis

The processing progress loader component and hooks are correctly implemented, but **infrastructure issues prevent data from reaching the client**:

| Issue | Component | Problem | Impact |
|-------|-----------|---------|--------|
| 1. Realtime not enabled | `processing_jobs` table | Table not added to Supabase realtime publication | Updates never broadcast |
| 2. RLS blocks client access | Database RLS policies | Service-role-only policies on `processing_jobs` | Clients can't subscribe |
| 3. Silent update failures | Edge Function | Progress updates may fail without throwing | No data reaches DB |
| 4. Empty progressMap | `useProcessingProgress` hook | Hook connects but receives no data | Component shows fallback |

## Result

- Hook reports `isConnected=true` (channel subscription succeeds)
- But no UPDATE events ever arrive
- `progressMap` stays empty
- Component falls back to `DocumentStatusBadge` ("Processing" spinner)
- **User sees old "Analyzing..." behavior, not the new progress indicator**

## Required Fixes (In Priority Order)

### Fix 1: Enable Realtime on `processing_jobs` Table
```sql
-- Run in Supabase Dashboard → SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;
```
Or via Supabase Dashboard: Settings → Replication → Enable realtime for `processing_jobs`

### Fix 2: Add Client-Readable RLS Policy
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

### Fix 3: Verify `progress_data` Column Exists
```sql
-- Check if column exists:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'processing_jobs' AND column_name = 'progress_data';

-- Add if missing:
ALTER TABLE processing_jobs ADD COLUMN IF NOT EXISTS progress_data JSONB;
```

## Implementation Status

| Component | Code Complete | Infrastructure Complete | Working |
|-----------|---------------|------------------------|---------|
| `ProcessingProgress` component | ✅ | N/A | ✅ |
| `useProcessingProgress` hook | ✅ | N/A | ✅ |
| Edge Function progress updates | ✅ | ✅ | ✅ |
| Realtime publication | N/A | ✅ | ✅ |
| RLS policies for clients | N/A | ✅ | ✅ |
| `progress_data` column | N/A | ✅ | ✅ |

## Fixes Applied (2025-12-02)

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

## Additional Fixes (2025-12-02 - Session 2)

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

## Additional Fixes (2025-12-02 - Session 3)

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

## Playwright Testing Results (2025-12-02 - Session 3)

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
