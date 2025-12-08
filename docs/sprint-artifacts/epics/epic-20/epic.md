# Epic 20: AI Buddy Admin & Audit

**Status:** Backlog
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


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

## Stories

| Story | Name | Description |
|-------|------|-------------|
| 20.1 | Admin User List | View all agency users with AI Buddy status |
| 20.2 | Invite Users | Send email invitations to new users |
| 20.3 | Remove Users | Remove users from agency (soft delete) |
| 20.4 | Change User Roles | Producer ↔ Admin role changes |
| 20.5 | Usage Analytics | Summary cards with conversation/user metrics |
| 20.6 | Usage Dashboard Trends | Line charts showing usage over time |
| 20.7 | Audit Log View | Filterable table of conversation entries |
| 20.8 | Audit Log Transcript | Full read-only conversation view |
| 20.9 | Audit Log Export | PDF and CSV export options |
| 20.10 | Audit Log Immutability | Append-only RLS policies, 7-year retention |
| 20.11 | Owner Billing Management | Subscription and payment management |
| 20.12 | Transfer Ownership | Transfer agency ownership to another admin |
| 20.13 | Feature Navigation Polish | Seamless navigation between features |

## Dependencies

- Epic 19: AI Buddy Guardrails & Compliance

## Technical Notes

- Audit logs are append-only (INSERT only RLS policy)
- 7-year retention for insurance compliance
- Usage analytics cached daily for performance
- Owner-only access for billing and ownership transfer

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 7)
