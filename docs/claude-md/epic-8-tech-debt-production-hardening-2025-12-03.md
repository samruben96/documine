# Epic 8: Tech Debt & Production Hardening (2025-12-03)

## Database Security Hardening (Story 8.1)

**Issue:** Supabase security advisors flagged 7 functions with implicit `search_path` and leaked password protection disabled.

**Resolution:**
1. Applied migration to set explicit `search_path = public, extensions` on all 7 functions
2. Enabled leaked password protection via Supabase Dashboard (Auth > Attack Protection)

**Pattern for new functions:**
```sql
CREATE OR REPLACE FUNCTION my_function(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- Always include this
AS $$
BEGIN
  -- function body
END;
$$;
```

## RLS Policy Performance Optimization (Story 8.2)

**Issue:** 28 RLS policies re-evaluated `auth.uid()` for every row in result sets. With 100+ rows, this caused O(n) function call overhead.

**Resolution:** Wrapped `auth.uid()` calls in SELECT subqueries to evaluate once per query:

```sql
-- ❌ Bad - evaluates auth.uid() for every row
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO authenticated
USING (agency_id = (SELECT get_user_agency_id()));

-- ✅ Good - evaluates once, O(1)
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO authenticated
USING (agency_id = (SELECT (SELECT get_user_agency_id())));
```

**Verification:** Run `mcp__supabase__get_advisors` with `type: "performance"` - should show 0 `auth_rls_initplan` warnings.

## Rate Limiting Pattern (Story 8.5)

**Implementation:** Rate limits stored in Supabase `rate_limits` table, checked via RPC function.

```typescript
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit';

// In API route after authentication
const rateLimit = await checkRateLimit({
  entityType: RATE_LIMITS.compare.entityType,  // 'agency' or 'user'
  entityId: agencyId,
  endpoint: '/api/compare',
  limit: RATE_LIMITS.compare.limit,      // 10
  windowMs: RATE_LIMITS.compare.windowMs, // 3600000 (1 hour)
});

if (!rateLimit.allowed) {
  return rateLimitExceededResponse(rateLimit, 'Rate limit exceeded message');
}
```

**Configured limits:**
- `/api/compare`: 10 requests/hour per agency (high AI cost)
- `/api/chat`: 100 messages/hour per user (moderate AI cost)

## Supabase Advisor Commands

Use these to check database health:

```typescript
// Security advisors - check for vulnerabilities
mcp__supabase__get_advisors({ project_id: "nxuzurxiaismssiiydst", type: "security" })

// Performance advisors - check for optimization opportunities
mcp__supabase__get_advisors({ project_id: "nxuzurxiaismssiiydst", type: "performance" })
```

**Target state:** 0 WARN-level issues in both security and performance advisors.
