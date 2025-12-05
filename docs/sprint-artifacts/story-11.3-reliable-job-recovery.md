# Story 11.3: Reliable Job Recovery

Status: todo

## Story

As a user who uploaded a document that failed to process,
I want the system to automatically retry processing or let me manually retry,
so that temporary failures don't require me to re-upload the document.

## Acceptance Criteria

### AC-11.3.1: Stuck Job Detection
- [ ] pg_cron job runs every 5 minutes to detect stuck jobs
- [ ] Jobs in 'processing' status for > 10 minutes are considered stuck
- [ ] Stuck jobs reset to 'pending' for automatic retry
- [ ] retry_count incremented on each retry

### AC-11.3.2: Retry Limits
- [ ] Maximum 3 retry attempts per document
- [ ] After 3 failures, job marked as 'failed' permanently
- [ ] error_message set to describe the failure
- [ ] Log all retry attempts for debugging

### AC-11.3.3: Manual Retry
- [ ] "Retry" button shown for failed documents in UI
- [ ] Clicking retry creates new processing_job with retry_count from previous
- [ ] Admin can retry any failed document in their agency
- [ ] Retry resets document status to 'processing'

### AC-11.3.4: Error Classification
- [ ] Classify errors as transient, recoverable, or permanent
- [ ] Transient errors: Auto-retry with exponential backoff
- [ ] Recoverable errors: Clear message with suggested action
- [ ] Permanent errors: "Contact support" with error ID

### AC-11.3.5: Logging & Monitoring
- [ ] Log all retry attempts with reason
- [ ] Log job pickup and completion times
- [ ] Error logs include document ID and job ID for debugging

## Tasks / Subtasks

- [ ] Task 1: Stuck Job Detector (AC: 11.3.1)
  - [ ] Create pg_cron job running every 5 minutes
  - [ ] Query for jobs stuck in 'processing' > 10 minutes
  - [ ] Reset status to 'pending', increment retry_count

- [ ] Task 2: Retry Limits (AC: 11.3.2)
  - [ ] Check retry_count before resetting job
  - [ ] If retry_count >= 3, mark as 'failed'
  - [ ] Set descriptive error_message

- [ ] Task 3: Manual Retry API (AC: 11.3.3)
  - [ ] Create `/api/documents/[id]/retry` endpoint
  - [ ] Validate user permissions
  - [ ] Create new processing_job or reset existing

- [ ] Task 4: Retry Button UI (AC: 11.3.3)
  - [ ] Add retry button to failed document display
  - [ ] Show loading state during retry
  - [ ] Update UI when job restarts

- [ ] Task 5: Error Classification (AC: 11.3.4)
  - [ ] Define error categories and patterns
  - [ ] Implement classification logic in Edge Function
  - [ ] Store error category in processing_job

- [ ] Task 6: Logging (AC: 11.3.5)
  - [ ] Add structured logging for all job state changes
  - [ ] Include document_id, job_id, agency_id
  - [ ] Log retry reasons and counts

## Dev Notes

### Stuck Job Detector

```sql
CREATE OR REPLACE FUNCTION reset_stuck_processing_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Reset jobs stuck in 'processing' for > 10 minutes
  UPDATE processing_jobs
  SET
    status = CASE
      WHEN retry_count >= 3 THEN 'failed'
      ELSE 'pending'
    END,
    error_message = CASE
      WHEN retry_count >= 3 THEN 'Processing failed after 3 attempts. Please contact support.'
      ELSE NULL
    END,
    retry_count = retry_count + 1,
    updated_at = now()
  WHERE status = 'processing'
    AND started_at < now() - interval '10 minutes';

  -- Log the reset (will appear in Supabase logs)
  RAISE NOTICE 'Reset stuck processing jobs at %', now();
END;
$$;

-- Schedule every 5 minutes
SELECT cron.schedule(
  'reset-stuck-jobs',
  '*/5 * * * *',
  'SELECT reset_stuck_processing_jobs()'
);
```

### Error Categories

```typescript
// src/lib/documents/error-classification.ts

export type ErrorCategory = 'transient' | 'recoverable' | 'permanent';

interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
}

const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: ErrorCategory;
  userMessage: string;
}> = [
  // Transient - auto-retry
  { pattern: /timeout/i, category: 'transient', userMessage: 'Request timed out. Retrying...' },
  { pattern: /ECONNRESET/i, category: 'transient', userMessage: 'Connection interrupted. Retrying...' },
  { pattern: /429|rate limit/i, category: 'transient', userMessage: 'Service busy. Retrying shortly...' },
  { pattern: /503|service unavailable/i, category: 'transient', userMessage: 'Service temporarily unavailable. Retrying...' },

  // Recoverable - user action needed
  { pattern: /page-dimensions|MediaBox/i, category: 'recoverable', userMessage: 'This PDF has an unusual format. Try re-saving it with Adobe Acrobat.' },
  { pattern: /unsupported.*format/i, category: 'recoverable', userMessage: 'File format not supported. Please upload PDF, DOCX, or image files.' },
  { pattern: /password.*protected/i, category: 'recoverable', userMessage: 'This PDF is password protected. Please upload an unlocked version.' },
  { pattern: /file.*corrupt/i, category: 'recoverable', userMessage: 'File appears to be corrupted. Please try uploading again.' },

  // Permanent - needs support
  { pattern: /.*/, category: 'permanent', userMessage: 'An unexpected error occurred. Please contact support.' },
];

export function classifyError(error: Error | string): ClassifiedError {
  const message = error instanceof Error ? error.message : error;

  for (const { pattern, category, userMessage } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        category,
        message,
        userMessage,
        shouldRetry: category === 'transient',
      };
    }
  }

  return {
    category: 'permanent',
    message,
    userMessage: 'An unexpected error occurred. Please contact support.',
    shouldRetry: false,
  };
}
```

### Manual Retry API

```typescript
// src/app/api/documents/[id]/retry/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Get user and verify permissions
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get document and verify agency
  const { data: document } = await supabase
    .from('documents')
    .select('id, agency_id, status')
    .eq('id', params.id)
    .single();

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Get latest job for this document
  const { data: existingJob } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('document_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Create new job or reset existing
  if (existingJob && existingJob.status === 'failed') {
    // Reset the failed job
    const { error } = await supabase
      .from('processing_jobs')
      .update({
        status: 'pending',
        stage: 'queued',
        progress_percent: 0,
        error_message: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingJob.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to retry' }, { status: 500 });
    }
  } else {
    // Create new job
    const { error } = await supabase.from('processing_jobs').insert({
      document_id: params.id,
      agency_id: document.agency_id,
      status: 'pending',
      stage: 'queued',
      retry_count: existingJob?.retry_count ?? 0,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }
  }

  // Update document status
  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', params.id);

  return NextResponse.json({ success: true });
}
```

### Retry Button Component

```typescript
// In document list or detail view
function RetryButton({ documentId, onRetry }: { documentId: string; onRetry: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error('Retry failed');
      onRetry();
    } catch (error) {
      toast.error('Failed to retry processing');
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRetry}
      disabled={isRetrying}
    >
      {isRetrying ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <RotateCcw className="h-4 w-4 mr-2" />
      )}
      Retry
    </Button>
  );
}
```

### Test IDs

- `data-testid="retry-button"` - Manual retry button
- `data-testid="error-message"` - Error message display
- `data-testid="retry-count"` - Retry attempt count

---

_Drafted: 2025-12-04_
_Epic: Epic 11 - Processing Reliability & Enhanced Progress Visualization_
