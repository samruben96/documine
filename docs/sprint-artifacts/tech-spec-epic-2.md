# Epic Technical Specification: User Authentication & Onboarding

Date: 2025-11-26
Author: Sam
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the complete user authentication and onboarding system for docuMINE. This epic enables new users to create accounts, establish their agencies as organizational units, securely sign in, reset passwords, and manage their profiles. The authentication system is built on Supabase Auth with Row Level Security ensuring multi-tenant agency isolation from the first login.

This epic directly addresses the PRD's core requirement that users can access the platform securely while maintaining the zero-learning-curve UX principle. The signup flow simultaneously creates both the user account and agency tenant, establishing the multi-tenant foundation that all subsequent features depend on.

## Objectives and Scope

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

## System Architecture Alignment

**Components Referenced:**
- Supabase Auth for email/password authentication
- Supabase PostgreSQL with RLS policies for agency isolation
- Next.js 15 App Router for page routing
- Resend for transactional emails (password reset)
- @supabase/ssr for cookie-based session management
- Zod for form validation schemas

**Architecture Constraints:**
- All authenticated routes must check session via middleware
- User records link to `auth.users.id` as foreign key
- Every user belongs to exactly one agency
- First user of an agency automatically becomes `admin`
- Session tokens stored in httpOnly cookies (not localStorage)
- Password requirements: 8+ characters, 1 uppercase, 1 number, 1 special character

**Key Decisions Applied:**
- ADR-001: Supabase-Native authentication (unified with database)
- ADR-004: Row Level Security for agency isolation (user.agency_id matches data)
- UX Principle: Zero learning curve - signup form is single page, no multi-step wizard

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Auth Actions | Server actions for signup/login/logout/reset | Form data | Redirect or error | `src/app/(auth)/actions.ts` |
| Auth Middleware | Session validation, route protection | Request + cookies | Pass/redirect to login | `src/middleware.ts` |
| Signup Form | Client component for user registration | User input | Validated form data | `src/app/(auth)/signup/page.tsx` |
| Login Form | Client component for authentication | Credentials | Authenticated session | `src/app/(auth)/login/page.tsx` |
| Reset Password | Request and update password flows | Email / new password | Email sent / password updated | `src/app/(auth)/reset-password/` |
| Profile Settings | View and update user profile | User session | Profile updates | `src/app/(dashboard)/settings/page.tsx` |
| Resend Email Client | Send transactional emails | Template + recipient | Delivery status | `src/lib/email/resend.ts` |

### Data Models and Contracts

**Tables Used (from Epic 1):**

```sql
-- Agencies (already exists from Epic 1)
-- Used for: Creating new agency on signup
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'starter',
  seat_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (already exists from Epic 1)
-- Used for: Creating user record linked to agency and auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**TypeScript Types:**

```typescript
// src/types/auth.ts
export interface SignupFormData {
  email: string;
  password: string;
  fullName: string;
  agencyName: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'member';
  agencyId: string;
  agencyName: string;
}

// Zod schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});
```

### APIs and Interfaces

**Server Actions:**

```typescript
// src/app/(auth)/actions.ts

// Signup action
export async function signup(formData: SignupFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate with Zod
  // 2. Create Supabase Auth user
  // 3. Create agency record
  // 4. Create user record with role='admin'
  // 5. Redirect to /documents
}

// Login action
export async function login(formData: LoginFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate credentials
  // 2. Call supabase.auth.signInWithPassword()
  // 3. Set session cookie
  // 4. Redirect to /documents or ?redirect param
}

// Logout action
export async function logout(): Promise<void> {
  // 1. Call supabase.auth.signOut()
  // 2. Clear session cookie
  // 3. Redirect to /login
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
}> {
  // 1. Call supabase.auth.resetPasswordForEmail()
  // 2. Always return success (security: don't reveal if email exists)
}

// Update password (from reset link)
export async function updatePassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate password strength
  // 2. Call supabase.auth.updateUser({ password })
  // 3. Redirect to login
}

