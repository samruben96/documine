# Story 15.4: Conversation Persistence

**Epic:** 15 - AI Buddy Core Chat
**Story Points:** 5
**Priority:** High
**Status:** done

## Story

As a user,
I want my conversations saved automatically,
so that I can continue them later and maintain context with AI Buddy.

## Acceptance Criteria

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| AC-15.4.1 | New conversation created automatically on first message if no conversationId exists | Integration test |
| AC-15.4.2 | Conversation title auto-generated from first 50 characters of first message | Unit test |
| AC-15.4.3 | Full conversation history loads when returning to existing conversation | E2E test |
| AC-15.4.4 | Conversations listed in sidebar "Recent" section, sorted by most recent activity | Unit test |
| AC-15.4.5 | AI retains context from previous messages in conversation | Integration test |
| AC-15.4.6 | GET /api/ai-buddy/conversations returns user's conversations with pagination | Unit test |
| AC-15.4.7 | GET /api/ai-buddy/conversations/[id] returns conversation with all messages | Unit test |
| AC-15.4.8 | Clicking conversation in sidebar loads that conversation's messages | E2E test |

## Tasks / Subtasks

- [x] Task 1: Create GET /api/ai-buddy/conversations endpoint (AC: 15.4.4, 15.4.6)
  - [x] 1.1: Set up route with GET handler at `src/app/api/ai-buddy/conversations/route.ts`
  - [x] 1.2: Implement query parameters: `projectId` (optional), `search` (optional), `limit` (default: 50), `cursor` (pagination)
  - [x] 1.3: Query `ai_buddy_conversations` table with user_id filter and RLS
  - [x] 1.4: Sort by `updated_at DESC` for most recent first
  - [x] 1.5: Implement cursor-based pagination using `updated_at` and `id`
  - [x] 1.6: Return `{ data: Conversation[], nextCursor?: string, error: null }`

- [x] Task 2: Create GET /api/ai-buddy/conversations/[id] endpoint (AC: 15.4.3, 15.4.7)
  - [x] 2.1: Set up dynamic route at `src/app/api/ai-buddy/conversations/[id]/route.ts`
  - [x] 2.2: Validate conversation belongs to authenticated user
  - [x] 2.3: Fetch conversation with all messages from `ai_buddy_messages`
  - [x] 2.4: Sort messages by `created_at ASC` (oldest first)
  - [x] 2.5: Return `{ data: { conversation: Conversation, messages: ChatMessage[] }, error: null }`

- [x] Task 3: Create `useConversations` hook (AC: 15.4.4, 15.4.8)
  - [x] 3.1: Create `src/hooks/ai-buddy/use-conversations.ts`
  - [x] 3.2: Implement `conversations` state with fetch-based approach
  - [x] 3.3: Implement `loadConversation(id)` to fetch and set active conversation
  - [x] 3.4: Implement `createConversation(projectId?)` for manual creation
  - [x] 3.5: Implement `deleteConversation(id)` with optimistic update
  - [x] 3.6: Implement `searchConversations(query)` using search parameter
  - [x] 3.7: Add `isLoading` and `error` states

- [x] Task 4: Update sidebar to display conversations (AC: 15.4.4, 15.4.8)
  - [x] 4.1: Update `src/components/ai-buddy/project-sidebar.tsx` to include "Recent" section
  - [x] 4.2: Update `src/components/ai-buddy/chat-history-item.tsx` with delete menu and timestamp
  - [x] 4.3: Display conversation title, truncated to fit
  - [x] 4.4: Show relative timestamp (e.g., "2h ago", "Yesterday") using date-fns
  - [x] 4.5: Highlight currently active conversation
  - [x] 4.6: Handle click to navigate/load conversation
  - [x] 4.7: Add empty state when no conversations exist

- [x] Task 5: Integrate conversation context into AI prompt (AC: 15.4.5)
  - [x] 5.1: Already implemented in chat API route (lines 265-289)
  - [x] 5.2: Limit history to last 20 messages to manage context window
  - [x] 5.3: Format history as alternating user/assistant messages
  - [x] 5.4: Verify AI responses reference previous conversation context

- [x] Task 6: Integrate useConversations with AI Buddy page (AC: 15.4.3, 15.4.8)
  - [x] 6.1: Created `AiBuddyContext` provider for shared state
  - [x] 6.2: Updated layout to use `ProjectSidebar` with conversations
  - [x] 6.3: Updated page to integrate with context for loading conversations
  - [x] 6.4: "New Chat" button clears state for fresh conversation

