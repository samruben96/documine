# Story 6.8: Design System Refresh

**Epic:** 6 - Epic 5 Cleanup & Stabilization + UI Polish
**Priority:** P1
**Effort:** M (4-6 hours)
**Added:** 2025-12-02
**Status:** Ready for Dev

---

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/6-8-design-system-refresh.context.xml` (generated 2025-12-03)

---

## User Story

As a **user of docuMINE**,
I want **a modern, visually engaging design with color and proper spacing**,
So that **the application feels professional, inviting, and easy to use**.

---

## Problem Statement

The current design system is dominated by slate/grey tones:
- Primary color: `slate-600` (#475569) — too neutral
- Entire palette: Slate-based (slate-50 through slate-800)
- No brand accent color beyond functional colors (emerald/red/amber)
- Spacing inconsistencies in various components
- Feels like "Enterprise Grey Syndrome" — professional but lifeless

**User Feedback:** "Too grey. Not loving the color scheme. Doesn't feel modern."

---

## Design Research (2025 SaaS Trends)

Based on UX Designer research and web search:

### Color Trends
- Vibrant accent colors paired with clean neutrals
- Popular palettes: Purple (#844fc1), electric blue (#3b86d1), vibrant green (#38ce3c)
- Pantone 2025: Mocha Mousse (warm brown accents)
- Dark mode with adaptive contrast

### UX Patterns
- Minimalist but not monochrome — intentional color use
- Microinteractions for polish (button hovers, transitions)
- Proper spacing creates "breathing room"
- Visual hierarchy through color, not just size

### References
- [Top Dashboard Design Trends 2025](https://uitop.design/blog/design/top-dashboard-design-trends/)
- [SaaS Design Trends 2025](https://www.designstudiouiux.com/blog/top-saas-design-trends/)
- [Website Color Schemes 2025](https://www.bootstrapdash.com/blog/best-color-schemes-for-websites)

---

## Acceptance Criteria

### AC-6.8.1: Brand Accent Color
**Given** the current slate-only palette
**When** viewing any page in docuMINE
**Then** a brand accent color is visible in:
- Primary buttons (submit, upload, send)
- Active/selected states
- Links and interactive elements
- Header/navigation accents

**Proposed Accent:** Choose ONE of:
- Electric Blue (#3b82f6 / blue-500) — trustworthy, professional
- Indigo (#6366f1 / indigo-500) — modern, sophisticated
- Violet (#8b5cf6 / violet-500) — creative, fresh

### AC-6.8.2: Updated Color Palette
**Given** the new accent color
**When** viewing the application
**Then** the color system includes:
- **Primary:** New accent color (replaces slate-600)
- **Primary Foreground:** White or appropriate contrast
- **Background:** Clean white (light) / dark neutral (dark)
- **Surface/Card:** Subtle off-white (#f9fafb) for depth
- **Text:** Improved hierarchy with better contrast

### AC-6.8.3: Spacing Improvements
**Given** existing spacing inconsistencies
**When** viewing document list, chat panel, and settings
**Then** spacing is consistent:
- Document list items: uniform padding (py-3 px-4)
- Chat messages: proper vertical rhythm (gap-4)
- Cards and sections: consistent inner padding (p-6)
- Sidebar: proper separation between sections

### AC-6.8.4: Button Styling Refresh
**Given** current button styles
**When** viewing buttons throughout the app
**Then** buttons appear modern:
- Primary buttons use accent color
- Hover states have subtle lift/shadow
- Ghost/outline variants have visible accent
- Consistent border-radius (8px)

### AC-6.8.5: Interactive States
**Given** hover and focus interactions
**When** interacting with elements
**Then** states are visually distinct:
- Hover: subtle background change + cursor pointer
- Focus: visible ring in accent color
- Active/pressed: slight darkening
- Selected: accent color border or background

### AC-6.8.6: Visual Hierarchy Enhancement
**Given** the document and chat views
**When** scanning the interface
**Then** hierarchy is clear:
- Primary actions stand out (accent color)
- Secondary actions are subdued but visible
- Disabled states clearly indicate non-interactivity
- Reading order is intuitive

---

## Technical Specification

### Files to Modify

**1. Global Theme (`src/app/globals.css`):**
```css
@theme inline {
  /* NEW: Electric Blue brand accent */
  --color-primary: oklch(0.59 0.20 255); /* blue-500 #3b82f6 */
  --color-primary-foreground: oklch(1 0 0);

  /* Improved surface colors */
  --color-background: oklch(1 0 0);
  --color-surface: oklch(0.98 0 0); /* subtle off-white */
  --color-muted: oklch(0.96 0.01 260); /* hint of accent */

  /* Better text hierarchy */
  --color-foreground: oklch(0.15 0.01 260);
  --color-muted-foreground: oklch(0.50 0.02 260);
}
```

**2. shadcn/ui Config (`components.json`):**
- Update `baseColor` from "neutral" to custom
- OR regenerate components with new theme

**3. Component Updates:**
- `src/components/ui/button.tsx` — Accent primary variant
- `src/components/documents/document-list-item.tsx` — Selection highlight
- `src/components/chat/chat-panel.tsx` — Message styling
- `src/components/layout/header.tsx` — Accent touches

**4. Spacing Audit Files:**
- `src/components/documents/document-list.tsx`
- `src/components/chat/chat-message.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/documents/[id]/page.tsx`

### Implementation Approach

1. **Phase 1: Define New Palette**
   - Update CSS custom properties in globals.css
   - Test with existing components (no breakage)

2. **Phase 2: Update Key Components**
   - Primary buttons (most visible)
   - Selected/active states
   - Links and interactive elements

3. **Phase 3: Spacing Audit**
   - Document list items
   - Chat messages
   - Card padding
   - Section gaps

4. **Phase 4: Polish**
   - Microinteractions (transitions)
   - Hover states
   - Focus rings

---

## Color Decision

### CONFIRMED: Electric Blue
- **Primary:** #3b82f6 (blue-500)
- **Primary Hover:** #2563eb (blue-600)
- **Primary Light:** #dbeafe (blue-100) — for subtle backgrounds
- **Primary Ring:** #93c5fd (blue-300) — for focus states

**Rationale:** Trustworthy, professional, familiar for SaaS. Pairs beautifully with existing slate greys.

**Decision:** Confirmed by stakeholder 2025-12-02.

---

## Out of Scope

- Dark mode enhancements (future story)
- Logo/branding changes
- Marketing site redesign
- New component development (use existing shadcn/ui)

---

## Testing Checklist

- [x] All buttons use new accent color appropriately
- [x] Selected states clearly visible (document list, tabs)
- [x] Hover states provide clear feedback
- [x] Focus states meet WCAG 2.1 contrast requirements
- [x] Spacing consistent across all major views
- [x] No color conflicts with functional colors (success, error, warning)
- [x] Dark mode compatibility maintained
- [x] Responsive: colors work on mobile

---

## Definition of Done

- [x] New accent color applied to primary actions
- [x] Spacing audit completed and fixes applied
- [x] All acceptance criteria verified
- [x] Visual regression check passed
- [x] UX Designer approval on final result
- [x] Story marked done in sprint-status.yaml

---

## Dependencies

- Story 6.7 (Document List UX Polish) - should complete first to avoid conflicts
- UX Designer color decision before implementation

---

## Notes

This story addresses user feedback about the application feeling "too grey" and not modern enough. The goal is a refreshed look that maintains professionalism while adding visual warmth and engagement.

Key principle: **Intentional color use** — not colorful for the sake of it, but strategic use of accent color to guide attention and create hierarchy.

---

# Phase 2: UX Audit Enhancements (2025-12-03)

A comprehensive UX audit was conducted using Playwright to capture every page and state. The following enhancements were identified by the UX Designer.

## Phase 2 Status: IN PROGRESS

---

## UX Audit Screenshots

Screenshots captured at `.playwright-mcp/ux-audit/`:
- `01-login-desktop.png` - Login page
- `02-signup-desktop.png` - Signup page
- `03-reset-password-desktop.png` - Password reset
- `04-documents-empty-desktop.png` - Documents list (no selection)
- `05-document-viewer-chat-desktop.png` - Document viewer with chat
- `06-settings-profile-desktop.png` - Settings profile tab
- `07-settings-team-desktop.png` - Settings team tab
- `08-settings-usage-desktop.png` - Settings usage dashboard
- `09-documents-mobile-main.png` - Mobile documents view
- `10-documents-mobile-sidebar-open.png` - Mobile sidebar state
- `11-document-viewer-mobile.png` - Mobile document viewer
- `12-chat-mobile.png` - Mobile chat view

---

## Critical Issues

### AC-6.8.7: Mobile Header Overflow Fix
**Priority:** 🔴 Critical | **Effort:** XS

**Given** the mobile viewport (< 640px)
**When** viewing any page with the header
**Then** the "docuMINE" logo displays fully without truncation

**Problem:** Logo shows as "uMINE" due to nav items crowding.
**Fix:** Hide nav links behind hamburger menu on mobile, give logo proper space.

### AC-6.8.8: Primary Button Color Verification
**Priority:** 🔴 Critical | **Effort:** S

**Given** the OKLCH color definition for primary
**When** viewing primary buttons in the browser
**Then** buttons display vibrant Electric Blue (#3b82f6), not a muted/dark variant

**Problem:** Buttons appear darker than intended in screenshots.
**Action:** Verify OKLCH conversion, test in different browsers.

---

## High Priority Enhancements

### AC-6.8.9: Navigation Active State
**Priority:** 🟠 High | **Effort:** XS

**Given** the user is on any page
**When** viewing the header navigation
**Then** the current page link has:
- Underline or background highlight
- Uses Electric Blue accent color
- Clear visual distinction from other nav items

### AC-6.8.10: Mobile Sidebar Fix
**Priority:** 🟠 High | **Effort:** S

**Given** the mobile viewport
**When** user taps "Open sidebar" button
**Then** a slide-over panel appears showing:
- Full document list
- Search input
- Upload button
- Proper close button/backdrop

**Problem:** Sidebar toggle changes icon but no document list appears.

### AC-6.8.11: Auth Pages Visual Enhancement
**Priority:** 🟠 High | **Effort:** M

**Given** the login/signup/reset pages
**When** viewing these pages
**Then** they include:
- Subtle gradient or pattern background
- Branded illustration or icon
- Value proposition text or imagery
- Modern card treatment with shadow

---

## Medium Priority Enhancements

### AC-6.8.12: Card Depth & Shadows
**Priority:** 🟡 Medium | **Effort:** S

**Given** settings cards and usage dashboard cards
**When** viewing and interacting with cards
**Then** cards have:
- Subtle default shadow (`shadow-sm`)
- Enhanced shadow on hover (`shadow-md`)
- Border accent on hover (optional)
- Icons using brand accent color

### AC-6.8.13: Empty State Enhancement
**Priority:** 🟡 Medium | **Effort:** S

**Given** the "Choose a document to explore" empty state
**When** no document is selected
**Then** the empty state includes:
- Animated illustration (subtle float/pulse)
- Engaging copy ("Your documents are waiting...")
- Clear CTA button ("Upload your first document")

### AC-6.8.14: Input Focus States
**Priority:** 🟡 Medium | **Effort:** XS

**Given** any text input field
**When** the input receives focus
**Then** the input displays:
- Border color change to Electric Blue
- Subtle glow effect (`ring-2 ring-primary/20`)
- Smooth transition animation

---

## Feature Enhancements (User Requested)

### AC-6.8.15: Resizable Side Panels
**Priority:** 🟠 High | **Effort:** M

**Given** the three-column layout (documents | viewer | chat)
**When** the user hovers between panels
**Then** a resize handle appears allowing:
- Drag to resize document sidebar (min: 200px, max: 400px)
- Drag to resize chat panel (min: 300px, max: 600px)
- Persist user preference in localStorage
- Double-click to reset to default

**Implementation:** Use `react-resizable-panels` or CSS resize with custom handle.

### AC-6.8.16: Markdown Rendering in Chat
**Priority:** 🟠 High | **Effort:** S

**Given** the AI sends markdown-formatted responses
**When** the response is displayed in the chat
**Then** markdown is properly rendered:
- **Bold** text displays as bold
- *Italic* text displays as italic
- `code` displays with monospace background
- Lists display with proper bullets/numbers
- Headers display with appropriate sizing
- Links are clickable

**Implementation:** Use `react-markdown` with `remark-gfm` for GitHub-flavored markdown.

### AC-6.8.17: Dockable/Moveable Chat Panel
**Priority:** 🟡 Medium | **Effort:** L

**Given** the chat panel on desktop
**When** the user wants to reposition it
**Then** the chat can be:
- Dragged to different positions (right, bottom, floating)
- Snapped to predefined dock positions:
  - Right sidebar (default)
  - Bottom panel (horizontal)
  - Floating modal (draggable, resizable)
- Position persisted in localStorage
- Toggle button to minimize/expand

**Implementation:** Use `react-rnd` (resizable and draggable) with snap points.

**UX Considerations:**
- Floating mode: Always on top, draggable within viewport
- Bottom mode: Full width, collapsible height
- Right mode: Current behavior (default)
- Show dock position indicator when dragging

### ~~AC-6.8.18: Source Text Highlighting~~ (MOVED TO EPIC F5)

**Status:** Deferred to Future Epic F5: Document Viewer Enhancements

This feature requires PDF.js text layer work and has been moved to a dedicated future epic. See `docs/epics.md` → Epic F5.

---

## Nice to Have (Future)

### AC-6.8.19: Microinteractions
**Effort:** M

- Tab transitions: Smooth underline slide animation
- Message appear: Fade-in animation for new messages
- Document select: Highlight transition effect
- Button press: Satisfying tactile feedback

### AC-6.8.20: Skeleton Loading States
**Effort:** M

- Skeleton loaders instead of spinners
- Progressive loading for chat history
- Optimistic UI for sending messages
- Document thumbnail placeholders

### AC-6.8.21: Dark Mode Polish
**Effort:** S

- Verify all accent colors work in dark mode
- Check contrast ratios meet WCAG AA
- Ensure cards have proper depth/separation
- Test all states (hover, focus, active)

---

## Phase 2 Implementation Order

### Sprint 1: Critical Fixes
1. [x] AC-6.8.7: Mobile header overflow
2. [x] AC-6.8.8: Button color verification
3. [x] AC-6.8.9: Navigation active state

### Sprint 2: High Priority Features
4. [x] AC-6.8.16: Markdown rendering in chat
5. [x] AC-6.8.10: Mobile sidebar fix

### Sprint 3: UX Polish
7. [x] AC-6.8.15: Resizable side panels
8. [x] AC-6.8.12: Card depth & shadows
9. [x] AC-6.8.14: Input focus states

### Sprint 4: Advanced Features
10. [x] AC-6.8.17: Dockable chat panel
11. [x] AC-6.8.11: Auth pages enhancement
12. [x] AC-6.8.13: Empty state enhancement

### Future
13. [ ] AC-6.8.19: Microinteractions
14. [ ] AC-6.8.20: Skeleton loaders
15. [ ] AC-6.8.21: Dark mode polish

---

## Phase 2 Definition of Done

- [x] All critical issues (AC-6.8.7, AC-6.8.8) resolved
- [x] High priority items (AC-6.8.9-11, 15-16) implemented
- [x] Medium priority items (AC-6.8.12-14, 17) implemented
- [x] Visual testing passed (manual verification via dev server)
- [x] Mobile responsive testing passed (Sheet components verified)
- [x] UX Designer final approval (all AC verified 2025-12-03)
- [x] Story marked done in sprint-status.yaml

**Note:** AC-6.8.18 (Source Text Highlighting) moved to Future Epic F5.

---

## Senior Developer Review (AI)

**Reviewer:** Senior Developer (AI)
**Date:** 2025-12-03
**Status:** ✅ APPROVED

### Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| Build passes | ✅ | `npm run build` succeeds |
| Tests pass | ⚠️ | 864/865 pass - 1 pre-existing failure unrelated to this story |
| All Phase 1 ACs | ✅ | 6/6 verified |
| All Phase 2 ACs | ✅ | 12/12 verified (AC-6.8.18 deferred to Epic F5) |

### Dependencies Added

- `react-resizable-panels: ^3.0.6` - Resizable panel layout
- `react-markdown: ^10.1.0` - Markdown rendering in chat
- `remark-gfm: ^4.0.1` - GitHub-flavored markdown support

### Code Quality

✅ Consistent shadcn/ui patterns
✅ Proper hooks (`use-mobile.ts`)
✅ localStorage persistence for user preferences
✅ ARIA labels and data-testid attributes
✅ AC traceability comments in CSS

### Security Review

✅ No new API endpoints
✅ No sensitive data exposure
✅ Dependencies from trusted sources

### Outcome

**APPROVED** - Ready for merge. All acceptance criteria verified.

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-02 | PM | Created story for design system refresh |
| 2025-12-03 | Dev | Phase 1 complete: Electric Blue accent, button hovers, spacing |
| 2025-12-03 | UX Designer | UX Audit: Added 15 Phase 2 acceptance criteria |
| 2025-12-03 | Dev | Phase 2 complete: All 12 ACs implemented |
| 2025-12-03 | Senior Dev (AI) | Code review APPROVED |
