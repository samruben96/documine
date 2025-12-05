# Story 2.6: User Profile Management

Status: done

## Story

As a **logged-in user**,
I want **to view and update my profile information**,
so that **my account details stay current and I can access agency settings**.

## Acceptance Criteria

1. **AC-2.6.1:** Settings page (`/settings`) shows Profile tab with:
   - Full name (editable input field)
   - Email (display only, read-only)
   - Agency name (display only, read-only)
   - Role (display only: "Admin" or "Member")

2. **AC-2.6.2:** Name update validates 2-100 characters
   - Show error if name is less than 2 characters
   - Show error if name exceeds 100 characters
   - Real-time validation on blur

3. **AC-2.6.3:** Save shows success toast: "Profile updated"
   - Button shows loading state during save
   - Changes reflected immediately in UI
   - Error toast if save fails

4. **AC-2.6.4:** Settings page layout includes tabs for Profile, Agency, Billing
   - Profile tab active by default
   - Agency tab visible but shows "Coming soon" (Epic 3)
   - Billing tab visible but shows "Coming soon" (Epic 3)
   - Tab design follows UX spec (Trustworthy Slate theme)

## Tasks / Subtasks

- [x] **Task 1: Create Settings Page Layout with Tabs** (AC: 2.6.4)
  - [x] Create `src/app/(dashboard)/settings/page.tsx`
  - [x] Implement tab navigation using shadcn/ui Tabs component
  - [x] Create tabs: Profile, Agency, Billing
  - [x] Style tabs per UX spec (Trustworthy Slate theme)
  - [x] Agency and Billing tabs show "Coming in Epic 3" placeholder

- [x] **Task 2: Create Profile Tab Component** (AC: 2.6.1)
  - [x] Create `src/components/settings/profile-tab.tsx`
  - [x] Display user's full name in editable input
  - [x] Display user's email as read-only text
  - [x] Display agency name as read-only text
  - [x] Display user role as badge (Admin/Member)
  - [x] Fetch current user data on page load

- [x] **Task 3: Create Profile Update Form** (AC: 2.6.1, 2.6.2)
  - [x] Add form with react-hook-form integration
  - [x] Create Zod validation schema for profile (fullName: 2-100 chars)
  - [x] Add validation to `src/lib/validations/auth.ts`
  - [x] Implement real-time validation on blur
  - [x] Show field-level error messages

- [x] **Task 4: Create Profile Update Server Action** (AC: 2.6.2, 2.6.3)
  - [x] Create `src/app/(dashboard)/settings/actions.ts`
  - [x] Add `updateProfile(data: { fullName: string })` server action
  - [x] Validate input server-side with Zod
  - [x] Update `users` table via Supabase
  - [x] Return success/error response

- [x] **Task 5: Implement Save Button with Loading State** (AC: 2.6.3)
  - [x] Add "Save Changes" button to profile form
  - [x] Show loading spinner during save
  - [x] Disable button while saving
  - [x] Show success toast: "Profile updated"
  - [x] Show error toast on failure

- [x] **Task 6: Create User Data Fetching Hook** (AC: 2.6.1)
  - [x] Server component data fetching used instead of hook
  - [x] Fetch user profile with agency data in settings/page.tsx
  - [x] Handle loading and error states via redirect
  - [x] Provide type-safe user data

- [x] **Task 7: Add Unit and Integration Tests** (All ACs)
  - [x] Create `__tests__/app/dashboard/settings/actions.test.ts`
  - [x] Test: updateProfile validates name length (2-100 chars)
  - [x] Test: updateProfile updates database correctly
  - [x] Test: updateProfile returns error for invalid input
  - [x] Create `__tests__/components/settings/profile-tab.test.tsx`
  - [x] Test: Profile tab displays user data correctly
  - [x] Test: Form shows validation errors

- [x] **Task 8: Manual Testing and Verification** (All ACs)
  - [x] Test profile display shows correct data
  - [x] Test name update with valid input
  - [x] Test name validation (too short, too long)
  - [x] Test success toast appears after save
  - [x] Test tabs switch correctly
  - [x] Verify `npm run build` succeeds
  - [x] Verify all tests pass (206 tests passed)

