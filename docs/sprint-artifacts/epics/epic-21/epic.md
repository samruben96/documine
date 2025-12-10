# Epic 21: Agency-Wide Admin Platform

**Status:** Ready for Development
**Created:** 2025-12-09
**Type:** Refactor + Extension

---

## Overview

Consolidate the admin functionality built in Epic 20 (user management, usage analytics, audit logs, owner management) from AI Buddy-specific scope to **agency-wide platform scope**. This ensures all docuMINE features share a single admin infrastructure.

## Business Value

- **Unified Admin Experience**: One place to manage users, view analytics, and access audit logs
- **Future-Proof Architecture**: New features automatically benefit from admin infrastructure
- **Reduced Technical Debt**: Avoid building separate admin panels per feature
- **Better UX**: Admins don't need to navigate feature-specific settings

## Scope

### In Scope
- Rename database tables from `ai_buddy_*` to `agency_*`
- Move API routes from `/api/ai-buddy/admin/` to `/api/admin/`
- Move components from `components/ai-buddy/admin/` to `components/admin/`
- Promote Admin to top-level Settings tab
- Extend audit logging for all features
- Extend usage tracking for all features

### Out of Scope
- AI Buddy specific tables (projects, conversations, guardrails) - remain as `ai_buddy_*`
- New admin features - consolidation only
- Permission model changes

---

## Stories

| Story | Title | Size | Status |
|-------|-------|------|--------|
| 21.1 | Database Migration - Agency Admin Tables | S | Draft |
| 21.2 | API Route Migration | S | Draft |
| 21.3 | Component & Settings Migration | M | Draft |
| 21.4 | Extend Audit Logging | S | Draft |
| 21.5 | Extend Usage Tracking | S | Draft |

---

## Story Summaries

### Story 21.1: Database Migration
Rename `ai_buddy_permissions` → `agency_permissions`, `ai_buddy_audit_logs` → `agency_audit_logs`. Merge `ai_buddy_invitations` into existing `invitations` table. Update RLS policies.

### Story 21.2: API Route Migration
Move agency-wide routes from `/api/ai-buddy/admin/*` to `/api/admin/*`. Update table references. Keep AI Buddy specific routes (guardrails, onboarding) in place.

### Story 21.3: Component & Settings Migration
Move agency-wide components and hooks to `components/admin/` and `hooks/admin/`. Create top-level Admin tab in Settings. Simplify AI Buddy tab to preferences only.

### Story 21.4: Extend Audit Logging
Add audit action types for document uploads, comparisons, one-pagers, and document chat. Update audit log UI to display and filter all action types.

### Story 21.5: Extend Usage Tracking
Update usage analytics to aggregate activity from all features (AI Buddy, documents, comparisons, one-pagers). Show feature breakdown in dashboard.

---

## Dependencies

| Story | Depends On |
|-------|------------|
| 21.1 | None |
| 21.2 | 21.1 |
| 21.3 | 21.2 |
| 21.4 | 21.3 |
| 21.5 | 21.3 |

Stories 21.4 and 21.5 can run in parallel after 21.3.

---

## Technical Approach

See [tech-spec/index.md](./tech-spec/index.md) for complete technical details.

**Key Migration Steps:**
1. Database: Rename tables via migration (backward compatible)
2. API: Create new routes, update references, delete old routes
3. Components: Move files, update imports, restructure Settings
4. Integration: Add logging/tracking calls to existing features

---

## Success Criteria

- [ ] All admin functionality accessible via `/api/admin/` routes
- [ ] Settings page has top-level Admin tab
- [ ] Audit logs capture actions from all features
- [ ] Usage analytics aggregate all features
- [ ] All existing tests pass
- [ ] Build succeeds
- [ ] No broken imports

---

## Notes

This epic consolidates work that was scoped under AI Buddy due to epic sequencing but is inherently agency-level functionality. The team aligned on this approach during a Party Mode discussion on 2025-12-09.

Epic 20 is considered complete (stories 20.1-20.5 delivered). Story 20.6 scope (if any) should be incorporated into this epic's extension work.
