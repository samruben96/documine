# Story 20.2: Admin User Management

Status: done

## Story

As an agency administrator,
I want to manage users in my agency (view, invite, remove, change roles),
so that I can control who has access to AI Buddy and maintain proper role-based permissions.

## Acceptance Criteria

### AC-20.2.1: Paginated User List with Sorting/Search
Given an admin accesses the user management page,
When the page loads,
Then they see a paginated list of all agency users with columns: name, email, role, AI Buddy status, last active.

### AC-20.2.2: Sort and Search Functionality
Given an admin is viewing the user list,
When they click a column header or enter a search term,
Then the list is sorted by that column or filtered by name/email match.

### AC-20.2.3: Invite New User via Email
Given an admin clicks "Invite User",
When they enter an email address and select a role (Producer/Admin),
Then an invitation is sent via Supabase Auth magic link and appears in the pending invitations list.

### AC-20.2.4: Invitation Expiration and Display
Given an invitation has been sent,
When viewing the user management page,
Then pending invitations are displayed with expiration date (7 days from send).

### AC-20.2.5: Remove User with Confirmation
Given an admin clicks "Remove" on a user,
When they confirm in the dialog (which warns about data retention),
Then the user is soft-deleted and can no longer access the agency.

### AC-20.2.6: Change User Role
Given an admin clicks on a user's role,
When they select a different role from the dropdown (Producer/Admin),
Then the user's permissions are updated immediately.

### AC-20.2.7: Cannot Modify Owner
Given an admin views the user list,
When the owner account is displayed,
Then the role is shown as non-editable and "Remove" option is disabled.

### AC-20.2.8: Audit Trail for All Actions
Given any user management action is performed,
When the action completes,
Then an audit log entry is created with the action type and relevant metadata.

### AC-20.2.9: Permission Enforcement
Given a non-admin user attempts to access user management endpoints,
When the API request is made,
Then a 403 Forbidden response is returned.

## Tasks / Subtasks

- [x] **Task 1: Database Schema Updates** (AC: 20.2.3, 20.2.4) ✓
  - [x] Review existing `users` table for required columns (last_active_at, agency_id)
  - [x] Create `ai_buddy_invitations` table if not exists:
    - id, agency_id, email, role, invited_by, invited_at, expires_at, accepted_at
    - UNIQUE constraint on (agency_id, email)
  - [x] Add RLS policies for invitations table
  - [x] Create migration file with DOWN script

- [x] **Task 2: API Routes - User List** (AC: 20.2.1, 20.2.2, 20.2.9) ✓
  - [x] Create `src/app/api/ai-buddy/admin/users/route.ts`
  - [x] Implement GET with pagination (page, limit), sorting (sortBy, sortOrder), search
  - [x] Include AI Buddy status derived from preferences/onboarding
  - [x] Verify `manage_users` permission in middleware
  - [x] Return proper error codes (AIB_007 for insufficient permissions)

- [x] **Task 3: API Routes - Invite User** (AC: 20.2.3, 20.2.8) ✓
  - [x] Create `POST /api/ai-buddy/admin/users/invite`
  - [x] Validate email format and check not already registered
  - [x] Check no pending invitation exists (error AIB_010)
  - [x] Create invitation record with 7-day expiry
  - [x] Trigger Supabase Auth invitation email
  - [x] Log `user_invited` audit event with metadata

- [x] **Task 4: API Routes - Remove User** (AC: 20.2.5, 20.2.7, 20.2.8) ✓
  - [x] Create `DELETE /api/ai-buddy/admin/users/[userId]/route.ts`
  - [x] Block removal of owner (error AIB_011)
  - [x] Implement soft delete (set removed_at timestamp)
  - [x] Revoke all AI Buddy permissions
  - [x] Log `user_removed` audit event

- [x] **Task 5: API Routes - Change Role** (AC: 20.2.6, 20.2.7, 20.2.8) ✓
  - [x] Create `PATCH /api/ai-buddy/admin/users/[userId]/role/route.ts`
  - [x] Block role change for owner (error AIB_013)
  - [x] Block demoting last admin (error AIB_012)
  - [x] Update permissions table based on new role
  - [x] Log `role_changed` audit event

- [x] **Task 6: User Table Component** (AC: 20.2.1, 20.2.2) ✓
  - [x] Create `src/components/ai-buddy/admin/user-management-panel.tsx`
  - [x] Implement sortable columns with visual indicators
  - [x] Implement search input with debounce (300ms)
  - [x] Implement pagination controls
  - [x] Show loading skeleton during data fetch
  - [x] Use existing data-table patterns from docuMINE

- [x] **Task 7: Invite User Dialog** (AC: 20.2.3, 20.2.4) ✓
  - [x] Create `src/components/ai-buddy/admin/invite-user-dialog.tsx`
  - [x] Email input with validation
  - [x] Role selector (Producer/Admin)
  - [x] Show pending invitations list below form
  - [x] Cancel pending invitation option
  - [x] Success toast on invite sent

