# Story 21.4: Extend Audit Logging

**Status:** Draft

---

## User Story

As an **agency admin**,
I want **audit logs to capture actions from ALL features**,
So that **I have a complete view of what users are doing across document uploads, comparisons, one-pagers, and AI Buddy**.

---

## Acceptance Criteria

### AC-21.4.1: Document Actions Logged
**Given** a user uploads, deletes, or modifies a document
**When** the action completes
**Then** an audit log entry is created with action type `document_uploaded`, `document_deleted`, or `document_modified`
**And** the entry includes document ID and filename in metadata

### AC-21.4.2: Comparison Actions Logged
**Given** a user creates or exports a comparison
**When** the action completes
**Then** an audit log entry is created with action type `comparison_created` or `comparison_exported`
**And** the entry includes comparison ID and document IDs in metadata

### AC-21.4.3: One-Pager Actions Logged
**Given** a user generates or exports a one-pager
**When** the action completes
**Then** an audit log entry is created with action type `one_pager_generated` or `one_pager_exported`
**And** the entry includes relevant document/comparison IDs in metadata

### AC-21.4.4: Document Chat Actions Logged
**Given** a user starts a document chat session
**When** the session begins
**Then** an audit log entry is created with action type `document_chat_started`
**And** the entry includes document ID and conversation ID in metadata

### AC-21.4.5: Audit Log UI Shows All Actions
**Given** audit logs from multiple features exist
**When** an admin views the audit log
**Then** all action types are displayed with appropriate labels
**And** filtering works across all action types

### AC-21.4.6: Audit Logger Service Relocated
**Given** audit logger was at `src/lib/ai-buddy/audit-logger.ts`
**When** the migration is complete
**Then** it exists at `src/lib/admin/audit-logger.ts`
**And** it supports all new action types

---

## Implementation Details

### Tasks / Subtasks

- [ ] Task 1: Move `src/lib/ai-buddy/audit-logger.ts` to `src/lib/admin/audit-logger.ts`
- [ ] Task 2: Add new action types to audit logger:
  - `document_uploaded`, `document_deleted`, `document_modified`
  - `comparison_created`, `comparison_exported`
  - `one_pager_generated`, `one_pager_exported`
  - `document_chat_started`
- [ ] Task 3: Integrate audit logging in `src/app/api/documents/` routes
- [ ] Task 4: Integrate audit logging in `src/app/api/compare/` routes
- [ ] Task 5: Integrate audit logging in one-pager generation (if exists)
- [ ] Task 6: Integrate audit logging in document chat routes
- [ ] Task 7: Update audit log table component to display new action types with icons/labels
- [ ] Task 8: Update audit filters to include new action types
- [ ] Task 9: Test all integrations
- [ ] Task 10: Update audit log export to include new action types

### Technical Summary

Extend the audit logging system to capture actions from all features:

1. **Move and extend audit logger service** with new action types
2. **Integrate logging calls** at key action points in API routes
3. **Update UI** to display and filter new action types

### Project Structure Notes

- **Files to modify:**
  - `src/lib/admin/audit-logger.ts` (CREATE from move + extend)
  - `src/app/api/documents/route.ts` - Add upload logging
  - `src/app/api/documents/[id]/route.ts` - Add delete logging
  - `src/app/api/compare/route.ts` - Add comparison logging
  - `src/app/api/compare/[id]/route.ts` - Add export logging
  - `src/components/admin/audit-log/audit-log-table.tsx` - Display new types
  - `src/components/admin/audit-log/audit-filters.tsx` - Filter new types

- **Expected test locations:**
  - `__tests__/lib/admin/audit-logger.test.ts`
  - Integration tests via E2E

- **Prerequisites:** Story 21.3 (components moved)

### Key Code References

- `src/lib/ai-buddy/audit-logger.ts` - Current audit logger
- `src/app/api/documents/route.ts` - Document upload endpoint
- `src/app/api/compare/route.ts` - Comparison creation endpoint

---

## Context References

**Tech-Spec:** [../tech-spec/index.md](../tech-spec/index.md) - Primary context document

**New Action Types:**
| Action | Feature | Logged When |
|--------|---------|-------------|
| `document_uploaded` | Documents | File uploaded successfully |
| `document_deleted` | Documents | File deleted |
| `document_modified` | Documents | Metadata changed (labels, name) |
| `comparison_created` | Comparison | New comparison started |
| `comparison_exported` | Comparison | PDF/export generated |
| `one_pager_generated` | One-Pager | One-pager created |
| `one_pager_exported` | One-Pager | PDF exported |
| `document_chat_started` | Doc Chat | Chat session begun |

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->
