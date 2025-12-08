# Story 15.2: Message Display Component

**Epic:** 15 - AI Buddy Core Chat
**Story Points:** 5
**Priority:** High
**Status:** done

## Story

As a user,
I want to see my messages and AI responses in a chat format,
so that I can follow the conversation flow.

## Acceptance Criteria

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| AC-15.2.1 | User messages are right-aligned with blue avatar (user initials) | Visual inspection |
| AC-15.2.2 | AI messages are left-aligned with green avatar (AI icon) | Visual inspection |
| AC-15.2.3 | Messages display in chronological order (oldest at top) | Unit test |
| AC-15.2.4 | Auto-scroll to newest message when new messages arrive | Unit test + E2E |
| AC-15.2.5 | Timestamps shown on hover (relative format, e.g., "2 min ago") | Unit test |
| AC-15.2.6 | Markdown rendering works (bold, italic, lists, code blocks, links) | Unit test |
| AC-15.2.7 | Typing indicator (animated dots) shown during AI response streaming | Unit test |
| AC-15.2.8 | Empty state shown when no messages in conversation | Unit test |

## Tasks / Subtasks

- [x] Task 1: Create ChatMessage component (AC: 15.2.1, 15.2.2, 15.2.5)
  - [x] 1.1: Create base ChatMessage component with role-based styling
  - [x] 1.2: Implement Avatar component (user initials or AI icon)
  - [x] 1.3: Add left/right alignment based on message role
  - [x] 1.4: Add relative timestamp with hover reveal
  - [x] 1.5: Style message bubbles (rounded corners, appropriate padding)

- [x] Task 2: Create ChatMessageList container component (AC: 15.2.3, 15.2.4, 15.2.8)
  - [x] 2.1: Create scrollable container with flex-col layout
  - [x] 2.2: Map messages to ChatMessage components in chronological order
  - [x] 2.3: Implement auto-scroll to bottom on new messages
  - [x] 2.4: Handle scroll anchor for smooth scrolling behavior
  - [x] 2.5: Add empty state component when messages array is empty

- [x] Task 3: Create StreamingIndicator component (AC: 15.2.7)
  - [x] 3.1: Create animated three-dot loading indicator
  - [x] 3.2: Add green AI avatar matching AI message style
  - [x] 3.3: Add conditional rendering based on isLoading prop

- [x] Task 4: Implement markdown rendering (AC: 15.2.6)
  - [x] 4.1: Configure react-markdown with remark-gfm plugin
  - [x] 4.2: Style code blocks with dark theme and syntax highlighting
  - [x] 4.3: Style lists, bold, italic, links appropriately
  - [x] 4.4: Add proper link handling (external links open new tab)

- [x] Task 5: Write unit tests (AC: 15.2.1-15.2.8)
  - [x] 5.1: Test ChatMessage renders user messages right-aligned
  - [x] 5.2: Test ChatMessage renders AI messages left-aligned
  - [x] 5.3: Test ChatMessageList orders messages chronologically
  - [x] 5.4: Test auto-scroll behavior triggers on new messages
  - [x] 5.5: Test timestamp appears on hover
  - [x] 5.6: Test markdown rendering (bold, lists, code blocks)
  - [x] 5.7: Test StreamingIndicator shows animated dots
  - [x] 5.8: Test empty state renders when no messages

## Dev Notes

### Implementation Approach

This story builds on the ChatInput component from Story 15.1 to complete the core chat UI. The message display follows a ChatGPT-style layout adapted to AI Buddy's light theme with emerald accents.

**Key Implementation Decisions:**

1. **Chronological Order:** Messages stored in `created_at` order, rendered top-to-bottom (oldest first).

2. **Auto-Scroll:** Use `scrollIntoView` with smooth behavior, triggered by message count change. Only auto-scroll if user is near bottom (within 100px) to avoid interrupting reading.

3. **Markdown Rendering:** Use `react-markdown` with `remark-gfm` for GitHub Flavored Markdown. Code blocks use Tailwind dark theme styling.

4. **Avatar Design:** User messages show initials (first letter of first + last name), AI messages show an AI icon or stylized "AI" text.

