/**
 * OwnerSettingsPanel Component
 * Story 20.5: Owner Management
 *
 * Combined panel for owner-only settings (subscription + transfer ownership)
 * AC-20.5.1 through AC-20.5.11: All owner management functionality
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { useOwnerSettings } from '@/hooks/admin/use-owner-settings';
import { SubscriptionPanel } from './subscription-panel';
import { TransferOwnershipDialog } from './transfer-ownership-dialog';

interface OwnerSettingsPanelProps {
  /** Whether user has owner/transfer_ownership permission */
  hasOwnerPermission: boolean;
}

/**
 * Panel for owner-specific agency settings
 *
 * Combines subscription display and ownership transfer functionality.
 * Only renders for users with owner permission.
 *
 * @example
 * ```tsx
 * <OwnerSettingsPanel hasOwnerPermission={isOwner} />
 * ```
 */
export function OwnerSettingsPanel({ hasOwnerPermission }: OwnerSettingsPanelProps) {
  const {
    subscription,
    isLoadingSubscription,
    subscriptionError,
    refetchSubscription,
    admins,
    isLoadingAdmins,
    adminsError,
    refetchAdmins,
    transferOwnership,
    isTransferring,
    isOwner,
  } = useOwnerSettings();

  // Don't render if user doesn't have owner permission
  if (!hasOwnerPermission) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="owner-settings-panel">
      {/* Subscription Panel (AC-20.5.1, AC-20.5.2, AC-20.5.3) */}
      <SubscriptionPanel
        subscription={subscription}
        isLoading={isLoadingSubscription}
        error={subscriptionError}
        onRetry={refetchSubscription}
      />

      {/* Ownership Transfer Section (AC-20.5.4 through AC-20.5.11) */}
      {isOwner && (
        <Card data-testid="ownership-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Ownership Management
            </CardTitle>
            <CardDescription>
              Transfer your agency ownership to another administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferOwnershipDialog
              admins={admins}
              isLoadingAdmins={isLoadingAdmins}
              adminsError={adminsError}
              onTransfer={transferOwnership}
              isTransferring={isTransferring}
              onRefreshAdmins={refetchAdmins}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
