# Story 11.5: Error Handling & User Feedback

Status: todo

## Story

As a user whose document failed to process,
I want clear error messages and actionable feedback,
so that I understand what went wrong and what to do next.

## Acceptance Criteria

### AC-11.5.1: Error Categorization
- [ ] Classify errors into transient, recoverable, permanent categories
- [ ] Store error category in processing_job record
- [ ] Category determines retry behavior and user messaging

### AC-11.5.2: User-Friendly Messages
- [ ] Each error category has clear, non-technical message
- [ ] Messages include suggested action when applicable
- [ ] No raw error codes or stack traces shown to users

### AC-11.5.3: Error Notifications
- [ ] Toast notification when document processing fails
- [ ] Failed documents show error indicator in document list
- [ ] Error details available on hover/click

### AC-11.5.4: Processing Summary
- [ ] Documents page shows success/failure summary
- [ ] "X of Y documents processed successfully"
- [ ] Quick filter to show only failed documents

### AC-11.5.5: Error Icons & Styling
- [ ] Failed documents show red error icon
- [ ] Error message styled consistently
- [ ] Visual hierarchy: error state is prominent but not alarming

## Tasks / Subtasks

- [ ] Task 1: Error Classification (AC: 11.5.1)
  - [ ] Implement `classifyError` function
  - [ ] Add `error_category` column to processing_jobs
  - [ ] Update Edge Function to classify and store errors

- [ ] Task 2: Error Messages (AC: 11.5.2)
  - [ ] Define user-friendly message for each error type
  - [ ] Create `getErrorUserMessage` function
  - [ ] Add suggested actions to messages

- [ ] Task 3: Toast Notifications (AC: 11.5.3)
  - [ ] Subscribe to processing_job failures
  - [ ] Show toast when document fails
  - [ ] Include document name in toast

- [ ] Task 4: Error Display (AC: 11.5.3, 11.5.5)
  - [ ] Add error indicator to document list item
  - [ ] Create error tooltip/popover component
  - [ ] Style error states consistently

- [ ] Task 5: Processing Summary (AC: 11.5.4)
  - [ ] Create `ProcessingSummary` component
  - [ ] Calculate success/failure counts
  - [ ] Add failed documents filter

## Dev Notes

### Error Classification

```typescript
// src/lib/documents/error-classification.ts

export type ErrorCategory = 'transient' | 'recoverable' | 'permanent';

export interface ClassifiedError {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  suggestedAction: string | null;
  shouldAutoRetry: boolean;
}

const ERROR_MAPPINGS: Record<string, Omit<ClassifiedError, 'message'>> = {
  // Transient - automatic retry
  'TIMEOUT': {
    category: 'transient',
    code: 'TIMEOUT',
    userMessage: 'Processing timed out.',
    suggestedAction: null, // Will auto-retry
    shouldAutoRetry: true,
  },
  'RATE_LIMIT': {
    category: 'transient',
    code: 'RATE_LIMIT',
    userMessage: 'Service is busy.',
    suggestedAction: null,
    shouldAutoRetry: true,
  },
  'CONNECTION_ERROR': {
    category: 'transient',
    code: 'CONNECTION_ERROR',
    userMessage: 'Connection interrupted.',
    suggestedAction: null,
    shouldAutoRetry: true,
  },

  // Recoverable - user action needed
  'PDF_FORMAT_ERROR': {
    category: 'recoverable',
    code: 'PDF_FORMAT_ERROR',
    userMessage: 'This PDF has an unusual format that we cannot process.',
    suggestedAction: 'Try re-saving the PDF using Adobe Acrobat or a PDF converter.',
    shouldAutoRetry: false,
  },
  'PASSWORD_PROTECTED': {
    category: 'recoverable',
    code: 'PASSWORD_PROTECTED',
    userMessage: 'This PDF is password protected.',
    suggestedAction: 'Please upload an unlocked version of the document.',
    shouldAutoRetry: false,
  },
  'UNSUPPORTED_FORMAT': {
    category: 'recoverable',
    code: 'UNSUPPORTED_FORMAT',
    userMessage: 'File format not supported.',
    suggestedAction: 'Please upload a PDF, DOCX, or image file.',
    shouldAutoRetry: false,
  },
  'FILE_CORRUPTED': {
    category: 'recoverable',
    code: 'FILE_CORRUPTED',
    userMessage: 'File appears to be corrupted.',
    suggestedAction: 'Try downloading the file again and re-uploading.',
    shouldAutoRetry: false,
  },
  'FILE_TOO_LARGE': {
    category: 'recoverable',
    code: 'FILE_TOO_LARGE',
    userMessage: 'File is too large to process.',
    suggestedAction: 'Try splitting the document into smaller files.',
    shouldAutoRetry: false,
  },

  // Permanent - needs support
  'UNKNOWN': {
    category: 'permanent',
    code: 'UNKNOWN',
    userMessage: 'An unexpected error occurred.',
    suggestedAction: 'Please contact support with error ID: {errorId}',
    shouldAutoRetry: false,
  },
  'MAX_RETRIES_EXCEEDED': {
    category: 'permanent',
    code: 'MAX_RETRIES_EXCEEDED',
    userMessage: 'Processing failed after multiple attempts.',
    suggestedAction: 'Please contact support for assistance.',
    shouldAutoRetry: false,
  },
};

export function classifyError(errorMessage: string): ClassifiedError {
  // Check for known patterns
  if (/timeout/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['TIMEOUT'], message: errorMessage };
  }
  if (/429|rate.?limit/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['RATE_LIMIT'], message: errorMessage };
  }
  if (/ECONNRESET|ECONNREFUSED|network/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['CONNECTION_ERROR'], message: errorMessage };
  }
  if (/page-dimensions|MediaBox|libpdfium/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['PDF_FORMAT_ERROR'], message: errorMessage };
  }
  if (/password/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['PASSWORD_PROTECTED'], message: errorMessage };
  }
  if (/unsupported.*format|invalid.*file/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['UNSUPPORTED_FORMAT'], message: errorMessage };
  }
  if (/corrupt/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['FILE_CORRUPTED'], message: errorMessage };
  }
  if (/too.?large|size.?exceeded/i.test(errorMessage)) {
    return { ...ERROR_MAPPINGS['FILE_TOO_LARGE'], message: errorMessage };
  }

  // Default to unknown
  return { ...ERROR_MAPPINGS['UNKNOWN'], message: errorMessage };
}
```

