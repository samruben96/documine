/**
 * Owner Settings Hook
 * Story 20.5: Owner Management
 *
 * Provides state management for subscription info and ownership transfer
 * AC-20.5.1: Fetch subscription info
 * AC-20.5.5: Fetch admin list for transfer
 * AC-20.5.6: Execute transfer mutation
 */

import { useState, useCallback, useEffect } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

interface SubscriptionData {
  isOwner: boolean;
  plan?: string;
  billingCycle?: string;
  seatsUsed?: number;
  maxSeats?: number;
  billingContact?: {
    name: string;
    email: string;
    message: string;
  };
  ownerEmail?: string;
  message?: string;
}

interface TransferResult {
  transferred: boolean;
  previousOwner: {
    id: string;
    email: string;
    name: string | null;
  };
  newOwner: {
    id: string;
    email: string;
    name: string | null;
  };
  transferredAt: string;
}

interface UseOwnerSettingsReturn {
  // Subscription state
  subscription: SubscriptionData | null;
  isLoadingSubscription: boolean;
  subscriptionError: Error | null;
  refetchSubscription: () => Promise<void>;

  // Admin list for transfer
  admins: AdminUser[];
  isLoadingAdmins: boolean;
  adminsError: Error | null;
  refetchAdmins: () => Promise<void>;

  // Transfer mutation
  transferOwnership: (newOwnerId: string, password: string) => Promise<TransferResult>;
  isTransferring: boolean;
  transferError: Error | null;

  // Derived state
  isOwner: boolean;
  canTransfer: boolean;
}

/**
 * Hook for owner settings management
 *
 * Fetches subscription info and admin list on mount,
 * provides transfer mutation.
 *
 * @example
 * ```tsx
 * const {
 *   subscription,
 *   isLoadingSubscription,
 *   admins,
 *   transferOwnership,
 *   isOwner,
 * } = useOwnerSettings();
 * ```
 */
export function useOwnerSettings(): UseOwnerSettingsReturn {
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);

  // Admin list state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminsError, setAdminsError] = useState<Error | null>(null);

  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<Error | null>(null);

  // Fetch subscription info
  const fetchSubscription = useCallback(async () => {
    setIsLoadingSubscription(true);
    setSubscriptionError(null);

    try {
      const response = await fetch('/api/admin/subscription');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setSubscriptionError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Fetch admin list for transfer
  const fetchAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    setAdminsError(null);

    try {
      const response = await fetch('/api/admin/transfer-ownership');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (err) {
      setAdminsError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  // Execute ownership transfer
  const transferOwnership = useCallback(
    async (newOwnerId: string, password: string): Promise<TransferResult> => {
      setIsTransferring(true);
      setTransferError(null);

      try {
        const response = await fetch('/api/admin/transfer-ownership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newOwnerId, confirmPassword: password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Transfer failed');
        }

        const result = await response.json();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setTransferError(error);
        throw error;
      } finally {
        setIsTransferring(false);
      }
    },
    []
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Fetch admins when subscription indicates owner
  useEffect(() => {
    if (subscription?.isOwner) {
      fetchAdmins();
    }
  }, [subscription?.isOwner, fetchAdmins]);

  // Derived state
  const isOwner = subscription?.isOwner ?? false;
  const canTransfer = isOwner && admins.length > 0;

  return {
    // Subscription
    subscription,
    isLoadingSubscription,
    subscriptionError,
    refetchSubscription: fetchSubscription,

    // Admins
    admins,
    isLoadingAdmins,
    adminsError,
    refetchAdmins: fetchAdmins,

    // Transfer
    transferOwnership,
    isTransferring,
    transferError,

    // Derived
    isOwner,
    canTransfer,
  };
}
