/**
 * useOnboardingStatus Hook
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Fetch user list with onboarding status
 * AC-18.4.4: Client-side filtering by status
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  OnboardingStatusEntry,
  OnboardingStatus,
} from '@/types/ai-buddy';
import { deriveOnboardingStatus } from '@/types/ai-buddy';

export type FilterStatus = 'all' | OnboardingStatus;

export interface UseOnboardingStatusReturn {
  /** All fetched users */
  users: OnboardingStatusEntry[] | null;
  /** Loading state */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Users filtered by current filter status */
  filteredUsers: OnboardingStatusEntry[];
  /** Current filter status */
  filterStatus: FilterStatus;
  /** Set the filter status */
  setFilterStatus: (status: FilterStatus) => void;
  /** Refetch data from API */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and filtering admin onboarding status data
 *
 * @example
 * ```tsx
 * const { users, filteredUsers, filterStatus, setFilterStatus, isLoading } = useOnboardingStatus();
 *
 * // Filter to only completed users
 * setFilterStatus('completed');
 * ```
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const [users, setUsers] = useState<OnboardingStatusEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-buddy/admin/onboarding-status');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setUsers(json.data?.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setUsers(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // AC-18.4.4: Client-side filtering - instant, no server round-trip
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (filterStatus === 'all') return users;

    return users.filter((user) => {
      const status = deriveOnboardingStatus(
        user.onboardingCompleted,
        user.onboardingSkipped
      );
      return status === filterStatus;
    });
  }, [users, filterStatus]);

  return {
    users,
    isLoading,
    error,
    filteredUsers,
    filterStatus,
    setFilterStatus,
    refetch: fetchUsers,
  };
}
