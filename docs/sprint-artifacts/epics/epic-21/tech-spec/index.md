# docuMINE - Technical Specification

**Author:** Sam
**Date:** 2025-12-09
**Epic:** 21 - Agency-Wide Admin Platform
**Change Type:** Refactor + Extension
**Development Context:** Brownfield (consolidating Epic 20 AI Buddy admin to agency-wide)

---

## Context

### Available Documents

- Epic 20 implementation (complete) - AI Buddy admin features
- Party Mode discussion (2025-12-09) - Team consensus on consolidation
- Existing codebase analysis

### Project Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | Framework |
| React | 19.2.0 | UI Library |
| TypeScript | 5.x | Language |
| Supabase | 2.84.0 | Database, Auth, RLS |
| Vitest | 4.0.14 | Unit Testing |
| Playwright | 1.57.0 | E2E Testing |
| shadcn/ui | Latest | Component Library |

### Existing Codebase Structure

**Current AI Buddy Admin Infrastructure (Epic 20):**

```
src/components/ai-buddy/admin/
├── user-management-panel.tsx      # User CRUD, roles, invitations
├── analytics/
│   └── usage-analytics-panel.tsx  # Usage stats, trends, exports
├── audit-log/
│   └── audit-log-panel.tsx        # Action history, filters, export
├── owner/
│   └── owner-settings-panel.tsx   # Subscription, ownership transfer
├── guardrail-admin-panel.tsx      # AI Buddy specific (stays here)
└── [other AI Buddy specific...]

src/app/api/ai-buddy/admin/
├── users/route.ts                 # User management
├── analytics/route.ts             # Usage analytics
├── audit-logs/route.ts            # Audit log queries
├── subscription/route.ts          # Owner subscription info
├── transfer-ownership/route.ts    # Ownership transfer
└── [guardrails, onboarding...]    # AI Buddy specific

src/hooks/ai-buddy/
├── use-user-management.ts         # Admin user operations
├── use-usage-analytics.ts         # Analytics data fetching
├── use-audit-logs.ts              # Audit log operations
├── use-owner-settings.ts          # Owner/subscription
└── [AI Buddy specific hooks...]
```

**Database Tables (Current):**

| Table | Current Name | Scope | Action |
|-------|--------------|-------|--------|
| Permissions | `ai_buddy_permissions` | Agency-wide | Rename → `agency_permissions` |
| Audit Logs | `ai_buddy_audit_logs` | Agency-wide | Rename → `agency_audit_logs` |
| Invitations | `ai_buddy_invitations` | Agency-wide | Merge with `invitations` |
| Guardrails | `ai_buddy_guardrails` | AI Buddy only | Keep as-is |
| Projects | `ai_buddy_projects` | AI Buddy only | Keep as-is |
| Conversations | `ai_buddy_conversations` | AI Buddy only | Keep as-is |

---

## The Change

### Problem Statement

The admin functionality built in Epic 20 (user management, usage analytics, audit logs, owner/subscription management) was scoped under "AI Buddy" due to epic sequencing, but these are **agency-level platform concerns** that should apply to ALL docuMINE features (comparison, document chat, one-pagers, etc.).

**Current Issues:**
1. Tables prefixed with `ai_buddy_` for agency-wide functionality
2. Components/routes scoped under `ai-buddy/admin/` path
3. Future features would need separate admin panels
4. Inconsistent UX - users would manage admins in multiple places

### Proposed Solution

Consolidate admin infrastructure to be **agency-wide**:

1. **Rename database tables** - Remove `ai_buddy_` prefix for agency-level tables
2. **Move API routes** - `/api/ai-buddy/admin/*` → `/api/admin/*` for agency-wide routes
3. **Relocate components** - `components/ai-buddy/admin/` → `components/admin/` for shared components
4. **Update Settings UI** - Promote Admin tab to top-level (not nested under AI Buddy)
5. **Extend audit logging** - Add action types for all features (comparison, upload, etc.)
6. **Extend usage tracking** - Track usage across all features

### Scope

**In Scope:**

