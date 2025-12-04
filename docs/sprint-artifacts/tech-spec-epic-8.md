# Epic Technical Specification: Tech Debt & Production Hardening

Date: 2025-12-03
Author: Winston (Architect) + Bob (Scrum Master)
Epic ID: Epic-8
Status: Draft

---

## Overview

Epic 8 is a critical stabilization milestone that addresses all accumulated technical debt discovered via Supabase security and performance advisors before the Phase 2 feature expansion. This epic ensures docuMINE has a secure, performant, and production-ready foundation before Epic 9+ transforms it into "the central hub for insurance agents."

The PRD defines strict non-functional requirements: sub-2s response times for chat, 99.9% uptime target, and comprehensive data isolation between agencies. Current Supabase advisors have identified 8 security warnings (mutable search_path on functions, leaked password protection disabled) and 37 performance warnings (28 RLS policies with per-row auth.uid() re-evaluation, 8 unindexed foreign keys, multiple permissive policies). Epic 8 resolves all of these while adding rate limiting to protect AI costs and fixing the one remaining test failure.

## Objectives and Scope

### In Scope

- **Security Hardening (Story 8.1):** Set explicit `search_path = public, extensions` on all 7 database functions; enable leaked password protection in Supabase Auth
- **RLS Performance (Story 8.2):** Optimize 28 RLS policies to use `(SELECT auth.uid())` pattern for single evaluation instead of per-row re-evaluation
- **Index Optimization (Story 8.3):** Add missing foreign key indexes on 8 columns across 7 tables
- **RLS Consolidation (Story 8.4):** Merge multiple permissive SELECT policies on `processing_jobs` into single optimized policy
- **Rate Limiting (Story 8.5):** Implement per-agency and per-user rate limits on `/api/compare` and `/api/chat` endpoints
- **Test Fix (Story 8.6):** Fix failing `useAgencyId` test from Epic 5
- **Code Quality (Story 8.7):** Update model name references, resolve TODO/FIXME comments, regenerate TypeScript types

### Out of Scope

- New features (deferred to Epic 9+)
- UI/UX changes beyond error displays for rate limiting
- Mobile optimization (Epic F4)
- Source text highlighting (Epic F5)
- Any Phase 2 PRD features

## System Architecture Alignment

This epic aligns with the architecture's security-first design principles:

1. **Multi-tenant Isolation:** RLS policy optimizations maintain strict agency_id isolation while improving query performance. Every policy continues to enforce `agency_id = (SELECT get_user_agency_id())` pattern.

2. **Defense in Depth:** Function search_path hardening prevents potential SQL injection vectors. Leaked password protection adds another authentication security layer.

3. **Performance @ Scale:** Current RLS policies re-evaluate `auth.uid()` for every row in result sets. With 10+ documents per agency and 100+ chunks per document, this creates O(n) function call overhead. The `(SELECT auth.uid())` pattern reduces this to O(1).

4. **Cost Control:** Rate limiting protects against runaway AI costs (GPT-5.1 for extraction, OpenAI embeddings for chat). PRD section 3.1.4 explicitly requires usage tracking - rate limiting is the enforcement mechanism.

---

## Detailed Design

### Services and Modules

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

### Data Models and Contracts

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

### APIs and Interfaces

**Rate Limited Endpoints:**

| Endpoint | Rate Limit | Scope | Response on Exceed |
|----------|------------|-------|-------------------|
| POST /api/compare | 10/hour | per agency | 429 + Retry-After |
| POST /api/chat | 100/hour | per user | 429 + Retry-After |

**Rate Limit Headers (on all responses):**
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Requests left in window
- `X-RateLimit-Reset`: ISO timestamp when window resets

### Workflows and Sequencing

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

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| RLS policy evaluation | O(1) auth.uid() calls | Supabase performance advisors show 0 warnings |
| Foreign key lookups | Index-backed scans | EXPLAIN ANALYZE on common queries |
| Rate limit check | < 10ms | Supabase RPC latency |
| Overall chat latency | < 2s (PRD NFR-1) | End-to-end timing |

**RLS Optimization Impact:**
- Before: 28 policies × avg 100 rows = 2,800 auth.uid() calls per request
- After: 28 policies × 1 call = 28 auth.uid() calls per request
- Expected: ~100x reduction in auth function overhead

### Security

| Requirement | Implementation |
|-------------|----------------|
| Function injection prevention | Explicit search_path on all functions |
| Compromised password detection | Supabase Auth leaked password protection |
| Agency data isolation | RLS policies with (SELECT auth.uid()) |
| Rate limit enforcement | Per-agency and per-user quotas |

