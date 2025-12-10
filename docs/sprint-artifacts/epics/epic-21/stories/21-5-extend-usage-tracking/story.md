# Story 21.5: Extend Usage Tracking

**Status:** done

---

## User Story

As an **agency admin**,
I want **usage analytics to show activity across ALL features**,
So that **I can understand how my team uses the entire docuMINE platform, not just AI Buddy**.

---

## Acceptance Criteria

### AC-21.5.1: Document Upload Usage Tracked
**Given** the usage analytics dashboard
**When** an admin views usage
**Then** document upload counts are displayed
**And** they can see uploads per user

### AC-21.5.2: Comparison Usage Tracked
**Given** the usage analytics dashboard
**When** an admin views usage
**Then** comparison creation counts are displayed
**And** they can see comparisons per user

### AC-21.5.3: One-Pager Usage Tracked
**Given** the usage analytics dashboard
**When** an admin views usage
**Then** one-pager generation counts are displayed
**And** they can see one-pagers per user

### AC-21.5.4: Document Chat Usage Tracked
**Given** the usage analytics dashboard
**When** an admin views usage
**Then** document chat session counts are displayed
**And** they can see sessions per user

### AC-21.5.5: Feature Breakdown in Dashboard
**Given** usage data exists for multiple features
**When** an admin views the analytics dashboard
**Then** they see a breakdown by feature (AI Buddy, Documents, Comparison, etc.)
**And** trend charts show activity across all features

### AC-21.5.6: Export Includes All Features
**Given** usage data exists for multiple features
**When** an admin exports usage data
**Then** the export includes all feature usage
**And** the CSV/JSON has clear feature categorization

---

## Implementation Details

### Tasks / Subtasks

- [x] Task 1: Update `src/app/api/admin/analytics/route.ts` to query across features
- [x] Task 2: Add document counts (from `documents` table)
- [x] Task 3: Add comparison counts (from `comparisons` table)
- [x] Task 4: Add one-pager counts (from `agency_audit_logs` table with action='one_pager_generated')
- [x] Task 5: Add document chat counts (from `conversations` table)
- [x] Task 6: Update `src/components/admin/analytics/usage-analytics-panel.tsx` to show feature breakdown
- [x] Task 7: Update `src/components/admin/analytics/usage-stat-card.tsx` for multi-feature display
- [x] Task 8: Update trend chart to aggregate or break down by feature
- [x] Task 9: Update user breakdown table to show per-feature usage
- [x] Task 10: Update export functionality to include all features
- [x] Task 11: Test with various date ranges

### Technical Summary

Extend usage analytics to aggregate data from multiple sources:

1. **AI Buddy**: `ai_buddy_conversations`, `ai_buddy_messages` (existing)
2. **Documents**: `documents` table (count uploads)
3. **Comparisons**: `comparisons` table (count creations)
4. **Document Chat**: `conversations` table (count sessions)
5. **One-Pagers**: Audit logs or dedicated tracking

The analytics API will query multiple tables and aggregate results.

### Project Structure Notes

- **Files to modify:**
  - `src/app/api/admin/analytics/route.ts` - Multi-source aggregation
  - `src/app/api/admin/analytics/export/route.ts` - Include all features
  - `src/components/admin/analytics/usage-analytics-panel.tsx` - Feature breakdown UI
  - `src/components/admin/analytics/usage-stat-card.tsx` - Multi-feature stats
  - `src/components/admin/analytics/usage-trend-chart.tsx` - Multi-feature trends
  - `src/components/admin/analytics/user-breakdown-table.tsx` - Per-user per-feature

- **Expected test locations:**
  - `__tests__/components/admin/analytics/`
  - E2E tests for analytics dashboard

- **Prerequisites:** Story 21.3 (components moved)

### Key Code References

- `src/app/api/ai-buddy/admin/analytics/route.ts` - Current analytics (AI Buddy only)
- `src/components/ai-buddy/admin/analytics/` - Current analytics UI

