# Story 20.5: Owner Management

Status: ready-for-dev

## Story

As an agency owner,
I want to view my subscription plan details and transfer ownership to another admin,
so that I can manage agency leadership transitions and understand my plan tier without needing external tools.

## Important Business Context

**BILLING NOTE:** All billing is handled manually via invoices from Archway Computer. There is NO Stripe integration or automated payment processing. The subscription/plan display is informational only - plan changes, upgrades, and payment inquiries go through Archway Computer directly.

This simplifies the story significantly:
- No payment method management
- No Stripe Customer Portal integration
- No invoice history from the system (handled externally)
- Plan information is read-only display

## Acceptance Criteria

### AC-20.5.1: Subscription Plan Display
Given an owner accesses the Agency Settings page,
When they view the Subscription section,
Then they see: current plan name (e.g., "Professional"), billing cycle (monthly/annual), and seat allocation (used/max).

### AC-20.5.2: Billing Contact Information
Given an owner views the Subscription section,
When they want to manage billing,
Then they see a clear message: "For billing inquiries, plan changes, or payment questions, contact Archway Computer" with contact information or email link.

### AC-20.5.3: Non-Owner View
Given a non-owner admin accesses Agency Settings,
When they view the Subscription section,
Then they see: "Contact agency owner ({owner_email}) for subscription information."

### AC-20.5.4: Transfer Ownership Option
Given an owner is in Agency Settings,
When they view the Ownership section,
Then they see a "Transfer Ownership" option.

### AC-20.5.5: Transfer Target Selection
Given an owner initiates ownership transfer,
When the transfer dialog opens,
Then they see a list of current admins only (producers and non-admins excluded).

### AC-20.5.6: Transfer Confirmation
Given an owner selects a transfer target,
When they proceed,
Then they must re-enter their password to confirm the transfer.

### AC-20.5.7: Successful Transfer - Permissions
Given a valid password is entered,
When the transfer completes,
Then: new owner receives owner permissions, old owner is demoted to admin role.

### AC-20.5.8: Email Notifications
Given a successful ownership transfer,
When the transfer completes,
Then both the old owner and new owner receive email notifications.

### AC-20.5.9: Audit Trail
Given any ownership transfer attempt (success or failure),
When the action occurs,
Then it is logged to the audit trail with both user IDs and outcome.

### AC-20.5.10: No Admins Error
Given an owner attempts transfer but no other admins exist,
When they open the transfer dialog,
Then they see: "Promote a user to admin first before transferring ownership."

### AC-20.5.11: Atomic Transfer
Given an ownership transfer is in progress,
When any step fails,
Then the entire transfer is rolled back - no partial transfers.

## Tasks / Subtasks

- [ ] **Task 1: API Route - Get Agency Subscription** (AC: 20.5.1, 20.5.3)
  - [ ] Create `src/app/api/ai-buddy/admin/subscription/route.ts`
  - [ ] Return plan name, billing cycle, seats used/max from `agencies` table
  - [ ] For owner: return full subscription details
  - [ ] For non-owner admin: return owner email only
  - [ ] For non-admin: return 403

- [ ] **Task 2: API Route - Transfer Ownership** (AC: 20.5.4-20.5.11)
  - [ ] Create `src/app/api/ai-buddy/admin/transfer-ownership/route.ts`
  - [ ] POST accepts: `newOwnerId`, `confirmPassword`
  - [ ] Verify current user is owner
  - [ ] Verify password via Supabase Auth re-authentication
  - [ ] Verify target user is admin
  - [ ] Execute atomic transaction:
    - Remove `owner` permission from current user
    - Grant `owner` permission to new user
    - Demote current user to `admin` role
  - [ ] Log `ownership_transferred` to audit trail (both user IDs)
  - [ ] Trigger email notifications (both parties)
  - [ ] Return error if no admins available (AIB_016)
  - [ ] Return error if password invalid (AIB_014)
  - [ ] Return error if target not admin (AIB_015)