1. Database migration: Rename `ai_buddy_permissions` → `agency_permissions`
2. Database migration: Rename `ai_buddy_audit_logs` → `agency_audit_logs`
3. Merge `ai_buddy_invitations` into existing `invitations` table
4. Move agency-wide API routes to `/api/admin/`
5. Move agency-wide components to `src/components/admin/`
6. Update Settings page: Admin as top-level tab
7. Extend audit action types for all features
8. Extend usage tracking for all features
9. Update all imports and references
10. Update all tests

**Out of Scope:**

1. AI Buddy specific tables (projects, conversations, messages, guardrails) - Stay as `ai_buddy_*`
2. AI Buddy specific components (guardrails, disclosure, onboarding) - Stay under `ai-buddy/`
3. New admin features - This epic is consolidation only
4. Role/permission system changes - Keep existing permission model

---

## Implementation Details

### Source Tree Changes

#### Database Migrations

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20251210000000_agency_admin_consolidation.sql` | CREATE | Rename tables, update FKs, migrate data |

#### API Routes

| Current Path | New Path | Action |
|--------------|----------|--------|
| `src/app/api/ai-buddy/admin/users/` | `src/app/api/admin/users/` | MOVE |
| `src/app/api/ai-buddy/admin/analytics/` | `src/app/api/admin/analytics/` | MOVE |
| `src/app/api/ai-buddy/admin/audit-logs/` | `src/app/api/admin/audit-logs/` | MOVE |
| `src/app/api/ai-buddy/admin/subscription/` | `src/app/api/admin/subscription/` | MOVE |
| `src/app/api/ai-buddy/admin/transfer-ownership/` | `src/app/api/admin/transfer-ownership/` | MOVE |
| `src/app/api/ai-buddy/admin/invitations/` | DELETE | Merge with existing invitations |

**AI Buddy specific routes (KEEP in place):**
- `src/app/api/ai-buddy/admin/guardrails/` - AI Buddy specific
- `src/app/api/ai-buddy/admin/onboarding-status/` - AI Buddy specific

#### Components

| Current Path | New Path | Action |
|--------------|----------|--------|
| `src/components/ai-buddy/admin/user-management-panel.tsx` | `src/components/admin/user-management-panel.tsx` | MOVE |
| `src/components/ai-buddy/admin/user-table.tsx` | `src/components/admin/user-table.tsx` | MOVE |
| `src/components/ai-buddy/admin/invite-user-dialog.tsx` | `src/components/admin/invite-user-dialog.tsx` | MOVE |
| `src/components/ai-buddy/admin/role-change-dialog.tsx` | `src/components/admin/role-change-dialog.tsx` | MOVE |
| `src/components/ai-buddy/admin/remove-user-dialog.tsx` | `src/components/admin/remove-user-dialog.tsx` | MOVE |
| `src/components/ai-buddy/admin/analytics/` | `src/components/admin/analytics/` | MOVE (entire folder) |
| `src/components/ai-buddy/admin/audit-log/` | `src/components/admin/audit-log/` | MOVE (entire folder) |
| `src/components/ai-buddy/admin/owner/` | `src/components/admin/owner/` | MOVE (entire folder) |

**AI Buddy specific components (KEEP in place):**
- `src/components/ai-buddy/admin/guardrail-*.tsx` - AI Buddy specific
- `src/components/ai-buddy/admin/onboarding-*.tsx` - AI Buddy specific
- `src/components/ai-buddy/admin/ai-disclosure-editor.tsx` - AI Buddy specific
- `src/components/ai-buddy/admin/restricted-topic-*.tsx` - AI Buddy specific

#### Hooks

| Current Path | New Path | Action |
|--------------|----------|--------|
| `src/hooks/ai-buddy/use-user-management.ts` | `src/hooks/admin/use-user-management.ts` | MOVE |
| `src/hooks/ai-buddy/use-usage-analytics.ts` | `src/hooks/admin/use-usage-analytics.ts` | MOVE |
| `src/hooks/ai-buddy/use-audit-logs.ts` | `src/hooks/admin/use-audit-logs.ts` | MOVE |
| `src/hooks/ai-buddy/use-owner-settings.ts` | `src/hooks/admin/use-owner-settings.ts` | MOVE |

#### Settings Page Updates

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/settings/page.tsx` | MODIFY | Restructure tabs: Account, Admin (new top-level), AI Buddy (preferences only), Branding |
| `src/components/settings/ai-buddy-preferences-tab.tsx` | MODIFY | Remove admin sub-tab, keep only user preferences |
| `src/components/settings/admin-tab.tsx` | CREATE | New top-level admin tab with Users, Usage, Audit, Subscription sub-tabs |

