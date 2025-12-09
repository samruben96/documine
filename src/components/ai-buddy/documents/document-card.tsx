/**
 * Document Card Component
 * Story 17.2: Project Document Management
 *
 * Individual document item showing name, status, and remove button.
 *
 * AC-17.2.5: Remove (X) removes document from project context
 * AC-17.2.7: Shows extraction context indicator for quote documents
 */

'use client';

import { FileText, Loader2, CheckCircle, XCircle, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectDocument } from '@/types/ai-buddy';

export interface DocumentCardProps {
  /** Document data */
  document: ProjectDocument;
  /** Callback when remove button clicked */
  onRemove?: (documentId: string) => void;
  /** Whether removal is in progress */
  isRemoving?: boolean;
  /** Disable interactions */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get file type icon color based on extension
 */
function getFileTypeColor(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'text-red-500';
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'text-blue-500';
    default:
      return 'text-slate-500';
  }
}

/**
 * Get status indicator
 */
function StatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'ready':
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    case 'processing':
    case 'pending':
      return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    default:
      return null;
  }
}

/**
 * Format file size in human readable format
 */
function formatPageCount(pageCount: number | null): string {
  if (!pageCount) return '';
  return `${pageCount} page${pageCount === 1 ? '' : 's'}`;
}

export function DocumentCard({
  document,
  onRemove,
  isRemoving = false,
  disabled = false,
  className,
}: DocumentCardProps) {
  const { document: doc, attached_at } = document;
  const hasExtractionData = !!doc.extraction_data;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove && !isRemoving && !disabled) {
      onRemove(document.document_id);
    }
  };

  const isProcessing = doc.status === 'processing' || doc.status === 'pending';
  const isFailed = doc.status === 'failed';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg',
        'bg-white border border-slate-200',
        'hover:border-slate-300 hover:shadow-sm',
        'transition-all duration-150',
        isProcessing && 'bg-amber-50/50 border-amber-200',
        isFailed && 'bg-red-50/50 border-red-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-testid="document-card"
    >
      {/* File type icon */}
      <div
        className={cn(
          'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
          'bg-slate-100 group-hover:bg-slate-200 transition-colors'
        )}
      >
        <FileText className={cn('h-5 w-5', getFileTypeColor(doc.file_type))} />
      </div>

      {/* Document info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-900 truncate">
            {doc.name}
          </p>
          {/* AC-17.2.7: Extraction context indicator */}
          {hasExtractionData && (
            <span
              className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700"
              title="Contains extracted quote data"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Quote
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusIndicator status={doc.status} />
          <span className="text-xs text-slate-500 uppercase">
            {doc.file_type}
          </span>
          {doc.page_count && (
            <>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500">
                {formatPageCount(doc.page_count)}
              </span>
            </>
          )}
          {isProcessing && (
            <span className="text-xs text-amber-600">Processing...</span>
          )}
          {isFailed && (
            <span className="text-xs text-red-600">Failed</span>
          )}
        </div>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving || disabled}
          className={cn(
            'flex-shrink-0 h-7 w-7 rounded-full',
            'flex items-center justify-center',
            'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-slate-500/20',
            (isRemoving || disabled) && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`Remove ${doc.name} from project`}
          data-testid="remove-document-button"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
