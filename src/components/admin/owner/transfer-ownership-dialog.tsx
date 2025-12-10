/**
 * TransferOwnershipDialog Component
 * Story 20.5: Owner Management
 *
 * Dialog for transferring agency ownership to another admin
 * AC-20.5.4: Owner sees "Transfer Ownership" option
 * AC-20.5.5: Only admins listed as transfer targets
 * AC-20.5.6: Password confirmation required
 * AC-20.5.10: Empty state when no admins available
 */

'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, AlertTriangle, Loader2, CheckCircle2, UserCog } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

interface TransferOwnershipDialogProps {
  /** List of eligible admins for transfer */
  admins: AdminUser[];
  /** Whether admin list is loading */
  isLoadingAdmins: boolean;
  /** Error loading admins */
  adminsError: Error | null;
  /** Callback to execute transfer */
  onTransfer: (newOwnerId: string, password: string) => Promise<unknown>;
  /** Whether transfer is in progress */
  isTransferring: boolean;
  /** Reload admin list */
  onRefreshAdmins?: () => void;
}

/**
 * Dialog for transferring agency ownership
 *
 * Shows warning text about consequences, requires password confirmation.
 *
 * @example
 * ```tsx
 * <TransferOwnershipDialog
 *   admins={eligibleAdmins}
 *   isLoadingAdmins={loadingAdmins}
 *   adminsError={adminsError}
 *   onTransfer={handleTransfer}
 *   isTransferring={transferring}
 * />
 * ```
 */
export function TransferOwnershipDialog({
  admins,
  isLoadingAdmins,
  adminsError,
  onTransfer,
  isTransferring,
  onRefreshAdmins,
}: TransferOwnershipDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [countdown, setCountdown] = useState(5);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedAdmin('');
      setPassword('');
      setError(null);
      setStep('select');
      setCountdown(5);
    }
  }, [open]);

  // Countdown after successful transfer
  useEffect(() => {
    if (step === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === 'success' && countdown === 0) {
      // Reload the page to reflect new permissions
      window.location.reload();
    }
    return undefined;
  }, [step, countdown]);

  const handleProceedToConfirm = () => {
    if (!selectedAdmin) {
      setError('Please select an admin');
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleTransfer = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);

    try {
      await onTransfer(selectedAdmin, password);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  const selectedAdminName = admins.find((a) => a.id === selectedAdmin);

  // No admins available (AC-20.5.10)
  const noAdminsAvailable = !isLoadingAdmins && admins.length === 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="text-amber-600 border-amber-300 hover:bg-amber-50"
          data-testid="transfer-ownership-button"
        >
          <Crown className="h-4 w-4 mr-2" />
          Transfer Ownership
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {/* Step 1: Select admin (AC-20.5.5) */}
        {step === 'select' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Transfer Ownership
              </AlertDialogTitle>
              <AlertDialogDescription>
                Transfer your agency ownership to another administrator.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              {/* Warning */}
              <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Warning:</strong> This action cannot be undone. You will lose owner
                  privileges and become a regular admin. The new owner will have full control
                  over agency settings, billing, and can transfer ownership again.
                </AlertDescription>
              </Alert>

              {/* Loading state */}
              {isLoadingAdmins && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}

              {/* Error loading admins */}
              {adminsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load admins: {adminsError.message}
                    {onRefreshAdmins && (
                      <button onClick={onRefreshAdmins} className="ml-2 underline">
                        Try again
                      </button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* No admins available (AC-20.5.10) */}
              {noAdminsAvailable && (
                <Alert data-testid="no-admins-message">
                  <UserCog className="h-4 w-4" />
                  <AlertDescription>
                    <strong>No admins available</strong>
                    <p className="mt-1">
                      Promote a user to admin first before transferring ownership.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Admin selector (AC-20.5.5) */}
              {!isLoadingAdmins && !adminsError && admins.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="admin-select">Select New Owner</Label>
                  <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                    <SelectTrigger id="admin-select" data-testid="admin-select">
                      <SelectValue placeholder="Select an admin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem
                          key={admin.id}
                          value={admin.id}
                          data-testid={`admin-option-${admin.id}`}
                        >
                          {admin.name || admin.email}
                          {admin.name && (
                            <span className="text-muted-foreground ml-2">
                              ({admin.email})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={handleProceedToConfirm}
                disabled={!selectedAdmin || isLoadingAdmins}
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="proceed-to-confirm-button"
              >
                Continue
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Step 2: Password confirmation (AC-20.5.6) */}
        {step === 'confirm' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Confirm Transfer
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to transfer ownership to{' '}
                <strong>{selectedAdminName?.name || selectedAdminName?.email}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4 space-y-4">
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action is <strong>permanent and irreversible</strong>.
                  You will be demoted to a regular admin role.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  data-testid="confirm-password-input"
                  disabled={isTransferring}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isTransferring}>
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleTransfer}
                disabled={!password || isTransferring}
                variant="destructive"
                data-testid="confirm-transfer-button"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Step 3: Success confirmation */}
        {step === 'success' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Ownership Transferred
              </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="py-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>{selectedAdminName?.name || selectedAdminName?.email}</strong>{' '}
                  is now the agency owner. You have been assigned the admin role.
                  <p className="mt-2">
                    Email notifications have been sent to both parties.
                  </p>
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                Page will refresh in {countdown} seconds...
              </p>
            </div>

            <AlertDialogFooter>
              <Button onClick={() => window.location.reload()}>
                Refresh Now
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
