# Epic Technical Specification: AI Buddy Admin & Audit

Date: 2025-12-09
Author: Sam
Epic ID: 20
Status: Draft

---

## Overview

Epic 20 delivers the administrative control layer for AI Buddy, enabling agency principals to manage users, monitor usage, and maintain complete audit trails for regulatory compliance. This epic is the final piece of the AI Buddy feature set, transforming it from a user-facing AI assistant into an enterprise-ready compliance platform.

The epic implements FR42-56 and FR64 from the PRD, covering user management (invite, remove, role changes), usage analytics with trend visualization, immutable audit logging with 7-year retention, owner-only billing management, and seamless feature navigation. These capabilities directly address the insurance industry's E&O protection requirements and emerging NAIC model bulletin compliance obligations.

## Objectives and Scope

### In Scope

- **User Management Suite:** Admin user list with filtering/sorting, email invitations via Supabase Auth, soft-delete user removal, Producer↔Admin role changes
- **Usage Analytics Dashboard:** Summary cards (conversations, active users, documents), per-user breakdown, date range filtering, line chart trends over 30 days, CSV export
- **Audit Log System:** Append-only database schema with RLS enforcement, filterable log view (user, date, keyword, guardrail events), full conversation transcript viewer (read-only), PDF and CSV export with compliance headers
- **Owner Controls:** Billing/subscription management (Stripe integration), ownership transfer to another admin with security verification
- **Feature Navigation:** Seamless state-preserving navigation between AI Buddy and Document Comparison

### Out of Scope

- Per-producer permission levels beyond Admin/Producer roles (Growth feature)
- Scheduled audit reports via email (Growth feature)
- Team-visible Projects and conversation sharing (Growth feature)
- SSO/SAML enterprise authentication (Vision feature)
- Custom AI personality/tone per agency (Vision feature)
- API access for custom integrations (Vision feature)

## System Architecture Alignment

This epic extends the existing AI Buddy architecture with admin-specific components:

- **Database:** Leverages existing `ai_buddy_audit_logs` table (append-only RLS), `ai_buddy_permissions` table for role management
- **API Routes:** Adds admin endpoints under `/api/ai-buddy/admin/` for users, audit-logs, and extends billing integration
- **Components:** New admin panel components in `src/components/ai-buddy/admin/`
- **Patterns:** Follows "Verify-Then-Service" RLS pattern for mutations, consistent error codes (AIB_xxx)

**Key Architecture References:**
- Audit logs: Append-only with INSERT-only RLS policy, no UPDATE/DELETE
- Permissions: Flexible permission table supporting Producer/Admin/Owner roles
- Rate limiting: Database-configurable via `ai_buddy_rate_limits` table

## Detailed Design

### Services and Modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| **Admin User Service** | `src/lib/ai-buddy/admin/user-service.ts` | User CRUD, invitations, role management |
| **Analytics Service** | `src/lib/ai-buddy/admin/analytics-service.ts` | Usage aggregation, trend calculations |
| **Audit Log Service** | `src/lib/ai-buddy/audit-logger.ts` | Log queries, export generation |
| **Billing Service** | `src/lib/billing/billing-service.ts` | Stripe integration, subscription management |
| **Admin API Routes** | `src/app/api/ai-buddy/admin/` | REST endpoints for admin operations |

**Component Structure:**
```
src/components/ai-buddy/admin/
├── user-management/
│   ├── user-table.tsx           # Sortable, filterable user list
│   ├── invite-user-dialog.tsx   # Email invitation modal
│   ├── role-dropdown.tsx        # Producer/Admin selector
│   └── remove-user-dialog.tsx   # Confirmation with warnings
├── analytics/
│   ├── usage-stat-card.tsx      # Summary metric cards
│   ├── usage-trend-chart.tsx    # Line chart (recharts)
│   ├── user-breakdown-table.tsx # Per-user metrics
│   └── date-range-picker.tsx    # Filter controls
├── audit-log/
│   ├── audit-log-table.tsx      # Filterable log entries
│   ├── audit-filters.tsx        # User, date, keyword filters
│   ├── transcript-modal.tsx     # Read-only conversation view
│   └── export-button.tsx        # PDF/CSV export trigger
└── owner/
    ├── billing-panel.tsx        # Subscription management
    └── transfer-ownership.tsx   # Ownership transfer flow
```

