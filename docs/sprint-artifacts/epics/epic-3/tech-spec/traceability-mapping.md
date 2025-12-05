# Traceability Mapping

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
