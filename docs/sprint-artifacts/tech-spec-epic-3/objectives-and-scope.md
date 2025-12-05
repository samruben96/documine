# Objectives and Scope

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
