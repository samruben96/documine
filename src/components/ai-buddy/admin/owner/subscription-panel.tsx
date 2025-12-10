/**
 * SubscriptionPanel Component
 * Story 20.5: Owner Management
 *
 * Displays subscription information for agency
 * AC-20.5.1: Owner sees plan name, billing cycle, seat allocation
 * AC-20.5.2: Owner sees billing contact information
 * AC-20.5.3: Non-owner admin sees owner contact message
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Mail, AlertCircle, Crown } from 'lucide-react';

interface SubscriptionPanelProps {
  /** Subscription data from API */
  subscription: {
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
  } | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: Error | null;
  /** Retry function */
  onRetry?: () => void;
}

/**
 * Subscription information panel for admin section
 *
 * @example
 * ```tsx
 * <SubscriptionPanel
 *   subscription={subscriptionData}
 *   isLoading={isLoadingSubscription}
 *   error={subscriptionError}
 *   onRetry={refetchSubscription}
 * />
 * ```
 */
export function SubscriptionPanel({
  subscription,
  isLoading,
  error,
  onRetry,
}: SubscriptionPanelProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <Card data-testid="subscription-panel-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-16 flex-1" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card data-testid="subscription-panel-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>View your agency subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load subscription: {error.message}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="ml-2 underline hover:no-underline"
                >
                  Try again
                </button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No data yet
  if (!subscription) {
    return null;
  }

  // Non-owner view (AC-20.5.3)
  if (!subscription.isOwner) {
    return (
      <Card data-testid="subscription-panel-non-owner">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Agency subscription information</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Contact agency owner ({subscription.ownerEmail}) for subscription information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Owner view (AC-20.5.1, AC-20.5.2)
  const seatUsagePercent = subscription.maxSeats
    ? Math.round((subscription.seatsUsed! / subscription.maxSeats) * 100)
    : 0;

  const isNearLimit = seatUsagePercent >= 80;
  const isAtLimit = seatUsagePercent >= 100;

  return (
    <Card data-testid="subscription-panel">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Your agency subscription details</CardDescription>
          </div>
          <Badge variant="secondary" data-testid="plan-badge">
            {subscription.plan}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan details (AC-20.5.1) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium" data-testid="plan-name">
              {subscription.plan}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Billing Cycle</p>
            <p className="font-medium capitalize" data-testid="billing-cycle">
              {subscription.billingCycle}
            </p>
          </div>
        </div>

        {/* Seat allocation (AC-20.5.1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              Seat Allocation
            </span>
            <span
              data-testid="seat-usage"
              className={isAtLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-600 font-medium' : ''}
            >
              {subscription.seatsUsed} / {subscription.maxSeats} seats used
            </span>
          </div>
          <Progress
            value={Math.min(seatUsagePercent, 100)}
            className={isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}
            data-testid="seat-progress"
          />
          {isAtLimit && (
            <p className="text-xs text-destructive">
              You&apos;ve reached your seat limit. Contact Archway Computer to upgrade.
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-amber-600">
              You&apos;re approaching your seat limit.
            </p>
          )}
        </div>

        {/* Billing contact (AC-20.5.2) */}
        <Alert className="bg-muted/50" data-testid="billing-contact">
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{subscription.billingContact?.message}</p>
            <a
              href={`mailto:${subscription.billingContact?.email}`}
              className="text-primary underline hover:no-underline mt-1 inline-block"
              data-testid="billing-email-link"
            >
              {subscription.billingContact?.email}
            </a>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
