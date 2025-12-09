# Story 19.2: Enforcement Logging

Status: ready-for-dev

## Story

As an agency admin with `view_audit_logs` permission,
I want to see a log of all guardrail enforcement events,
so that I can monitor compliance and understand how producers are interacting with restricted topics.

## Acceptance Criteria

### AC-19.2.1: Audit Log Entry Created
Given a user asks about a restricted topic,
When the AI redirects,
Then a guardrail enforcement event is logged to `ai_buddy_audit_logs`.

### AC-19.2.2: Log Entry Fields
Given a guardrail enforcement is logged,
When I view the log entry,
Then I see: userId, conversationId, triggeredTopic, userMessage (truncated), redirectApplied, timestamp.

### AC-19.2.3: Enforcement Log Section
Given I am an admin with `view_audit_logs` permission,
When I open the Guardrails section,
Then I see an "Enforcement Log" subsection.

### AC-19.2.4: Enforcement Log Table
Given I view the Enforcement Log,
When there are logged events,
Then I see a table with columns: User, Triggered Topic, Message Preview, Date/Time.

### AC-19.2.5: Entry Details View
Given I view the Enforcement Log,
When I click on an entry,
Then I can see the full details including the redirect guidance that was applied.

### AC-19.2.6: Date Range Filter
Given I view the Enforcement Log,
When I filter by date range,
Then I only see events within that range.

### AC-19.2.7: Append-Only Logs
Given guardrail enforcement logging,
When logs are written,
Then they are append-only (cannot be deleted or modified).

## Tasks / Subtasks

- [ ] **Task 1: Verify Existing Infrastructure** (AC: 19.2.1, 19.2.7)
  - [ ] Confirm `logGuardrailEvent()` is being called in chat API when guardrail triggers
  - [ ] Verify `ai_buddy_audit_logs` table has correct RLS (append-only for inserts)
  - [ ] Verify `view_audit_logs` permission exists in `ai_buddy_permissions`
  - [ ] Test that guardrail enforcement creates audit log entry with correct metadata

- [ ] **Task 2: Create Guardrail Logs API Endpoint** (AC: 19.2.2, 19.2.4, 19.2.6)
  - [ ] Create `src/app/api/ai-buddy/admin/guardrails/logs/route.ts`
  - [ ] Implement GET endpoint filtered to `action = 'guardrail_triggered'`
  - [ ] Use `requireAdminAuth('view_audit_logs')` for permission check
  - [ ] Support query params: `startDate`, `endDate`, `limit`, `offset`
  - [ ] Return logs with user email joined from users table
  - [ ] Map metadata fields: triggeredTopic, messagePreview, redirectMessage

- [ ] **Task 3: Create useGuardrailLogs Hook** (AC: 19.2.4, 19.2.6)
  - [ ] Create `src/hooks/ai-buddy/use-guardrail-logs.ts`
  - [ ] Implement hook with interface: `{ logs, isLoading, error, totalCount, refetch }`
  - [ ] Accept params: `startDate`, `endDate`, `limit`, `offset`
  - [ ] Handle pagination with `hasMore`, `loadMore`
  - [ ] Add to barrel export in `src/hooks/ai-buddy/index.ts`

- [ ] **Task 4: Create GuardrailEnforcementLog Component** (AC: 19.2.3, 19.2.4)
  - [ ] Create `src/components/ai-buddy/admin/guardrail-enforcement-log.tsx`
  - [ ] Render as table with columns: User, Triggered Topic, Message Preview, Date/Time
  - [ ] Display user email (truncate if long)
  - [ ] Show empty state when no logs exist
  - [ ] Show loading skeleton during fetch
  - [ ] Add data-testid attributes for testing

- [ ] **Task 5: Create Log Entry Detail Dialog** (AC: 19.2.5)
  - [ ] Create `src/components/ai-buddy/admin/guardrail-log-detail.tsx`
  - [ ] Use Dialog component for modal display
  - [ ] Show full details: User email, triggered topic, message preview (full text if available), redirect guidance applied, timestamp, conversation ID
  - [ ] Add "View Conversation" link if conversation still exists

- [ ] **Task 6: Create Date Range Filter Component** (AC: 19.2.6)
  - [ ] Create `src/components/ai-buddy/admin/date-range-filter.tsx`
  - [ ] Use DatePicker from shadcn/ui (install if not present)
  - [ ] Support start date and end date selection
  - [ ] Add quick presets: Today, Last 7 days, Last 30 days, This month
  - [ ] Emit onChange with date range

- [ ] **Task 7: Integrate into GuardrailAdminPanel** (AC: 19.2.3)
  - [ ] Update `src/components/ai-buddy/admin/guardrail-admin-panel.tsx`
  - [ ] Add "Enforcement Log" section below existing sections
  - [ ] Conditionally render based on `view_audit_logs` permission
  - [ ] Pass date range filter state to GuardrailEnforcementLog

