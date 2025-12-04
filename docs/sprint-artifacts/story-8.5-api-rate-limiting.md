# Story 8.5: API Rate Limiting

**Epic:** 8 - Tech Debt & Production Hardening
**Priority:** P0
**Effort:** M (4-6 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **platform administrator**,
I want **API endpoints to enforce rate limits per agency and user**,
So that **AI costs are controlled and the platform is protected from abuse**.

---

## Context

PRD section 3.1.4 requires usage tracking. Rate limiting is the enforcement mechanism to:
- Control GPT-5.1 costs for document comparison
- Prevent abuse of chat functionality
- Ensure fair resource distribution across agencies

### Rate Limits

| Endpoint | Limit | Scope | Rationale |
|----------|-------|-------|-----------|
| POST /api/compare | 10/hour | per agency | High AI cost (~$0.50/comparison) |
| POST /api/chat | 100/hour | per user | Moderate AI cost, per-user fairness |

---

## Acceptance Criteria

### AC-8.5.1: Compare Rate Limit
**Given** an agency has made 10 comparison requests in the last hour
**When** the agency makes an 11th request
**Then** the API returns HTTP 429 with error message

### AC-8.5.2: Chat Rate Limit
**Given** a user has sent 100 chat messages in the last hour
**When** the user sends the 101st message
**Then** the API returns HTTP 429 with error message

### AC-8.5.3: Retry-After Header
**Given** a rate limited request
**When** the 429 response is returned
**Then** the response includes `Retry-After` header with seconds until reset

### AC-8.5.4: Rate Limit Headers
**Given** any request to rate-limited endpoints
**When** the response is returned
**Then** it includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

### AC-8.5.5: Persistent State
**Given** rate limits are tracked in Supabase
**When** API instances restart or scale
**Then** rate limit state persists correctly

### AC-8.5.6: User-Friendly Error
**Given** a rate limited request
**When** the user sees the error
**Then** a clear message explains the limit and when they can retry

---

## Tasks / Subtasks

- [x] Task 1: Create Rate Limit Table (AC: 8.5.5) ✅
  - [x] Created rate_limits table via migration
  - [x] Added RLS policies for user/agency access
  - [x] Created increment_rate_limit RPC function (SECURITY DEFINER)

- [x] Task 2: Create Rate Limit Utility (AC: 8.5.1-8.5.4) ✅
  - [x] Created src/lib/rate-limit.ts
  - [x] Implemented checkRateLimit, rateLimitHeaders, rateLimitExceededResponse
  - [x] Configured RATE_LIMITS for compare (10/hr) and chat (100/hr)

- [x] Task 3: Integrate with Compare API (AC: 8.5.1, 8.5.3, 8.5.4) ✅
  - [x] Added rate limit check to POST /api/compare (per agency)
  - [x] Returns 429 with Retry-After and X-RateLimit-* headers

- [x] Task 4: Integrate with Chat API (AC: 8.5.2, 8.5.3, 8.5.4) ✅
  - [x] Added rate limit check to POST /api/chat (per user)
  - [x] Returns 429 with Retry-After and X-RateLimit-* headers

- [x] Task 5: Add User-Friendly Error (AC: 8.5.6) ✅
  - [x] rateLimitExceededResponse includes human-readable message
  - [x] Message includes limit and duration until reset

- [x] Task 6: Testing (AC: 8.5.1-8.5.6) ✅
  - [x] Build passed
  - [x] 1097 tests passed
  - [x] TypeScript types regenerated with rate_limits table and increment_rate_limit function

---

## Dev Notes

### Rate Limit Table

```sql
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
```

### Rate Limit Utility Pattern

```typescript
const rateLimit = await checkRateLimit({
  entityType: 'agency',
  entityId: agencyId,
  endpoint: '/api/compare',
  limit: 10,
  windowMs: 3600000, // 1 hour
});

if (!rateLimit.allowed) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
    headers: {
      'Retry-After': String(secondsUntilReset),
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetAt.toISOString(),
    },
  });
}
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-8.md#Story-8.5]
- [MDN: 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

---

## Dev Agent Record

### Context Reference

N/A - Story implemented directly from tech spec

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) as Amelia (Dev Agent)

### Completion Notes List

1. **Database Migration (2025-12-03)**
   - Created `rate_limits` table with entity_type, entity_id, endpoint, window_start, request_count
   - Added RLS policy for user/agency access
   - Created `increment_rate_limit` RPC function with SECURITY DEFINER

2. **Rate Limit Utility (2025-12-03)**
   - Created `src/lib/rate-limit.ts` with checkRateLimit, rateLimitHeaders, rateLimitExceededResponse
   - Configured limits: compare 10/hr per agency, chat 100/hr per user
   - Human-friendly duration formatting

3. **API Integration (2025-12-03)**
   - `/api/compare` POST: Rate limit by agency_id
   - `/api/chat` POST: Rate limit by user.id
   - Both return 429 with proper headers when exceeded

4. **Types Regenerated (2025-12-03)**
   - `src/types/database.types.ts` updated with rate_limits table and increment_rate_limit function

### File List

- `supabase/migrations/20251204_create_rate_limits_table.sql` (applied via MCP)
- `src/lib/rate-limit.ts` (new)
- `src/app/api/compare/route.ts` (modified)
- `src/app/api/chat/route.ts` (modified)
- `src/types/database.types.ts` (regenerated)

---

## Senior Developer Review (AI)

### Reviewer
Sam (Senior Developer)

### Date
2025-12-03

### Outcome
✅ **APPROVED** - All acceptance criteria verified.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-8.5.1 | Compare 429 after 10/hr | ✅ | Rate limit check in /api/compare POST |
| AC-8.5.2 | Chat 429 after 100/hr | ✅ | Rate limit check in /api/chat POST |
| AC-8.5.3 | Retry-After header | ✅ | rateLimitExceededResponse includes header |
| AC-8.5.4 | X-RateLimit-* headers | ✅ | rateLimitHeaders function |
| AC-8.5.5 | Persistent state | ✅ | Supabase rate_limits table |
| AC-8.5.6 | User-friendly error | ✅ | formatDuration for human-readable message |

**Summary:** 6 of 6 acceptance criteria verified ✅

### Security Notes

- RPC function uses SECURITY DEFINER with explicit search_path
- RLS policy ensures users only see their own rate limits
- Rate limit check runs early in request lifecycle

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (BMad Master) | Story drafted from tech spec |
| 2025-12-03 | Dev (Amelia) | All tasks complete, rate limiting implemented |
| 2025-12-03 | Reviewer (Senior Dev) | Senior Developer Review: APPROVED |
