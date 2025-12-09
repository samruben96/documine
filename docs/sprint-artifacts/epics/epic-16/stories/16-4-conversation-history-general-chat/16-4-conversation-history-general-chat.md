# Story 16.4: Conversation History & General Chat

**Epic:** 16 - AI Buddy Projects
**Status:** done
**Points:** 5
**Created:** 2025-12-07
**Context:** [16-4-conversation-history-general-chat.context.xml](./16-4-conversation-history-general-chat.context.xml)

---

## User Story

**As a** user of AI Buddy,
**I want** to see my conversation history organized by date and be able to chat without selecting a project,
**So that** I can easily find past conversations and have quick Q&A sessions without creating project overhead.

---

## Background

This story enhances the conversation sidebar with date-grouped history and enables "general chat" mode - conversations that exist outside any project. This mirrors ChatGPT's approach where users can have both organized project conversations and quick ad-hoc chats.

**Key Value Proposition:** Agents can quickly ask one-off questions without project setup, while still having easy access to their conversation history organized chronologically.

**Merged From:** Original stories 16.5 (Conversation History) + 16.8 (General Chat)

**Dependencies:**
- Story 16.1 (Project Creation & Sidebar) - DONE - sidebar structure
- Story 16.2 (Project Context Switching) - Can run in parallel (this story handles no-project case)

---

## Acceptance Criteria

### Conversation History UI (FR3)

- [ ] **AC-16.4.1:** Sidebar "Recent" section shows conversations grouped by date
- [ ] **AC-16.4.2:** Date groups: Today, Yesterday, Previous 7 days, Older
- [ ] **AC-16.4.3:** Each conversation shows title (first message excerpt), project name (if any), timestamp
- [ ] **AC-16.4.4:** Clicking conversation loads it in chat area
- [ ] **AC-16.4.5:** When project selected, only that project's conversations shown in Recent
- [ ] **AC-16.4.6:** Maximum 50 conversations loaded, with "Load more" pagination

### General Chat Mode (FR18)

- [ ] **AC-16.4.7:** "New Chat" button starts conversation without project association
- [ ] **AC-16.4.8:** Header shows "AI Buddy" without project name for general chats
- [ ] **AC-16.4.9:** General conversations appear in "Recent" section when no project selected
- [ ] **AC-16.4.10:** General conversations can have in-conversation document attachments
- [ ] **AC-16.4.11:** `project_id` is NULL for general conversations in database

---

## Technical Requirements

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/ai-buddy/conversation-group.tsx` | Date group header + conversation list for that group |
| `src/lib/ai-buddy/date-grouping.ts` | Utility to group conversations by Today/Yesterday/etc |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-buddy/project-sidebar.tsx` | Restructure Recent section with date groups |
| `src/components/ai-buddy/chat-history-item.tsx` | Add project name badge, relative timestamp |
| `src/hooks/ai-buddy/use-conversations.ts` | Add date grouping logic, ensure projectId filter works |
| `src/contexts/ai-buddy-context.tsx` | Ensure general chat mode works (null projectId) |
| `src/app/(dashboard)/ai-buddy/page.tsx` | Handle general chat header display |

### Component Design: ConversationGroup

```typescript
// src/components/ai-buddy/conversation-group.tsx

interface ConversationGroupProps {
  label: string;  // "Today", "Yesterday", etc.
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationGroup({
  label,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ConversationGroupProps) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-slate-500 px-3 py-2">{label}</h3>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <ChatHistoryItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onSelect={() => onSelectConversation(conv.id)}
            onDelete={() => onDeleteConversation(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Date Grouping Logic

```typescript
// src/lib/ai-buddy/date-grouping.ts

