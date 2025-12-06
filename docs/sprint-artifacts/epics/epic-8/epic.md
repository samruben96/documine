# Epic 8: Tech Debt & Production Hardening

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-8/stories/`](../sprint-artifacts/epics/epic-8/stories/)

**Goal:** Address all accumulated technical debt and security/performance advisories before Phase 2 feature expansion.

**User Value:** Users experience a faster, more secure, and more reliable application with proper rate limiting to prevent abuse.

**Non-FRs Addressed:** NFR-1 (Performance), NFR-3 (Security), NFR-5 (Quality)

**Note:** This epic completed the scope originally planned for Future Epic F1 (Tech Debt & Optimizations).

---

## Story 8.1: Database Security Hardening

As a **system administrator**,
I want **all database functions secured with explicit search_path and leaked password protection enabled**,
So that **the system is protected against SQL injection and compromised credentials**.

**Acceptance Criteria:**

**Given** the Supabase security advisors show warnings
**When** the migration is applied
**Then** all 7 functions have `SET search_path = public, extensions`:
- `mark_stale_jobs_failed`
- `has_active_processing_job`
- `update_updated_at_column`
- `get_next_pending_job`
- `get_queue_position`
- `get_user_agency_id`
- `update_quote_extractions_updated_at`

**And** leaked password protection is enabled in Supabase Auth settings

**And** `mcp__supabase__get_advisors(type: 'security')` returns zero WARN-level issues

**Technical Notes:**
- Migration: `20241203_security_hardening.sql`
- Leaked password protection enabled via Supabase Dashboard (manual step)

---

## Story 8.2: RLS Policy Performance Optimization

As a **user**,
I want **faster database queries**,
So that **the application responds quickly even with many documents**.

**Acceptance Criteria:**

**Given** RLS policies re-evaluate `auth.uid()` for every row
**When** the optimization migration is applied
**Then** all 28 RLS policies use the `(SELECT auth.uid())` pattern for single evaluation

**Tables optimized:**
- `users`: 4 policies
- `invitations`: 6 policies
- `processing_jobs`: 5 policies
- `quote_extractions`: 4 policies
- `comparisons`: 4 policies
- `chat_messages`: 3 policies
- `conversations`: 2 policies

**And** `mcp__supabase__get_advisors(type: 'performance')` returns zero "auth_rls_initplan" warnings

**Technical Notes:**
- Pattern: `USING (agency_id = (SELECT (SELECT get_user_agency_id())))`
- Expected ~100x reduction in auth function overhead

---

## Story 8.3: Database Index Optimization

As a **user**,
I want **optimized database queries**,
So that **document lists and searches are fast**.

**Acceptance Criteria:**

**Given** Supabase performance advisors show unindexed foreign key warnings
**When** the index migration is applied
**Then** indexes exist on:
- `chat_messages.agency_id`
- `conversations.agency_id`
- `conversations.user_id`
- `document_chunks.agency_id`
- `documents.uploaded_by`
- `invitations.invited_by`
- `processing_jobs.document_id`
- `users.agency_id`

**And** unused indexes are documented with keep/remove rationale

**Technical Notes:**
- Use `CREATE INDEX CONCURRENTLY` for zero-downtime creation
- 7 unused indexes kept with documented rationale

---

## Story 8.4: Consolidate Processing Jobs RLS

As a **developer**,
I want **a single optimized RLS policy on processing_jobs**,
So that **query performance is improved**.

**Acceptance Criteria:**

**Given** multiple permissive SELECT policies exist on `processing_jobs`
**When** consolidation is complete
**Then** a single SELECT policy handles both service role and user access

**And** edge functions (service role) can still read/write processing_jobs

**And** users can view processing jobs for their agency's documents

**Technical Notes:**
- Merged 2 SELECT policies into 1

---

## Story 8.5: API Rate Limiting

As an **administrator**,
I want **rate limiting on expensive API endpoints**,
So that **AI costs are controlled and abuse is prevented**.

**Acceptance Criteria:**

**Given** the rate limit system is deployed
**When** requests exceed limits:
- POST /api/compare: 10 requests/hour per agency
- POST /api/chat: 100 messages/hour per user

**Then** the API returns:
- HTTP 429 status code
- `Retry-After` header with seconds until reset
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- User-friendly error message

**Technical Notes:**
- `rate_limits` table in Supabase
- `src/lib/rate-limit.ts` utility
- Toast notification for rate limit errors

---

## Story 8.6: Fix Pre-existing Test Failure

As a **developer**,
I want **all tests passing**,
So that **the CI pipeline is green**.

**Acceptance Criteria:**

**Given** the `useAgencyId` test has React `act()` warnings
**When** the fix is applied
**Then** `npm run test` shows all tests passing with no warnings

**Technical Notes:**
- Fixed React `act()` warnings in test setup
- Test was already passing, just had console warnings

---

## Story 8.7: Code Quality Cleanup

As a **developer**,
I want **clean, up-to-date code**,
So that **the codebase is maintainable**.

**Acceptance Criteria:**

**Given** code quality items need cleanup
**When** cleanup is complete
**Then:**
- No "GPT-4o" references in codebase (updated to "gpt-5.1")
- CLAUDE.md updated with Epic 8 patterns
- `src/types/database.types.ts` regenerated from Supabase schema
- ESLint errors fixed

**Technical Notes:**
- Updated model references throughout codebase
- Documented rate limiting pattern in CLAUDE.md

---

## Epic Completion Summary

| Story | Status | Key Deliverable |
|-------|--------|-----------------|
| 8.1 | Done | 7 functions secured, 0 security warnings |
| 8.2 | Done | 28 RLS policies optimized, 0 performance warnings |
| 8.3 | Done | 8 FK indexes added |
| 8.4 | Done | 2 SELECT policies consolidated to 1 |
| 8.5 | Done | Rate limiting on /api/compare and /api/chat |
| 8.6 | Done | All tests passing, act() warnings fixed |
| 8.7 | Done | Code quality cleanup complete |

**Epic Outcome:**
- 0 WARN-level security advisories
- 0 WARN-level performance advisories
- All tests passing
- Rate limiting active
- Future Epic F1 scope completed
