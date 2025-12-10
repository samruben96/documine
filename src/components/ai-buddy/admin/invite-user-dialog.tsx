/**
 * InviteUserDialog Component
 * Story 20.2: Admin User Management
 *
 * Dialog for inviting new users to the agency
 * AC-20.2.3: Invite new user via email
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Shield, User } from 'lucide-react';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: 'producer' | 'admin') => Promise<void>;
}

export function InviteUserDialog({ open, onOpenChange, onInvite }: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'producer' | 'admin'>('producer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvite(email, role);
      // Reset form on success
      setEmail('');
      setRole('producer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setEmail('');
      setRole('producer');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="invite-user-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Send an invitation to add a new team member. They&apos;ll receive an email with
              instructions to join.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                data-testid="invite-email-input"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'producer' | 'admin') => setRole(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role" data-testid="invite-role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producer" data-testid="role-option-producer">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Producer</div>
                        <div className="text-xs text-muted-foreground">
                          Can use AI Buddy and manage own projects
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" data-testid="role-option-admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Full access including user and settings management
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive" data-testid="invite-error">
                {error}
              </p>
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
            <Button type="submit" disabled={isSubmitting} data-testid="invite-submit-button">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
