# AI Buddy UX Design Specification

_Created on 2025-12-07 by Sam_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**AI Buddy** is a personalized AI assistant that transforms how independent insurance agents work - a feature module within docuMINE. Unlike generic AI chatbots, it's purpose-built for insurance with agency-level guardrails that protect producers while giving principals the compliance controls they need.

### Vision Statement
> "AI Buddy is the knowledgeable colleague that makes insurance agents more productive without threatening their client relationships."

### Two-Persona Model

| Persona | Role | Primary Need | Interface Focus |
|---------|------|--------------|-----------------|
| **Agent (Producer)** | Daily user, CSR | "This helps me" | Chat-first, minimal settings, personal assistant feel |
| **Admin (Principal)** | Agency owner/manager | "This protects us" | Dashboard, guardrails, audit trails, compliance controls |

### Core Value Propositions

**For Agents:**
- Instant, context-aware answers to insurance questions
- Client account organization through Projects
- Document-attached conversations for policy-specific queries
- Learns preferences over time (carriers, communication style)

**For Principals:**
- E&O protection through enforced guardrails
- Complete audit trail of all AI conversations
- Approved carriers only, restricted topics
- Usage visibility across all producers

### Platform
- **Type:** Web application (docuMINE feature module)
- **Tech Stack:** Next.js, Supabase, shadcn/ui (existing docuMINE infrastructure)
- **Access:** New route at `/ai-buddy` accessible from main navigation
- **Integration:** Leverages existing authentication, document storage, and design system

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Decision:** Extend existing **shadcn/ui** design system already used in docuMINE

