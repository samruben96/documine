# Epic: docuMINE Design Refresh

**Author:** Sam
**Date:** 2025-12-10
**Priority:** High (should be implemented before Quoting epic Q1)

---

## Overview

Update the entire docuMINE design to match the beautiful, clean aesthetic established in the Quoting mockup (`docs/features/quoting/mockups/quoting-mockup.html`). This epic brings consistency, improved visual hierarchy, and a more polished professional feel across all existing features.

**Reference Mockup:** `docs/features/quoting/mockups/quoting-mockup.html`

---

## What Makes The Mockup Design Special

### Header
- **Clean logo treatment**: Blue square with "dM" logo + "docuMINE" text
- **Minimal header**: Just logo, notification bell, user avatar
- **Height**: h-14 (56px) consistent

### Sidebar Navigation
- **White background** (not slate-50)
- **Vertical nav items** with icons + text labels
- **Active state**: Light blue background (`bg-blue-50`) + Electric Blue text
- **Hover state**: Light slate hover (`hover:bg-slate-100`)
- **Icon + label pattern**: Consistent 5x5 icons with text-sm labels
- **Settings at bottom** with border separator
- **Width**: w-56 (224px)

### Cards & Content
- **White cards** with slate-200 borders
- **Rounded-lg** (8px) corners
- **Hover transitions**: `hover:border-slate-300 hover:shadow-sm`
- **Clean info hierarchy**: Title → badges → metadata

### Typography
- **Page titles**: text-2xl font-semibold
- **Subtitles**: text-slate-500 text-sm
- **Labels**: text-sm font-medium text-slate-700
- **Body text**: text-sm text-slate-600

### Buttons
- **Primary**: `bg-primary hover:bg-primary-hover text-white rounded-lg`
- **Secondary/Ghost**: `border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50`
- **Consistent padding**: `px-4 py-2` with `text-sm font-medium`

### Form Inputs
- **Clean border**: `border border-slate-200 rounded-lg`
- **Focus state**: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- **No heavy shadows or outlines**

### Status Badges
- **Pill shape**: `px-2 py-0.5 rounded text-xs font-medium`
- **Color coding**: purple (bundle), blue (home/auto), amber (in progress), green (complete), slate (draft)

### Page Layout
- **Max-width container**: `max-w-5xl mx-auto` or `max-w-4xl mx-auto`
- **Content padding**: `p-6`
- **Main background**: `bg-slate-50`

---

## Current vs. Target Comparison

| Element | Current docuMINE | Target (Mockup) |
|---------|------------------|-----------------|
| **Header** | Text-only logo, top nav links | Logo icon + text, minimal actions |
| **Navigation** | Horizontal nav in header | Vertical sidebar with icons |
| **Sidebar** | Document list only (slate-50) | Full app navigation (white) |
| **Active nav** | Underline style | Blue background + blue text |
| **Page background** | White | Slate-50 |
| **Card borders** | Various | Consistent slate-200 |
| **Button style** | Mixed styles | Consistent rounded-lg |
| **Badge style** | Inconsistent | Consistent pill badges |
| **Form inputs** | Standard shadcn | Refined focus states |

---

## Epic Goal

Transform docuMINE's visual design to match the Quoting mockup aesthetic, creating a consistent, professional, modern interface across all features.

**User Value:** Users experience a polished, cohesive application that feels premium and is easier to navigate.

---

## Stories

### Story DR.1: Header Redesign

As a **docuMINE user**,
I want **a clean, minimal header with the new logo treatment**,
So that **the app feels more polished and professional**.

**Acceptance Criteria:**

**Given** the user is logged in
**When** they view any page
**Then** the header displays:
- Left: Blue square logo (w-8 h-8, bg-primary, rounded-lg) with "dM" + "docuMINE" text
- Right: Notification bell icon + User avatar circle (initials)
- Height: h-14
- White background with slate-200 bottom border

**And** horizontal navigation links are REMOVED from header (moved to sidebar)
**And** logout moves to a dropdown menu from avatar

**Prerequisites:** None

**Technical Notes:**
- Update `src/components/layout/header.tsx`
- Create avatar dropdown with logout
- Remove NavLinks from header
- Add notification bell (placeholder for now)

---

### Story DR.2: Sidebar Navigation Transformation

As a **docuMINE user**,
I want **a vertical sidebar with icon + text navigation**,
So that **I can easily navigate between all app features**.

**Acceptance Criteria:**

**Given** the user is on any dashboard page
**When** they view the sidebar
**Then** the sidebar displays:
- Width: w-56 (224px)
- White background (bg-white)
- Border-right: slate-200
- Navigation items with icons + labels:
  - Dashboard (home icon)
  - Documents (document icon)
  - Compare (chart icon)
  - Quoting (calculator icon) - NEW
  - AI Buddy (bot icon)
  - Reporting (bar-chart icon)
