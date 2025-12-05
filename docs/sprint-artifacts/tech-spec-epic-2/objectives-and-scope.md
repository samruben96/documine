# Objectives and Scope

**In Scope:**
- Signup page with form validation (email, password strength, agency name, full name)
- Agency and user record creation atomically after Supabase Auth signup
- Login page with email/password authentication
- "Remember me" functionality for session persistence
- Session management via httpOnly cookies with automatic refresh
- Route protection middleware for dashboard routes
- Password reset flow with email verification via Resend
- User profile management page (view/edit name)
- Settings page layout with tabs (Profile, Agency, Billing) for future expansion

**Out of Scope:**
- Social OAuth login (Google, etc.) - deferred to post-MVP
- Email change functionality - MVP keeps email fixed
- Two-factor authentication (2FA) - deferred to post-MVP
- Rate limiting for login attempts - Supabase provides basic protection
- Account deletion - deferred to post-MVP
- Team invitations (Epic 3)
- Agency settings management (Epic 3)
- Billing/subscription management (Epic 3)
