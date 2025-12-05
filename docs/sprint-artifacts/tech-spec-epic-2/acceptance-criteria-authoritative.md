# Acceptance Criteria (Authoritative)

## Story 2.1: Signup Page & Agency Creation

1. **AC-2.1.1:** Signup form displays fields: Full name, Email, Password, Agency name
2. **AC-2.1.2:** Password field shows strength indicator (weak/medium/strong)
3. **AC-2.1.3:** Real-time validation shows field-level errors on blur
4. **AC-2.1.4:** Submit button shows loading state during submission
5. **AC-2.1.5:** Successful signup redirects to /documents
6. **AC-2.1.6:** Error displays as toast notification
7. **AC-2.1.7:** Page follows UX spec (Trustworthy Slate theme, system fonts)

## Story 2.2: Post-Signup Agency & User Record Creation

8. **AC-2.2.1:** Agency record created with name from form, tier='starter', seat_limit=3
9. **AC-2.2.2:** User record created with id matching auth.users.id
10. **AC-2.2.3:** User role set to 'admin' for first agency user
11. **AC-2.2.4:** Agency and user creation is atomic (both succeed or both fail)
12. **AC-2.2.5:** If record creation fails, auth user is cleaned up

## Story 2.3: Login Page

13. **AC-2.3.1:** Login form displays Email, Password, and "Remember me" checkbox
14. **AC-2.3.2:** Submit shows loading state
15. **AC-2.3.3:** Successful login redirects to /documents or ?redirect param
16. **AC-2.3.4:** Invalid credentials show generic error (no indication which field is wrong)
17. **AC-2.3.5:** Page includes "Forgot password?" and "Sign up" links

## Story 2.4: Session Management & Auth Middleware

18. **AC-2.4.1:** Session persists across browser sessions when "Remember me" is checked
19. **AC-2.4.2:** Session auto-refreshes before expiry
20. **AC-2.4.3:** Protected routes (/documents, /compare, /settings) redirect to /login when unauthenticated
21. **AC-2.4.4:** Public routes (/, /login, /signup, /reset-password) accessible without auth
22. **AC-2.4.5:** Authenticated users redirected away from auth pages to /documents
23. **AC-2.4.6:** Logout clears session and redirects to /login

## Story 2.5: Password Reset Flow

24. **AC-2.5.1:** Reset request page accepts email and shows generic success message
25. **AC-2.5.2:** Reset email sent via Resend with secure link (valid 1 hour)
26. **AC-2.5.3:** Reset link redirects to password update page
27. **AC-2.5.4:** New password must meet strength requirements
28. **AC-2.5.5:** Expired link shows error with "Request new link" option
29. **AC-2.5.6:** Successful reset redirects to login with success message

## Story 2.6: User Profile Management

30. **AC-2.6.1:** Settings page shows Profile tab with: Full name (editable), Email (read-only), Agency name (read-only), Role (read-only)
31. **AC-2.6.2:** Name update validates 2-100 characters
32. **AC-2.6.3:** Save shows success toast: "Profile updated"
33. **AC-2.6.4:** Settings page layout includes tabs for Profile, Agency, Billing (Agency/Billing disabled for non-admins)