// Update profile
export async function updateProfile(data: { fullName: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input
  // 2. Update users table
}
```

**Middleware Route Protection:**

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/documents', '/compare', '/settings'];
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/signup'];
  const isAuthPage = authPaths.includes(request.nextUrl.pathname);

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/documents', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Email Templates (Resend):**

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'docuMINE <noreply@documine.com>',
      to: email,
      subject: 'Reset your docuMINE password',
      html: `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to send email' };
  }
}
```

### Workflows and Sequencing

**Signup Flow:**

```
User fills signup form
    │
    ├─> Client: Validate form with Zod (real-time)
    │
    └─> Submit → Server Action: signup()
        │
        ├─> 1. Re-validate server-side
        │
        ├─> 2. supabase.auth.signUp({ email, password })
        │       Returns: auth_user.id
        │
        ├─> 3. INSERT INTO agencies (name) VALUES ($agencyName)
        │       Returns: agency.id
        │
        ├─> 4. INSERT INTO users (id, agency_id, email, full_name, role)
        │       VALUES (auth_user.id, agency.id, email, fullName, 'admin')
        │
        ├─> 5. Auto-login: session cookie set
        │
        └─> 6. redirect('/documents')
```

**Login Flow:**

```
User fills login form
    │
    ├─> Submit → Server Action: login()
    │
    ├─> 1. supabase.auth.signInWithPassword({ email, password })
    │       Success: Session created, cookie set
    │       Failure: Return error
    │
    ├─> 2. Check ?redirect query param
    │       If present: redirect(redirect)
    │       If absent: redirect('/documents')
    │
    └─> Dashboard loads with authenticated session
```

**Password Reset Flow:**

```
User on /reset-password
    │
    ├─> 1. Enter email, submit
    │       Server: supabase.auth.resetPasswordForEmail()
    │       UI: "If account exists, check your email"
    │
    ├─> 2. User clicks email link
    │       → /reset-password?code=xxx&type=recovery
    │       Supabase: Validates code, sets session
    │
    ├─> 3. User enters new password
    │       → Server: supabase.auth.updateUser({ password })
    │
    └─> 4. Success: redirect('/login') with success message
```

**Session Refresh Flow:**

```
Every request (middleware)
    │
    ├─> supabase.auth.getSession()
    │
    ├─> If session exists but expired:
    │       @supabase/ssr auto-refreshes
    │       New cookies set in response
    │
    ├─> If session valid: Pass through
    │
    └─> If no session + protected route: Redirect to /login
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Form submission | < 2s end-to-end | Server actions, no client-side API calls |
| Page load (auth pages) | < 1s | Static generation where possible |
| Session validation | < 50ms | Cookie-based, no DB query needed |
| Password reset email | < 5s delivery | Resend API with retries |

### Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Password hashing | bcrypt via Supabase Auth | NFR8 |
| Session tokens | httpOnly cookies, Secure flag | NFR9 |
| CSRF protection | Next.js Server Actions (built-in) | Best practice |
| Password strength | Enforced via Zod schema | FR1 |
| Rate limiting | Supabase Auth built-in (post-MVP: Upstash) | NFR9 |
| Token expiry | 7 days (remember me) / session (default) | NFR9 |

**Password Policy:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Session Policy:**
- Default: Session-only cookie (expires on browser close)
- "Remember me": 7-day expiry
- Auto-refresh before expiry

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Auth availability | 99.9% | Supabase managed service |
| Email delivery | 99% within 5 seconds | Resend SLA |
| Error recovery | Graceful fallbacks | Error boundaries, retry buttons |

### Observability

| Signal | Implementation |
|--------|----------------|
| Login attempts | Log: email (hashed), success/failure, timestamp |
| Signup events | Log: agency created, user created |
| Password resets | Log: requested (hashed email), completed |
| Session errors | Log: token refresh failures |

**Log Format:**
```json
{
  "level": "info",
  "event": "auth.login.success",
  "userId": "uuid",
  "agencyId": "uuid",
  "timestamp": "ISO-8601"
}
```

## Dependencies and Integrations

### NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Supabase client |
| @supabase/ssr | ^0.7.0 | Server-side session handling |
| zod | ^4.1.13 | Form validation |
| next | 16.0.4 | Framework |
| react | 19.2.0 | UI library |

### New Dependencies Required

| Package | Version | Purpose |
|---------|---------|---------|
| resend | latest | Transactional email for password reset |
| react-hook-form | latest | Form state management (optional but recommended) |
| @hookform/resolvers | latest | Zod integration with react-hook-form |

