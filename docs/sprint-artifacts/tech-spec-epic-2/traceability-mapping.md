# Traceability Mapping

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
