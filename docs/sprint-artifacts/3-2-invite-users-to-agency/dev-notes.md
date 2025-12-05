# Dev Notes

## Architecture Patterns & Constraints

**Invite User Flow (Per Tech Spec):**
```
Admin clicks "Invite User"
    |
    +-> Modal: Enter email, select role
    |
    +-> Submit -> Server Action: inviteUser()
        |
        +-> 1. Verify admin role
        |
        +-> 2. Check seat limit
        |       SELECT COUNT(*) FROM users WHERE agency_id = $agency
        |       SELECT COUNT(*) FROM invitations WHERE agency_id = $agency AND status = 'pending'
        |       If total >= seat_limit -> Error: "Seat limit reached"
        |
        +-> 3. Check for duplicate
        |       If email in users or pending invitations -> Error
        |
        +-> 4. INSERT INTO invitations (agency_id, email, role, invited_by, expires_at, status)
        |
        +-> 5. Call supabase.auth.admin.inviteUserByEmail()
        |       Note: Uses Supabase built-in email (NOT Resend per Epic 2 retro)
        |
        +-> 6. Success toast: "Invitation sent to {email}"
```

**Data Model (Per Tech Spec):**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'cancelled' | 'expired'
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
```

**TypeScript Types:**
```typescript
export interface Invitation {
  id: string;
  agency_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  invited_by: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}
```

## Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── settings/
│       ├── team-tab.tsx           # Team management tab
│       └── invite-user-modal.tsx  # Invitation modal
supabase/
└── migrations/
    └── XXXXX_create_invitations.sql  # New migration
```

**Existing Files to Modify:**
```
src/
├── app/
│   ├── (auth)/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts       # Handle invitation acceptance
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx           # Add Team tab
│           └── actions.ts         # Add invitation actions
├── lib/
│   └── validations/
│       └── auth.ts                # Add inviteUserSchema
```

## Learnings from Previous Story

**From Story 3-1-agency-settings-page (Status: done)**

- **Settings Page Structure**: Settings page exists at `/settings` with Profile/Agency/Billing tabs using shadcn/ui Tabs
- **Server Actions Pattern**: Auth operations use Next.js server actions at `src/app/(dashboard)/settings/actions.ts`
- **Validation Pattern**: Zod schemas in `src/lib/validations/auth.ts` - use `.issues` not `.errors` (Zod v4)
- **Form Pattern**: react-hook-form with @hookform/resolvers for Zod integration, `mode: 'onBlur'` for real-time validation
- **Toast Pattern**: Use `sonner` for success/error toasts
- **Admin Check Pattern**: Query user role from users table, check `role === 'admin'` before allowing admin actions
- **Loading State Pattern**: Use `useTransition` for server action loading states

[Source: docs/sprint-artifacts/3-1-agency-settings-page.md#Dev-Agent-Record]

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Story-3.2-Invite-Users-to-Agency]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Data-Models-and-Contracts]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing]
- [Source: docs/epics.md#Story-3.2-Invite-Users-to-Agency]
- [Source: docs/architecture.md#Data-Architecture]

## Technical Notes

**Server Action Pattern (inviteUser):**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { inviteUserSchema } from '@/lib/validations/auth';

export async function inviteUser(data: { email: string; role: 'admin' | 'member' }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input
  const result = inviteUserSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message };
  }

  // 2. Get authenticated user and verify admin role
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Get user's role and agency_id
  const { data: userData } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { success: false, error: 'Only admins can invite users' };
  }

  const agencyId = userData.agency_id;

  // 4. Check seat limit
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  const { count: pendingCount } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('status', 'pending');

  const { data: agency } = await supabase
    .from('agencies')
    .select('seat_limit')
    .eq('id', agencyId)
    .single();

  if ((userCount ?? 0) + (pendingCount ?? 0) >= (agency?.seat_limit ?? 0)) {
    return { success: false, error: 'Seat limit reached. Upgrade to add more users.' };
  }

  // 5. Check for duplicate email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .single();

  if (existingUser) {
    return { success: false, error: 'This email already has an account in your agency' };
  }

  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    return { success: false, error: 'An invitation is already pending for this email' };
  }

  // 6. Create invitation record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      agency_id: agencyId,
      email: data.email,
      role: data.role,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: 'Failed to create invitation' };
  }

  // 7. Send invitation email via Supabase Auth admin API
  const adminClient = createServiceRoleClient();
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      agency_id: agencyId,
      role: data.role,
      invitation_id: invitation.id
    }
  });

  if (inviteError) {
    // Rollback invitation record
    await supabase.from('invitations').delete().eq('id', invitation.id);
    return { success: false, error: 'Failed to send invitation email' };
  }

  return { success: true };
}
```

**Service Role Client (for admin API):**
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

**Invitation Validation Schema:**
```typescript
// Add to src/lib/validations/auth.ts
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});
```