## Dev Notes

### Architecture Patterns & Constraints

**Profile Update Flow (Per Tech Spec):**
```
User on /settings (Profile tab)
    |
    +-> Display current profile data
    |   - Full name (editable)
    |   - Email (read-only)
    |   - Agency name (read-only)
    |   - Role (read-only)
    |
    +-> User edits name, clicks Save
    |   - Client validation: 2-100 chars
    |   - Server action: updateProfile()
    |   - Database: UPDATE users SET full_name = ?
    |
    +-> Success: Toast "Profile updated"
```

**Data Model (Per Architecture):**
```typescript
// Users table structure
interface User {
  id: string;          // References auth.users.id
  agency_id: string;   // References agencies.id
  email: string;
  full_name: string | null;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}
```

**Validation Schema:**
```typescript
// Add to src/lib/validations/auth.ts
export const profileSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
});
```

### Project Structure Notes

**Files to Create:**
```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx              # Settings page with tabs
│           └── actions.ts            # Server actions
├── components/
│   └── settings/
│       ├── profile-tab.tsx           # Profile editing component
│       └── coming-soon-tab.tsx       # Placeholder for Epic 3 tabs
├── hooks/
│   └── use-user.ts                   # User data fetching hook
```

**Existing Files to Modify:**
```
src/
├── lib/
│   └── validations/
│       └── auth.ts                   # Add profileSchema
```

### Learnings from Previous Story

**From Story 2-5-password-reset-flow (Status: done)**

- **Server Actions Pattern**: Auth operations use Next.js server actions at `actions.ts` in route folder
- **Supabase Client**: Server client at `src/lib/supabase/server.ts`
- **Validation Schemas**: Zod schemas in `src/lib/validations/auth.ts` - reuse pattern
- **Suspense Boundary**: Required for `useSearchParams()` in client components
- **Test Pattern**: Tests in `__tests__/` directory with Vitest
- **Toast Pattern**: Use `sonner` for success/error toasts
- **Form Pattern**: react-hook-form with @hookform/resolvers for Zod integration
- **Password Strength Component**: Reusable pattern at `src/components/auth/password-strength.tsx`

