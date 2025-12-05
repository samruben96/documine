# Feature Enhancements (User Requested)

## AC-6.8.15: Resizable Side Panels
**Priority:** 🟠 High | **Effort:** M

**Given** the three-column layout (documents | viewer | chat)
**When** the user hovers between panels
**Then** a resize handle appears allowing:
- Drag to resize document sidebar (min: 200px, max: 400px)
- Drag to resize chat panel (min: 300px, max: 600px)
- Persist user preference in localStorage
- Double-click to reset to default

**Implementation:** Use `react-resizable-panels` or CSS resize with custom handle.

## AC-6.8.16: Markdown Rendering in Chat
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

## AC-6.8.17: Dockable/Moveable Chat Panel
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

## ~~AC-6.8.18: Source Text Highlighting~~ (MOVED TO EPIC F5)

**Status:** Deferred to Future Epic F5: Document Viewer Enhancements

This feature requires PDF.js text layer work and has been moved to a dedicated future epic. See `docs/epics.md` → Epic F5.

---
