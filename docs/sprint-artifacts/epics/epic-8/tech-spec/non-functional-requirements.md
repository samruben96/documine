# Non-Functional Requirements

## Performance

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

## Security

| Requirement | Implementation |
|-------------|----------------|
| Function injection prevention | Explicit search_path on all functions |
| Compromised password detection | Supabase Auth leaked password protection |
| Agency data isolation | RLS policies with (SELECT auth.uid()) |
| Rate limit enforcement | Per-agency and per-user quotas |

**Security Advisory Resolution:**
- Current: 8 WARN-level security advisories
- Target: 0 WARN-level security advisories

## Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Migration safety | CONCURRENTLY index creation, explicit transactions |
| Rollback capability | Each migration reversible |
| RLS policy testing | E2E tests verify CRUD after migration |
| Zero-downtime deployment | No application changes required for DB migrations |

## Observability

| Signal | Implementation |
|--------|----------------|
| Rate limit metrics | Log rate limit checks with entity_id, endpoint, remaining |
| Migration tracking | Supabase migration history |
| Security audit | Supabase security advisors (post-epic verification) |
| Performance audit | Supabase performance advisors (post-epic verification) |

---