**Security Advisory Resolution:**
- Current: 8 WARN-level security advisories
- Target: 0 WARN-level security advisories

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Migration safety | CONCURRENTLY index creation, explicit transactions |
| Rollback capability | Each migration reversible |
| RLS policy testing | E2E tests verify CRUD after migration |
| Zero-downtime deployment | No application changes required for DB migrations |

### Observability

| Signal | Implementation |
|--------|----------------|
| Rate limit metrics | Log rate limit checks with entity_id, endpoint, remaining |
| Migration tracking | Supabase migration history |
| Security audit | Supabase security advisors (post-epic verification) |
| Performance audit | Supabase performance advisors (post-epic verification) |

---

## Dependencies and Integrations

| Dependency | Purpose | Risk |
|------------|---------|------|
| Supabase MCP | Apply migrations, run advisors | Low - existing integration |
| Supabase Dashboard | Enable leaked password protection | Low - one-time manual action |
| Vitest | Test verification | Low - existing infrastructure |

**Optional (evaluate in Story 8.5):**
| Dependency | Purpose | Decision Criteria |
|------------|---------|-------------------|
| Upstash Redis | Faster rate limiting | Only if Supabase table latency > 50ms |

---

## Acceptance Criteria (Authoritative)

### Story 8.1: Database Security Hardening

- [ ] **AC-8.1.1:** All 7 functions have `SET search_path = public, extensions`:
  - `mark_stale_jobs_failed`
  - `has_active_processing_job`
  - `update_updated_at_column`
  - `get_next_pending_job`
  - `get_queue_position`
  - `get_user_agency_id`
  - `update_quote_extractions_updated_at`
- [ ] **AC-8.1.2:** Leaked password protection enabled in Supabase Auth settings
- [ ] **AC-8.1.3:** `mcp__supabase__get_advisors(type: 'security')` returns zero WARN-level issues

### Story 8.2: RLS Policy Performance Optimization

- [ ] **AC-8.2.1:** All RLS policies on `users` table use `(SELECT auth.uid())` pattern
- [ ] **AC-8.2.2:** All RLS policies on `invitations` table use optimized pattern
- [ ] **AC-8.2.3:** All RLS policies on `processing_jobs` table use optimized pattern
- [ ] **AC-8.2.4:** All RLS policies on `quote_extractions` table use optimized pattern
- [ ] **AC-8.2.5:** All RLS policies on `comparisons` table use optimized pattern
- [ ] **AC-8.2.6:** All RLS policies on `chat_messages` and `conversations` tables use optimized pattern
- [ ] **AC-8.2.7:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "auth.uid() in RLS" warnings

### Story 8.3: Database Index Optimization

- [ ] **AC-8.3.1:** Index exists on `chat_messages.agency_id`
- [ ] **AC-8.3.2:** Index exists on `conversations.agency_id` and `conversations.user_id`
- [ ] **AC-8.3.3:** Index exists on `document_chunks.agency_id`
- [ ] **AC-8.3.4:** Index exists on `documents.uploaded_by`
- [ ] **AC-8.3.5:** Index exists on `invitations.invited_by`
- [ ] **AC-8.3.6:** Index exists on `processing_jobs.document_id`
- [ ] **AC-8.3.7:** Index exists on `users.agency_id`
- [ ] **AC-8.3.8:** Decision documented for each unused index (keep/remove with rationale)
- [ ] **AC-8.3.9:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "unindexed foreign key" warnings

### Story 8.4: Consolidate Processing Jobs RLS Policies

- [ ] **AC-8.4.1:** Single SELECT policy on `processing_jobs` instead of multiple
- [ ] **AC-8.4.2:** Edge functions (service role) can still read/write processing_jobs
- [ ] **AC-8.4.3:** Users can view processing jobs for their agency's documents
- [ ] **AC-8.4.4:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "multiple permissive policies" warnings for processing_jobs

### Story 8.5: API Rate Limiting

- [ ] **AC-8.5.1:** POST /api/compare returns 429 after 10 requests in 1 hour from same agency
- [ ] **AC-8.5.2:** POST /api/chat returns 429 after 100 messages in 1 hour from same user
- [ ] **AC-8.5.3:** 429 responses include `Retry-After` header with seconds until reset
- [ ] **AC-8.5.4:** 429 responses include `X-RateLimit-*` headers
- [ ] **AC-8.5.5:** Rate limit state persists across API route instances (Supabase or Redis)
- [ ] **AC-8.5.6:** Unit tests verify rate limit enforcement
- [ ] **AC-8.5.7:** User sees friendly error message when rate limited

### Story 8.6: Fix Pre-existing Test Failure

