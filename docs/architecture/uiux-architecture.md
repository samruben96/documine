# UI/UX Architecture

## Design Philosophy

docuMINE follows an "Invisible Technology" design philosophy - the interface should feel like a natural extension of the agent's workflow, not a new platform to master.

**Core Principles:**
1. **Zero Learning Curve** - Any agent can upload and ask questions within 60 seconds
2. **Trust Through Transparency** - Every answer shows its source with confidence indicators
3. **Speed You Can Feel** - Responses stream immediately, progress indicators during processing
4. **Respect Agent Expertise** - Collaborative language ("Here's what I found...") not authoritative
5. **Clean Over Clever** - Simple layouts, clear typography, obvious actions

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header (Banner)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ docuMINE | Documents | Compare | Settings | [User/Logout]           ││
│  └─────────────────────────────────────────────────────────────────────┘│
├──────────────────┬──────────────────────────┬───────────────────────────┤
│  Sidebar         │  Document Viewer         │  Chat Panel               │
│  (Complementary) │  (Main Content)          │  (Aside)                  │
│                  │                          │                           │
│  ┌────────────┐  │  ┌────────────────────┐  │  ┌─────────────────────┐  │
│  │ Search     │  │  │ PDF Controls       │  │  │ Chat Header         │  │
│  ├────────────┤  │  │ Page | Zoom        │  │  │ New Conversation    │  │
│  │ Doc List   │  │  ├────────────────────┤  │  ├─────────────────────┤  │
│  │ - Item     │  │  │                    │  │  │ Message History     │  │
│  │ - Item*    │  │  │ PDF Render         │  │  │ [User] Question     │  │
│  │ - Item     │  │  │                    │  │  │ [AI] Answer         │  │
│  │            │  │  │                    │  │  │   + Sources         │  │
│  ├────────────┤  │  │                    │  │  │   + Confidence      │  │
│  │ Upload Btn │  │  │                    │  │  ├─────────────────────┤  │
│  └────────────┘  │  └────────────────────┘  │  │ Input + Send        │  │
│                  │                          │  └─────────────────────┘  │
└──────────────────┴──────────────────────────┴───────────────────────────┘
* = Selected document (highlighted)

Mobile (< 768px): Tabs replace split view
┌─────────────────────────────┐
│ [Document] [Chat] tabs      │
├─────────────────────────────┤
│                             │
│  Active Tab Content         │
│                             │
└─────────────────────────────┘
```

## Component Hierarchy

```
src/components/
├── layout/
│   ├── header.tsx           # Top navigation bar
│   ├── sidebar.tsx          # Document list sidebar
│   └── split-view.tsx       # Responsive split layout
├── documents/
│   ├── document-list.tsx    # Document list container
│   ├── document-list-item.tsx # Individual document row
│   ├── document-viewer.tsx  # PDF viewer component
│   ├── upload-zone.tsx      # Drag-and-drop upload
│   ├── empty-state.tsx      # Empty state variants
│   └── connection-indicator.tsx # Realtime status
├── chat/
│   ├── chat-panel.tsx       # Chat container
│   ├── chat-message.tsx     # Individual message bubble
│   ├── chat-input.tsx       # Message input
│   ├── confidence-badge.tsx # Trust indicator
│   └── source-citation.tsx  # Clickable source links
└── ui/                      # shadcn/ui components
    ├── button.tsx
    ├── input.tsx
    ├── tooltip.tsx
    └── ...
```

## UI State Management

| State | Scope | Storage | Notes |
|-------|-------|---------|-------|
| Selected Document | URL | `params.id` | Deep-linkable |
| Current Page | Component | React state | Resets on doc change |
| Chat Messages | Hook | `useConversation` + DB | Persisted to Supabase |
| Upload Progress | Component | React state | Transient |
| Connection Status | Context | `RealtimeContext` | App-wide |
| Document List | Hook | `useDocuments` + SWR | Cached, revalidates |

## Responsive Breakpoints

```typescript
// Tailwind CSS breakpoints used
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet - switches to tabs
  lg: '1024px',  // Desktop - full split view
  xl: '1280px',  // Large desktop
};

// Layout behavior
if (width < 768px) {
  // Mobile: Tabs (Document | Chat)
  // Sidebar: Drawer (hamburger menu)
} else {
  // Desktop: Split view (Sidebar | PDF | Chat)
  // Sidebar: Always visible
}
```

## Trust Transparency UI Pattern

Every AI response displays:

```typescript
interface AIResponseDisplay {
  // Message content (streams in real-time)
  content: string;

