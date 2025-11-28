'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { inviteUserSchema, type InviteUserFormData } from '@/lib/validations/auth';
import { inviteUser } from '@/app/(dashboard)/settings/actions';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Invite User Modal
 * Per AC-3.2.1: Modal with email field and role selector (Member/Admin)
 */
export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: InviteUserFormData) => {
    startTransition(async () => {
      const result = await inviteUser(data);

      if (result.success) {
        toast.success(`Invitation sent to ${data.email}`);
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your agency. They&apos;ll receive an email with a link to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="colleague@company.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              {...register('role')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-slate-500">
              Admins can manage team members and agency settings
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
