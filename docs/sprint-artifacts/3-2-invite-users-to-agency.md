# Story 3.2: Invite Users to Agency

Status: done

## Story

As an **agency admin**,
I want **to invite new users to join my agency**,
so that **my team can collaborate on document analysis**.

## Acceptance Criteria

1. **AC-3.2.1:** "Invite User" button opens modal with email field and role selector (Member/Admin)
   - Modal includes clear form layout with email input and role dropdown
   - Role defaults to "Member"
   - "Send Invitation" button submits the form

2. **AC-3.2.2:** System checks seat limit before allowing invite
   - Count current users + pending invitations
   - Compare against agency's seat_limit

3. **AC-3.2.3:** At seat limit shows error: "Seat limit reached. Upgrade to add more users."
   - Error displayed as toast notification
   - Modal remains open for user to dismiss

4. **AC-3.2.4:** Duplicate email (existing user or pending invite) shows error
   - "This email already has an account in your agency" for existing users
   - "An invitation is already pending for this email" for pending invites

5. **AC-3.2.5:** Invitation email sent via Supabase built-in email with invite link
   - Uses `supabase.auth.admin.inviteUserByEmail()` (NOT Resend - per Epic 2 retro)
   - Email contains secure magic link

6. **AC-3.2.6:** Invitation record created with invite metadata
   - Stores: agency_id, email, role, invited_by, status='pending', expires_at (7 days)

7. **AC-3.2.7:** Pending invitations displayed with email, role, invited date, status
   - Table or list format showing all pending invites for the agency
   - Admin-only view

8. **AC-3.2.8:** "Resend" action re-sends email and extends expiry
   - Resets expires_at to 7 days from now
   - Calls `auth.admin.inviteUserByEmail()` again

9. **AC-3.2.9:** "Cancel" action marks invitation as cancelled
   - Updates invitation status to 'cancelled'
   - Shows success toast: "Invitation cancelled"

10. **AC-3.2.10:** Invitee signup with token joins existing agency with invited role
    - Auth callback handler processes invitation metadata
    - Creates user record with invitation's agency_id and role
    - Marks invitation as 'accepted'

## Tasks / Subtasks

- [x] **Task 1: Create invitations database migration** (AC: 3.2.6)
  - [x] Create migration file `supabase/migrations/00005_create_invitations.sql`
  - [x] Create `invitations` table with: id, agency_id, email, role, status, invited_by, expires_at, created_at, accepted_at
  - [x] Add RLS policies for admin-only access within agency
  - [x] Add indexes for agency_id, email, status
  - [x] Added TypeScript types manually to `src/types/database.types.ts`

- [x] **Task 2: Create Team Tab component with invitation list** (AC: 3.2.7)
  - [x] Create `src/components/settings/team-tab.tsx`
  - [x] Fetch team members (users) and pending invitations
  - [x] Display team members list with name, email, role, joined date
  - [x] Display pending invitations section with email, role, invited date, actions
  - [x] Pass user role to determine edit capability (admin only)
  - [x] Update settings page to use TeamTab

- [x] **Task 3: Create Invite User modal component** (AC: 3.2.1)
  - [x] Create `src/components/settings/invite-user-modal.tsx`
  - [x] Add email input with validation (valid email format)
  - [x] Add role selector dropdown (Member/Admin, default Member)
  - [x] Add "Send Invitation" button with loading state
  - [x] Use Dialog component from shadcn/ui
  - [x] Integrate with react-hook-form + Zod

- [x] **Task 4: Create inviteUser server action** (AC: 3.2.2, 3.2.3, 3.2.4, 3.2.5, 3.2.6)
  - [x] Add `inviteUser(data: { email: string; role: 'admin' | 'member' })` to actions.ts
  - [x] Verify user is admin
  - [x] Check seat limit: count users + pending invites vs seat_limit
  - [x] Return error if at seat limit: "Seat limit reached. Upgrade to add more users."
  - [x] Check for duplicate email in users table
  - [x] Check for duplicate email in invitations (status='pending')
  - [x] Create invitation record in database
  - [x] Call `supabase.auth.admin.inviteUserByEmail()` with redirect URL
  - [x] Return success/error response

- [x] **Task 5: Create Zod validation schema for invitations** (AC: 3.2.1)
  - [x] Add `inviteUserSchema` to `src/lib/validations/auth.ts`
  - [x] Validate email: valid email format
  - [x] Validate role: enum of 'admin' | 'member'

