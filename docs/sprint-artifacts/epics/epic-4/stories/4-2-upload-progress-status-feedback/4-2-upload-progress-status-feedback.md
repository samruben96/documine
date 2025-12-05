# Story 4.2: Upload Progress & Status Feedback

Status: done

## Story

As a **user**,
I want clear feedback during document upload and processing,
So that I know the status of my documents.

## Acceptance Criteria

### AC-4.2.1: Upload Progress Bar
- Upload progress bar shows 0-100% during file upload to storage
- Progress updates in real-time as bytes are uploaded
- Uses Supabase Storage `onUploadProgress` callback
- Progress bar visually matches Trustworthy Slate theme

### AC-4.2.2: Filename Display
- Filename is displayed alongside progress bar
- Long filenames are truncated with ellipsis (max ~30 chars)
- Full filename visible on hover via tooltip

### AC-4.2.3: Cancel Option
- "Cancel" option available during upload (removes from queue)
- Clicking cancel aborts the upload immediately
- Cancelled files are removed from the upload queue
- No partial files left in storage

### AC-4.2.4: Processing Status Animation
- Status changes to "Analyzing..." with shimmer animation when upload completes
- Shimmer animation per UX spec (skeleton/shimmer, no spinners > 200ms)
- Clear visual distinction between uploading and processing states

### AC-4.2.5: Ready Status Display
- Status shows "Ready" with checkmark icon when processing completes
- Green checkmark indicator for success state
- Document immediately available for Q&A

### AC-4.2.6: Success Toast
- Success toast appears: "{filename} is ready"
- Uses sonner toast library
- Auto-dismisses after 4 seconds

### AC-4.2.7: Failed Status Handling
- Failed status shows error icon with red indicator
- "Retry" option attempts reprocessing
- "Delete" option removes failed document
- Tooltip/click shows error message details

### AC-4.2.8: Status Persistence Across Navigation
- Processing status persists across page navigation
- Uses Supabase Realtime subscriptions to listen for document status changes
- Returning to documents page shows current status immediately
- Notifications appear when processing completes (even if on different page)

## Tasks / Subtasks

- [x] **Task 1: Enhance UploadZone with progress tracking** (AC: 4.2.1, 4.2.2)
  - [x] Add `onUploadProgress` callback to Supabase Storage upload (via XMLHttpRequest for real progress)
  - [x] Create progress state management for each uploading file
  - [x] Display progress bar with percentage (0-100%)
  - [x] Show filename alongside progress bar with truncation
  - [x] Add tooltip for full filename on hover

- [x] **Task 2: Implement upload cancellation** (AC: 4.2.3)
  - [x] Add AbortController to upload requests
  - [x] Create cancel button/icon for each uploading file
  - [x] Handle cleanup on cancellation (remove from queue)
  - [x] Ensure no partial files left in storage on cancel

- [x] **Task 3: Create processing status component** (AC: 4.2.4, 4.2.5, 4.2.7)
  - [x] Create `src/components/documents/document-status.tsx`
  - [x] Implement shimmer animation for "Analyzing..." state
  - [x] Add checkmark icon for "Ready" state
  - [x] Add error icon with "Retry" and "Delete" actions for "Failed" state
  - [x] Show error message details on hover/click

- [x] **Task 4: Implement Supabase Realtime subscription** (AC: 4.2.8)
  - [x] Create realtime hook `src/hooks/use-document-status.ts`
  - [x] Subscribe to `documents` table changes filtered by agency_id
  - [x] Handle INSERT, UPDATE events for status changes
  - [x] Update local state when document status changes

- [x] **Task 5: Add success toast notifications** (AC: 4.2.6)
  - [x] Trigger toast when document status changes to "ready"
  - [x] Format message: "{filename} is ready"
  - [x] Ensure toast appears even if user navigated away from documents page

