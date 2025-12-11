# Epic Technical Specification: Quote Session Management

Date: 2025-12-11
Author: Sam
Epic ID: Q2
Status: Draft

---

## Overview

Epic Q2 delivers the core quote session management capabilities for the Quoting Helper feature. This epic enables insurance agents to create, view, and manage quote sessions for prospects, establishing the foundation for the "enter once, use everywhere" workflow defined in the PRD.

Building on the database schema and navigation established in Epic Q1, this epic implements the session list page, create flow, detail page structure, status management, and session operations (delete/duplicate). These capabilities support FR1-6 (Quote Session Management) and FR15 (Quote Type Selection) from the PRD, providing the container structure that subsequent epics (Q3-Q5) will populate with data entry forms, carrier actions, and comparison generation.

The implementation follows docuMINE's established patterns: Next.js App Router pages, shadcn/ui components, Supabase queries with RLS, and the existing layout/navigation system.

## Objectives and Scope

### In Scope

- **Quote Sessions List Page** (`/quoting`): Display all user's quote sessions with status badges, quote type indicators, carrier counts, and action menus
- **Create Quote Session Flow**: Modal dialog for creating new sessions with prospect name and quote type selection (Home/Auto/Bundle)
- **Quote Session Detail Page** (`/quoting/[id]`): Tab-based structure with Client Info, Property, Auto, Drivers, Carriers, and Results tabs
- **Session Status Management**: Automatic status progression (Draft → In Progress → Quotes Received → Complete) with visual badge indicators
- **Delete/Duplicate Operations**: Action menu with delete confirmation and duplicate functionality
- **API Routes**: CRUD operations for quote sessions

### Out of Scope

- Form field implementations within tabs (Epic Q3)
- Carrier copy functionality (Epic Q4)
- Quote result entry and comparison generation (Epic Q5)
- Auto-save implementation (Epic Q3)
- Address/VIN validation (Epic Q3)

## System Architecture Alignment

### Architecture References

This epic aligns with the Quoting Helper Architecture document (`docs/features/quoting/architecture.md`):

- **Data Storage**: Uses `quote_sessions` table with agency-scoped RLS (ADR-010)
- **Client Data Model**: JSONB column for flexible client data storage
- **API Pattern**: RESTful routes under `/api/quoting/` following docuMINE conventions
- **Component Structure**: Components in `src/components/quoting/` following shadcn/ui patterns

### Key Constraints

- All queries must respect agency-scoped RLS policies established in Q1
- Session data must be associated with authenticated user (`user_id`) and agency (`agency_id`)
- Tab visibility conditional on `quote_type` (hide Property for auto-only, hide Auto/Drivers for home-only)
- Existing navigation and layout components must be extended, not replaced

## Detailed Design

### Services and Modules

| Module | Responsibility | Location |
|--------|----------------|----------|
| **Quote Session Service** | Business logic for CRUD operations, status calculation, duplication | `src/lib/quoting/service.ts` |
| **Quote Sessions List Page** | Display sessions with filters, search, sorting | `src/app/(dashboard)/quoting/page.tsx` |
| **Quote Session Detail Page** | Tab-based session editing interface | `src/app/(dashboard)/quoting/[id]/page.tsx` |
| **QuoteSessionCard** | Individual session card in list view | `src/components/quoting/quote-session-card.tsx` |
| **NewQuoteDialog** | Modal for creating new sessions | `src/components/quoting/new-quote-dialog.tsx` |
| **SessionTabs** | Tab navigation for detail page | `src/components/quoting/session-tabs.tsx` |
| **StatusBadge** | Session status indicator component | `src/components/quoting/status-badge.tsx` |
| **QuoteTypeBadge** | Quote type indicator (Home/Auto/Bundle) | `src/components/quoting/quote-type-badge.tsx` |
| **useQuoteSessions** | Hook for fetching/mutating session list | `src/hooks/quoting/use-quote-sessions.ts` |
| **useQuoteSession** | Hook for single session with mutations | `src/hooks/quoting/use-quote-session.ts` |