  // Confidence indicator with color coding
  confidence: {
    level: 'high' | 'needs_review' | 'not_found' | 'conversational';
    icon: LucideIcon;
    color: string;  // Tailwind class
    label: string;
  };

  // Clickable source citations
  sources: {
    pageNumber: number;
    text: string;
    onClick: () => void;  // Navigates PDF
  }[];

  // Timestamp
  timestamp: Date;
}

// Confidence badge color scheme
const confidenceColors = {
  high: 'text-green-600 bg-green-50',
  needs_review: 'text-yellow-600 bg-yellow-50',
  not_found: 'text-gray-600 bg-gray-50',
  conversational: 'text-blue-600 bg-blue-50',
};
```

## Empty State Variants

```typescript
type EmptyStateVariant =
  | 'no-documents'      // First use: "Ready to analyze"
  | 'select-document'   // Has docs: "Select to get started"
  | 'no-results'        // Search: "No documents found"
  | 'processing'        // Doc processing: "Analyzing..."
  | 'error';            // Error: "Something went wrong"

// Each variant has: icon, headline, description, optional CTA
```

## Accessibility Requirements

Per WCAG 2.1 AA guidelines:

- **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation:** All interactive elements focusable
- **Screen Readers:** ARIA labels on icons, live regions for updates
- **Focus Indicators:** Visible focus rings on all interactive elements
- **Reduced Motion:** Respect `prefers-reduced-motion`

## Performance Targets (UI)

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | SSR, code splitting |
| Largest Contentful Paint | < 2.5s | Image optimization, lazy loading |
| Time to Interactive | < 3.5s | Minimal JS bundle |
| Cumulative Layout Shift | < 0.1 | Reserved space, font loading |
| AI Response Stream Start | < 2s | Streaming SSE |

## Design System

docuMINE's design system was established in the Design Refresh Epic (Epic DR, completed 2025-12-11). All components follow these patterns for visual consistency.

**Reference:** `docs/sprint-artifacts/epics/epic-design-refresh/tech-spec.md`

### Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | `bg-primary` (blue-600) | `bg-primary` |
| Background | `bg-slate-50` | `bg-slate-900` |
| Card | `bg-white` | `bg-slate-900` |
| Border | `border-slate-200` | `border-slate-700` |
| Text Primary | `text-slate-900` | `text-slate-100` |
| Text Secondary | `text-slate-600` | `text-slate-300` |
| Text Muted | `text-slate-500` | `text-slate-400` |

### Typography System

Centralized in `src/lib/typography.ts`:

```typescript
export const typography = {
  pageTitle: 'text-2xl font-semibold text-slate-900 dark:text-slate-100',
  sectionTitle: 'text-lg font-medium text-slate-900 dark:text-slate-100',
  cardTitle: 'font-medium text-slate-900 dark:text-slate-100',
  body: 'text-sm text-slate-600 dark:text-slate-300',
  muted: 'text-sm text-slate-500 dark:text-slate-400',
  label: 'text-sm font-medium text-slate-700 dark:text-slate-300',
} as const;
```

**Usage Pattern:**
```tsx
import { typography } from '@/lib/typography';

<h1 className={typography.pageTitle}>Documents</h1>
<p className={typography.body}>Upload your insurance documents</p>
```

### Spacing System

Centralized in `src/lib/typography.ts`:

```typescript
export const spacing = {
  section: 'space-y-6',      // Between major sections
  card: 'p-4',               // Standard card padding
  cardSpacious: 'p-6',       // Larger card padding
  cardCompact: 'p-4',        // Compact card padding
  form: 'space-y-4',         // Between form fields
} as const;
```

### Component Patterns

#### Card Component (`src/components/ui/card.tsx`)

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle className={typography.cardTitle}>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Hoverable card (clickable)
<Card hoverable>
  <CardContent>Clickable content</CardContent>
</Card>
```

**Styling:**
- Base: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg`
- Hoverable: `hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200 cursor-pointer`
- Default padding: `p-6` (via CardContent, CardHeader, CardFooter)

**Props:**
- `hoverable?: boolean` - Adds hover effects for clickable cards

#### Button Component (`src/components/ui/button.tsx`)

```tsx
// Primary button
<Button>Save Changes</Button>