- [x] **Task 6: Integrate status updates into document list** (AC: All)
  - [x] Update `src/app/(dashboard)/documents/page.tsx` to use realtime hook
  - [x] Display appropriate status indicator for each document
  - [x] Handle retry action for failed documents
  - [x] Handle delete action for failed documents

- [x] **Task 7: Testing and verification** (AC: All)
  - [x] Test upload progress bar updates correctly
  - [x] Test cancel aborts upload and cleans up
  - [x] Test shimmer animation during processing
  - [x] Test Ready checkmark appears on completion
  - [x] Test success toast appears
  - [x] Test failed status with retry/delete options
  - [x] Test status persists across navigation
  - [x] Run build to check for type errors
  - [x] Verify existing tests still pass (379 tests pass)

## Dev Notes

### Technical Approach

**Progress Tracking with Supabase Storage:**
```typescript
// In upload.ts - add progress callback
const { data, error } = await supabase.storage
  .from('documents')
  .upload(storagePath, file, {
    onUploadProgress: (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      onProgress?.(percent);
    },
  });
```

**Realtime Subscription Pattern:**
```typescript
// In hooks/use-document-status.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/documents';

export function useDocumentStatus(agencyId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('document-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? { ...doc, ...payload.new } : doc
              )
            );

            // Trigger toast if status changed to 'ready'
            if (payload.new.status === 'ready' && payload.old.status !== 'ready') {
              toast.success(`${payload.new.filename} is ready`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId]);

  return documents;
}
```

**Upload Cancellation with AbortController:**
```typescript
// Track active uploads
const uploadControllers = useRef<Map<string, AbortController>>(new Map());

const handleUpload = async (file: File, documentId: string) => {
  const controller = new AbortController();
  uploadControllers.current.set(documentId, controller);

  try {
    await uploadToStorage(file, documentId, {
      signal: controller.signal,
      onProgress: (percent) => updateProgress(documentId, percent),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      // Upload was cancelled, clean up
      await deleteFromStorage(documentId);
    }
  } finally {
    uploadControllers.current.delete(documentId);
  }
};

const handleCancel = (documentId: string) => {
  const controller = uploadControllers.current.get(documentId);
  controller?.abort();
};
```

**Document Status Component:**
```typescript
// src/components/documents/document-status.tsx
interface DocumentStatusProps {
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  progress?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onDelete?: () => void;
}

export function DocumentStatus({ status, progress, errorMessage, onRetry, onDelete }: DocumentStatusProps) {
  switch (status) {
    case 'uploading':
      return <ProgressBar value={progress} />;
    case 'processing':
      return <div className="shimmer">Analyzing...</div>;
    case 'ready':
      return <CheckIcon className="text-green-500" />;
    case 'failed':
      return (
        <div className="flex items-center gap-2">
          <XCircleIcon className="text-red-500" title={errorMessage} />
          <button onClick={onRetry}>Retry</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      );
  }
}
```

### Shimmer Animation CSS

