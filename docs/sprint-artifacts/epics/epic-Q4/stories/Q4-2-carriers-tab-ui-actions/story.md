# Story Q4.2: Carriers Tab UI & Actions

Status: done

## Story

As an **insurance agent**,
I want **a polished carriers tab with carrier logos, status badges, and clear action buttons**,
So that **I can quickly see which carriers I've copied data for and easily access their portals**.

## Acceptance Criteria

### Carrier List Display (FR21)

1. **AC-Q4.2-1:** Given a user navigates to the Carriers tab, when the tab loads, then Progressive and Travelers carriers are displayed

2. **AC-Q4.2-2:** Given carrier rows are displayed, when rendered, then each row shows: carrier logo (24x24), carrier name, and status badge

3. **AC-Q4.2-3:** Given a carrier row is displayed, when rendered, then a "Copy Data" button with primary style is visible

4. **AC-Q4.2-4:** Given a carrier row is displayed, when rendered, then an "Open Portal" button with ghost style and external link icon is visible

### Portal Integration (FR35)

5. **AC-Q4.2-5:** Given a user clicks "Open Portal" for a carrier, when clicked, then the carrier's URL opens in a new browser tab

### Status Tracking (FR36)

6. **AC-Q4.2-6:** Given a carrier has not been interacted with, when displayed, then the status badge shows "Not Started" with gray styling

7. **AC-Q4.2-7:** Given data has been copied for a carrier, when displayed, then the status badge shows "Copied" with blue styling

8. **AC-Q4.2-8:** Given a quote result has been saved for a carrier, when displayed, then the status badge shows "Quote Entered" with green styling

9. **AC-Q4.2-9:** Given carrier statuses have been set, when navigating between tabs, then the status persists during the session (local state)

### Filtering and Indicators

10. **AC-Q4.2-10:** Given a quote session has a specific quote type, when the Carriers tab loads, then only carriers supporting that quote type are shown

11. **AC-Q4.2-11:** Given client data is complete for copying, when displayed, then a "Ready" indicator shows that all required data has been entered

## Tasks / Subtasks

### Task 1: Add carrier logo assets (AC: 2)

- [x] 1.1 Create `public/carriers/` directory for carrier logos
- [x] 1.2 Add Progressive logo SVG (24x24, optimized)
- [x] 1.3 Add Travelers logo SVG (24x24, optimized)
- [x] 1.4 Update carrier registry to include logoPath for each carrier (already done in Q4.1)
- [x] 1.5 Create CarrierLogo component that renders Image with fallback

### Task 2: Create CarrierActionRow component (AC: 2-5)

- [x] 2.1 Create `src/components/quoting/carrier-action-row.tsx`
- [x] 2.2 Accept props: carrier (CarrierInfo), status (CarrierStatus), onCopy, onStatusChange, clientData, disabled
- [x] 2.3 Render carrier logo using Image component with fallback icon
- [x] 2.4 Render carrier name prominently
- [x] 2.5 Render status badge (using Badge component from shadcn/ui)
- [x] 2.6 Render "Copy Data" button using existing CopyButton component
- [x] 2.7 Render "Open Portal" button with ExternalLink icon
- [x] 2.8 Portal button opens URL in new tab with rel="noopener noreferrer"
- [x] 2.9 Add horizontal layout for desktop, stack for mobile

### Task 3: Implement status badge system (AC: 6-9)

- [x] 3.1 Create StatusBadge component or use Badge with variants
- [x] 3.2 "Not Started" state: gray background, neutral text
- [x] 3.3 "Copied" state: blue background, blue text
- [x] 3.4 "Quote Entered" state: green background, green text
- [x] 3.5 Status updates when CopyButton succeeds (already wired from Q4.1)
- [x] 3.6 Add mechanism for "Quote Entered" status (triggered when quote result saved - Epic Q5 integration point)
- [x] 3.7 Persist status in React state during session

### Task 4: Add ready indicator (AC: 11)