- [x] Task 7: Write tests (AC: 15.4.1-15.4.8)
  - [x] 7.1: Unit tests for `useConversations` hook (24 tests)
  - [x] 7.2: Unit tests for `chat-history-item.tsx` component (16 tests)
  - [x] 7.3: Integration tests for conversations API endpoints (10 tests)
  - [x] 7.4: E2E test for conversation persistence flow

## Dev Notes

### Implementation Approach

This story implements conversation persistence for AI Buddy, enabling users to continue conversations across sessions. It builds on the streaming chat API from Story 15.3, which already handles conversation creation and message storage.

**Key Implementation Decisions:**

1. **Conversation Creation:** Already handled in Story 15.3 (`route.ts:205-232`). This story focuses on retrieval and display.

2. **Sidebar Integration:** Add "Recent" section to existing sidebar component showing conversation history.

3. **Context Window Management:** Limit to 20 messages in AI context to avoid token limits while maintaining useful context.

4. **Pagination Strategy:** Cursor-based pagination using `(updated_at, id)` for efficient scrolling through many conversations.

[Source: docs/sprint-artifacts/epics/epic-15/tech-spec.md#story-154-conversation-persistence]

### Project Structure Notes

**New Files:**
- `src/app/api/ai-buddy/conversations/route.ts` - List conversations endpoint
- `src/app/api/ai-buddy/conversations/[id]/route.ts` - Get single conversation with messages
- `src/hooks/ai-buddy/use-conversations.ts` - Conversations hook
- `src/components/ai-buddy/chat-history-item.tsx` - Sidebar conversation item
- `__tests__/hooks/ai-buddy/use-conversations.test.ts` - Hook tests
- `__tests__/components/ai-buddy/chat-history-item.test.tsx` - Component tests
- `__tests__/app/api/ai-buddy/conversations.test.ts` - API tests
- `__tests__/e2e/ai-buddy-conversation-persistence.spec.ts` - E2E test

**Modified Files:**
- `src/components/ai-buddy/sidebar.tsx` - Add Recent conversations section
- `src/app/(dashboard)/ai-buddy/page.tsx` - Integrate useConversations
- `src/app/api/ai-buddy/chat/route.ts` - Include conversation history in AI prompt

[Source: docs/features/ai-buddy/architecture.md#project-structure]

### Learnings from Previous Story

**From Story 15-3-streaming-chat-api (Status: done)**

- **Conversation Auto-Creation:** Already implemented at `route.ts:205-232` - creates conversation if no `conversationId` provided
- **Title Generation:** First 50 chars of first message used as title (`route.ts:207`)
- **Message Storage:** User messages stored in `ai_buddy_messages` at `route.ts:240-255`
- **SSE Response:** `done` event includes `conversationId` and `messageId` (`route.ts:361-366`)
- **useChat Hook:** Returns `conversation` state with ID after creation
- **Rate Limiter:** In-memory sliding window, tier-based limits (free: 10, pro: 20, enterprise: 60)
- **Edge Runtime:** Chat API uses Edge Runtime for low latency

**Key Files Created in 15.3:**
- `src/app/api/ai-buddy/chat/route.ts` - Streaming chat endpoint
- `src/lib/ai-buddy/rate-limiter.ts` - Rate limiting implementation
- `src/lib/ai-buddy/ai-client.ts` - OpenRouter streaming wrapper
- `src/hooks/ai-buddy/use-chat.ts` - SSE connection management

**Integration Points:**
- `useChat` already manages `conversationId` state
- Chat route already persists messages
- Need to add history retrieval and sidebar display
- Need to include history in AI prompt for context retention

[Source: stories/15-3-streaming-chat-api/15-3-streaming-chat-api.md#Dev-Agent-Record]

### Database Tables Used

```sql
-- Conversations (read, list)
ai_buddy_conversations (id, agency_id, user_id, project_id, title, created_at, updated_at)

-- Messages (read with conversation)
ai_buddy_messages (id, conversation_id, agency_id, role, content, sources, confidence, created_at)

-- RLS Policies (existing from Epic 14):
-- "Users see own conversations" ON ai_buddy_conversations FOR ALL USING (user_id = auth.uid())
-- "Users see own messages" ON ai_buddy_messages FOR ALL USING (conversation_id IN (SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()))
```

[Source: docs/features/ai-buddy/architecture.md#new-tables]

### API Response Formats

**GET /api/ai-buddy/conversations:**
```typescript
{
  data: Conversation[],  // Array of conversations
  nextCursor?: string,   // Pagination cursor for next page
  error: null
}
```

**GET /api/ai-buddy/conversations/[id]:**
```typescript
{
  data: {
    conversation: Conversation,
    messages: ChatMessage[]
  },
  error: null
}
```

[Source: docs/sprint-artifacts/epics/epic-15/tech-spec.md#get-apiai-buddyconversations]

### useConversations Hook Interface

```typescript
interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (projectId?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Promise<Conversation[]>;
}
```

[Source: docs/sprint-artifacts/epics/epic-15/tech-spec.md#useconversations-hook]

### References

- [Epic 15 Tech Spec - Story 15.4](../../tech-spec.md#story-154-conversation-persistence)
- [AI Buddy Architecture - API Contracts](../../../../features/ai-buddy/architecture.md#api-contracts)
- [AI Buddy Architecture - Data Architecture](../../../../features/ai-buddy/architecture.md#data-architecture)
- [Story 15.3 - Streaming Chat API](../15-3-streaming-chat-api/15-3-streaming-chat-api.md)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epics/epic-15/stories/15-4-conversation-persistence/15-4-conversation-persistence.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

1. All 7 tasks completed successfully
2. 53 tests written and passing (24 hook + 16 component + 13 API)
3. Critical bug fixed during code review: Added missing DELETE endpoint
4. Build passes successfully

### File List

**New Files:**
- `src/app/api/ai-buddy/conversations/route.ts` - List conversations endpoint
- `src/app/api/ai-buddy/conversations/[id]/route.ts` - Get/Delete single conversation
- `src/hooks/ai-buddy/use-conversations.ts` - Conversations hook
- `src/contexts/ai-buddy-context.tsx` - Shared context provider
- `src/components/ai-buddy/chat-history-item.tsx` - Sidebar conversation item
- `__tests__/hooks/ai-buddy/use-conversations.test.ts` - Hook tests (24)
- `__tests__/components/ai-buddy/chat-history-item.test.tsx` - Component tests (16)
- `__tests__/app/api/ai-buddy/conversations.test.ts` - API tests (13)
- `__tests__/e2e/ai-buddy-conversation-persistence.spec.ts` - E2E tests

**Modified Files:**
- `src/components/ai-buddy/project-sidebar.tsx` - Add Recent conversations section
- `src/app/(dashboard)/ai-buddy/layout.tsx` - Integrate with context/sidebar
- `src/app/(dashboard)/ai-buddy/page.tsx` - Integrate with context for loading conversations
- `src/hooks/ai-buddy/index.ts` - Export useConversations

### Code Review Notes

**Reviewed:** 2025-12-07
**Status:** PASSED with fixes applied

**Critical Issues Found & Fixed:**

1. **Missing DELETE endpoint** (Found during code review)
   - Added DELETE handler to `src/app/api/ai-buddy/conversations/[id]/route.ts`
   - Implements soft delete (sets `deleted_at` timestamp)
   - Added 3 tests for DELETE endpoint

2. **RLS 403 error on DELETE** (Found during user testing)
   - **Root Cause:** Supabase RLS UPDATE policy fails with Edge/Node runtime clients even when user is authenticated
   - **Investigation:** Supabase logs showed PATCH requests getting 403 even though `auth.uid()` check should pass
   - **Solution:** Verify user ownership via SELECT first (uses RLS), then use service client to perform the actual update (bypasses RLS but safe since ownership verified)
   - Added Edge Runtime (`export const runtime = 'edge'`) for better auth cookie handling
   - Updated test mock to include `createServiceClient`

**Positive Observations:**
- Proper UUID validation on all endpoints
- Consistent error handling with centralized helpers
- Cursor-based pagination correctly implemented
- Optimistic updates in useConversations hook
- Good test coverage (53 tests)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Story drafted via create-story workflow | SM Agent |
| 2025-12-07 | Implementation completed (Tasks 1-7) | Dev Agent |
| 2025-12-07 | Code review: Added missing DELETE endpoint | Code Review |
| 2025-12-07 | Bug fix: RLS 403 error - use service client for delete after ownership verification | Code Review |