### Technical Approach

#### Migration Strategy

**Phase 1: Database Migration (Story 21.1)**
```sql
-- 1. Rename tables
ALTER TABLE ai_buddy_permissions RENAME TO agency_permissions;
ALTER TABLE ai_buddy_audit_logs RENAME TO agency_audit_logs;

-- 2. Update foreign key constraints
-- (handled automatically with CASCADE)

-- 3. Migrate ai_buddy_invitations to invitations
-- Add any missing columns to invitations table
-- Copy pending invitations
-- Drop ai_buddy_invitations

-- 4. Update RLS policies to reference new table names
```

**Phase 2: API Route Migration (Story 21.2)**
- Create new routes at `/api/admin/*`
- Update table references from `ai_buddy_*` to `agency_*`
- Add backward-compatible redirects (temporary)
- Remove old routes after frontend updated

**Phase 3: Component Migration (Story 21.3)**
- Move files to new locations
- Update all imports
- Update Settings page structure
- Verify no broken references

**Phase 4: Extend Audit Logging (Story 21.4)**
- Add new action types to `agency_audit_logs`:
  - `document_uploaded`, `document_deleted`
  - `comparison_created`, `comparison_exported`
  - `one_pager_generated`, `one_pager_exported`
  - `chat_session_started` (document chat)
- Update audit logger service

**Phase 5: Extend Usage Tracking (Story 21.5)**
- Update usage analytics to track:
  - Document uploads per user
  - Comparisons created
  - One-pagers generated
  - Document chat sessions
  - AI Buddy conversations (existing)

### Existing Patterns to Follow

**File Organization:**
- Components: Feature-based folders under `src/components/`
- API Routes: Next.js App Router conventions
- Hooks: `use-*.ts` naming in feature folders

**Code Style (from existing codebase):**
- TypeScript strict mode
- 'use client' directive for client components
- Zod for validation
- Supabase client patterns from `src/lib/supabase/`

**Testing Patterns:**
- Unit: `__tests__/components/` and `__tests__/hooks/`
- E2E: `__tests__/e2e/`
- Vitest with happy-dom for unit tests
- Playwright for E2E

### Integration Points

1. **Supabase Auth** - Permission checks use `agency_permissions` table
2. **Settings Page** - New Admin tab structure
3. **Audit Logger** - `src/lib/ai-buddy/audit-logger.ts` → `src/lib/admin/audit-logger.ts`
4. **All Features** - Each feature logs to `agency_audit_logs`

---

## Development Context

### Relevant Existing Code

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/ai-buddy/audit-logger.ts` | Full | Audit logging patterns |
| `src/app/(dashboard)/settings/page.tsx` | Full | Current settings structure |
| `src/components/settings/ai-buddy-preferences-tab.tsx` | Full | Current admin sub-tab |
| `supabase/migrations/20251207000000_ai_buddy_foundation.sql` | Full | Current table structure |

### Dependencies

**Framework/Libraries:**
- Next.js 16.0.7
- Supabase 2.84.0
- TypeScript 5.x
- Radix UI components (via shadcn)

**Internal Modules:**
- `@/lib/supabase/` - Database clients
- `@/hooks/admin/` - Admin data fetching (new location)
- `@/components/admin/` - Admin UI (new location)

### Configuration Changes

- No .env changes required
- No new dependencies

### Existing Conventions

- Permission enum: `ai_buddy_permission` → rename to `agency_permission`
- Role system: admin, producer, member (unchanged)
- RLS policies: `agency_id` based filtering (unchanged)

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Framework | Next.js | 16.0.7 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | 2.84.0 |
| UI | React + shadcn/ui | 19.2.0 |
| Testing | Vitest + Playwright | 4.0.14 / 1.57.0 |

---

## Technical Details

### Database Migration Details

```sql
-- Key migration steps
BEGIN;