- [x] **Task 6: Create resendInvitation server action** (AC: 3.2.8)
  - [x] Add `resendInvitation(invitationId: string)` to actions.ts
  - [x] Verify user is admin
  - [x] Verify invitation exists and is pending
  - [x] Update expires_at to 7 days from now
  - [x] Call `supabase.auth.admin.inviteUserByEmail()` again
  - [x] Return success toast: "Invitation resent"

- [x] **Task 7: Create cancelInvitation server action** (AC: 3.2.9)
  - [x] Add `cancelInvitation(invitationId: string)` to actions.ts
  - [x] Verify user is admin
  - [x] Update invitation status to 'cancelled'
  - [x] Return success toast: "Invitation cancelled"

- [x] **Task 8: Modify auth callback to handle invitations** (AC: 3.2.10)
  - [x] Update `src/app/auth/callback/route.ts`
  - [x] Check for invitation metadata in user data
  - [x] If invitation exists: create user with invitation's agency_id and role
  - [x] Mark invitation as 'accepted' with accepted_at timestamp
  - [x] Redirect to /documents

- [x] **Task 9: Add "Invite User" button to Team tab** (AC: 3.2.1)
  - [x] Add "Invite User" button (admin only)
  - [x] Button opens InviteUserModal
  - [x] Refresh invitation list on successful invite

- [x] **Task 10: Add pending invitation actions** (AC: 3.2.8, 3.2.9)
  - [x] Add "Resend" button to each pending invitation row
  - [x] Add "Cancel" button to each pending invitation row
  - [x] Show loading states during actions
  - [x] Refresh list after action completes

- [x] **Task 11: Add unit and integration tests** (All ACs)
  - [x] Test inviteUser validates email format
  - [x] Test inviteUser requires admin role
  - [x] Test resendInvitation requires admin role
  - [x] Test cancelInvitation requires admin role
  - [x] Test all actions require authentication

- [x] **Task 12: Build and test verification** (All ACs)
  - [x] Verify `npm run build` succeeds
  - [x] Verify all 247 tests pass

## Dev Notes

### Architecture Patterns & Constraints

**Invite User Flow (Per Tech Spec):**
```
Admin clicks "Invite User"
    |
    +-> Modal: Enter email, select role
    |
    +-> Submit -> Server Action: inviteUser()
        |
        +-> 1. Verify admin role
        |
        +-> 2. Check seat limit
        |       SELECT COUNT(*) FROM users WHERE agency_id = $agency
        |       SELECT COUNT(*) FROM invitations WHERE agency_id = $agency AND status = 'pending'
        |       If total >= seat_limit -> Error: "Seat limit reached"
        |
        +-> 3. Check for duplicate
        |       If email in users or pending invitations -> Error
        |
        +-> 4. INSERT INTO invitations (agency_id, email, role, invited_by, expires_at, status)
        |
        +-> 5. Call supabase.auth.admin.inviteUserByEmail()
        |       Note: Uses Supabase built-in email (NOT Resend per Epic 2 retro)
        |
        +-> 6. Success toast: "Invitation sent to {email}"
```

**Data Model (Per Tech Spec):**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'cancelled' | 'expired'
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
```

**TypeScript Types:**
```typescript
export interface Invitation {
  id: string;
  agency_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  invited_by: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}
```

### Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── settings/
│       ├── team-tab.tsx           # Team management tab
│       └── invite-user-modal.tsx  # Invitation modal
supabase/
└── migrations/
    └── XXXXX_create_invitations.sql  # New migration
```

**Existing Files to Modify:**
```
src/
├── app/
│   ├── (auth)/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts       # Handle invitation acceptance
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx           # Add Team tab
│           └── actions.ts         # Add invitation actions
├── lib/
│   └── validations/
│       └── auth.ts                # Add inviteUserSchema
```

### Learnings from Previous Story

**From Story 3-1-agency-settings-page (Status: done)**

