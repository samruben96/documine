# Story 21.5: Extend Usage Tracking

**Status:** Draft

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

- [ ] Task 1: Update `src/app/api/admin/analytics/route.ts` to query across features
- [ ] Task 2: Add document counts (from `documents` table)
- [ ] Task 3: Add comparison counts (from `comparisons` table)
- [ ] Task 4: Add one-pager counts (if table exists, or from audit logs)
- [ ] Task 5: Add document chat counts (from `conversations` table)
- [ ] Task 6: Update `src/components/admin/analytics/usage-analytics-panel.tsx` to show feature breakdown
- [ ] Task 7: Update `src/components/admin/analytics/usage-stat-card.tsx` for multi-feature display
- [ ] Task 8: Update trend chart to aggregate or break down by feature
- [ ] Task 9: Update user breakdown table to show per-feature usage
- [ ] Task 10: Update export functionality to include all features
- [ ] Task 11: Test with various date ranges

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

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->
