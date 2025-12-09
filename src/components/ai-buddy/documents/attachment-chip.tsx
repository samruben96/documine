/**
 * Attachment Chip Component
 * Story 17.1: Document Upload to Conversation with Status
 *
 * Displays a single attachment with status indicator and actions.
 *
 * AC-17.1.2: File names and remove buttons
 * AC-17.1.3: Status indicator per file
 * AC-17.1.6: Retry button for failed files
 */

'use client';

import { X, Loader2, CheckCircle2, AlertCircle, FileText, Image, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttachmentStatus } from '@/types/ai-buddy';

export interface AttachmentChipProps {
  /** File name to display */
  name: string;
  /** Current status of the attachment */
  status: AttachmentStatus;
  /** File type (pdf, png, jpg, etc.) */
  fileType?: string;
  /** Upload progress (0-100) when uploading */
  progress?: number;
  /** Error message when failed */
  error?: string;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the appropriate icon for file type
 */
function getFileIcon(fileType?: string) {
  if (!fileType) return FileText;
  const type = fileType.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(type)) {
    return Image;
  }
  return FileText;
}

/**
 * Get status-specific styling
 */
function getStatusStyles(status: AttachmentStatus) {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-700',
      };
    case 'uploading':
    case 'processing':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
      };
    case 'ready':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
      };
    case 'failed':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
      };
    default:
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-700',
      };
  }
}

/**
 * Attachment Chip Component
 *
 * Displays a compact chip showing:
 * - File type icon
 * - Truncated file name
 * - Status indicator (spinner, check, or error)
 * - Remove/Retry button
 */
export function AttachmentChip({
  name,
  status,
  fileType,
  progress,
  error,
  onRemove,
  onRetry,
  className,
}: AttachmentChipProps) {
  const FileIcon = getFileIcon(fileType);
  const styles = getStatusStyles(status);

  // Truncate long file names
  const displayName =
    name.length > 25 ? name.slice(0, 12) + '...' + name.slice(-10) : name;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
        'border transition-colors duration-150',
        'text-sm max-w-[200px]',
        styles.bg,
        styles.border,
        className
      )}
      title={error || name}
      data-testid="attachment-chip"
      data-status={status}
    >
      {/* File type icon */}
      <FileIcon className={cn('h-4 w-4 flex-shrink-0', styles.text)} />

      {/* File name */}
      <span className={cn('truncate font-medium', styles.text)}>
        {displayName}
      </span>

      {/* Status indicator */}
      <div className="flex-shrink-0 ml-1">
        {(status === 'uploading' || status === 'processing') && (
          <Loader2
            className="h-4 w-4 animate-spin text-amber-600"
            data-testid="status-loading"
          />
        )}
        {status === 'ready' && (
          <CheckCircle2
            className="h-4 w-4 text-emerald-600"
            data-testid="status-ready"
          />
        )}
        {status === 'failed' && (
          <AlertCircle
            className="h-4 w-4 text-red-600"
            data-testid="status-failed"
          />
        )}
      </div>

      {/* Upload progress (when uploading) */}
      {status === 'uploading' && progress !== undefined && (
        <span className="text-xs text-amber-600 ml-1">
          {Math.round(progress)}%
        </span>
      )}

      {/* Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1 ml-1">
        {/* Retry button for failed uploads - AC-17.1.6 */}
        {status === 'failed' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'p-0.5 rounded hover:bg-red-100',
              'focus:outline-none focus:ring-1 focus:ring-red-400'
            )}
            aria-label="Retry upload"
            data-testid="retry-button"
          >
            <RotateCcw className="h-3.5 w-3.5 text-red-600" />
          </button>
        )}

        {/* Remove button - AC-17.1.2 */}
        {onRemove && (status === 'pending' || status === 'failed') && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'p-0.5 rounded hover:bg-slate-200',
              'focus:outline-none focus:ring-1 focus:ring-slate-400'
            )}
            aria-label="Remove attachment"
            data-testid="remove-button"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}