- [x] **Task 8: Role Change Dialog** (AC: 20.2.6, 20.2.7) ✓
  - [x] Create `src/components/ai-buddy/admin/role-change-dialog.tsx`
  - [x] Disabled state for owner role
  - [x] Confirmation dialog before role change
  - [x] Demotion/promotion warnings

- [x] **Task 9: Remove User Dialog** (AC: 20.2.5, 20.2.7) ✓
  - [x] Create `src/components/ai-buddy/admin/remove-user-dialog.tsx`
  - [x] Warning message about data retention (audit logs preserved)
  - [x] Disabled state for owner
  - [x] Confirmation required via button click

- [x] **Task 10: User Management Hook** (AC: All) ✓
  - [x] Create `src/hooks/ai-buddy/use-user-management.ts`
  - [x] Implement fetch for user list with pagination, sorting, search
  - [x] Implement mutations for invite, remove, change role
  - [x] Refetch on successful mutations
  - [x] Handle error states with proper error codes

- [x] **Task 11: Admin Page Integration** (AC: All) ✓
  - [x] Add User Management section to admin panel
  - [x] Integrated into settings AI Buddy Admin tab
  - [x] Permission gate for admin-only access (manage_users permission)
  - [x] Mobile responsive layout

- [x] **Task 12: Unit Tests** (AC: All) ✓
  - [x] Create `__tests__/components/ai-buddy/admin/user-management-panel.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/invite-user-dialog.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/role-change-dialog.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/remove-user-dialog.test.tsx`
  - [x] Create `__tests__/hooks/ai-buddy/use-user-management.test.ts`

- [x] **Task 13: E2E Tests** (AC: 20.2.3, 20.2.5, 20.2.6) ✓
  - [x] Create `__tests__/e2e/ai-buddy/admin-user-management.spec.ts`
  - [x] Test: Admin can view user list
  - [x] Test: Admin can invite user and see pending invitation
  - [x] Test: Admin can change user role
  - [x] Test: Admin can remove user with confirmation
  - [x] Test: Non-admin does not see admin tab

## Dev Notes

### Key Implementation Patterns

**Verify-Then-Service Pattern:**
For mutations (remove user, change role), verify ownership via SELECT first, then use service client:
```typescript
// Step 1: VERIFY admin permission via RLS SELECT
const { data: permission } = await supabase
  .from('ai_buddy_permissions')
  .select('permission')
  .eq('user_id', adminId)
  .eq('permission', 'manage_users')
  .single();

if (!permission) return new Response(null, { status: 403 });

// Step 2: PERFORM mutation with service client
const serviceClient = createServiceClient();
await serviceClient.from('users')...
```

**Error Codes:**
| Code | Message |
|------|---------|
| AIB_007 | Insufficient permissions |
| AIB_009 | Email already registered |
| AIB_010 | Invitation pending for email |
| AIB_011 | Cannot remove owner |
| AIB_012 | Cannot demote last admin |
| AIB_013 | Cannot change owner role |

**Default Permissions by Role:**
```typescript
const DEFAULT_PERMISSIONS = {
  producer: ['use_ai_buddy', 'manage_own_projects'],
  admin: ['use_ai_buddy', 'manage_own_projects', 'manage_users',
          'configure_guardrails', 'view_audit_logs', 'view_usage_analytics'],
  owner: ['use_ai_buddy', 'manage_own_projects', 'manage_users',
          'configure_guardrails', 'view_audit_logs', 'view_usage_analytics',
          'manage_billing', 'transfer_ownership', 'delete_agency'],
};
```

### Learnings from Previous Story

**From Story 20.1 (Audit Log Infrastructure) - Status: done**

- **Immutability enforcement**: Database trigger prevents UPDATE/DELETE on audit logs - all user management actions will be permanently recorded
- **Audit logger pattern**: Use existing `auditLog()` helper in `src/lib/ai-buddy/audit-logger.ts`
- **Test organization**: 14 tests in `__tests__/lib/ai-buddy/audit-log-immutability.test.ts` - follow similar unit test structure
- **RLS pattern**: INSERT uses service_role check, SELECT uses permission-based check
- **Index optimization**: Partial indexes for specific query patterns (apply similar approach for user queries)

**Key Files from Story 20.1:**
- `supabase/migrations/20251209000000_audit_log_immutability.sql` - Migration pattern reference
- `src/lib/ai-buddy/audit-logger.ts` - Existing audit write helper
- `__tests__/lib/ai-buddy/audit-log-immutability.test.ts` - Test structure reference

