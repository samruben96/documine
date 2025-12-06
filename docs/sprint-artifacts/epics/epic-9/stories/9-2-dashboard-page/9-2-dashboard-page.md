# Story 9.2: Dashboard Page

**Status:** done (code-reviewed 2025-12-04)

---

## User Story

As an **agency member**,
I want to see a dashboard with all available tools when I log in,
So that I can quickly navigate to the feature I need.

---

## Acceptance Criteria

### AC-9.2.1: Dashboard Route
**Given** I am logged in
**When** I navigate to `/dashboard`
**Then** I see the dashboard page with agency welcome header

### AC-9.2.2: Welcome Header
**Given** I am on the dashboard
**When** I view the header
**Then** I see "Welcome to [Agency Name] space" with agency name populated

### AC-9.2.3: Tool Cards
**Given** I am on the dashboard
**When** I view the main content area
**Then** I see three tool cards: Chat with Docs, Quote Comparison, Generate One-Pager

### AC-9.2.4: Card Navigation
**Given** I am on the dashboard
**When** I click on a tool card
**Then** I am navigated to the correct page (documents, compare, one-pager)

### AC-9.2.5: Redirect from Root
**Given** I am logged in
**When** I navigate to `/`
**Then** I am redirected to `/dashboard`

### AC-9.2.6: Responsive Layout
**Given** I am on the dashboard
**When** I view on mobile (< 768px)
**Then** the tool cards stack in a single column

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `/dashboard` page route (AC: #1)
- [x] Create `WelcomeHeader` component with agency name (AC: #2)
- [x] Create `ToolCard` component with icon, title, description (AC: #3)
- [x] Configure tool card data with correct hrefs (AC: #4)
- [x] Add redirect from `/` to `/dashboard` for authenticated users (AC: #5)
- [x] Style responsive grid layout (1 col mobile, 3 col desktop) (AC: #6)
- [x] Add hover effects and transitions to cards (AC: #3)
- [x] Write component tests for dashboard (AC: #1, #2, #3) - 17 tests

### Technical Summary

The dashboard provides a central navigation hub for all docuMINE features. It uses the agency name from the existing agencies data (via useAgency hook or similar) and presents three tool cards in a responsive grid. The redirect from root ensures users always land on the dashboard after login.

### Project Structure Notes

- **Files to create:**
  - `src/app/(dashboard)/dashboard/page.tsx`
  - `src/components/dashboard/welcome-header.tsx`
  - `src/components/dashboard/tool-card.tsx`
- **Files to modify:**
  - `src/middleware.ts` or `src/app/page.tsx` (redirect logic)
- **Expected test locations:**
  - `__tests__/components/dashboard/tool-card.test.tsx`
  - `__tests__/components/dashboard/welcome-header.test.tsx`
- **Estimated effort:** 2 story points
- **Prerequisites:** None (can be developed in parallel with 9.1)

### Key Code References

| File | Purpose |
|------|---------|
| `src/components/ui/card.tsx` | shadcn/ui card component base |
| `src/hooks/use-agency-id.ts` | Fetching agency data |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout wrapper |

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md) - Primary context document containing:
- Tool card data structure
- Responsive breakpoints
- Navigation configuration

**Architecture:** [architecture.md](../architecture.md)
- App Router conventions
- Layout patterns

---

## Dev Agent Record

### Context Reference
- [9-2-dashboard-page.context.xml](./9-2-dashboard-page.context.xml)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed server→client component boundary error - Cannot pass Lucide icon functions from server to client components. Fixed with icon name string map pattern in ToolCard component.
- Updated middleware tests - Changed redirect expectation from `/documents` to `/dashboard`.
- Fixed agency type handling - Supabase relationship can return array or single object, added Array.isArray check.

### Completion Notes
All 6 ACs implemented:
- AC-9.2.1: Dashboard page at `/dashboard` with server-side data fetching
- AC-9.2.2: WelcomeHeader with time-based greeting and agency name
- AC-9.2.3: Three ToolCard components (Chat with Docs, Quote Comparison, Generate One-Pager)
- AC-9.2.4: Cards navigate to correct pages (/documents, /compare, /one-pager)
- AC-9.2.5: Redirect from `/` to `/dashboard` added in middleware
- AC-9.2.6: Responsive grid layout (1 col mobile, 3 col desktop)

### Files Modified
**Created:**
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard page with server-side agency data
- `src/components/dashboard/welcome-header.tsx` - Welcome header with greeting
- `src/components/dashboard/tool-card.tsx` - Tool card with icon map pattern
- `__tests__/components/dashboard/welcome-header.test.tsx` - 9 unit tests
- `__tests__/components/dashboard/tool-card.test.tsx` - 8 unit tests

**Modified:**
- `src/middleware.ts` - Added redirect from `/` to `/dashboard` for authenticated users
- `__tests__/middleware.test.ts` - Updated redirect expectations

### Test Results
- 17 new tests (9 welcome-header + 8 tool-card)
- All 1139 tests passing

---

## Review Notes

**Reviewer:** Claude Opus 4.5 (code-review workflow)
**Date:** 2025-12-04

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC-9.2.1 | PASS | `src/app/(dashboard)/dashboard/page.tsx` - Route renders with agency welcome header |
| AC-9.2.2 | PASS | `src/components/dashboard/welcome-header.tsx:24-36` - "Welcome to [Agency Name] space" with time-based greeting |
| AC-9.2.3 | PASS | `src/app/(dashboard)/dashboard/page.tsx:15-37` - TOOLS array with Chat, Compare, One-Pager cards |
| AC-9.2.4 | PASS | TOOLS array hrefs: /documents, /compare, /one-pager - verified in page.tsx:20,26,32 |
| AC-9.2.5 | PASS | `src/middleware.ts:65-67` - authenticated users on `/` redirected to `/dashboard` |
| AC-9.2.6 | PASS | `src/app/(dashboard)/dashboard/page.tsx:80` - `grid-cols-1 gap-6 lg:grid-cols-3` responsive layout |

### Test Coverage

- `__tests__/components/dashboard/welcome-header.test.tsx` - 9 tests (all passing)
- `__tests__/components/dashboard/tool-card.test.tsx` - 8 tests (all passing)
- `__tests__/middleware.test.ts` - Updated redirect expectations to /dashboard (passing)

### Code Quality

| Aspect | Assessment |
|--------|------------|
| Type Safety | Excellent - ToolCardProps properly typed with color variants |
| Server/Client Boundary | Fixed - icon map pattern avoids passing functions to client |
| Responsive Design | Good - mobile-first grid with lg breakpoint |
| Accessibility | Good - semantic headings, testid attributes |

### Issues Found & Resolved During Dev

1. **Server/Client boundary error** - Lucide icons passed from server to client. Fixed with icon name string + map pattern in ToolCard.
2. **Agency type handling** - Supabase relationship can return array or single object. Fixed with `Array.isArray` check.
3. **Middleware redirect** - Updated from /documents to /dashboard for authenticated root access.

### Recommendation

**APPROVED** - All ACs verified, tests passing, responsive layout confirmed.
