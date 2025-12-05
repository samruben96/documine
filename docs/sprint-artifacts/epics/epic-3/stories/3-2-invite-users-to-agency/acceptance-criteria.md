# Acceptance Criteria

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
