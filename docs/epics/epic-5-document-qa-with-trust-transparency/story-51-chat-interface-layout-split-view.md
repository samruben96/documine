# Story 5.1: Chat Interface Layout (Split View)

As a **user**,
I want **to see my document and chat side-by-side**,
So that **I can ask questions while viewing the source material**.

**Acceptance Criteria:**

**Given** I select a document from the sidebar
**When** the document view loads
**Then** I see a split view layout:
- Left panel: Document Viewer (flexible width, min 40%)
- Right panel: Chat Panel (360px fixed width on desktop)
- Resizable divider between panels (optional for MVP)

**And** the Chat Panel contains:
- Conversation history (scrollable)
- Input area at bottom with "Ask a question..." placeholder
- Send button (arrow icon)

**And** keyboard shortcuts work:
- Enter sends message (Shift+Enter for newline)
- Focus automatically in input when document opens

**And** responsive adaptation:
- Tablet: Both panels visible, narrower
- Mobile: Tabbed view (Document / Chat tabs), swipe to switch

**And** the layout follows UX spec:
- Trustworthy Slate colors
- System font
- Clean separation between panels

**Prerequisites:** Story 4.3

**Technical Notes:**
- Implement in `@/app/(dashboard)/documents/[id]/page.tsx`
- Use CSS Grid or Flexbox for split view
- Chat panel component: `@/components/chat/chat-panel.tsx`
- Mobile detection via media queries or resize observer

---
