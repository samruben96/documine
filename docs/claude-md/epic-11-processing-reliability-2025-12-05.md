# Epic 11: Processing Reliability & Enhanced Progress (2025-12-05)

## Async Processing Architecture (Story 11.1)

### Job Queue Pattern

```typescript
// Upload creates job, returns immediately
const { error: jobError } = await supabase
  .from('processing_jobs')
  .insert({
    document_id: doc.id,
    agency_id: agencyId,
    status: 'pending',
    stage: 'queued',
    progress_percent: 0,
  });

// pg_cron picks up jobs every minute via pg_net HTTP call
```

### Processing Jobs Table

```sql
processing_jobs (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id),
  agency_id uuid REFERENCES agencies(id),
  status varchar(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stage varchar(30) DEFAULT 'queued',
  progress_percent integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz
)
```

### Progress Update Pattern

```typescript
// In Edge Function
async function updateProgress(jobId: string, stage: string, percent: number) {
  await supabase.from('processing_jobs').update({
    stage,
    progress_percent: percent,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);
}

// Stages: 'queued' | 'parsing' | 'chunking' | 'embedding' | 'analyzing' | 'extracting' | 'complete'
```

## Enhanced Progress UI (Story 11.2)

### useProcessingProgress Hook

```typescript
import { useProcessingProgress } from '@/hooks/use-processing-progress';

const { status, stage, progressPercent, queuePosition, elapsedTime } = useProcessingProgress(documentId);

// Returns:
// - status: 'pending' | 'processing' | 'completed' | 'failed'
// - stage: Current processing stage
// - progressPercent: 0-100
// - queuePosition: Position in queue (if pending)
// - elapsedTime: Seconds since started
```

### Processing Progress Component

```typescript
<ProcessingProgress
  documentId={doc.id}
  onComplete={() => refetch()}
/>

// Required data-testid attributes:
// - progress-bar
// - stage-indicator
// - elapsed-time
// - queue-position (when pending)
```

## Job Recovery (Story 11.3)

### Retry Logic

- Jobs stuck in 'processing' for > 10 minutes → Reset to 'pending'
- Max 3 retries per document
- After 3 failures → Mark as 'failed' with error message

### Retry Button

```typescript
const handleRetry = async (jobId: string) => {
  await supabase.from('processing_jobs').update({
    status: 'pending',
    retry_count: 0,
    error_message: null,
  }).eq('id', jobId);
};
```

## Queue Visualization (Story 11.4)

### Queue Position RPC

```sql
CREATE FUNCTION get_queue_position(doc_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM processing_jobs
  WHERE status = 'pending'
    AND created_at < (SELECT created_at FROM processing_jobs WHERE document_id = doc_id)
$$ LANGUAGE sql STABLE;
```

### ProcessingQueueSummary Component

```typescript
<ProcessingQueueSummary
  agencyId={agencyId}
  onFilterFailed={() => setFilter('failed')}
/>

// Shows: "3 documents processing, 2 queued, 1 failed"
```

## Error Classification (Story 11.5)

### Error Categories

```typescript
type ErrorCategory = 'transient' | 'recoverable' | 'permanent';

// Transient: Network timeouts, API rate limits → Auto-retry
// Recoverable: Corrupted PDF, wrong file type → User action needed
// Permanent: Unknown errors, repeated failures → Contact support
```

### User-Friendly Messages

```typescript
function getErrorMessage(error: string, category: ErrorCategory): string {
  if (category === 'transient') return 'Temporary issue, retrying...';
  if (category === 'recoverable') return 'This file may be corrupted. Try uploading again.';
  return 'Processing failed. Contact support with error ID: ' + errorId;
}
```

## pg_cron Setup

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule job processor (every minute minimum)
SELECT cron.schedule(
  'process-documents',
  '* * * * *',
  'SELECT process_next_document_job()'
);
```

## Known Limitations

- **pg_cron minimum interval:** 1 minute (not 10 seconds as originally designed)
- **Docling bottleneck:** Complex PDFs can still take 150+ seconds in Docling parsing
- **Solution:** Epic 12 replaces Docling with Google Cloud Document AI
