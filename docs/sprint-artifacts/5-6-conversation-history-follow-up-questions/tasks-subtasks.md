# Tasks / Subtasks

- [x] **Task 1: Create Chat Service for Conversation CRUD** (AC: 5.6.2, 5.6.3, 5.6.10, 5.6.11, 5.6.12)
  - [x] Create `src/lib/chat/service.ts` with conversation operations
  - [x] Implement `getOrCreateConversation(documentId, userId)` with upsert pattern for race condition safety
  - [x] Implement `getConversationMessages(conversationId)` function
  - [x] Implement `saveUserMessage(conversationId, content)` with error handling
  - [x] Implement `saveAssistantMessage(conversationId, content, sources, confidence)` function
  - [x] Implement `createNewConversation(documentId, userId)` for New Chat
  - [x] Add TypeScript types matching database schema
  - [x] Add proper error types and handling for all operations

- [x] **Task 2: Create useConversation Hook** (AC: 5.6.1, 5.6.4, 5.6.11)
  - [x] Create `src/hooks/use-conversation.ts` hook
  - [x] Implement loading state management for initial fetch
  - [x] Load conversation and messages on documentId change
  - [x] Expose messages, isLoading, error states
  - [x] Handle case where no conversation exists (empty state)
  - [x] Expose refetch function for after new message
  - [x] Implement error state with retry capability

- [x] **Task 3: Update Chat API Route for Conversation Persistence** (AC: 5.6.2, 5.6.6, 5.6.11)
  - [x] Update `src/app/api/chat/route.ts` to persist messages (already implemented in Story 5.3)
  - [x] Accept conversationId in request body
  - [x] Save user message before RAG processing (fail fast if save fails)
  - [x] Buffer streaming response content during generation
  - [x] Save assistant message after streaming completes (on done event)
  - [x] Include last 10 messages in RAG context
  - [x] Return conversationId and messageId in done event
  - [x] Handle and report save errors appropriately

- [x] **Task 4: Build RAG Prompt with Conversation History** (AC: 5.6.5, 5.6.6)
  - [x] Update `src/lib/chat/rag.ts` to accept conversation history (already implemented)
  - [x] Format messages as role: content pairs
  - [x] Limit to last 10 individual messages
  - [x] Implement token budget estimation (~4 chars per token)
  - [x] Truncate oldest messages if history exceeds 6000 token budget
  - [x] Place history between system prompt and current query

- [x] **Task 5: Update ChatPanel for History Display** (AC: 5.6.1, 5.6.4, 5.6.11)
  - [x] Update `src/components/chat/chat-panel.tsx` to use useConversation
  - [x] Render messages from database instead of local state only
  - [x] Add loading skeleton while fetching history
  - [x] Auto-scroll to bottom on new messages
  - [x] Create empty state component with example questions
  - [x] Handle error state with retry button

- [x] **Task 6: Implement New Chat Button** (AC: 5.6.7)
  - [x] Add "New Chat" button to chat panel header
  - [x] Use MessageSquarePlus icon from lucide-react
  - [x] Style as ghost button per UX spec
  - [x] Disable button while streaming response (check isStreaming state)
  - [x] Add Tooltip component with "Start a fresh conversation about this document"
  - [x] Position in header alongside document title

- [x] **Task 7: Implement New Chat Confirmation Dialog** (AC: 5.6.8, 5.6.9)
  - [x] Create confirmation dialog using shadcn/ui Dialog component
  - [x] Dialog title: "Start a new conversation?"
  - [x] Dialog body: "This will clear the current conversation from view. Your conversation history will be saved."
  - [x] Cancel button closes dialog (also Escape key)
  - [x] Start New button calls createNewConversation and clears panel (also Enter key)
  - [x] Add keyboard event handlers for Enter/Escape

- [x] **Task 8: Integrate Conversation Flow in Document Page** (AC: 5.6.3, 5.6.4, 5.6.12)
  - [x] Document page already passes documentId to ChatPanel
  - [x] useConversation and useChat hooks now sync conversation state
  - [x] Handle conversation state across source click navigation
  - [x] Ensure conversation persists across component re-renders

- [x] **Task 9: Testing and Verification** (AC: All)
  - [x] **Unit tests for chat service** (17 tests in `__tests__/lib/chat/service.test.ts`)
  - [x] **Hook tests for useConversation** (7 tests in `__tests__/hooks/use-conversation.test.ts`)
  - [x] **ChatPanel tests** (19 tests in `__tests__/components/chat/chat-panel.test.tsx`)
  - [x] Run build and verify no type errors
  - [x] Verify test baseline maintained (688 tests passing)
