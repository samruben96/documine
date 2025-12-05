# System Architecture Alignment

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