### Data Models and Contracts

#### TypeScript Types (`src/types/quoting.ts`)

```typescript
// Quote Session entity
export interface QuoteSession {
  id: string;
  agency_id: string;
  user_id: string;
  prospect_name: string;
  quote_type: QuoteType;
  status: QuoteSessionStatus;
  client_data: QuoteClientData;
  created_at: string;
  updated_at: string;
}

// Quote types
export type QuoteType = 'home' | 'auto' | 'bundle';

// Session status (auto-calculated)
export type QuoteSessionStatus =
  | 'draft'           // Created, no client data
  | 'in_progress'     // Some client data entered
  | 'quotes_received' // At least one quote result
  | 'complete';       // Comparison generated

// Client data structure (JSONB)
export interface QuoteClientData {
  personal?: PersonalInfo;
  property?: PropertyInfo;
  auto?: AutoInfo;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mailingAddress: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// Simplified types for Q2 (full types in Q3)
export interface PropertyInfo {
  address?: Address;
  yearBuilt?: number;
  // ... expanded in Q3
}

export interface AutoInfo {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  // ... expanded in Q3
}

// Create/Update DTOs
export interface CreateQuoteSessionInput {
  prospect_name: string;
  quote_type: QuoteType;
}

export interface UpdateQuoteSessionInput {
  prospect_name?: string;
  quote_type?: QuoteType;
  client_data?: Partial<QuoteClientData>;
}
```

#### Database Schema (Established in Q1)

```sql
-- quote_sessions table (already created in Q1)
-- Key columns for Q2:
-- id: uuid PRIMARY KEY
-- agency_id: uuid NOT NULL REFERENCES agencies(id)
-- user_id: uuid NOT NULL REFERENCES users(id)
-- prospect_name: text NOT NULL
-- quote_type: text NOT NULL DEFAULT 'bundle'
-- status: text NOT NULL DEFAULT 'draft'
-- client_data: jsonb NOT NULL DEFAULT '{}'
-- created_at: timestamptz
-- updated_at: timestamptz
```

### APIs and Interfaces

#### GET `/api/quoting`

List all quote sessions for the authenticated user.

```typescript
// Response
{
  data: QuoteSession[];
  error: null;
}

// Query Parameters (optional)
// ?status=draft,in_progress  - Filter by status
// ?search=johnson            - Search prospect name
// ?sort=updated_at           - Sort field (default: updated_at DESC)
```

#### POST `/api/quoting`

Create a new quote session.

```typescript
// Request
{
  prospect_name: string;  // Required
  quote_type: 'home' | 'auto' | 'bundle';  // Required
}

// Response
{
  data: QuoteSession;
  error: null;
}
```

#### GET `/api/quoting/[id]`

Get a single quote session with full client data.

```typescript
// Response
{
  data: QuoteSession;
  error: null;
}
```

#### PATCH `/api/quoting/[id]`

Update a quote session (name, type, or client data).

```typescript
// Request
{
  prospect_name?: string;
  quote_type?: 'home' | 'auto' | 'bundle';
  client_data?: Partial<QuoteClientData>;
}

// Response
{
  data: QuoteSession;
  error: null;
}
```

#### DELETE `/api/quoting/[id]`

Delete a quote session and associated quote results.

```typescript
// Response
{
  data: { deleted: true };
  error: null;
}
```

#### POST `/api/quoting/[id]/duplicate`

Duplicate a quote session with copied client data.

```typescript
// Response
{
  data: QuoteSession;  // New session with "(Copy)" suffix
  error: null;
}
```

### Workflows and Sequencing

#### Create Quote Session Flow

```
User clicks "New Quote"
    ↓
NewQuoteDialog opens
    ↓
User enters prospect name, selects quote type (default: Bundle)
    ↓
POST /api/quoting { prospect_name, quote_type }
    ↓
Server creates session with status='draft', empty client_data
    ↓
Redirect to /quoting/[id] (detail page)
    ↓
Detail page loads with tabs, Client Info tab active
```

