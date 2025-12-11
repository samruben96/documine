# Epic Technical Specification: Foundation & Navigation

Date: 2025-12-11
Author: Sam
Epic ID: Q1
Status: Draft

---

## Overview

Epic Q1 establishes the foundational infrastructure for the Quoting Helper feature within docuMINE. This epic creates the database schema for quote sessions and results, integrates quoting navigation into the existing sidebar, and adds a quick access card to the dashboard. This foundation enables all subsequent Quoting Helper epics (Q2-Q5) by providing secure, agency-scoped data storage and seamless navigation within the existing docuMINE application.

The Quoting Helper is a clipboard-based tool that enables insurance agents to enter client data once and copy carrier-formatted output to paste into any carrier portal, following the "enter once, use everywhere" philosophy. This epic specifically focuses on the infrastructure layer without implementing the quoting UI itself.

## Objectives and Scope

### In Scope

- **Database Schema**: Create `quote_sessions` and `quote_results` tables with JSONB client data storage
- **Row Level Security**: Implement agency-scoped RLS policies following existing docuMINE patterns
- **Database Indexes**: Create indexes for agency_id, user_id, and session_id for query optimization
- **TypeScript Types**: Generate TypeScript types for new tables via `npm run generate-types`
- **Sidebar Navigation**: Add "Quoting" menu item to existing sidebar component
- **Dashboard Card**: Add Quoting quick access card showing active session count
- **Route Structure**: Create `/quoting` route placeholder for navigation testing

### Out of Scope

- Quote session list page UI (Epic Q2)
- Client data capture forms (Epic Q3)
- Carrier format generation (Epic Q4)
- Quote result entry and comparison (Epic Q5)
- Mobile-specific optimizations
- Search/filter functionality for sessions

## System Architecture Alignment

This epic aligns with docuMINE's existing architecture:

- **Authentication**: Leverages existing Supabase Auth integration
- **Multi-Tenancy**: Uses same RLS pattern as documents, conversations, chat_messages tables
- **Data Model**: Follows JSONB pattern for flexible schema (similar to document metadata)
- **Navigation**: Extends existing sidebar.tsx component following established patterns
- **API Routes**: Will follow existing Next.js App Router patterns in `/app/api/`
- **Component Library**: Uses existing shadcn/ui components (Card, Button, Badge)

**Architecture Reference**: `docs/architecture/data-architecture.md` for RLS patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Location |
|----------------|----------------|----------|
| **Database Migration** | Create quote_sessions and quote_results tables | `supabase/migrations/` |
| **RLS Policies** | Agency-scoped data access control | Part of migration |
| **Sidebar Component** | Navigation UI with Quoting entry | `src/components/layout/sidebar.tsx` |
| **Dashboard Card** | Quick access component | `src/components/dashboard/quoting-card.tsx` |
| **Types** | TypeScript interfaces for quoting data | `src/types/database.types.ts` (generated) |
| **API Route (placeholder)** | GET /api/quoting for session count | `src/app/api/quoting/route.ts` |

### Data Models and Contracts

#### quote_sessions Table

```sql
create table quote_sessions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  user_id uuid not null references users(id),

  -- Basic info
  prospect_name text not null,
  quote_type text not null default 'bundle', -- 'home' | 'auto' | 'bundle'
  status text not null default 'draft', -- 'draft' | 'in_progress' | 'quotes_received' | 'complete'

  -- Client data stored as structured JSONB
  client_data jsonb not null default '{}',

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### quote_results Table

```sql
create table quote_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quote_sessions(id) on delete cascade,
  agency_id uuid not null references agencies(id),

  -- Carrier info
  carrier_code text not null, -- 'progressive' | 'travelers' | etc.
  carrier_name text not null,

  -- Quote details
  premium_annual decimal(10, 2),
  premium_monthly decimal(10, 2),
  deductible_home decimal(10, 2),
  deductible_auto decimal(10, 2),

  -- Coverage details as JSONB (flexible per carrier)
  coverages jsonb not null default '{}',

  -- Status
  status text not null default 'quoted', -- 'quoted' | 'declined' | 'not_competitive'

  -- Attached document (optional)
  document_storage_path text,

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### TypeScript Interfaces (Expected Generated Types)