### Data Models and Contracts

**Existing Tables (from Epic 14-19):**

```sql
-- Already exists: ai_buddy_audit_logs
CREATE TABLE ai_buddy_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  conversation_id uuid REFERENCES ai_buddy_conversations(id),
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- Already exists: ai_buddy_permissions
CREATE TABLE ai_buddy_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);
```

**New/Modified for Epic 20:**

```sql
-- Add indexes for admin queries (Story 20.1)
CREATE INDEX idx_audit_logs_action ON ai_buddy_audit_logs(action);
CREATE INDEX idx_audit_logs_metadata_guardrail ON ai_buddy_audit_logs((metadata->>'guardrailType'))
  WHERE metadata->>'guardrailType' IS NOT NULL;

-- Usage analytics materialized view (Story 20.3)
CREATE MATERIALIZED VIEW ai_buddy_usage_daily AS
SELECT
  agency_id,
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT id) as conversations,
  SUM(message_count) as total_messages
FROM ai_buddy_conversations c
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as message_count
  FROM ai_buddy_messages GROUP BY conversation_id
) m ON c.id = m.conversation_id
GROUP BY agency_id, DATE(created_at);

-- Refresh daily via cron or on-demand
CREATE INDEX idx_usage_daily_agency_date ON ai_buddy_usage_daily(agency_id, date DESC);

-- User invitations tracking
CREATE TABLE ai_buddy_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('producer', 'admin')),
  invited_by uuid NOT NULL REFERENCES users(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE(agency_id, email)
);
```

**TypeScript Interfaces:**

```typescript
// src/types/ai-buddy.ts (additions)

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'producer' | 'admin' | 'owner';
  aiBuddyStatus: 'active' | 'onboarding_pending' | 'inactive';
  lastActiveAt: string | null;
  onboardingCompleted: boolean;
}

interface UsageStats {
  period: string;
  totalConversations: number;
  activeUsers: number;
  documentsUploaded: number;
  messagesSent: number;
}

interface UsageTrend {
  date: string;
  activeUsers: number;
  conversations: number;
  messages: number;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  conversationId: string | null;
  conversationTitle: string | null;
  projectName: string | null;
  action: AuditAction;
  metadata: Record<string, unknown>;
  loggedAt: string;
  guardrailEvents: number;
}

type AuditAction =
  | 'message_sent'
  | 'conversation_created'
  | 'conversation_deleted'
  | 'project_created'
  | 'project_archived'
  | 'guardrail_triggered'
  | 'preferences_updated'
  | 'user_invited'
  | 'user_removed'
  | 'role_changed'
  | 'ownership_transferred';

interface AuditLogFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  hasGuardrailEvents?: boolean;
  actions?: AuditAction[];
}

interface AuditExportOptions {
  format: 'pdf' | 'csv';
  filters: AuditLogFilters;
  includeTranscripts: boolean;
}
```

### APIs and Interfaces

**User Management Endpoints:**

