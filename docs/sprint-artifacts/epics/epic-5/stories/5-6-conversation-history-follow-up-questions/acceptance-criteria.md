# Acceptance Criteria

## AC-5.6.1: Conversation History Visible in Chat Panel
- Conversation history visible in scrollable chat panel
- Messages displayed in chronological order (oldest first)
- User messages right-aligned with primary color bubble
- Assistant messages left-aligned with surface color bubble
- Chat panel auto-scrolls to latest message on new messages

## AC-5.6.2: Conversations Persisted to Database
- Conversations persisted to database (conversations + chat_messages tables)
- User message saved to database before AI processing begins
- Assistant message saved to database after streaming response completes
- Sources and confidence stored with assistant messages (JSONB)
- Conversation updated_at timestamp updated on each message
- If user message save fails, show error toast and do not proceed with AI call

## AC-5.6.3: Per-Document Conversations
- Each document has its own conversation (conversation.document_id)
- User can only access conversations for documents in their agency
- Creating a conversation for a document with existing conversation returns existing
- Conversation includes agency_id for RLS enforcement
- Race condition handled: concurrent requests get same conversation (not duplicates)

## AC-5.6.4: Returning to Document Shows Previous Conversation
- Returning to document shows previous conversation
- Messages loaded from database on document page mount
- Loading skeleton shown while fetching conversation history
- Empty state shown if no previous conversation: "Ask anything about this document" with 2-3 example questions relevant to insurance documents

## AC-5.6.5: Follow-up Questions Understand Context
- Follow-up questions understand context from conversation history
- Example: After asking "What is the liability limit?", asking "Is that per occurrence?" correctly references the liability limit
- Example: "Tell me more about that" expands on the previous answer
- Example: "What about property damage?" understands we're discussing coverage limits
- AI receives conversation history to maintain context

## AC-5.6.6: Last 10 Messages in RAG Prompt
- Last 10 individual messages included in RAG prompt (not 10 exchanges/20 messages)
- Messages formatted as role: content pairs
- Older messages beyond 10 are not included (token efficiency)
- Token budget validated: system prompt + document chunks + history must fit within 6000 tokens for history portion
- If history exceeds budget, truncate oldest messages first

## AC-5.6.7: New Chat Button Visible
- "New Chat" button visible in chat panel header
- Button styled as ghost button per UX spec
- Button disabled while AI is generating response
- Button icon: MessageSquarePlus from lucide-react
- Tooltip on hover: "Start a fresh conversation about this document"

## AC-5.6.8: New Chat Confirmation Dialog
- Clicking "New Chat" shows confirmation dialog: "Start a new conversation?"
- Dialog body: "This will clear the current conversation from view. Your conversation history will be saved."
- "Cancel" and "Start New" buttons in dialog
- Enter key confirms (starts new), Escape key cancels
- Modal uses Dialog component from shadcn/ui

## AC-5.6.9: New Chat Creates New Conversation
- Confirming "New Chat" creates new conversation record
- Chat panel clears and shows empty state with example questions
- New conversation_id generated for subsequent messages
- Old conversation remains in database (can be accessed later)

## AC-5.6.10: Old Conversations Not Deleted
- Old conversations remain in database (not deleted, just new one created)
- Only latest conversation shown for a document (by updated_at)
- Historical conversations preserved for audit/compliance
- No manual delete conversation feature in MVP

## AC-5.6.11: Error Handling for Database Operations
- If saving user message fails: show error toast "Failed to save message. Please try again."
- If saving assistant message fails: show warning toast but keep message visible in UI
- If loading conversation fails: show error state with retry button
- Network errors handled gracefully with user-friendly messages

## AC-5.6.12: Concurrent Access Handling
- Multiple browser tabs with same document share same conversation
- Race condition on conversation creation handled via database upsert pattern
- No duplicate conversations created for same document/user pair
- New messages from other tabs not auto-synced (acceptable for MVP)
