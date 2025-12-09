/**
 * Conversation Context Menu Component
 * Story 16.6: Conversation Management - Delete & Move
 *
 * Right-click context menu for conversation items with Delete and Move options.
 *
 * AC-16.6.1: Conversation menu includes "Delete" option
 * AC-16.6.7: Conversation menu includes "Move to Project" option
 */

'use client';

import { useState } from 'react';
import { Trash2, FolderInput } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DeleteConversationDialog } from './delete-conversation-dialog';
import { MoveToProjectDialog } from './move-to-project-dialog';
import { useAiBuddyContext } from '@/contexts/ai-buddy-context';

export interface ConversationContextMenuProps {
  /** The conversation ID */
  conversationId: string;
  /** The conversation title */
  conversationTitle: string;
  /** Current project ID (null = general chat) */
  currentProjectId: string | null;
  /** Trigger element (ChatHistoryItem) */
  children: React.ReactNode;
  /** Disable context menu */
  disabled?: boolean;
}

export function ConversationContextMenu({
  conversationId,
  conversationTitle,
  currentProjectId,
  children,
  disabled = false,
}: ConversationContextMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const { confirmDelete, showDeleteConfirmation, conversationToDelete, closeDeleteConfirmation } =
    useAiBuddyContext();

  const handleDeleteClick = () => {
    showDeleteConfirmation({ id: conversationId, title: conversationTitle });
    setDeleteDialogOpen(true);
  };

  const handleMoveClick = () => {
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

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-testid={`conversation-context-trigger-${conversationId}`}>
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent data-testid={`conversation-context-menu-${conversationId}`}>
          <ContextMenuItem
            onClick={handleMoveClick}
            className="cursor-pointer"
            data-testid="context-menu-move"
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Move to Project
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDeleteClick}
            variant="destructive"
            className="cursor-pointer"
            data-testid="context-menu-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        conversation={conversationToDelete}
        onConfirm={handleDeleteConfirm}
      />

      <MoveToProjectDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        conversationId={conversationId}
        currentProjectId={currentProjectId}
      />
    </>
  );
}
