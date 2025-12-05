# Detailed Design

## Services and Modules

**Story 8.1 - Security Hardening:**
```sql
-- Migration: 20241203_security_hardening.sql
-- Pattern applied to all 7 functions:
ALTER FUNCTION mark_stale_jobs_failed()
  SET search_path = public, extensions;

ALTER FUNCTION has_active_processing_job(uuid)
  SET search_path = public, extensions;

ALTER FUNCTION update_updated_at_column()
  SET search_path = public, extensions;

ALTER FUNCTION get_next_pending_job()
  SET search_path = public, extensions;

ALTER FUNCTION get_queue_position(uuid)
  SET search_path = public, extensions;

ALTER FUNCTION get_user_agency_id()
  SET search_path = public, extensions;

ALTER FUNCTION update_quote_extractions_updated_at()
  SET search_path = public, extensions;
```

**Story 8.2 - RLS Policy Optimization:**
```sql
-- Migration: 20241203_rls_optimization.sql
-- Pattern for each policy (example for users table):
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = (SELECT auth.uid()));

-- Tables requiring optimization:
-- users: 4 policies
-- invitations: 6 policies
-- processing_jobs: 5 policies
-- quote_extractions: 4 policies
-- comparisons: 4 policies
-- chat_messages: 3 policies
-- conversations: 2 policies
```

**Story 8.3 - Index Optimization:**
```sql
-- Migration: 20241203_add_fk_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_agency_id
  ON chat_messages(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_agency_id
  ON conversations(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_chunks_agency_id
  ON document_chunks(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_uploaded_by
  ON documents(uploaded_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_invited_by
  ON invitations(invited_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_jobs_document_id
  ON processing_jobs(document_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_agency_id
  ON users(agency_id);
```

**Story 8.4 - RLS Consolidation:**
```sql
-- Migration: 20241203_consolidate_processing_jobs_rls.sql
-- Current: Multiple SELECT policies evaluated with OR
-- Fixed: Single policy with all conditions

DROP POLICY IF EXISTS "Users can view processing jobs for their documents" ON processing_jobs;
DROP POLICY IF EXISTS "Service role full access" ON processing_jobs;

CREATE POLICY "processing_jobs_select_policy" ON processing_jobs
  FOR SELECT USING (
    -- Service role bypass (for edge functions)
    auth.role() = 'service_role'
    OR
    -- Users can view their agency's document jobs
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = processing_jobs.document_id
      AND d.agency_id = (SELECT get_user_agency_id())
    )
  );
```

**Story 8.5 - Rate Limiting:**

*Option A: Supabase Table (Recommended - no new infrastructure)*
```sql
-- Migration: 20241203_rate_limits.sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('agency', 'user')),
  entity_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, endpoint, window_start)
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limits_lookup
  ON rate_limits(entity_type, entity_id, endpoint, window_start);

-- RLS: Users can only see their own rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limits_own" ON rate_limits
  FOR ALL USING (
    (entity_type = 'user' AND entity_id = (SELECT auth.uid()))
    OR
    (entity_type = 'agency' AND entity_id = (SELECT get_user_agency_id()))
  );
```

*TypeScript Rate Limit Utility:*
```typescript
// src/lib/rate-limit.ts
import { createClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  entityType: 'agency' | 'user';
  entityId: string;
  endpoint: string;
  limit: number;
  windowMs: number; // 1 hour = 3600000
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const supabase = await createClient();
  const windowStart = new Date(
    Math.floor(Date.now() / config.windowMs) * config.windowMs
  );

  // Upsert and increment counter
  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_entity_type: config.entityType,
    p_entity_id: config.entityId,
    p_endpoint: config.endpoint,
    p_window_start: windowStart.toISOString(),
    p_limit: config.limit,
  });

  if (error) throw error;

  return {
    allowed: data.request_count <= config.limit,
    remaining: Math.max(0, config.limit - data.request_count),
    resetAt: new Date(windowStart.getTime() + config.windowMs),
  };
}
```

*API Route Integration:*
```typescript
// src/app/api/compare/route.ts (example)
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const { agencyId } = await getSession();

  const rateLimit = await checkRateLimit({
    entityType: 'agency',
    entityId: agencyId,
    endpoint: '/api/compare',
    limit: 10,
    windowMs: 3600000, // 1 hour
  });

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
      },
    });
  }

  // ... continue with comparison
}
```

## Data Models and Contracts

**New Table: `rate_limits`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| entity_type | TEXT | NOT NULL, CHECK ('agency', 'user') | Rate limit scope |
| entity_id | UUID | NOT NULL | Agency or User ID |
| endpoint | TEXT | NOT NULL | API endpoint path |
| window_start | TIMESTAMPTZ | NOT NULL | Window bucket start |
| request_count | INTEGER | DEFAULT 1 | Requests in window |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |

**Unique Constraint:** (entity_type, entity_id, endpoint, window_start)

## APIs and Interfaces

**Rate Limited Endpoints:**

| Endpoint | Rate Limit | Scope | Response on Exceed |
|----------|------------|-------|-------------------|
| POST /api/compare | 10/hour | per agency | 429 + Retry-After |
| POST /api/chat | 100/hour | per user | 429 + Retry-After |

**Rate Limit Headers (on all responses):**
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Requests left in window
- `X-RateLimit-Reset`: ISO timestamp when window resets

## Workflows and Sequencing

**Story Execution Order (by dependency):**

```
Story 8.1 (Security) ─────────────────────┐
                                          │
Story 8.2 (RLS Performance) ──────────────┼──► Can run in parallel
                                          │
Story 8.3 (Indexes) ──────────────────────┘

Story 8.4 (Consolidate RLS) ──► Depends on 8.2 pattern

Story 8.5 (Rate Limiting) ──────────────────► Independent

Story 8.6 (Test Fix) ───────────────────────► Independent

Story 8.7 (Code Quality) ──► Run last (regenerate types after migrations)
```

**Recommended execution:**
1. Stories 8.1, 8.2, 8.3 in parallel (database migrations)
2. Story 8.4 after 8.2 (uses same patterns)
3. Story 8.5 (rate limiting)
4. Story 8.6 (test fix)
5. Story 8.7 last (regenerate types after all migrations)

---