#### Session Status Calculation

```
Status is computed on read, not stored separately:

draft:
  - client_data is empty OR only has minimal data

in_progress:
  - client_data.personal has at least firstName + lastName
  - OR any other substantial data entered

quotes_received:
  - At least one quote_result exists for this session

complete:
  - A comparison document has been generated
```

#### Duplicate Session Flow

```
User clicks "⋮" → "Duplicate"
    ↓
POST /api/quoting/[id]/duplicate
    ↓
Server:
  1. Fetch original session
  2. Create new session with:
     - prospect_name: "[Original] (Copy)"
     - Same quote_type
     - Same client_data
     - status: 'draft'
     - No quote_results copied
    ↓
Return new session
    ↓
Redirect to /quoting/[new_id]
```

#### Delete Session Flow

```
User clicks "⋮" → "Delete"
    ↓
AlertDialog: "Delete this quote session? This cannot be undone."
    ↓
User confirms
    ↓
DELETE /api/quoting/[id]
    ↓
Server deletes session (cascade deletes quote_results)
    ↓
Toast: "Quote session deleted"
    ↓
Remove from list (optimistic update)
```

## Non-Functional Requirements

### Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| List page load | < 500ms | Paginated query with RLS, index on agency_id |
| Session detail load | < 300ms | Single row fetch by id |
| Create session | < 500ms | Insert + return created row |
| Delete session | < 500ms | Cascade delete handled by DB |
| Duplicate session | < 700ms | Fetch + insert operations |
| Tab switch | < 100ms | Client-side navigation (no fetch) |

**Implementation Notes:**
- Use Supabase client with `.select()` to limit returned columns in list view
- Detail page fetches full session including client_data JSONB
- Index on `(agency_id, updated_at DESC)` for sorted list queries
- Consider React Query for client-side caching if re-fetching becomes frequent

### Security

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | All routes require authenticated user via Supabase Auth middleware |
| **Authorization** | RLS policies restrict access to user's agency only (established in Q1) |
| **Data Isolation** | `agency_id` filter applied via RLS on all queries |
| **Input Validation** | Zod schemas validate all API inputs |
| **CSRF Protection** | Next.js built-in CSRF protection via same-site cookies |

**Security Considerations for Q2:**
- `prospect_name` contains PII - stored in agency-scoped table with RLS
- `client_data` JSONB will contain more sensitive data in later epics
- No sensitive data exposed in URL parameters (session IDs only)
- Delete operations require explicit confirmation

### Reliability/Availability

| Requirement | Target |
|-------------|--------|
| **Uptime** | Inherits docuMINE SLA (99.9%) |
| **Error Handling** | Graceful degradation with user-friendly messages |
| **Data Persistence** | Supabase PostgreSQL with automated backups |
| **Session Recovery** | Sessions persist across browser refreshes/reopens |

**Error Handling Strategy:**
- API errors return structured `{ data: null, error: { message, code } }`
- Client displays toast notification for errors
- Failed creates/updates show retry option
- Delete failures preserve session in list

### Observability

| Signal | Implementation |
|--------|----------------|
| **API Logs** | Console logging for all API route executions |
| **Error Tracking** | Log errors with session ID for debugging |
| **Usage Metrics** | Track session create/delete counts (future: analytics) |

**Logging Requirements:**
- Log session creation with `quote_type` and `agency_id`
- Log delete operations for audit trail
- Log duplicate operations with source session ID
- Error logs include stack trace and user context

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Epic Q1 Database Schema | - | `quote_sessions` table with RLS policies |
| Epic Q1 Navigation | - | Sidebar "Quoting" link and `/quoting` route |
| docuMINE Auth | - | Supabase Auth for user authentication |
| docuMINE Layout | - | Dashboard layout wrapper |

### External Dependencies (Existing in package.json)

