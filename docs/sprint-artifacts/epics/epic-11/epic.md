# Epic 11: Processing Reliability & Enhanced Progress Visualization

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-11/stories/`](../sprint-artifacts/epics/epic-11/stories/)

**Status:** Drafted
**Priority:** P0 - Critical Infrastructure
**Created:** 2025-12-04

---

## Overview

Transform document processing from synchronous to asynchronous architecture to handle extended processing times (100-250+ seconds) and provide users with accurate progress visibility. This epic addresses the 504 timeout issues discovered after Story 10.12 extended the processing pipeline.

## Problem Statement

### Current State (Post-Epic 10)

Document processing pipeline timing:
- Docling parsing: 30-120 seconds
- Chunking: 5-15 seconds
- Embeddings: 10-30 seconds
- AI Tagging: 2-5 seconds
- **GPT Extraction (Story 10.12): 30-60 seconds**
- **Total: 80-250+ seconds**

### Issue

The Edge Function HTTP trigger times out at ~150 seconds, even though the function itself has a 480s execution timeout. This causes 504 Gateway Timeout errors for documents with longer processing times.

### Evidence

Supabase Edge Function logs (2025-12-04):
```
POST /process-document 504 150.175s
POST /process-document 200 121.416s
POST /process-document 200 62.159s
POST /process-document 200 64.221s
```

### Impact

- Users see 504 errors on document upload
- Documents left in "processing" state with no recovery
- No visibility into actual processing progress
- User frustration and support burden

---

## Solution Architecture

### Async Processing Pattern

```
Current (Synchronous):
  Upload → Trigger Edge Function → [150s timeout] → 504 Error

Proposed (Asynchronous):
  Upload → Create processing_job → Return immediately
           ↓
  pg_cron (every 10s) → Pick up pending jobs → Process → Update progress
           ↓
  Realtime subscription → UI receives progress updates
