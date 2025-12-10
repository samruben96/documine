/**
 * RemoveUserDialog Component
 * Story 20.2: Admin User Management
 *
 * Confirmation dialog for removing a user from the agency
 * AC-20.2.5: Remove user access (soft delete)
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserMinus, AlertTriangle } from 'lucide-react';

interface RemoveUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => Promise<void>;
}

export function RemoveUserDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: RemoveUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="remove-user-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <UserMinus className="h-5 w-5" />
            Remove User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from your agency?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Revoke their access to AI Buddy</li>
                <li>Remove them from all shared projects</li>
                <li>Preserve their historical data for audit purposes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mt-4" data-testid="remove-user-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
            data-testid="remove-user-confirm-button"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