- [ ] **AC-8.6.1:** `useAgencyId > returns agencyId after loading` test passes
- [ ] **AC-8.6.2:** No new test failures introduced
- [ ] **AC-8.6.3:** `npm run test` shows all tests passing (1097+)

### Story 8.7: Code Quality Cleanup

- [ ] **AC-8.7.1:** No "GPT-4o" references in codebase (replaced with "gpt-5.1")
- [ ] **AC-8.7.2:** All TODO/FIXME comments reviewed: resolved or documented with issue
- [ ] **AC-8.7.3:** CLAUDE.md updated with Epic 8 patterns and learnings
- [ ] **AC-8.7.4:** `src/types/database.types.ts` regenerated from Supabase schema

---

## Traceability Mapping

| Story | PRD Requirement | Architecture Section |
|-------|-----------------|---------------------|
| 8.1 | NFR-3 (Security) | 3.3 Security Architecture |
| 8.2 | NFR-1 (Performance) | 3.2.1 RLS Patterns |
| 8.3 | NFR-1 (Performance) | 3.2 Database Design |
| 8.4 | NFR-1 (Performance) | 3.2.1 RLS Patterns |
| 8.5 | FR-3.1.4 (Usage Tracking) | 3.4 API Design |
| 8.6 | NFR-5 (Quality) | 4.0 Testing Strategy |
| 8.7 | NFR-5 (Quality) | 1.0 Overview |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS policy changes break existing functionality | Medium | High | Run full E2E test suite after each migration; manual smoke test core flows |
| Rate limiting too aggressive | Low | Medium | Start with generous limits (10/hr compare, 100/hr chat); monitor and adjust |
| Index creation locks tables | Low | Low | Use CONCURRENTLY for all index creation |
| Unused index removal affects future queries | Medium | Low | Document reasoning; keep indexes if uncertain |

### Assumptions

1. Supabase MCP has permission to apply migrations
2. Current test suite adequately covers RLS policy behavior
3. Rate limits can be adjusted post-launch without migration
4. Leaked password protection has no negative UX impact

### Open Questions

| Question | Owner | Due | Resolution |
|----------|-------|-----|------------|
| Upstash Redis vs Supabase table for rate limiting? | Architect | Story 8.5 | Evaluate latency during implementation |
| Keep or remove unused indexes? | Architect | Story 8.3 | Analyze query patterns, document decision |
| Rate limit UI - toast vs modal? | UX | Story 8.5 | Toast preferred for non-blocking UX |

---

## Test Strategy Summary

### Unit Tests

| Area | Coverage Target | Framework |
|------|-----------------|-----------|
| Rate limit utility | 100% paths | Vitest |
| Rate limit headers | All header combinations | Vitest |

### Integration Tests

| Area | Coverage | Framework |
|------|----------|-----------|
| RLS policies post-migration | All CRUD operations per table | Supabase client tests |
| Rate limit DB operations | Increment, reset, concurrent | Supabase RPC tests |

### E2E Tests

| Flow | Coverage | Framework |
|------|----------|-----------|
| Document upload → chat | Verify RLS still works | Playwright |
| Comparison flow | Verify rate limit 429 handling | Playwright |
| Rate limit error display | User sees friendly message | Playwright |

### Verification Steps (Post-Epic)

1. **Security Audit:**
   ```bash
   mcp__supabase__get_advisors(project_id, type: 'security')
   # Expected: 0 WARN-level issues
   ```

2. **Performance Audit:**
   ```bash
   mcp__supabase__get_advisors(project_id, type: 'performance')
   # Expected: 0 WARN-level issues
   ```

3. **Test Suite:**
   ```bash
   npm run test
   # Expected: All 1097+ tests passing
   ```

4. **Build Verification:**
   ```bash
   npm run build
   # Expected: No TypeScript errors
   ```

5. **Manual Smoke Test:**
   - Upload document → Process → Chat
   - Create comparison → Export
   - Verify rate limit behavior (optional: temporarily set limit to 1)

---

## Epic Summary

| Story | Priority | Effort | Description |
|-------|----------|--------|-------------|
| 8.1 | P0 | S | Database Security Hardening |
| 8.2 | P0 | M | RLS Policy Performance Optimization |
| 8.3 | P1 | S | Database Index Optimization |
| 8.4 | P1 | S | Consolidate Processing Jobs RLS |
| 8.5 | P0 | M | API Rate Limiting |
| 8.6 | P2 | S | Fix Pre-existing Test Failure |
| 8.7 | P3 | S | Code Quality Cleanup |

**Total Estimated Effort:** 2 days
**Dependencies:** Supabase MCP
**Success Criteria:** Zero WARN advisors, all tests passing, rate limiting active