```

### Key Components

1. **processing_jobs table** - Queue for pending work with status tracking
2. **pg_cron scheduler** - Triggers job processor every 10 seconds
3. **Edge Function (modified)** - Processes single job per invocation
4. **Realtime subscription** - UI receives live progress updates
5. **Enhanced progress UI** - True progress bar with stage details

---

## Stories

### Story 11.1: Async Processing Architecture
**Points:** 5
**Priority:** P0

Implement asynchronous processing architecture using pg_cron for job scheduling.

**Database Schema:**
```sql
CREATE TABLE processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  status varchar(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stage varchar(30) DEFAULT 'queued',
  progress_percent integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_processing_jobs_pending ON processing_jobs(status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_processing_jobs_document ON processing_jobs(document_id);
```

**Acceptance Criteria:**
- [ ] Create processing_jobs table migration
- [ ] Modify document upload to create job record instead of triggering Edge Function
- [ ] Implement pg_cron job that runs every 10 seconds
- [ ] pg_cron picks up oldest pending job and invokes Edge Function
- [ ] Edge Function processes single job and updates progress in table
- [ ] Realtime enabled on processing_jobs table
- [ ] Upload returns immediately (< 2 seconds)
- [ ] Processing completes successfully for documents up to 300s processing time

---

### Story 11.2: Enhanced Progress Bar UI
**Points:** 3
**Priority:** P0

Create comprehensive progress visualization on the documents page.

**UI Components:**
- Large progress bar showing true percentage (0-100%)
- Stage indicator (Queued → Parsing → Chunking → Embedding → Analyzing → Complete)
- Time elapsed display
- Queue position for pending documents

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│ Document: policy-quote.pdf                                   │
│                                                             │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  45%       │
│                                                             │
│ Stage: Generating embeddings...  |  Elapsed: 1m 23s         │
│                                                             │
│ ◆ Parsing ✓  →  ◆ Chunking ✓  →  ◆ Embedding ●  →  ○ Analyzing │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Create ProcessingProgress component with animated progress bar
- [ ] Subscribe to Supabase Realtime for processing_jobs updates
- [ ] Display current stage with icon indicators
- [ ] Show elapsed time updating every second
- [ ] Display queue position for documents in 'pending' status
- [ ] Smooth progress bar transitions (CSS animation)
- [ ] Mobile responsive design
- [ ] Replace existing processing indicator with enhanced version

---

### Story 11.3: Reliable Job Recovery
**Points:** 3
**Priority:** P1

Implement automatic retry and recovery for failed processing jobs.

**Recovery Logic:**
- Jobs stuck in 'processing' for > 10 minutes → Reset to 'pending' for retry
- Max 3 retries per document
- After 3 failures → Mark as 'failed' with error message
- Dead letter queue pattern for persistent failures

**Acceptance Criteria:**
- [ ] pg_cron job to detect and reset stuck jobs (runs every 5 minutes)
- [ ] Increment retry_count on each retry attempt
- [ ] After max retries, set status='failed' with descriptive error
- [ ] Log all retries for debugging
- [ ] Admin can manually trigger retry for failed documents
- [ ] Retry button in UI for failed documents
- [ ] Clear error messages shown to users

---

### Story 11.4: Processing Queue Visualization
**Points:** 2
**Priority:** P1

Show users visibility into the processing queue when multiple documents are pending.

**UI Features:**
- Queue position indicator ("Position 3 of 5 in queue")
- Estimated wait time based on average processing times
- Collapse/expand for queue details

**Acceptance Criteria:**
- [ ] Display queue position for pending documents
- [ ] Calculate estimated wait time (avg processing time × position)
- [ ] Show total documents in agency's queue
- [ ] Queue updates in realtime as documents complete
- [ ] Prioritization logic documented (FIFO by default)

---

### Story 11.5: Error Handling & User Feedback
**Points:** 2
**Priority:** P1

Improve error handling and user feedback for processing failures.

**Error Categories:**
1. **Transient** (retry automatically): Network timeouts, API rate limits
2. **Recoverable** (user action): Corrupted PDF, wrong file type
3. **Permanent** (need support): Unknown errors, repeated failures

**Acceptance Criteria:**
- [ ] Categorize errors into transient/recoverable/permanent
- [ ] Transient errors: Automatic retry with exponential backoff
- [ ] Recoverable errors: Clear user message with suggested action
- [ ] Permanent errors: "Contact support" with error ID for debugging
- [ ] Error notifications appear in UI when documents fail
- [ ] Processing summary shows success/failure counts
- [ ] Failed documents show error icon with tooltip

---

### Story 11.6: Phased Document Processing - Fast Chat Path
**Points:** 5
**Priority:** P0

Split document processing into two phases to enable faster chat availability.

**Architecture:**
```
Phase 1 (Fast Path): Parse → Chunk → Embed → Status: 'ready' (chat works)
Phase 2 (Background): Structured Extraction → Status: 'complete' (comparison works)
```

**Acceptance Criteria:**
- [ ] Phase 1 completes in <30s for 30-page document
- [ ] Document status shows 'ready' after Phase 1
- [ ] Phase 2 triggers automatically after Phase 1 completes
- [ ] New `extract-quote-data` edge function handles extraction only
- [ ] Uses existing raw_text - no re-parsing needed
- [ ] Add `extraction_status` column (pending/extracting/complete/failed/skipped)
- [ ] Extraction failures don't affect document's 'ready' status

---

### Story 11.7: Comparison Page - Extraction Status Handling
**Points:** 3
**Priority:** P0

Handle partial document readiness on the comparison page.

**Acceptance Criteria:**
- [ ] Compare page checks extraction_status for selected documents
- [ ] Shows "Analyzing Quote Details" banner when extraction in progress
- [ ] Suggests "Chat while waiting" as alternative
- [ ] Auto-refreshes via Realtime when extraction completes
- [ ] Handles mixed states (some docs ready, some extracting)
- [ ] Shows retry option if extraction failed

---

### Story 11.8: Document List - Extraction Status Indicators
**Points:** 2
**Priority:** P1

Show extraction readiness status on document cards and table.

**Acceptance Criteria:**
- [ ] Document cards show extraction status badge
- [ ] States: "Analyzing...", "Fully Analyzed", "Analysis Failed"
- [ ] Badge updates in realtime as extraction completes
- [ ] Tooltip explains what each status means
- [ ] Document table includes sortable "Analysis" column
- [ ] Failed state includes retry action

---

## Technical Approach

### pg_cron Setup

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create job processor function
CREATE OR REPLACE FUNCTION process_next_document_job()
RETURNS void AS $$
DECLARE
  next_job processing_jobs%ROWTYPE;
BEGIN
  -- Pick up next pending job (FOR UPDATE SKIP LOCKED prevents race conditions)
  SELECT * INTO next_job
  FROM processing_jobs
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF next_job.id IS NOT NULL THEN
    -- Mark as processing
    UPDATE processing_jobs
    SET status = 'processing', started_at = now(), updated_at = now()
    WHERE id = next_job.id;

    -- Invoke Edge Function (async via pg_net or http extension)
    PERFORM net.http_post(
      url := 'https://nxuzurxiaismssiiydst.supabase.co/functions/v1/process-document',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
      body := jsonb_build_object('job_id', next_job.id, 'document_id', next_job.document_id)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule every 10 seconds
SELECT cron.schedule('process-documents', '*/10 * * * *', 'SELECT process_next_document_job()');
```

### Realtime Setup

```sql
-- Enable Realtime on processing_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;

-- RLS for agency isolation
CREATE POLICY "Users can view own agency processing jobs"
ON processing_jobs FOR SELECT TO authenticated
USING (agency_id = (SELECT get_user_agency_id()));
```

### Progress Update Pattern

```typescript
// In Edge Function
async function updateJobProgress(jobId: string, stage: string, percent: number) {
  await supabase.from('processing_jobs').update({
    stage,
    progress_percent: percent,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);
}

// Usage in processing pipeline
await updateJobProgress(jobId, 'parsing', 10);
// ... parsing logic ...
await updateJobProgress(jobId, 'parsing', 40);
// ... more parsing ...
await updateJobProgress(jobId, 'chunking', 60);
```

### React Hook for Progress

```typescript
// src/hooks/use-processing-job.ts
export function useProcessingJob(documentId: string) {
  const supabase = createClient();
  const [job, setJob] = useState<ProcessingJob | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase.from('processing_jobs')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setJob(data));

    // Realtime subscription
    const channel = supabase
      .channel(`job:${documentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'processing_jobs',
        filter: `document_id=eq.${documentId}`,
      }, (payload) => {
        setJob(payload.new as ProcessingJob);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [documentId]);

  return job;
}
```

---

## Dependencies

- **pg_cron extension** - Available on Supabase Pro/Enterprise plans
- **pg_net extension** - For async HTTP calls from PostgreSQL
- **Supabase Realtime** - Already enabled in project

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| 504 Errors | Occurring | 0 |
| Upload Response Time | 100-250s | < 2s |
| Processing Success Rate | ~85% | > 99% |
| User Visibility | None | Full progress |
| Max Processing Time | 150s (timeout) | 300s+ |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| pg_cron not available | Check Supabase plan; alternative: client-side polling |
| Race conditions in job pickup | FOR UPDATE SKIP LOCKED in SQL |
| Edge Function still times out | Chunk processing into stages with checkpoints |
| Queue backlog grows | Monitor queue depth; alert on > 10 pending |

---

## References

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Epic 10 Retrospective](../sprint-artifacts/retrospectives/epic-10-retrospective.md) - Root cause analysis
