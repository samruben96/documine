# Story 11.8: Document List - Extraction Status Indicators

Status: done

## Story

As a user viewing my documents,
I want to see which documents are fully processed vs. still extracting,
so that I know what's ready for comparison before navigating there.

## Background

With phased processing (Story 11.6), documents reach "ready" status (chat works) before extraction completes (comparison works). Users need visibility into this distinction in the document library.

**Current State:** Document cards show processing status (pending/processing/ready/failed) but don't distinguish between "ready for chat" and "ready for comparison."

**Solution:** Add extraction status indicators to document cards/table showing:
- "Ready" (extraction complete or skipped)
- "Analyzing..." (extraction in progress)
- "Extraction failed" (with retry option)

## Acceptance Criteria

### AC-11.8.1: Extraction Status Badge
- [x] Document cards show extraction status badge
- [x] Badge appears below or alongside existing status
- [x] Visual distinction between chat-ready and comparison-ready

### AC-11.8.2: Status States Display
- [x] "Ready for chat" - checkmark icon, document status is 'ready'
- [x] "Analyzing for comparison" - spinner icon, extraction in progress
- [x] "Ready for comparison" - double checkmark, extraction complete
- [x] "Extraction failed" - warning icon with retry option

### AC-11.8.3: Realtime Updates
- [x] Badge updates in realtime as extraction completes
- [x] No page refresh needed
- [x] Smooth transition animation

### AC-11.8.4: Tooltip Explanations
- [x] Hover/tap on badge shows tooltip explaining state
- [x] "This document is ready for chat. Quote analysis is still processing."
- [x] "This document is fully analyzed and ready for comparison."
- [x] "Quote extraction failed. Click to retry."

### AC-11.8.5: Table View Support
- [x] Document table (F2.6) shows extraction status column
- [x] Sortable by extraction status
- [x] Consistent iconography with card view

## Tasks / Subtasks

- [x] Task 1: Create ExtractionStatusBadge Component (AC: 11.8.1, 11.8.2)
  - [x] Create `src/components/documents/extraction-status-badge.tsx`
  - [x] Accept extraction_status and extraction_data props
  - [x] Render appropriate icon and label
  - [x] Style with appropriate colors (blue=analyzing, green=complete, red=failed)
  - [x] Test: All status states render correctly (24 tests)

- [x] Task 2: Integrate with DocumentCard (AC: 11.8.1)
  - [x] Add extraction_status to document query
  - [x] Render ExtractionStatusBadge in card
  - [x] Position below document type badge
  - [x] Test: Badge appears on document cards

- [x] Task 3: Add Tooltips (AC: 11.8.4)
  - [x] Add Tooltip wrapper to ExtractionStatusBadge
  - [x] Define tooltip content for each status
  - [x] Ensure tooltip works on mobile (tap to show)
  - [x] Test: Tooltips display correct messages

- [x] Task 4: Realtime Subscription (AC: 11.8.3)
  - [x] Extend existing document list subscription for extraction_status (uses useDocumentStatus)
  - [x] Update badge when status changes
  - [x] Add subtle animation for status transitions (animate-spin for pending/extracting)
  - [x] Test: Badge updates without page refresh

- [x] Task 5: Table View Column (AC: 11.8.5)
  - [x] Add "Analysis" column to DocumentTable
  - [x] Use same ExtractionStatusBadge component
  - [x] Make column sortable
  - [x] Test: Column renders and sorts correctly

- [x] Task 6: Retry Action (AC: 11.8.2)
  - [x] Add onClick handler for failed status
  - [x] Call extraction retry API (/api/documents/[id]/retry)
  - [x] Show loading state during retry
  - [x] Test: Retry triggers new extraction (uses existing useExtractionRetry hook)

## Dev Notes

### Extraction Status Badge Component