```typescript
// Generated in src/types/database.types.ts
export interface QuoteSession {
  id: string;
  agency_id: string;
  user_id: string;
  prospect_name: string;
  quote_type: 'home' | 'auto' | 'bundle';
  status: 'draft' | 'in_progress' | 'quotes_received' | 'complete';
  client_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QuoteResult {
  id: string;
  session_id: string;
  agency_id: string;
  carrier_code: string;
  carrier_name: string;
  premium_annual: number | null;
  premium_monthly: number | null;
  deductible_home: number | null;
  deductible_auto: number | null;
  coverages: Record<string, unknown>;
  status: 'quoted' | 'declined' | 'not_competitive';
  document_storage_path: string | null;
  created_at: string;
  updated_at: string;
}
```

### APIs and Interfaces

#### GET /api/quoting (Session Count - for Dashboard)

**Purpose**: Return count of active quote sessions for dashboard card

```typescript
// Response
{
  data: {
    activeCount: number; // Sessions with status 'draft' or 'in_progress'
    totalCount: number;  // All sessions
  };
  error: null;
}
```

### Workflows and Sequencing

#### Story Q1.1: Database Schema & RLS Setup

```
1. Create Supabase migration file with timestamp
2. Define quote_sessions table with all columns
3. Define quote_results table with all columns
4. Add RLS policies for both tables (agency-scoped)
5. Create indexes for query optimization
6. Apply migration: npx supabase db push
7. Regenerate TypeScript types: npm run generate-types
8. Verify types in src/types/database.types.ts
```

#### Story Q1.2: Sidebar Navigation Integration

```
1. Open src/components/layout/sidebar.tsx
2. Add Quoting nav item to navigation array
3. Use ClipboardList icon from lucide-react
4. Set href to /quoting
5. Implement active state detection for /quoting/* routes
6. Verify styling matches existing nav items
```

#### Story Q1.3: Dashboard Quick Access Card

```
1. Create src/components/dashboard/quoting-card.tsx
2. Create API endpoint for session count
3. Fetch active session count via API or direct Supabase query
4. Display card with title, subtitle, count, and action buttons
5. "New Quote" button - navigates to /quoting?new=true (future)
6. "View All" button - navigates to /quoting
7. Add card to dashboard page layout
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Migration execution** | < 30 seconds | Standard DDL operations |
| **Dashboard count query** | < 200ms | Index on agency_id + status |
| **Sidebar render** | No impact | Static navigation array |
| **Type generation** | < 10 seconds | Standard Supabase CLI |

### Security

| Requirement | Implementation |
|-------------|----------------|
| **Data isolation** | RLS policies enforce agency_id = user's agency |
| **Authentication required** | Middleware enforces auth on /quoting routes |
| **Foreign key constraints** | CASCADE delete from sessions to results |
| **Input validation** | TypeScript types + runtime validation in Epic Q2+ |
| **No credential storage** | Phase 3 does not store carrier credentials |

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| **Migration rollback** | Supabase migration can be reverted |
| **RLS enforcement** | Database-level, cannot be bypassed |
| **Graceful degradation** | Dashboard card shows 0 if query fails |

### Observability

| Signal | Implementation |
|--------|----------------|
| **Migration status** | Supabase dashboard shows migration history |
| **RLS errors** | Logged in Supabase logs when policy denies access |
| **API errors** | Next.js server logs for /api/quoting errors |

## Dependencies and Integrations

### Existing Dependencies (No Changes)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@supabase/supabase-js` | ^2.84.0 | Database client |
| `@supabase/ssr` | ^0.7.0 | SSR Supabase client |
| `lucide-react` | ^0.554.0 | Icons (ClipboardList) |
| `next` | ^16.0.7 | App Router |

### Internal Dependencies

| Component | Location | Integration |
|-----------|----------|-------------|
| Supabase client | `src/lib/supabase/client.ts` | Database queries |
| Auth middleware | `src/middleware.ts` | Route protection |
| Sidebar component | `src/components/layout/sidebar.tsx` | Navigation update |
| Dashboard layout | `src/app/(dashboard)/dashboard/page.tsx` | Card placement |
| shadcn/ui Card | `src/components/ui/card.tsx` | Dashboard card UI |

### External Dependencies

- **Supabase Project**: nxuzurxiaismssiiydst (existing)
- **No new external services** for this epic

## Acceptance Criteria (Authoritative)