// Secondary/Outline button
<Button variant="outline">Cancel</Button>

// Ghost button
<Button variant="ghost">Options</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

**Variants:**
- `default` (Primary): `bg-primary hover:bg-primary/90 text-white rounded-lg`
- `outline` (Secondary): `border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg`
- `ghost`: `hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100`
- `destructive`: `bg-destructive text-white hover:bg-destructive/90`
- All: `px-4 py-2 text-sm font-medium transition-colors`

**Sizes:**
- `default`: `h-9 px-4 py-2`
- `sm`: `h-8 px-3`
- `lg`: `h-10 px-6`
- `icon`: `size-9` (for icon-only buttons)
- `icon-sm`: `size-8`
- `icon-lg`: `size-10`

#### Badge Component (`src/components/ui/badge.tsx`)

```tsx
import { StatusBadge } from '@/components/ui/badge';

// Convenience component
<StatusBadge status="success">Complete</StatusBadge>
<StatusBadge status="progress">In Progress</StatusBadge>
<StatusBadge status="error">Failed</StatusBadge>

// Direct variant usage
<Badge variant="status-info">Quote</Badge>
```

**Status Variants:**
| Status | Variant | Light Mode | Dark Mode | Use Cases |
|--------|---------|-----------|-----------|-----------|
| Draft/Default | `status-default` | `bg-slate-100 text-slate-600` | `bg-slate-800 text-slate-400` | Draft, Pending, Not Started |
| In Progress | `status-progress` | `bg-amber-100 text-amber-700` | `bg-amber-900/30 text-amber-400` | Processing, In Progress, Analyzing |
| Success/Complete | `status-success` | `bg-green-100 text-green-700` | `bg-green-900/30 text-green-400` | Complete, Success, Done, Ready |
| Info/Type | `status-info` | `bg-blue-100 text-blue-700` | `bg-blue-900/30 text-blue-400` | Informational, Quote type indicators |
| Special/Bundle | `status-special` | `bg-purple-100 text-purple-700` | `bg-purple-900/30 text-purple-400` | Special states, Bundled items |
| Error/Warning | `status-error` | `bg-red-100 text-red-700` | `bg-red-900/30 text-red-400` | Error, Failed, Warning |

**Base Styling:** `px-2 py-0.5 rounded text-xs font-medium border-transparent`

**StatusType Union:**
```typescript
type StatusType = 'draft' | 'progress' | 'success' | 'info' | 'special' | 'error';
```

#### Form Input Component (`src/components/ui/input.tsx`)

```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { typography, spacing } from '@/lib/typography';

<div className={spacing.form}>
  <Label className={typography.label}>Email Address</Label>
  <Input type="email" placeholder="agent@agency.com" />
</div>
```

**Input Styling:**
- Base: `border border-slate-200 dark:border-slate-700 rounded-lg`
- Size: `h-9 px-3 py-2 text-sm`
- Background: `bg-transparent dark:bg-input/30`
- Focus state:
  - `focus:outline-none`
  - `focus:ring-2 focus:ring-primary/20`
  - `focus:border-primary dark:focus:border-primary`
- Transition: `transition-colors duration-200 ease-in-out`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`
- Invalid: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`

**Label Styling:**
- Typography: Uses `typography.label` utility
- Classes: `text-sm font-medium text-slate-700 dark:text-slate-300`

### Navigation Patterns

#### Header (`src/components/layout/header.tsx`)

```tsx
<header className="h-14 bg-white border-b border-slate-200">
  {/* Logo (left) */}
  <Link href="/dashboard">
    <div className="w-8 h-8 bg-primary rounded-lg">dM</div>
    <span className="font-semibold text-lg">docuMINE</span>
  </Link>

  {/* Actions (right) */}
  <Bell /> {/* Notification icon */}
  <DropdownMenu /> {/* User avatar */}
</header>
```

#### Sidebar (`src/components/layout/app-nav-sidebar.tsx`)

```tsx
<aside className="w-56 bg-white border-r border-slate-200">
  <nav className="flex-1 p-3 space-y-1">
    <Link className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
      isActive ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-100'
    )}>
      <Icon className="w-5 h-5" />
      Label
    </Link>
  </nav>
  <div className="border-t">Settings</div>
</aside>
```