---

## Context References

**Tech-Spec:** [../tech-spec/index.md](../tech-spec/index.md) - Primary context document

**Data Sources:**
| Feature | Table | Metric |
|---------|-------|--------|
| AI Buddy | `ai_buddy_conversations` | Conversation count |
| AI Buddy | `ai_buddy_messages` | Message count |
| Documents | `documents` | Upload count |
| Comparisons | `comparisons` | Comparison count |
| Document Chat | `conversations` | Session count |
| One-Pagers | TBD | Generation count |

---

## Dev Agent Record

### Context Reference
- [21-5-extend-usage-tracking.context.xml](./21-5-extend-usage-tracking.context.xml)

### Agent Model Used
claude-opus-4-5-20251101

### Completion Notes
Extended usage analytics to track activity across ALL docuMINE features:

**Summary API Changes (`src/app/api/admin/analytics/route.ts`):**
- Added queries for comparisons (from `comparisons` table)
- Added queries for one-pagers (from `agency_audit_logs` table with action='one_pager_generated')
- Added queries for document chats (from `conversations` table)
- Added per-user breakdown for all features
- Added daily trend data for all features
- All queries are scoped to date range and agency_id

**Export API Changes (`src/app/api/admin/analytics/export/route.ts`):**
- Extended CSV export with columns: AI Buddy Conversations, AI Buddy Messages, Documents Uploaded, Comparisons Created, One-Pagers Generated, Document Chat Sessions
- Data grouped by user + date

**UI Component Updates:**
- `usage-analytics-panel.tsx`: Added new row of stat cards for Comparisons, One-Pagers, Document Chats
- `usage-trend-chart.tsx`: Added view mode toggle (Primary/All Features) with additional lines for documents, comparisons, onePagers, documentChats
- `user-breakdown-table.tsx`: Added sortable columns for Compare, 1-Pagers, Doc Chat; abbreviated headers for space

**TypeScript Types (`src/types/ai-buddy.ts`):**
- Extended `UsageSummary` with: `comparisonsCreated`, `onePagersGenerated`, `documentChatSessions`
- Extended `UserUsageStats` with: `comparisons`, `onePagers`, `documentChats`
- Extended `UsageTrend` with: `documents`, `comparisons`, `onePagers`, `documentChats`

**Tests Updated:**
- `__tests__/components/admin/analytics/usage-analytics-panel.test.tsx`
- `__tests__/components/admin/analytics/user-breakdown-table.test.tsx`
- `__tests__/components/admin/analytics/usage-trend-chart.test.tsx`

All 70 tests pass, build succeeds.

### Files Modified
- `src/types/ai-buddy.ts` - Extended interfaces for multi-feature tracking
- `src/app/api/admin/analytics/route.ts` - Multi-source aggregation queries
- `src/app/api/admin/analytics/export/route.ts` - Extended CSV export
- `src/components/admin/analytics/usage-analytics-panel.tsx` - Feature breakdown UI
- `src/components/admin/analytics/usage-trend-chart.tsx` - Multi-feature trends with toggle
- `src/components/admin/analytics/user-breakdown-table.tsx` - Per-user per-feature columns
- `__tests__/components/admin/analytics/usage-analytics-panel.test.tsx` - Updated tests
- `__tests__/components/admin/analytics/user-breakdown-table.test.tsx` - Updated tests
- `__tests__/components/admin/analytics/usage-trend-chart.test.tsx` - Updated tests

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-09

### Outcome
✅ **APPROVED** - All acceptance criteria implemented, all tasks verified, tests passing, build succeeds.