-- 1. Rename permission enum
ALTER TYPE ai_buddy_permission RENAME TO agency_permission;

-- 2. Rename tables
ALTER TABLE ai_buddy_permissions RENAME TO agency_permissions;
ALTER TABLE ai_buddy_audit_logs RENAME TO agency_audit_logs;

-- 3. Add new audit action types
-- The action column is VARCHAR, so just document new values:
-- Existing: conversation_started, message_sent, guardrail_triggered, etc.
-- New: document_uploaded, comparison_created, one_pager_generated, chat_started

-- 4. Merge invitations (if ai_buddy_invitations has unique data)
INSERT INTO invitations (agency_id, email, role, invited_by, expires_at, created_at)
SELECT agency_id, email, role, invited_by, expires_at, invited_at
FROM ai_buddy_invitations
WHERE accepted_at IS NULL AND cancelled_at IS NULL
ON CONFLICT (agency_id, email) DO NOTHING;

-- 5. Drop redundant table
DROP TABLE ai_buddy_invitations;

-- 6. Update RLS policies
-- (Create new policies referencing agency_permissions)

COMMIT;
```

### Import Path Updates

All files importing from `@/components/ai-buddy/admin/` (agency-wide components) must update to `@/components/admin/`.

All files importing from `@/hooks/ai-buddy/` (agency-wide hooks) must update to `@/hooks/admin/`.

---

## Development Setup

```bash
# Standard setup
npm install
npm run dev

# Run tests
npm run test
npm run test:e2e

