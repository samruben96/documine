# Acceptance Criteria (Authoritative)

## Story 8.1: Database Security Hardening

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

## Story 8.2: RLS Policy Performance Optimization

- [ ] **AC-8.2.1:** All RLS policies on `users` table use `(SELECT auth.uid())` pattern
- [ ] **AC-8.2.2:** All RLS policies on `invitations` table use optimized pattern
- [ ] **AC-8.2.3:** All RLS policies on `processing_jobs` table use optimized pattern
- [ ] **AC-8.2.4:** All RLS policies on `quote_extractions` table use optimized pattern
- [ ] **AC-8.2.5:** All RLS policies on `comparisons` table use optimized pattern
- [ ] **AC-8.2.6:** All RLS policies on `chat_messages` and `conversations` tables use optimized pattern
- [ ] **AC-8.2.7:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "auth.uid() in RLS" warnings

## Story 8.3: Database Index Optimization

- [ ] **AC-8.3.1:** Index exists on `chat_messages.agency_id`
- [ ] **AC-8.3.2:** Index exists on `conversations.agency_id` and `conversations.user_id`
- [ ] **AC-8.3.3:** Index exists on `document_chunks.agency_id`
- [ ] **AC-8.3.4:** Index exists on `documents.uploaded_by`
- [ ] **AC-8.3.5:** Index exists on `invitations.invited_by`
- [ ] **AC-8.3.6:** Index exists on `processing_jobs.document_id`
- [ ] **AC-8.3.7:** Index exists on `users.agency_id`
- [ ] **AC-8.3.8:** Decision documented for each unused index (keep/remove with rationale)
- [ ] **AC-8.3.9:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "unindexed foreign key" warnings

## Story 8.4: Consolidate Processing Jobs RLS Policies

- [ ] **AC-8.4.1:** Single SELECT policy on `processing_jobs` instead of multiple
- [ ] **AC-8.4.2:** Edge functions (service role) can still read/write processing_jobs
- [ ] **AC-8.4.3:** Users can view processing jobs for their agency's documents
- [ ] **AC-8.4.4:** `mcp__supabase__get_advisors(type: 'performance')` returns zero "multiple permissive policies" warnings for processing_jobs

## Story 8.5: API Rate Limiting

- [ ] **AC-8.5.1:** POST /api/compare returns 429 after 10 requests in 1 hour from same agency
- [ ] **AC-8.5.2:** POST /api/chat returns 429 after 100 messages in 1 hour from same user
- [ ] **AC-8.5.3:** 429 responses include `Retry-After` header with seconds until reset
- [ ] **AC-8.5.4:** 429 responses include `X-RateLimit-*` headers
- [ ] **AC-8.5.5:** Rate limit state persists across API route instances (Supabase or Redis)
- [ ] **AC-8.5.6:** Unit tests verify rate limit enforcement
- [ ] **AC-8.5.7:** User sees friendly error message when rate limited

## Story 8.6: Fix Pre-existing Test Failure

- [ ] **AC-8.6.1:** `useAgencyId > returns agencyId after loading` test passes
- [ ] **AC-8.6.2:** No new test failures introduced
- [ ] **AC-8.6.3:** `npm run test` shows all tests passing (1097+)

## Story 8.7: Code Quality Cleanup

- [ ] **AC-8.7.1:** No "GPT-4o" references in codebase (replaced with "gpt-5.1")
- [ ] **AC-8.7.2:** All TODO/FIXME comments reviewed: resolved or documented with issue
- [ ] **AC-8.7.3:** CLAUDE.md updated with Epic 8 patterns and learnings
- [ ] **AC-8.7.4:** `src/types/database.types.ts` regenerated from Supabase schema

---
