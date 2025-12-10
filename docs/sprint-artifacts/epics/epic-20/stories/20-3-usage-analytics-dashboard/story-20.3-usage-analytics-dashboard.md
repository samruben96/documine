# Story 20.3: Usage Analytics Dashboard

Status: done

## Story

As an agency administrator,
I want to view usage analytics for my agency's AI Buddy usage,
so that I can monitor adoption, identify active users, and understand usage trends over time.

## Acceptance Criteria

### AC-20.3.1: Summary Cards Display
Given an admin accesses the usage analytics dashboard,
When the page loads,
Then they see summary cards showing: total conversations, active users, documents uploaded, and messages sent.

### AC-20.3.2: Per-User Breakdown Table
Given an admin is viewing usage analytics,
When they scroll to the breakdown section,
Then they see a table showing metrics for each agency user (name, conversations, messages, documents, last active).

### AC-20.3.3: Date Range Filter
Given an admin wants to filter analytics data,
When they select a date range (This week, This month, Last 30 days, Custom range),
Then all metrics and charts update to reflect the selected period.

### AC-20.3.4: Line Chart Trends
Given an admin is viewing the dashboard,
When they look at the trends section,
Then they see a line chart showing daily active users and conversations over the selected period.

### AC-20.3.5: Chart Hover Interaction
Given an admin views the trend chart,
When they hover over a data point,
Then a tooltip displays exact values for that day (date, active users, conversations).

### AC-20.3.6: CSV Export
Given an admin wants to export usage data,
When they click the Export button,
Then a CSV file is downloaded containing usage data for the selected date range.

### AC-20.3.7: Performance Target
Given an admin accesses the dashboard,
When the page loads,
Then all data loads within 500ms using the materialized view.

### AC-20.3.8: Empty State
Given an agency with no AI Buddy usage data,
When an admin views the analytics dashboard,
Then an appropriate empty state message is displayed with guidance.

## Tasks / Subtasks

- [x] **Task 1: Database Setup** (AC: 20.3.7)
  - [x] Create materialized view `ai_buddy_usage_daily` for aggregated metrics
  - [x] Add indexes for efficient date range queries
  - [x] Create refresh function for materialized view
  - [x] Document refresh strategy (manual trigger initially, cron later)

- [x] **Task 2: API Route - Get Analytics** (AC: 20.3.1, 20.3.2, 20.3.3)
  - [x] Create `src/app/api/ai-buddy/admin/analytics/route.ts`
  - [x] Implement GET with period filter (week, month, 30days, custom)
  - [x] Return summary stats from materialized view
  - [x] Return per-user breakdown with user details
  - [x] Return trend data for chart (daily values)
  - [x] Verify `view_usage_analytics` permission

- [x] **Task 3: API Route - Export CSV** (AC: 20.3.6)
  - [x] Create `GET /api/ai-buddy/admin/analytics/export`
  - [x] Accept date range parameters
  - [x] Generate CSV with columns: date, user_email, user_name, conversations, messages, documents
  - [x] Return as downloadable file with appropriate headers
  - [x] Include agency name and export date in filename

- [x] **Task 4: Summary Cards Component** (AC: 20.3.1)
  - [x] Create `src/components/ai-buddy/admin/analytics/usage-stat-card.tsx`
  - [x] Design four cards: Conversations, Active Users, Documents, Messages
  - [x] Include comparison to previous period (e.g., "+12% from last week")
  - [x] Loading skeleton state
  - [x] Use existing Card component from shadcn/ui

- [x] **Task 5: Trend Chart Component** (AC: 20.3.4, 20.3.5)
  - [x] Create `src/components/ai-buddy/admin/analytics/usage-trend-chart.tsx`
  - [x] Implement line chart using recharts library
  - [x] Two lines: Active Users (primary), Conversations (secondary)
  - [x] Custom tooltip with date and values
  - [x] Responsive sizing
  - [x] Legend below chart