**Navigation Items:**
- Dashboard (Home icon) → `/dashboard`
- Documents (FileText icon) → `/documents`
- Chat w/ Docs (MessageSquare icon) → `/chat-docs`
- Compare (BarChart3 icon) → `/compare`
- Quoting (Calculator icon) → `/quoting`
- AI Buddy (Bot icon) → `/ai-buddy`
- Reporting (BarChart2 icon) → `/reporting`
- Settings (Settings icon) → `/settings` (bottom separator)

**Active State:** `bg-blue-50 text-primary`
**Hover State:** `hover:bg-slate-100` (inactive only)

#### Mobile Bottom Navigation

```tsx
<nav className="fixed bottom-0 bg-white border-t h-16 flex justify-around">
  {items.map(item => (
    <Link className={cn(
      'flex flex-col items-center justify-center gap-1',
      isActive ? 'text-primary' : 'text-slate-500'
    )}>
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </Link>
  ))}
</nav>
```

### Page Layout Pattern

```tsx
import { typography, spacing } from '@/lib/typography';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Page() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className={typography.pageTitle}>Page Title</h1>
        <p className={cn(typography.muted, 'mt-1')}>Subtitle or description</p>

        <div className={spacing.section}>
          {/* Sections with space-y-6 gap */}
          <Card>
            <CardHeader>
              <CardTitle className={typography.cardTitle}>Section</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body}>Content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### Grid & Responsive Patterns

**Common Grid Layouts:**

```tsx
// 2-column responsive grid
<div className="grid gap-4 md:grid-cols-2">
  <Card>...</Card>
  <Card>...</Card>
</div>

// 3-column responsive grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Auto-fill responsive grid (for cards/items)
<div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
  <Card>...</Card>
  {/* Automatically wraps based on container width */}
</div>

// Flex layout with gaps
<div className="flex flex-col gap-4 md:flex-row">
  <Card className="flex-1">...</Card>
  <Card className="flex-1">...</Card>
</div>
```

**Breakpoint Strategy:**
- Mobile-first approach (default styles = mobile)
- `md:` prefix for tablet (≥768px)
- `lg:` prefix for desktop (≥1024px)
- `xl:` prefix for large desktop (≥1280px)

### Transition & Animation Standards

**Standard Transitions:**

```tsx
// Color/background transitions (most common)
className="transition-colors duration-200"

// Opacity transitions
className="transition-opacity duration-200"

// All properties (for complex animations)
className="transition-all duration-200"

// Custom timing
className="transition-colors duration-300 ease-in-out"
```

**Interaction Guidelines:**
- Keep transitions ≤ 300ms for responsive feel
- Use `ease-in-out` for bidirectional transitions (hover on/off)
- Use `transition-colors` for most UI interactions
- Avoid animating layout properties (width, height) when possible
- Use `transition-all` sparingly (performance consideration)

**Example Hover States:**

```tsx
// Button hover
<button className="bg-primary hover:bg-primary/90 transition-colors">
  Click me
</button>

// Card hover
<Card
  hoverable
  className="hover:border-slate-300 hover:shadow-sm transition-all duration-200"
>
  Content
</Card>

// Link hover
<Link className="text-primary hover:underline transition-all">
  Learn more
</Link>
```

### Dark Mode Guidelines

All new components must include dark mode variants:

```tsx
// Example: Explicit dark mode classes
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <p className="text-slate-600 dark:text-slate-300">Body text</p>
  <p className="text-slate-500 dark:text-slate-400">Muted text</p>
</div>
```

**Pattern:** Always pair light mode colors with explicit `dark:` variants. Never rely on CSS variable inheritance for critical UI elements.

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Focus Indicators | `focus:ring-2 focus:ring-primary/20 focus:outline-none` on all interactive elements |
| Color Contrast | 4.5:1 for normal text, 3:1 for large text (WCAG 2.1 AA) |
| Keyboard Navigation | All nav items, buttons, and forms accessible via keyboard |
| Screen Readers | ARIA labels on icons, live regions for dynamic updates |
| Touch Targets | Minimum 44px on mobile (buttons, nav items) |

### Best Practices

**When Building New Components:**

1. **Always use centralized utilities:**
   ```tsx
   import { typography, spacing } from '@/lib/typography';
   ```

2. **Use design system components:**
   ```tsx
   import { Card, Button, Badge, Input } from '@/components/ui';
   ```

3. **Include dark mode from the start:**
   ```tsx
   className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
   ```

4. **Apply consistent spacing:**
   ```tsx
   <div className={spacing.section}>  // Between sections
   <div className={spacing.form}>    // Between form fields
   <CardContent className={spacing.card}>  // Card padding
   ```

5. **Use semantic status badges:**
   ```tsx
   <StatusBadge status="success">Complete</StatusBadge>
   ```

**Common Anti-Patterns to Avoid:**

```tsx
// ❌ DON'T: Custom typography classes
<h1 className="text-xl font-bold text-gray-900">Title</h1>