```typescript
// GET /api/ai-buddy/admin/users
// List all agency users with AI Buddy status
Request: {
  search?: string;
  sortBy?: 'name' | 'email' | 'role' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number; // default 20
}
Response: {
  data: { users: AdminUser[], total: number, page: number },
  error: null
}

// POST /api/ai-buddy/admin/users/invite
// Send email invitation
Request: { email: string; role: 'producer' | 'admin' }
Response: { data: { invitationId: string, expiresAt: string }, error: null }
Errors: AIB_009 (email already registered), AIB_010 (invitation pending)

// DELETE /api/ai-buddy/admin/users/[userId]
// Soft-delete user from agency
Request: { userId: string }
Response: { data: { removed: true }, error: null }
Errors: AIB_011 (cannot remove owner), AIB_007 (insufficient permissions)

// PATCH /api/ai-buddy/admin/users/[userId]/role
// Change user role
Request: { role: 'producer' | 'admin' }
Response: { data: { user: AdminUser }, error: null }
Errors: AIB_012 (last admin), AIB_013 (cannot change owner)
```

**Usage Analytics Endpoints:**

```typescript
// GET /api/ai-buddy/admin/analytics
// Get usage summary and per-user breakdown
Request: {
  period: 'week' | 'month' | '30days' | 'custom';
  startDate?: string;
  endDate?: string;
}
Response: {
  data: {
    summary: UsageStats,
    byUser: Array<{ user: AdminUser, stats: UsageStats }>,
    trends: UsageTrend[]
  },
  error: null
}

// GET /api/ai-buddy/admin/analytics/export
// Export usage data as CSV
Request: { period: string; startDate?: string; endDate?: string }
Response: CSV file download
```

**Audit Log Endpoints:**

```typescript
// GET /api/ai-buddy/admin/audit-logs
// Query audit log with filters
Request: AuditLogFilters & { page?: number; limit?: number }
Response: {
  data: { entries: AuditLogEntry[], total: number, page: number },
  error: null
}

// GET /api/ai-buddy/admin/audit-logs/[conversationId]/transcript
// Get full conversation transcript
Request: { conversationId: string }
Response: {
  data: {
    conversation: { id, title, projectName, createdAt },
    messages: Array<{ role, content, sources, confidence, createdAt }>,
    guardrailEvents: Array<{ type, trigger, timestamp }>
  },
  error: null
}

// POST /api/ai-buddy/admin/audit-logs/export
// Generate PDF or CSV export
Request: AuditExportOptions
Response: { data: { downloadUrl: string, expiresAt: string }, error: null }
```

**Owner Endpoints:**

```typescript
// GET /api/ai-buddy/admin/billing
// Get billing/subscription info (owner only)
Response: {
  data: {
    plan: string,
    billingCycle: 'monthly' | 'annual',
    nextPaymentDate: string,
    paymentMethod: { last4: string, brand: string },
    usage: { seats: number, maxSeats: number }
  },
  error: null
}

// POST /api/ai-buddy/admin/transfer-ownership
// Transfer agency ownership (owner only)
Request: { newOwnerId: string; confirmPassword: string }
Response: { data: { transferred: true, newOwner: AdminUser }, error: null }
Errors: AIB_014 (invalid password), AIB_015 (user not admin)
```

### Workflows and Sequencing

**User Invitation Flow:**
```
Admin clicks "Invite User"
    ↓
Enter email + select role
    ↓
POST /api/ai-buddy/admin/users/invite
    ↓
Check: Email not already registered (Supabase Auth)
Check: No pending invitation for email
    ↓
Create invitation record (expires 7 days)
    ↓
Supabase Auth sends magic link email
    ↓
Invitee clicks link → Supabase signup flow
    ↓
On signup complete:
  - Add user to agency
  - Grant role permissions
  - Mark invitation accepted
  - Log: user_invited action
```

**Audit Log Export Flow:**
```
Admin clicks "Export" → selects format (PDF/CSV)
    ↓
POST /api/ai-buddy/admin/audit-logs/export
    ↓
Background job (Edge Function):
  - Query filtered audit logs
  - If PDF: Generate with @react-pdf/renderer
    - Include agency header, export date
    - Compliance statement
    - Conversation transcripts (if requested)
  - If CSV: Stream to file
    - Headers: timestamp, user, action, details
    ↓
Upload to Supabase Storage (signed URL, 1hr expiry)
    ↓
Return download URL to client
    ↓
Admin downloads file
```

