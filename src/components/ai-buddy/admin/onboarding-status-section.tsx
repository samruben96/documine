/**
 * OnboardingStatusSection Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.1: Admin section in AI Buddy settings tab
 * AC-18.4.5: Only renders for admin users
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users } from 'lucide-react';
import { OnboardingStatusTable } from './onboarding-status-table';
import { useOnboardingStatus } from '@/hooks/ai-buddy/use-onboarding-status';

interface OnboardingStatusSectionProps {
  /** Whether the current user is an admin */
  isAdmin: boolean;
}

/**
 * Admin section for viewing user onboarding status
 *
 * Only renders when isAdmin is true.
 *
 * @example
 * ```tsx
 * <OnboardingStatusSection isAdmin={isAdmin} />
 * ```
 */
export function OnboardingStatusSection({ isAdmin }: OnboardingStatusSectionProps) {
  const {
    filteredUsers,
    isLoading,
    error,
    filterStatus,
    setFilterStatus,
    refetch,
  } = useOnboardingStatus();

  // AC-18.4.5: Only render for admins
  if (!isAdmin) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <Card className="mt-6" data-testid="onboarding-status-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Onboarding Status
          </CardTitle>
          <CardDescription>
            View AI Buddy onboarding completion for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" data-testid="onboarding-status-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load onboarding status: {error.message}
              <button
                onClick={refetch}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6" data-testid="onboarding-status-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Onboarding Status
        </CardTitle>
        <CardDescription>
          View AI Buddy onboarding completion for your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingStatusTable
          users={filteredUsers}
          isLoading={isLoading}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />
      </CardContent>
    </Card>
  );
}
