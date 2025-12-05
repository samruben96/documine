# Detailed Design

## Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Agency Settings | View/edit agency configuration | Agency ID, form data | Updated agency record | `src/app/(dashboard)/settings/agency/page.tsx` |
| Team Management | List, invite, remove, change roles | Agency ID, user actions | Team updates | `src/app/(dashboard)/settings/team/page.tsx` |
| Invitation Service | Create, send, validate invitations | Email, role, agency ID | Invitation record, email | `src/lib/invitations/` |
| Billing Integration | Stripe Customer Portal redirect | User session | Portal URL | `src/app/(dashboard)/settings/billing/page.tsx` |
| Usage Metrics | Aggregate agency statistics | Agency ID | Metric counts | `src/app/(dashboard)/settings/usage/` |
| Settings Layout | Tab navigation, role gating | User session | Rendered tabs | `src/app/(dashboard)/settings/layout.tsx` |

## Data Models and Contracts

**New Table: Invitations**

```sql
-- Invitations table for pending user invites
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'cancelled' | 'expired'
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_invitations_agency ON invitations(agency_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

**Existing Tables Used:**

```sql
-- Agencies (from Epic 1) - no changes needed for MVP
-- Structure: id, name, subscription_tier, seat_limit, created_at, updated_at
-- Note: Stripe fields deferred to future "Billing Infrastructure Epic"

-- Users (from Epic 1) - no changes needed
-- Structure: id, agency_id, email, full_name, role, created_at, updated_at
```

**TypeScript Types:**

```typescript
// src/types/team.ts
export interface Invitation {
  id: string;
  agencyId: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'member';
  createdAt: Date;
}

export interface AgencySettings {
  id: string;
  name: string;
  subscriptionTier: 'starter' | 'professional' | 'agency';
  seatLimit: number;
  currentSeats: number;
  createdAt: Date;
  // Note: stripeCustomerId deferred to future "Billing Infrastructure Epic"
}

export interface UsageMetrics {
  documentsUploaded: { thisMonth: number; allTime: number };
  queriesAsked: { thisMonth: number; allTime: number };
  activeUsers: number; // Last 7 days
  storageUsedMB: number;
}

// Zod schemas
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateAgencySchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters').max(100),
});
```

## APIs and Interfaces

**Server Actions:**

```typescript
// src/app/(dashboard)/settings/actions.ts

// Agency Settings
export async function updateAgency(data: { name: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Validate input with Zod
  // 3. Update agencies table
  // 4. Return success/error
}

// Team Management
export async function inviteUser(data: { email: string; role: 'admin' | 'member' }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Check seat limit (current users + pending invites < seat_limit)
  // 3. Check if email already in agency or has pending invite
  // 4. Create invitation record (pending status)
  // 5. Call supabase.auth.admin.inviteUserByEmail() - uses Supabase built-in email
  //    Note: Per Epic 2 retro, NOT using Resend (needs custom domain)
  // 6. Return success/error
}

export async function cancelInvitation(invitationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Update invitation status to 'cancelled'
}

export async function resendInvitation(invitationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Reset expires_at to 7 days from now
  // 3. Re-send email via Resend
}

export async function removeTeamMember(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Cannot remove self
  // 3. Check if removing would leave no admins
  // 4. Delete user record (auth.admin.deleteUser via service role)
  // 5. Return success/error
}

export async function changeUserRole(userId: string, newRole: 'admin' | 'member'): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Cannot change own role
  // 3. If demoting admin, check if at least one other admin exists
  // 4. Update users.role
  // 5. Return success/error
}

// Billing (Display-only for MVP - per Epic 2 retro)
export async function getBillingInfo(): Promise<{
  tier: 'starter' | 'professional' | 'agency';
  seatLimit: number;
  currentSeats: number;
  // Note: No Stripe integration for MVP - tiers assigned manually
}> {
  // 1. Get agency from session
  // 2. Return subscription_tier, seat_limit, user count
}

// Manual tier assignment (admin only, for MVP)
export async function updateSubscriptionTier(tier: 'starter' | 'professional' | 'agency'): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify user is admin
  // 2. Update agencies.subscription_tier and seat_limit
  // 3. Check seat limit not exceeded by current users
  // Note: Per Epic 2 retro - no Stripe, manual assignment for MVP
}

