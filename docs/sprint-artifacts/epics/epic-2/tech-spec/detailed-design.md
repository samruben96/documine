# Detailed Design

## Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Auth Actions | Server actions for signup/login/logout/reset | Form data | Redirect or error | `src/app/(auth)/actions.ts` |
| Auth Middleware | Session validation, route protection | Request + cookies | Pass/redirect to login | `src/middleware.ts` |
| Signup Form | Client component for user registration | User input | Validated form data | `src/app/(auth)/signup/page.tsx` |
| Login Form | Client component for authentication | Credentials | Authenticated session | `src/app/(auth)/login/page.tsx` |
| Reset Password | Request and update password flows | Email / new password | Email sent / password updated | `src/app/(auth)/reset-password/` |
| Profile Settings | View and update user profile | User session | Profile updates | `src/app/(dashboard)/settings/page.tsx` |
| Resend Email Client | Send transactional emails | Template + recipient | Delivery status | `src/lib/email/resend.ts` |

## Data Models and Contracts

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

## APIs and Interfaces

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

## Workflows and Sequencing

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