**Ownership Transfer Flow:**
```
Owner navigates to Settings → Agency → Transfer Ownership
    ↓
See list of current admins
    ↓
Select admin + enter password to confirm
    ↓
POST /api/ai-buddy/admin/transfer-ownership
    ↓
Verify: Password correct (re-authenticate)
Verify: Target user is admin
    ↓
Atomic transaction:
  - Remove 'owner' permissions from current owner
  - Grant 'owner' permissions to new owner
  - Demote current owner to 'admin'
  - Log: ownership_transferred action
    ↓
Send email notifications to both parties
    ↓
Redirect current user (now admin) to dashboard
```

## Non-Functional Requirements

### Performance

| Operation | Target | Strategy |
|-----------|--------|----------|
| User list query | < 500ms | Index on agency_id, pagination |
| Audit log list | < 2s | Composite index (agency_id, logged_at DESC), pagination |
| Transcript load | < 1s | Index on conversation_id |
| Usage analytics | < 500ms | Materialized view refreshed nightly |
| Trend chart data | < 1s | Pre-aggregated daily stats |
| PDF export | < 30s | Async generation via Edge Function |
| CSV export | < 10s | Streaming response |

**Optimization Strategies:**
- Materialized view `ai_buddy_usage_daily` refreshed via nightly cron job
- Cursor-based pagination for audit logs (not offset)
- React Query caching for user list and analytics (5 min stale time)
- Export files uploaded to Supabase Storage with 1-hour signed URLs

### Security

**Authentication & Authorization:**
- All admin endpoints require `view_audit_logs` or `manage_users` permission
- Owner endpoints (`billing`, `transfer-ownership`) require `owner` role check
- Re-authentication required for ownership transfer (password confirmation)
- Rate limiting: 100 requests/minute per admin user

**Audit Log Immutability (FR54):**
```sql
-- RLS Policy: INSERT only, no UPDATE/DELETE
CREATE POLICY "Append only audit logs" ON ai_buddy_audit_logs
  FOR INSERT WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

-- No SELECT policy for regular users (admin only)
CREATE POLICY "Admins read audit logs" ON ai_buddy_audit_logs
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid() AND permission = 'view_audit_logs'
    )
  );

-- Database trigger to prevent any modifications
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable - modifications not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON ai_buddy_audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

**Data Protection:**
- Audit exports include compliance header with agency name and export timestamp
- PDF exports include digital watermark: "Exported by [user] on [date]"
- No PII exposed in error messages or logs

### Reliability/Availability

- **Target Uptime:** 99.5% for admin panel (aligned with docuMINE SLA)
- **Graceful Degradation:** If analytics service slow, show cached data with "Last updated" timestamp
- **Export Resilience:** Failed exports logged with retry option; partial exports not delivered
- **Audit Log Guarantee:** All audit writes use database transactions; failed writes block the parent operation

**Retention Policy (FR56):**
- Audit logs retained for minimum 7 years (insurance industry standard)
- Implement table partitioning by year for large agencies
- Archive strategy: Logs older than 2 years moved to cold storage (future enhancement)

### Observability

**Logging:**
- All admin actions logged to audit trail (self-documenting)
- Error logs include: user_id, agency_id, action, error_code, timestamp
- Export job progress logged for debugging

**Metrics (Future - via Vercel Analytics):**
- Admin panel page views
- Export generation time distribution
- Error rates by endpoint

**Alerts:**
- Alert if audit log inserts fail (critical - compliance risk)
- Alert if export jobs exceed 60s
- Alert if user invitation emails fail to send

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@supabase/supabase-js` | ^2.x | Database queries, Auth, Storage |
| `recharts` | ^2.x | Usage trend line charts |
| `@react-pdf/renderer` | ^3.x | PDF export generation |
| `date-fns` | ^3.x | Date formatting and grouping |
| `react-query` | ^5.x | Data fetching and caching |

