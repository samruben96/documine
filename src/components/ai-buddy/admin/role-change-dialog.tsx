/**
 * RoleChangeDialog Component
 * Story 20.2: Admin User Management
 *
 * Confirmation dialog for changing a user's role
 * AC-20.2.6: Change user role (producer ↔ admin)
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, User, AlertTriangle } from 'lucide-react';
import type { AdminUser } from '@/types/ai-buddy';

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onConfirm: (newRole: 'producer' | 'admin') => Promise<void>;
}

export function RoleChangeDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: RoleChangeDialogProps) {
  const [newRole, setNewRole] = useState<'producer' | 'admin'>(
    user.role === 'admin' ? 'producer' : 'admin'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (newRole === user.role) {
      onOpenChange(false);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm(newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setError(null);
      setNewRole(user.role === 'admin' ? 'producer' : 'admin');
    }
    onOpenChange(newOpen);
  };

  const isDemotion = user.role === 'admin' && newRole === 'producer';
  const isPromotion = user.role === 'producer' && newRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="role-change-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Role
          </DialogTitle>
          <DialogDescription>
            Update the role for <strong>{user.name || user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select
              value={newRole}
              onValueChange={(value: 'producer' | 'admin') => setNewRole(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role" data-testid="role-select">
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

          {isDemotion && (
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Demotion warning:</strong> This user will lose admin privileges
                including access to user management and settings.
              </AlertDescription>
            </Alert>
          )}

          {isPromotion && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Promotion:</strong> This user will gain full admin access including
                user management and settings configuration.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" data-testid="role-change-error">
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
            onClick={handleConfirm}
            disabled={isSubmitting || newRole === user.role}
            data-testid="role-change-confirm-button"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDemotion ? 'Demote User' : isPromotion ? 'Promote User' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
