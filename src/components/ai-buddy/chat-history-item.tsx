/**
 * Chat History Item Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a conversation in the history list.
 * Stub implementation - full functionality in Epic 16.
 */

import { MessageSquare, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatHistoryItemProps {
  title: string;
  preview?: string;
  timestamp?: Date;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ChatHistoryItem({
  title,
  preview,
  timestamp,
  isActive = false,
  onClick,
  className,
}: ChatHistoryItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left group',
        isActive
          ? 'bg-[var(--sidebar-active)]'
          : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      <MessageSquare className="h-4 w-4 mt-0.5 text-[var(--text-muted)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {title}
        </p>
        {preview && (
          <p className="text-xs text-[var(--text-muted)] truncate">{preview}</p>
        )}
      </div>
      <MoreVertical className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
    </button>
  );
}
