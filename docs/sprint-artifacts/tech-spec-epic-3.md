# Epic Technical Specification: Agency & Team Management

Date: 2025-11-28
Author: Sam
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 delivers the complete agency and team management system for docuMINE. This epic enables agency admins to configure their organization settings, invite team members, manage user access, handle subscription billing, and view usage metrics. This is the B2B multi-user capability that differentiates docuMINE from single-user tools.

Building on the authentication foundation from Epic 2, this epic extends the multi-tenant architecture by implementing the admin-specific features that allow agencies to scale from a single user to a full team. The seat-based subscription model is enforced at the database level, and all team management operations respect the existing RLS policies for agency isolation.

## Objectives and Scope

**In Scope:**
- Agency settings page (view/edit agency name, view subscription info)
- Team member list with role display
- User invitation system using Supabase `auth.admin.inviteUserByEmail()` (NOT Resend - per Epic 2 retro)
- Pending invitation management (resend, cancel)
- Team member removal with confirmation
- Role management (admin ↔ member toggle)
- Subscription & billing page (display-only for MVP - no Stripe integration per Epic 2 retro)
- Manual tier assignment by admin (no payment processing)
- Seat limit enforcement before invitations
- Agency usage metrics dashboard (documents, queries, users, storage)
- Settings page tab completion (Profile from Epic 2, Agency, Team, Billing tabs)

**Out of Scope (per Epic 2 Retrospective decisions):**
- Stripe/payment integration - deferred to future "Billing Infrastructure Epic"
- Resend email integration - deferred to future "Email Infrastructure Epic" (needs custom domain)
- Custom roles beyond admin/member - MVP uses two roles only
- Department-level document access controls - deferred to post-MVP
- Usage-based pricing/metering - MVP is seat-based only
- White-label/custom branding - deferred to post-MVP
- Audit logs of team changes - deferred to post-MVP
- Bulk user import - manual invites only for MVP

## System Architecture Alignment

**Components Referenced:**
- Supabase PostgreSQL with RLS policies for agency isolation
- Supabase Auth for user management (including `auth.admin.inviteUserByEmail()`)
- Next.js 15 App Router with Server Actions
- Supabase built-in email for invitations (NOT Resend - needs custom domain per Epic 2 retro)
- React Hook Form + Zod for form validation

**Architecture Constraints:**
- All team operations scoped by `agency_id` via RLS
- Seat limits enforced at invitation time (check before creating invite)
- At least one admin must remain per agency (cannot remove last admin)
- Invitation tokens managed by Supabase Auth (7-day expiry)
- Subscription tiers assigned manually for MVP (no payment integration)
- Only admins can access Agency, Team, and Billing tabs

**Epic 2 Retrospective Learnings Applied:**
- Use `auth.admin.inviteUserByEmail()` instead of custom Resend integration
- Display-only billing page - no Stripe for MVP
- Continue React Hook Form + Zod + Server Actions pattern
- Document Zod v4 `.issues` API pattern (not `.errors`)

**Key Decisions Applied:**
- ADR-001: Supabase-Native for unified auth + data
- ADR-004: Row Level Security for agency isolation
- UX Principle: Clean tab layout for settings, admin-only actions clearly gated

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Agency Settings | View/edit agency configuration | Agency ID, form data | Updated agency record | `src/app/(dashboard)/settings/agency/page.tsx` |
| Team Management | List, invite, remove, change roles | Agency ID, user actions | Team updates | `src/app/(dashboard)/settings/team/page.tsx` |
| Invitation Service | Create, send, validate invitations | Email, role, agency ID | Invitation record, email | `src/lib/invitations/` |
| Billing Integration | Stripe Customer Portal redirect | User session | Portal URL | `src/app/(dashboard)/settings/billing/page.tsx` |
| Usage Metrics | Aggregate agency statistics | Agency ID | Metric counts | `src/app/(dashboard)/settings/usage/` |
| Settings Layout | Tab navigation, role gating | User session | Rendered tabs | `src/app/(dashboard)/settings/layout.tsx` |

### Data Models and Contracts

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

### APIs and Interfaces

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

### Workflows and Sequencing

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

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Team list load | < 500ms | Single query with user count |
| Invitation send | < 3s | Background email, optimistic UI |
| Metrics calculation | < 2s | Aggregate queries, consider caching |
| Role change | < 500ms | Simple UPDATE |

### Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Admin-only operations | Server-side role check before all admin actions | FR5, FR6, FR7 |
| Invitation token security | Managed by Supabase Auth (secure token generation) | Best practice |
| Seat limit enforcement | Database-level check before invite creation | FR30 |
| Cross-agency protection | RLS policies on all tables | Architecture |
| Service role key protection | Server-side only for `auth.admin` calls | Supabase docs |

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Invitation email delivery | 99% within 60 seconds | Supabase built-in email SLA |
| Team operations | Atomic with rollback | Database transactions |
| Auth admin API availability | 99.9% | Supabase managed service |

### Observability

