# Tasks / Subtasks

- [x] **Task 1: Create BillingTab component** (AC: 3.4.1, 3.4.2, 3.4.3, 3.4.5)
  - [x] Create `src/components/settings/billing-tab.tsx`
  - [x] Accept props: `tier`, `seatLimit`, `currentSeats`, `isAdmin`
  - [x] Display current plan name (Starter/Professional/Agency)
  - [x] Display seat usage with progress bar (X of Y seats used)
  - [x] Display plan features summary section
  - [x] Display "Contact support" message with email link
  - [x] Show view-only mode for non-admins (same content, no actions)

- [x] **Task 2: Add getBillingInfo server action** (AC: 3.4.1, 3.4.2)
  - [x] Add `getBillingInfo()` to `src/app/(dashboard)/settings/actions.ts`
  - [x] Query agency for subscription_tier, seat_limit
  - [x] Count current users in agency
  - [x] Return structured billing info object
  - [x] Handle authentication and agency lookup

- [x] **Task 3: Add updateSubscriptionTier server action** (AC: 3.4.6)
  - [x] Add `updateSubscriptionTier(tier: 'starter' | 'professional' | 'agency')` to actions.ts
  - [x] Verify current user is admin
  - [x] Map tier to seat limit (starter: 3, professional: 10, agency: 25)
  - [x] Check current user count doesn't exceed new seat limit
  - [x] Update agencies.subscription_tier and agencies.seat_limit
  - [x] Return success/error response

- [x] **Task 4: Define plan features and tier mapping** (AC: 3.4.2)
  - [x] Create `src/lib/constants/plans.ts` with tier definitions
  - [x] Define PLAN_TIERS constant with name, seatLimit, features for each tier
  - [x] Export helper functions for tier lookup

- [x] **Task 5: Integrate BillingTab into settings page** (AC: 3.4.1, 3.4.5)
  - [x] Import BillingTab in `src/app/(dashboard)/settings/page.tsx`
  - [x] Replace ComingSoonTab with BillingTab
  - [x] Pass tier, seatLimit, currentSeats, isAdmin props to BillingTab

- [x] **Task 6: Add unit tests for billing actions** (AC: 3.4.1, 3.4.6)
  - [x] Test getBillingInfo returns correct structure
  - [x] Test updateSubscriptionTier requires admin role
  - [x] Test updateSubscriptionTier blocks downgrade when over seat limit
  - [x] Test updateSubscriptionTier updates both tier and seat_limit

- [x] **Task 7: Build and test verification** (All ACs)
  - [x] Verify `npm run build` succeeds
  - [x] Verify all tests pass (271 tests)
  - [ ] Manual test: admin can view billing info
  - [ ] Manual test: member sees view-only billing tab
  - [ ] Manual test: tier change via server action works