| Package | Version | Usage in Q2 |
|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.84.0 | Database queries |
| `@supabase/ssr` | ^0.7.0 | Server-side Supabase client |
| `@radix-ui/react-dialog` | ^1.1.15 | NewQuoteDialog modal |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | Delete confirmation |
| `@radix-ui/react-tabs` | ^1.1.13 | Session detail page tabs |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Action menu (⋮) |
| `@radix-ui/react-select` | ^2.2.6 | Quote type selector |
| `react-hook-form` | ^7.68.0 | Create session form |
| `@hookform/resolvers` | ^5.2.2 | Zod validation for forms |
| `zod` | ^4.1.13 | Input validation schemas |
| `sonner` | ^2.0.7 | Toast notifications |
| `lucide-react` | ^0.554.0 | Icons |
| `date-fns` | ^4.1.0 | Date formatting |

### New Dependencies Required

None - all required packages are already in docuMINE's package.json.

### Integration Points

| Integration | Approach |
|-------------|----------|
| **Supabase RLS** | Queries automatically scoped by agency via RLS policies |
| **docuMINE Dashboard Card** | Q1 establishes dashboard card; Q2 links to /quoting |
| **Existing Toast System** | Use existing Sonner toast for notifications |
| **Existing Layout** | Pages use dashboard layout with sidebar |

## Acceptance Criteria (Authoritative)

### Story Q2.1: Quote Sessions List Page

1. **AC-Q2.1-1**: Given the user navigates to `/quoting`, when the page loads, then a list of their quote sessions displays sorted by most recently updated first
2. **AC-Q2.1-2**: Given sessions exist, when viewing the list, then each session card shows prospect name, quote type badge, status indicator, created date, and carrier count
3. **AC-Q2.1-3**: Given sessions exist, when viewing a session card, then a "⋮" action menu is visible with Edit, Duplicate, and Delete options
4. **AC-Q2.1-4**: Given no sessions exist, when viewing the list, then an empty state displays with "No quotes yet" message and "New Quote" CTA
5. **AC-Q2.1-5**: Given the user is on the list page, when they click a session card, then they are navigated to `/quoting/[id]`

### Story Q2.2: Create New Quote Session

6. **AC-Q2.2-1**: Given the user clicks "New Quote" button, when the dialog opens, then they can enter a prospect name and select quote type
7. **AC-Q2.2-2**: Given the create dialog is open, when viewed, then "Bundle" is selected as the default quote type
8. **AC-Q2.2-3**: Given valid input is entered, when the user clicks "Create Quote", then a new session is created and user is redirected to `/quoting/[id]`
9. **AC-Q2.2-4**: Given the prospect name is empty, when attempting to create, then validation error displays and creation is prevented
10. **AC-Q2.2-5**: Given the user clicks "Cancel" in the dialog, when confirmed, then the dialog closes without creating a session

### Story Q2.3: Quote Session Detail Page Structure

11. **AC-Q2.3-1**: Given the user navigates to `/quoting/[id]`, when the page loads, then the page header shows prospect name, quote type badge, and session status
12. **AC-Q2.3-2**: Given the detail page loads, when viewing the tab navigation, then tabs for Client Info, Property, Auto, Drivers, Carriers, and Results are visible
13. **AC-Q2.3-3**: Given the quote type is "auto", when viewing tabs, then the Property tab is hidden
14. **AC-Q2.3-4**: Given the quote type is "home", when viewing tabs, then the Auto and Drivers tabs are hidden
15. **AC-Q2.3-5**: Given the detail page loads, when no tab is active, then the Client Info tab is selected by default
16. **AC-Q2.3-6**: Given tabs exist, when tabs have data, then completion indicators show (✓ for complete sections, counts like "2 vehicles")

### Story Q2.4: Quote Session Status Management

17. **AC-Q2.4-1**: Given a newly created session with no client data, when viewing the status, then it displays as "Draft" with gray badge
18. **AC-Q2.4-2**: Given a session with client name entered, when viewing the status, then it displays as "In Progress" with amber badge
19. **AC-Q2.4-3**: Given a session with at least one quote result, when viewing the status, then it displays as "Quotes Received" with blue badge
20. **AC-Q2.4-4**: Given a session with a generated comparison, when viewing the status, then it displays as "Complete" with green badge

