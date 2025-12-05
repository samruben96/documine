# Dev Notes

## Architecture Patterns & Constraints

**Billing Page Flow (Display-Only for MVP - per Tech Spec):**
```
Admin navigates to Billing tab
    │
    └─> Page Load → Server Action: getBillingInfo()
        │
        ├─> 1. Get agency subscription_tier, seat_limit
        │
        ├─> 2. Count current users in agency
        │
        └─> 3. Display:
            │   - Current Plan: {tier} (Starter/Professional/Agency)
            │   - Seats: {used}/{limit}
            │   - Features for current tier
            │   - "Contact support to change plan" message
            │
            Note: Per Epic 2 retro - No Stripe integration for MVP
            Tier changes handled manually by admin or support
```

**Plan Tier Definitions (from Tech Spec):**
```typescript
const PLAN_TIERS = {
  starter: { name: 'Starter', seatLimit: 3, price: '$X/mo' },
  professional: { name: 'Professional', seatLimit: 10, price: '$Y/mo' },
  agency: { name: 'Agency', seatLimit: 25, price: '$Z/mo' },
} as const;
```

**Key Design Decisions:**
- **No Stripe for MVP**: Per Epic 2 retrospective, billing integration deferred to future "Billing Infrastructure Epic"
- **Manual tier changes**: Admins can change tiers via server action (for internal/support use)
- **Display-only UI**: Users see their plan info but cannot self-serve upgrade
- **View-only for members**: Non-admins can see billing info but no actions

## Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── settings/
│       └── billing-tab.tsx       # Billing display component
├── lib/
│   └── constants/
│       └── plans.ts              # Plan tier definitions
```

**Existing Files to Modify:**
```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx          # Add Billing tab
│           └── actions.ts        # Add getBillingInfo, updateSubscriptionTier
```

## Learnings from Previous Story

**From Story 3-3-manage-team-members (Status: done)**

- **Server Actions Pattern**: Auth operations use Next.js server actions at `src/app/(dashboard)/settings/actions.ts`
- **Admin Check Pattern**: Query user role from users table, check `role === 'admin'` before allowing admin actions
- **Service Role Client**: Use `createServiceClient()` from `src/lib/supabase/server.ts` for privileged operations
- **Loading State Pattern**: Use `useTransition` for server action loading states
- **Revalidation Pattern**: Use `revalidatePath('/settings')` after mutations to refresh data
- **Tab Component Structure**: Settings page uses shadcn/ui Tabs with TabsList, TabsTrigger, TabsContent
- **View-only Mode**: Pass `isAdmin` prop to conditionally hide/disable action elements

**Key Files to Reference:**
- `documine/src/app/(dashboard)/settings/actions.ts` - Follow existing patterns
- `documine/src/app/(dashboard)/settings/page.tsx` - Tab structure and data fetching
- `documine/src/components/settings/team-tab.tsx` - View-only mode implementation
- `documine/src/components/settings/agency-tab.tsx` - Agency info display patterns

[Source: docs/sprint-artifacts/3-3-manage-team-members.md#Dev-Agent-Record]

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Story-3.4-Subscription-&-Billing-Management]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#APIs-and-Interfaces]
- [Source: docs/epics.md#Story-3.4-Subscription-&-Billing-Management]
- [Source: docs/sprint-artifacts/3-3-manage-team-members.md#Dev-Notes]

## Technical Notes

**Server Action Pattern (getBillingInfo):**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getBillingInfo(): Promise<{
  tier: 'starter' | 'professional' | 'agency';
  seatLimit: number;
  currentSeats: number;
  agencyName: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get user's agency
  const { data: userData } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!userData?.agency_id) {
    throw new Error('No agency found');
  }

  // Get agency details
  const { data: agency } = await supabase
    .from('agencies')
    .select('name, subscription_tier, seat_limit')
    .eq('id', userData.agency_id)
    .single();

  // Count current users
  const { count: currentSeats } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', userData.agency_id);

  return {
    tier: agency?.subscription_tier as 'starter' | 'professional' | 'agency',
    seatLimit: agency?.seat_limit ?? 3,
    currentSeats: currentSeats ?? 0,
    agencyName: agency?.name ?? '',
  };
}
```

**Server Action Pattern (updateSubscriptionTier):**
```typescript
export async function updateSubscriptionTier(
  tier: 'starter' | 'professional' | 'agency'
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get current user's role and agency
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    return { success: false, error: 'Only admins can change subscription tier' };
  }

  const agencyId = currentUser.agency_id;

  // Map tier to seat limit
  const seatLimits = { starter: 3, professional: 10, agency: 25 };
  const newSeatLimit = seatLimits[tier];

  // Check current user count
  const { count: currentSeats } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  if ((currentSeats ?? 0) > newSeatLimit) {
    return {
      success: false,
      error: `Cannot downgrade to ${tier}. Current users (${currentSeats}) exceed the ${newSeatLimit} seat limit.`,
    };
  }

  // Update tier and seat limit
  const { error: updateError } = await supabase
    .from('agencies')
    .update({
      subscription_tier: tier,
      seat_limit: newSeatLimit,
    })
    .eq('id', agencyId);

  if (updateError) {
    return { success: false, error: 'Failed to update subscription tier' };
  }

  revalidatePath('/settings');
  return { success: true };
}
```

**BillingTab Component Pattern:**
```typescript
// src/components/settings/billing-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BillingTabProps {
  tier: 'starter' | 'professional' | 'agency';
  seatLimit: number;
  currentSeats: number;
  isAdmin: boolean;
}

const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    description: 'For small agencies getting started',
    features: ['Up to 3 team members', 'Basic document Q&A', 'Standard support'],
  },
  professional: {
    name: 'Professional',
    description: 'For growing agencies',
    features: ['Up to 10 team members', 'Advanced document Q&A', 'Quote comparison', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    description: 'For larger teams',
    features: ['Up to 25 team members', 'Full feature access', 'Dedicated support'],
  },
};

export function BillingTab({ tier, seatLimit, currentSeats, isAdmin }: BillingTabProps) {
  const plan = PLAN_FEATURES[tier];
  const usagePercent = (currentSeats / seatLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{plan.name}</div>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center text-sm text-muted-foreground">
                <span className="mr-2">✓</span> {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Seat Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Usage</CardTitle>
          <CardDescription>{currentSeats} of {seatLimit} seats used</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Change Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To upgrade or change your plan, please contact our support team at{' '}
            <a href="mailto:support@documine.com" className="text-primary hover:underline">
              support@documine.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```