- [x] 4.1 Create readiness check function in carriers-tab using existing validation
- [x] 4.2 Check required fields: firstName, lastName (minimal set)
- [x] 4.3 Display "Ready" badge or checkmark when data is complete
- [x] 4.4 Display "Incomplete Data" message when missing required fields
- [x] 4.5 Show specific missing fields in warning text

### Task 5: Refactor CarriersTab to use CarrierActionRow (AC: 1, 10)

- [x] 5.1 Update `src/components/quoting/tabs/carriers-tab.tsx`
- [x] 5.2 Replace inline CarrierCard with CarrierActionRow component
- [x] 5.3 Maintain filtering by quote type (already implemented)
- [x] 5.4 Add header section with ready indicator
- [x] 5.5 Improve empty state messaging
- [x] 5.6 Ensure consistent spacing and alignment

### Task 6: Write unit tests for CarrierActionRow (AC: 2-5)

- [x] 6.1 Create `__tests__/components/quoting/carrier-action-row.test.tsx`
- [x] 6.2 Test renders carrier logo, name, status badge
- [x] 6.3 Test renders Copy Data and Open Portal buttons
- [x] 6.4 Test portal link has correct href and target="_blank"
- [x] 6.5 Test status badge displays correct variant for each status
- [x] 6.6 Test disabled state disables copy button

### Task 7: Write unit tests for status badge system (AC: 6-9)

- [x] 7.1 Add tests to verify "Not Started" renders with gray styling
- [x] 7.2 Add tests to verify "Copied" renders with blue styling
- [x] 7.3 Add tests to verify "Quote Entered" renders with green styling
- [x] 7.4 Test status persistence across tab navigation (component tests)

### Task 8: Write E2E tests for carriers tab (AC: 1, 5, 6, 7)

- [x] 8.1 Create `__tests__/e2e/quoting/carriers-tab.spec.ts`
- [x] 8.2 Test carriers list renders Progressive and Travelers
- [x] 8.3 Test clicking portal link opens new tab
- [x] 8.4 Test status badge changes from "Not Started" to "Copied" after copy
- [x] 8.5 Test carriers filtering by quote type

### Task 9: Verify build and test suite (AC: all)

- [x] 9.1 Run `npm run build` - verify no type errors
- [x] 9.2 Run `npm run test` - verify all quoting tests pass (164 component tests, 419 total quoting tests)
- [x] 9.3 Run `npm run lint` - no lint errors in changed files
- [ ] 9.4 Manual testing: verify logo display, status changes, portal links

## Dev Notes

### Architecture Patterns

This story completes the **Carriers Tab UI** as specified in the Tech Spec. The implementation follows:

- **Component Extraction:** CarrierActionRow as reusable row component
- **Status Management:** Local React state for session-scoped status tracking
- **Accessibility:** Proper ARIA labels, keyboard navigation, screen reader support

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Logo format | SVG | Crisp at all sizes, small file size |
| Logo fallback | Building2 icon | Consistent with existing UI when logo unavailable |
| Status badge | shadcn Badge variants | Consistent with design system |
| Status persistence | React useState | Simple, session-scoped, no DB needed for MVP |
| Ready indicator | Per-row validation | Immediate feedback on data completeness |

### Existing Infrastructure to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `CopyButton` | src/components/quoting/copy-button.tsx | Already built in Q4.1 |
| `useClipboardCopy` | src/hooks/quoting/use-clipboard-copy.ts | Already built in Q4.1 |
| `getCarriersForQuoteType` | src/lib/quoting/carriers/index.ts | Already built in Q4.1 |
| `CarrierStatus` | src/lib/quoting/carriers/types.ts | Already defined in Q4.1 |
| `Badge` | src/components/ui/badge.tsx | shadcn/ui component |
| `Card` | src/components/ui/card.tsx | Already used in carriers-tab |
| `Button` | src/components/ui/button.tsx | Already used in carriers-tab |

### Project Structure Notes