| Signal | Implementation |
|--------|----------------|
| Invitations sent | Log: agency_id, email (hashed), invited_by |
| Role changes | Log: agency_id, user_id, old_role, new_role |
| Member removals | Log: agency_id, removed_user_id, removed_by |
| Tier changes | Log: agency_id, old_tier, new_tier (manual changes) |

## Dependencies and Integrations

### NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database + Auth + Admin API |
| @supabase/ssr | ^0.7.0 | Server-side Supabase |
| zod | ^4.1.13 | Validation (use `.issues` not `.errors` per Epic 2 learning) |
| react-hook-form | ^7.66.1 | Form handling |

### New Dependencies Required

**None** - All required packages already installed.

Per Epic 2 retro:
- No Stripe integration for MVP (deferred to "Billing Infrastructure Epic")
- No Resend integration for MVP (deferred to "Email Infrastructure Epic" - needs custom domain)

### External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase Auth | User management + `auth.admin.inviteUserByEmail()` | Already configured |
| Supabase Email | Invitation emails (built-in) | Already configured |

### Environment Variables (New)

**None required for Epic 3** - All environment variables already configured from Epic 1/2.

Note: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured for server-side `auth.admin` API calls (should already exist from Epic 1).

## Acceptance Criteria (Authoritative)

### Story 3.1: Agency Settings Page

1. **AC-3.1.1:** Agency tab displays: Agency name (editable), Subscription tier, Seat limit, Current usage, Created date
2. **AC-3.1.2:** Agency name update validates 2-100 characters
3. **AC-3.1.3:** Save shows success toast: "Agency settings updated"
4. **AC-3.1.4:** Non-admin users see Agency tab but cannot edit (view-only)

### Story 3.2: Invite Users to Agency

5. **AC-3.2.1:** "Invite User" button opens modal with email field and role selector (Member/Admin)
6. **AC-3.2.2:** System checks seat limit before allowing invite
7. **AC-3.2.3:** At seat limit shows error: "Seat limit reached. Upgrade to add more users."
8. **AC-3.2.4:** Duplicate email (existing user or pending invite) shows error
9. **AC-3.2.5:** Invitation email sent via Supabase built-in email with invite link (NOT Resend per Epic 2 retro)
10. **AC-3.2.6:** Email subject: "You've been invited to join {agency_name} on docuMINE"
11. **AC-3.2.7:** Pending invitations displayed with email, role, invited date, status
12. **AC-3.2.8:** "Resend" action re-sends email and extends expiry
13. **AC-3.2.9:** "Cancel" action marks invitation as cancelled
14. **AC-3.2.10:** Invitee signup with token joins existing agency with invited role

### Story 3.3: Manage Team Members

15. **AC-3.3.1:** Team tab displays all agency users: Name, Email, Role, Joined date
16. **AC-3.3.2:** "Remove" button shows confirmation modal
17. **AC-3.3.3:** Confirmation text: "Remove {name} from {agency}? They will lose access to all agency documents."
18. **AC-3.3.4:** Cannot remove yourself (button disabled or not shown)
19. **AC-3.3.5:** Cannot remove if it would leave no admins
20. **AC-3.3.6:** Role toggle (Admin ↔ Member) available for each member
21. **AC-3.3.7:** Cannot change your own role
22. **AC-3.3.8:** Non-admin users see Team tab in view-only mode

### Story 3.4: Subscription & Billing Management (Display-Only for MVP)

23. **AC-3.4.1:** Billing tab shows: Current plan name, Seat limit, Current usage (X/Y seats used)
24. **AC-3.4.2:** Plan tier displayed with feature summary (Starter: 3 seats, Professional: 10 seats, Agency: 25 seats)
25. **AC-3.4.3:** "Contact support to change plan" message displayed (no self-service for MVP)
26. **AC-3.4.4:** ~~Stripe integration~~ DEFERRED per Epic 2 retro - future "Billing Infrastructure Epic"
27. **AC-3.4.5:** Non-admin users see Billing tab in view-only mode
28. **AC-3.4.6:** Admin can manually change tier via `updateSubscriptionTier()` (internal use only for MVP)

### Story 3.5: Agency Usage Metrics

