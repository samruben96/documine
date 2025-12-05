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
_For: Sam_
