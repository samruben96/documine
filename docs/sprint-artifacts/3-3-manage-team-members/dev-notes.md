# Dev Notes

## Architecture Patterns & Constraints

**Remove Team Member Flow (Per Tech Spec):**
```
Admin clicks "Remove" on member
    │
    ├─> Confirmation modal:
    │   "Remove {name} from {agency}?"
    │   "They will lose access to all agency documents."
    │
    └─> Confirm → Server Action: removeTeamMember()
        │
        ├─> 1. Verify admin role
        │
        ├─> 2. Check not removing self
        │
        ├─> 3. Check admin count if target is admin
        │       SELECT COUNT(*) FROM users WHERE agency_id = $agency AND role = 'admin'
        │       If count = 1 and target is admin → Error: "Cannot remove last admin"
        │
        ├─> 4. Delete user record (CASCADE handles related data)
        │
        ├─> 5. Delete auth user via Supabase admin API
        │
        └─> 6. Success toast: "Member removed"
```

**Role Change Flow (Per Tech Spec):**
```
Admin toggles role on member row
    │
    └─> Server Action: changeUserRole()
        │
        ├─> 1. Verify admin role
        │
        ├─> 2. Check not changing own role
        │
        ├─> 3. If demoting admin → check at least one other admin exists
        │
        ├─> 4. UPDATE users SET role = $newRole WHERE id = $userId
        │
        └─> 5. Success toast: "Role updated"
```

**Existing Components to Reuse:**
- `team-tab.tsx` - Already displays team members and pending invitations
- `actions.ts` - Contains `inviteUser`, `resendInvitation`, `cancelInvitation`
- Dialog component from shadcn/ui
- Toast notifications via Sonner

## Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── settings/
│       └── remove-user-modal.tsx  # Confirmation modal
```

**Existing Files to Modify:**
```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx           # Pass isAdmin to TeamTab
│           └── actions.ts         # Add removeTeamMember, changeUserRole
├── components/
│   └── settings/
│       └── team-tab.tsx           # Add role toggle, remove button
```

## Learnings from Previous Story

**From Story 3-2-invite-users-to-agency (Status: done)**

- **Team Tab Structure**: Team tab exists with team members list and pending invitations sections
- **Server Actions Pattern**: Auth operations use Next.js server actions at `src/app/(dashboard)/settings/actions.ts`
- **Service Role Client**: Use `createServiceClient()` from `src/lib/supabase/server.ts` for admin API calls (`auth.admin.deleteUser`)
- **Validation Pattern**: Zod schemas in `src/lib/validations/auth.ts` - use `.issues` not `.errors` (Zod v4)
- **Admin Check Pattern**: Query user role from users table, check `role === 'admin'` before allowing admin actions
- **Loading State Pattern**: Use `useTransition` for server action loading states
- **Revalidation Pattern**: Use `revalidatePath('/settings')` after mutations to refresh data
- **Migration**: `00005_create_invitations.sql` exists with RLS policies

**Key Files to Reference:**
- `documine/src/app/(dashboard)/settings/actions.ts` - Follow existing patterns for inviteUser, resendInvitation, cancelInvitation
- `documine/src/components/settings/team-tab.tsx` - Existing team display component
- `documine/src/lib/supabase/server.ts` - `createServiceClient()` for auth.admin API

[Source: docs/sprint-artifacts/3-2-invite-users-to-agency.md#Dev-Agent-Record]

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Story-3.3-Manage-Team-Members]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing]
- [Source: docs/epics.md#Story-3.3-Manage-Team-Members]
- [Source: docs/architecture.md#Data-Architecture]
- [Source: docs/sprint-artifacts/3-2-invite-users-to-agency.md#Dev-Notes]

## Technical Notes

**Server Action Pattern (removeTeamMember):**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function removeTeamMember(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Get authenticated user and verify admin role
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 2. Get current user's role and agency_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    return { success: false, error: 'Only admins can remove team members' };
  }

  // 3. Prevent self-removal
  if (userId === user.id) {
    return { success: false, error: 'You cannot remove yourself from the agency' };
  }

  const agencyId = currentUser.agency_id;

  // 4. Get target user info
  const { data: targetUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('agency_id', agencyId)
    .single();

  if (!targetUser) {
    return { success: false, error: 'User not found in your agency' };
  }

  // 5. If removing an admin, check admin count
  if (targetUser.role === 'admin') {
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'admin');

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'Cannot remove the last admin. Promote another member to admin first.' };
    }
  }

  // 6. Delete user record
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (deleteError) {
    return { success: false, error: 'Failed to remove user' };
  }

  // 7. Delete auth user via admin API
  const serviceClient = createServiceClient();
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    // Log error but don't fail - user record already deleted
    console.error('Failed to delete auth user:', authDeleteError);
  }

  revalidatePath('/settings');
  return { success: true };
}
```

**Server Action Pattern (changeUserRole):**
```typescript
export async function changeUserRole(
  userId: string,
  newRole: 'admin' | 'member'
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get current user's role and agency
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    return { success: false, error: 'Only admins can change user roles' };
  }

  // Prevent self-role-change
  if (userId === user.id) {
    return { success: false, error: 'You cannot change your own role' };
  }

  const agencyId = currentUser.agency_id;

  // Get target user's current role
  const { data: targetUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('agency_id', agencyId)
    .single();

  if (!targetUser) {
    return { success: false, error: 'User not found in your agency' };
  }

  // If demoting admin to member, check admin count
  if (targetUser.role === 'admin' && newRole === 'member') {
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'admin');

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'Cannot demote the last admin. Promote another member to admin first.' };
    }
  }

  // Update role
  const { error: updateError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to update role' };
  }

  revalidatePath('/settings');
  return { success: true };
}
```