### External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase Auth | User authentication | Project URL + keys (already configured) |
| Resend | Password reset emails | RESEND_API_KEY environment variable |

### Environment Variables (New)

```bash
# Add to existing .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx       # Resend API key for emails
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For password reset links
```

## Acceptance Criteria (Authoritative)

### Story 2.1: Signup Page & Agency Creation

1. **AC-2.1.1:** Signup form displays fields: Full name, Email, Password, Agency name
2. **AC-2.1.2:** Password field shows strength indicator (weak/medium/strong)
3. **AC-2.1.3:** Real-time validation shows field-level errors on blur
4. **AC-2.1.4:** Submit button shows loading state during submission
5. **AC-2.1.5:** Successful signup redirects to /documents
6. **AC-2.1.6:** Error displays as toast notification
7. **AC-2.1.7:** Page follows UX spec (Trustworthy Slate theme, system fonts)

### Story 2.2: Post-Signup Agency & User Record Creation

8. **AC-2.2.1:** Agency record created with name from form, tier='starter', seat_limit=3
9. **AC-2.2.2:** User record created with id matching auth.users.id
10. **AC-2.2.3:** User role set to 'admin' for first agency user
11. **AC-2.2.4:** Agency and user creation is atomic (both succeed or both fail)
12. **AC-2.2.5:** If record creation fails, auth user is cleaned up

### Story 2.3: Login Page

13. **AC-2.3.1:** Login form displays Email, Password, and "Remember me" checkbox
14. **AC-2.3.2:** Submit shows loading state
15. **AC-2.3.3:** Successful login redirects to /documents or ?redirect param
16. **AC-2.3.4:** Invalid credentials show generic error (no indication which field is wrong)
17. **AC-2.3.5:** Page includes "Forgot password?" and "Sign up" links

### Story 2.4: Session Management & Auth Middleware

18. **AC-2.4.1:** Session persists across browser sessions when "Remember me" is checked
19. **AC-2.4.2:** Session auto-refreshes before expiry
20. **AC-2.4.3:** Protected routes (/documents, /compare, /settings) redirect to /login when unauthenticated
21. **AC-2.4.4:** Public routes (/, /login, /signup, /reset-password) accessible without auth
22. **AC-2.4.5:** Authenticated users redirected away from auth pages to /documents
23. **AC-2.4.6:** Logout clears session and redirects to /login

### Story 2.5: Password Reset Flow

24. **AC-2.5.1:** Reset request page accepts email and shows generic success message
25. **AC-2.5.2:** Reset email sent via Resend with secure link (valid 1 hour)
26. **AC-2.5.3:** Reset link redirects to password update page
27. **AC-2.5.4:** New password must meet strength requirements
28. **AC-2.5.5:** Expired link shows error with "Request new link" option
29. **AC-2.5.6:** Successful reset redirects to login with success message

### Story 2.6: User Profile Management

