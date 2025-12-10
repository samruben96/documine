# Story 21.2: API Route Migration

**Status:** Done

---

## User Story

As a **developer**,
I want **agency-wide admin API routes moved from `/api/ai-buddy/admin/` to `/api/admin/`**,
So that **the API structure reflects that admin functionality serves the entire platform**.

---

## Acceptance Criteria

### AC-21.2.1: User Management Routes Moved
**Given** routes exist at `/api/ai-buddy/admin/users/`
**When** the migration is complete
**Then** routes are available at `/api/admin/users/`
**And** they reference `agency_permissions` table
**And** all CRUD operations work correctly

### AC-21.2.2: Analytics Routes Moved
**Given** routes exist at `/api/ai-buddy/admin/analytics/`
**When** the migration is complete
**Then** routes are available at `/api/admin/analytics/`
**And** export functionality works
**And** date filtering works

### AC-21.2.3: Audit Log Routes Moved
**Given** routes exist at `/api/ai-buddy/admin/audit-logs/`
**When** the migration is complete
**Then** routes are available at `/api/admin/audit-logs/`
**And** they reference `agency_audit_logs` table
**And** transcript retrieval works
**And** export functionality works

### AC-21.2.4: Subscription Routes Moved
**Given** routes exist at `/api/ai-buddy/admin/subscription/`
**When** the migration is complete
**Then** routes are available at `/api/admin/subscription/`

### AC-21.2.5: Transfer Ownership Routes Moved
**Given** routes exist at `/api/ai-buddy/admin/transfer-ownership/`
**When** the migration is complete
**Then** routes are available at `/api/admin/transfer-ownership/`
**And** the RPC function call works with renamed tables

### AC-21.2.6: Old Routes Removed
**Given** routes were moved to `/api/admin/`
**When** the migration is complete
**Then** the old `/api/ai-buddy/admin/` routes for agency-wide features are deleted
**And** AI Buddy specific routes (guardrails, onboarding-status) remain at `/api/ai-buddy/admin/`

---

## Implementation Details

### Tasks / Subtasks

- [x] Task 1: Create `src/app/api/admin/` directory structure
- [x] Task 2: Move `users/` routes, update table references
- [x] Task 3: Move `analytics/` routes, update table references
- [x] Task 4: Move `audit-logs/` routes, update table references
- [x] Task 5: Move `subscription/` route
- [x] Task 6: Move `transfer-ownership/` route
- [x] Task 7: Update error codes from `AIB_*` to `ADMIN_*` where appropriate
- [x] Task 8: Delete moved routes from `/api/ai-buddy/admin/`
- [x] Task 9: Update any error handling service references
- [x] Task 10: Test all endpoints

### Technical Summary

Move agency-wide API routes to a new `/api/admin/` path. Key changes:

1. Create new directory structure under `src/app/api/admin/`
2. Copy route files, update table name references:
   - `ai_buddy_permissions` → `agency_permissions`
   - `ai_buddy_audit_logs` → `agency_audit_logs`
3. Update imports if needed
4. Delete old route files

### Project Structure Notes

- **Files to create:**
  - `src/app/api/admin/users/route.ts`
  - `src/app/api/admin/users/[userId]/route.ts`
  - `src/app/api/admin/analytics/route.ts`
  - `src/app/api/admin/analytics/export/route.ts`
  - `src/app/api/admin/audit-logs/route.ts`
  - `src/app/api/admin/audit-logs/export/route.ts`
  - `src/app/api/admin/audit-logs/[conversationId]/transcript/route.ts`
  - `src/app/api/admin/subscription/route.ts`
  - `src/app/api/admin/transfer-ownership/route.ts`

- **Files to delete:**
  - `src/app/api/ai-buddy/admin/users/` (entire folder)
  - `src/app/api/ai-buddy/admin/analytics/` (entire folder)
  - `src/app/api/ai-buddy/admin/audit-logs/` (entire folder)
  - `src/app/api/ai-buddy/admin/subscription/route.ts`
  - `src/app/api/ai-buddy/admin/transfer-ownership/route.ts`
  - `src/app/api/ai-buddy/admin/invitations/` (entire folder)

- **Files to keep at ai-buddy/admin:**
  - `guardrails/` (AI Buddy specific)
  - `onboarding-status/` (AI Buddy specific)

- **Expected test locations:**
  - Manual API testing
  - Update E2E tests in Story 21.3

- **Prerequisites:** Story 21.1 (database migration)

### Key Code References

- `src/app/api/ai-buddy/admin/users/route.ts` - Current user management
- `src/app/api/ai-buddy/admin/audit-logs/route.ts` - Current audit log queries
- `src/lib/ai-buddy/errors.ts` - Error codes (may need agency equivalents)

---

## Context References

**Tech-Spec:** [../tech-spec/index.md](../tech-spec/index.md) - Primary context document

**Routes to Move:**
| Current | New |
|---------|-----|
| `/api/ai-buddy/admin/users/` | `/api/admin/users/` |
| `/api/ai-buddy/admin/analytics/` | `/api/admin/analytics/` |
| `/api/ai-buddy/admin/audit-logs/` | `/api/admin/audit-logs/` |
| `/api/ai-buddy/admin/subscription/` | `/api/admin/subscription/` |
| `/api/ai-buddy/admin/transfer-ownership/` | `/api/admin/transfer-ownership/` |

---

## Dev Agent Record

### Context Reference
- [21-2-api-route-migration.context.xml](./21-2-api-route-migration.context.xml)

### Agent Model Used
Claude Opus 4.5

### Completion Notes
Completed 2025-12-09. All agency-wide admin routes migrated from `/api/ai-buddy/admin/` to `/api/admin/`. Hooks updated to use new endpoints. AI Buddy specific routes (guardrails, onboarding-status) remain at original location. All 2,796 tests passing, build successful.

### Files Modified
**New Routes Created:**
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[userId]/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/admin/analytics/export/route.ts`
- `src/app/api/admin/audit-logs/route.ts`
- `src/app/api/admin/audit-logs/export/route.ts`
- `src/app/api/admin/audit-logs/[conversationId]/transcript/route.ts`
- `src/app/api/admin/subscription/route.ts`
- `src/app/api/admin/transfer-ownership/route.ts`
- `src/app/api/admin/invitations/[invitationId]/route.ts`

**Old Routes Deleted:**
- `src/app/api/ai-buddy/admin/users/` (entire folder)
- `src/app/api/ai-buddy/admin/analytics/` (entire folder)
- `src/app/api/ai-buddy/admin/audit-logs/` (entire folder)
- `src/app/api/ai-buddy/admin/invitations/` (entire folder)

**Hooks Updated:**
- `src/hooks/ai-buddy/use-audit-logs.ts`
- `src/hooks/ai-buddy/use-usage-analytics.ts`
- `src/hooks/ai-buddy/use-user-management.ts`

**Other Updates:**
- `src/lib/ai-buddy/errors.ts` - Error code references
- `src/lib/ai-buddy/audit-logger.ts` - Table references
- `src/lib/auth/admin.ts` - Permission checks
- Various test files updated for new endpoints

---

## Review Notes
<!-- Will be populated during code review -->
