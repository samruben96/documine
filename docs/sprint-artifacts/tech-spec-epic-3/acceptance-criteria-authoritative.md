# Acceptance Criteria (Authoritative)

## Story 3.1: Agency Settings Page

1. **AC-3.1.1:** Agency tab displays: Agency name (editable), Subscription tier, Seat limit, Current usage, Created date
2. **AC-3.1.2:** Agency name update validates 2-100 characters
3. **AC-3.1.3:** Save shows success toast: "Agency settings updated"
4. **AC-3.1.4:** Non-admin users see Agency tab but cannot edit (view-only)

## Story 3.2: Invite Users to Agency

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

## Story 3.3: Manage Team Members

15. **AC-3.3.1:** Team tab displays all agency users: Name, Email, Role, Joined date
16. **AC-3.3.2:** "Remove" button shows confirmation modal
17. **AC-3.3.3:** Confirmation text: "Remove {name} from {agency}? They will lose access to all agency documents."
18. **AC-3.3.4:** Cannot remove yourself (button disabled or not shown)
19. **AC-3.3.5:** Cannot remove if it would leave no admins
20. **AC-3.3.6:** Role toggle (Admin ↔ Member) available for each member
21. **AC-3.3.7:** Cannot change your own role
22. **AC-3.3.8:** Non-admin users see Team tab in view-only mode

## Story 3.4: Subscription & Billing Management (Display-Only for MVP)

23. **AC-3.4.1:** Billing tab shows: Current plan name, Seat limit, Current usage (X/Y seats used)
24. **AC-3.4.2:** Plan tier displayed with feature summary (Starter: 3 seats, Professional: 10 seats, Agency: 25 seats)
25. **AC-3.4.3:** "Contact support to change plan" message displayed (no self-service for MVP)
26. **AC-3.4.4:** ~~Stripe integration~~ DEFERRED per Epic 2 retro - future "Billing Infrastructure Epic"
27. **AC-3.4.5:** Non-admin users see Billing tab in view-only mode
28. **AC-3.4.6:** Admin can manually change tier via `updateSubscriptionTier()` (internal use only for MVP)

## Story 3.5: Agency Usage Metrics

29. **AC-3.5.1:** Usage section shows: Documents uploaded (this month/all time)
30. **AC-3.5.2:** Usage section shows: Queries asked (this month/all time)
31. **AC-3.5.3:** Usage section shows: Active users (last 7 days)
32. **AC-3.5.4:** Usage section shows: Storage used (MB/GB)
33. **AC-3.5.5:** Metrics refresh on page load
34. **AC-3.5.6:** Non-admin users do not see agency-wide metrics
