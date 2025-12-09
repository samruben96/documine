/**
 * Delete Conversation Dialog Component
 * Story 16.6: Conversation Management - Delete & Move
 *
 * Confirmation dialog before deleting a conversation.
 *
 * AC-16.6.2: Delete shows confirmation dialog "Delete this conversation?"
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeleteConversationDialogProps {
  /** The conversation to delete */
  conversation: { id: string; title: string } | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Whether the delete operation is in progress */
  isLoading?: boolean;
}

export function DeleteConversationDialog({
  conversation,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteConversationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="delete-conversation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            {conversation?.title ? (
              <>
                The conversation &quot;{conversation.title}&quot; will be permanently removed from
                your history. This action cannot be undone.
              </>
            ) : (
              <>
                This conversation will be permanently removed from your history. This action cannot
                be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} data-testid="delete-cancel-button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="delete-confirm-button"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