# Apply migration (after creating)
npx supabase db push
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b epic-21-agency-admin`
2. Verify dev environment running
3. Review existing admin code structure
4. Plan migration order (DB first, then API, then components)

### Implementation Steps

**Story 21.1: Database Migration**
1. Create migration file
2. Rename tables and enum
3. Merge invitations
4. Update RLS policies
5. Test with local Supabase

**Story 21.2: API Route Migration**
1. Create `src/app/api/admin/` directory
2. Move routes, update table references
3. Update error codes if needed
4. Test all endpoints

**Story 21.3: Component + Settings Migration**
1. Create `src/components/admin/` directory
2. Move agency-wide components
3. Create new `admin-tab.tsx`
4. Update Settings page structure
5. Update all imports

**Story 21.4: Extend Audit Logging**
1. Move audit logger to `src/lib/admin/`
2. Add new action types
3. Integrate with existing features (document upload, comparison, etc.)
4. Update audit log UI to display new actions

**Story 21.5: Extend Usage Tracking**
1. Update usage analytics API to aggregate across features
2. Add feature breakdown to analytics UI
3. Track: uploads, comparisons, one-pagers, chat sessions, AI Buddy

### Testing Strategy

**Unit Tests:**
- All moved components must have passing tests
- Update import paths in test files
- Add tests for new audit action types

**Integration Tests:**
- Permission checks work with renamed table
- Audit logs record actions from all features
- Usage analytics aggregate correctly

**E2E Tests:**
- Update existing admin E2E tests for new paths
- Admin tab accessible from Settings
- All admin sub-tabs functional

### Acceptance Criteria

**Story 21.1:**
- [ ] Tables renamed: `agency_permissions`, `agency_audit_logs`
- [ ] RLS policies updated
- [ ] Invitations merged
- [ ] Migration is reversible

**Story 21.2:**
- [ ] All agency-wide routes at `/api/admin/*`
- [ ] AI Buddy specific routes remain at `/api/ai-buddy/admin/*`
- [ ] All endpoints functional

**Story 21.3:**
- [ ] Settings page has top-level Admin tab
- [ ] Admin tab has: Users, Usage, Audit, Subscription sub-tabs
- [ ] AI Buddy tab only shows preferences
- [ ] All imports updated

**Story 21.4:**
- [ ] New audit action types documented
- [ ] Document operations logged
- [ ] Comparison operations logged
- [ ] One-pager operations logged

**Story 21.5:**
- [ ] Usage dashboard shows feature breakdown
- [ ] All feature usage tracked
- [ ] Export includes all features

---

## Developer Resources

### File Paths Reference

**New Locations (after migration):**
```
src/app/api/admin/
├── users/
│   ├── route.ts
│   └── [userId]/route.ts
├── analytics/
│   ├── route.ts
│   └── export/route.ts
├── audit-logs/
│   ├── route.ts
│   ├── export/route.ts
│   └── [conversationId]/transcript/route.ts
├── subscription/route.ts
└── transfer-ownership/route.ts

src/components/admin/
├── user-management-panel.tsx
├── user-table.tsx
├── invite-user-dialog.tsx
├── role-change-dialog.tsx
├── remove-user-dialog.tsx
├── analytics/
│   ├── usage-analytics-panel.tsx
│   ├── usage-stat-card.tsx
│   ├── usage-trend-chart.tsx
│   ├── date-range-picker.tsx
│   └── user-breakdown-table.tsx
├── audit-log/
│   ├── audit-log-panel.tsx
│   ├── audit-log-table.tsx
│   ├── audit-filters.tsx
│   ├── transcript-modal.tsx
│   └── export-button.tsx
└── owner/
    ├── owner-settings-panel.tsx
    ├── subscription-panel.tsx
    └── transfer-ownership-dialog.tsx

src/hooks/admin/
├── index.ts
├── use-user-management.ts
├── use-usage-analytics.ts
├── use-audit-logs.ts
└── use-owner-settings.ts

src/lib/admin/
├── audit-logger.ts
├── errors.ts
└── types.ts
```

### Testing Locations

- Unit: `__tests__/components/admin/`, `__tests__/hooks/admin/`
- E2E: `__tests__/e2e/admin/`

### Documentation to Update

- `docs/claude-md/project-structure.md` - Update component locations
- `docs/architecture/index.md` - Note admin consolidation
- This tech spec serves as primary documentation

---

## UX/UI Considerations

### Settings Page Restructure

**Current Structure:**
```
Settings
├── Account
├── AI Buddy
│   ├── Preferences (sub-tab)
│   └── Admin (sub-tab) ← Nested, admin-only
└── Branding
```

**New Structure:**
```
Settings
├── Account
├── Admin ← Top-level, admin-only
│   ├── Users
│   ├── Usage Analytics
│   ├── Audit Log
│   └── Subscription
├── AI Buddy ← Preferences only
└── Branding
```

### User Flow Changes

- Admins see "Admin" tab directly in Settings (not buried under AI Buddy)
- Admin tab content is identical to current AI Buddy Admin sub-tab
- Non-admins don't see Admin tab at all

---

## Testing Approach

**Test Framework:** Vitest 4.0.14 (unit), Playwright 1.57.0 (E2E)

**Coverage Requirements:**
- All moved components must maintain existing test coverage
- New integration points require tests

**Test File Updates:**
- `__tests__/components/ai-buddy/admin/*.test.tsx` → `__tests__/components/admin/*.test.tsx`
- `__tests__/hooks/ai-buddy/use-*.test.ts` → `__tests__/hooks/admin/use-*.test.ts`
- `__tests__/e2e/ai-buddy/admin-*.spec.ts` → `__tests__/e2e/admin/*.spec.ts`

---

## Deployment Strategy

### Deployment Steps

1. Deploy database migration first (backward compatible rename)
2. Deploy API routes (new paths)
3. Deploy frontend (new component locations, Settings restructure)
4. Monitor for errors
5. Remove deprecated routes in follow-up PR (if any backward compat added)

### Rollback Plan

1. Database: Migration includes reverse script
2. Code: Revert commit, redeploy previous version
3. No data loss - just renaming

### Monitoring

- Check Supabase logs for permission errors
- Monitor API error rates in Vercel
- Watch for 404s on old route paths