- [ ] **Task 3: Subscription Panel Component** (AC: 20.5.1, 20.5.2, 20.5.3)
  - [ ] Create `src/components/ai-buddy/admin/owner/subscription-panel.tsx`
  - [ ] Display plan card with: plan name, billing cycle, seat usage bar
  - [ ] Show "Contact Archway Computer for billing" message with mailto link
  - [ ] Non-owner view shows owner contact message
  - [ ] Loading skeleton state

- [ ] **Task 4: Transfer Ownership Dialog** (AC: 20.5.4, 20.5.5, 20.5.6, 20.5.10)
  - [ ] Create `src/components/ai-buddy/admin/owner/transfer-ownership-dialog.tsx`
  - [ ] Admin list dropdown (filtered from user management)
  - [ ] Password input for confirmation
  - [ ] Warning text explaining consequences
  - [ ] Empty state when no admins available
  - [ ] Loading state during transfer
  - [ ] Success confirmation with redirect countdown

- [ ] **Task 5: Owner Settings Hook** (AC: All)
  - [ ] Create `src/hooks/ai-buddy/use-owner-settings.ts`
  - [ ] Fetch subscription info
  - [ ] Fetch admin list for transfer
  - [ ] Execute transfer mutation
  - [ ] Handle loading/error/success states

- [ ] **Task 6: Integrate into Settings Page** (AC: All)
  - [ ] Add Owner tab/section to Agency Settings (owner-only)
  - [ ] Add Subscription card to existing admin section (all admins)
  - [ ] Ensure permission checks at component level

- [ ] **Task 7: Email Notifications** (AC: 20.5.8)
  - [ ] Create email template for old owner: "Ownership transferred to {new_owner}"
  - [ ] Create email template for new owner: "You are now the owner of {agency_name}"
  - [ ] Send via Supabase Auth email or Resend

- [ ] **Task 8: Unit Tests** (AC: All)
  - [ ] Create `__tests__/components/ai-buddy/admin/owner/subscription-panel.test.tsx`
  - [ ] Create `__tests__/components/ai-buddy/admin/owner/transfer-ownership-dialog.test.tsx`
  - [ ] Create `__tests__/hooks/ai-buddy/use-owner-settings.test.ts`

- [ ] **Task 9: E2E Tests** (AC: 20.5.4, 20.5.6, 20.5.7)
  - [ ] Create `__tests__/e2e/ai-buddy/admin/owner-management.spec.ts`
  - [ ] Test: Owner sees subscription panel
  - [ ] Test: Non-owner admin sees contact owner message
  - [ ] Test: Transfer flow - success path
  - [ ] Test: Transfer fails with wrong password
  - [ ] Test: Transfer blocked when no other admins

## Dev Notes

### Key Implementation Patterns

**Subscription Query (simplified - no Stripe):**
```typescript
// GET /api/ai-buddy/admin/subscription
const { data: agency } = await supabase
  .from('agencies')
  .select('id, name, plan, billing_cycle, max_seats')
  .eq('id', agencyId)
  .single();

const { count: usedSeats } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('agency_id', agencyId)
  .eq('status', 'active');

return {
  plan: agency.plan || 'Professional',
  billingCycle: agency.billing_cycle || 'monthly',
  seatsUsed: usedSeats,
  maxSeats: agency.max_seats || 5,
  billingContact: 'billing@archwaycomputer.com'
};
```

