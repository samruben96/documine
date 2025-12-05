# Tasks / Subtasks

- [x] **Task 1: Add removeTeamMember server action** (AC: 3.3.2, 3.3.3, 3.3.4, 3.3.5)
  - [x] Add `removeTeamMember(userId: string)` to `src/app/(dashboard)/settings/actions.ts`
  - [x] Verify current user is admin
  - [x] Verify target user is not the current user (cannot remove self)
  - [x] Verify target user is not the last admin (count admins, if target is admin and count === 1, block)
  - [x] Delete user record from users table
  - [x] Delete auth user via `supabase.auth.admin.deleteUser(userId)`
  - [x] Return success/error response with appropriate message

- [x] **Task 2: Add changeUserRole server action** (AC: 3.3.6, 3.3.7, 3.3.5)
  - [x] Add `changeUserRole(userId: string, newRole: 'admin' | 'member')` to actions.ts
  - [x] Verify current user is admin
  - [x] Verify target user is not the current user (cannot change own role)
  - [x] If demoting admin to member, verify at least one other admin exists
  - [x] Update `users.role` in database
  - [x] Call `revalidatePath('/settings')` to refresh UI
  - [x] Return success toast: "Role updated to {role}"

- [x] **Task 3: Create RemoveUserModal component** (AC: 3.3.2, 3.3.3)
  - [x] Create `src/components/settings/remove-user-modal.tsx`
  - [x] Accept props: `user: { id, full_name }`, `agencyName: string`, `isOpen`, `onClose`, `onConfirm`
  - [x] Display confirmation message with user name and agency name
  - [x] "Cancel" button closes modal
  - [x] "Remove" button calls onConfirm with loading state
  - [x] Handle error display via toast

- [x] **Task 4: Add role toggle to team member rows** (AC: 3.3.6, 3.3.7)
  - [x] Modify `src/components/settings/team-tab.tsx` to add role toggle/dropdown
  - [x] Use shadcn/ui Select or custom toggle component
  - [x] Show current role as selected value
  - [x] Disable for current user's row
  - [x] Disable for non-admin viewers
  - [x] On change, call `changeUserRole` server action
  - [x] Show loading state during role change

- [x] **Task 5: Add remove button to team member rows** (AC: 3.3.2, 3.3.4, 3.3.8)
  - [x] Add "Remove" button (trash icon) to each team member row
  - [x] Disable for current user's row
  - [x] Hide for non-admin viewers
  - [x] On click, open RemoveUserModal
  - [x] On confirm, call `removeTeamMember` and refresh list

- [x] **Task 6: Implement view-only mode for non-admins** (AC: 3.3.8)
  - [x] Pass `isAdmin` prop to TeamTab component
  - [x] Conditionally hide/disable all action elements (role toggle, remove button, invite button)
  - [x] Ensure team list is still visible and readable

- [x] **Task 7: Add unit tests for new actions** (All ACs)
  - [x] Test removeTeamMember requires admin role
  - [x] Test removeTeamMember prevents self-removal
  - [x] Test removeTeamMember prevents removing last admin
  - [x] Test changeUserRole requires admin role
  - [x] Test changeUserRole prevents self-role-change
  - [x] Test changeUserRole prevents demoting last admin

- [x] **Task 8: Build and test verification** (All ACs)
  - [x] Verify `npm run build` succeeds
  - [x] Verify all tests pass
  - [ ] Manual test: admin can view team, change roles, remove members
  - [ ] Manual test: member sees view-only team list