// ✅ DO: Use typography utilities
<h1 className={typography.pageTitle}>Title</h1>

// ❌ DON'T: Custom card styling
<div className="bg-white border border-gray-200 rounded p-4">

// ✅ DO: Use Card component
<Card><CardContent>...</CardContent></Card>

// ❌ DON'T: Inconsistent button styles
<button className="bg-blue-500 px-3 py-1 rounded">

// ✅ DO: Use Button component
<Button variant="default">Click me</Button>

// ❌ DON'T: Missing dark mode
<div className="bg-white text-black">

// ✅ DO: Include dark mode
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

### Migration Guide for Existing Components

**Step-by-step migration process:**

1. **Import typography and spacing utilities:**
   ```tsx
   import { typography, spacing } from '@/lib/typography';
   ```

2. **Replace custom typography with utilities:**
   ```tsx
   // Before
   <h1 className="text-2xl font-semibold text-gray-900">
   // After
   <h1 className={typography.pageTitle}>
   ```

3. **Replace custom containers with Card:**
   ```tsx
   // Before
   <div className="bg-white border border-gray-200 rounded-lg p-6">
   // After
   <Card><CardContent>...</CardContent></Card>
   ```

4. **Replace custom buttons:**
   ```tsx
   // Before
   <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
   // After
   <Button>Save Changes</Button>
   ```

5. **Add dark mode support:**
   ```tsx
   // Before
   className="bg-white border-gray-200 text-gray-900"
   // After
   className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
   ```

6. **Use StatusBadge for status indicators:**
   ```tsx
   // Before
   <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
   // After
   <StatusBadge status="success">Complete</StatusBadge>
   ```

### Implementation Stories

The design system was implemented across 10 stories in Epic Design-Refresh:

| Story | Component/Pattern | Acceptance Criteria | Status |
|-------|------------------|---------------------|---------|
| DR.1 | Header Redesign | 56px height, logo + nav + user menu | Done |
| DR.2 | Sidebar Navigation | 224px width, active states, icons | Done |
| DR.3 | Page Layout & Background | bg-slate-50, consistent padding | Done |
| DR.4 | Card Border Consistency | border-slate-200, hoverable prop | Done |
| DR.5 | Button Standardization | Primary/secondary/ghost variants | Done |
| DR.6 | Form Input Refinement | Consistent borders, focus rings | Done |
| DR.7 | Badge & Status System | 6 status variants with dark mode | Done |
| DR.8 | Typography & Spacing | Centralized utilities in lib/typography.ts | Done |
| DR.9 | Mobile Navigation | Hamburger menu, drawer, bottom nav | Done |
| DR.10 | Existing Pages Update | All pages migrated to design system | Done |

**Epic Completion:** 2025-12-11

**Documentation:** Each story has comprehensive dev notes and context in `docs/sprint-artifacts/epics/epic-design-refresh/stories/`

**Testing:** All components have unit tests and E2E tests in `__tests__/` directory

## Research References

UI/UX decisions informed by research documented in:
- `docs/research-ui-best-practices-2025-12-02.md`

Key sources:
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [NN/g: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [AWS Cloudscape: Split View Pattern](https://cloudscape.design/patterns/resource-management/view/split-view/)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-24_
_Updated: 2025-12-02 (ADR-005, ADR-006 implemented; RAG pipeline production-ready; UI/UX Architecture added)_
_Updated: 2025-12-03 (ADR-007 added: GPT-5.1 for structured extraction in Epic 7)_
_Updated: 2025-12-04 (ADR-008 proposed: Extraction at Upload Time - Story 10.12)_
_Updated: 2025-12-11 (Design System section added - Epic Design-Refresh completed)_
_For: Sam_
