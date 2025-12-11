# Epic Technical Specification: docuMINE Design Refresh

Date: 2025-12-10
Author: Sam
Epic ID: design-refresh
Status: Draft

---

## Overview

This epic transforms docuMINE's visual design to match the clean, modern aesthetic established in the Quoting feature mockup (`docs/features/quoting/mockups/quoting-mockup.html`). The current implementation uses horizontal navigation in the header with an underline active state, a slate-50 sidebar for documents only, and inconsistent styling across components. The target design introduces a vertical sidebar navigation with icon + text labels, a minimal header with logo icon treatment, slate-50 main backgrounds with white cards, and consistent styling patterns for buttons, badges, forms, and typography across all features.

This is a pure frontend/UI epic with no database changes, no new API endpoints, and no backend modifications. All changes are contained within React components, Tailwind CSS classes, and shadcn/ui customizations. The epic ensures visual consistency before the Quoting feature (Epic Q1) is implemented, so Quoting naturally inherits the polished design.

## Objectives and Scope

### In Scope

- **Header Redesign (DR.1):** Replace text-only logo with blue square logo icon + "docuMINE" text; add notification bell placeholder; add user avatar dropdown with logout; remove horizontal nav links from header
- **Sidebar Navigation (DR.2):** Transform document-only sidebar into full app navigation; add vertical nav items with icons (Dashboard, Documents, Compare, Quoting, AI Buddy, Reporting, Settings); implement active state (bg-blue-50, text-primary) and hover state (bg-slate-100); w-56 width with white background
- **Page Layout (DR.3):** Update main content area to bg-slate-50; implement max-w-5xl centering; standardize p-6 padding; update page title typography (text-2xl font-semibold)
- **Card Styling (DR.4):** Standardize white cards with border-slate-200; rounded-lg corners; hover states for clickable cards (hover:border-slate-300 hover:shadow-sm)
- **Button Styling (DR.5):** Update button variants for rounded-lg; primary (bg-primary, white text); secondary (border-slate-200, text-slate-700); icon buttons (p-2, rounded-lg)
- **Form Inputs (DR.6):** Refine input borders (border-slate-200); update focus states (ring-2 ring-primary/20 border-primary); standardize label patterns
- **Badge System (DR.7):** Create consistent status badge styles (pill shape, color variants for status types)
- **Typography (DR.8):** Standardize typography scale across all pages; consistent spacing patterns (space-y-6, gap-6)
- **Mobile Navigation (DR.9):** Update mobile sheet sidebar to match desktop nav; update bottom nav icons and items; add Quoting nav item
- **Page Updates (DR.10):** Apply all patterns to Dashboard, Documents, Document Detail, Compare, AI Buddy, Reporting, Settings pages

### Out of Scope