import { isToday, isYesterday, differenceInDays } from 'date-fns';

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export function groupConversationsByDate(
  conversations: Conversation[]
): ConversationGroup[] {
  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 days': [],
    'Older': [],
  };

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);

    if (isToday(date)) {
      groups['Today'].push(conv);
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(conv);
    } else if (differenceInDays(new Date(), date) <= 7) {
      groups['Previous 7 days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  }

  // Return only non-empty groups
  return Object.entries(groups)
    .filter(([_, convs]) => convs.length > 0)
    .map(([label, conversations]) => ({ label, conversations }));
}
```

### ChatHistoryItem Updates

```typescript
// Enhanced chat-history-item.tsx

interface ChatHistoryItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

// Display:
// - Title (first 30 chars of first message or "New conversation")
// - Project badge (if projectId exists): small pill showing project name
// - Relative timestamp: "2h ago", "Yesterday", etc.
// - Delete button on hover
```

---

## Sub-Tasks

### Phase A: Date Grouping Utility

- [ ] **T1:** Create `src/lib/ai-buddy/date-grouping.ts` with `groupConversationsByDate` function
- [ ] **T2:** Unit tests for date grouping:
  - Conversations from today grouped under "Today"
  - Conversations from yesterday grouped under "Yesterday"
  - Last 7 days grouped correctly
  - Older conversations grouped
  - Empty groups not returned

### Phase B: Conversation Group Component

- [ ] **T3:** Create `src/components/ai-buddy/conversation-group.tsx`
- [ ] **T4:** Update `chat-history-item.tsx`:
  - Add project name badge (if conversation has projectId)
  - Add relative timestamp display
  - Ensure delete button visible on hover
- [ ] **T5:** Component tests for ConversationGroup
- [ ] **T6:** Component tests for updated ChatHistoryItem

### Phase C: Sidebar Integration

- [ ] **T7:** Update `project-sidebar.tsx` to use date-grouped conversation display:
  - Import `groupConversationsByDate`
  - Render `ConversationGroup` for each group
  - Show "Load more" button when nextCursor exists
- [ ] **T8:** Ensure conversation filtering by project works:
  - When project selected: show only that project's conversations
  - When no project: show all conversations (including general)
- [ ] **T9:** Integration tests for sidebar conversation display

### Phase D: General Chat Mode

- [ ] **T10:** Verify "New Chat" button creates conversation with `projectId: null`
- [ ] **T11:** Update header display logic:
  - If activeProject is null AND selectedConversation has no projectId: show "AI Buddy"
  - If activeProject is set: show "AI Buddy · [Project Name]" (from 16.2)
- [ ] **T12:** Verify general conversations appear in Recent when no project filter
- [ ] **T13:** Test: General chat can attach documents inline (existing functionality)

### Phase E: Pagination

- [ ] **T14:** Add "Load more" button to sidebar when `nextCursor` exists
- [ ] **T15:** Wire up `fetchConversations({ cursor: nextCursor })` on button click
- [ ] **T16:** Test pagination loads additional conversations correctly

### Phase F: E2E Testing

- [ ] **T17:** E2E test: Conversations grouped by date in sidebar
- [ ] **T18:** E2E test: Clicking conversation loads it
- [ ] **T19:** E2E test: New Chat without project creates general conversation
- [ ] **T20:** E2E test: General conversation shows "AI Buddy" header (no project)
- [ ] **T21:** E2E test: Project filter shows only that project's conversations
- [ ] **T22:** E2E test: Load more pagination

---

## Test Scenarios

### Unit Tests

| Scenario | Expected |
|----------|----------|
| groupConversationsByDate with mixed dates | Returns 4 groups with correct conversations |
| groupConversationsByDate with only today | Returns single "Today" group |
| groupConversationsByDate with empty array | Returns empty array |
| ChatHistoryItem with projectId | Shows project name badge |
| ChatHistoryItem without projectId | No project badge shown |
| ChatHistoryItem relative time | Shows "2h ago" format |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| GET /conversations with projectId filter | Returns only that project's conversations |
| GET /conversations without projectId | Returns all user's conversations |
| POST /chat without projectId | Creates conversation with project_id = NULL |
| Conversation with project_id = NULL | Shows in general chat list |

### E2E Tests

| Scenario | Expected |
|----------|----------|
| Open AI Buddy | Conversations grouped by Today/Yesterday/etc |
| Click conversation | Loads in chat area, becomes active |
| Click New Chat (no project selected) | Empty chat, header shows "AI Buddy" |
| Send message in general chat | Conversation persists with null projectId |
| Select project then view Recent | Only that project's conversations shown |
| Click Load More | Additional conversations appear |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Story 16.1: Project Sidebar | Hard | Done | Sidebar structure to extend |
| Story 16.2: Context Switching | Soft | In Progress | Header display logic |
| chat-history-item.tsx | Soft | Done | Epic 15.4 |
| use-conversations.ts | Soft | Done | Epic 15.4 |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.1.0 | Date comparison (isToday, isYesterday, differenceInDays) |
| `lucide-react` | ^0.554.0 | Icons |

---

## Out of Scope

- Conversation search (Story 16.5)
- Delete/Move conversations (Story 16.6)
- Pinned conversations
- Conversation folders/tags
- Bulk operations on conversations

---

## Definition of Done

- [ ] All acceptance criteria (AC-16.4.1 through AC-16.4.11) verified
- [ ] All sub-tasks (T1 through T22) completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Merged to main

---

## Dev Notes

### Architecture Patterns

- **Date Grouping in Client:** Using date-fns for grouping avoids server complexity. If slow, consider server-side grouping.
- **Null projectId = General Chat:** Explicitly use NULL in database for unassociated conversations
- **Optimistic UI:** Conversation list updates immediately when creating new chat

### Existing Code to Reference

- `src/components/ai-buddy/chat-history-item.tsx` - Existing item component to extend
- `src/components/ai-buddy/project-sidebar.tsx` - Sidebar structure
- `src/hooks/ai-buddy/use-conversations.ts` - Conversation fetching with projectId filter
- `src/contexts/ai-buddy-context.tsx` - Context management

### Project Structure Notes

```
src/
├── components/ai-buddy/
│   ├── conversation-group.tsx        # NEW
│   ├── chat-history-item.tsx         # MODIFY - add project badge, timestamp
│   └── project-sidebar.tsx           # MODIFY - use date groups
├── lib/ai-buddy/
│   └── date-grouping.ts              # NEW
├── app/(dashboard)/ai-buddy/
│   └── page.tsx                      # MODIFY - general chat header
└── hooks/ai-buddy/
    └── use-conversations.ts          # VERIFY - projectId filter works
```

### References

- [Source: docs/sprint-artifacts/epics/epic-16/tech-spec.md#Story-16.4]
- [Source: docs/features/ai-buddy/architecture.md#Data-Architecture]
- [Source: docs/features/ai-buddy/ux-design/ux-design-specification.md]

---

## Learnings from Previous Story

**From Story 16.1 (Status: Done)**

- **Sidebar Structure:** `ProjectSidebar` has sections for Projects and Recent - extend Recent section
- **ChatHistoryItem:** Existing component shows conversation title and delete action
- **Context Integration:** `useAiBuddyContext` provides conversations list and selection methods
- **Test Organization:** Component tests in `__tests__/components/ai-buddy/`

**From Story 15.4 (Conversation Persistence):**

- **useConversations Hook:** Already supports `projectId` filter in options
- **Conversation Model:** Already has `projectId` field (nullable)
- **Chat API:** Creates conversations with projectId from request body

**Files Created Previously (Available for Extension):**
- `src/components/ai-buddy/chat-history-item.tsx` - EXTEND with project badge
- `src/components/ai-buddy/project-sidebar.tsx` - EXTEND with date groups
- `src/hooks/ai-buddy/use-conversations.ts` - VERIFY projectId filtering

[Source: docs/sprint-artifacts/epics/epic-16/stories/16-1-project-creation-sidebar/16-1-project-creation-sidebar.md]

---

## Dev Agent Record

### Context Reference

- [16-4-conversation-history-general-chat.context.xml](./16-4-conversation-history-general-chat.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **2025-12-08**: Code review APPROVED
  - All 11 ACs verified ✅ (some context-dependent)
  - Unit tests: 2009 passing (10 date-grouping tests)
  - Build: ✅ Passes
  - Security: No Supabase advisory issues
  - Excellent test coverage for date grouping edge cases

### File List

**Created:**
- `src/lib/ai-buddy/date-grouping.ts`
- `src/components/ai-buddy/conversation-group.tsx`
- `__tests__/lib/ai-buddy/date-grouping.test.ts`
- `__tests__/components/ai-buddy/conversation-group.test.tsx`
- `__tests__/e2e/ai-buddy-conversation-history.spec.ts`

**Modified:**
- `src/components/ai-buddy/chat-history-item.tsx` - Added projectName badge
- `src/components/ai-buddy/project-sidebar.tsx` - Added date groups, Load more
- `src/contexts/ai-buddy-context.tsx` - Added pagination state
- `src/app/(dashboard)/ai-buddy/layout.tsx` - Wired up handlers
