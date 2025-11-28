'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { removeTeamMember } from '@/app/(dashboard)/settings/actions';

interface RemoveUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string | null;
  };
  agencyName: string;
  onSuccess?: () => void;
}

/**
 * Remove User Confirmation Modal
 * Per AC-3.3.2, AC-3.3.3: Confirmation modal with user name and agency name
 */
export function RemoveUserModal({
  open,
  onOpenChange,
  user,
  agencyName,
  onSuccess,
}: RemoveUserModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeTeamMember(user.id);

      if (result.success) {
        toast.success('Member removed');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    });
  };

  const displayName = user.full_name || 'this user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Remove {displayName} from {agencyName}? They will lose access to all agency documents.
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
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