29. **AC-3.5.1:** Usage section shows: Documents uploaded (this month/all time)
30. **AC-3.5.2:** Usage section shows: Queries asked (this month/all time)
31. **AC-3.5.3:** Usage section shows: Active users (last 7 days)
32. **AC-3.5.4:** Usage section shows: Storage used (MB/GB)
33. **AC-3.5.5:** Metrics refresh on page load
34. **AC-3.5.6:** Non-admin users do not see agency-wide metrics

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-3.1.1 | Agency Settings | `/settings/agency/page.tsx` | Verify all fields display |
| AC-3.1.2 | Agency Settings | Form validation | Enter 1-char name, verify rejection |
| AC-3.1.3 | Agency Settings | Server action | Update name, verify toast |
| AC-3.1.4 | Agency Settings | Role check | Login as member, verify edit disabled |
| AC-3.2.1 | Invite User | Modal component | Click invite, verify modal opens |
| AC-3.2.2 | Invite User | Server action | Mock full seats, attempt invite |
| AC-3.2.3 | Invite User | Error handling | Verify seat limit error message |
| AC-3.2.4 | Invite User | Validation | Invite existing email, verify error |
| AC-3.2.5 | Invite User | Supabase Auth admin API | Verify email sent via `auth.admin.inviteUserByEmail()` |
| AC-3.2.6 | Invite User | Email template | Check email subject line |
| AC-3.2.7 | Invite User | Pending list | Verify invitation displays |
| AC-3.2.8 | Invite User | Resend action | Click resend, verify new expiry |
| AC-3.2.9 | Invite User | Cancel action | Cancel invite, verify status |
| AC-3.2.10 | Accept Invite | Signup flow | Use invite link, verify joins agency |
| AC-3.3.1 | Team Management | Team list | Verify all member fields display |
| AC-3.3.2 | Team Management | Remove button | Click remove, verify modal |
| AC-3.3.3 | Team Management | Confirmation | Verify confirmation text |
| AC-3.3.4 | Team Management | Self-removal | Verify cannot remove self |
| AC-3.3.5 | Team Management | Admin check | Try remove last admin, verify blocked |
| AC-3.3.6 | Team Management | Role toggle | Change role, verify update |
| AC-3.3.7 | Team Management | Self-role | Verify cannot change own role |
| AC-3.3.8 | Team Management | Member view | Login as member, verify view-only |
| AC-3.4.1 | Billing | Billing tab | Verify plan name, seat limit, usage display |
| AC-3.4.2 | Billing | Plan features | Verify tier feature summary shows |
| AC-3.4.3 | Billing | Contact message | Verify "Contact support" message displays |
| AC-3.4.4 | Billing | N/A | DEFERRED - Stripe integration |
| AC-3.4.5 | Billing | Role check | Login as member, verify view-only |
| AC-3.4.6 | Billing | Manual tier change | Test `updateSubscriptionTier()` action |
| AC-3.5.1 | Usage Metrics | Metrics display | Verify document counts |
| AC-3.5.2 | Usage Metrics | Metrics display | Verify query counts |
| AC-3.5.3 | Usage Metrics | Active users | Verify user count calculation |
| AC-3.5.4 | Usage Metrics | Storage | Verify storage display |
| AC-3.5.5 | Usage Metrics | Refresh | Reload page, verify metrics update |
| AC-3.5.6 | Usage Metrics | Role check | Login as member, verify no metrics |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: Supabase email delivery issues | Users don't receive invites | Medium | Supabase built-in email may have deliverability limits; provide resend option |
| R2: Service role key exposure | Unauthorized admin operations | Low | Server-side only, never expose to client |
| R3: Email delivery to spam | Users don't see invites | Medium | Resend option in UI, check spam instructions |
| R4: Concurrent seat modifications | Over-invitation | Low | Database-level seat check in transaction |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Three subscription tiers sufficient for MVP | PRD specifies Starter/Professional/Agency |
| A2: Manual tier assignment acceptable for MVP | Per Epic 2 retro - Stripe deferred to future epic |
| A3: Supabase built-in email sufficient for invitations | Per Epic 2 retro - Resend needs custom domain |
| A4: 7-day invitation expiry is reasonable | Managed by Supabase Auth |
| A5: Usage metrics don't need real-time accuracy | Page-load refresh is sufficient |

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should removed users be soft-deleted for audit trail? | Sam | Decision: Hard delete for MVP, audit later |
| Q2: What happens to documents uploaded by removed user? | Sam | Decision: Documents remain with agency |
| Q3: Should we email users when their role changes? | Sam | Deferred - not for MVP |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage |
|-------|-------|-----------|----------|
| Unit | Validation schemas, role checks | Vitest | All validation rules |
| Integration | Team operations, invitation flow | Vitest + Supabase local | Full CRUD flows |
| E2E | Complete invite-to-join journey | Playwright (post-MVP) | Critical paths |

### Key Test Scenarios

**Agency Settings:**
- Admin can update agency name
- Member cannot update agency name
- Name validation (2-100 chars)

**Invitations:**
- Admin can invite user under seat limit
- Invitation blocked at seat limit
- Duplicate email rejected
- Invitation email contains correct link
- Accept invitation joins correct agency
- Expired invitation shows error
- Cancel removes invitation

**Team Management:**
- Admin can remove member
- Cannot remove self
- Cannot remove last admin
- Role change updates database
- Member sees view-only team list

**Billing (Display-Only):**
- Billing tab displays current tier and seat usage
- Plan features summary displays correctly
- "Contact support" message visible
- Manual tier change updates database (admin only)

### Definition of Done

- [ ] All acceptance criteria verified
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Unit tests pass for validation schemas (use Zod `.issues` pattern)
- [ ] Integration tests pass for team operations
- [ ] `auth.admin.inviteUserByEmail()` tested with real Supabase
- [ ] Manual testing of all 5 stories complete
- [ ] Code reviewed and merged
- [ ] No new environment variables needed (per Epic 2 retro simplifications)

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-11-28_
