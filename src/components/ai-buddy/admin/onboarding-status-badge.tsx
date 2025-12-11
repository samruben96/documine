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

/**
 * Status configuration using DR.7 status variants:
 * - completed → status-success (green)
 * - skipped → status-progress (amber)
 * - not_started → status-default (slate)
 */
const statusConfig: Record<
  OnboardingStatus,
  { label: string; variant: 'status-success' | 'status-progress' | 'status-default' }
> = {
  completed: {
    label: 'Completed',
    variant: 'status-success',
  },
  skipped: {
    label: 'Skipped',
    variant: 'status-progress',
  },
  not_started: {
    label: 'Not Started',
    variant: 'status-default',
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
      variant={config.variant}
      data-testid={`onboarding-status-badge-${status}`}
    >
      {config.label}
    </Badge>
  );
}
