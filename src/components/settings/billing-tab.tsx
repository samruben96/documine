'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PLAN_TIERS, type PlanTier } from '@/lib/constants/plans';
import { CheckCircle2 } from 'lucide-react';

interface BillingTabProps {
  tier: PlanTier;
  seatLimit: number;
  currentSeats: number;
  isAdmin: boolean;
}

/**
 * Billing Tab Component
 * Per AC-3.4.1: Shows current plan, seat usage with progress bar
 * Per AC-3.4.2: Displays plan features summary
 * Per AC-3.4.3: Shows "Contact support" message for plan changes
 * Per AC-3.4.5: View-only mode for non-admins (same content, no actions)
 */
export function BillingTab({ tier, seatLimit, currentSeats, isAdmin }: BillingTabProps) {
  const plan = PLAN_TIERS[tier];
  const usagePercent = seatLimit > 0 ? Math.min((currentSeats / seatLimit) * 100, 100) : 0;

  // View-only indicator for non-admins (per AC-3.4.5)
  // Currently, both views show the same content since no self-service actions exist

  return (
    <div className="space-y-6 mt-6">
      {/* Current Plan Card - Per AC-3.4.1, AC-3.4.2 */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{plan.name}</div>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Seat Usage Card - Per AC-3.4.1 */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Usage</CardTitle>
          <CardDescription>
            {currentSeats} of {seatLimit} seats used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercent} className="h-2" />
          {usagePercent >= 100 && (
            <p className="text-sm text-amber-600 mt-2">
              You have reached your seat limit. Contact support to upgrade.
            </p>
          )}
          {usagePercent >= 80 && usagePercent < 100 && (
            <p className="text-sm text-slate-500 mt-2">
              You are approaching your seat limit.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Card - Per AC-3.4.3 */}
      <Card>
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            To upgrade, downgrade, or change your plan, please contact our support team at{' '}
            <a
              href="mailto:support@documine.com"
              className="text-blue-600 hover:underline font-medium"
            >
              support@documine.com
            </a>
          </p>
          {!isAdmin && (
            <p className="text-sm text-slate-500 mt-2 italic">
              Only agency admins can request plan changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