- No database schema changes
- No new API endpoints or backend logic
- No new features or functionality (this is styling only)
- No changes to existing business logic
- No Quoting feature implementation (that's a separate epic)
- No dark mode implementation (existing dark mode support is maintained but not enhanced)
- No accessibility improvements beyond what's needed for new components
- No internationalization changes

## System Architecture Alignment

### Components Referenced

This epic modifies the UI/UX Architecture layer only, as defined in `docs/architecture/uiux-architecture.md`:

| Component | Current Location | Changes |
|-----------|------------------|---------|
| Header | `src/components/layout/header.tsx` | Major refactor - new logo, remove nav links, add avatar dropdown |
| Sidebar | `src/components/layout/sidebar.tsx` | Major refactor - app-wide navigation instead of document-only |
| MobileBottomNav | `src/components/layout/sidebar.tsx` | Add Quoting item, update icons |
| SplitView | `src/components/layout/split-view.tsx` | Minor - integrate with new sidebar |
| Card | `src/components/ui/card.tsx` | Update default styles, add hover variant |
| Button | `src/components/ui/button.tsx` | Update border-radius to rounded-lg |
| Input | `src/components/ui/input.tsx` | Update focus states |
| Badge | `src/components/ui/badge.tsx` | Create or update with status variants |
| Dashboard layout | `src/app/(dashboard)/layout.tsx` | Update background, integrate new sidebar |

### Architectural Constraints

1. **No Breaking Changes:** All existing functionality must continue to work identically
2. **Component Library Preservation:** Continue using shadcn/ui; extend, don't replace
3. **Responsive Behavior:** Maintain existing breakpoint behavior (mobile < 640px, tablet 640-1024px, desktop > 1024px)
4. **Dark Mode Compatibility:** All new styles must include dark mode variants where currently used
5. **Accessibility:** Maintain existing WCAG 2.1 AA compliance; no regressions

## Detailed Design

### Services and Modules

This is a frontend-only epic. No backend services are modified.

| Module | File(s) | Responsibility | Changes |
|--------|---------|----------------|---------|
| **Layout Module** | `src/components/layout/` | App shell, navigation, responsive behavior | Header, Sidebar, MobileBottomNav refactors |
| **UI Components** | `src/components/ui/` | shadcn/ui primitives | Card, Button, Input, Badge, Select updates |
| **Page Components** | `src/app/(dashboard)/*/page.tsx` | Feature pages | Apply new styling patterns |

#### Header Module Changes

**Current Implementation:**
- Text-only "docuMINE" logo
- Horizontal nav links (Documents, Compare, AI Buddy, Reporting, Settings)
- Logout button in nav
- Mobile hamburger opens right-side Sheet

**Target Implementation:**
```tsx
// src/components/layout/header.tsx
<header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
  {/* Left: Mobile menu trigger + Logo */}
  <div className="flex items-center gap-3">
    <SidebarToggle className="lg:hidden" />  {/* Hamburger for sidebar */}
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">dM</span>
      </div>
      <span className="font-semibold text-lg">docuMINE</span>
    </Link>
  </div>

  {/* Right: Bell + Avatar */}
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" className="rounded-full">
      <Bell className="h-5 w-5 text-slate-500" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 rounded-full bg-slate-200">
          <span className="text-sm font-medium text-slate-600">{userInitials}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
```

#### Sidebar Module Changes

**Current Implementation:**
- Document list only
- slate-50 background
- "Documents" header
- SidebarToggle opens from header

**Target Implementation:**
```tsx
// src/components/layout/sidebar.tsx
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/quoting', label: 'Quoting', icon: Calculator },
  { href: '/ai-buddy', label: 'AI Buddy', icon: Bot },
  { href: '/reporting', label: 'Reporting', icon: BarChart2 },
];

<aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
  <nav className="flex-1 p-3 space-y-1">
    {navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive(item.href)
            ? 'bg-blue-50 text-primary'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <item.icon className="w-5 h-5" />
        {item.label}
      </Link>
    ))}
  </nav>
  <div className="p-3 border-t border-slate-200">
    <Link
      href="/settings"
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        isActive('/settings') ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      <Settings className="w-5 h-5" />
      Settings
    </Link>
  </div>
</aside>
```

### Data Models and Contracts

**No database changes.** This epic is purely frontend styling.

The only data-related consideration is that the notification bell in the header is a UI placeholder. Future notification functionality (Epic TBD) would require:
- `notifications` table (not part of this epic)
- API endpoints for notification retrieval (not part of this epic)

For now, the bell icon is decorative with `aria-label="Notifications (coming soon)"`.

### APIs and Interfaces

**No API changes.** All existing API contracts remain unchanged.

Component interfaces that may be extended:

```typescript
// Card component - add hover variant
interface CardProps {
  // Existing props
  hoverable?: boolean;  // NEW: applies hover:border-slate-300 hover:shadow-sm
}

// Badge component - add status variants
type BadgeVariant =
  | 'default'      // bg-slate-100 text-slate-600
  | 'success'      // bg-green-100 text-green-700
  | 'warning'      // bg-amber-100 text-amber-700
  | 'error'        // bg-red-100 text-red-700
  | 'info'         // bg-blue-100 text-blue-700
  | 'purple';      // bg-purple-100 text-purple-700

// Button component - ensure rounded-lg default
// No interface changes, just className defaults
```

### Workflows and Sequencing

#### Implementation Order

```
Story DR.1 (Header) ─────────────────────────────────────────┐
                                                              │
Story DR.2 (Sidebar) ←─── depends on DR.1 (SidebarToggle) ───┤
                                                              │
Story DR.3 (Page Layout) ←─── depends on DR.2 ────────────────┤
                                                              │
┌─────────────────────────────────────────────────────────────┤
│                                                             │
├── Story DR.4 (Cards) ←─── depends on DR.3                   │
│                                                             │
├── Story DR.5 (Buttons) ←─── depends on DR.3 (parallel OK)   │
│                                                             │
└── Story DR.6 (Inputs) ←─── depends on DR.5 (form context)   │
                                                              │
├── Story DR.7 (Badges) ←─── depends on DR.4 (used in cards)  │
│                                                             │
└── Story DR.8 (Typography) ←─── depends on DR.3              │
                                                              │
Story DR.9 (Mobile) ←─── depends on DR.2 ─────────────────────┤
                                                              │
Story DR.10 (Pages Sweep) ←─── depends on ALL above ──────────┘
```

#### Parallelization Opportunities

- **DR.4 + DR.5** can be worked in parallel (independent component updates)
- **DR.6 + DR.7** can be worked in parallel after DR.5
- **DR.8** can start once DR.3 establishes layout patterns
- **DR.9** can start once DR.2 establishes navigation patterns

#### Component Update Flow

For each page update in DR.10:
1. Update page wrapper background (bg-slate-50)
2. Update content container (max-w-5xl mx-auto p-6)
3. Update page header typography
4. Update card components to use new variants
5. Update buttons to use correct variants
6. Update any badges to use new status variants
7. Test responsive behavior
8. Test dark mode (no regressions)

## Non-Functional Requirements

### Performance

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint | < 1.5s (no regression) | No new blocking resources added |
| Largest Contentful Paint | < 2.5s (no regression) | Logo icon is inline SVG/text, not image |
| Cumulative Layout Shift | < 0.1 (no regression) | Sidebar width fixed at w-56; no layout jumps |
| Bundle Size | < 5KB increase | Only CSS class changes, minimal new JS |
| Navigation Transition | < 100ms | CSS transitions only, no heavy animations |

**Performance Strategies:**
- All new styling uses Tailwind CSS (compiled at build time, no runtime cost)
- Logo icon is inline JSX, not an image fetch
- No new third-party dependencies required
- Sidebar navigation items use Lucide icons (already in bundle)

### Security

**No security changes.** This epic is purely visual.

- No new API endpoints
- No changes to authentication flow (logout moves to dropdown, same action)
- No changes to data access patterns
- No new user inputs that could introduce XSS vectors
- Avatar dropdown uses existing shadcn/ui DropdownMenu (already sanitized)

### Reliability/Availability

**No reliability changes.** This epic does not affect:
- Database availability
- API endpoint reliability
- Supabase real-time connections
- Error handling patterns

**Degradation Behavior:**
- If CSS fails to load, the app remains functional (just unstyled)
- Navigation links remain accessible even if styling breaks
- No JavaScript-dependent navigation (all links are standard `<a>` tags)

### Observability

**No new observability requirements.** Existing patterns remain:
- Console errors for component failures (React error boundaries)
- Network tab for debugging CSS loading
- Lighthouse scores for performance regression detection

**Testing Observability:**
- Visual regression testing (recommended: Playwright screenshots)
- Component-level tests for navigation active states
- E2E tests for navigation flows

## Dependencies and Integrations

### Existing Dependencies (No Changes)

All dependencies are already in `package.json`. No new packages required.

| Dependency | Version | Usage in This Epic |
|------------|---------|-------------------|
| `tailwindcss` | ^4 | All styling (CSS classes) |
| `lucide-react` | ^0.554.0 | Navigation icons (Home, FileText, Calculator, etc.) |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Avatar dropdown menu |
| `class-variance-authority` | ^0.7.1 | Badge variants |
| `clsx` / `tailwind-merge` | ^2.1.1 / ^3.4.0 | className utilities |

### Component Library (shadcn/ui)

Existing shadcn/ui components to be modified:

| Component | Source | Modification |
|-----------|--------|--------------|
| `Button` | `src/components/ui/button.tsx` | Update border-radius default to rounded-lg |
| `Card` | `src/components/ui/card.tsx` | Add hoverable variant, update border color |
| `Input` | `src/components/ui/input.tsx` | Update focus ring styles |
| `Badge` | `src/components/ui/badge.tsx` | Add status color variants |
| `Select` | `src/components/ui/select.tsx` | Update border/focus to match inputs |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | Used as-is for avatar menu |

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Supabase Auth | Avatar initials | Use existing `user.email` to derive initials |
| Next.js Router | `usePathname()` | Determine active nav state |
| next-themes | Dark mode | Ensure new classes have dark: variants |

### New Icons Required

From lucide-react (already installed):

```typescript
import {
  Home,        // Dashboard
  FileText,    // Documents
  BarChart3,   // Compare
  Calculator,  // Quoting
  Bot,         // AI Buddy (already used)
  BarChart2,   // Reporting (already used)
  Settings,    // Settings
  Bell,        // Notifications (placeholder)
  LogOut,      // Logout (already used)
  Menu,        // Mobile hamburger (already used)
} from 'lucide-react';
```

## Acceptance Criteria (Authoritative)

### DR.1 - Header Redesign

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.1.1 | Header displays blue square logo (w-8 h-8, bg-primary, rounded-lg) with "dM" text inside |
| DR.1.2 | "docuMINE" text appears next to logo with font-semibold text-lg styling |
| DR.1.3 | Logo + text links to `/dashboard` |
| DR.1.4 | Notification bell icon appears on right side of header |
| DR.1.5 | User avatar circle displays user initials (derived from email) |
| DR.1.6 | Clicking avatar opens dropdown menu with "Logout" option |
| DR.1.7 | Horizontal navigation links are removed from header |
| DR.1.8 | Header height is h-14 (56px) |
| DR.1.9 | Header has white background with slate-200 bottom border |
| DR.1.10 | Mobile hamburger menu opens sidebar (not separate Sheet menu) |

### DR.2 - Sidebar Navigation

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.2.1 | Sidebar width is w-56 (224px) on desktop |
| DR.2.2 | Sidebar has white background (bg-white) and slate-200 right border |
| DR.2.3 | Navigation includes: Dashboard, Documents, Compare, Quoting, AI Buddy, Reporting |
| DR.2.4 | Settings appears at bottom with border-t separator |
| DR.2.5 | Each nav item displays icon (w-5 h-5) + text label (text-sm font-medium) |
| DR.2.6 | Active nav item has bg-blue-50 background and text-primary color |
| DR.2.7 | Hover state on nav items shows bg-slate-100 |
| DR.2.8 | Nav items use: `flex items-center gap-3 px-3 py-2 rounded-lg` |
| DR.2.9 | Sidebar is always visible on desktop (lg: breakpoint) |
| DR.2.10 | Sidebar slides in from left on tablet/mobile when triggered |

### DR.3 - Page Layout & Background

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.3.1 | Main content area has bg-slate-50 background |
| DR.3.2 | Content uses max-w-5xl mx-auto centering (or max-w-4xl where appropriate) |
| DR.3.3 | Page padding is p-6 |
| DR.3.4 | Page titles use text-2xl font-semibold text-slate-900 |
| DR.3.5 | Subtitles use text-slate-500 text-sm mt-1 |

### DR.4 - Card & Border Consistency

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.4.1 | Cards have bg-white background |
| DR.4.2 | Cards have border border-slate-200 |
| DR.4.3 | Cards have rounded-lg corners |
| DR.4.4 | Clickable cards have hover:border-slate-300 hover:shadow-sm transition-all |
| DR.4.5 | Card padding is p-4 or p-6 (context-dependent) |

### DR.5 - Button Standardization

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.5.1 | Primary buttons: bg-primary hover:bg-primary-hover text-white rounded-lg |
| DR.5.2 | Secondary buttons: border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg |
| DR.5.3 | All buttons use px-4 py-2 text-sm font-medium |
| DR.5.4 | Icon buttons use p-2 rounded-lg (or rounded-full for circular) |
| DR.5.5 | All buttons include transition-colors for smooth hover |

### DR.6 - Form Input Refinement

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.6.1 | Inputs have border border-slate-200 rounded-lg |
| DR.6.2 | Inputs have px-3 py-2 text-sm styling |
| DR.6.3 | Focus state: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary |
| DR.6.4 | Labels use text-sm font-medium text-slate-700 mb-1 |
| DR.6.5 | Required field indicator: `<span className="text-red-500">*</span>` |
| DR.6.6 | Select dropdowns match input styling |

### DR.7 - Badge System

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.7.1 | Badge base: px-2 py-0.5 rounded text-xs font-medium |
| DR.7.2 | Default (draft): bg-slate-100 text-slate-600 |
| DR.7.3 | In Progress: bg-amber-100 text-amber-700 |
| DR.7.4 | Complete/Success: bg-green-100 text-green-700 |
| DR.7.5 | Info/Type: bg-blue-100 text-blue-700 |
| DR.7.6 | Bundle/Special: bg-purple-100 text-purple-700 |
| DR.7.7 | Error/Warning: bg-red-100 text-red-700 |

### DR.8 - Typography & Spacing

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.8.1 | Page title: text-2xl font-semibold text-slate-900 |
| DR.8.2 | Section title: text-lg font-medium text-slate-900 |
| DR.8.3 | Card title: font-medium text-slate-900 |
| DR.8.4 | Body text: text-sm text-slate-600 |
| DR.8.5 | Muted text: text-sm text-slate-500 |
| DR.8.6 | Labels: text-sm font-medium text-slate-700 |
| DR.8.7 | Section gaps use space-y-6 |
| DR.8.8 | Card content uses p-4 or p-6 |
| DR.8.9 | Form field gaps use space-y-4 |

### DR.9 - Mobile Navigation

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.9.1 | Mobile sidebar Sheet has same nav items as desktop |
| DR.9.2 | Mobile sidebar opens from left side |
| DR.9.3 | Mobile bottom nav includes: Documents, Compare, Quoting, AI Buddy, Reports, Settings |
| DR.9.4 | Mobile bottom nav uses consistent icons with sidebar |
| DR.9.5 | Active states match desktop styling |

### DR.10 - Existing Pages Update

| AC ID | Acceptance Criteria |
|-------|---------------------|
| DR.10.1 | Dashboard page uses new patterns (bg-slate-50, cards, typography) |
| DR.10.2 | Documents list uses new card hover states |
| DR.10.3 | Document detail uses consistent header/back button styling |
| DR.10.4 | Compare page uses new card and button styling |
| DR.10.5 | AI Buddy uses consistent chat styling |
| DR.10.6 | Reporting uses new card and form styling |
| DR.10.7 | Settings uses new section cards and form styling |
| DR.10.8 | No visual regressions in dark mode |
| DR.10.9 | All pages responsive at all breakpoints |

## Traceability Mapping

This epic is a design/UX improvement and does not map to PRD functional requirements. Traceability is to the design reference and existing components.

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| DR.1.1-1.3 | Header Module Changes | `header.tsx` | Render test: logo icon visible, link href correct |
| DR.1.4-1.6 | Header Module Changes | `header.tsx` | Render test: bell icon present, avatar dropdown works |
| DR.1.7-1.10 | Header Module Changes | `header.tsx` | E2E: nav links removed, mobile hamburger opens sidebar |
| DR.2.1-2.4 | Sidebar Module Changes | `sidebar.tsx` | Render test: all nav items present, Settings at bottom |
| DR.2.5-2.8 | Sidebar Module Changes | `sidebar.tsx` | Render test: icon + label styling, active state classes |
| DR.2.9-2.10 | Sidebar Module Changes | `sidebar.tsx` | E2E: responsive behavior at breakpoints |
| DR.3.1-3.5 | Page Layout | `layout.tsx`, page files | Visual test: background color, centering, typography |
| DR.4.1-4.5 | Card Styling | `card.tsx` | Unit test: hoverable variant applies correct classes |
| DR.5.1-5.5 | Button Styling | `button.tsx` | Unit test: variant classes correct |
| DR.6.1-6.6 | Form Input Refinement | `input.tsx`, `select.tsx` | Unit test: focus state classes present |
| DR.7.1-7.7 | Badge System | `badge.tsx` | Unit test: all variants render with correct colors |
| DR.8.1-8.9 | Typography & Spacing | All pages | Visual regression test |
| DR.9.1-9.5 | Mobile Navigation | `sidebar.tsx` (MobileBottomNav) | E2E: mobile nav works, all items present |
| DR.10.1-10.9 | Existing Pages Update | All page files | E2E: navigate all pages, no errors, responsive |

### Design Reference Traceability

| Design Element | Mockup Location | Implementation Target |
|----------------|-----------------|----------------------|
| Header layout | `quoting-mockup.html` lines 77-102 | `src/components/layout/header.tsx` |
| Sidebar navigation | `quoting-mockup.html` lines 106-149 | `src/components/layout/sidebar.tsx` |
| Card styling | `quoting-mockup.html` lines 193-217 | `src/components/ui/card.tsx` |
| Button styling | `quoting-mockup.html` lines 163, 389-400 | `src/components/ui/button.tsx` |
| Input styling | `quoting-mockup.html` lines 329-346 | `src/components/ui/input.tsx` |
| Badge styling | `quoting-mockup.html` lines 205-206, 229-230 | `src/components/ui/badge.tsx` |
| Typography | `quoting-mockup.html` lines 159-161 | Global patterns |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Visual regression in untested areas** | Medium | Medium | Use Playwright screenshot comparison; test all pages manually |
| **Dark mode styling breaks** | Medium | Low | Add dark: variants to all new classes; test toggle |
| **Mobile navigation regression** | Low | Medium | Test on actual mobile devices, not just browser resize |
| **Sidebar width causes layout issues** | Low | Medium | Test split-view layouts (Documents page) carefully |
| **Breaking existing component tests** | Medium | Low | Update test snapshots; review failing tests individually |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| All pages use the dashboard layout | Verified: all authenticated pages use `(dashboard)/layout.tsx` |
| Existing shadcn/ui components support customization | Verified: components use CVA and accept className overrides |
| Tailwind v4 supports all required classes | Verified: all classes exist in Tailwind CSS |
| Lucide icons are tree-shaken | Verified: only imported icons are bundled |
| Dark mode is not heavily used | Dark mode exists but users primarily use light mode |

### Open Questions

| Question | Resolution |
|----------|------------|
| Should Dashboard be a separate route or redirect to Documents? | **Decision needed:** Currently `/dashboard` doesn't exist; users land on `/documents`. The mockup shows Dashboard as a nav item. Options: (1) Create simple dashboard page, (2) Remove Dashboard from nav and keep Documents as home. **Recommendation:** Create minimal dashboard that shows "Welcome" and links to recent activity. |
| Should the Quoting nav item link to a placeholder page? | **Decision needed:** Quoting feature doesn't exist yet. Options: (1) Link to `/quoting` placeholder, (2) Show "Coming Soon" badge on nav item, (3) Don't add until Quoting epic starts. **Recommendation:** Add nav item linking to placeholder page with "Coming Soon" message. |
| Should notification bell have a popover or just be decorative? | **Recommendation:** Decorative only for now, with `aria-label="Notifications (coming soon)"`. Full notifications are future scope. |
| How to handle document sidebar in the new nav model? | **Clarification:** The new sidebar is app navigation. Document list remains in the split-view left panel on `/documents` pages, separate from the nav sidebar. Both can coexist. |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage |
|-------|-------|-----------|----------|
| **Unit Tests** | Component render, variants, props | Vitest + Testing Library | All modified UI components |
| **Integration Tests** | Layout composition, navigation state | Vitest + Testing Library | Header, Sidebar, Layout |
| **E2E Tests** | Full navigation flows, responsive | Playwright | All pages, mobile/desktop |
| **Visual Regression** | Screenshot comparison | Playwright | Key pages before/after |

### Unit Test Coverage

```typescript
// Example: Badge component test
describe('Badge', () => {
  it('renders default variant with slate colors', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass('bg-slate-100', 'text-slate-600');
  });

  it('renders success variant with green colors', () => {
    render(<Badge variant="success">Complete</Badge>);
    expect(screen.getByText('Complete')).toHaveClass('bg-green-100', 'text-green-700');
  });
});

// Example: Header component test
describe('Header', () => {
  it('renders logo with correct link', () => {
    render(<Header />);
    const logo = screen.getByRole('link', { name: /documine/i });
    expect(logo).toHaveAttribute('href', '/dashboard');
  });

  it('renders avatar dropdown with logout', async () => {
    render(<Header />);
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
```

### E2E Test Coverage

```typescript
// Example: Navigation E2E test
test('sidebar navigation works correctly', async ({ page }) => {
  await page.goto('/documents');

  // Verify sidebar visible on desktop
  await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

  // Navigate to AI Buddy
  await page.click('text=AI Buddy');
  await expect(page).toHaveURL('/ai-buddy');

  // Verify active state
  const aiBuddyLink = page.locator('[href="/ai-buddy"]');
  await expect(aiBuddyLink).toHaveClass(/bg-blue-50/);
  await expect(aiBuddyLink).toHaveClass(/text-primary/);
});

// Example: Mobile navigation E2E test
test('mobile navigation works correctly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/documents');

  // Sidebar hidden on mobile
  await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();

  // Bottom nav visible
  await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();

  // Navigate via bottom nav
  await page.click('[data-testid="mobile-bottom-nav"] >> text=AI Buddy');
  await expect(page).toHaveURL('/ai-buddy');
});
```

### Visual Regression Testing

```typescript
// Capture before/after screenshots
test('design refresh - documents page', async ({ page }) => {
  await page.goto('/documents');
  await expect(page).toHaveScreenshot('documents-page.png', {
    maxDiffPixelRatio: 0.01,
  });
});

test('design refresh - sidebar navigation', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('sidebar.png');
});
```

### Test Execution Plan

1. **Before starting implementation:** Run existing test suite, capture baseline
2. **Per story:** Write new unit tests for modified components
3. **After DR.2:** Add E2E tests for navigation
4. **After DR.10:** Full visual regression test suite
5. **Before merge:** All tests green, no visual regressions

### Edge Cases to Test

- Empty states (no documents, no conversations)
- Long text truncation in nav items
- Avatar with single-character initials
- Sidebar at exactly 1024px breakpoint (transition point)
- Dark mode toggle mid-session
- Keyboard navigation through sidebar
- Screen reader announces navigation correctly