### Story Q2.5: Delete and Duplicate Quote Sessions

21. **AC-Q2.5-1**: Given the user clicks "Delete" from the action menu, when the confirmation appears, then a dialog asks "Delete this quote session? This cannot be undone."
22. **AC-Q2.5-2**: Given the user confirms deletion, when processed, then the session and all associated quote results are deleted
23. **AC-Q2.5-3**: Given deletion succeeds, when complete, then a toast confirms "Quote session deleted" and the session is removed from the list
24. **AC-Q2.5-4**: Given the user clicks "Duplicate" from the action menu, when processed, then a new session is created with "(Copy)" suffix, same quote type, and same client data
25. **AC-Q2.5-5**: Given duplication succeeds, when complete, then the user is navigated to the new session's detail page

## Traceability Mapping

| AC ID | FR | Spec Section | Component(s) | Test Idea |
|-------|-----|--------------|--------------|-----------|
| AC-Q2.1-1 | FR3 | APIs/GET list | QuoteSessionsList, useQuoteSessions | Verify sessions sorted by updated_at DESC |
| AC-Q2.1-2 | FR3 | Data Models | QuoteSessionCard | Render card with all required fields |
| AC-Q2.1-3 | FR4, FR5 | Workflows/Delete, Duplicate | DropdownMenu | Action menu opens, shows correct options |
| AC-Q2.1-4 | FR3 | Workflows | EmptyState | Empty state renders when sessions array empty |
| AC-Q2.1-5 | FR2 | Workflows | QuoteSessionCard | Click navigates to correct route |
| AC-Q2.2-1 | FR1 | Workflows/Create | NewQuoteDialog | Dialog opens with form fields |
| AC-Q2.2-2 | FR15 | Data Models | NewQuoteDialog | Bundle selected by default |
| AC-Q2.2-3 | FR1 | APIs/POST create | NewQuoteDialog, API route | Create and redirect on success |
| AC-Q2.2-4 | FR1 | APIs/POST create | NewQuoteDialog validation | Form validation blocks empty name |
| AC-Q2.2-5 | FR1 | Workflows | NewQuoteDialog | Cancel closes without side effects |
| AC-Q2.3-1 | FR2 | Workflows | SessionDetailPage | Header renders session info |
| AC-Q2.3-2 | FR2 | Workflows | SessionTabs | All tabs visible for bundle |
| AC-Q2.3-3 | FR15 | Workflows | SessionTabs | Property tab hidden for auto-only |
| AC-Q2.3-4 | FR15 | Workflows | SessionTabs | Auto/Drivers hidden for home-only |
| AC-Q2.3-5 | FR2 | Workflows | SessionTabs | Client Info tab default active |
| AC-Q2.3-6 | FR2 | Workflows | SessionTabs | Tab indicators show completion |
| AC-Q2.4-1 | FR3 | Workflows/Status | StatusBadge | Draft status for empty session |
| AC-Q2.4-2 | FR3 | Workflows/Status | StatusBadge | In Progress status for data entered |
| AC-Q2.4-3 | FR3 | Workflows/Status | StatusBadge | Quotes Received status |
| AC-Q2.4-4 | FR3 | Workflows/Status | StatusBadge | Complete status |
| AC-Q2.5-1 | FR4 | Workflows/Delete | AlertDialog | Delete confirmation dialog |
| AC-Q2.5-2 | FR4 | APIs/DELETE | API route | Cascade delete works |
| AC-Q2.5-3 | FR4 | Workflows/Delete | Toast, useQuoteSessions | Toast and list update |
| AC-Q2.5-4 | FR5 | APIs/Duplicate | API route | Duplicate creates copy with "(Copy)" |
| AC-Q2.5-5 | FR5 | Workflows/Duplicate | Navigation | Redirect to new session |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1: Q1 Schema Changes** | Low | Medium | Q1 completed; schema locked. If changes needed, apply migration before Q2 development |
| **R2: Tab Content Coupling** | Medium | Low | Tab content components are placeholder stubs in Q2; actual forms implemented in Q3 |
| **R3: Status Calculation Complexity** | Low | Low | Status computed from simple rules; can refine in Q3-Q5 as more states emerge |
| **R4: RLS Performance** | Low | Medium | RLS policy already tested in Q1; monitor query performance in list page |