- Settings at bottom with top border separator

**Active state:**
- Background: bg-blue-50
- Text: text-primary (Electric Blue)
- Icon: text-primary

**Hover state:**
- Background: hover:bg-slate-100

**And** each nav item uses: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium`
**And** icons are w-5 h-5

**Prerequisites:** DR.1

**Technical Notes:**
- Major refactor of `src/components/layout/sidebar.tsx`
- Move navigation from header to sidebar
- Add Quoting nav item
- Implement proper active/hover states
- Keep mobile behavior (Sheet for mobile)

---

### Story DR.3: Page Layout & Background Update

As a **docuMINE user**,
I want **consistent page layouts with slate-50 backgrounds**,
So that **content cards stand out and the app feels cohesive**.

**Acceptance Criteria:**

**Given** the user is on any content page
**When** the page renders
**Then**:
- Main content area has `bg-slate-50`
- Content is centered with `max-w-5xl mx-auto` or appropriate max-width
- Page padding is `p-6`
- Page titles use `text-2xl font-semibold text-slate-900`
- Subtitles use `text-slate-500 text-sm mt-1`

**Pages to update:**
- Dashboard
- Documents list
- Document detail
- Compare pages
- AI Buddy
- Reporting
- Settings

**Prerequisites:** DR.2

**Technical Notes:**
- Update `src/app/(dashboard)/layout.tsx` for base styles
- Update each page component for consistent headers
- Ensure cards contrast well against slate-50 background

---

### Story DR.4: Card & Border Consistency

As a **docuMINE user**,
I want **consistent card styling across all features**,
So that **the interface feels unified and polished**.

**Acceptance Criteria:**

**Given** any card component renders
**When** displayed
**Then** cards have:
- Background: bg-white
- Border: border border-slate-200
- Border radius: rounded-lg
- Padding: p-4 or p-6
- Hover (if clickable): hover:border-slate-300 hover:shadow-sm transition-all

**Components to update:**
- Document cards/list items
- Comparison cards
- AI Buddy cards
- Dashboard cards
- Settings sections

**Prerequisites:** DR.3

**Technical Notes:**
- Update `src/components/ui/card.tsx` base styles
- Audit all card usages for consistency
- Add hover states to clickable cards

---

### Story DR.5: Button Style Standardization

As a **docuMINE user**,
I want **consistent button styling throughout the app**,
So that **interactive elements are predictable and clear**.

**Acceptance Criteria:**

**Primary buttons:**
- `bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- Used for: main actions (Save, Create, Generate, etc.)

**Secondary/Ghost buttons:**
- `border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors`
- Used for: secondary actions (Cancel, Open Portal, etc.)

**Icon buttons:**
- `p-2 hover:bg-slate-100 rounded-lg` (or rounded-full for circular)
- Used for: menu triggers, actions in rows

**Prerequisites:** DR.3

**Technical Notes:**
- Update `src/components/ui/button.tsx` variants
- Ensure all variants have rounded-lg
- Audit button usages app-wide

---

### Story DR.6: Form Input Refinement

As a **docuMINE user**,
I want **clean, consistent form inputs**,
So that **data entry feels smooth and modern**.

**Acceptance Criteria:**

**Input fields:**
- Border: `border border-slate-200 rounded-lg`
- Padding: `px-3 py-2`
- Text: `text-sm`
- Focus: `focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`

**Labels:**
- `text-sm font-medium text-slate-700 mb-1`
- Required indicator: `<span class="text-red-500">*</span>`

**Select dropdowns:**
- Same border/focus styles as inputs
- Consistent with inputs

**Prerequisites:** DR.5

**Technical Notes:**
- Update `src/components/ui/input.tsx`
- Update `src/components/ui/select.tsx`
- Update label patterns in forms

---

### Story DR.7: Badge & Status Indicator System

As a **docuMINE user**,
I want **consistent status badges across all features**,
So that **I can quickly understand item status**.

**Acceptance Criteria:**

**Badge base style:**
- `px-2 py-0.5 rounded text-xs font-medium`

**Color variations:**
| Status | Background | Text |
|--------|------------|------|
| Draft/Default | bg-slate-100 | text-slate-600 |
| In Progress | bg-amber-100 | text-amber-700 |
| Complete/Success | bg-green-100 | text-green-700 |
| Info/Type | bg-blue-100 | text-blue-700 |
| Bundle/Special | bg-purple-100 | text-purple-700 |
| Error/Warning | bg-red-100 | text-red-700 |

**Prerequisites:** DR.4

