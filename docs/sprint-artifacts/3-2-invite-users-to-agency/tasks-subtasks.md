# Tasks / Subtasks

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