[Source: docs/sprint-artifacts/epics/epic-20/stories/20-1-audit-log-infrastructure/story-20.1-audit-log-infrastructure.md#Completion-Notes-List]

### Project Structure Notes

**New Files:**
```
src/
├── app/api/ai-buddy/admin/users/
│   ├── route.ts                    # GET (list), POST (invite)
│   └── [userId]/
│       ├── route.ts                # DELETE (remove)
│       └── role/route.ts           # PATCH (change role)
├── components/ai-buddy/admin/user-management/
│   ├── user-table.tsx
│   ├── invite-user-dialog.tsx
│   ├── role-dropdown.tsx
│   └── remove-user-dialog.tsx
├── hooks/ai-buddy/
│   └── use-admin-users.ts
└── lib/ai-buddy/admin/
    └── user-service.ts             # Business logic
```

**Alignment with Architecture:**
- Follow kebab-case for component files
- Follow camelCase for hooks with `use` prefix
- API routes under `/api/ai-buddy/admin/`
- Use existing shadcn/ui components (Dialog, DropdownMenu, Input, Table)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Story-20.2] - Acceptance criteria (AC-20.2.1 through AC-20.2.9)
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#User-Management-Endpoints] - API contract specifications
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#User-Invitation-Flow] - Detailed invitation workflow
- [Source: docs/features/ai-buddy/architecture.md#Data-Architecture] - `ai_buddy_permissions` table schema
- [Source: docs/features/ai-buddy/architecture.md#RLS-Service-Client-Pattern] - Verify-Then-Service pattern
- [Source: docs/features/ai-buddy/prd.md#Admin-Permissions] - Permission requirements (FR42-45)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-20/stories/20-2-admin-user-management/20-2-admin-user-management.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required.

### Completion Notes List

1. **Database Migration**: Created `ai_buddy_invitations` table with RLS policies in `supabase/migrations/20251209130000_ai_buddy_invitations.sql`

2. **API Routes Created**:
   - `src/app/api/ai-buddy/admin/users/route.ts` - GET (list users with pagination/sorting/search), POST (invite user), DELETE (remove user)
   - `src/app/api/ai-buddy/admin/users/[userId]/route.ts` - PATCH (change user role)
   - `src/app/api/ai-buddy/admin/invitations/[invitationId]/route.ts` - DELETE (cancel invitation), POST (resend invitation)

3. **Components Created**:
   - `src/components/ai-buddy/admin/user-management-panel.tsx` - Main panel with user table, search, pagination
   - `src/components/ai-buddy/admin/invite-user-dialog.tsx` - Dialog for inviting new users
   - `src/components/ai-buddy/admin/role-change-dialog.tsx` - Dialog for changing user roles
   - `src/components/ai-buddy/admin/remove-user-dialog.tsx` - Dialog for removing users

4. **Hook Created**:
   - `src/hooks/ai-buddy/use-user-management.ts` - State management for user list, pagination, sorting, search, and all CRUD operations

5. **Integration**:
   - Updated `src/app/(dashboard)/settings/page.tsx` to pass `hasManageUsersPermission` prop
   - Updated `src/components/settings/ai-buddy-preferences-tab.tsx` to include UserManagementPanel

6. **Tests Created**:
   - 136 unit tests passing across 12 test files
   - E2E tests in `__tests__/e2e/ai-buddy/admin-user-management.spec.ts`

7. **Error Handling**: Used `AIB_ERROR_CODES` helper pattern instead of throwing `AiBuddyError` class

8. **Audit Logging**: All user management actions (invite, remove, role change) are logged via `logAuditEvent()`

### File List

**Database**:
- `supabase/migrations/20251209130000_ai_buddy_invitations.sql`

**API Routes**:
- `src/app/api/ai-buddy/admin/users/route.ts`
- `src/app/api/ai-buddy/admin/users/[userId]/route.ts`
- `src/app/api/ai-buddy/admin/invitations/[invitationId]/route.ts`

**Components**:
- `src/components/ai-buddy/admin/user-management-panel.tsx`
- `src/components/ai-buddy/admin/invite-user-dialog.tsx`
- `src/components/ai-buddy/admin/role-change-dialog.tsx`
- `src/components/ai-buddy/admin/remove-user-dialog.tsx`

**Hooks**:
- `src/hooks/ai-buddy/use-user-management.ts`

**Types**:
- `src/types/ai-buddy.ts` (updated with AdminUser, AdminInvitation types)

**Modified**:
- `src/app/(dashboard)/settings/page.tsx`
- `src/components/settings/ai-buddy-preferences-tab.tsx`

**Tests**:
- `__tests__/components/ai-buddy/admin/user-management-panel.test.tsx`
- `__tests__/components/ai-buddy/admin/invite-user-dialog.test.tsx`
- `__tests__/components/ai-buddy/admin/role-change-dialog.test.tsx`
- `__tests__/components/ai-buddy/admin/remove-user-dialog.test.tsx`
- `__tests__/hooks/ai-buddy/use-user-management.test.ts`
- `__tests__/e2e/ai-buddy/admin-user-management.spec.ts`

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-09 | SM Agent (Claude Opus 4.5) | Initial story draft created from tech spec |