- [x] **Task 6: Per-User Breakdown Table** (AC: 20.3.2)
  - [x] Create `src/components/ai-buddy/admin/analytics/user-breakdown-table.tsx`
  - [x] Columns: User name, Email, Conversations, Messages, Documents, Last Active
  - [x] Sortable columns
  - [x] Pagination if >10 users
  - [x] Link to user in user management (if admin)

- [x] **Task 7: Date Range Picker** (AC: 20.3.3)
  - [x] Create `src/components/ai-buddy/admin/analytics/date-range-picker.tsx`
  - [x] Preset options: This week, This month, Last 30 days
  - [x] Custom date range with calendar popover
  - [x] Validate date range (end after start, not in future)
  - [x] Default to "Last 30 days"

- [x] **Task 8: Analytics Dashboard Panel** (AC: All)
  - [x] Create `src/components/ai-buddy/admin/analytics/usage-analytics-panel.tsx`
  - [x] Compose all components: cards, date picker, chart, table, export
  - [x] Empty state when no data
  - [x] Error state handling
  - [x] Mobile responsive layout (stack on small screens)

- [x] **Task 9: Analytics Hook** (AC: All)
  - [x] Create `src/hooks/ai-buddy/use-usage-analytics.ts`
  - [x] Fetch analytics data with date range
  - [x] Derive summary stats, trend data, user breakdown
  - [x] Handle loading and error states
  - [x] Memoize expensive calculations
  - [x] Implement export trigger function

- [x] **Task 10: Admin Panel Integration** (AC: All)
  - [x] Add Usage Analytics tab/section to Admin panel
  - [x] Permission gate for `view_usage_analytics`
  - [x] Navigation link in admin sidebar if applicable

- [x] **Task 11: Unit Tests** (AC: All)
  - [x] Create `__tests__/components/ai-buddy/admin/analytics/usage-stat-card.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/analytics/usage-trend-chart.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/analytics/user-breakdown-table.test.tsx`
  - [x] Create `__tests__/components/ai-buddy/admin/analytics/date-range-picker.test.tsx`
  - [x] Create `__tests__/hooks/ai-buddy/use-usage-analytics.test.ts`

- [x] **Task 12: E2E Tests** (AC: 20.3.1, 20.3.3, 20.3.6)
  - [x] Create `__tests__/e2e/ai-buddy/admin/usage-analytics.spec.ts`
  - [x] Test: Admin can view summary cards with data
  - [x] Test: Changing date range updates all metrics
  - [x] Test: CSV export downloads file
  - [x] Test: Empty state displays for new agency

## Dev Notes

### Key Implementation Patterns

**Materialized View for Performance:**
```sql
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

-- Refresh strategy: Manual initially, cron job in production
REFRESH MATERIALIZED VIEW ai_buddy_usage_daily;
```

**API Response Structure:**
```typescript
interface AnalyticsResponse {
  summary: {
    totalConversations: number;
    activeUsers: number;
    documentsUploaded: number;
    messagesSent: number;
    comparisonPeriod: {
      conversations: number; // % change
      users: number;
      documents: number;
      messages: number;
    };
  };
  byUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    conversations: number;
    messages: number;
    documents: number;
    lastActiveAt: string | null;
  }>;
  trends: Array<{
    date: string;
    activeUsers: number;
    conversations: number;
  }>;
}
```

**Date Range Periods:**
```typescript
const DATE_RANGES = {
  week: { days: 7, label: 'This week' },
  month: { days: 30, label: 'This month' },
  '30days': { days: 30, label: 'Last 30 days' },
  custom: { days: null, label: 'Custom range' },
};
```

**recharts Configuration:**
```typescript
<LineChart data={trends}>
  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'MMM d')} />
  <YAxis />
  <Tooltip content={<CustomTooltip />} />
  <Legend />
  <Line
    type="monotone"
    dataKey="activeUsers"
    stroke="hsl(var(--primary))"
    name="Active Users"
  />
  <Line
    type="monotone"
    dataKey="conversations"
    stroke="hsl(var(--secondary))"
    name="Conversations"
  />
</LineChart>
```

