# Story 14.4: AI Buddy Page Layout Shell

Status: done

## Story

As a **user**,
I want AI Buddy to have a ChatGPT-style dark interface,
so that the chat experience feels familiar and optimized for focus.

## Acceptance Criteria

1. **AC 14.4.1 - Dark Theme Layout:** AI Buddy route uses dark theme:
   - Layout file creates dark themed container
   - Scoped to /ai-buddy routes only (doesn't affect rest of app)
   - CSS variables defined per tech-spec Appendix A

2. **AC 14.4.2 - Sidebar 260px with Dark Bg:** Project sidebar area:
   - Left sidebar area styled with --sidebar-bg (#171717)
   - Width 260px on desktop
   - Contains project list placeholder

3. **AC 14.4.3 - Main Chat Area with #212121 Bg:** Chat area styling:
   - Main content area uses --chat-bg (#212121)
   - Flex layout fills remaining width
   - Contains chat content placeholder

4. **AC 14.4.4 - Responsive Breakpoints:** Layout adapts to screen size:
   - Desktop (>1024px): Sidebar visible, full layout
   - Tablet (768-1024px): Collapsible sidebar
   - Mobile (<768px): Sidebar hidden, full-width chat

5. **AC 14.4.5 - Empty State Displayed:** Initial state shows welcome:
   - Empty state message when no conversation active
   - "Start a conversation" or similar CTA
   - Quick action suggestions (optional)

## Tasks / Subtasks

- [x] Task 1: Create layout.tsx (AC: 14.4.1, 14.4.2, 14.4.3)
  - [x] 1.1 Create `src/app/(dashboard)/ai-buddy/layout.tsx`
  - [x] 1.2 Define CSS variables for dark theme (inline style object)
  - [x] 1.3 Create sidebar area (260px, #171717)
  - [x] 1.4 Create main chat area (#212121)
  - [x] 1.5 Theme scoped to layout via inline CSS variables

- [x] Task 2: Create page.tsx (AC: 14.4.5)
  - [x] 2.1 Create `src/app/(dashboard)/ai-buddy/page.tsx`
  - [x] 2.2 Add empty state with Bot icon, welcome message
  - [x] 2.3 Include 3 quick action cards + disabled chat input

- [x] Task 3: Implement responsive breakpoints (AC: 14.4.4)
  - [x] 3.1 Desktop: Sidebar visible (lg:relative lg:translate-x-0)
  - [x] 3.2 Tablet: Collapsible sidebar with overlay
  - [x] 3.3 Mobile: Sidebar hidden, menu toggle in header

- [x] Task 4: Verify implementation (AC: All)
  - [x] 4.1 TypeScript compilation: PASS
  - [x] 4.2 Build: PASS (/ai-buddy route listed)
  - [x] 4.3 Visual verification pending (code review)

## Dev Notes

### Architecture Patterns
- Layout scopes dark theme to /ai-buddy/* routes only
- Use CSS variables for theming (defined in layout or globals)
- Follow ChatGPT-style layout: sidebar left, chat right
- Responsive design mobile-first

### CSS Variables (from tech-spec Appendix A)
```css
--sidebar-bg: #171717;
--sidebar-hover: #212121;
--sidebar-active: #2d2d2d;
--chat-bg: #212121;
--chat-surface: #2d2d2d;
--chat-border: #3d3d3d;
--text-primary: #ececec;
--text-muted: #8e8e8e;
```

### Testing Standards
- Visual test: Dark theme renders
- Responsive test: Breakpoints work correctly
- Build test: No compilation errors

### References

- [Source: docs/sprint-artifacts/epics/epic-14/tech-spec.md#9] Story AC Matrix
- [Source: docs/sprint-artifacts/epics/epic-14/tech-spec.md#AppendixA] CSS Variables
- [Source: docs/features/ai-buddy/ux-design/ux-design-specification.md#3.1] ChatGPT-Style Interface

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epics/epic-14/stories/14-4-page-layout-shell/14-4-page-layout-shell.context.xml

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- 2025-12-07: All 5 ACs implemented
- AC 14.4.1: Dark theme via CSS variables in layout style prop
- AC 14.4.2: Sidebar 260px with #171717 background (layout.tsx:54-91)
- AC 14.4.3: Main chat area with #212121 background (layout.tsx:94-116)
- AC 14.4.4: Responsive with lg:/max-lg: breakpoints, mobile menu toggle
- AC 14.4.5: Empty state with Bot icon, welcome message, 3 quick actions (page.tsx)
- TypeScript compilation: PASS
- Build: PASS

### File List

- src/app/(dashboard)/ai-buddy/layout.tsx (NEW)
- src/app/(dashboard)/ai-buddy/page.tsx (NEW)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-07 | 1.0 | Story created for epic-yolo workflow |
