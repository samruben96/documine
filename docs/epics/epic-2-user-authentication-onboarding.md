# Epic 2: User Authentication & Onboarding

**Goal:** Enable users to create accounts, sign in securely, reset passwords, and manage their profiles. Establish the agency as an organizational unit during signup.

**User Value:** Users can access the platform securely and manage their identity. New agencies can onboard without friction.

**FRs Addressed:** FR1, FR2, FR3, FR4, FR27 (agency isolation foundation)

---

## Story 2.1: Signup Page & Agency Creation

As a **new user**,
I want **to create an account and establish my agency**,
So that **I can start using docuMINE for my insurance practice**.

**Acceptance Criteria:**

**Given** I am on the signup page (`/signup`)
**When** I fill out the signup form
**Then** I see form fields for:
- Full name (required, 2-100 characters)
- Email (required, valid email format per RFC 5322)
- Password (required, minimum 8 characters, 1 uppercase, 1 number, 1 special character)
- Agency name (required, 2-100 characters)

**And** real-time validation shows:
- Password strength indicator (weak/medium/strong) using visual bar
- Email format validation on blur
- Field-level error messages in red (#dc2626) below each field

**And** when I click "Create Account":
- Button shows loading state (spinner + "Creating...")
- On success: agency record created, user record created with role='admin', redirect to dashboard
- On error: toast notification with specific error message

**And** the page follows UX spec:
- Trustworthy Slate color theme
- System font stack
- Clean, minimal layout - no distractions
- "Already have an account? Sign in" link

**Prerequisites:** Story 1.3, Story 1.5

**Technical Notes:**
- Use Supabase Auth `signUp()` with email/password
- Create agency and user records in a transaction after auth signup succeeds
- First user of agency automatically becomes admin
- Use Zod for form validation schema
- Implement using React Hook Form for form state management

---

## Story 2.2: Post-Signup Agency & User Record Creation

As the **system**,
I want **to create agency and user records after successful auth signup**,
So that **the multi-tenant data model is properly initialized**.

**Acceptance Criteria:**

**Given** a user completes Supabase Auth signup
**When** the auth trigger fires
**Then** a new agency record is created:
- `name` from signup form
- `subscription_tier` = 'starter'
- `seat_limit` = 3

**And** a new user record is created:
- `id` matches auth.users.id
- `agency_id` references the new agency
- `email` from signup
- `full_name` from signup
- `role` = 'admin' (first user is always admin)

**And** this happens atomically (both succeed or both fail)

**And** if record creation fails, the auth user is cleaned up

**Prerequisites:** Story 1.2

**Technical Notes:**
- Can use Supabase database trigger OR handle in API route after signup
- Prefer API route approach for better error handling
- Wrap in transaction: `supabase.rpc('create_agency_and_user', {...})`
- Consider edge case: what if agency name already exists? (allow duplicates for MVP)

---

## Story 2.3: Login Page

As a **returning user**,
I want **to sign into my account**,
So that **I can access my documents and continue my work**.

**Acceptance Criteria:**

**Given** I am on the login page (`/login`)
**When** I view the page
**Then** I see form fields for:
- Email (required)
- Password (required)
- "Remember me" checkbox (controls session duration)

**And** when I submit valid credentials:
- Button shows loading state
- On success: redirect to `/documents` (dashboard)
- Session persists based on "Remember me" (7 days vs session-only)

**And** when I submit invalid credentials:
- Error toast: "Invalid email or password"
- Form remains filled (except password cleared)
- No indication of which field is wrong (security)

**And** the page includes:
- "Forgot password?" link to `/reset-password`
- "Don't have an account? Sign up" link
- Clean Trustworthy Slate styling per UX spec

**Prerequisites:** Story 1.3

**Technical Notes:**
- Use Supabase Auth `signInWithPassword()`
- Handle "Remember me" via session options
- Rate limiting: consider blocking after 5 failed attempts (via Supabase or custom)
- Log failed attempts for security monitoring

---

## Story 2.4: Session Management & Auth Middleware

As a **logged-in user**,
I want **my session to persist and auto-refresh**,
So that **I don't have to log in repeatedly during normal use**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate the app or return after closing the browser
**Then** my session remains valid if not expired

**And** sessions auto-refresh before expiry (handled by Supabase middleware)

**And** protected routes (`/documents`, `/compare`, `/settings`) require authentication:
- Unauthenticated users redirected to `/login`
- Original URL preserved for post-login redirect

**And** public routes (`/`, `/login`, `/signup`, `/reset-password`) are accessible without auth

**And** logout clears session completely:
- Logout button in header user menu
- Clears all session data
- Redirects to `/login`

**Prerequisites:** Story 2.3

**Technical Notes:**
- Middleware in `src/middleware.ts` handles route protection
- Use Supabase `getSession()` to check auth state
- Store redirect URL in query param: `/login?redirect=/documents/abc`
- Test session expiry and refresh behavior

---

## Story 2.5: Password Reset Flow

As a **user who forgot my password**,
I want **to reset it via email verification**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the reset password page (`/reset-password`)
**When** I enter my email and submit
**Then** I see: "If an account exists with this email, you'll receive a reset link"
- Same message whether email exists or not (security)
- Button disabled for 60 seconds to prevent spam

**And** if email exists, reset email is sent via Resend:
- Subject: "Reset your docuMINE password"
- Contains secure reset link (valid 1 hour)
- Professional template with docuMINE branding

**And** when I click the reset link:
- Taken to password update page
- Can enter new password (same validation as signup)
- On success: "Password updated" + redirect to login
- On error (expired link): "This link has expired. Request a new one."

**Prerequisites:** Story 2.3

**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()`
- Configure Resend as email provider in Supabase
- Create email template in `supabase/templates/` or via Resend
- Handle `type=recovery` callback in auth callback route

---

## Story 2.6: User Profile Management

As a **logged-in user**,
I want **to update my profile information**,
So that **my account details stay current**.

**Acceptance Criteria:**

**Given** I am on the settings page (`/settings`)
**When** I view the profile section
**Then** I see my current profile info:
- Full name (editable)
- Email (display only - cannot change for MVP)
- Agency name (display only)
- Role (display only: Admin or Member)

**And** when I update my name and save:
- Validation: 2-100 characters
- Success toast: "Profile updated"
- Changes reflected immediately

**And** the settings page uses clean tab layout:
- Profile tab (this story)
- Agency tab (Epic 3)
- Billing tab (Epic 3)

**Prerequisites:** Story 2.4

**Technical Notes:**
- Update `users` table via Supabase
- Consider adding profile picture later (out of MVP scope)
- Settings layout should accommodate future tabs

---