### AC1: Database Tables Created
- [ ] `quote_sessions` table exists with all specified columns
- [ ] `quote_results` table exists with all specified columns
- [ ] Foreign key from quote_results.session_id to quote_sessions.id with CASCADE delete
- [ ] Foreign keys from both tables to agencies(id) and users(id)

### AC2: RLS Policies Active
- [ ] RLS enabled on both tables
- [ ] Users can only SELECT sessions where agency_id matches their agency
- [ ] Users can only INSERT sessions with their agency_id
- [ ] Users can only UPDATE sessions where agency_id matches their agency
- [ ] Users can only DELETE sessions where agency_id matches their agency
- [ ] Same policies apply to quote_results

### AC3: Indexes Created
- [ ] Index on quote_sessions(agency_id)
- [ ] Index on quote_sessions(user_id)
- [ ] Index on quote_sessions(status)
- [ ] Index on quote_results(session_id)
- [ ] Index on quote_results(agency_id)

### AC4: TypeScript Types Generated
- [ ] `npm run generate-types` completes successfully
- [ ] QuoteSession type available in database.types.ts
- [ ] QuoteResult type available in database.types.ts

### AC5: Sidebar Navigation
- [ ] "Quoting" menu item visible in sidebar when logged in
- [ ] Uses ClipboardList (or similar) Lucide icon
- [ ] Clicking navigates to /quoting
- [ ] Active state highlighted on /quoting/* routes
- [ ] Consistent styling with other nav items

### AC6: Dashboard Quick Access Card
- [ ] Quoting card visible on dashboard page
- [ ] Shows count of active sessions (draft + in_progress)
- [ ] "New Quote" button present (links to /quoting or opens modal)
- [ ] "View All" button navigates to /quoting
- [ ] Card styling matches existing dashboard cards

## Traceability Mapping

| AC | Spec Section | Component | Test Idea |
|----|--------------|-----------|-----------|
| AC1 | Data Models | `supabase/migrations/` | Migration applies without error; tables queryable |
| AC2 | Data Models (RLS) | Migration | RLS test: user A cannot see user B's agency data |
| AC3 | Data Models (Indexes) | Migration | Query plan shows index usage |
| AC4 | Data Models | Generated types | TypeScript compilation succeeds; types match schema |
| AC5 | Workflows Q1.2 | sidebar.tsx | Visual test: nav item present, active state works |
| AC6 | Workflows Q1.3 | quoting-card.tsx | Component test: renders count, buttons navigate correctly |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Migration conflicts** with existing schema | Low | Medium | Test on local Supabase first; review foreign keys |
| **RLS policy blocks legitimate access** | Medium | High | Test with multiple agency accounts; verify policy logic |
| **Dashboard card causes layout shift** | Low | Low | Follow existing card grid patterns |

### Assumptions

- **A1**: agencies table and users table already exist with expected structure
- **A2**: Supabase project nxuzurxiaismssiiydst is accessible and has sufficient quota
- **A3**: Existing dashboard page uses a card grid that can accommodate new card
- **A4**: Sidebar navigation is defined in a single array that can be extended

### Open Questions

- **Q1**: Should the dashboard card show total sessions or only active sessions? → **Resolved: Active (draft + in_progress)**
- **Q2**: What icon best represents "Quoting"? → **Suggested: ClipboardList, alternatives: Calculator, FileText**
- **Q3**: Should navigation item appear for all users or only admins? → **Assumed: All authenticated users**

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework |
|-------|-------|-----------|
| **Migration Test** | Tables created, RLS works | Manual Supabase test suite |
| **Unit Tests** | Generated types compile | TypeScript compiler |
| **Component Tests** | Sidebar, Dashboard Card | Vitest + Testing Library |
| **Integration Test** | API route returns correct count | Vitest with mock Supabase |

### Coverage of ACs

| AC | Test Type | Priority |
|----|-----------|----------|
| AC1-3 | Migration verification | High |
| AC4 | Type compilation | High |
| AC5 | Component test + visual review | Medium |
| AC6 | Component test + integration test | Medium |

### Edge Cases

- Empty state: 0 quote sessions (dashboard should show "0" or "No quotes yet")
- RLS boundary: User in Agency A queries; should not see Agency B data
- New user: User with no sessions sees proper empty state