**Rationale:**
- Consistent experience across all docuMINE features
- No additional learning curve for developers
- Battle-tested accessibility (Radix UI primitives)
- Component ownership - can customize for AI Buddy needs
- Trusted by OpenAI, Sonos, Adobe per [shadcn/ui](https://ui.shadcn.com/)

**What We Inherit:**
- Button variants (primary, secondary, ghost, destructive)
- Form components (Input, Textarea, Select, Checkbox, Switch)
- Layout components (Card, Sheet, Dialog, Tabs)
- Navigation patterns (Sidebar, Header)
- Typography scale and color tokens

**What We Add:**
- Chat message components (AI message, User message, streaming indicator)
- Project card component
- Document attachment component with status
- Confidence indicator badge
- Source citation link
- Admin guardrail toggle card

### 1.2 Color System

**Primary Palette (from existing docuMINE):**
- **Primary:** Electric Blue `#3b82f6` (oklch 0.59 0.2 255)
- **Primary Dark:** `#2563eb`
- **Primary Light:** `#60a5fa`

**AI Buddy Specific Colors:**

| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| AI Avatar | `#10b981` (green) | `#10b981` | AI message indicator |
| User Avatar | `#3b82f6` (blue) | `#3b82f6` | User message indicator |
| Confidence High | `#dcfce7` bg / `#166534` text | `rgba(16,185,129,0.2)` / `#10b981` | High confidence badge |
| Confidence Medium | `#fef3c7` bg / `#92400e` text | `rgba(245,158,11,0.2)` / `#f59e0b` | Needs review badge |
| Source Citation | `#3b82f6` | `#3b82f6` | Document reference links |

**ChatGPT-Style Dark Theme (AI Buddy Page):**

AI Buddy uses a dark theme inspired by ChatGPT for the main chat interface:

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-bg` | `#171717` | Sidebar background |
| `--sidebar-hover` | `#212121` | Sidebar item hover |
| `--sidebar-active` | `#2d2d2d` | Active sidebar item |
| `--chat-bg` | `#212121` | Chat area background |
| `--chat-surface` | `#2d2d2d` | Cards, input boxes |
| `--chat-border` | `#3d3d3d` | Dividers, borders |
| `--text-primary` | `#ececec` | Primary text |
| `--text-muted` | `#8e8e8e` | Secondary text |

**Interactive Visualizations:**
- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

---

## 2. Core User Experience

### 2.1 Defining Experience

**The One Thing:** Ask a question about a client's policy and get an accurate, sourced answer in seconds.

**What Makes AI Buddy Different:**
1. **Context Persistence** - AI knows the project, documents, and user preferences
2. **Invisible Guardrails** - Compliance without friction; agents never feel restricted
3. **Source Citations** - Every answer links to the document location
4. **Confidence Transparency** - Clear indicators when AI is certain vs. needs human review

**Design Principles (from PRD):**
1. **Invisible Guardrails** - Producers never feel restricted
2. **Context Persistence** - AI remembers conversation, project, preferences
3. **Speed First** - Streaming responses, instant switching, no loading states
4. **Trust Through Transparency** - Source citations, confidence, "I don't know" when appropriate
5. **Minimal Learning Curve** - ChatGPT-familiar patterns

### 2.2 Novel UX Patterns

**Pattern 1: Projects as Organizational Units**

Unlike ChatGPT's flat conversation history, AI Buddy organizes work by **Projects** (client accounts):

```
┌─────────────────────────────────────┐
│  PROJECTS                           │
│  ├── Johnson Family (3 docs)        │ ← Client account
│  │   ├── Progressive Policy.pdf     │
│  │   ├── Travelers Quote.pdf        │
│  │   └── Application.pdf            │
│  │                                   │
│  │   Conversations:                 │
│  │   ├── Coverage limits question   │
│  │   └── Quote comparison help      │
│  │                                   │
│  ├── Acme Corp Renewal (5 docs)     │
│  └── Smith Manufacturing (2 docs)   │
└─────────────────────────────────────┘
```

**Pattern 2: Invisible Guardrails**

When a guardrail is triggered, the AI responds helpfully without showing "BLOCKED" messages:

| Blocked Approach (Bad) | Invisible Guardrail (Good) |
|------------------------|----------------------------|
| "I cannot discuss Geico as it's not an approved carrier." | "Based on your agency's appointments, I'd recommend comparing Progressive and Travelers for this risk. Would you like me to pull up those quotes?" |

**Pattern 3: Confidence Indicators**

Every AI response includes a confidence level:

- **High Confidence** (green) - Information found in attached documents
- **Needs Review** (amber) - Based on general knowledge, verify before using
- **Not Found** (gray) - Information not available in context

**Pattern 4: Source Citations**

Inline citations link directly to document locations:

```
The liability limit is 100/300/100 [📄 Progressive Policy pg. 3]
```

Clicking the citation scrolls to that location in the document viewer.

---

## 3. Visual Foundation

### 3.1 ChatGPT-Style Interface

AI Buddy adopts a **ChatGPT-inspired dark interface** for the main chat experience:

**Layout Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [Menu] docuMINE    [Documents] [Compare] [AI Buddy] [Settings]  │
├────────────────────┬─────────────────────────────────────────────┤
│                    │                                             │
│  + New Chat        │          🤖 AI Buddy · Johnson Family        │
│                    │                                             │
│  PROJECTS          │  ┌─────────────────────────────────────┐    │
│  ┌──────────────┐  │  │ AI: Hi! I see you're working on...  │    │
│  │ JF Johnson   │◀─│  └─────────────────────────────────────┘    │
│  │ Family       │  │                                             │
│  └──────────────┘  │  ┌─────────────────────────────────────┐    │
│  ┌──────────────┐  │  │ You: What's the liability limit...  │    │
│  │ AC Acme Corp │  │  └─────────────────────────────────────┘    │
│  └──────────────┘  │                                             │
│                    │  ┌─────────────────────────────────────┐    │
│  RECENT            │  │ AI: The current policy has 100/300  │    │
│  └ Coverage limits │  │ [📄 Source] [✓ High Confidence]      │    │
│  └ Quote analysis  │  └─────────────────────────────────────┘    │
│                    │                                             │
│  ┌──────────────┐  │  ┌─────────────────────────────────────┐    │
│  │ 👤 User      │  │  │ [📎] Message AI Buddy...        [↑] │    │
│  │ Pro Plan     │  │  └─────────────────────────────────────┘    │
│  └──────────────┘  │                                             │
└────────────────────┴─────────────────────────────────────────────┘
```

**Key Visual Elements:**

| Element | Description |
|---------|-------------|
| **Sidebar** | Dark (`#171717`), contains Projects list and chat history |
| **Chat Area** | Dark gray (`#212121`), messages centered at max 768px width |
| **Messages** | Avatar + content, AI has green avatar, User has blue avatar |
| **Input** | Rounded input box with attach button and send arrow |
| **Citations** | Blue links inline with responses |

**Interactive Mockups:**
- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Selected Direction:** ChatGPT-Style with Projects

**Why This Direction:**
1. **Zero learning curve** - Users instantly know how to use it
2. **Proven pattern** - ChatGPT has trained billions of users on this interface
3. **Projects add value** - Organizing by client account fits insurance workflow
4. **Document awareness** - Optional right panel shows context documents
5. **Dark theme** - Modern, focused, reduces eye strain for daily use

**Deferred Options:**
- Light theme option (consider for v2 based on user feedback)
- Split-screen document viewer (complex, evaluate after MVP)
- Voice input (future enhancement)

### 4.2 Page Structure

**New Route: `/ai-buddy`**

Added to existing docuMINE navigation:
- Documents → Compare → **AI Buddy** → Settings

**Components:**
1. **Sidebar** (260px) - Projects list, chat history, user menu
2. **Chat Area** (flex) - Message stream, centered content
3. **Document Panel** (300px, optional) - Project documents, collapsible

**Mobile Adaptation:**
- Sidebar becomes sheet overlay (tap hamburger)
- Full-screen chat on mobile
- Document panel accessed via button, opens as sheet
- Bottom nav includes "AI Buddy" icon

---

## 5. User Journey Flows

### 5.1 Critical User Paths

#### Journey 1: First-Time User Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│                       ONBOARDING FLOW                           │
│                         (< 2 minutes)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Welcome                                                │
│  ┌─────────────────────────────────────┐                       │
│  │ 👋 Welcome to AI Buddy              │                       │
│  │                                      │                       │
│  │ Your personal insurance assistant.  │                       │
│  │ Let's personalize your experience.  │                       │
│  │                                      │                       │
│  │ [Get Started]  [Skip for now]       │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  Step 2: Lines of Business                                      │
│  ┌─────────────────────────────────────┐                       │
│  │ What do you work on most?           │                       │
│  │                                      │                       │
│  │ [Personal Auto] [Homeowners]        │ ← Chip selection      │
│  │ [Commercial] [Life] [Health]        │                       │
│  │                                      │                       │
│  │ [Continue →]                        │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  Step 3: Preferred Carriers                                     │
│  ┌─────────────────────────────────────┐                       │
│  │ Your go-to carriers                 │                       │
│  │                                      │                       │
│  │ [Progressive] [Travelers] [Hartford]│                       │
│  │ [Safeco] [Liberty] [Nationwide]     │                       │
│  │                                      │                       │
│  │ [Start Chatting →]                  │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  → Immediately show personalized AI greeting                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Journey 2: Starting a Conversation

```
User lands on AI Buddy
    │
    ▼
┌─────────────────────────────────────┐
│ Is there an active Project?         │
└─────────────────────────────────────┘
    │               │
    Yes             No
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────────────┐
│ Resume  │   │ Create new Project  │
│ context │   │ OR start general    │
│         │   │ chat (no project)   │
└─────────┘   └─────────────────────┘
    │               │
    └───────┬───────┘
            ▼
┌─────────────────────────────────────┐
│ Type message in input box           │
│ Optional: Attach document           │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│ AI responds with streaming text     │
│ • Shows source citations            │
│ • Shows confidence indicator        │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│ Continue conversation OR            │
│ Switch to different Project         │
└─────────────────────────────────────┘
```

#### Journey 3: Admin Configuring Guardrails

```
Admin navigates to Settings → AI Buddy
    │
    ▼
┌─────────────────────────────────────┐
│ See current guardrail status        │
│ • Approved Carriers Only: ON        │
│ • E&O Disclosure: ON                │
│ • State Compliance Warnings: ON     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Configure Approved Carriers         │
│ [Progressive] [Travelers] [+ Add]   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Configure Restricted Topics         │
│ [Legal advice] [Claims] [+ Add]     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Changes save immediately            │
│ Apply to all producers in agency    │
└─────────────────────────────────────┘
```

#### Journey 4: Reviewing Audit Log

```
Admin navigates to Settings → Audit Log
    │
    ▼
┌─────────────────────────────────────┐
│ Filter controls:                    │
│ [User ▼] [Date Range] [Search...]   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ List of conversations:              │
│ ┌─────────────────────────────────┐ │
│ │ Sarah J. · Johnson Family       │ │
│ │ Dec 7, 2:34 PM · 5 messages     │ │
│ │ [View Transcript]               │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Mike R. · Acme Corp             │ │
│ │ Dec 7, 11:15 AM · 3 messages    │ │
│ │ [View Transcript]               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ View read-only transcript           │
│ See guardrail events if any         │
│ [Export PDF] [Export CSV]           │
└─────────────────────────────────────┘
```

---

## 6. Component Library

### 6.1 Component Strategy

**Approach:** Extend shadcn/ui with AI Buddy-specific components

#### Core Chat Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ChatMessage` | Single message bubble | `variant: 'ai' \| 'user'`, `content`, `citations?`, `confidence?` |
| `ChatMessageList` | Scrollable message container | `messages[]`, `isLoading` |
| `ChatInput` | Text input with actions | `onSend`, `onAttach`, `placeholder`, `disabled` |
| `StreamingIndicator` | Thinking/typing animation | `isVisible` |
| `SourceCitation` | Clickable document reference | `documentName`, `pageNumber`, `onClick` |
| `ConfidenceBadge` | High/Medium/Low indicator | `level: 'high' \| 'medium' \| 'low'` |

#### Project Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ProjectCard` | Sidebar project item | `name`, `documentCount`, `isActive`, `onClick` |
| `ProjectList` | List of user's projects | `projects[]`, `activeId`, `onSelect` |
| `NewProjectButton` | Create project CTA | `onClick` |
| `ChatHistoryItem` | Past conversation link | `title`, `timestamp`, `onClick` |

#### Document Components

| Component | Description | Props |
|-----------|-------------|-------|
| `DocumentCard` | Document in project panel | `name`, `type`, `status`, `onClick` |
| `DocumentPanel` | Right sidebar for docs | `documents[]`, `onUpload` |
| `DocumentUploadZone` | Drag-drop upload area | `onFilesAccepted` |

#### Admin Components

| Component | Description | Props |
|-----------|-------------|-------|
| `GuardrailToggle` | Setting with description + switch | `title`, `description`, `enabled`, `onChange` |
| `CarrierTagList` | Editable carrier chips | `carriers[]`, `onAdd`, `onRemove` |
| `TopicTagList` | Restricted topics chips | `topics[]`, `onAdd`, `onRemove` |
| `AuditLogEntry` | Conversation summary row | `user`, `project`, `timestamp`, `messageCount` |
| `UsageStatCard` | Metric display card | `value`, `label`, `trend?` |

#### Onboarding Components

| Component | Description | Props |
|-----------|-------------|-------|
| `OnboardingCard` | Centered card container | `children`, `step`, `totalSteps` |
| `ChipSelect` | Multi-select chip group | `options[]`, `selected[]`, `onChange` |
| `ProgressSteps` | Step indicator bar | `current`, `total` |

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

#### Navigation

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| Primary nav location | Header (existing) | Consistent with docuMINE |
| AI Buddy nav item | Between "Compare" and "Settings" | Logical grouping |
| Mobile nav | Bottom bar + hamburger for sidebar | Matches existing mobile patterns |
| Sidebar toggle | Sheet on mobile/tablet, always visible on desktop | Responsive design |

#### Feedback Patterns

| Interaction | Feedback | Timing |
|-------------|----------|--------|
| Message sent | Input clears, message appears | Immediate |
| AI responding | Streaming text animation | < 500ms start |
| Document uploaded | Progress bar → success toast | During upload |
| Guardrail saved | No toast (instant save) | Immediate |
| Error | Toast notification | On error |

#### Button Hierarchy

| Type | Usage | Style |
|------|-------|-------|
| Primary | Main actions (Send, Create Project) | Filled, Electric Blue |
| Secondary | Alternative actions (Cancel, Skip) | Outline |
| Ghost | Tertiary actions (Attach, Settings) | Text only |
| Destructive | Dangerous actions (Delete) | Red fill |

#### Form Patterns

| Element | Pattern |
|---------|---------|
| Labels | Above inputs, always visible |
| Validation | On blur, inline error below field |
| Required fields | No asterisk, just validate |
| Help text | Muted text below label or input |
| Disabled state | 50% opacity, no pointer events |

#### Empty States

| State | Content |
|-------|---------|
| No projects | "Create your first project" + CTA |
| No conversations | AI greeting with suggestions |
| No documents | Upload zone with prompt |
| No search results | "No matches found" + clear button |

### 7.2 Interaction Patterns

#### Chat Input Behavior

- Enter sends message (Shift+Enter for newline)
- Input auto-expands up to 4 lines, then scrolls
- Attach button opens file picker (PDF, images)
- Send button disabled when input empty

#### Project Switching

- Click project in sidebar → immediate switch
- Current conversation saved automatically
- Context switches to selected project's documents
- AI acknowledges context change in next response

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open project search |
| `Cmd/Ctrl + N` | New chat |
| `Cmd/Ctrl + Shift + N` | New project |
| `Escape` | Close modal/sheet |

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

#### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column, bottom nav, sheet sidebar |
| Tablet | 640-1024px | Collapsible sidebar, no doc panel |
| Desktop | > 1024px | Full layout, sidebar + chat + doc panel |

#### Mobile Adaptations

```
MOBILE LAYOUT (< 640px)
┌─────────────────────────┐
│ [≡] AI Buddy        [📎]│  ← Header with menu
├─────────────────────────┤
│                         │
│    Chat Messages        │  ← Full width
│    (scrollable)         │
│                         │
├─────────────────────────┤
│ [📎] Type message... [↑]│  ← Fixed input
├─────────────────────────┤
│ [📄][📊][💬][⚙️]        │  ← Bottom nav
└─────────────────────────┘

Sidebar: Sheet from left (hamburger tap)
Documents: Sheet from right (attach tap)
```

#### Tablet Adaptations

```
TABLET LAYOUT (640-1024px)
┌────────────────────────────────────────┐
│ docuMINE  [Docs][Compare][AI][Settings]│
├──────────┬─────────────────────────────┤
│          │                             │
│ Sidebar  │       Chat Area             │
│ (toggle) │                             │
│          │                             │
└──────────┴─────────────────────────────┘

Sidebar: Toggle button in header, slides in/out
Doc Panel: Hidden, access via header button
```

### 8.2 Accessibility Requirements

**WCAG 2.1 AA Compliance** (required for insurance industry)

#### Color Contrast

| Element | Requirement | Implementation |
|---------|-------------|----------------|
| Body text | 4.5:1 ratio | `#ececec` on `#212121` = 13.5:1 ✓ |
| Large text | 3:1 ratio | All headings pass |
| Interactive | 3:1 ratio | Blue links pass |
| Focus ring | Visible | 2px solid Electric Blue |

#### Keyboard Navigation

- All interactive elements focusable via Tab
- Enter/Space activates buttons
- Arrow keys navigate lists
- Focus trap in modals
- Skip links for main content

#### Screen Reader Support

- Semantic HTML (main, nav, article, aside)
- ARIA labels on icon buttons
- Live regions for streaming messages
- `role="log"` on chat message list
- Announce new messages with `aria-live="polite"`

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

#### Touch Targets

- Minimum 44x44px for all interactive elements
- Adequate spacing between tap targets
- Larger hit areas on mobile

---

## 9. Implementation Guidance

### 9.1 Route Structure

```
src/app/(dashboard)/
├── ai-buddy/
│   ├── page.tsx              # Main AI Buddy interface
│   ├── [projectId]/
│   │   └── page.tsx          # Project-specific view
│   └── actions.ts            # Server actions
├── settings/
│   └── page.tsx              # Add AI Buddy tab
```

### 9.2 Component File Structure

```
src/components/
├── ai-buddy/
│   ├── chat-message.tsx
│   ├── chat-message-list.tsx
│   ├── chat-input.tsx
│   ├── streaming-indicator.tsx
│   ├── source-citation.tsx
│   ├── confidence-badge.tsx
│   ├── project-sidebar.tsx
│   ├── project-card.tsx
│   ├── document-panel.tsx
│   └── index.ts              # Barrel export
├── settings/
│   ├── ai-buddy-tab.tsx      # Admin settings
│   ├── guardrail-toggle.tsx
│   ├── carrier-tag-list.tsx
│   └── audit-log-entry.tsx
```

### 9.3 State Management

- **Chat state:** React state + optimistic updates
- **Projects:** Server state (React Query or SWR)
- **Documents:** Reuse existing docuMINE document hooks
- **User preferences:** Database-backed, loaded on mount
- **Admin settings:** Database-backed, agency-scoped

### 9.4 Integration Points

| System | Integration |
|--------|-------------|
| Authentication | Existing Supabase Auth |
| Document Storage | Existing Supabase Storage |
| AI Provider | OpenAI/Anthropic API (configurable) |
| Realtime | Supabase Realtime for streaming |
| Analytics | Existing analytics pipeline |

### 9.5 Performance Targets

| Metric | Target |
|--------|--------|
| First response streaming | < 500ms |
| Project switch | < 200ms |
| Document upload feedback | Immediate |
| Search results | < 1s |
| Full page load | < 2s |

---

## 10. Summary

### Key Decisions

1. **ChatGPT-style interface** with dark theme for familiarity
2. **Projects replace conversations** as organizational unit
3. **Invisible guardrails** - compliance without friction
4. **Source citations + confidence** for trust
5. **Extend shadcn/ui** - no new design system
6. **Admin controls in Settings** - not a separate admin app
7. **Settings page redesign** - Update entire Settings page to match dark admin panel style

### Design Preferences (User Feedback)

**Approved Directions:**
- Main Chat view (Direction 1) - ChatGPT-style dark interface
- Chat with Documents panel (Direction 2) - Three-column layout
- Admin Panel design (Direction 3) - Dark theme settings

**Future Work:**
- Redesign entire Settings page to use the dark theme admin panel style for consistency across the application

### Deliverables Created

- [x] UX Design Specification (this document)
- [x] Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)
- [x] Design Direction Mockups: [ux-design-directions.html](./ux-design-directions.html)