- [ ] **Task 8: Update TypeScript Types** (AC: 19.2.2)
  - [ ] Add `GuardrailEnforcementEvent` interface to `src/types/ai-buddy.ts`
  - [ ] Define fields: id, agencyId, userId, userEmail, conversationId, triggeredTopic, messagePreview, redirectApplied, loggedAt
  - [ ] Export type from module

- [ ] **Task 9: Unit Tests - API Route** (AC: 19.2.2, 19.2.6, 19.2.7)
  - [ ] Test GET returns guardrail logs for admin with view_audit_logs permission
  - [ ] Test 403 response for user without view_audit_logs permission
  - [ ] Test 401 response for unauthenticated user
  - [ ] Test date range filtering works correctly
  - [ ] Test pagination params (limit, offset)
  - [ ] Test logs contain expected metadata fields

- [ ] **Task 10: Unit Tests - Hook** (AC: 19.2.4, 19.2.6)
  - [ ] Test successful data fetching
  - [ ] Test error handling
  - [ ] Test date range filtering updates
  - [ ] Test pagination/loadMore functionality
  - [ ] Test loading state
  - [ ] Test refetch function

- [ ] **Task 11: Unit Tests - Components** (AC: 19.2.3, 19.2.4, 19.2.5)
  - [ ] Test GuardrailEnforcementLog renders table with correct columns
  - [ ] Test GuardrailEnforcementLog shows empty state
  - [ ] Test GuardrailEnforcementLog shows loading skeleton
  - [ ] Test clicking row opens detail dialog
  - [ ] Test GuardrailLogDetail shows all fields
  - [ ] Test DateRangeFilter emits correct values
  - [ ] Test DateRangeFilter quick presets work

- [ ] **Task 12: E2E Tests** (AC: All)
  - [ ] Test admin with view_audit_logs permission sees Enforcement Log section
  - [ ] Test admin without view_audit_logs permission doesn't see section
  - [ ] Test log table displays entries when present
  - [ ] Test clicking entry opens detail modal
  - [ ] Test date range filter changes displayed logs
  - [ ] Test quick preset "Last 7 days" works

## Dev Notes

### Existing Infrastructure to Leverage

| Component | Location | Status |
|-----------|----------|-------|
| `logGuardrailEvent()` | `src/lib/ai-buddy/audit-logger.ts` | Exists - already called in chat API |
| `queryAuditLogs()` | `src/lib/ai-buddy/audit-logger.ts` | Exists - can be reused with action filter |
| `ai_buddy_audit_logs` table | Supabase | Exists from Epic 14 |
| `GuardrailAdminPanel` | `src/components/ai-buddy/admin/guardrail-admin-panel.tsx` | Exists - extend with logs section |
| Dialog component | `@/components/ui/dialog` | Exists |
| Table component | `@/components/ui/table` | Exists |

### Existing Audit Logger Implementation

The `logGuardrailEvent()` function in `src/lib/ai-buddy/audit-logger.ts` already logs:

```typescript
await logAuditEvent({
  agencyId,
  userId,
  conversationId,
  action: 'guardrail_triggered',
  metadata: {
    triggeredTopic,
    redirectMessage,
    messagePreview: userMessage.slice(0, 100),
    timestamp: new Date().toISOString(),
  },
});
```

This is already called in `src/app/api/ai-buddy/chat/route.ts` lines 319-328 when `guardrailCheckResult.triggeredTopic` is truthy.

### Chat API Guardrail Integration (Already Implemented)

From `src/app/api/ai-buddy/chat/route.ts`:

```typescript
// Log guardrail event if triggered (AC19)
if (guardrailCheckResult.triggeredTopic) {
  await logGuardrailEvent(
    agencyId,
    user.id,
    activeConversationId,
    guardrailCheckResult.triggeredTopic.trigger,
    guardrailCheckResult.triggeredTopic.redirect,
    message
  );
}
```

**AC-19.2.1 is already implemented.** This story focuses on the UI to view these logs.

### API Response Format

```typescript
// GET /api/ai-buddy/admin/guardrails/logs
// Query params: startDate, endDate, limit, offset
// Response:
{
  data: {
    logs: GuardrailEnforcementEvent[],
    total: number,
    hasMore: boolean
  },
  error: null
}
```

### TypeScript Types to Add

```typescript
// src/types/ai-buddy.ts

/**
 * Guardrail enforcement audit log entry for admin viewing
 */
export interface GuardrailEnforcementEvent {
  id: string;
  agencyId: string;
  userId: string;
  userEmail: string;  // Joined from users table
  conversationId: string | null;
  triggeredTopic: string;
  messagePreview: string;  // Truncated to 100 chars
  redirectApplied: string;
  loggedAt: string;
}
```

