/**
 * OnboardingStatusBadge Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.3: Display status badges with appropriate colors
 */

'use client';

import { Badge } from '@/components/ui/badge';
import type { OnboardingStatus } from '@/types/ai-buddy';
import { deriveOnboardingStatus } from '@/types/ai-buddy';

interface OnboardingStatusBadgeProps {
  /** Whether onboarding is completed */
  onboardingCompleted: boolean;
  /** Whether onboarding was skipped */
  onboardingSkipped: boolean;
}

const statusConfig: Record<
  OnboardingStatus,
  { label: string; className: string }
> = {
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  not_started: {
    label: 'Not Started',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
};

/**
 * Badge displaying onboarding completion status
 *
 * @example
 * ```tsx
 * <OnboardingStatusBadge onboardingCompleted={true} onboardingSkipped={false} />
 * // Renders: Green "Completed" badge
 *
 * <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={true} />
 * // Renders: Yellow "Skipped" badge
 *
 * <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={false} />
 * // Renders: Gray "Not Started" badge
 * ```
 */
export function OnboardingStatusBadge({
  onboardingCompleted,
  onboardingSkipped,
}: OnboardingStatusBadgeProps) {
  const status = deriveOnboardingStatus(onboardingCompleted, onboardingSkipped);
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={config.className}
      data-testid={`onboarding-status-badge-${status}`}
    >
      {config.label}
    </Badge>
  );
}
