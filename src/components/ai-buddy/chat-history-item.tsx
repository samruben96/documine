/**
 * Chat History Item Component
 * Story 15.4: Conversation Persistence
 *
 * Displays a conversation in the sidebar history list.
 *
 * AC-15.4.4: Conversations listed with truncated title and relative timestamp
 * AC-15.4.8: Click to load conversation
 */

import { MessageSquare, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export interface ChatHistoryItemProps {
  id: string;
  title: string;
  preview?: string;
  updatedAt?: string | Date;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
}

/**
 * Format timestamp to relative time (e.g., "2h ago", "Yesterday")
 */
function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '';
  }
}

export function ChatHistoryItem({
  id,
  title,
  preview,
  updatedAt,
  isActive = false,
  onClick,
  onDelete,
  className,
}: ChatHistoryItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
    setIsMenuOpen(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`conversation-item-${id}`}
      className={cn(
        'w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left group',
        isActive
          ? 'bg-[var(--sidebar-active)]'
          : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      <MessageSquare className="h-4 w-4 mt-0.5 text-[var(--text-muted)] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-[var(--text-primary)] truncate"
          title={title}
        >
          {title || 'New conversation'}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {updatedAt && (
            <span className="truncate">{formatRelativeTime(updatedAt)}</span>
          )}
          {preview && updatedAt && <span>&middot;</span>}
          {preview && <span className="truncate">{preview}</span>}
        </div>
      </div>

      {onDelete && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <span
              className={cn(
                'h-6 w-6 flex items-center justify-center rounded hover:bg-[var(--sidebar-hover)] cursor-pointer',
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <MoreVertical className="h-4 w-4 text-[var(--text-muted)]" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </button>
  );
}
