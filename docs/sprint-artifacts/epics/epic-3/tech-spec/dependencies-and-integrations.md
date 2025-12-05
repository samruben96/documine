# Dependencies and Integrations

## NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database + Auth + Admin API |
| @supabase/ssr | ^0.7.0 | Server-side Supabase |
| zod | ^4.1.13 | Validation (use `.issues` not `.errors` per Epic 2 learning) |
| react-hook-form | ^7.66.1 | Form handling |

## New Dependencies Required

**None** - All required packages already installed.

Per Epic 2 retro:
- No Stripe integration for MVP (deferred to "Billing Infrastructure Epic")
- No Resend integration for MVP (deferred to "Email Infrastructure Epic" - needs custom domain)

## External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase Auth | User management + `auth.admin.inviteUserByEmail()` | Already configured |
| Supabase Email | Invitation emails (built-in) | Already configured |

## Environment Variables (New)

**None required for Epic 3** - All environment variables already configured from Epic 1/2.

Note: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured for server-side `auth.admin` API calls (should already exist from Epic 1).
