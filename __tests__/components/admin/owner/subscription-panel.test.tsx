/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - SubscriptionPanel Component
 * Story 20.5: Owner Management
 *
 * AC-20.5.1: Owner sees plan name, billing cycle, seat allocation
 * AC-20.5.2: Owner sees billing contact information
 * AC-20.5.3: Non-owner admin sees owner contact message
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionPanel } from '@/components/admin/owner/subscription-panel';

describe('SubscriptionPanel', () => {
  const ownerSubscription = {
    isOwner: true,
    plan: 'Professional',
    billingCycle: 'monthly',
    seatsUsed: 3,
    maxSeats: 5,
    billingContact: {
      name: 'Archway Computer',
      email: 'billing@archwaycomputer.com',
      message: 'For billing inquiries, contact Archway Computer.',
    },
  };

  const nonOwnerSubscription = {
    isOwner: false,
    ownerEmail: 'owner@example.com',
    message: 'Contact agency owner (owner@example.com) for subscription information.',
  };

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(
        <SubscriptionPanel
          subscription={null}
          isLoading={true}
          error={null}
        />
      );
      expect(screen.getByTestId('subscription-panel-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when error is present', () => {
      render(
        <SubscriptionPanel
          subscription={null}
          isLoading={false}
          error={new Error('Failed to load')}
        />
      );
      expect(screen.getByTestId('subscription-panel-error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const mockRetry = vi.fn();
      render(
        <SubscriptionPanel
          subscription={null}
          isLoading={false}
          error={new Error('Failed to load')}
          onRetry={mockRetry}
        />
      );
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  describe('Non-Owner View (AC-20.5.3)', () => {
    it('shows owner contact message for non-owners', () => {
      render(
        <SubscriptionPanel
          subscription={nonOwnerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('subscription-panel-non-owner')).toBeInTheDocument();
      expect(screen.getByText(/owner@example.com/)).toBeInTheDocument();
    });

    it('does not show plan details for non-owners', () => {
      render(
        <SubscriptionPanel
          subscription={nonOwnerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.queryByTestId('plan-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seat-usage')).not.toBeInTheDocument();
    });
  });

  describe('Owner View (AC-20.5.1)', () => {
    it('displays plan name', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('plan-name')).toHaveTextContent('Professional');
    });

    it('displays billing cycle', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('billing-cycle')).toHaveTextContent(/monthly/i);
    });

    it('displays seat allocation', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('seat-usage')).toHaveTextContent('3 / 5 seats used');
    });

    it('displays progress bar', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('seat-progress')).toBeInTheDocument();
    });
  });

  describe('Seat Limit Warning', () => {
    it('shows warning when near seat limit (80%+)', () => {
      const nearLimitSubscription = {
        ...ownerSubscription,
        seatsUsed: 4,
        maxSeats: 5,
      };
      render(
        <SubscriptionPanel
          subscription={nearLimitSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByText(/approaching your seat limit/i)).toBeInTheDocument();
    });

    it('shows error when at seat limit (100%)', () => {
      const atLimitSubscription = {
        ...ownerSubscription,
        seatsUsed: 5,
        maxSeats: 5,
      };
      render(
        <SubscriptionPanel
          subscription={atLimitSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByText(/reached your seat limit/i)).toBeInTheDocument();
    });
  });

  describe('Billing Contact (AC-20.5.2)', () => {
    it('displays billing contact message', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByTestId('billing-contact')).toBeInTheDocument();
      expect(screen.getByText(/contact Archway Computer/i)).toBeInTheDocument();
    });

    it('displays billing email link', () => {
      render(
        <SubscriptionPanel
          subscription={ownerSubscription}
          isLoading={false}
          error={null}
        />
      );
      const emailLink = screen.getByTestId('billing-email-link');
      expect(emailLink).toHaveAttribute('href', 'mailto:billing@archwaycomputer.com');
    });
  });

  describe('Null State', () => {
    it('returns null when subscription is null and not loading', () => {
      const { container } = render(
        <SubscriptionPanel
          subscription={null}
          isLoading={false}
          error={null}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
