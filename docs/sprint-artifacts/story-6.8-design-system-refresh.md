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