// Usage Metrics
export async function getUsageMetrics(): Promise<UsageMetrics> {
  // 1. Get agency_id from session
  // 2. Aggregate queries for documents, chat_messages
  // 3. Count active users (activity in last 7 days)
  // 4. Calculate storage from Supabase Storage API
  // 5. Return metrics object
}
```

**Invitation Acceptance (Modified Signup Flow):**

```typescript
// src/app/(auth)/signup/page.tsx - Modified for invites

// Check for invite token in URL: /signup?invite=xxx
// If token present:
// 1. Validate token (exists, pending, not expired)
// 2. Pre-fill email (read-only)
// 3. Hide agency name field (joining existing agency)
// 4. On submit: Create user with invitation's agency_id and role
// 5. Mark invitation as 'accepted'
```

**API Routes:**

```typescript
// No API routes needed for MVP
// Per Epic 2 retro: Stripe webhooks deferred to future "Billing Infrastructure Epic"
// Tier changes are manual via updateSubscriptionTier() server action
```

## Workflows and Sequencing

**Invite User Flow:**

```
Admin clicks "Invite User"
    │
    ├─> Modal: Enter email, select role
    │
    └─> Submit → Server Action: inviteUser()
        │
        ├─> 1. Verify admin role
        │
        ├─> 2. Check seat limit
        │       SELECT COUNT(*) FROM users WHERE agency_id = $agency
        │       SELECT COUNT(*) FROM invitations WHERE agency_id = $agency AND status = 'pending'
        │       If total >= seat_limit → Error: "Seat limit reached"
        │
        ├─> 3. Check for duplicate
        │       If email in users or pending invitations → Error
        │
        ├─> 4. INSERT INTO invitations (agency_id, email, role, invited_by, expires_at, status)
        │       VALUES ($agency, $email, $role, $userId, now() + interval '7 days', 'pending')
        │       Store invitation_id for reference
        │
        ├─> 5. Call supabase.auth.admin.inviteUserByEmail(email, {
        │         redirectTo: `${APP_URL}/auth/callback?invitation_id=${invitation_id}`,
        │         data: { agency_id: $agency, role: $role, invitation_id: $id }
        │       })
        │       Note: Uses Supabase built-in email (per Epic 2 retro - NOT Resend)
        │
        └─> 6. Success toast: "Invitation sent to {email}"
```

**Accept Invitation Flow:**

```
Invitee clicks email link
    │
    ├─> /signup?invite={token}
    │
    └─> Page Load:
        │
        ├─> 1. Validate token
        │       SELECT * FROM invitations WHERE token = $token AND status = 'pending'
        │       If not found or expired → Error page
        │
        ├─> 2. Pre-fill form:
        │       Email: read-only from invitation
        │       Agency: hidden (joining existing)
        │       Show: "You've been invited to join {agency_name}"
        │
        └─> Submit → Modified signup flow:
            │
            ├─> 1. Create auth user
            │
            ├─> 2. Create user record with:
            │       agency_id = invitation.agency_id
            │       role = invitation.role
            │
            ├─> 3. UPDATE invitations SET status = 'accepted', accepted_at = now()
            │       WHERE id = $invitationId
            │
            └─> 4. Redirect to /documents
```

**Remove Team Member Flow:**

```
Admin clicks "Remove" on member
    │
    ├─> Confirmation modal:
    │   "Remove {name} from {agency}?"
    │   "They will lose access to all agency documents."
    │
    └─> Confirm → Server Action: removeTeamMember()
        │
        ├─> 1. Verify admin role
        │
        ├─> 2. Check not removing self
        │
        ├─> 3. Check admin count if target is admin
        │       SELECT COUNT(*) FROM users WHERE agency_id = $agency AND role = 'admin'
        │       If count = 1 and target is admin → Error: "Cannot remove last admin"
        │
        ├─> 4. Delete user record (cascade handled by FK)
        │
        ├─> 5. Delete auth user via Supabase admin API
        │
        └─> 6. Success toast: "Member removed"
```

**Billing Page Flow (Display-Only for MVP):**

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
