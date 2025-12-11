/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - OnboardingStatusBadge Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.3: Status badges with appropriate colors
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingStatusBadge } from '@/components/ai-buddy/admin/onboarding-status-badge';

describe('OnboardingStatusBadge', () => {
  // DR.7: Updated to use status variants for consistent badge styling
  it('renders "Completed" badge with status-success variant (green) for completed users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={true} onboardingSkipped={false} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-completed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Completed');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('renders "Skipped" badge with status-progress variant (amber) for skipped users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={true} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-skipped');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Skipped');
    expect(badge).toHaveClass('bg-amber-100');
    expect(badge).toHaveClass('text-amber-700');
  });

  it('renders "Not Started" badge with status-default variant (slate) for not started users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={false} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-not_started');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Not Started');
    expect(badge).toHaveClass('bg-slate-100');
    expect(badge).toHaveClass('text-slate-600');
  });

  it('prioritizes completed over skipped when both are true', () => {
    // Edge case: if somehow both are true, completed should win
    render(
      <OnboardingStatusBadge onboardingCompleted={true} onboardingSkipped={true} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-completed');
    expect(badge).toHaveTextContent('Completed');
  });
});
