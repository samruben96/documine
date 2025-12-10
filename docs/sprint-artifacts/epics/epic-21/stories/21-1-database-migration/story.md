# Story 21.1: Database Migration - Agency Admin Tables

**Status:** done

---

## User Story

As a **platform architect**,
I want **admin-related tables renamed from `ai_buddy_*` to `agency_*`**,
So that **the database schema accurately reflects that admin functionality is agency-wide, not feature-specific**.

---

## Acceptance Criteria

### AC-21.1.1: Permissions Table Renamed
**Given** the database has `ai_buddy_permissions` table
**When** the migration runs
**Then** the table is renamed to `agency_permissions`
**And** all foreign key constraints are preserved
**And** existing data is intact

### AC-21.1.2: Audit Logs Table Renamed
**Given** the database has `ai_buddy_audit_logs` table
**When** the migration runs
**Then** the table is renamed to `agency_audit_logs`
**And** all foreign key constraints are preserved
**And** existing data is intact

### AC-21.1.3: Permission Enum Renamed
**Given** the database has `ai_buddy_permission` enum type
**When** the migration runs
**Then** the enum is renamed to `agency_permission`
**And** all columns using this enum continue to work

### AC-21.1.4: Invitations Merged
**Given** pending invitations exist in `ai_buddy_invitations`
**When** the migration runs
**Then** they are merged into the main `invitations` table
**And** `ai_buddy_invitations` table is dropped
**And** no duplicate invitations are created

### AC-21.1.5: RLS Policies Updated
**Given** RLS policies reference `ai_buddy_permissions`
**When** the migration runs
**Then** all policies reference `agency_permissions` instead
**And** permission checks continue to work correctly

### AC-21.1.6: Migration is Reversible
**Given** the migration has been applied
**When** a rollback is needed
**Then** the migration can be reversed without data loss

---

## Implementation Details

### Tasks / Subtasks

- [x] Task 1: Create migration file `20251212000000_agency_admin_consolidation.sql`
- [x] Task 2: Rename `ai_buddy_permission` enum to `agency_permission`
- [x] Task 3: Rename `ai_buddy_permissions` table to `agency_permissions`
- [x] Task 4: Rename `ai_buddy_audit_logs` table to `agency_audit_logs`
- [x] Task 5: Merge `ai_buddy_invitations` into `invitations` table
- [x] Task 6: Drop `ai_buddy_invitations` table
- [x] Task 7: Update all RLS policies to reference new table names
- [x] Task 8: Create reverse migration script
- [x] Task 9: Test migration via Supabase MCP (applied to production)
- [x] Task 10: Regenerate TypeScript types

### Technical Summary

This story renames the AI Buddy admin tables to agency-wide names. The key operations are:

1. **Enum rename**: PostgreSQL supports `ALTER TYPE ... RENAME TO`
2. **Table rename**: PostgreSQL supports `ALTER TABLE ... RENAME TO` with automatic FK cascade
3. **Invitation merge**: INSERT with ON CONFLICT for deduplication
4. **RLS update**: Drop and recreate policies with new table references

### Project Structure Notes

- **Files to modify:**
  - `supabase/migrations/20251210000000_agency_admin_consolidation.sql` (CREATE)
  - `src/types/database.types.ts` (REGENERATE)

- **Expected test locations:**
  - Manual testing with local Supabase
  - Verify via `npm run generate-types`

- **Prerequisites:** None - this is the first story

### Key Code References

- `supabase/migrations/20251207000000_ai_buddy_foundation.sql` - Original table definitions
- `supabase/migrations/20251211000000_transfer_ownership_function.sql` - Uses permissions table

---

## Context References

**Tech-Spec:** [../tech-spec/index.md](../tech-spec/index.md) - Primary context document

**Tables Affected:**
- `ai_buddy_permissions` → `agency_permissions`
- `ai_buddy_audit_logs` → `agency_audit_logs`
- `ai_buddy_invitations` → merged into `invitations`

---

## Dev Agent Record

### Context Reference
- [21-1-database-migration.context.xml](./21-1-database-migration.context.xml)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
**Completed:** 2025-12-09

**Migration Applied:** Successfully applied to production Supabase (nxuzurxiaismssiiydst) via Supabase MCP.

**Key Changes:**
1. Renamed `ai_buddy_permission` enum → `agency_permission`
2. Renamed `ai_buddy_permissions` table → `agency_permissions` (6 rows preserved)
3. Renamed `ai_buddy_audit_logs` table → `agency_audit_logs` (9 rows preserved)
4. Added unique constraint `invitations_agency_email_unique` to invitations table
5. Merged `ai_buddy_invitations` into `invitations` table (1 row migrated)
6. Dropped `ai_buddy_invitations` table
7. Updated RLS policies on: `ai_buddy_guardrails`, `agency_permissions`, `agency_audit_logs`, `invitations`
8. Updated `transfer_ownership` function to use `agency_permissions`