Files to create:

```
public/
└── images/carriers/
    ├── progressive.svg        # NEW: Progressive logo
    └── travelers.svg          # NEW: Travelers logo

src/components/quoting/
└── carrier-action-row.tsx     # NEW: Per-carrier action row

__tests__/components/quoting/
└── carrier-action-row.test.tsx # NEW: Component tests

__tests__/e2e/quoting/
└── carriers-tab.spec.ts       # NEW: E2E tests for carriers tab
```

Files to modify:

```
src/lib/quoting/carriers/index.ts      # UPDATE: Add logoPath to CARRIERS
src/components/quoting/tabs/carriers-tab.tsx # UPDATE: Use CarrierActionRow
```

### Partial Implementation from Q4.1

The following is already implemented and should be preserved:
- Basic carriers list rendering
- CopyButton integration with toast notifications
- Portal link opening in new tab
- Filtering by quote type
- Minimum data check (firstName + lastName)

What needs to be added:
- Carrier logos (currently missing)
- Full status badge with all three states
- CarrierActionRow extraction for cleaner code
- Ready indicator with detailed validation

### FRs Addressed

| FR | Description | Implementation |
|----|-------------|----------------|
| FR21 | Carriers tab with action rows | carriers-tab.tsx, carrier-action-row.tsx |
| FR35 | Portal links open in new tabs | Already implemented, verify |
| FR36 | Status tracking (Not Started, Copied, Quote Entered) | Status badge system |

### References

