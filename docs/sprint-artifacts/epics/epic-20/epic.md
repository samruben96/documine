# Epic 20: AI Buddy Admin & Audit

**Status:** Contexted
**Created:** 2025-12-07
**Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-20.md`
**Planning Docs:** `docs/features/ai-buddy/`

## Overview

Provide admins with user management, usage analytics, and complete audit trail for compliance.

## Goal

Principals have full visibility and control over their agency's AI usage.

## Functional Requirements

- **FR42:** Admins can view a list of all users in their agency
- **FR43:** Admins can invite new users via email
- **FR44:** Admins can remove users from the agency
- **FR45:** Admins can change user roles (Producer ↔ Admin)
- **FR46:** Admins can view usage analytics (conversations per user, documents uploaded, active users)
- **FR47:** Admins can view a usage dashboard with trends over time
- **FR48:** Owners can manage billing and subscription settings
- **FR49:** Owners can transfer ownership to another Admin
- **FR50:** System maintains complete audit log of all AI conversations
- **FR51:** Admins can view audit log filtered by user, date range, or keyword
- **FR52:** Admins can view full conversation transcripts in audit log (read-only)
- **FR53:** Admins can export audit log entries as PDF or CSV
- **FR54:** Audit logs cannot be deleted or modified by any user
- **FR55:** Audit log entries include timestamp, user, conversation ID, and guardrail events
- **FR56:** System retains audit logs for minimum required compliance period
- **FR64:** Users can navigate between AI Buddy and Document Comparison seamlessly

## Consolidated Stories (6 total, 25 points)

| Story | Name | FRs | Points | Priority |
|-------|------|-----|--------|----------|
| 20.1 | Audit Log Infrastructure | FR54, FR55, FR56 | 3 | P0 (Blocker) |
| 20.2 | Admin User Management | FR42, FR43, FR44, FR45 | 5 | P1 |
| 20.3 | Usage Analytics Dashboard | FR46, FR47 | 5 | P1 |
| 20.4 | Audit Log Interface | FR50, FR51, FR52, FR53 | 5 | P1 |
| 20.5 | Owner Management | FR48, FR49 | 5 | P2 |
| 20.6 | Feature Navigation Polish | FR64 | 2 | P2 |

### Story Details

**20.1: Audit Log Infrastructure** (3 pts) - P0
- Append-only RLS policy (INSERT only, no UPDATE/DELETE)
- Database trigger to prevent modifications
- Indexes for efficient admin queries
- 7-year retention policy documented

**20.2: Admin User Management** (5 pts) - P1
- Paginated user list with sorting/search
- Email invitations via Supabase Auth magic link
- User removal (soft delete) with confirmation
- Role changes (Producer ↔ Admin) with validation

**20.3: Usage Analytics Dashboard** (5 pts) - P1
- Summary cards (conversations, active users, documents, messages)
- Per-user breakdown table
- Line chart trends over 30 days
- Date range filtering and CSV export

**20.4: Audit Log Interface** (5 pts) - P1
- Filterable audit log table (user, date, keyword, guardrail events)
- Transcript modal with full conversation view (read-only)
- PDF export with compliance headers
- CSV export with all metadata

**20.5: Owner Management** (5 pts) - P2
- Subscription and plan details with Stripe Customer Portal integration
- Payment method display and invoice history
- Ownership transfer to current admins
- Password re-authentication for transfer
- Atomic permission transfer with email notifications

**20.6: Feature Navigation Polish** (2 pts) - P2
- State-preserving navigation
- Restore conversation context on return
- Mobile navigation support

## Recommended Implementation Order

1. **20.1** - Audit Infrastructure (foundation for all admin features) ✅ DONE
2. **20.2** - User Management (core admin functionality) ✅ DONE
3. **20.3** - Usage Analytics Dashboard ✅ DONE
4. **20.4** - Audit Log Interface (compliance-critical)
5. **20.5** - Owner Management (billing + transfer)
6. **20.6** - Navigation Polish

## Dependencies

- Epic 19: AI Buddy Guardrails & Compliance (DONE)

## Technical Notes

- Audit logs are append-only (INSERT only RLS policy + trigger)
- 7-year retention for insurance compliance
- Usage analytics cached via materialized view (nightly refresh)
- Owner-only access for billing and ownership transfer
- Verify-Then-Service pattern for mutations

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-20.md`