- **Settings Page Structure**: Settings page exists at `/settings` with Profile/Agency/Billing tabs using shadcn/ui Tabs
- **Server Actions Pattern**: Auth operations use Next.js server actions at `src/app/(dashboard)/settings/actions.ts`
- **Validation Pattern**: Zod schemas in `src/lib/validations/auth.ts` - use `.issues` not `.errors` (Zod v4)
- **Form Pattern**: react-hook-form with @hookform/resolvers for Zod integration, `mode: 'onBlur'` for real-time validation
- **Toast Pattern**: Use `sonner` for success/error toasts
- **Admin Check Pattern**: Query user role from users table, check `role === 'admin'` before allowing admin actions
- **Loading State Pattern**: Use `useTransition` for server action loading states

[Source: docs/sprint-artifacts/3-1-agency-settings-page.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Story-3.2-Invite-Users-to-Agency]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Data-Models-and-Contracts]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing]
- [Source: docs/epics.md#Story-3.2-Invite-Users-to-Agency]
- [Source: docs/architecture.md#Data-Architecture]

### Technical Notes

**Server Action Pattern (inviteUser):**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { inviteUserSchema } from '@/lib/validations/auth';

export async function inviteUser(data: { email: string; role: 'admin' | 'member' }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input
  const result = inviteUserSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message };
  }

  // 2. Get authenticated user and verify admin role
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Get user's role and agency_id
  const { data: userData } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { success: false, error: 'Only admins can invite users' };
  }

  const agencyId = userData.agency_id;

  // 4. Check seat limit
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  const { count: pendingCount } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('status', 'pending');

  const { data: agency } = await supabase
    .from('agencies')
    .select('seat_limit')
    .eq('id', agencyId)
    .single();

  if ((userCount ?? 0) + (pendingCount ?? 0) >= (agency?.seat_limit ?? 0)) {
    return { success: false, error: 'Seat limit reached. Upgrade to add more users.' };
  }

  // 5. Check for duplicate email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .single();

  if (existingUser) {
    return { success: false, error: 'This email already has an account in your agency' };
  }

  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    return { success: false, error: 'An invitation is already pending for this email' };
  }

  // 6. Create invitation record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      agency_id: agencyId,
      email: data.email,
      role: data.role,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: 'Failed to create invitation' };
  }

  // 7. Send invitation email via Supabase Auth admin API
  const adminClient = createServiceRoleClient();
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      agency_id: agencyId,
      role: data.role,
      invitation_id: invitation.id
    }
  });

  if (inviteError) {
    // Rollback invitation record
    await supabase.from('invitations').delete().eq('id', invitation.id);
    return { success: false, error: 'Failed to send invitation email' };
  }

  return { success: true };
}
```

**Service Role Client (for admin API):**
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

**Invitation Validation Schema:**
```typescript
// Add to src/lib/validations/auth.ts
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});
```

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/3-2-invite-users-to-agency.context.xml

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A

### Completion Notes List

1. Created invitations database migration (00005_create_invitations.sql) with RLS policies
2. Manually added invitations types to database.types.ts since local Supabase wasn't running
3. Used `createServiceClient()` (already in server.ts) for admin API calls
4. Team tab integrated into settings page as fourth tab (Profile, Agency, Team, Billing)
5. Invitation actions use revalidatePath for data refresh
6. Auth callback checks user_metadata.invitation_id to detect invited users
7. All 247 tests pass, build succeeds

### File List

**Created:**
- `documine/supabase/migrations/00005_create_invitations.sql`
- `documine/src/components/settings/team-tab.tsx`
- `documine/src/components/settings/invite-user-modal.tsx`

**Modified:**
- `documine/src/types/database.types.ts` - Added invitations table types
- `documine/src/lib/validations/auth.ts` - Added inviteUserSchema
- `documine/src/app/(dashboard)/settings/actions.ts` - Added inviteUser, resendInvitation, cancelInvitation
- `documine/src/app/(dashboard)/settings/page.tsx` - Added Team tab with data fetching
- `documine/src/app/auth/callback/route.ts` - Handle invitation acceptance
- `documine/__tests__/app/dashboard/settings/actions.test.ts` - Added invitation tests

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-28 | SM Agent (Bob) | Initial story draft created via YOLO mode |
| 2025-11-28 | Dev Agent (Amelia) | Story implementation complete - all ACs satisfied |
| 2025-11-28 | Senior Dev Review (AI) | Code review APPROVED - all ACs verified |

---

## Senior Developer Review (AI)

### Reviewer
Sam (via Senior Developer Review Workflow)

### Date
2025-11-28

### Outcome
**APPROVED**

All 10 acceptance criteria verified with evidence. All 12 tasks marked complete are confirmed implemented. Build passes, 247 tests pass.

### Summary

Clean implementation following established patterns from Story 3.1. Server actions properly validate admin role, check seat limits, and handle edge cases. The invite flow correctly uses Supabase Auth admin API as specified in Epic 2 retrospective (not Resend). Auth callback properly handles invitation acceptance and creates user records with correct agency/role.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- `window.location.reload()` used in handleInviteSuccess - could use `router.refresh()` for smoother UX, but functional

**Advisory Notes:**
- Consider adding rate limiting for invite actions in production
- Consider adding invite quota tracking for analytics

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-3.2.1 | Invite button opens modal with email/role | IMPLEMENTED | team-tab.tsx:122-127, invite-user-modal.tsx:71-138 |
| AC-3.2.2 | System checks seat limit | IMPLEMENTED | actions.ts:143-164 |
| AC-3.2.3 | Seat limit error message | IMPLEMENTED | actions.ts:163 (exact message matches) |
| AC-3.2.4 | Duplicate email check | IMPLEMENTED | actions.ts:166-189 (both users and invitations) |
| AC-3.2.5 | Email via Supabase Auth | IMPLEMENTED | actions.ts:212-221 (auth.admin.inviteUserByEmail) |
| AC-3.2.6 | Invitation record created | IMPLEMENTED | actions.ts:191-210, migration file |
| AC-3.2.7 | Pending invitations displayed | IMPLEMENTED | team-tab.tsx:181-247 |
| AC-3.2.8 | Resend extends expiry | IMPLEMENTED | actions.ts:284-313 |
| AC-3.2.9 | Cancel marks cancelled | IMPLEMENTED | actions.ts:367-378 |
| AC-3.2.10 | Invitee joins agency | IMPLEMENTED | auth/callback/route.ts:49-91 |

**Summary: 10 of 10 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create migration | Complete | VERIFIED | 00005_create_invitations.sql exists with RLS |
| Task 2: Team Tab component | Complete | VERIFIED | team-tab.tsx:68-262 |
| Task 3: Invite modal | Complete | VERIFIED | invite-user-modal.tsx:32-139 |
| Task 4: inviteUser action | Complete | VERIFIED | actions.ts:106-231 |
| Task 5: Zod schema | Complete | VERIFIED | auth.ts:86-91 |
| Task 6: resendInvitation | Complete | VERIFIED | actions.ts:237-314 |
| Task 7: cancelInvitation | Complete | VERIFIED | actions.ts:320-379 |
| Task 8: Auth callback | Complete | VERIFIED | route.ts:49-91 |
| Task 9: Invite button | Complete | VERIFIED | team-tab.tsx:122-127 |
| Task 10: Pending actions | Complete | VERIFIED | team-tab.tsx:216-243 |
| Task 11: Tests | Complete | VERIFIED | actions.test.ts (8 new tests) |
| Task 12: Build/test | Complete | VERIFIED | Build passes, 247 tests pass |

**Summary: 12 of 12 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

**Tests Present:**
- inviteUser validates email format ✅
- inviteUser requires admin role ✅
- resendInvitation requires admin role ✅
- cancelInvitation requires admin role ✅
- All actions require authentication ✅

**Potential Test Additions (not blocking):**
- Component tests for TeamTab and InviteUserModal (optional for MVP)
- Integration test for full invite flow (optional for MVP)

### Architectural Alignment

- ✅ Uses Supabase Auth admin API (per Epic 2 retrospective - NOT Resend)
- ✅ RLS policies for admin-only invitation access
- ✅ Server actions with proper validation (Zod v4 `.issues` pattern)
- ✅ React Hook Form with `mode: 'onBlur'`
- ✅ Toast notifications via Sonner
- ✅ Service role client for admin API calls

### Security Notes

- ✅ Admin role verified server-side before all invitation operations
- ✅ Agency isolation via RLS policies
- ✅ Invitation rollback on email send failure
- ✅ Service role key used only server-side

### Best-Practices and References

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Action Items

**Code Changes Required:**
(None - all requirements satisfied)

**Advisory Notes:**
- Note: Consider using `router.refresh()` instead of `window.location.reload()` in team-tab.tsx:109 for smoother UX
- Note: Consider adding rate limiting for invite actions in production deployment