[Source: docs/sprint-artifacts/2-5-password-reset-flow.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-2.md#Story-2.6-User-Profile-Management]
- [Source: docs/sprint-artifacts/tech-spec-epic-2.md#APIs-and-Interfaces]
- [Source: docs/epics.md#Story-2.6-User-Profile-Management]
- [Source: docs/architecture.md#Data-Architecture]
- [Source: docs/architecture.md#Code-Organization]

### Technical Notes

**Server Action Pattern:**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validations/auth';

export async function updateProfile(data: { fullName: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input
  const result = profileSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  // 2. Get authenticated user
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Update users table
  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true };
}
```

**User Data Query Pattern:**
```typescript
// Fetch user with agency data
const { data: userData } = await supabase
  .from('users')
  .select(`
    id,
    email,
    full_name,
    role,
    agency:agencies (
      id,
      name
    )
  `)
  .eq('id', user.id)
  .single();
```

**Tab Component Pattern:**
```typescript
// Using shadcn/ui Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="profile">
  <TabsList>
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="agency">Agency</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    <ProfileTab user={user} />
  </TabsContent>
  <TabsContent value="agency">
    <ComingSoonTab title="Agency Settings" />
  </TabsContent>
  <TabsContent value="billing">
    <ComingSoonTab title="Billing" />
  </TabsContent>
</Tabs>
```

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/2-6-user-profile-management.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Used server component data fetching pattern instead of client-side hook for better SSR
- Applied Zod v4 safe error access pattern with optional chaining

### Completion Notes List

- Implemented settings page with Profile/Agency/Billing tabs using shadcn/ui Tabs component
- Profile tab displays editable name, read-only email/agency/role with appropriate styling
- Form validation uses react-hook-form with Zod resolver (mode: 'onBlur' for real-time validation)
- Server action validates input server-side and updates users table via Supabase
- Save button shows loading spinner via useTransition, disabled when form unchanged
- Success/error toasts via sonner ("Profile updated" on success)
- User data fetched server-side in settings page with agency join
- Agency/Billing tabs display "Coming in Epic 3" placeholder with clock icon
- All 206 tests pass including 28 new tests for profile functionality
- Build succeeds with /settings as dynamic route

### File List

**New Files:**
- `src/app/(dashboard)/settings/page.tsx` - Settings page with tabs
- `src/app/(dashboard)/settings/actions.ts` - updateProfile server action
- `src/components/settings/profile-tab.tsx` - Profile editing component
- `src/components/settings/coming-soon-tab.tsx` - Epic 3 placeholder
- `__tests__/app/dashboard/settings/actions.test.ts` - Server action tests
- `__tests__/components/settings/profile-tab.test.tsx` - Component tests
- `__tests__/lib/validations/profile.test.ts` - Validation schema tests

**Modified Files:**
- `src/lib/validations/auth.ts` - Added profileSchema

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-26 | SM Agent (Bob) | Initial story draft created via YOLO mode |
| 2025-11-26 | Dev Agent (Amelia) | Story implementation complete - all ACs satisfied, tests pass, build succeeds |
| 2025-11-27 | Senior Dev Review (AI) | Code review APPROVED - all ACs verified with evidence |

## Senior Developer Review (AI)

### Review Metadata
- **Reviewer:** Sam
- **Date:** 2025-11-27
- **Outcome:** ✅ **APPROVED**

### Summary

Implementation correctly delivers the User Profile Management feature with a settings page at `/settings` containing Profile/Agency/Billing tabs. Profile tab allows editing full name with Zod validation (2-100 chars), displays read-only email/agency/role, and shows success/error toasts on save. Agency and Billing tabs show "Coming in Epic 3" placeholder per story requirements.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-2.6.1 | Profile tab with editable name, read-only email/agency/role | ✅ IMPLEMENTED | `profile-tab.tsx:70-126` |
| AC-2.6.2 | Name validates 2-100 chars with blur validation | ✅ IMPLEMENTED | `auth.ts:60-65`, `profile-tab.tsx:46` |
| AC-2.6.3 | Save shows toast "Profile updated" + loading state | ✅ IMPLEMENTED | `profile-tab.tsx:54,130-137` |
| AC-2.6.4 | Tabs for Profile/Agency/Billing with placeholders | ✅ IMPLEMENTED | `page.tsx:50-74` |

**Summary:** 4 of 4 acceptance criteria fully implemented

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Settings Page Layout | [x] | ✅ VERIFIED | `page.tsx:1-77` |
| Task 2: Profile Tab Component | [x] | ✅ VERIFIED | `profile-tab.tsx:1-143` |
| Task 3: Profile Update Form | [x] | ✅ VERIFIED | `profile-tab.tsx:37-47` |
| Task 4: Server Action | [x] | ✅ VERIFIED | `actions.ts:1-43` |
| Task 5: Save Button Loading | [x] | ✅ VERIFIED | `profile-tab.tsx:130-137` |
| Task 6: User Data Fetching | [x] | ✅ VERIFIED | `page.tsx:21-35` |
| Task 7: Tests | [x] | ✅ VERIFIED | 28 tests in 3 files |
| Task 8: Manual Testing | [x] | ✅ VERIFIED | Build + 206 tests pass |

**Summary:** 8 of 8 completed tasks verified, 0 false completions

### Test Coverage

- `actions.test.ts`: 9 tests (validation, auth, DB errors)
- `profile-tab.test.tsx`: 12 tests (rendering, field states)
- `profile.test.ts`: 7 tests (Zod schema boundaries)

### Architectural Alignment

- ✅ Uses typed Supabase client from `server.ts`
- ✅ Server action validates with Zod before DB operation
- ✅ Uses sonner for toasts per architecture constraints
- ✅ Follows server action pattern from auth flows

### Security Notes

- ✅ Server-side validation before DB operation
- ✅ Authentication check before update
- ✅ Parameterized queries via Supabase (no SQL injection)
- ✅ RLS policies protect user data

### Action Items

**Code Changes Required:**
- None required

**Advisory Notes:**
- Note: Consider adding E2E test for settings page tab navigation (post-MVP)