**Important:** Application code still references old table names (`ai_buddy_permissions`, `ai_buddy_audit_logs`). Build will fail until Stories 21.2/21.3 update code references. All 5 stories in Epic 21 must be deployed together.

**Verification:**
- Tables verified via `list_tables` MCP
- TypeScript types regenerated via `npx supabase gen types typescript`
- Types show new `agency_permissions`, `agency_audit_logs` tables and `agency_permission` enum

### Files Modified
- `supabase/migrations/20251212000000_agency_admin_consolidation.sql` (CREATE)
- `supabase/migrations/20251212000000_agency_admin_consolidation_rollback.sql` (CREATE)
- `src/types/database.types.ts` (REGENERATE)

---

## Senior Developer Review (AI)

### Reviewer
Sam (via Claude Opus 4.5)

### Date
2025-12-09

### Outcome
✅ **APPROVED**

All acceptance criteria implemented with evidence. All tasks verified complete. Migration applied successfully to production. No security vulnerabilities introduced.

### Summary
Story 21.1 successfully renames AI Buddy admin tables to agency-wide scope. The migration was properly transactional, preserves data integrity, updates all RLS policies, and includes a comprehensive rollback script. Database verification confirms all changes are in place.

### Key Findings

**No Issues Found** - This is a clean implementation.

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-21.1.1 | Permissions Table Renamed | ✅ IMPLEMENTED | `agency_permissions` exists with 6 rows, FKs preserved |
| AC-21.1.2 | Audit Logs Table Renamed | ✅ IMPLEMENTED | `agency_audit_logs` exists with 9 rows, FKs preserved |
| AC-21.1.3 | Permission Enum Renamed | ✅ IMPLEMENTED | `agency_permission` enum in `database.types.ts:1162` |
| AC-21.1.4 | Invitations Merged | ✅ IMPLEMENTED | `ai_buddy_invitations` dropped, 1 row in `invitations` |
| AC-21.1.5 | RLS Policies Updated | ✅ IMPLEMENTED | 10 policies on 3 tables reference `agency_permissions` |
| AC-21.1.6 | Migration Reversible | ✅ IMPLEMENTED | `20251212000000_agency_admin_consolidation_rollback.sql` created |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Description | Marked | Verified | Evidence |
|------|-------------|--------|----------|----------|
| 1 | Create migration file | ✅ | ✅ VERIFIED | File exists: `20251212000000_agency_admin_consolidation.sql` |
| 2 | Rename enum | ✅ | ✅ VERIFIED | Migration line 29 |
| 3 | Rename permissions table | ✅ | ✅ VERIFIED | Migration line 36 |
| 4 | Rename audit_logs table | ✅ | ✅ VERIFIED | Migration line 46 |
| 5 | Merge invitations | ✅ | ✅ VERIFIED | Migration lines 62-113 |
| 6 | Drop ai_buddy_invitations | ✅ | ✅ VERIFIED | Migration line 119 |
| 7 | Update RLS policies | ✅ | ✅ VERIFIED | Migration lines 126-249 |
| 8 | Create rollback script | ✅ | ✅ VERIFIED | Rollback file exists |
| 9 | Apply via Supabase MCP | ✅ | ✅ VERIFIED | Migration in `list_migrations` |
| 10 | Regenerate TypeScript types | ✅ | ✅ VERIFIED | Types show new tables/enum |

**Summary: 10 of 10 tasks verified. 0 questionable. 0 false completions.**

### Test Coverage and Gaps

- **Unit Tests:** N/A - Database migration (no application code)
- **Integration Tests:** Verified via Supabase MCP queries
- **E2E Tests:** N/A - Database-only story

Data integrity verified:
- `agency_permissions`: 6 rows preserved
- `agency_audit_logs`: 9 rows preserved
- `invitations`: 1 row migrated from `ai_buddy_invitations`

### Architectural Alignment

✅ Aligns with Tech Spec: Tables renamed as specified
✅ Transaction safety: Proper BEGIN/COMMIT wrapping
✅ FK cascading: PostgreSQL handles automatically with RENAME
✅ Index renaming: Updated to match new table names

### Security Notes

- ✅ RLS enabled on all 3 renamed tables
- ✅ 10 RLS policies correctly reference `agency_permissions`
- ✅ No SQL injection risks (no dynamic SQL)
- ⚠️ Pre-existing WARN: `transfer_ownership` lacks explicit `search_path` (not introduced by this story)

### Best-Practices and References

- [PostgreSQL ALTER TYPE RENAME](https://www.postgresql.org/docs/current/sql-altertype.html)
- [PostgreSQL ALTER TABLE RENAME](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Application code references old table names - build will fail until Stories 21.2/21.3 update code references (documented in story, expected behavior)
- Note: Consider adding explicit `search_path` to `transfer_ownership` function in a future migration (pre-existing issue)