5. **Timestamp UX:** Relative timestamps using date-fns `formatRelative` or similar. Show on hover to reduce visual noise.

[Source: docs/sprint-artifacts/epics/epic-15/tech-spec.md#story-152-message-display-component]

### Component Hierarchy

```
ChatMessageList
├── ChatMessage (for each message)
│   ├── Avatar
│   ├── MessageBubble
│   │   └── react-markdown content
│   └── Timestamp (hover)
├── StreamingIndicator (when isLoading)
└── EmptyState (when no messages)
```

### Project Structure Notes

- **New Files:**
  - `src/components/ai-buddy/chat/chat-message.tsx` - Individual message component
  - `src/components/ai-buddy/chat/chat-message-list.tsx` - Message list container
  - `src/components/ai-buddy/chat/streaming-indicator.tsx` - Loading animation
  - `__tests__/components/ai-buddy/chat-message.test.tsx` - Message unit tests
  - `__tests__/components/ai-buddy/chat-message-list.test.tsx` - List unit tests

- **Dependencies:** `react-markdown`, `remark-gfm` (already in package.json)

- **Styling:** Light theme with emerald accents matching Story 14.4 decision

[Source: docs/features/ai-buddy/architecture.md#project-structure]

### Learnings from Previous Story

**From Story 15-1-chat-input-component (Status: done)**

- **Component Pattern Established:** forwardRef pattern with ChatInputRef interface for external control
- **Styling Convention:** Light theme with emerald accents (`emerald-500`, `emerald-600`)
- **CSS Variables Used:** `--chat-border`, `--chat-surface`, `--text-primary`, `--text-muted`
- **Test Organization:** Tests organized by AC ID for traceability
- **Accessibility:** aria-label, aria-live, aria-describedby patterns established
- **Build Verified:** All 47 unit tests passing, TypeScript compilation successful

**Key Files Created:**
- `src/components/ai-buddy/chat-input.tsx` - Pattern reference for component structure
- `__tests__/components/ai-buddy/chat-input.test.tsx` - Pattern reference for test organization

[Source: stories/15-1-chat-input-component/15-1-chat-input-component.md#Dev-Agent-Record]

### Architecture Patterns

**From AI Buddy Architecture:**
- SSE streaming format: `{"type":"chunk","content":"..."}`
- Message interface: `ChatMessage { id, conversationId, role, content, sources?, confidence?, createdAt }`
- Role enum: 'user' | 'assistant'

[Source: docs/features/ai-buddy/architecture.md#api-contracts]

**From Tech Spec:**
- User avatar: 32px circle with initials
- AI avatar: 32px circle with green background, AI icon
- Message bubble: Max width 80%, rounded corners
- Code blocks: Dark theme with syntax highlighting

[Source: docs/sprint-artifacts/epics/epic-15/tech-spec.md#chatmessage-component]

### References

- [Epic 15 Tech Spec - Story 15.2](../../tech-spec.md#story-152-message-display-component)
- [AI Buddy Architecture - Chat Components](../../../../features/ai-buddy/architecture.md#project-structure)
- [Story 15.1 - ChatInput Implementation](../15-1-chat-input-component/15-1-chat-input-component.md)
- [AI Buddy UX Design](../../../../features/ai-buddy/ux-design/ux-design-specification.md)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-15/stories/15-2-message-display/15-2-message-display.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Clean implementation with no significant blockers.

### Completion Notes List

- **ChatMessage Component:** Upgraded from scaffold to full implementation with Message type, markdown rendering via react-markdown, user initials avatar, hover timestamps using date-fns formatDistanceToNow
- **ChatMessageList Component:** Implemented with chronological ordering, auto-scroll using scrollIntoView with smooth behavior, empty state with helpful onboarding message, streaming indicator integration
- **StreamingIndicator Component:** Upgraded with isVisible prop, AI avatar matching AI message style, animated bouncing dots with staggered delays, optional streamingContent display with cursor animation
- **useChat Hook:** Updated from scaffold to return Message[] type and streamingContent string for streaming preview
- **Tests:** 86 new unit tests covering all 8 acceptance criteria (32 ChatMessage + 24 ChatMessageList + 30 StreamingIndicator)
- **Build Verified:** All 1697 tests passing, TypeScript compilation successful

### File List

**Modified:**
- `src/components/ai-buddy/chat-message.tsx` - Full implementation with Message type, markdown, avatars
- `src/components/ai-buddy/chat-message-list.tsx` - Full implementation with auto-scroll, empty state
- `src/components/ai-buddy/streaming-indicator.tsx` - Full implementation with isVisible, AI avatar
- `src/hooks/ai-buddy/use-chat.ts` - Updated to use Message type and return streamingContent

**Created:**
- `__tests__/components/ai-buddy/chat-message.test.tsx` - 32 tests
- `__tests__/components/ai-buddy/chat-message-list.test.tsx` - 24 tests
- `__tests__/components/ai-buddy/streaming-indicator.test.tsx` - 30 tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Story drafted via create-story workflow | SM Agent |
| 2025-12-07 | Implementation complete - all 5 tasks done, 86 tests passing | Dev Agent |
| 2025-12-07 | Code review APPROVED - all 8 ACs verified, excellent quality | Senior Dev Agent |

## Code Review

### Review Summary

**Reviewer:** Senior Dev Agent (BMad Code Review Workflow)
**Date:** 2025-12-07
**Verdict:** ✅ **APPROVED**

### Executive Summary

This is an **excellent implementation** of the Message Display Component. All 8 acceptance criteria are fully implemented and verified. The code demonstrates strong adherence to established patterns from Story 15.1, proper TypeScript usage, excellent accessibility, and comprehensive test coverage (86 tests).

### Acceptance Criteria Verification

| AC ID | Criterion | Status |
|-------|-----------|--------|
| AC-15.2.1 | User messages right-aligned with blue avatar | ✅ Verified |
| AC-15.2.2 | AI messages left-aligned with green avatar | ✅ Verified |
| AC-15.2.3 | Chronological message order | ✅ Verified |
| AC-15.2.4 | Auto-scroll on new messages | ✅ Verified |
| AC-15.2.5 | Hover timestamps (relative format) | ✅ Verified |
| AC-15.2.6 | Markdown rendering | ✅ Verified |
| AC-15.2.7 | Streaming indicator (animated dots) | ✅ Verified |
| AC-15.2.8 | Empty state | ✅ Verified |

### Code Quality Scores

| Category | Score |
|----------|-------|
| TypeScript | ⭐⭐⭐⭐⭐ |
| Architecture | ⭐⭐⭐⭐⭐ |
| React Patterns | ⭐⭐⭐⭐⭐ |
| Accessibility | ⭐⭐⭐⭐⭐ |
| Test Coverage | ⭐⭐⭐⭐⭐ |
| Documentation | ⭐⭐⭐⭐⭐ |

### Test Results

```
 ✓ chat-message.test.tsx (32 tests)
 ✓ chat-message-list.test.tsx (24 tests)
 ✓ streaming-indicator.test.tsx (30 tests)

 Tests: 86 passed | Build: ✓ Passing
```

### Strengths

1. **Pattern Consistency**: Excellent adherence to Story 15.1 patterns (emerald theme, CSS variables, test organization by AC ID)
2. **Comprehensive Markdown Support**: Full GFM support with custom styling for code blocks, links, lists
3. **Smart Auto-scroll**: Only scrolls when user is near bottom (100px threshold), doesn't interrupt reading
4. **Accessibility Excellence**: Proper ARIA attributes throughout, screen reader friendly
5. **Future-Proof Design**: Props for `onCitationClick` and `isStreaming` ready for Story 15.5

### Observations (Non-Blocking)

1. `isStreaming` and `onCitationClick` props unused in `ChatMessage` - documented as placeholders for future stories
2. `useChat` hook is stub implementation - correctly noted as placeholder for Story 15.3
3. Virtualization not implemented for large message lists - noted in spec as future enhancement

### Security Assessment

- ✅ XSS via markdown: Mitigated (react-markdown sanitizes by default)
- ✅ Link safety: External links use `rel="noopener noreferrer"`
- ✅ User input display: Content rendered through React (no dangerouslySetInnerHTML)