### Learnings from Previous Story

**From Story 20.2 (Admin User Management) - Status: done**

- **API Route Organization**: User management endpoints follow pattern `src/app/api/ai-buddy/admin/{resource}/route.ts` - analytics should follow same pattern
- **Permission Checking**: Use `checkAiBuddyPermission(supabase, userId, 'view_usage_analytics')` helper
- **Service Client Pattern**: For INSERT/UPDATE operations use Verify-Then-Service; for SELECTs, regular client is fine
- **Hook Pattern**: `use-user-management.ts` demonstrates the state management pattern with loading/error states - reuse for analytics hook
- **Test Structure**: 136 tests across component and hook files - maintain similar coverage for analytics

**Key Files from Story 20.2:**
- `src/app/api/ai-buddy/admin/users/route.ts` - API route pattern reference
- `src/hooks/ai-buddy/use-user-management.ts` - Hook structure reference
- `src/components/ai-buddy/admin/user-management-panel.tsx` - Panel composition pattern
- `src/components/settings/ai-buddy-preferences-tab.tsx` - Integration point (add analytics section)

**Reusable Patterns:**
- Error code handling with `AIB_ERROR_CODES`
- Permission check middleware pattern
- Pagination/filtering state management
- Table component composition with shadcn/ui

[Source: docs/sprint-artifacts/epics/epic-20/stories/20-2-admin-user-management/story-20.2-admin-user-management.md#Completion-Notes-List]

### Project Structure Notes

**New Files:**
```
src/
├── app/api/ai-buddy/admin/analytics/
│   ├── route.ts                    # GET (analytics data)
│   └── export/route.ts             # GET (CSV export)
├── components/ai-buddy/admin/analytics/
│   ├── usage-analytics-panel.tsx   # Main panel
│   ├── usage-stat-card.tsx         # Summary card
│   ├── usage-trend-chart.tsx       # Line chart
│   ├── user-breakdown-table.tsx    # Per-user table
│   └── date-range-picker.tsx       # Filter controls
└── hooks/ai-buddy/
    └── use-usage-analytics.ts      # State management
```

**Database:**
```
supabase/migrations/
└── 20251210_usage_analytics_view.sql  # Materialized view + indexes
```

**Dependencies:**
- `recharts` - Already installed for comparison charts
- `date-fns` - Already installed for date formatting

**Alignment with Architecture:**
- Follow kebab-case for component files
- Follow camelCase for hooks with `use` prefix
- API routes under `/api/ai-buddy/admin/`
- Use existing shadcn/ui components (Card, Table, Button, Popover, Calendar)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Story-20.3] - Acceptance criteria (AC-20.3.1 through AC-20.3.8)
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Usage-Analytics-Endpoints] - API contract specifications
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Usage-analytics-materialized-view] - Database schema
- [Source: docs/sprint-artifacts/tech-spec-epic-20.md#Performance] - Performance targets (<500ms)
- [Source: docs/features/ai-buddy/prd.md#Analytics-Requirements] - Business requirements (FR46, FR47)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epics/epic-20/stories/20-3-usage-analytics-dashboard/20-3-usage-analytics-dashboard.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Database Implementation**: Created migration `20251210_usage_analytics_materialized_view.sql` with:
   - Materialized view `ai_buddy_usage_daily` aggregating conversations, messages, and active users by date
   - Regular view `ai_buddy_usage_by_user` for per-user breakdown with joins to profiles
   - Indexes on agency_id and date for efficient filtering
   - `refresh_ai_buddy_usage_daily()` function for manual refresh
   - RLS policies for agency isolation

2. **API Routes**:
   - GET `/api/ai-buddy/admin/analytics` returns summary, per-user breakdown, and trend data
   - GET `/api/ai-buddy/admin/analytics/export` returns CSV download with proper headers
   - Both routes verify `view_usage_analytics` permission

3. **Components Created**:
   - `usage-stat-card.tsx`: Summary cards with K/M number formatting and trend indicators
   - `usage-trend-chart.tsx`: Recharts line chart with tooltips and legend
   - `user-breakdown-table.tsx`: Sortable, paginated table with user metrics
   - `date-range-picker.tsx`: Period select with presets (week, month, 30days)
   - `usage-analytics-panel.tsx`: Main panel composing all components with error/empty states

4. **Hook**: `use-usage-analytics.ts` manages state, fetching, date range changes, and CSV export

5. **Integration**: Added analytics section to AI Buddy preferences tab in settings

6. **Tests**: 55 unit tests passing across 5 test files, plus E2E test file for integration testing

7. **Type Safety**: Updated `database.types.ts` with Views section for the materialized view, added `UserUsageStats` type with nullable fields

### Code Review Remediations (2025-12-09)

**Issue 1: Missing Test File** (MEDIUM)
- Created `__tests__/components/ai-buddy/admin/analytics/usage-trend-chart.test.tsx`
- Tests rendering, loading state, empty state, custom props, and tooltip
- 12 test cases covering all component states

**Issue 2: Materialized View Refresh on Every Request** (MEDIUM)
- Removed `serviceClient.rpc('refresh_ai_buddy_usage_daily')` call from analytics API route
- Added documentation comment explaining refresh strategy (cron job, not per-request)
- This prevents 500ms+ latency under load

**Issue 3: Code Duplication in Date Range Calculation** (LOW)
- Created shared utility `src/lib/ai-buddy/date-utils.ts` with `getDateRange()` function
- Updated both `route.ts` and `export/route.ts` to use the shared utility
- Removed 40+ lines of duplicated code

### File List

**New Files Created:**
- `supabase/migrations/20251210_usage_analytics_materialized_view.sql`
- `src/app/api/ai-buddy/admin/analytics/route.ts`
- `src/app/api/ai-buddy/admin/analytics/export/route.ts`
- `src/components/ai-buddy/admin/analytics/usage-stat-card.tsx`
- `src/components/ai-buddy/admin/analytics/usage-trend-chart.tsx`
- `src/components/ai-buddy/admin/analytics/user-breakdown-table.tsx`
- `src/components/ai-buddy/admin/analytics/date-range-picker.tsx`
- `src/components/ai-buddy/admin/analytics/usage-analytics-panel.tsx`
- `src/hooks/ai-buddy/use-usage-analytics.ts`
- `src/lib/ai-buddy/date-utils.ts` (added in code review remediation)
- `__tests__/components/ai-buddy/admin/analytics/usage-stat-card.test.tsx`
- `__tests__/components/ai-buddy/admin/analytics/usage-trend-chart.test.tsx`
- `__tests__/components/ai-buddy/admin/analytics/user-breakdown-table.test.tsx`
- `__tests__/components/ai-buddy/admin/analytics/date-range-picker.test.tsx`
- `__tests__/components/ai-buddy/admin/analytics/usage-analytics-panel.test.tsx`
- `__tests__/hooks/ai-buddy/use-usage-analytics.test.ts`
- `__tests__/e2e/ai-buddy/admin/usage-analytics.spec.ts`

**Modified Files:**
- `src/types/database.types.ts` - Added Views section and refresh function
- `src/types/ai-buddy.ts` - Added UserUsageStats type
- `src/hooks/ai-buddy/index.ts` - Added useUsageAnalytics export
- `src/components/settings/ai-buddy-preferences-tab.tsx` - Added analytics section

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-09 | SM Agent (Claude Opus 4.5) | Initial story draft created from tech spec |
| 2025-12-09 | Dev Agent (Claude Opus 4.5) | Implementation complete - all 12 tasks done |
| 2025-12-09 | Dev Agent (Claude Opus 4.5) | Code review remediations: added missing test file, extracted date-utils.ts, removed per-request materialized view refresh |
