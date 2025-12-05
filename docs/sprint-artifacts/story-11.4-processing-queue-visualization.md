# Story 11.4: Processing Queue Visualization

Status: todo

## Story

As a user with multiple documents uploading,
I want to see my position in the processing queue,
so that I know how long I need to wait before my documents are processed.

## Acceptance Criteria

### AC-11.4.1: Queue Position Display
- [ ] Show "Position X of Y in queue" for pending documents
- [ ] Position updates in realtime as other documents complete
- [ ] Only show queue position for 'pending' status

### AC-11.4.2: Estimated Wait Time
- [ ] Calculate estimated wait time based on average processing time
- [ ] Display "~X minutes" estimate
- [ ] Update estimate as queue position changes

### AC-11.4.3: Queue Summary
- [ ] Show total documents in user's/agency's queue
- [ ] Processing/pending/completed counts
- [ ] Collapse/expand for queue details on documents page

### AC-11.4.4: Realtime Updates
- [ ] Queue position updates via Supabase Realtime
- [ ] Updates reflect within 1 second of job status changes
- [ ] Handle connection drops gracefully

## Tasks / Subtasks

- [ ] Task 1: Queue Position Hook (AC: 11.4.1, 11.4.4)
  - [ ] Create `useQueuePosition` hook
  - [ ] Query for count of pending jobs before current job
  - [ ] Subscribe to realtime updates for queue changes

- [ ] Task 2: Wait Time Estimation (AC: 11.4.2)
  - [ ] Track average processing time in database
  - [ ] Calculate estimate: position × avg_time
  - [ ] Format as "~X minutes" or "< 1 minute"

- [ ] Task 3: Queue Summary Component (AC: 11.4.3)
  - [ ] Create `ProcessingQueueSummary` component
  - [ ] Query for all processing_jobs in agency
  - [ ] Group by status (pending, processing, completed, failed)

- [ ] Task 4: Integration (AC: 11.4.1)
  - [ ] Add queue position to `ProcessingProgressBar` component
  - [ ] Add queue summary to documents page header
  - [ ] Style queue info consistently

## Dev Notes

### Queue Position Hook

```typescript
// src/hooks/use-queue-position.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface QueueInfo {
  position: number;
  totalPending: number;
  estimatedWaitMinutes: number;
}

export function useQueuePosition(jobId: string): QueueInfo | null {
  const supabase = createClient();
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);

  useEffect(() => {
    async function fetchPosition() {
      // Get this job's created_at
      const { data: job } = await supabase
        .from('processing_jobs')
        .select('created_at, status')
        .eq('id', jobId)
        .single();

      if (!job || job.status !== 'pending') {
        setQueueInfo(null);
        return;
      }

      // Count pending jobs created before this one
      const { count: position } = await supabase
        .from('processing_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', job.created_at);

      // Total pending in queue
      const { count: totalPending } = await supabase
        .from('processing_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Estimate: assume 2 minutes average per document
      const AVG_PROCESSING_MINUTES = 2;
      const estimatedWait = ((position ?? 0) + 1) * AVG_PROCESSING_MINUTES;

      setQueueInfo({
        position: (position ?? 0) + 1,
        totalPending: totalPending ?? 0,
        estimatedWaitMinutes: estimatedWait,
      });
    }

    fetchPosition();

    // Subscribe to queue changes
    const channel = supabase
      .channel('queue-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
      }, () => {
        // Refetch on any queue change
        fetchPosition();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase]);

  return queueInfo;
}
```

### Queue Summary Component

```typescript
// src/components/documents/processing-queue-summary.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface QueueSummary {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function ProcessingQueueSummary() {
  const supabase = createClient();
  const [summary, setSummary] = useState<QueueSummary | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      const { data } = await supabase
        .from('processing_jobs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (data) {
        const counts = data.reduce(
          (acc, job) => {
            acc[job.status as keyof QueueSummary]++;
            return acc;
          },
          { pending: 0, processing: 0, completed: 0, failed: 0 }
        );
        setSummary(counts);
      }
    }

    fetchSummary();

    const channel = supabase
      .channel('queue-summary')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
      }, () => fetchSummary())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (!summary) return null;

  const total = summary.pending + summary.processing;
  if (total === 0 && summary.failed === 0) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
      <span className="font-medium">Processing Queue:</span>

      {summary.pending > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {summary.pending} waiting
        </span>
      )}

      {summary.processing > 0 && (
        <span className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          {summary.processing} processing
        </span>
      )}

      {summary.completed > 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          {summary.completed} completed (24h)
        </span>
      )}

      {summary.failed > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          {summary.failed} failed
        </span>
      )}
    </div>
  );
}
```

### Queue Position Display

```typescript
// In ProcessingProgressBar component
function QueuePositionDisplay({ queueInfo }: { queueInfo: QueueInfo | null }) {
  if (!queueInfo) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Clock className="h-4 w-4" />
      <span>
        Position {queueInfo.position} of {queueInfo.totalPending} in queue
      </span>
      <span className="text-slate-400">·</span>
      <span>
        Est. wait: ~{queueInfo.estimatedWaitMinutes} min
      </span>
    </div>
  );
}
```

### Estimated Wait Time Calculation

```typescript
// Average processing time tracking (future enhancement)
// For now, use fixed estimate

const DEFAULT_AVG_PROCESSING_SECONDS = 120; // 2 minutes

export function calculateEstimatedWait(position: number): string {
  const totalSeconds = position * DEFAULT_AVG_PROCESSING_SECONDS;

  if (totalSeconds < 60) {
    return '< 1 minute';
  }

  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes === 1) {
    return '~1 minute';
  }

  return `~${minutes} minutes`;
}

// Future: Track actual processing times
// CREATE TABLE processing_metrics (
//   id uuid PRIMARY KEY,
//   processing_time_seconds integer,
//   created_at timestamptz DEFAULT now()
// );
//
// SELECT AVG(processing_time_seconds) FROM processing_metrics
// WHERE created_at > now() - interval '24 hours';
```

### Test IDs

- `data-testid="queue-position"` - Queue position display
- `data-testid="estimated-wait"` - Estimated wait time
- `data-testid="queue-summary"` - Queue summary component
- `data-testid="queue-pending-count"` - Pending count
- `data-testid="queue-processing-count"` - Processing count

---

_Drafted: 2025-12-04_
_Epic: Epic 11 - Processing Reliability & Enhanced Progress Visualization_