### Assumptions

| Assumption | Validation |
|------------|------------|
| **A1:** Epic Q1 database schema and RLS policies are complete and working | Verify Q1 done status before starting Q2 |
| **A2:** User has agency_id from authentication context | Existing docuMINE auth provides this |
| **A3:** Cascade delete on quote_results is configured in Q1 | Verify foreign key with ON DELETE CASCADE |
| **A4:** Tab content components will be placeholder/empty until Q3 | Confirmed in scope - Q2 builds structure only |
| **A5:** No real-time updates needed for session list | List refreshes on page load/navigation |

### Open Questions

| Question | Owner | Resolution Target |
|----------|-------|-------------------|
| **Q1:** Should duplicate operation also copy attached documents (if any)? | Sam | Resolved: No, documents stay with original session |
| **Q2:** Max session limit per agency? | Sam | Deferred: No limit for MVP; revisit if storage becomes concern |
| **Q3:** Search scope - prospect name only or include client data? | Dev | Implement: prospect_name only for Q2; expand search in future |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools |
|-------|-------|-------|
| **Unit Tests** | Service functions, status calculation, type guards | Vitest |
| **Component Tests** | Card, Dialog, Badge, Tabs components | Vitest + React Testing Library |
| **Integration Tests** | API routes with mock Supabase | Vitest |
| **E2E Tests** | Critical user journeys (create, view, delete) | Playwright |

### Coverage Requirements

- **Unit Tests**: 80% coverage for `src/lib/quoting/service.ts`
- **Component Tests**: All interactive components (Card, Dialog, Menu, Tabs)
- **API Tests**: All route handlers with success and error paths
- **E2E Tests**: Happy paths for all 5 stories

### Test Cases by Story

**Q2.1 - List Page:**
- Render empty state when no sessions
- Render session cards with correct data
- Sort by updated_at DESC
- Action menu opens and shows correct options

**Q2.2 - Create Session:**
- Dialog opens on button click
- Form validates required fields
- Successful create redirects to detail page
- Cancel closes without creating

**Q2.3 - Detail Page:**
- Loads session data in header
- Correct tabs visible based on quote_type
- Tab completion indicators work
- Default tab is Client Info

**Q2.4 - Status:**
- Status badge colors match status
- Status updates on data changes (integration)

**Q2.5 - Delete/Duplicate:**
- Delete confirmation dialog appears
- Delete removes session and refreshes list
- Duplicate creates new session with "(Copy)" suffix
- Duplicate redirects to new session

### E2E Test Scenarios

```typescript
// __tests__/e2e/quoting-sessions.spec.ts

test('create new quote session', async ({ page }) => {
  // Navigate to /quoting
  // Click "New Quote"
  // Enter prospect name "Test Family"
  // Select "Bundle" type
  // Click "Create Quote"
  // Verify redirect to /quoting/[id]
  // Verify header shows "Test Family" and "Bundle"
});

test('delete quote session', async ({ page }) => {
  // Create session via API
  // Navigate to /quoting
  // Click action menu on session
  // Click "Delete"
  // Confirm in dialog
  // Verify session removed from list
});

test('duplicate quote session', async ({ page }) => {
  // Create session via API with client data
  // Navigate to /quoting
  // Click action menu on session
  // Click "Duplicate"
  // Verify redirect to new session
  // Verify name has "(Copy)" suffix
  // Verify client data is preserved
});
```

### Test Data Requirements

- Mock Supabase client for unit/integration tests
- Seed data factory for creating test sessions
- Clean up test data after E2E runs

---

_Generated by BMad Method - Epic Tech Context Workflow v6_
_Date: 2025-12-11_
_For: Sam_
