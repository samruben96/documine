# Epic 3: Agency & Team Management

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-3/stories/`](../sprint-artifacts/epics/epic-3/stories/)

**Goal:** Enable agency admins to manage their team, subscription, and agency settings. This delivers the B2B multi-user capability.

**User Value:** Admins can invite team members, manage access, and control their subscription.

**FRs Addressed:** FR5, FR6, FR7, FR28, FR29, FR30

---

## Story 3.1: Agency Settings Page

As an **agency admin**,
I want **to view and manage my agency's settings**,
So that **I can configure my organization's preferences**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page (`/settings`)
**When** I view the Agency tab
**Then** I see agency information:
- Agency name (editable)
- Subscription tier (display: Starter/Professional/Agency)
- Seat limit and current usage (e.g., "3 of 5 seats used")
- Agency created date

**And** when I update agency name:
- Validation: 2-100 characters
- Success toast: "Agency settings updated"

**And** non-admin users see Agency tab but cannot edit (view-only)

**Prerequisites:** Story 2.6

**Technical Notes:**
- Check `users.role === 'admin'` for edit permissions
- Update `agencies` table for name changes
- Display seat usage from user count query

---

## Story 3.2: Invite Users to Agency

As an **agency admin**,
I want **to invite new users to join my agency**,
So that **my team can collaborate on document analysis**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Team section
**When** I click "Invite User"
**Then** a modal appears with:
- Email field (required, valid email format)
- Role selector: Member (default) or Admin
- "Send Invitation" button

**And** when I submit a valid invitation:
- System checks seat limit: if at limit, error "Seat limit reached. Upgrade to add more users."
- If under limit: invitation email sent via Resend
- Invitation record created with status='pending', expires in 7 days
- Success toast: "Invitation sent to {email}"

**And** the invitation email contains:
- Subject: "You've been invited to join {agency_name} on docuMINE"
- Invite link to `/signup?invite={token}`
- Inviter's name
- Expires notice

**And** when invitee clicks link and signs up:
- Agency pre-populated (cannot change)
- On signup: user added to existing agency with invited role
- Invitation marked as 'accepted'

**And** pending invitations shown in Team section:
- Email, role, invited date, status
- "Resend" and "Cancel" actions

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create `invitations` table: id, agency_id, email, role, token, status, expires_at, created_at
- Generate secure token for invite link
- Handle invite token in signup flow (check query param)
- Enforce seat_limit before allowing invite

---

## Story 3.3: Manage Team Members

As an **agency admin**,
I want **to view and remove team members**,
So that **I can control who has access to my agency's documents**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Team section
**When** I view the member list
**Then** I see all agency users:
- Name
- Email
- Role (Admin/Member)
- Joined date
- Actions (for non-self users)

**And** I can remove a member:
- Click "Remove" button
- Confirmation modal: "Remove {name} from {agency}? They will lose access to all agency documents."
- On confirm: user record deleted, success toast
- Cannot remove yourself

**And** I can change a member's role:
- Admin ↔ Member toggle
- At least one admin must remain
- Success toast: "Role updated"

**And** members see Team section but cannot edit (view-only list)

**Prerequisites:** Story 3.2

**Technical Notes:**
- Soft delete vs hard delete? For MVP, hard delete user record (they can re-signup)
- Enforce "at least one admin" constraint
- Consider what happens to documents uploaded by removed user (keep them, transfer ownership to agency)

---

## Story 3.4: Subscription & Billing Management

As an **agency admin**,
I want **to view and manage my subscription**,
So that **I can upgrade, downgrade, or update payment methods**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Billing tab
**When** I view billing information
**Then** I see:
- Current plan (Starter/Professional/Agency)
- Price per month
- Seat limit for current plan
- Current seat usage
- Next billing date (if applicable)

**And** I can upgrade/downgrade plan:
- "Change Plan" button opens plan comparison
- Shows: Starter ($X/mo, 3 seats), Professional ($Y/mo, 10 seats), Agency ($Z/mo, unlimited)
- Selecting different plan → redirect to Stripe checkout/portal

**And** I can update payment method:
- "Update Payment" → Stripe customer portal

**And** seat limit is enforced:
- Cannot invite beyond seat limit
- Downgrade blocked if current users exceed new plan's limit

**Prerequisites:** Story 3.1

**Technical Notes:**
- Integrate Stripe for payment processing
- Use Stripe Customer Portal for subscription management
- Webhook handler for subscription changes updates `agencies.subscription_tier` and `seat_limit`
- For MVP: can stub billing with manual tier assignment

---

## Story 3.5: Agency Usage Metrics

As an **agency admin**,
I want **to see usage metrics for my agency**,
So that **I can understand how the team is using docuMINE**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Usage tab (or section)
**When** I view usage metrics
**Then** I see:
- Total documents uploaded (this month / all time)
- Total queries asked (this month / all time)
- Active users (users with activity in last 7 days)
- Storage used (MB/GB)

**And** metrics update in near-real-time (refreshes on page load)

**And** members do not see agency-wide metrics (only admins)

**Prerequisites:** Story 3.1

**Technical Notes:**
- Aggregate queries on documents, chat_messages tables
- Consider caching metrics if queries become slow
- Storage usage from Supabase Storage API or calculated from document metadata

---

## Story 3.6: Settings UX Enhancements

As an **agency admin**,
I want **the Settings page to feel responsive and polished**,
So that **managing my team feels effortless and professional**.

**Acceptance Criteria:**

**Given** I am on the settings page Team tab
**When** I change a user's role
**Then** the UI updates immediately (optimistic update):
- Loading indicator shown inline
- On success: change persists with toast
- On error: UI reverts to previous state

**And** after successful invite:
- Team list refreshes without full page reload
- Uses `router.refresh()` instead of `window.location.reload()`
- Scroll position preserved

**And** remove button behavior is contextual:
- Desktop: appears on row hover
- Mobile/Touch: always visible
- Smooth fade-in transition

**And** empty invitations section shows:
- "No pending invitations" message
- Subtle prompt to invite team members

**And** skeleton loading states:
- Shows skeleton shimmer during initial load
- Matches actual content layout

**And** subtle success animations:
- Brief highlight on role change
- Fade-out on member removal
- Animations under 300ms

**And** non-admin view-only mode indicator:
- Clear "View only" badge visible
- Explains context for non-admins

**Prerequisites:** Stories 3.1-3.5 (all complete)

**Technical Notes:**
- Use React optimistic update pattern or `useOptimistic` hook
- Replace `window.location.reload()` with `router.refresh()`
- CSS `@media (hover: hover)` for touch device detection
- shadcn/ui Skeleton component for loading states

---