### External Integrations

| Integration | Purpose | Notes |
|-------------|---------|-------|
| **Supabase Auth** | User invitations | Magic link flow for new users |
| **Supabase Storage** | Export file hosting | Signed URLs with 1hr expiry |
| **Stripe** (existing) | Billing management | Owner-only access |
| **Email (via Supabase)** | Invitation and notification emails | Uses existing email templates |

### Existing Code Reuse

- `src/lib/ai-buddy/audit-logger.ts` - Extend for admin queries
- `src/components/ui/data-table.tsx` - Base for user and audit tables
- `src/lib/billing/` - Existing Stripe integration (if present)
- Navigation patterns from existing admin settings pages

## Acceptance Criteria (Authoritative)

### Story 20.1: Audit Log Infrastructure (FR54, FR55, FR56)

| AC ID | Criteria |
|-------|----------|
| 20.1.1 | `ai_buddy_audit_logs` table has INSERT-only RLS policy (no UPDATE/DELETE) |
| 20.1.2 | Database trigger prevents any modification to existing audit log rows |
| 20.1.3 | Audit log entries include: id, agency_id, user_id, conversation_id, action, metadata (JSONB), logged_at |
| 20.1.4 | Index exists on (agency_id, logged_at DESC) for efficient admin queries |
| 20.1.5 | Retention policy documented: 7-year minimum retention |
| 20.1.6 | Migration includes rollback script that preserves data |

### Story 20.2: Admin User Management (FR42, FR43, FR44, FR45)

| AC ID | Criteria |
|-------|----------|
| 20.2.1 | Admin sees paginated list of all agency users with: name, email, role, AI Buddy status, last active |
| 20.2.2 | Admin can sort by any column and search by name or email |
| 20.2.3 | Admin can invite new user via email with role selection (Producer/Admin) |
| 20.2.4 | Invitation expires after 7 days; pending invitations shown in UI |
| 20.2.5 | Admin can remove user (soft delete); confirmation dialog warns about data retention |
| 20.2.6 | Admin can change user role via dropdown; cannot demote last admin |
| 20.2.7 | Cannot remove or demote agency owner; owner role shown as non-editable |
| 20.2.8 | All user management actions logged to audit trail |
| 20.2.9 | Non-admin users receive 403 when accessing user management endpoints |

### Story 20.3: Usage Analytics Dashboard (FR46, FR47)

| AC ID | Criteria |
|-------|----------|
| 20.3.1 | Dashboard shows summary cards: total conversations, active users, documents uploaded, messages sent |
| 20.3.2 | Per-user breakdown table shows metrics for each agency user |
| 20.3.3 | Date range filter: This week, This month, Last 30 days, Custom range |
| 20.3.4 | Line chart shows daily active users and conversations over selected period |
| 20.3.5 | Hover on chart shows exact values for that day |
| 20.3.6 | Export button downloads usage data as CSV |
| 20.3.7 | Dashboard loads in < 500ms using materialized view |
| 20.3.8 | Empty state shown for agencies with no usage data |

### Story 20.4: Audit Log Interface (FR50, FR51, FR52, FR53)

| AC ID | Criteria |
|-------|----------|
| 20.4.1 | Audit log table shows: date/time, user, project, conversation title, message count, guardrail events badge |
| 20.4.2 | Filter by: user (dropdown), date range (pickers), keyword search, has guardrail events (checkbox) |
| 20.4.3 | Results paginated (25 per page) with total count shown |
| 20.4.4 | Clicking entry opens transcript modal with full read-only conversation |
| 20.4.5 | Transcript shows all messages with role, content, timestamps, source citations, confidence badges |
| 20.4.6 | Guardrail events highlighted in transcript with type and trigger info |
| 20.4.7 | Export button offers PDF or CSV format selection |
| 20.4.8 | PDF export includes: agency header, export date, compliance statement, filtered entries, optional transcripts |
| 20.4.9 | CSV export includes columns: timestamp, user_email, user_name, action, conversation_id, metadata |
| 20.4.10 | Audit log content is read-only; no edit or delete options visible |