**Technical Notes:**
- Create `src/components/ui/badge.tsx` if not exists
- Create badge variant system
- Update all status indicators app-wide

---

### Story DR.8: Typography & Spacing Polish

As a **docuMINE user**,
I want **consistent typography hierarchy**,
So that **content is easy to scan and understand**.

**Acceptance Criteria:**

**Typography scale:**
| Element | Classes |
|---------|---------|
| Page title | text-2xl font-semibold text-slate-900 |
| Section title | text-lg font-medium text-slate-900 |
| Card title | font-medium text-slate-900 |
| Body text | text-sm text-slate-600 |
| Muted text | text-sm text-slate-500 |
| Label | text-sm font-medium text-slate-700 |

**Spacing:**
- Section gaps: space-y-6
- Card content: p-4 or p-6
- Form field gaps: space-y-4
- Inline gaps: gap-2, gap-3, gap-4

**Prerequisites:** DR.6

**Technical Notes:**
- Create typography utility classes or document patterns
- Audit all pages for consistent application
- Update any outliers

---

### Story DR.9: Mobile Navigation Update

As a **docuMINE mobile user**,
I want **the mobile navigation to match the new design**,
So that **the experience is consistent across devices**.

**Acceptance Criteria:**

**Mobile sidebar (Sheet):**
- Same navigation items as desktop sidebar
- Same styling (white bg, icon + label, active states)
- Opens from left side

**Mobile bottom nav:**
- Updated icons to match sidebar
- Add Quoting item
- Consistent active state styling

**Header on mobile:**
- Same logo treatment
- Hamburger menu for sidebar
- Avatar for user menu

**Prerequisites:** DR.2

**Technical Notes:**
- Update `MobileBottomNav` component
- Update mobile Sheet sidebar
- Test on various mobile sizes

---

### Story DR.10: Existing Feature Pages Update

As a **docuMINE user**,
I want **all existing pages updated to the new design**,
So that **the entire app feels cohesive**.

**Acceptance Criteria:**

**Pages to update with new patterns:**

1. **Dashboard** (`/dashboard`)
   - Page header with title
   - Card-based layout
   - Consistent spacing

2. **Documents** (`/documents`)
   - List view with new card styling
   - Search/filter inputs refined
   - Document cards with hover states

3. **Document Detail** (`/documents/[id]`)
   - Consistent header/back button
   - Tab styling if applicable
   - Content sections in cards

4. **Compare** (`/compare`)
   - Card-based comparison layout
   - Consistent button styling

5. **AI Buddy** (`/ai-buddy`)
   - Chat interface consistency
   - Card styling for messages
   - Input area refinement

6. **Reporting** (`/reporting`)
   - Dashboard cards
   - Chart containers
   - Form inputs

7. **Settings** (`/settings`)
   - Section cards
   - Form styling
   - Button consistency

**Prerequisites:** DR.1 through DR.8

**Technical Notes:**
- This is the final sweep to catch any inconsistencies
- Focus on applying the patterns established in earlier stories
- Document any edge cases

---

## FR Coverage

This epic doesn't map to PRD FRs - it's a visual/UX improvement epic that enhances the overall product quality before adding new features.

---

## Summary

| Story | Title | Description |
|-------|-------|-------------|
| DR.1 | Header Redesign | New logo treatment, minimal header |
| DR.2 | Sidebar Navigation | Vertical nav with icons |
| DR.3 | Page Layout & Background | Slate-50 backgrounds, consistent spacing |
| DR.4 | Card & Border Consistency | Unified card styling |
| DR.5 | Button Standardization | Consistent button variants |
| DR.6 | Form Input Refinement | Clean inputs with refined focus |
| DR.7 | Badge System | Consistent status badges |
| DR.8 | Typography & Spacing | Typography hierarchy |
| DR.9 | Mobile Navigation | Mobile-specific updates |
| DR.10 | Existing Pages Update | Apply patterns to all pages |

**Total:** 10 Stories

---

## Implementation Order

**Recommended sequence:**
1. DR.1 (Header) - Foundation
2. DR.2 (Sidebar) - Major navigation change
3. DR.3 (Page Layout) - Background/structure
4. DR.4 (Cards) + DR.5 (Buttons) - Can parallel
5. DR.6 (Forms) + DR.7 (Badges) - Can parallel
6. DR.8 (Typography) - Polish
7. DR.9 (Mobile) - Mobile-specific
8. DR.10 (Sweep) - Final consistency pass

**After this epic:** Implement Quoting (Epic Q1-Q5) and it will automatically match the design!

---

_This epic ensures docuMINE has a consistent, polished design before adding the Quoting feature._

_Reference: `docs/features/quoting/mockups/quoting-mockup.html`_
