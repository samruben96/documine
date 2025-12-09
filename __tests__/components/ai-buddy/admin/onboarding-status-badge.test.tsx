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
  it('renders "Completed" badge with green styling for completed users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={true} onboardingSkipped={false} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-completed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Completed');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders "Skipped" badge with yellow styling for skipped users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={true} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-skipped');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Skipped');
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('renders "Not Started" badge with gray styling for not started users', () => {
    render(
      <OnboardingStatusBadge onboardingCompleted={false} onboardingSkipped={false} />
    );

    const badge = screen.getByTestId('onboarding-status-badge-not_started');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Not Started');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-600');
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
