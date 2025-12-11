# Epic Q1: Foundation & Navigation

**Project:** docuMINE - Quoting Helper (Phase 3)
**Author:** Sam
**Date:** 2025-12-11
**Status:** Contexted

---

## Overview

Epic Q1 establishes the foundational infrastructure for the Quoting Helper feature within docuMINE. This epic creates the database schema for quote sessions and results, integrates quoting navigation into the existing sidebar, and adds a quick access card to the dashboard.

**User Value:** Agents can navigate to quoting seamlessly from their existing docuMINE workflow with secure, agency-isolated data storage.

**FRs Covered:** FR39, FR40, FR41, FR42

---

## Stories

| Story | Title | FRs | Status |
|-------|-------|-----|--------|
| Q1.1 | Database Schema & RLS Setup | FR41, FR42 | backlog |
| Q1.2 | Sidebar Navigation Integration | FR39 | backlog |
| Q1.3 | Dashboard Quick Access Card | FR40 | backlog |

---

## Story Q1.1: Database Schema & RLS Setup

As an **insurance agent**,
I want **my quote sessions to be securely stored and isolated to my agency**,
So that **my client data is protected and only I can access my quotes**.

### Acceptance Criteria

- [ ] `quote_sessions` table exists with columns: id, agency_id, user_id, prospect_name, quote_type, status, client_data (JSONB), created_at, updated_at
- [ ] `quote_results` table exists with columns: id, session_id, agency_id, carrier_code, carrier_name, premium_annual, premium_monthly, deductible_home, deductible_auto, coverages (JSONB), status, document_storage_path, created_at, updated_at
- [ ] RLS policies enforce agency-scoped access on both tables
- [ ] Indexes exist on agency_id, user_id, session_id, and status columns
- [ ] TypeScript types generated via `npm run generate-types`

### Technical Notes

- Create Supabase migration: `supabase/migrations/TIMESTAMP_add_quoting_tables.sql`
- Follow existing RLS pattern from `documents` table
- Use `gen_random_uuid()` for primary keys
- JSONB columns for flexible schema (client_data, coverages)
- Reference Architecture doc section "Data Architecture"

---

## Story Q1.2: Sidebar Navigation Integration

As an **insurance agent**,
I want **to see "Quoting" in the docuMINE sidebar navigation**,
So that **I can easily access the quoting feature from anywhere in the app**.

### Acceptance Criteria

- [ ] "Quoting" menu item appears in sidebar navigation
- [ ] Uses ClipboardList (or similar) Lucide icon
- [ ] Clicking "Quoting" navigates to `/quoting`
- [ ] Active state is highlighted when on any `/quoting/*` route
- [ ] Styling consistent with existing navigation items

### Technical Notes

- Update `src/components/layout/sidebar.tsx`
- Add route to existing navigation array
- Follow existing active route detection pattern

---

## Story Q1.3: Dashboard Quick Access Card

As an **insurance agent**,
I want **to see a Quoting quick access card on my dashboard**,
So that **I can quickly start a new quote from my home screen**.

### Acceptance Criteria

- [ ] "Quoting" card appears on dashboard showing:
  - Title: "Quoting"
  - Subtitle: "Enter once, use everywhere"
  - Count of active quote sessions (draft + in_progress)
  - "New Quote" and "View All" action buttons
- [ ] Clicking "New Quote" navigates to /quoting (or opens new quote flow)
- [ ] Clicking "View All" navigates to `/quoting`
- [ ] Card styling matches existing dashboard cards

### Technical Notes

- Create `src/components/dashboard/quoting-card.tsx`
- Query quote_sessions count for current user
- Reuse existing dashboard card component pattern

---

## Dependencies

- **Prerequisites:** None (foundation epic)
- **Enables:** Epic Q2, Q3, Q4, Q5

---

## Related Documents

- [Tech Spec](./tech-spec.md)
- [PRD](../../../features/quoting/prd.md)
- [Architecture](../../../features/quoting/architecture.md)
- [UX Design](../../../features/quoting/ux-design.md)
- [Epics Overview](../../../features/quoting/epics.md)