**Ownership Transfer Transaction:**
```typescript
// Atomic ownership transfer using Supabase RPC
const { error } = await supabase.rpc('transfer_ownership', {
  current_owner_id: currentUserId,
  new_owner_id: newOwnerId,
  agency_id: agencyId
});

// SQL function ensures atomicity:
CREATE OR REPLACE FUNCTION transfer_ownership(
  current_owner_id uuid,
  new_owner_id uuid,
  agency_id uuid
) RETURNS void AS $$
BEGIN
  -- Verify current owner
  IF NOT EXISTS (
    SELECT 1 FROM ai_buddy_permissions
    WHERE user_id = current_owner_id
    AND permission = 'owner'
  ) THEN
    RAISE EXCEPTION 'Current user is not owner';
  END IF;

  -- Verify new owner is admin
  IF NOT EXISTS (
    SELECT 1 FROM ai_buddy_permissions
    WHERE user_id = new_owner_id
    AND permission = 'manage_users'
  ) THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;

  -- Remove owner from current
  DELETE FROM ai_buddy_permissions
  WHERE user_id = current_owner_id
  AND permission = 'owner';

  -- Grant owner to new
  INSERT INTO ai_buddy_permissions (user_id, permission, granted_by, granted_at)
  VALUES (new_owner_id, 'owner', current_owner_id, now());

  -- Ensure old owner keeps admin
  INSERT INTO ai_buddy_permissions (user_id, permission, granted_by, granted_at)
  VALUES (current_owner_id, 'manage_users', new_owner_id, now())
  ON CONFLICT (user_id, permission) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Learnings from Previous Story

**From Story 20.4 (Audit Log Interface) - Status: done**

- **Permission Pattern**: Use `checkAiBuddyPermission(supabase, userId, 'view_audit_logs')` - extend for owner check
- **Settings Integration**: Integrated into `ai-buddy-preferences-tab.tsx` - follow same pattern for owner section
- **Test Coverage**: 98 tests achieved - aim for similar coverage
- **PDF Export Template**: `pdf-export-template.tsx` can be referenced for any formatted output

**Key Files from Story 20.4:**
- `src/components/settings/ai-buddy-preferences-tab.tsx` (MODIFY to add owner section)
- `src/app/api/ai-buddy/admin/audit-logs/route.ts` - API pattern reference
- `src/hooks/ai-buddy/use-audit-logs.ts` - Hook pattern reference

**From Story 20.2 (Admin User Management):**
- User list component with role management is reusable for admin selection in transfer
- Invitation flow patterns apply to email notifications
- `src/lib/ai-buddy/admin/user-service.ts` has role management logic

[Source: docs/sprint-artifacts/epics/epic-20/stories/20-4-audit-log-interface/story-20.4-audit-log-interface.md#Completion-Notes-List]

### Project Structure Notes

**New Files:**
```
src/
├── app/api/ai-buddy/admin/
│   ├── subscription/route.ts          # GET subscription info
│   └── transfer-ownership/route.ts    # POST ownership transfer
├── components/ai-buddy/admin/owner/
│   ├── subscription-panel.tsx         # Plan display + contact info
│   └── transfer-ownership-dialog.tsx  # Transfer wizard
└── hooks/ai-buddy/
    └── use-owner-settings.ts          # State management
```

**Modified Files:**
- `src/components/settings/ai-buddy-preferences-tab.tsx` - Add owner section
- `supabase/migrations/` - Add `transfer_ownership` function

**Dependencies:**
- No new dependencies (no Stripe SDK needed)
- Reuse existing shadcn/ui components (Dialog, Card, Select, Input)

### Billing Simplification Notes

The original tech spec assumed Stripe integration (ACs 20.5.2, 20.5.4, 20.5.5). Per Sam's note:

| Original AC | Adjustment |
|-------------|------------|
| Payment method display | REMOVED - handled externally |
| Stripe Customer Portal | REMOVED - contact Archway Computer |
| Invoice history | REMOVED - handled externally |
| Plan management UI | READ-ONLY display only |

This reduces story complexity from 15 ACs to 11 ACs while still delivering:
- Plan visibility for agency owners
- Clear billing contact information
- Full ownership transfer functionality

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Story-20.5] - Original acceptance criteria (modified per billing note)
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Owner-Endpoints] - API contract for transfer
- [Source: docs/features/ai-buddy/prd.md#FR48-FR49] - Business requirements
- [Source: docs/sprint-artifacts/epics/epic-20/epic.md#20.5] - Epic context

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-20/stories/20-5-owner-management/20-5-owner-management.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-09 | SM Agent (Claude Opus 4.5) | Initial story draft - adjusted for manual billing via Archway Computer per Sam's note |