### Story 20.5: Owner Management (FR48, FR49)

| AC ID | Criteria |
|-------|----------|
| 20.5.1 | Owner sees billing page with: current plan, billing cycle, next payment date |
| 20.5.2 | Payment method displayed (last 4 digits, card brand) |
| 20.5.3 | Usage against plan limits shown (e.g., seats used / max seats) |
| 20.5.4 | Owner can update payment method via Stripe Customer Portal link |
| 20.5.5 | Invoice history displayed with download links |
| 20.5.6 | Non-owner admins see "Contact agency owner for billing" message |
| 20.5.7 | Billing page loads in < 1s |
| 20.5.8 | Owner sees "Transfer Ownership" option in Agency settings |
| 20.5.9 | Only current admins shown as transfer targets |
| 20.5.10 | Transfer requires password re-entry for confirmation |
| 20.5.11 | On successful transfer: new owner gets owner permissions, old owner demoted to admin |
| 20.5.12 | Both parties receive email notification of transfer |
| 20.5.13 | Transfer logged to audit trail with both user IDs |
| 20.5.14 | Error shown if no other admins exist: "Promote a user to admin first" |
| 20.5.15 | Transfer is atomic - partial transfers not possible |

### Story 20.6: Feature Navigation Polish (FR64)

| AC ID | Criteria |
|-------|----------|
| 20.6.1 | Navigation between AI Buddy and Document Comparison preserves state |
| 20.6.2 | Returning to AI Buddy restores last conversation/project context |
| 20.6.3 | Transition between features completes in < 200ms (perceived) |
| 20.6.4 | Admin settings tab for AI Buddy accessible from main Settings page |
| 20.6.5 | Mobile navigation includes AI Buddy admin options for admin users |

## Traceability Mapping

| FR | AC | Spec Section | Component | Test Approach |
|----|-----|--------------|-----------|---------------|
| FR42 | 20.2.1, 20.2.2 | User Management | `user-table.tsx` | Unit + E2E |
| FR43 | 20.2.3, 20.2.4 | User Management | `invite-user-dialog.tsx` | Unit + Integration |
| FR44 | 20.2.5 | User Management | `remove-user-dialog.tsx` | Unit + E2E |
| FR45 | 20.2.6, 20.2.7 | User Management | `role-dropdown.tsx` | Unit + E2E |
| FR46 | 20.3.1, 20.3.2 | Usage Analytics | `usage-stat-card.tsx` | Unit |
| FR47 | 20.3.4, 20.3.5 | Usage Analytics | `usage-trend-chart.tsx` | Unit + Visual |
| FR48 | 20.5.1-20.5.7 | Owner Management | `billing-panel.tsx` | Integration |
| FR49 | 20.5.8-20.5.15 | Owner Management | `transfer-ownership.tsx` | Unit + E2E |
| FR50 | 20.4.1 | Audit Log | `audit-log-table.tsx` | Unit + E2E |
| FR51 | 20.4.2, 20.4.3 | Audit Log | `audit-filters.tsx` | Unit |
| FR52 | 20.4.4-20.4.6 | Audit Log | `transcript-modal.tsx` | Unit + E2E |
| FR53 | 20.4.7-20.4.9 | Audit Log | `export-button.tsx` | Integration |
| FR54 | 20.1.1, 20.1.2 | Audit Infrastructure | Database migration | Integration |
| FR55 | 20.1.3 | Audit Infrastructure | Database schema | Schema test |
| FR56 | 20.1.5 | Audit Infrastructure | Documentation | Manual review |
| FR64 | 20.6.1-20.6.5 | Navigation | Header/Sidebar | E2E |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Audit log table grows very large over 7 years | Performance degradation | Medium | Implement table partitioning by year; add archival strategy |
| **R2:** PDF export times out for large date ranges | Poor UX | Medium | Limit export to 90 days; show progress indicator; async with email delivery |
| **R3:** Stripe integration complexity | Delays | Low | Leverage existing billing integration if present; otherwise scope to read-only MVP |
| **R4:** Ownership transfer edge cases | Data integrity | Low | Extensive testing; atomic transactions; require admin target |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| **A1** | Supabase Auth supports invitation/magic link flow | Verified in docs |
| **A2** | Existing Stripe integration can be extended for AI Buddy billing | Check existing code |
| **A3** | Agencies will have < 100 users initially (pagination sufficient) | Product input |
| **A4** | 7-year retention is feasible in Supabase without archival | Monitor storage costs |
| **A5** | Materialized view refresh (nightly) is acceptable latency for analytics | Product confirmation |

### Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| **Q1** | Should billing show AI Buddy usage separately or combined with docuMINE? | Product | Open |
| **Q2** | Do we need email notification for audit log exports? | Product | Open |
| **Q3** | Should ownership transfer require 2FA if enabled? | Security | Open |
| **Q4** | What's the max export size before we require email delivery? | Engineering | Open |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| **Unit** | Components, hooks, utilities | Vitest + React Testing Library | 80% |
| **Integration** | API routes, database queries | Vitest + Supabase test client | Key paths |
| **E2E** | Critical user journeys | Playwright | Happy paths + edge cases |

### Critical Test Scenarios

**Audit Log Immutability (Story 20.1):**
- Verify INSERT succeeds for valid audit entries
- Verify UPDATE fails with appropriate error
- Verify DELETE fails with appropriate error
- Verify RLS blocks non-admin reads

**User Management (Story 20.2):**
- Invite flow: send → receive → accept → user appears
- Role change: Producer → Admin, Admin → Producer
- Cannot demote last admin (error shown)
- Cannot remove owner (error shown)
- Removed user cannot access AI Buddy

**Audit Log Export (Story 20.4):**
- PDF generation includes all required sections
- CSV has correct headers and data format
- Large export (1000+ entries) completes within timeout
- Export respects current filters

**Ownership Transfer (Story 20.6):**
- Transfer succeeds with correct password
- Transfer fails with wrong password
- Old owner loses owner permissions immediately
- New owner gains owner permissions immediately
- Both receive email notifications

### Test Data Strategy

- Seed test agency with 10 users (mix of roles)
- Seed 100 audit log entries across 30 days
- Seed 5 conversations with guardrail events
- Use Supabase test project for integration tests

---

## Consolidated Story Summary

| # | Story Name | FRs | Points | Priority | Status |
|---|------------|-----|--------|----------|--------|
| 20.1 | Audit Log Infrastructure | FR54, FR55, FR56 | 3 | P0 (Blocker) | ✅ DONE |
| 20.2 | Admin User Management | FR42, FR43, FR44, FR45 | 5 | P1 | ✅ DONE |
| 20.3 | Usage Analytics Dashboard | FR46, FR47 | 5 | P1 | ✅ DONE |
| 20.4 | Audit Log Interface | FR50, FR51, FR52, FR53 | 5 | P1 | Backlog |
| 20.5 | Owner Management | FR48, FR49 | 5 | P2 | Backlog |
| 20.6 | Feature Navigation Polish | FR64 | 2 | P2 | Backlog |

**Total: 25 story points across 6 stories** (consolidated from 13 original stories)

**Recommended Implementation Order:**
1. **20.1** - Audit Infrastructure (foundation for all admin features) ✅ DONE
2. **20.2** - User Management (core admin functionality) ✅ DONE
3. **20.3** - Usage Analytics Dashboard ✅ DONE
4. **20.4** - Audit Log Interface (compliance-critical)
5. **20.5** - Owner Management (billing + transfer)
6. **20.6** - Navigation Polish