### Next Steps

1. **Architecture** - `/bmad:bmm:workflows:architecture` - Define AI integration, database schema
2. **Epic Breakdown** - `/bmad:bmm:workflows:create-epics-and-stories` - Sprint planning
3. **Implementation** - Build components, routes, integrations

---

## Appendix

### Related Documents

- Product Requirements: `docs/features/ai-buddy/prd.md`
- Brainstorming: `docs/features/documine-suite-brainstorm-2025-12-07.md`
- Existing UX Spec: `docs/ux-design-specification/` (for docuMINE core)

### Research Sources

- [ChatGPT UX Design Patterns 2025](https://www.designrush.com/agency/ui-ux-design/trends/chatgpt-for-ui-ux-design)
- [shadcn/ui Design System](https://ui.shadcn.com/)
- [B2B SaaS Dashboard UX Patterns](https://www.orbix.studio/blogs/saas-dashboard-design-b2b-optimization-guide)
- [UX Trends for B2B SaaS 2025](https://www.superuserstudio.com/insights/6-top-ux-trends-transforming-b2b-saas-in-2025)

### Version History

| Date       | Version | Changes                         | Author |
| ---------- | ------- | ------------------------------- | ------ |
| 2025-12-07 | 1.0     | Initial UX Design Specification | Sam    |

---

_This UX Design Specification was created through collaborative design facilitation using the BMad Method. All decisions were made with user input and are documented with rationale._
