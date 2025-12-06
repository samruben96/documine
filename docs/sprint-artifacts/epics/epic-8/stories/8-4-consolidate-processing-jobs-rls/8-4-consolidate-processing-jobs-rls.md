# Story 8.4: Consolidate Processing Jobs RLS Policies

**Epic:** 8 - Tech Debt & Production Hardening
**Priority:** P1
**Effort:** S (2-3 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **platform user**,
I want **database queries to evaluate RLS policies efficiently**,
So that **document processing status checks remain fast regardless of job count**.

---

## Context

Supabase performance advisors have identified 5 `multiple_permissive_policies` WARN issues on the `processing_jobs` table. Multiple permissive policies for the same role/action are suboptimal because each policy must be evaluated for every query.

**Current State:**
- `processing_jobs` has 2 SELECT policies: "Jobs service role only - SELECT" and "Users can view processing jobs for their documents"
- Both are PERMISSIVE, meaning PostgreSQL OR's them together
- Each policy is evaluated separately for every query

**Target State:**
- Single consolidated SELECT policy with both conditions
- Reduces policy evaluation overhead

---

## Acceptance Criteria

### AC-8.4.1: Single SELECT Policy
**Given** processing_jobs has multiple permissive SELECT policies
**When** the migration is applied
**Then** a single SELECT policy replaces the multiple policies

### AC-8.4.2: Service Role Access
**Given** edge functions use service_role to access processing_jobs
**When** querying as service_role
**Then** full read/write access is maintained

### AC-8.4.3: User Access
**Given** authenticated users need to see their agency's document jobs
**When** querying as authenticated user
**Then** users can view processing jobs for documents in their agency

### AC-8.4.4: Performance Advisor Verification
**Given** the consolidated policy is applied
**When** running `mcp__supabase__get_advisors(type: 'performance')`
**Then** zero `multiple_permissive_policies` warnings for processing_jobs

---

## Tasks / Subtasks

- [x] Task 1: Analyze Current Policies (AC: 8.4.1-8.4.3) ✅
  - [x] Queried pg_policies - found 2 SELECT policies causing warnings
  - [x] "Jobs service role only - SELECT" and "Users can view processing jobs for their documents"

- [x] Task 2: Create Consolidation Migration (AC: 8.4.1-8.4.3) ✅
  - [x] Applied `consolidate_processing_jobs_select_rls` migration
  - [x] Dropped both SELECT policies, created single `processing_jobs_select_policy`

- [x] Task 3: Verify Functionality (AC: 8.4.2, 8.4.3) ✅
  - [x] Policy preserves service_role OR user agency access pattern

- [x] Task 4: Verify Performance Advisors (AC: 8.4.4) ✅
  - [x] `mcp__supabase__get_advisors(type: 'performance')`: **0 multiple_permissive_policies**
  - [x] Only unused_index INFO issues remain (expected)

---

## Dev Notes

### Consolidated Policy Pattern

```sql
-- Single policy combining service_role and user access
CREATE POLICY "processing_jobs_select_policy" ON processing_jobs
  FOR SELECT USING (
    -- Service role bypass (for edge functions)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Users can view their agency's document jobs
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = processing_jobs.document_id
      AND d.agency_id = (SELECT get_user_agency_id())
    )
  );
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-8.md#Story-8.4]
- [Supabase: RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/8-4-consolidate-processing-jobs-rls.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) as Amelia (Dev Agent)

### Completion Notes List

1. **Policy Analysis (2025-12-03)**
   - Found 2 SELECT policies on processing_jobs causing 5 WARN issues
   - Other policies (INSERT, UPDATE, DELETE) are service_role only - no change needed

2. **Migration Applied (2025-12-03)**
   - `consolidate_processing_jobs_select_rls` via Supabase MCP
   - Single policy with: `(SELECT auth.role()) = 'service_role' OR EXISTS(agency check)`

3. **Verification (2025-12-03)**
   - Performance advisors: **0 multiple_permissive_policies** (was 5)
   - Only INFO-level unused_index issues remain

### File List

- `supabase/migrations/20251204_consolidate_processing_jobs_select_rls.sql` (applied via MCP)

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
| AC-8.4.1 | Single SELECT policy | ✅ | `processing_jobs_select_policy` replaces 2 policies |
| AC-8.4.2 | Service role access | ✅ | `(SELECT auth.role()) = 'service_role'` in policy |
| AC-8.4.3 | User access | ✅ | EXISTS subquery checks agency via get_user_agency_id() |
| AC-8.4.4 | Zero warnings | ✅ | get_advisors returns 0 multiple_permissive_policies |

**Summary:** 4 of 4 acceptance criteria verified ✅

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (BMad Master) | Story drafted from tech spec |
| 2025-12-03 | Dev (Amelia) | All tasks complete, SELECT policies consolidated |
| 2025-12-03 | Reviewer (Senior Dev) | Senior Developer Review: APPROVED |
