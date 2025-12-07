/**
 * Document Card Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a document in the panel.
 * Stub implementation - full functionality in Epic 17.
 */

import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentCardProps {
  name: string;
  status?: 'ready' | 'processing' | 'error';
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export function DocumentCard({
  name,
  status = 'ready',
  onRemove,
  onClick,
  className,
}: DocumentCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded bg-[var(--chat-surface)] group',
        onClick && 'cursor-pointer hover:bg-[var(--sidebar-hover)]',
        className
      )}
      onClick={onClick}
    >
      <FileText className="h-4 w-4 text-[var(--text-muted)]" />
      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
        {name}
      </span>
      {status === 'processing' && (
        <span className="text-xs text-amber-400">Processing...</span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-400">Error</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
        </button>
      )}
    </div>
  );
}