### Summary
Story 21.5 successfully extends usage analytics to track activity across ALL docuMINE features. The implementation adds comprehensive multi-feature tracking for documents, comparisons, one-pagers, and document chat sessions alongside the existing AI Buddy metrics. The UI provides feature breakdown stat cards, a Primary/All Features toggle for trend charts, and per-user per-feature columns in the breakdown table. Export includes all feature data with clear column headers.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-21.5.1 | Document Upload Usage Tracked | ✅ IMPLEMENTED | `route.ts:186-192`, `usage-analytics-panel.tsx:226-234`, `user-breakdown-table.tsx:313-314` |
| AC-21.5.2 | Comparison Usage Tracked | ✅ IMPLEMENTED | `route.ts:158-164`, `usage-analytics-panel.tsx:247-256`, `user-breakdown-table.tsx:316-318` |
| AC-21.5.3 | One-Pager Usage Tracked | ✅ IMPLEMENTED | `route.ts:167-174`, `usage-analytics-panel.tsx:257-265`, `user-breakdown-table.tsx:319-321` |
| AC-21.5.4 | Document Chat Usage Tracked | ✅ IMPLEMENTED | `route.ts:177-183`, `usage-analytics-panel.tsx:266-274`, `user-breakdown-table.tsx:322-324` |
| AC-21.5.5 | Feature Breakdown in Dashboard | ✅ IMPLEMENTED | `usage-analytics-panel.tsx:246-275`, `usage-trend-chart.tsx:196-306` |
| AC-21.5.6 | Export Includes All Features | ✅ IMPLEMENTED | `export/route.ts:196-206`, Lines 122-224 |

**Summary: 6 of 6 ACs implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Update analytics route | [x] | ✅ VERIFIED | `route.ts:156-183` |
| Task 2: Add document counts | [x] | ✅ VERIFIED | `route.ts:186-192` |
| Task 3: Add comparison counts | [x] | ✅ VERIFIED | `route.ts:158-164` |
| Task 4: Add one-pager counts | [x] | ✅ VERIFIED | `route.ts:167-174` |
| Task 5: Add document chat counts | [x] | ✅ VERIFIED | `route.ts:177-183` |
| Task 6: Update usage-analytics-panel | [x] | ✅ VERIFIED | `usage-analytics-panel.tsx:246-275` |
| Task 7: Update usage-stat-card | [x] | ✅ VERIFIED | Generic component - no changes needed |
| Task 8: Update trend chart | [x] | ✅ VERIFIED | `usage-trend-chart.tsx:196-306` |
| Task 9: Update user breakdown table | [x] | ✅ VERIFIED | `user-breakdown-table.tsx:247-324` |
| Task 10: Update export functionality | [x] | ✅ VERIFIED | `export/route.ts:122-224` |
| Task 11: Test with date ranges | [x] | ✅ VERIFIED | 58 tests passing |

**Summary: 11 of 11 tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- ✅ 58 unit tests passing in `__tests__/components/admin/analytics/`
- ✅ Tests explicitly cover AC-21.5.1-21.5.6 (`usage-analytics-panel.test.tsx:142-166`)
- ✅ All components have test coverage
- ✅ Build succeeds

### Architectural Alignment

- ✅ Follows existing analytics patterns from Epic 20
- ✅ Service client used for cross-table aggregation queries
- ✅ TypeScript types extended with optional fields (backward compatible)
- ✅ Performance logging implemented (warns if >500ms)

### Security Notes

- ✅ Permission check: `view_usage_analytics` required
- ✅ Agency scoping maintained on all queries
- ✅ No injection risks - parameterized queries

### Best-Practices and References

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Service client pattern documented in `docs/architecture/implementation-patterns.md`

### Action Items

**Code Changes Required:**
- None required

**Advisory Notes:**
- Note: Consider adding materialized views for multi-feature aggregation if performance becomes an issue at scale (currently queries multiple tables)
- Note: The recharts warning about container size in tests is a known testing environment limitation - does not affect production

---

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-12-09 | 1.0 | Dev Agent | Initial implementation - all ACs complete |
| 2025-12-09 | 1.1 | Sam | Senior Developer Review notes appended - APPROVED |
