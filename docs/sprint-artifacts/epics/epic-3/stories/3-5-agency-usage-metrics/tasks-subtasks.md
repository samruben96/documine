# Tasks / Subtasks

- [x] **Task 1: Create UsageTab component** (AC: 3.5.1, 3.5.2, 3.5.3, 3.5.4, 3.5.5)
  - [x] Create `src/components/settings/usage-tab.tsx`
  - [x] Accept props for all usage metrics
  - [x] Create metric cards for Documents, Queries, Active Users, Storage
  - [x] Each card shows "This Month" and "All Time" values where applicable
  - [x] Use appropriate formatting (commas for thousands, MB/GB for storage)
  - Note: Loading skeleton not added (server-side fetch, no client-side loading state needed)

- [x] **Task 2: Add getUsageMetrics server action** (AC: 3.5.1, 3.5.2, 3.5.3, 3.5.4)
  - [x] Add `getUsageMetrics()` to `src/app/(dashboard)/settings/actions.ts`
  - [x] Query documents table for counts (this month/all time)
  - [x] Query chat_messages table for user message counts (this month/all time)
  - [x] Calculate active users from documents + conversations activity in last 7 days
  - [x] Calculate storage from documents.metadata
  - [x] Return structured UsageMetrics object

- [x] **Task 3: Define UsageMetrics types** (AC: 3.5.1, 3.5.2, 3.5.3, 3.5.4)
  - [x] Add UsageMetrics interface to `src/types/index.ts`
  - [x] Include: documentsUploaded (thisMonth, allTime), queriesAsked (thisMonth, allTime), activeUsers, storageUsedBytes

- [x] **Task 4: Integrate UsageTab into settings page** (AC: 3.5.5, 3.5.6)
  - [x] Import UsageTab in `src/app/(dashboard)/settings/page.tsx`
  - [x] Add "Usage" tab to settings TabsList (admin only)
  - [x] Conditionally render Usage tab based on isAdmin
  - [x] Fetch usage metrics on page load
  - [x] Pass metrics to UsageTab component

- [x] **Task 5: Add admin-only gate for usage metrics** (AC: 3.5.6)
  - [x] Ensure Usage tab only visible in TabsList for admins
  - [x] Verify non-admin cannot access usage data via server action
  - [x] Return null for non-admin calls to getUsageMetrics

- [x] **Task 6: Add unit tests for usage metrics** (AC: 3.5.1, 3.5.2, 3.5.3, 3.5.4)
  - [x] Test getUsageMetrics returns correct structure
  - [x] Test document count queries for this month vs all time
  - [x] Test query count aggregation
  - [x] Test active user calculation (7-day window)
  - [x] Test storage calculation and formatting
  - [x] Test admin-only access enforcement

- [x] **Task 7: Build and test verification** (All ACs)
  - [x] Verify `npm run build` succeeds
  - [x] Verify all tests pass (280/280)
  - [ ] Manual test: admin sees Usage tab with all metrics
  - [ ] Manual test: member does not see Usage tab
  - [ ] Manual test: metrics refresh on navigation