### Error Display Component

```typescript
// src/components/documents/document-error.tsx
'use client';

import { AlertCircle, RefreshCcw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ClassifiedError } from '@/lib/documents/error-classification';

interface DocumentErrorProps {
  error: ClassifiedError;
  documentId: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function DocumentError({
  error,
  documentId,
  onRetry,
  isRetrying,
}: DocumentErrorProps) {
  const canRetry = error.category !== 'permanent' || error.code === 'MAX_RETRIES_EXCEEDED';

  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">
          {error.userMessage}
        </p>

        {error.suggestedAction && (
          <p className="text-sm text-red-600 mt-1">
            {error.suggestedAction.replace('{errorId}', documentId.slice(0, 8))}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            {isRetrying ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="ml-1.5">Retry</span>
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                Error Code: {error.code}<br />
                Category: {error.category}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
```

### Toast Notifications

```typescript
// In documents page or layout
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { classifyError } from '@/lib/documents/error-classification';

export function ProcessingFailureNotifier() {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('processing-failures')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'processing_jobs',
        filter: 'status=eq.failed',
      }, async (payload) => {
        // Get document name
        const { data: doc } = await supabase
          .from('documents')
          .select('display_name, filename')
          .eq('id', payload.new.document_id)
          .single();

        const docName = doc?.display_name || doc?.filename || 'Document';
        const error = classifyError(payload.new.error_message || '');

        toast.error(`Failed to process "${docName}"`, {
          description: error.userMessage,
          duration: 10000,
          action: error.suggestedAction ? {
            label: 'Learn more',
            onClick: () => {
              // Navigate to document with error details
              window.location.href = `/documents/${payload.new.document_id}`;
            },
          } : undefined,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return null; // This component just subscribes to events
}
```

### Error Indicator in Document List

```typescript
// In DocumentListItem or DocumentCard
function DocumentStatusIndicator({
  status,
  error,
}: {
  status: string;
  error?: ClassifiedError;
}) {
  if (status === 'failed' && error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Failed</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{error.userMessage}</p>
            {error.suggestedAction && (
              <p className="text-xs text-slate-400 mt-1">
                {error.suggestedAction}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center gap-1.5 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs font-medium">Processing</span>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Ready</span>
      </div>
    );
  }

  return null;
}
```

### Processing Summary

```typescript
// src/components/documents/processing-summary.tsx
'use client';

import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProcessingSummaryProps {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  onFilterFailed?: () => void;
}

export function ProcessingSummary({
  total,
  completed,
  failed,
  processing,
  onFilterFailed,
}: ProcessingSummaryProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-slate-600">
        {completed} of {total} documents processed
      </span>

      {processing > 0 && (
        <span className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {processing} processing
        </span>
      )}

      {failed > 0 && (
        <button
          onClick={onFilterFailed}
          className="flex items-center gap-1 text-red-600 hover:underline"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {failed} failed
        </button>
      )}
    </div>
  );
}
```

### Database Schema Update

```sql
-- Add error_category column
ALTER TABLE processing_jobs
ADD COLUMN error_category varchar(20)
  CHECK (error_category IN ('transient', 'recoverable', 'permanent'));

-- Add error_code column
ALTER TABLE processing_jobs
ADD COLUMN error_code varchar(50);
```

### Test IDs

- `data-testid="document-error"` - Error display container
- `data-testid="error-message"` - Error message text
- `data-testid="error-action"` - Suggested action text
- `data-testid="error-retry-button"` - Retry button
- `data-testid="processing-summary"` - Processing summary
- `data-testid="failed-filter"` - Failed documents filter

---

_Drafted: 2025-12-04_
_Epic: Epic 11 - Processing Reliability & Enhanced Progress Visualization_
