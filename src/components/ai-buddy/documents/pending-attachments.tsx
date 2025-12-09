/**
 * Pending Attachments Component
 * Story 17.1: Document Upload to Conversation with Status
 *
 * Container for displaying pending file attachments above the chat input.
 *
 * AC-17.1.2: Pending attachments appear above the input with file names and remove buttons
 * AC-17.1.3: Status indicator per file
 */

'use client';

import { AttachmentChip } from './attachment-chip';
import { cn } from '@/lib/utils';
import type { PendingAttachment } from '@/types/ai-buddy';

export interface PendingAttachmentsProps {
  /** List of pending attachments */
  attachments: PendingAttachment[];
  /** Callback when remove button is clicked for an attachment */
  onRemove?: (id: string) => void;
  /** Callback when retry button is clicked for a failed attachment */
  onRetry?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pending Attachments Container
 *
 * Displays a horizontal row of attachment chips above the chat input.
 * Shows pending files that will be sent with the next message.
 */
export function PendingAttachments({
  attachments,
  onRemove,
  onRetry,
  className,
}: PendingAttachmentsProps) {
  // Don't render if no attachments
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-2',
        'bg-slate-50 border-t border-slate-200',
        'rounded-t-lg',
        className
      )}
      data-testid="pending-attachments"
      role="region"
      aria-label="Pending attachments"
    >
      {attachments.map((attachment) => {
        // Determine file type from name
        const extension = attachment.name.split('.').pop()?.toLowerCase();

        return (
          <AttachmentChip
            key={attachment.id}
            name={attachment.name}
            status={attachment.status}
            fileType={extension}
            progress={attachment.progress}
            error={attachment.error}
            onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
            onRetry={onRetry ? () => onRetry(attachment.id) : undefined}
          />
        );
      })}

      {/* Helper text when at max attachments */}
      {attachments.length >= 5 && (
        <span className="text-xs text-slate-500 self-center ml-2">
          Maximum 5 files
        </span>
      )}
    </div>
  );
}