```typescript
// src/components/documents/extraction-status-badge.tsx
'use client';

import { Check, CheckCheck, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ExtractionStatus = 'pending' | 'extracting' | 'complete' | 'failed' | 'skipped';

interface ExtractionStatusBadgeProps {
  status: ExtractionStatus;
  documentType?: 'quote' | 'general' | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

const statusConfig: Record<ExtractionStatus, {
  icon: typeof Check;
  label: string;
  tooltip: string;
  className: string;
}> = {
  pending: {
    icon: Loader2,
    label: 'Queued',
    tooltip: 'This document is ready for chat. Quote analysis is queued.',
    className: 'text-slate-500 bg-slate-50',
  },
  extracting: {
    icon: Loader2,
    label: 'Analyzing...',
    tooltip: 'Extracting quote details for comparison. Chat is available now.',
    className: 'text-blue-600 bg-blue-50',
  },
  complete: {
    icon: CheckCheck,
    label: 'Fully Analyzed',
    tooltip: 'This document is fully analyzed and ready for comparison.',
    className: 'text-green-600 bg-green-50',
  },
  failed: {
    icon: AlertTriangle,
    label: 'Analysis Failed',
    tooltip: 'Quote extraction failed. Click to retry.',
    className: 'text-red-600 bg-red-50',
  },
  skipped: {
    icon: Check,
    label: 'Ready',
    tooltip: 'This document is ready. (General documents don\'t require quote extraction.)',
    className: 'text-green-600 bg-green-50',
  },
};

export function ExtractionStatusBadge({
  status,
  documentType,
  onRetry,
  isRetrying,
  className,
}: ExtractionStatusBadgeProps) {
  // For general documents, don't show extraction status
  if (documentType === 'general' && status !== 'complete') {
    return null;
  }

  const config = statusConfig[status];
  const Icon = config.icon;
  const isSpinning = status === 'extracting' || status === 'pending' || isRetrying;

  const badge = (
    <div
      data-testid={`extraction-status-${status}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.className,
        status === 'failed' && onRetry && 'cursor-pointer hover:bg-red-100',
        className
      )}
      onClick={status === 'failed' && onRetry ? onRetry : undefined}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          isSpinning && 'animate-spin'
        )}
      />
      <span>{isRetrying ? 'Retrying...' : config.label}</span>
      {status === 'failed' && onRetry && (
        <RefreshCcw className="h-3 w-3 ml-0.5" />
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### DocumentCard Integration

```typescript
// In DocumentCard component
import { ExtractionStatusBadge } from './extraction-status-badge';

export function DocumentCard({ document, onRetryExtraction }: DocumentCardProps) {
  return (
    <div className="...">
      {/* Existing content */}

      <div className="flex items-center gap-2 mt-2">
        <DocumentTypeBadge type={document.document_type} />

        {document.status === 'ready' && document.document_type !== 'general' && (
          <ExtractionStatusBadge
            status={document.extraction_status || 'pending'}
            documentType={document.document_type}
            onRetry={() => onRetryExtraction?.(document.id)}
          />
        )}
      </div>
    </div>
  );
}
```

### DocumentTable Column

```typescript
// In DocumentTable column definitions
const columns: ColumnDef<Document>[] = [
  // ... existing columns
  {
    id: 'analysis',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Analysis
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorKey: 'extraction_status',
    cell: ({ row }) => {
      const doc = row.original;
      if (doc.status !== 'ready' || doc.document_type === 'general') {
        return <span className="text-slate-400 text-sm">—</span>;
      }
      return (
        <ExtractionStatusBadge
          status={doc.extraction_status || 'pending'}
          documentType={doc.document_type}
        />
      );
    },
    sortingFn: (rowA, rowB) => {
      const order = { complete: 0, extracting: 1, pending: 2, failed: 3, skipped: 0 };
      const a = order[rowA.original.extraction_status || 'pending'];
      const b = order[rowB.original.extraction_status || 'pending'];
      return a - b;
    },
  },
];
```

### Retry Extraction Handler

```typescript
// In document list or parent component
async function handleRetryExtraction(documentId: string) {
  setRetryingIds(prev => new Set(prev).add(documentId));

  try {
    await fetch(`/api/documents/${documentId}/extract`, {
      method: 'POST',
    });
    // Realtime will update the status
  } catch (error) {
    toast.error('Failed to retry extraction');
  } finally {
    setRetryingIds(prev => {
      const next = new Set(prev);
      next.delete(documentId);
      return next;
    });
  }
}
```

### Test IDs

- `data-testid="extraction-status-pending"` - Pending/queued state
- `data-testid="extraction-status-extracting"` - In progress state
- `data-testid="extraction-status-complete"` - Complete state
- `data-testid="extraction-status-failed"` - Failed state
- `data-testid="extraction-status-skipped"` - Skipped (general docs)
- `data-testid="extraction-retry-button"` - Retry button for failed

### Visual Design

```
Document Card Layout:
┌──────────────────────────────────────┐
│  📄 Quote-2024-Acme.pdf              │
│                                      │
│  ┌──────────┐  ┌───────────────────┐ │
│  │  Quote   │  │ ⏳ Analyzing...   │ │
│  └──────────┘  └───────────────────┘ │
│                                      │
│  Uploaded: Dec 5, 2025  |  12 pages │
└──────────────────────────────────────┘

After extraction complete:
┌──────────────────────────────────────┐
│  📄 Quote-2024-Acme.pdf              │
│                                      │
│  ┌──────────┐  ┌───────────────────┐ │
│  │  Quote   │  │ ✓✓ Fully Analyzed │ │
│  └──────────┘  └───────────────────┘ │
│                                      │
│  Uploaded: Dec 5, 2025  |  12 pages │
└──────────────────────────────────────┘
```

### References

- [Source: Story 11.6] - Phased processing and extraction_status column
- [Source: Story 11.7] - Extraction status patterns
- [Source: src/components/documents/document-card.tsx] - DocumentCard component
- [Source: src/components/documents/document-table.tsx] - DocumentTable component
- [Source: Story F2.2] - DocumentTypeBadge patterns

---

## Dev Agent Record

### Context Reference
- Context file: `docs/sprint-artifacts/epics/epic-11/stories/11-8-document-list-extraction-indicators/11-8-document-list-extraction-indicators.context.xml`

---

## Bug Fixes

### Fix: Duplicate Row on Document Upload (2025-12-05)

**Issue:** When uploading a document, the document table briefly showed 2 duplicate rows before one disappeared.

**Root Cause:** Race condition between optimistic state update and Supabase Realtime INSERT handler.

When `createDocumentFromUpload` succeeded:
1. Server inserts document → Realtime INSERT event fires
2. Realtime handler checks if doc exists in state (`prev.some(...)`)
3. But React's async state batching meant the optimistic update hadn't been applied yet
4. So both the realtime handler AND the optimistic update added the document → duplicate

**Fix:** Added `registerOptimisticInsert(documentId)` function to `useDocumentStatus`:
- Tracks document IDs being added optimistically in a ref
- Realtime INSERT handler skips documents in this set
- IDs auto-cleanup after 10 seconds to prevent memory leaks

**Files Modified:**
- `src/hooks/use-document-status.ts` - Added `optimisticInsertIdsRef` and `registerOptimisticInsert`
- `src/app/(dashboard)/documents/page.tsx` - Call `registerOptimisticInsert` before optimistic update

### Fix: More Prominent Retry Button for Failed Extraction (2025-12-05)

**Issue:** Clicking on the failed extraction badge navigated to chat instead of triggering retry.

**Root Cause:**
1. The badge click target was small and row click was overriding stopPropagation
2. The retry endpoint `/api/documents/[id]/retry` was for document processing, not extraction retry

**Fix:**
1. Separated failed status into badge + standalone "Retry" button
2. Button is now a prominent red action button with clear "Retry" label
3. Created new `/api/documents/[id]/retry-extraction` endpoint specifically for extraction retry
4. Updated `useExtractionRetry` hook to use the new endpoint
5. Properly wired up `onRetryExtraction` and `retryingExtractionIds` props

**Files Modified:**
- `src/components/documents/extraction-status-badge.tsx` - New inline retry button for failed status
- `src/components/documents/document-table.tsx` - Added `onRetryExtraction` and `retryingExtractionIds` props
- `src/app/(dashboard)/documents/page.tsx` - Added `handleRetryExtraction` and state tracking
- `src/app/api/documents/[id]/retry-extraction/route.ts` - NEW: Extraction-specific retry endpoint
- `src/hooks/use-extraction-status.ts` - Updated `useExtractionRetry` to use new endpoint

### Fix: Bulk Delete with Row Selection (2025-12-05)

**Feature:** Added document deletion with bulk delete support.

**Implementation:**
1. Added row selection checkboxes to DocumentTable
2. Added selection bar UI with "Delete selected" button and count
3. Added AlertDialog for bulk delete confirmation
4. Created `bulkDeleteDocumentsAction` server action
5. Optimistic UI updates for immediate feedback

**Files Modified:**
- `src/app/(dashboard)/documents/page.tsx` - Selection state, handlers, confirmation dialog
- `src/app/(dashboard)/chat-docs/actions.ts` - Added `bulkDeleteDocumentsAction`
- `src/components/documents/document-table.tsx` - Added `enableSelection`, `onSelectionChange` props

### Fix: React Infinite Loop in DocumentTable (2025-12-05)

**Issue:** "Maximum update depth exceeded" error when loading documents page.

**Root Cause:** Two issues:
1. `useMemo` was being used instead of `useEffect` to call `onSelectionChange` callback - this triggered state updates during render
2. The `useEffect` was calling `onSelectionChange(selectedIds)` on every render, even when selection hadn't changed, creating an infinite loop

**Fix:**
1. Changed `useMemo` to `useEffect` for calling the selection callback
2. Added `prevSelectedIdsRef` to track previous selection
3. Only call `onSelectionChange` when selection actually changes (different IDs)

**Files Modified:**
- `src/components/documents/document-table.tsx` - Added ref-based change detection for selection

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted via Party Mode discussion | Team |
| 2025-12-05 | Context file created, story marked ready-for-dev | Sam |
| 2025-12-05 | Implemented all 6 tasks, 24 unit tests, E2E spec | Sam |
| 2025-12-05 | Fixed duplicate row bug on upload + prominent retry button | Claude |
| 2025-12-05 | Added bulk delete with row selection + fixed infinite loop | Claude |
| 2025-12-05 | Senior Developer Review: APPROVED | Claude |

---

## Senior Developer Review (AI)

**Reviewer:** Sam
**Date:** 2025-12-05
**Outcome:** ✅ **APPROVE**

### Summary

Story 11.8 implements extraction status indicators for the document library, allowing users to see which documents are "ready for chat" vs "fully analyzed for comparison." The implementation is complete with all 5 acceptance criteria verified, all 6 tasks with subtasks verified, 24 unit tests passing, and proper real-time updates via Supabase Realtime.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-11.8.1 | Extraction Status Badge on document cards | ✅ IMPLEMENTED | `src/components/documents/document-card.tsx:115-123` |
| AC-11.8.2 | Status States Display (pending/extracting/complete/failed/skipped) | ✅ IMPLEMENTED | `src/components/documents/extraction-status-badge.tsx:37-73` |
| AC-11.8.3 | Realtime Updates | ✅ IMPLEMENTED | `src/hooks/use-document-status.ts` + `animate-spin` transitions |
| AC-11.8.4 | Tooltip Explanations | ✅ IMPLEMENTED | `src/components/documents/extraction-status-badge.tsx:168-176` |
| AC-11.8.5 | Table View Support | ✅ IMPLEMENTED | `src/components/documents/document-table.tsx:212-250` |

**Summary:** 5 of 5 acceptance criteria fully implemented

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Create ExtractionStatusBadge | [x] | ✅ | `extraction-status-badge.tsx` - 179 lines |
| Task 2: Integrate with DocumentCard | [x] | ✅ | `document-card.tsx:115-123` |
| Task 3: Add Tooltips | [x] | ✅ | Tooltip wrapper with status-specific content |
| Task 4: Realtime Subscription | [x] | ✅ | Uses useDocumentStatus hook |
| Task 5: Table View Column | [x] | ✅ | "Analysis" column with sorting |
| Task 6: Retry Action | [x] | ✅ | `/api/documents/[id]/retry-extraction` endpoint |

**Summary:** 24 of 24 tasks/subtasks verified, 0 questionable, 0 false completions

### Test Coverage

- **Unit Tests:** 24 tests passing (`extraction-status-badge.test.tsx`)
- **Coverage:** All status states, tooltips, document type filtering, retry functionality
- **Build:** ✅ Passes
- **Full Test Suite:** ✅ 1607 tests passing

### Architectural Alignment

- ✅ Follows existing component patterns (DocumentStatusBadge, DocumentTypeBadge)
- ✅ Uses existing Supabase Realtime infrastructure
- ✅ Proper separation: component, hook, API endpoint
- ✅ Race condition fixes well-documented in Bug Fixes section

### Security Notes

- ✅ Authentication required for retry endpoint
- ✅ Agency ownership verification
- ✅ State validation prevents invalid operations

### Action Items

**Advisory Notes:**
- Note: Consider adding E2E test for realtime extraction status updates (no action required)
- Note: Bug Fixes section provides excellent documentation of race condition fixes

---

_Drafted: 2025-12-05_
_Epic: Epic 11 - Processing Reliability & Enhanced Progress Visualization_