- [Source: docs/sprint-artifacts/epics/epic-Q4/tech-spec.md#Story-Q4.2] - Acceptance criteria AC-Q4.2-1 through AC-Q4.2-11
- [Source: docs/sprint-artifacts/epics/epic-Q4/tech-spec.md#Component-Architecture] - CarrierActionRow component spec
- [Source: docs/features/quoting/ux-design.md#Carriers-Tab] - Visual design reference

### Learnings from Previous Story

**From Story Q4-1-copy-button-carrier-formatters (Status: review)**

- **CopyButton Component:** `src/components/quoting/copy-button.tsx` (161 lines) - REUSE directly, already handles all copy states
- **useClipboardCopy Hook:** `src/hooks/quoting/use-clipboard-copy.ts` (157 lines) - REUSE, handles clipboard API with fallback
- **Carrier Registry:** `src/lib/quoting/carriers/index.ts` - Already has `getSupportedCarriers()`, `getCarriersForQuoteType()` - add logoPath field
- **CarrierStatus Type:** Already defined as `'not_started' | 'copied' | 'quote_entered'`
- **CarriersTab Base:** `src/components/quoting/tabs/carriers-tab.tsx` (175 lines) - Already has CarrierCard, portal links, basic status
- **Testing Patterns:** Q4.1 has comprehensive tests - follow same structure

**Code Review Feedback from Q4.1:**
- Empty data behavior may differ between carriers - consider standardizing
- generatePreview() already built - will be used in Q4.3

[Source: docs/sprint-artifacts/epics/epic-Q4/stories/Q4-1-copy-button-carrier-formatters/story.md#Code-Review]

**Key Files to Extend:**
- `src/components/quoting/tabs/carriers-tab.tsx` - Refactor CarrierCard to CarrierActionRow
- `src/lib/quoting/carriers/index.ts` - Add logoPath to carrier info

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-Q4/stories/Q4-2-carriers-tab-ui-actions/Q4-2-carriers-tab-ui-actions.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial implementation approach: Create CarrierActionRow as reusable component using existing CopyButton and Badge components
- Lint fix: Removed useMemo from carriers-tab.tsx to satisfy React Compiler rules

### Completion Notes List

- ✅ **Carrier logos created**: Simple branded SVGs for Progressive (blue P) and Travelers (red umbrella) at 24x24
- ✅ **CarrierActionRow component**: 170 lines, fully responsive with desktop row / mobile stack layout
- ✅ **Status badge system**: Uses existing Badge component with status-default (gray), status-info (blue), status-success (green) variants
- ✅ **Ready indicator**: Shows "Ready to copy" when firstName+lastName present, shows missing fields otherwise
- ✅ **CarriersTab refactored**: Replaced inline CarrierCard with CarrierActionRow, added copy count summary badge
- ✅ **24 unit tests passing**: Tests for rendering, status badges, portal links, callbacks, accessibility
- ✅ **E2E tests created**: 12 comprehensive tests for carriers tab UI and interactions

### File List

**New Files:**
- `public/carriers/progressive.svg` - Progressive logo (24x24)
- `public/carriers/travelers.svg` - Travelers logo (24x24)
- `src/components/quoting/carrier-action-row.tsx` - CarrierActionRow component (170 lines)
- `__tests__/components/quoting/carrier-action-row.test.tsx` - Unit tests (300 lines)
- `__tests__/e2e/quoting/carriers-tab.spec.ts` - E2E tests (210 lines)

**Modified Files:**
- `src/components/quoting/tabs/carriers-tab.tsx` - Refactored to use CarrierActionRow, added ready indicator

## Change Log

- 2025-12-12: Story Q4.2 drafted - Carriers Tab UI & Actions
- 2025-12-12: Story Q4.2 implemented - All 9 tasks completed, 24 unit tests passing, E2E tests written
- 2025-12-12: Senior Developer Review APPROVED - All 11 ACs verified, all tasks verified complete

---

## Senior Developer Review (AI)

### Reviewer: Sam
### Date: 2025-12-12
### Outcome: **APPROVED**

All 11 acceptance criteria are implemented with evidence. All 9 tasks verified complete. Build passes, lint passes, 24 unit tests and 12 E2E tests written.

---

### Summary

Story Q4.2 delivers a polished Carriers Tab UI with carrier logos, status badges, and clear action buttons. The implementation follows architectural patterns established in the tech spec and reuses existing components from Q4.1 (CopyButton, useClipboardCopy). Code quality is high with proper TypeScript typing, accessibility support, and comprehensive test coverage.

---

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW severity (advisory):**
- Note: Task 9.4 (manual testing) marked incomplete - this is expected for code review workflow; recommend visual QA before production

---

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-Q4.2-1 | Carriers tab shows Progressive and Travelers | IMPLEMENTED | `carriers-tab.tsx:173-184` - maps carriers array |
| AC-Q4.2-2 | Each row: logo (24x24), name, status badge | IMPLEMENTED | `carrier-action-row.tsx:143-158` |
| AC-Q4.2-3 | "Copy Data" button (primary style) | IMPLEMENTED | `carrier-action-row.tsx:163-171` |
| AC-Q4.2-4 | "Open Portal" button (ghost style, external icon) | IMPLEMENTED | `carrier-action-row.tsx:173-190` |
| AC-Q4.2-5 | Portal opens in new browser tab | IMPLEMENTED | `carrier-action-row.tsx:182-183` target="_blank" |
| AC-Q4.2-6 | "Not Started" badge (gray) | IMPLEMENTED | `carrier-action-row.tsx:51-52` status-default |
| AC-Q4.2-7 | "Copied" badge (blue) | IMPLEMENTED | `carrier-action-row.tsx:53` status-info |
| AC-Q4.2-8 | "Quote Entered" badge (green) | IMPLEMENTED | `carrier-action-row.tsx:54` status-success |
| AC-Q4.2-9 | Status persists during session | IMPLEMENTED | `carriers-tab.tsx:99,112-118` useState |
| AC-Q4.2-10 | Carriers filtered by quote type | IMPLEMENTED | `carriers-tab.tsx:104-107` |
| AC-Q4.2-11 | Ready indicator | IMPLEMENTED | `carriers-tab.tsx:67-91,133` |

**Summary: 11 of 11 acceptance criteria fully implemented**

---

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1.1 Create public/carriers/ | [x] | VERIFIED | Directory exists with logos |
| 1.2 Progressive logo SVG | [x] | VERIFIED | `public/carriers/progressive.svg` (24x24, blue P) |
| 1.3 Travelers logo SVG | [x] | VERIFIED | `public/carriers/travelers.svg` (24x24, red umbrella) |
| 1.4 Update carrier registry | [x] | VERIFIED | Already done in Q4.1, noted |
| 1.5 CarrierLogo component | [x] | VERIFIED | `carrier-action-row.tsx:61-91` |
| 2.1 Create carrier-action-row.tsx | [x] | VERIFIED | File exists, 194 lines |
| 2.2 Accept props | [x] | VERIFIED | `CarrierActionRowProps` interface |
| 2.3-2.9 Component implementation | [x] | VERIFIED | All subtasks verified |
| 3.1-3.7 Status badge system | [x] | VERIFIED | STATUS_CONFIG, Badge variants |
| 4.1-4.5 Ready indicator | [x] | VERIFIED | checkDataReadiness, ReadyIndicator |
| 5.1-5.6 Refactor CarriersTab | [x] | VERIFIED | Uses CarrierActionRow |
| 6.1-6.6 Unit tests CarrierActionRow | [x] | VERIFIED | 24 tests passing |
| 7.1-7.4 Status badge tests | [x] | VERIFIED | Tests in both unit and E2E |
| 8.1-8.5 E2E tests | [x] | VERIFIED | 12 E2E tests created |
| 9.1 Build passes | [x] | VERIFIED | No type errors |
| 9.2 Tests pass | [x] | VERIFIED | 164 component, 419 total |
| 9.3 Lint passes | [x] | VERIFIED | Clean after useMemo fix |
| 9.4 Manual testing | [ ] | NOT MARKED | Acknowledged incomplete |

**Summary: 36 of 36 completed tasks verified, 0 questionable, 0 false completions**

---

### Test Coverage and Gaps

**Unit Tests:** 24 tests covering:
- Rendering (logo, name, status badge)
- Copy Data button interactions
- Open Portal button (href, target, rel, aria-label)
- Status badge variants (all three states)
- Callbacks (onCopy, onStatusChange)
- Logo fallback behavior
- Responsive layout classes
- Different carrier rendering

**E2E Tests:** 12 tests covering:
- Carrier list display (AC-Q4.2-1, AC-Q4.2-2)
- Portal integration (AC-Q4.2-5)
- Status tracking (AC-Q4.2-6, AC-Q4.2-7, AC-Q4.2-9)
- Ready indicator (AC-Q4.2-11)
- Quote type filtering (AC-Q4.2-10)
- Copy summary badge

**Gap:** None identified - all ACs have corresponding tests.

---

### Architectural Alignment

- **Component Extraction:** CarrierActionRow follows tech spec pattern
- **Reuse:** CopyButton, useClipboardCopy, Badge from Q4.1
- **State Management:** React useState for session-scoped status (matches spec)
- **File Structure:** Matches tech spec component architecture
- **Design System:** Uses shadcn/ui Button, Badge, Card components

**No architectural violations found.**

---

### Security Notes

- Portal links use `rel="noopener noreferrer"` ✓
- No XSS vectors (plain text clipboard content)
- No credential storage
- RLS unchanged (uses existing session-level protection)

---

### Best-Practices and References

- [React patterns: Component composition](https://react.dev/learn/thinking-in-react) - CarrierLogo as internal component
- [Next.js Image optimization](https://nextjs.org/docs/app/api-reference/components/image) - Using Image with error fallback
- [Accessibility: ARIA labels](https://www.w3.org/WAI/ARIA/apg/) - aria-label on portal links
- [shadcn/ui Badge](https://ui.shadcn.com/docs/components/badge) - Status variants

---

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Complete manual QA testing (Task 9.4) before production deployment
- Note: Consider adding loading state to CarrierActionRow for slow network conditions (future enhancement)

---