Per UX spec (no spinners > 200ms, use skeleton/shimmer):
```css
.shimmer {
  background: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 50%,
    #f1f5f9 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Dependencies

**Already Installed (from Story 4.1):**
- `react-dropzone` ^14.3.8 - Drag-drop handling
- `@supabase/supabase-js` ^2.84.0 - Storage, Database, Realtime
- `sonner` ^2.0.7 - Toast notifications
- `lucide-react` ^0.554.0 - Icons (CheckIcon, XCircleIcon, etc.)

**No new dependencies required**

### Files to Create/Modify

**Create:**
- `src/components/documents/document-status.tsx` - Status indicator component
- `src/hooks/use-document-status.ts` - Realtime subscription hook
- `__tests__/components/documents/document-status.test.tsx` - Component tests
- `__tests__/hooks/use-document-status.test.ts` - Hook tests

**Modify:**
- `src/components/documents/upload-zone.tsx` - Add progress tracking and cancellation
- `src/lib/documents/upload.ts` - Add onProgress callback and AbortController support
- `src/app/(dashboard)/documents/page.tsx` - Integrate realtime hook and status components
- `src/app/(dashboard)/documents/actions.ts` - Add retryProcessing action

### Project Structure Notes

- Component path follows existing pattern: `src/components/documents/`
- Hook path follows existing pattern: `src/hooks/`
- Realtime subscription uses Supabase client from `@/lib/supabase/client`

### Learnings from Previous Story

**From Story 4-1-document-upload-zone (Status: done)**

- **UploadZone Component**: Already has basic structure at `src/components/documents/upload-zone.tsx` - extend with progress tracking
- **Upload Service**: `src/lib/documents/upload.ts` has `uploadDocument()` function - add onProgress callback
- **Document Service**: `src/lib/documents/service.ts` has CRUD operations - reuse for retry/delete
- **Validation Schemas**: `src/lib/validations/documents.ts` with Zod patterns
- **Server Actions**: `src/app/(dashboard)/documents/actions.ts` - add retryProcessing action
- **Testing Baseline**: 345 tests passing - maintain this baseline
- **Filename Sanitization**: `sanitizeFilename()` helper available in upload.ts

[Source: stories/4-1-document-upload-zone.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-4.md#Story-4.2]
- [Source: docs/epics.md#Story-4.2]
- [Source: docs/architecture.md#Supabase-Realtime]
- [Source: docs/ux-design-specification.md#Skeleton-Loading]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-2-upload-progress-status-feedback.context.xml`

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Supabase SDK doesn't have `onUploadProgress` in FileOptions for standard uploads
- Implemented XMLHttpRequest-based upload with native progress events instead
- This provides real-time progress tracking without requiring TUS protocol

### Completion Notes List

1. **Progress Tracking**: Used XMLHttpRequest directly with Supabase Storage REST API for real-time progress (0-100%). The standard Supabase SDK upload method doesn't expose progress callbacks.

2. **Shimmer Animation**: Implemented custom CSS animation per UX spec (no spinners > 200ms). Animation uses `translateX` transform for smooth performance.

3. **Realtime Subscription**: Created `useDocumentStatus` hook that subscribes to postgres_changes on documents table filtered by agency_id. Handles INSERT, UPDATE, DELETE events.

4. **Toast Notifications**: Success toast triggers automatically via realtime subscription when document status transitions to 'ready'. Uses sonner with 4-second auto-dismiss.

5. **Testing**: Added 34 new tests (22 for DocumentStatus component, 12 for useDocumentStatus hook). Total test count: 379 passing.

### File List

**Created:**
- `src/components/documents/document-status.tsx` - Status indicator component with shimmer animation
- `src/hooks/use-document-status.ts` - Realtime subscription hook for document status changes
- `__tests__/components/documents/document-status.test.tsx` - 22 tests for status component
- `__tests__/hooks/use-document-status.test.ts` - 12 tests for realtime hook

**Modified:**
- `src/components/documents/upload-zone.tsx` - Added filename truncation with tooltip
- `src/lib/documents/upload.ts` - Added UploadOptions interface, XMLHttpRequest progress tracking, AbortSignal support
- `src/app/(dashboard)/documents/page.tsx` - Integrated realtime hook, DocumentStatus component, retry/delete handlers
- `src/app/(dashboard)/documents/actions.ts` - Added getUserAgencyInfo, createDocumentFromUpload, retryDocumentProcessing actions
- `src/app/globals.css` - Added shimmer animation keyframes

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | Bob (Scrum Master) | Initial story draft via create-story workflow |
| 2025-11-29 | Bob (Scrum Master) | Story context generated, status changed to ready-for-dev |
| 2025-11-29 | Amelia (Dev Agent) | Implemented all tasks, 379 tests passing, status changed to review |
| 2025-11-29 | Amelia (Dev Agent) | Code review passed, pushed to main, status changed to done |

### Completion Notes
**Completed:** 2025-11-29
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing (379/379), pushed to origin/main
