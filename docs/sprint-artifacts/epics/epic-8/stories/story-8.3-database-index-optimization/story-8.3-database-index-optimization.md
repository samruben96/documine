# Story 8.3: Database Index Optimization

**Epic:** 8 - Tech Debt & Production Hardening
**Priority:** P1
**Effort:** S (2-3 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **platform user**,
I want **database queries to use efficient index scans for foreign key lookups**,
So that **my document browsing, chat, and comparison workflows remain fast as data grows**.

---

## Context

Supabase performance advisors have identified:
- **8 unindexed foreign key columns** causing sequential scans on JOIN operations
- **6 unused indexes** consuming storage without benefit

This is the third story in Epic 8 and builds on the RLS optimization from Story 8.2.

### Columns Requiring Indexes

| Table | Column | Foreign Key To |
|-------|--------|----------------|
| `chat_messages` | `agency_id` | `agencies.id` |
| `conversations` | `agency_id` | `agencies.id` |
| `conversations` | `user_id` | `users.id` |
| `document_chunks` | `agency_id` | `agencies.id` |
| `documents` | `uploaded_by` | `users.id` |
| `invitations` | `invited_by` | `users.id` |
| `processing_jobs` | `document_id` | `documents.id` |
| `users` | `agency_id` | `agencies.id` |

---

## Acceptance Criteria

### AC-8.3.1: Chat Messages Agency Index
**Given** the `chat_messages` table has `agency_id` foreign key
**When** the migration is applied
**Then** index exists on `chat_messages(agency_id)`

### AC-8.3.2: Conversations Indexes
**Given** the `conversations` table has `agency_id` and `user_id` foreign keys
**When** the migration is applied
**Then** indexes exist on `conversations(agency_id)` and `conversations(user_id)`

### AC-8.3.3: Document Chunks Agency Index
**Given** the `document_chunks` table has `agency_id` foreign key
**When** the migration is applied
**Then** index exists on `document_chunks(agency_id)`

### AC-8.3.4: Documents Uploaded By Index
**Given** the `documents` table has `uploaded_by` foreign key
**When** the migration is applied
**Then** index exists on `documents(uploaded_by)`

### AC-8.3.5: Invitations Invited By Index
**Given** the `invitations` table has `invited_by` foreign key
**When** the migration is applied
**Then** index exists on `invitations(invited_by)`

### AC-8.3.6: Processing Jobs Document Index
**Given** the `processing_jobs` table has `document_id` foreign key
**When** the migration is applied
**Then** index exists on `processing_jobs(document_id)`

### AC-8.3.7: Users Agency Index
**Given** the `users` table has `agency_id` foreign key
**When** the migration is applied
**Then** index exists on `users(agency_id)`

### AC-8.3.8: Unused Index Decision
**Given** performance advisors identified 6 unused indexes
**When** the migration is applied
**Then** each unused index has documented decision (keep/remove with rationale)

### AC-8.3.9: Performance Advisor Verification
**Given** all indexes have been added
**When** running `mcp__supabase__get_advisors(type: 'performance')`
**Then** zero "unindexed foreign key" warnings are returned
**And** the verification is documented in the story

---

## Tasks / Subtasks

- [x] Task 1: Analyze Current Indexes (AC: 8.3.1-8.3.7) ✅
  - [x] Query pg_indexes to verify which indexes already exist
  - [x] Document current index state

- [x] Task 2: Create FK Index Migration (AC: 8.3.1-8.3.7) ✅
  - [x] Apply migration via Supabase MCP
  - [x] All 8 FK indexes created via `add_foreign_key_indexes` migration

- [x] Task 3: Evaluate Unused Indexes (AC: 8.3.8) ✅
  - [x] Analyzed 7 pre-existing unused indexes
  - [x] Decision: **KEEP ALL** (see rationale below)

- [x] Task 4: Verify Performance Advisors (AC: 8.3.9) ✅
  - [x] `mcp__supabase__get_advisors(type: 'performance')` returns **0 unindexed_foreign_keys**
  - [x] Remaining: 5 multiple_permissive_policies (Story 8.4 scope)

---

## Dev Notes

### Index Creation Pattern

```sql
-- Use CONCURRENTLY for zero-downtime index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_agency_id
  ON chat_messages(agency_id);
```

**Note:** CONCURRENTLY cannot be used inside a transaction block. Each index must be created in a separate statement for Supabase MCP.

### Unused Index Analysis

Query to identify unused indexes:
```sql
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-8.md#Story-8.3]
- [PostgreSQL: CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [Supabase: Index Advisor](https://supabase.com/docs/guides/database/database-advisors)

### Learnings from Previous Story

**From Story 8.2 (Status: done)**

- Supabase MCP apply_migration works well for DDL changes
- Verify via get_advisors after migration
- Build + test suite confirms no regressions

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/8-3-database-index-optimization.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) as Amelia (Dev Agent)

### Completion Notes List

1. **Index Analysis (2025-12-03)**
   - Queried pg_indexes - found 0 of 8 required FK indexes existed
   - Performance advisors showed 8 unindexed_foreign_keys warnings

2. **Migration Applied (2025-12-03)**
   - `add_foreign_key_indexes` migration via Supabase MCP
   - Created 8 indexes: chat_messages.agency_id, conversations.agency_id, conversations.user_id, document_chunks.agency_id, documents.uploaded_by, invitations.invited_by, processing_jobs.document_id, users.agency_id

3. **Unused Index Decisions (AC-8.3.8)**

   | Index | Decision | Rationale |
   |-------|----------|-----------|
   | `idx_processing_jobs_status` | KEEP | Used by job queue status queries |
   | `idx_document_chunks_embedding` | KEEP | Critical for vector similarity search |
   | `idx_labels_agency` | KEEP | RLS policy support + future labels feature |
   | `idx_invitations_agency` | KEEP | RLS policy support for multi-tenant isolation |
   | `idx_invitations_email` | KEEP | Required for invitation email lookups |
   | `idx_document_labels_label` | KEEP | Future label filtering feature |
   | `idx_document_chunks_type` | KEEP | Chunk type filtering in RAG pipeline |

   **Note:** All indexes kept. Storage cost is minimal (~KB each), while missing indexes could cause slow queries at scale.

4. **Verification (2025-12-03)**
   - `mcp__supabase__get_advisors(type: 'performance')`: **0 unindexed_foreign_keys**
   - Build: ✅ Passed

### File List

- `supabase/migrations/20251204_add_foreign_key_indexes.sql` (applied via MCP)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (BMad Master) | Story drafted from tech spec |
| 2025-12-03 | Dev (Amelia) | Task 1-4: All complete, 8 FK indexes added |
| 2025-12-03 | Dev (Amelia) | Status: ready-for-dev → review |
| 2025-12-03 | Reviewer (Senior Dev) | Senior Developer Review: APPROVED |

---

## Senior Developer Review (AI)

### Reviewer
Sam (Senior Developer)

### Date
2025-12-03

### Outcome
✅ **APPROVED** - All acceptance criteria verified.

### Summary

Story 8.3 adds 8 missing foreign key indexes and documents decisions to keep all 7 pre-existing unused indexes. Performance advisors confirm 0 unindexed FK warnings.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-8.3.1 | chat_messages.agency_id index | ✅ | `idx_chat_messages_agency_id` created |
| AC-8.3.2 | conversations.agency_id & user_id | ✅ | Both indexes created |
| AC-8.3.3 | document_chunks.agency_id | ✅ | `idx_document_chunks_agency_id` created |
| AC-8.3.4 | documents.uploaded_by | ✅ | `idx_documents_uploaded_by` created |
| AC-8.3.5 | invitations.invited_by | ✅ | `idx_invitations_invited_by` created |
| AC-8.3.6 | processing_jobs.document_id | ✅ | `idx_processing_jobs_document_id` created |
| AC-8.3.7 | users.agency_id | ✅ | `idx_users_agency_id` created |
| AC-8.3.8 | Unused index decisions documented | ✅ | 7 indexes kept with rationale |
| AC-8.3.9 | Zero unindexed FK warnings | ✅ | get_advisors returns 0 |

**Summary:** 9 of 9 acceptance criteria verified ✅

### Action Items

**Code Changes Required:** None

**Advisory Notes:**
- Story 8.4 should address 5 remaining multiple_permissive_policies warnings