### UI Component Structure

```
GuardrailAdminPanel (existing)
├── RestrictedTopicsList (existing)
├── GuardrailToggleList (existing)
├── Separator
└── GuardrailEnforcementLog (new)
    ├── DateRangeFilter
    ├── Table
    │   ├── Header: User | Triggered Topic | Message | Date/Time
    │   └── Rows: GuardrailEnforcementRow
    └── Pagination (optional for MVP)

GuardrailLogDetail (dialog)
├── Dialog
│   ├── User Email
│   ├── Triggered Topic
│   ├── Message Preview (full)
│   ├── Redirect Applied
│   ├── Timestamp
│   ├── Conversation ID
│   └── [View Conversation] link (optional)
```

### Permission Check

The `view_audit_logs` permission must be checked for:
1. API route: Use `requireAdminAuth('view_audit_logs')`
2. UI: Conditionally render section based on permission

### RLS Verification (AC-19.2.7)

Verify `ai_buddy_audit_logs` table has append-only RLS:
- SELECT: Admins with `view_audit_logs` permission only
- INSERT: Allow authenticated users (for logging)
- UPDATE: Deny all
- DELETE: Deny all

This ensures logs are immutable once written.

### Project Structure Notes

- New components go in `src/components/ai-buddy/admin/`
- Hook goes in `src/hooks/ai-buddy/`
- API route goes in `src/app/api/ai-buddy/admin/guardrails/logs/`
- Tests follow existing patterns from story 19.1

### Learnings from Previous Story

**From Story 19.1 (Guardrail Admin UI) - Status: done**

- **Admin section pattern**: `isAdmin` prop + conditional render in GuardrailAdminPanel
- **API permission pattern**: `requireAdminAuth('permission_name')` helper
- **Hook pattern**: Return interface with `{ data, isLoading, error, refetch }`
- **Component composition**: Panel → List → Card/Row pattern
- **Data-testid attributes**: Added throughout for E2E testing

**Files Created in 19.1 to Reference:**
- `src/components/ai-buddy/admin/guardrail-admin-panel.tsx` - Extend with logs section
- `src/hooks/ai-buddy/use-guardrails.ts` - Hook pattern to follow
- `src/app/api/ai-buddy/admin/guardrails/route.ts` - API permission pattern

**Services Available for Reuse:**
- `queryAuditLogs()` in `src/lib/ai-buddy/audit-logger.ts` - Already supports action filtering

**Schema Available:**
- `ai_buddy_audit_logs` table with columns: id, agency_id, user_id, conversation_id, action, metadata, logged_at

[Source: docs/sprint-artifacts/epics/epic-19/stories/19-1-guardrail-admin-ui/story-19.1-guardrail-admin-ui.md#Dev-Agent-Record]

### Critical Bug Fix from 19.1 (Reference Only)

**BUG-19.1.1: setOnSave Functional Update Pattern**

If any **editable** forms are added in the future that use the Settings Context for unsaved changes tracking, the save handler MUST be wrapped:

```tsx
// BROKEN - React calls saveHandler() immediately!
setOnSave(saveHandler);

// CORRECT - Stores saveHandler as state value
setOnSave(() => saveHandler);
```

React's `useState` setter interprets a function argument as a functional update and calls it immediately. Wrapping prevents auto-invocation.

**This bug does NOT affect Story 19.2** because:
- Enforcement log is read-only (no save functionality)
- Date filter changes queries, not persisted data
- No forms with dirty state tracking are added

See [BUG-19.1.1 full documentation](../19-1-guardrail-admin-ui/story-19.1-guardrail-admin-ui.md#bug-fixes) for details.

### Performance Requirements

| Metric | Target |
|--------|--------|
| Logs API query | < 200ms |
| Table render | < 100ms |
| Filter update | < 300ms |

### References

- [Source: docs/sprint-artifacts/epics/epic-19/tech-spec-epic-19.md#Story-19.2] - Acceptance criteria
- [Source: docs/sprint-artifacts/epics/epic-19/epic.md] - Epic overview and FR38
- [Source: docs/features/ai-buddy/prd.md] - FR38 requirements
- [Source: src/lib/ai-buddy/audit-logger.ts] - Existing audit logging implementation
- [Source: src/app/api/ai-buddy/chat/route.ts#L319-328] - Guardrail event logging in chat API
- [Source: src/components/ai-buddy/admin/guardrail-admin-panel.tsx] - Panel to extend

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-19/stories/19-2-enforcement-logging/19-2-enforcement-logging.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-08 | SM Agent | Initial story draft created from tech spec |
