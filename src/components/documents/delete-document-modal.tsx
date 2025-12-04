'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteDocumentAction } from '@/app/(dashboard)/chat-docs/actions';

interface DeleteDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    filename: string;
    display_name: string | null;
  } | null;
  onSuccess?: () => void;
  /** Story 5.14 (AC-5.14.4): Called immediately before server call to remove from UI */
  onOptimisticDelete?: () => void;
  /** Story 5.14 (AC-5.14.5): Called on server error to restore document */
  onError?: () => void;
}

/**
 * Delete Document Confirmation Modal
 * Per AC-4.4.2, AC-4.4.3, AC-4.4.4: Confirmation modal with document name,
 * warning text, and destructive delete button with loading state.
 */
export function DeleteDocumentModal({
  open,
  onOpenChange,
  document,
  onSuccess,
  onOptimisticDelete,
  onError,
}: DeleteDocumentModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!document) return;

    // Story 5.14 (AC-5.14.4): Optimistic delete - remove from UI immediately
    onOptimisticDelete?.();
    onOpenChange(false);

    startTransition(async () => {
      const result = await deleteDocumentAction(document.id);

      if (result.success) {
        toast.success('Document deleted');
        onSuccess?.();
      } else {
        // Story 5.14 (AC-5.14.5): Restore document on failure
        toast.error(result.error || 'Failed to delete document');
        onError?.();
      }
    });
  };

  const displayName = document?.display_name || document?.filename || 'this document';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {displayName}?</DialogTitle>
          <DialogDescription className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <span>
              This will permanently delete the document and all conversations about it. This cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
