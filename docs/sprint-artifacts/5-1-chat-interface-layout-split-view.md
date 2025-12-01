# Story 5.1: Chat Interface Layout (Split View)

Status: done

## Story

As a **user**,
I want **to see my document and chat side-by-side in a split view layout**,
So that **I can ask questions while viewing the source material and verify answers instantly**.

## Acceptance Criteria

### AC-5.1.1: Split View Layout Structure
- Document view page (`/documents/[id]`) displays split-view layout
- Document Viewer on left panel (min 40% width, flexible)
- Chat Panel on right panel (360px fixed width on desktop)

### AC-5.1.2: Chat Panel Structure
- Chat Panel contains scrollable conversation history area
- Fixed input area at bottom of chat panel
- Conversation history scrolls independently from document viewer

### AC-5.1.3: Input Area Placeholder
- Input area displays placeholder text "Ask a question..."
- Placeholder uses muted text color (#64748b)

### AC-5.1.4: Send Button Visibility
- Send button (arrow icon) visible next to input
- Button uses Primary Slate color (#475569)
- Button disabled when input is empty

### AC-5.1.5: Keyboard Shortcuts
- Pressing Enter sends message
- Shift+Enter inserts newline
- Input supports multi-line text

### AC-5.1.6: Auto Focus on Load
- Input automatically receives focus when document page loads
- Focus indicator visible per accessibility requirements (2px outline)

### AC-5.1.7: Tablet Responsive (640-1024px)
- Both panels visible on tablet
- Chat panel 40% width (narrower than desktop)
- Sidebar collapsed by default with hamburger toggle

### AC-5.1.8: Mobile Responsive (<640px)
- Tabbed interface with [Document] and [Chat] tabs
- Only one panel visible at a time
- Tab bar at top of content area

### AC-5.1.9: Mobile Tab Indicator
- Mobile tabs show current view indicator
- Active tab has visual distinction (bottom border accent)
- Tabs are 44x44px minimum touch targets

### AC-5.1.10: Color Theme Compliance
- Layout uses Trustworthy Slate color theme
- Primary: #475569
- Background: #ffffff
- Surface: #f8fafc
- System font stack for typography

## Tasks / Subtasks

- [x] **Task 1: Create Split View Layout Component** (AC: 5.1.1) ✅
  - [x] Create `src/components/layout/split-view.tsx`
  - [x] Implement CSS Grid or Flexbox for split layout
  - [x] Document Viewer container (min 40%, flex-grow)
  - [x] Chat Panel container (360px fixed on desktop)
  - [ ] Add resizable divider support (optional for MVP) - deferred

- [x] **Task 2: Create Chat Panel Component** (AC: 5.1.2, 5.1.3) ✅
  - [x] Create `src/components/chat/chat-panel.tsx`
  - [x] Implement scrollable conversation history area
  - [x] Implement fixed input area at bottom
  - [x] Add placeholder text "Ask a question..."
  - [x] Style with Trustworthy Slate theme

- [x] **Task 3: Create Chat Input Component** (AC: 5.1.3, 5.1.4, 5.1.5, 5.1.6) ✅
  - [x] Create `src/components/chat/chat-input.tsx`
  - [x] Implement textarea with auto-resize
  - [x] Add send button with arrow icon (lucide-react Send icon)
  - [x] Implement Enter to send, Shift+Enter for newline
  - [x] Disable send button when input empty
  - [x] Auto-focus input on page load
  - [x] Add visible focus indicator (2px outline)

- [x] **Task 4: Update Document View Page** (AC: 5.1.1, 5.1.6) ✅
  - [x] Update `src/app/(dashboard)/documents/[id]/page.tsx`
  - [x] Integrate DocumentChatSplitView component
  - [x] Pass document ID to Chat Panel for context
  - [x] Shared document viewer content between desktop and mobile

- [x] **Task 5: Implement Responsive Layout - Tablet** (AC: 5.1.7) ✅
  - [x] Add CSS media query for 640-1024px
  - [x] Adjust chat panel to 40% width
  - [x] Sidebar already collapsible with hamburger menu (from Epic 4)

- [x] **Task 6: Implement Responsive Layout - Mobile** (AC: 5.1.8, 5.1.9) ✅
  - [x] Add CSS media query for <640px
  - [x] Create tabbed interface component (`mobile-document-chat-tabs.tsx`)
  - [x] Implement [Document] and [Chat] tabs
  - [x] Add tab state management
  - [x] Style active tab indicator (bottom border accent)
  - [x] Ensure 44x44px minimum touch targets

- [x] **Task 7: Apply Color Theme** (AC: 5.1.10) ✅
  - [x] Apply Trustworthy Slate colors to all components
  - [x] Verify contrast ratios meet WCAG AA (4.5:1 for text)
  - [x] Use system font stack
  - [x] Test color consistency across components

- [x] **Task 8: Testing and Verification** (AC: All) ✅
  - [x] Write component tests for ChatPanel (8 tests)
  - [x] Write component tests for ChatInput (16 tests)
  - [x] Write component tests for MobileDocumentChatTabs (10 tests)
  - [x] Test keyboard navigation (Tab order, Enter/Shift+Enter)
  - [x] Run build and verify no type errors
  - [x] Test count: 537 passing (exceeds 507 baseline)

## Dev Notes

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo            [Compare]  [User Menu]             │
├──────────────┬──────────────────────┬───────────────────────┤
│              │                      │                       │
│  SIDEBAR     │   DOCUMENT VIEWER    │     CHAT PANEL        │
│  (240px)     │   (flexible, min 40%)│     (360px fixed)     │
│              │                      │                       │
│  Recent      │   • PDF rendered     │   • Conversation      │
│  Documents   │   • Page navigation  │     history area      │
│              │   • Zoom controls    │   • (scrollable)      │
│  • Doc 1     │                      │                       │
│  • Doc 2     │                      │   ┌─────────────────┐ │
│  • Doc 3     │                      │   │ Ask question... │ │
│              │                      │   └─────────────────┘ │
│  [+ Upload]  │                      │   (fixed at bottom)   │
└──────────────┴──────────────────────┴───────────────────────┘
```

### Component Hierarchy

```
documents/[id]/page.tsx
├── DashboardLayout (existing)
│   ├── Header (existing)
│   └── Sidebar (existing)
└── SplitView (new)
    ├── DocumentViewer (placeholder/skeleton for this story)
    └── ChatPanel (new)
        ├── ConversationHistory (new - scrollable container)
        └── ChatInput (new - fixed at bottom)
```

### CSS Implementation

```typescript
// SplitView layout using CSS Grid
const splitViewStyles = {
  display: 'grid',
  gridTemplateColumns: 'minmax(40%, 1fr) 360px', // Document | Chat
  height: '100%',
  gap: '0',
};

// Responsive breakpoints
// Tablet (640-1024px): gridTemplateColumns: '60% 40%'
// Mobile (<640px): single column with tabs
```

### Key Technical Decisions

1. **Fixed Width Chat Panel**: 360px on desktop matches ChatGPT-style pattern, provides consistent experience. Per UX spec.

2. **Flexible Document Viewer**: Uses `minmax(40%, 1fr)` to ensure minimum 40% width while allowing growth.

3. **Scroll Isolation**: Chat history scrolls independently from document viewer using `overflow-y: auto` with fixed container height.

4. **Auto-resize Input**: Textarea grows to accommodate content (up to 4 lines visible per AC-5.2.2 in Story 5.2).

### Existing Infrastructure to Reuse

- **Dashboard Layout**: `src/app/(dashboard)/layout.tsx` - existing header/sidebar structure
- **Supabase Client**: `src/lib/supabase/client.ts` - for future conversation loading
- **UI Components**: shadcn/ui Button, Input already installed
- **Icons**: lucide-react already installed - use `Send` icon

### New Dependencies Required

None for this story. All dependencies already installed:
- `tailwindcss` - styling
- `lucide-react` - icons
- `@radix-ui/react-*` - via shadcn/ui

### File Locations

| Component | Location |
|-----------|----------|
| SplitView | `src/components/layout/split-view.tsx` |
| ChatPanel | `src/components/chat/chat-panel.tsx` |
| ChatInput | `src/components/chat/chat-input.tsx` |
| Document Page | `src/app/(dashboard)/documents/[id]/page.tsx` |

### Project Structure Notes

- Alignment with unified project structure: Components go in feature folders under `src/components/`
- Chat components: `src/components/chat/`
- Layout components: `src/components/layout/`
- Page route: `src/app/(dashboard)/documents/[id]/page.tsx`

### Learnings from Previous Story

**From Story 4-7-processing-queue-management (Status: done)**

- **Test baseline**: 507 tests passing - maintain or increase
- **Queue Management Service**: Available at `src/lib/documents/queue.ts` for future reference
- **Rate Limiting Service**: Available at `src/lib/documents/rate-limit.ts` - documents page uses rate limit info
- **Database Migration Pattern**: Established in `supabase/migrations/00007_queue_management.sql` - use similar pattern
- **RPC Functions**: Created for complex database operations - consider for conversation queries
- **Server Actions Pattern**: `src/app/(dashboard)/documents/actions.ts` - follow this pattern for chat actions
- **Component Updates**: Document page already modified to show queue positions and rate limits

**Key Files from Epic 4 to Reference:**
- `src/app/(dashboard)/documents/page.tsx` - document list page structure
- `src/components/documents/document-list.tsx` - list component pattern
- `src/components/documents/document-status.tsx` - status display pattern
- `src/components/documents/upload-zone.tsx` - upload zone styling

[Source: stories/4-7-processing-queue-management.md#Dev-Agent-Record]

### References

- [Source: docs/epics.md#Story-5.1-Chat-Interface-Layout-Split-View]
- [Source: docs/sprint-artifacts/tech-spec-epic-5.md#Story-5.1-Chat-Interface-Layout-Split-View]
- [Source: docs/ux-design-specification.md#Design-Direction]
- [Source: docs/architecture.md#Project-Structure]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/5-1-chat-interface-layout-split-view.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**2025-11-30 - Implementation Plan:**
- Existing SplitView component needs enhancement for chat panel with CSS Grid
- ChatPanel to be created at src/components/chat/chat-panel.tsx
- ChatInput to be created at src/components/chat/chat-input.tsx
- Document detail page already uses ChatPanelPlaceholder - replace with real ChatPanel
- Responsive: Tablet 40% chat, Mobile tabbed interface with shadcn Tabs

### Completion Notes List

1. Enhanced existing SplitView component with new DocumentChatSplitView for document + chat layout
2. Created ChatPanel with scrollable history area, fixed input, empty state UI
3. Created ChatInput with auto-resize, Enter/Shift+Enter handling, auto-focus
4. Created MobileDocumentChatTabs for mobile tabbed interface
5. All responsive breakpoints implemented: desktop (360px chat), tablet (40% chat), mobile (tabbed)
6. 34 new tests added (24 chat component tests + 10 mobile tabs tests)
7. Build passes, lint clean for new files
8. Color theme (Trustworthy Slate) applied consistently

### File List

**New Files:**
- `src/components/chat/chat-panel.tsx` - Chat panel with conversation history and input
- `src/components/chat/chat-input.tsx` - Text input with send button, keyboard shortcuts
- `src/components/chat/index.ts` - Barrel export for chat components
- `src/components/layout/mobile-document-chat-tabs.tsx` - Mobile tabbed interface
- `__tests__/components/chat/chat-input.test.tsx` - 16 tests for ChatInput
- `__tests__/components/chat/chat-panel.test.tsx` - 8 tests for ChatPanel
- `__tests__/components/layout/mobile-document-chat-tabs.test.tsx` - 10 tests for mobile tabs

**Modified Files:**
- `src/components/layout/split-view.tsx` - Added DocumentChatSplitView component
- `src/app/(dashboard)/documents/[id]/page.tsx` - Integrated split view and mobile tabs

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-30 | Bob (Scrum Master) | Initial story draft via create-story workflow (YOLO mode) |
| 2025-11-30 | Amelia (Dev Agent) | Implementation complete - all tasks done, ready for code review |
| 2025-11-30 | Senior Developer Review (AI) | Review APPROVED - all ACs and tasks verified |

## Senior Developer Review (AI)

### Reviewer
Sam (via Code Review Workflow)

### Date
2025-11-30

### Outcome
✅ **APPROVED**

All acceptance criteria implemented. All tasks verified complete. No blocking issues.

### Summary

Story 5.1 implements the chat interface layout with split view for document + chat side-by-side. The implementation is clean, follows established patterns, and has comprehensive test coverage.

### Key Findings

**LOW Severity:**
- [ ] [Low] Remove unused `inputRef` variable [file: src/components/chat/chat-panel.tsx:31]

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-5.1.1 | Split View Layout Structure | ✅ IMPLEMENTED | `split-view.tsx:56-83` |
| AC-5.1.2 | Chat Panel Structure | ✅ IMPLEMENTED | `chat-panel.tsx:69-119` |
| AC-5.1.3 | Input Area Placeholder | ✅ IMPLEMENTED | `chat-input.tsx:39,128` |
| AC-5.1.4 | Send Button Visibility | ✅ IMPLEMENTED | `chat-input.tsx:142-161` |
| AC-5.1.5 | Keyboard Shortcuts | ✅ IMPLEMENTED | `chat-input.tsx:99-106` |
| AC-5.1.6 | Auto Focus on Load | ✅ IMPLEMENTED | `chat-input.tsx:52-62` |
| AC-5.1.7 | Tablet Responsive | ✅ IMPLEMENTED | `split-view.tsx:68` |
| AC-5.1.8 | Mobile Tabbed Interface | ✅ IMPLEMENTED | `mobile-document-chat-tabs.tsx:41-87` |
| AC-5.1.9 | Mobile Tab Indicator | ✅ IMPLEMENTED | `mobile-document-chat-tabs.tsx:51,56-58` |
| AC-5.1.10 | Color Theme | ✅ IMPLEMENTED | All components use slate-* palette |

**Summary: 10 of 10 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Split View Layout | ✅ | ✅ VERIFIED | `split-view.tsx:56-83` |
| Task 2: Chat Panel | ✅ | ✅ VERIFIED | `chat-panel.tsx` |
| Task 3: Chat Input | ✅ | ✅ VERIFIED | `chat-input.tsx` |
| Task 4: Document Page | ✅ | ✅ VERIFIED | `page.tsx:260-291` |
| Task 5: Tablet Responsive | ✅ | ✅ VERIFIED | `split-view.tsx:68` |
| Task 6: Mobile Responsive | ✅ | ✅ VERIFIED | `mobile-document-chat-tabs.tsx` |
| Task 7: Color Theme | ✅ | ✅ VERIFIED | Consistent slate-* usage |
| Task 8: Testing | ✅ | ✅ VERIFIED | 34 new tests, 537 total |

**Summary: 8 of 8 completed tasks verified, 0 false completions**

### Test Coverage and Gaps

- ChatInput: 16 tests covering AC-5.1.3, 5.1.4, 5.1.5, 5.1.6
- ChatPanel: 8 tests covering AC-5.1.2, 5.1.3
- MobileDocumentChatTabs: 10 tests covering AC-5.1.8, 5.1.9
- Total: 537 tests passing (baseline: 507)

### Architectural Alignment

- ✅ Component structure follows established patterns
- ✅ Uses existing shadcn/ui primitives
- ✅ Follows React best practices (forwardRef, useCallback, useMemo)
- ✅ Tailwind responsive breakpoints used correctly

### Security Notes

No security concerns - layout-only story with no user input processing.

### Best-Practices and References

- [React forwardRef](https://react.dev/reference/react/forwardRef)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns)
- [ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

### Action Items

**Code Changes Required:**
- [ ] [Low] Remove unused `inputRef` variable [file: src/components/chat/chat-panel.tsx:31]

**Advisory Notes:**
- Note: The unused inputRef can be cleaned up in a future story or left for when chat functionality is added
