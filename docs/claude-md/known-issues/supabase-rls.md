# Supabase & RLS Issues

## Conversation Loading 406 Error Fix (Story 6.1, 2025-12-02)

**Issue:** Users could not load their conversation history. The Supabase client returned HTTP 406 "Not Acceptable" when querying the conversations table.

**Root Cause:** The `useConversation` hook used `.single()` modifier when querying for an existing conversation. Per Supabase/PostgREST behavior, `.single()` returns HTTP 406 (PGRST116) when 0 rows match the query.

**Reference:** https://github.com/orgs/supabase/discussions/2284

**Resolution:** Changed from `.single()` to `.maybeSingle()` in the conversation query:
- `.single()` - Throws 406 error if 0 or >1 rows match
- `.maybeSingle()` - Returns `null` data (no error) if 0 rows match, error only if >1 rows

**Files Changed:**
- `src/hooks/use-conversation.ts` - Changed `.single()` to `.maybeSingle()` on line 90
- `__tests__/hooks/use-conversation.test.ts` - Updated mocks
- `__tests__/e2e/conversation-persistence.spec.ts` - **NEW** - E2E test for conversation persistence

**Key Learning:** When querying Supabase for a record that may or may not exist, always use `.maybeSingle()` instead of `.single()`.

```typescript
// Bad - throws 406 when no conversation exists
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('document_id', documentId)
  .single();

// Good - returns null data gracefully
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('document_id', documentId)
  .maybeSingle();
```

---

## AI Buddy Permissions RLS Policy Infinite Recursion (Story 20.3, 2025-12-09)

**Issue:** Usage Analytics API returned 403 Forbidden even for users with `view_usage_analytics` permission. Postgres logs showed: "infinite recursion detected in policy for relation `ai_buddy_permissions`".

**Root Cause:** The RLS policies on `ai_buddy_permissions` table had circular references:
- "Admins can view agency permissions" policy checked if user has `manage_users` permission
- This check queried the same `ai_buddy_permissions` table it was protecting
- Result: infinite recursion when any permission check occurred

**Problematic Policies Removed:**
```sql
DROP POLICY "Admins can view agency permissions" ON ai_buddy_permissions;
DROP POLICY "Admins can manage agency permissions" ON ai_buddy_permissions;
DROP POLICY "Admins can delete agency permissions" ON ai_buddy_permissions;
```

**Resolution:** Removed the recursive policies, keeping only the simple self-referential policy:
```sql
CREATE POLICY "Users can view own permissions" ON ai_buddy_permissions
  FOR SELECT USING (user_id = auth.uid());
```

**Key Learning:** When creating RLS policies, avoid policies that query the same table they protect. If admin permission checks are needed:
1. Use a separate function that bypasses RLS (`SECURITY DEFINER`)
2. Store admin status in a different table (e.g., `users.role`)
3. Use API-level permission checks instead of RLS

---

## Admin Permission Checks Failing Due to RLS (Story 21.3-21.5, 2025-12-09)

**Issue:** Admin tab sub-tabs (Users, Usage Analytics, Audit Log, AI Buddy) showed permission errors (403 Forbidden) even though the user had all required permissions in the database.

**Root Cause:** The RLS policy `Users can view own permissions` on `agency_permissions` table uses `auth.uid()` which doesn't resolve correctly in Next.js server contexts. The `auth.uid()` call returns `null` instead of the authenticated user's ID.

**Resolution:** Updated all admin permission checks to use `createServiceClient()` instead of the regular `createClient()`. This is safe because:
1. User authentication is verified first via `supabase.auth.getUser()`
2. We only query permissions for the authenticated user's own `user_id`
3. The service client bypasses RLS but the code still enforces proper authorization

**Files Changed:**
1. `src/app/(dashboard)/settings/page.tsx` - Permissions query uses `createServiceClient()`
2. `src/app/api/admin/users/route.ts` - All handlers use `createServiceClient()`
3. `src/app/api/admin/analytics/route.ts` - Permission check uses `createServiceClient()`
4. `src/lib/auth/admin.ts` - `requireAdminAuth()` uses service client
5. `src/app/api/ai-buddy/admin/guardrails/logs/route.ts` - Uses `createServiceClient()`

**Pattern for Admin API Routes:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Get authenticated user (regular client is fine for auth)
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return unauthorized();

  // 2. Check permissions with service client (bypasses RLS)
  const serviceClient = createServiceClient();
  const { data: permissions } = await serviceClient
    .from('agency_permissions')
    .select('permission')
    .eq('user_id', user.id);

  const hasPermission = permissions?.some(p => p.permission === 'required_permission');
  if (!hasPermission) return forbidden();

  // 3. Proceed with service client for cross-user queries
  // ... rest of handler
}
```

---

## Audit Logging RLS Policy Violation (Epic 23, Story 23.4, 2025-12-10)

**Issue:** Audit log writes failing with RLS policy violation error:
```json
{"level":"error","message":"Failed to write audit log","error":"new row violates row-level security policy for table \"agency_audit_logs\"","action":"reporting_generated"}
```

**Root Cause:** The `logAuditEvent()` function was using `createClient()` (regular user-authenticated Supabase client) instead of `createServiceClient()` (service role client).

The RLS policy on `agency_audit_logs` table:
- SELECT: Admins can view audit logs
- INSERT: **No policy exists** for regular users

**Resolution:** Changed `logAuditEvent()` to use `createServiceClient()`:

```typescript
// src/lib/admin/audit-logger.ts

// Bad - RLS blocks INSERT for non-admin users
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const supabase = await createClient();
  await supabase.from('agency_audit_logs').insert({...});
}

// Good - Service client bypasses RLS for audit writes
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const supabase = createServiceClient();  // Note: not async
  await supabase.from('agency_audit_logs').insert({...});
}
```

**Key Learning:** For append-only audit/logging tables:
- Any authenticated user can write (create audit entries)
- Only admins can read (view audit history)

Use service client for writes (bypasses RLS) and regular client for reads (respects RLS). This is the "Write with Service, Read with RLS" pattern.
