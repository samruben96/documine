/**
 * Chat History Item Component
 * Story 15.4: Conversation Persistence
 * Story 16.6: Conversation Management - Delete & Move
 *
 * Displays a conversation in the sidebar history list.
 * Includes context menu (right-click) and ellipsis menu for actions.
 *
 * AC-15.4.4: Conversations listed with truncated title and relative timestamp
 * AC-15.4.8: Click to load conversation
 * AC-16.6.1: Conversation menu includes "Delete" option
 * AC-16.6.7: Conversation menu includes "Move to Project" option
 */

'use client';

import { useState } from 'react';
import { MessageSquare, MoreHorizontal, FolderOpen, FolderInput, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ConversationContextMenu } from './conversation-context-menu';
import { DeleteConversationDialog } from './delete-conversation-dialog';
import { MoveToProjectDialog } from './move-to-project-dialog';
import { useAiBuddyContext } from '@/contexts/ai-buddy-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ChatHistoryItemProps {
  id: string;
  title: string;
  preview?: string;
  updatedAt?: string | Date;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  /** Project ID for this conversation (Story 16.6) */
  projectId?: string | null;
  /** Project name to display as a badge (Story 16.4: AC-16.4.3) */
  projectName?: string | null;
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
  projectId,
  projectName,
  className,
}: ChatHistoryItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const { confirmDelete, showDeleteConfirmation, conversationToDelete, closeDeleteConfirmation } =
    useAiBuddyContext();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showDeleteConfirmation({ id, title: title || 'New conversation' });
    setDeleteDialogOpen(true);
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoveDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await confirmDelete();
    setDeleteDialogOpen(false);
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      closeDeleteConfirmation();
    }
  };

  const itemContent = (
    <div
      data-testid={`conversation-item-${id}`}
      className={cn(
        'w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left group relative',
        isActive ? 'bg-[var(--sidebar-active)]' : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        onClick={onClick}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
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
            {/* AC-16.4.3: Project name badge - Enhanced visibility */}
            {projectName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 truncate max-w-[100px]"
                title={projectName}
                data-testid={`conversation-project-badge-${id}`}
              >
                <FolderOpen className="h-3 w-3 flex-shrink-0" />
                {projectName}
              </span>
            )}
            {updatedAt && <span className="truncate">{formatRelativeTime(updatedAt)}</span>}
            {preview && updatedAt && <span>&middot;</span>}
            {preview && <span className="truncate">{preview}</span>}
          </div>
        </div>
      </button>

      {/* Ellipsis menu - visible on hover */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-[var(--sidebar-hover)] transition-opacity"
            data-testid={`conversation-menu-${id}`}
            aria-label="Conversation options"
          >
            <MoreHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleMoveClick}
            className="cursor-pointer"
            data-testid="dropdown-menu-move"
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Move to Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="cursor-pointer text-destructive focus:text-destructive"
            data-testid="dropdown-menu-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        conversation={conversationToDelete}
        onConfirm={handleDeleteConfirm}
      />

      <MoveToProjectDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        conversationId={id}
        currentProjectId={projectId ?? null}
      />
    </div>
  );

  // Wrap with context menu for right-click actions (Story 16.6)
  return (
    <ConversationContextMenu
      conversationId={id}
      conversationTitle={title || 'New conversation'}
      currentProjectId={projectId ?? null}
    >
      {itemContent}
    </ConversationContextMenu>
  );
}