30. **AC-2.6.1:** Settings page shows Profile tab with: Full name (editable), Email (read-only), Agency name (read-only), Role (read-only)
31. **AC-2.6.2:** Name update validates 2-100 characters
32. **AC-2.6.3:** Save shows success toast: "Profile updated"
33. **AC-2.6.4:** Settings page layout includes tabs for Profile, Agency, Billing (Agency/Billing disabled for non-admins)

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-2.1.1 | Signup Form | `/signup/page.tsx` | Verify all form fields render |
| AC-2.1.2 | Signup Form | Password input component | Test weak/medium/strong thresholds |
| AC-2.1.3 | Signup Form | Form validation | Blur each field, verify error messages |
| AC-2.1.4 | Signup Form | Submit button | Verify loading spinner on submit |
| AC-2.1.5 | Signup Flow | Server action | Submit valid form, verify redirect |
| AC-2.1.6 | Signup Flow | Toast component | Submit with existing email, verify error toast |
| AC-2.1.7 | Signup Form | Page styling | Visual inspection of theme colors |
| AC-2.2.1 | Agency Creation | Server action | Query agencies table after signup |
| AC-2.2.2 | User Creation | Server action | Verify users.id = auth.users.id |
| AC-2.2.3 | User Creation | Server action | Verify first user role = 'admin' |
| AC-2.2.4 | Atomic Creation | Server action | Simulate user insert failure, verify agency rolled back |
| AC-2.2.5 | Error Cleanup | Server action | Simulate agency insert failure, verify auth user deleted |
| AC-2.3.1 | Login Form | `/login/page.tsx` | Verify form fields render |
| AC-2.3.2 | Login Form | Submit button | Verify loading state |
| AC-2.3.3 | Login Flow | Server action | Login, verify redirect to /documents |
| AC-2.3.4 | Login Flow | Error handling | Wrong password, verify generic error |
| AC-2.3.5 | Login Form | Page links | Verify "Forgot password" and "Sign up" links |
| AC-2.4.1 | Session | Middleware + cookies | Login with "Remember me", close browser, return |
| AC-2.4.2 | Session | @supabase/ssr | Simulate expired token, verify refresh |
| AC-2.4.3 | Route Protection | Middleware | Access /documents unauthenticated, verify redirect |
| AC-2.4.4 | Public Routes | Middleware | Access /login without auth, verify accessible |
| AC-2.4.5 | Auth Redirect | Middleware | Access /login authenticated, verify redirect to /documents |
| AC-2.4.6 | Logout | Server action | Click logout, verify redirect and session cleared |
| AC-2.5.1 | Reset Request | `/reset-password/page.tsx` | Submit email, verify success message |
| AC-2.5.2 | Reset Email | Resend integration | Verify email sent with valid link |
| AC-2.5.3 | Reset Link | Auth callback | Click reset link, verify page loads |
| AC-2.5.4 | Password Update | Form validation | Enter weak password, verify rejection |
| AC-2.5.5 | Expired Link | Auth callback | Use expired link, verify error shown |
| AC-2.5.6 | Reset Success | Server action | Update password, verify redirect to login |
| AC-2.6.1 | Profile Settings | `/settings/page.tsx` | Verify all profile fields display |
| AC-2.6.2 | Profile Update | Form validation | Enter 1-char name, verify rejection |
| AC-2.6.3 | Profile Update | Server action | Update name, verify toast |
| AC-2.6.4 | Settings Tabs | Tab component | Verify tabs render, disabled state for non-admins |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: Email delivery delays | Users frustrated waiting for reset | Low | Resend has 99% SLA; show "check spam" message |
| R2: Session token leakage | Security breach | Low | httpOnly cookies, Secure flag, short expiry |
| R3: Atomic transaction failure | Orphaned auth users | Medium | Use Supabase RPC with transaction; implement cleanup |
| R4: Password brute force | Account compromise | Medium | Supabase built-in rate limiting; add Upstash post-MVP |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Supabase Auth handles password hashing securely | Industry-standard bcrypt implementation |
| A2: Single agency per user is sufficient for MVP | PRD specifies one agency per user |
| A3: Email verification not required for MVP | Lower friction signup; can add later |
| A4: Google OAuth can be added later without schema changes | Supabase Auth supports multiple providers |

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should we require email verification before allowing document uploads? | Sam | Deferred - not for MVP |
| Q2: Rate limiting implementation - Supabase built-in vs Upstash? | Sam | Use Supabase for MVP, evaluate Upstash later |
| Q3: Should "Remember me" be 7 days or 30 days? | Sam | Decision: 7 days for MVP |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage |
|-------|-------|-----------|----------|
| Unit | Form validation, Zod schemas | Vitest | All validation rules |
| Integration | Auth flows, database operations | Vitest + Supabase local | Signup, login, reset flows |
| E2E | Complete user journeys | Playwright (post-MVP) | Critical paths |

### Key Test Scenarios

**Signup:**
- Valid form submission creates agency + user
- Duplicate email shows error
- Weak password rejected
- Agency name validation (2-100 chars)

**Login:**
- Valid credentials → redirect to dashboard
- Invalid credentials → generic error
- "Remember me" extends session duration
- Redirect param preserved after login

**Session:**
- Protected routes redirect when unauthenticated
- Session auto-refreshes before expiry
- Logout clears all session data

**Password Reset:**
- Request sends email (verify via test inbox)
- Valid link allows password update
- Expired link shows appropriate error
- New password must meet requirements

### Definition of Done

- [ ] All acceptance criteria verified
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Unit tests pass for validation schemas
- [ ] Integration tests pass for auth flows
- [ ] Manual testing of all 6 stories complete
- [ ] Code reviewed and merged
- [ ] Environment variables documented

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-11-26_
