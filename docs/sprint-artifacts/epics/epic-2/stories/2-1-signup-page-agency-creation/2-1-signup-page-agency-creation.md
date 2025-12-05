# Story 2.1: Signup Page & Agency Creation

Status: Approved

## Story

As a **new user**,
I want **to create an account and establish my agency**,
so that **I can start using docuMINE for my insurance practice**.

## Acceptance Criteria

1. **AC-2.1.1:** Signup form displays fields: Full name, Email, Password, Agency name (all required)

2. **AC-2.1.2:** Password field shows strength indicator (weak/medium/strong) with visual bar:
   - Weak: < 8 chars or missing requirements (red)
   - Medium: 8+ chars with some requirements (amber)
   - Strong: 8+ chars with all requirements (green)

3. **AC-2.1.3:** Real-time validation shows field-level errors on blur:
   - Full name: 2-100 characters
   - Email: Valid email format (RFC 5322)
   - Password: Min 8 chars, 1 uppercase, 1 number, 1 special character
   - Agency name: 2-100 characters
   - Error messages in red (#dc2626) below each field

4. **AC-2.1.4:** Submit button shows loading state during submission:
   - Button disabled during submission
   - Spinner + "Creating..." text displayed
   - Input fields disabled during submission

5. **AC-2.1.5:** Successful signup redirects to /documents:
   - User session established via httpOnly cookie
   - Agency record created
   - User record created with role='admin'

6. **AC-2.1.6:** Error displays as toast notification:
   - Duplicate email: "An account with this email already exists"
   - Generic error: "Something went wrong. Please try again."
   - Toast appears bottom-right, auto-dismisses after 5 seconds

7. **AC-2.1.7:** Page follows UX spec (Trustworthy Slate theme, system fonts):
   - Primary color: Slate #475569
   - Background: White #ffffff
   - Error color: Red #dc2626
   - System font stack
   - "Already have an account? Sign in" link to /login

## Tasks / Subtasks

- [x] **Task 1: Create Auth Route Group and Layout** (AC: 2.1.7)
  - [x] Create `src/app/(auth)/layout.tsx` with centered auth layout
  - [x] Apply Trustworthy Slate theme (white bg, slate accents)
  - [x] Add docuMINE logo/text header
  - [x] Create responsive container (max-width: 400px)

- [x] **Task 2: Create Signup Page Component** (AC: 2.1.1, 2.1.7)
  - [x] Create `src/app/(auth)/signup/page.tsx`
  - [x] Add form with fields: fullName, email, password, agencyName
  - [x] Use shadcn/ui Input components
  - [x] Add "Already have an account? Sign in" link
  - [x] Apply UX spec styling (system fonts, slate colors)

- [x] **Task 3: Implement Zod Validation Schema** (AC: 2.1.3)
  - [x] Create `src/lib/validations/auth.ts`
  - [x] Define `signupSchema` with:
    - `fullName`: string, min 2, max 100
    - `email`: string, email format
    - `password`: string, min 8, regex for uppercase/number/special
    - `agencyName`: string, min 2, max 100
  - [x] Export typed `SignupFormData` interface

- [x] **Task 4: Create Password Strength Indicator** (AC: 2.1.2)
  - [x] Create `src/components/auth/password-strength.tsx`
  - [x] Implement strength calculation:
    - Weak: < 8 chars OR missing requirements
    - Medium: 8+ chars with 2/4 requirements
    - Strong: 8+ chars with all 4 requirements (uppercase, lowercase, number, special)
  - [x] Add visual bar with colors (red/amber/green)
  - [x] Add text label: "Weak" / "Medium" / "Strong"

- [x] **Task 5: Implement Form with React Hook Form** (AC: 2.1.3, 2.1.4)
  - [x] Install react-hook-form and @hookform/resolvers if not present
  - [x] Create form component with useForm hook
  - [x] Connect Zod schema via zodResolver
  - [x] Implement onBlur validation mode
  - [x] Display field-level errors below inputs in red

- [x] **Task 6: Create Signup Server Action** (AC: 2.1.5, 2.1.6)
  - [x] Create `src/app/(auth)/signup/actions.ts`
  - [x] Implement `signup` server action:
    1. Validate form data with Zod
    2. Call `supabase.auth.signUp({ email, password })`
    3. Create agency record (name, tier='starter', seat_limit=3)
    4. Create user record (id, agency_id, email, full_name, role='admin')
    5. Handle errors (duplicate email, generic)
    6. Return success/error response
  - [x] Use Supabase service role client for admin operations

- [x] **Task 7: Implement Atomic Agency/User Creation** (AC: 2.1.5)
  - [x] Create database function `create_agency_and_user` in migrations OR
  - [x] Implement transaction logic in server action
  - [x] Ensure rollback on failure (clean up auth user if agency/user creation fails)

- [x] **Task 8: Add Loading State to Submit Button** (AC: 2.1.4)
  - [x] Track submission state via useFormStatus or local state
  - [x] Disable button and inputs during submission
  - [x] Show spinner + "Creating..." text
  - [x] Re-enable on completion or error

- [x] **Task 9: Integrate Toast Notifications** (AC: 2.1.6)
  - [x] Verify sonner/toast is available (already in package.json)
  - [x] Add Toaster component to auth layout
  - [x] Show success toast (optional) or redirect silently
  - [x] Show error toast on failure with specific messages

- [x] **Task 10: Add Login Link** (AC: 2.1.7)
  - [x] Add "Already have an account?" text below form
  - [x] Add "Sign in" link to /login
  - [x] Style with muted text color

- [x] **Task 11: Write Tests** (All ACs)
  - [x] Create `__tests__/lib/validations/auth.test.ts` - Zod schema tests
  - [x] Create `__tests__/components/auth/password-strength.test.tsx` - Password strength tests
  - [x] Create `__tests__/app/auth/signup/page.test.tsx` - Signup page tests
  - [x] Test form renders all fields
  - [x] Test validation errors appear on invalid input
  - [x] Test password strength indicator updates

## Dev Notes

### Architecture Patterns & Constraints

**Auth Pattern (Per Architecture doc):**
- Use Supabase Auth for authentication
- First user of agency always gets role='admin'
- Session via httpOnly cookies (@supabase/ssr)
- Server actions for auth operations (no API routes)

**Form Pattern (Per UX spec):**
- Validation on blur, not on change (less intrusive)
- Password strength shown immediately as user types
- All fields required (no optional indicator needed)
- Error messages below field in red #dc2626

**Styling (Per UX spec):**
- Trustworthy Slate theme
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`
- Primary: #475569 (slate)
- Background: #ffffff (white)
- Error: #dc2626 (red)

### Project Structure Notes

**Files to Create:**
```
src/
├── app/
│   └── (auth)/
│       ├── layout.tsx           # NEW: Centered auth layout
│       └── signup/
│           ├── page.tsx         # NEW: Signup page component
│           └── actions.ts       # NEW: Server action for signup
├── components/
│   └── auth/
│       └── password-strength.tsx # NEW: Password strength indicator
└── lib/
    └── validations/
        └── auth.ts              # NEW: Zod schemas for auth
```

**Files to Modify:**
- `src/app/layout.tsx` - May need to add Toaster if not present

### Learnings from Previous Story

**From Story 1-6-deployment-pipeline-setup (Status: done)**

- **Production Deployment**: Application live at https://documine.vercel.app
- **GitHub Repo**: https://github.com/samruben96/documine
- **Supabase Cloud**: Linked to project qfhzvkqbbtxvmwiixlhf, migrations applied
- **Environment Variables**: All configured in Vercel (NEXT_PUBLIC_SUPABASE_URL, etc.)
- **Security Headers**: Configured in next.config.ts

**Files Available to Use:**
- `src/lib/errors.ts` - Custom error classes (use for auth errors if needed)
- `src/lib/utils/logger.ts` - Structured logging (use for auth events)
- `src/lib/utils/api-response.ts` - Response helpers (not needed for server actions)
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server Supabase client

**Patterns Established:**
- Barrel exports in `src/lib/utils/index.ts`
- Build must pass before deployment
- Use existing database.types.ts for type safety

[Source: docs/sprint-artifacts/1-6-deployment-pipeline-setup.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-2.md#Story-2.1]
- [Source: docs/epics.md#Story-2.1-Signup-Page-Agency-Creation]
- [Source: docs/architecture.md#Authentication]
- [Source: docs/ux-design-specification.md#Form-Patterns]
- [Source: docs/ux-design-specification.md#Color-System]

### Technical Notes

**Password Validation Regex:**
```typescript
// At least 8 characters with:
// - 1 uppercase: /[A-Z]/
// - 1 lowercase: /[a-z]/
// - 1 number: /[0-9]/
// - 1 special: /[^A-Za-z0-9]/
```

**Server Action Error Handling:**
```typescript
// Handle specific Supabase auth errors
if (error.message.includes('User already registered')) {
  return { error: 'An account with this email already exists' };
}
```

**Atomic Transaction Pattern:**
```typescript
// Option A: Database function (recommended)
const { data, error } = await supabase.rpc('create_agency_and_user', {
  p_auth_user_id: authUser.id,
  p_email: email,
  p_full_name: fullName,
  p_agency_name: agencyName,
});

// Option B: Application-level (fallback)
// 1. Insert agency
// 2. Insert user
// 3. If user fails, delete agency
// 4. If both fail, delete auth user via admin API
```

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/2-1-signup-page-agency-creation.context.xml`

### Agent Model Used

claude-opus-4-5-20251101 (Amelia - Dev Agent)

### Debug Log References

N/A

### Completion Notes List

- All 11 tasks completed
- Build passes (`npm run build`)
- 92 tests pass (`npm run test`)
- Implemented atomic agency/user creation with rollback on failure
- Used application-level transaction pattern (Option B from tech spec)

### File List

**Created:**
- `src/app/(auth)/layout.tsx` - Auth layout with Toaster
- `src/app/(auth)/signup/page.tsx` - Signup form component
- `src/app/(auth)/signup/actions.ts` - Signup server action
- `src/lib/validations/auth.ts` - Zod schemas for auth
- `src/components/auth/password-strength.tsx` - Password strength indicator
- `__tests__/lib/validations/auth.test.ts` - Validation schema tests (12 tests)
- `__tests__/components/auth/password-strength.test.tsx` - Password strength tests (10 tests)
- `__tests__/app/auth/signup/page.test.tsx` - Signup page tests (12 tests)
- `__tests__/setup.ts` - Test setup file

**Modified:**
- `vitest.config.ts` - Added setupFiles
- `package.json` - Added react-hook-form, @hookform/resolvers, @testing-library/user-event, @testing-library/jest-dom

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-26 | SM Agent (Bob) | Initial story draft created via YOLO mode |
| 2025-11-26 | Dev Agent (Amelia) | Implemented all 11 tasks, all ACs satisfied |
| 2025-11-26 | Dev Agent (Amelia) | Senior Developer Review: APPROVED |

---

## Senior Developer Review (AI)

### Review Metadata
- **Reviewer:** Sam (via Dev Agent)
- **Date:** 2025-11-26
- **Outcome:** ✅ **APPROVE**

### Summary

All 7 acceptance criteria verified with evidence. All 11 tasks marked complete have been verified as actually implemented. No HIGH or MEDIUM severity issues found. Minor test coverage gaps are acceptable for initial implementation.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-2.1.1 | Form fields (fullName, email, password, agencyName) | ✅ IMPLEMENTED | `page.tsx:82-175` |
| AC-2.1.2 | Password strength indicator (weak/medium/strong) | ✅ IMPLEMENTED | `password-strength.tsx:21-95` |
| AC-2.1.3 | Real-time validation on blur | ✅ IMPLEMENTED | `page.tsx:36`, `auth.ts:11-29` |
| AC-2.1.4 | Loading state during submission | ✅ IMPLEMENTED | `page.tsx:177-191` |
| AC-2.1.5 | Successful signup redirects to /documents | ✅ IMPLEMENTED | `actions.ts:113` |
| AC-2.1.6 | Error displays as toast notification | ✅ IMPLEMENTED | `page.tsx:56-58`, `layout.tsx:26` |
| AC-2.1.7 | UX spec styling + login link | ✅ IMPLEMENTED | `layout.tsx:9`, `page.tsx:194-203` |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Auth Layout | ✅ | ✅ | `src/app/(auth)/layout.tsx:1-29` |
| Task 2: Signup Page | ✅ | ✅ | `src/app/(auth)/signup/page.tsx:1-206` |
| Task 3: Zod Schema | ✅ | ✅ | `src/lib/validations/auth.ts:11-31` |
| Task 4: Password Strength | ✅ | ✅ | `src/components/auth/password-strength.tsx:1-96` |
| Task 5: React Hook Form | ✅ | ✅ | `page.tsx:29-43` |
| Task 6: Server Action | ✅ | ✅ | `actions.ts:22-114` |
| Task 7: Atomic Creation | ✅ | ✅ | `actions.ts:76-78,95-98` |
| Task 8: Loading State | ✅ | ✅ | `page.tsx:27,183-186` |
| Task 9: Toast Notifications | ✅ | ✅ | `layout.tsx:26`, `page.tsx:56-58` |
| Task 10: Login Link | ✅ | ✅ | `page.tsx:194-203` |
| Task 11: Tests | ✅ | ✅ | 3 test files, 34 tests |

**Summary: 11 of 11 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- ✅ Form rendering tests (AC-2.1.1)
- ✅ Password strength tests (AC-2.1.2)
- ✅ Validation tests (AC-2.1.3)
- ⚠️ No loading state test (AC-2.1.4)
- ⚠️ No redirect test (AC-2.1.5)
- ⚠️ No toast error test (AC-2.1.6)
- ✅ Login link test (AC-2.1.7)

### Architectural Alignment

- ✅ Server actions for auth (not API routes)
- ✅ Supabase Auth with cookie-based sessions
- ✅ First user gets `role='admin'`
- ✅ User.id matches auth.users.id

### Security Notes

- ✅ Server-side Zod validation
- ✅ Service role client for admin operations only
- ✅ Password requirements enforced
- ✅ Atomic rollback prevents orphaned records
- ✅ Generic error messages (no info leakage)

### Action Items

**Advisory Notes:**
- Note: Consider adding loading state test in future iteration
- Note: Consider adding E2E test for signup flow
- Note: Error color uses Tailwind `text-red-600` (functionally equivalent to #dc2626)
