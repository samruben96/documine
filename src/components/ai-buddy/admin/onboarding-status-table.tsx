/**
 * OnboardingStatusTable Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Display table showing each user's onboarding status
 * AC-18.4.3: Show Name, Email, Status badge, Completion Date
 * AC-18.4.4: Filter buttons above table
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { OnboardingStatusBadge } from './onboarding-status-badge';
import type { OnboardingStatusEntry } from '@/types/ai-buddy';
import type { FilterStatus } from '@/hooks/ai-buddy/use-onboarding-status';

interface OnboardingStatusTableProps {
  /** Filtered list of users to display */
  users: OnboardingStatusEntry[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Current filter status */
  filterStatus: FilterStatus;
  /** Callback to change filter */
  onFilterChange: (status: FilterStatus) => void;
}

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'not_started', label: 'Not Started' },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Table component displaying user onboarding status with filter buttons
 */
export function OnboardingStatusTable({
  users,
  isLoading,
  filterStatus,
  onFilterChange,
}: OnboardingStatusTableProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="onboarding-status-loading">
        {/* Filter button skeletons */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AC-18.4.4: Filter buttons */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by onboarding status"
        data-testid="onboarding-status-filters"
      >
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filterStatus === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            data-testid={`filter-${option.value}`}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Empty state */}
      {users.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-center"
          data-testid="onboarding-status-empty"
        >
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            {filterStatus === 'all'
              ? 'No users found'
              : `No users with "${filterOptions.find((o) => o.value === filterStatus)?.label}" status`}
          </p>
          {filterStatus !== 'all' && (
            <Button
              variant="link"
              size="sm"
              onClick={() => onFilterChange('all')}
              className="mt-2"
            >
              Clear filter
            </Button>
          )}
        </div>
      ) : (
        <Table data-testid="onboarding-status-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userId} data-testid={`user-row-${user.userId}`}>
                <TableCell className="font-medium">
                  {user.fullName || 'No name set'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <OnboardingStatusBadge
                    onboardingCompleted={user.onboardingCompleted}
                    onboardingSkipped={user.onboardingSkipped}
                  />
                </TableCell>
                <TableCell>{formatDate(user.onboardingCompletedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
