'use client';

/**
 * Chat Panel Component
 *
 * Story 5.6: Conversation History & Follow-up Questions
 * AC-5.6.1: Conversation history visible in scrollable chat panel
 * AC-5.6.4: Returning to document shows previous conversation
 * AC-5.6.7: New Chat button visible
 * AC-5.6.8: New Chat confirmation dialog
 * AC-5.6.11: Error handling for database operations
 *
 * @module @/components/chat/chat-panel
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatInput, type ChatInputRef } from './chat-input';
import { ChatMessage } from './chat-message';
import { SuggestedQuestions } from './suggested-questions';
import { ThinkingIndicator } from './thinking-indicator';
import { useChat } from '@/hooks/use-chat';
import { useConversation } from '@/hooks/use-conversation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChatPanelProps {
  documentId: string;
  className?: string;
  onFocusInput?: () => void;
  onSourceClick?: (source: import('@/lib/chat/types').SourceCitation) => void;
}

/**
 * Check if any message is currently streaming
 */
function hasStreamingMessage(messages: { isStreaming?: boolean }[]): boolean {
  return messages.some((m) => m.isStreaming);
}

/**
 * Loading skeleton for conversation history
 * AC-5.6.4: Loading skeleton shown while fetching conversation history
 */
function ChatLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading conversation">
      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {/* User message skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Another assistant message */}
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

/**
 * Error state with retry button
 * AC-5.6.11: Error state with retry button on load failure
 */
function ChatErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="text-destructive mb-4">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-600 mb-4">{error}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

/**
 * Chat Panel Component
 *
 * Layout:
 * - Header with title and New Chat button
 * - Scrollable conversation history area
 * - Suggested questions when conversation is empty
 * - Thinking indicator when loading
 * - Fixed input area at bottom
 */
export function ChatPanel({
  documentId,
  className,
  onFocusInput,
  onSourceClick,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputRef>(null);

  // Dialog state for New Chat confirmation
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  // Use conversation hook for loading history (AC-5.6.4)
  const {
    conversation,
    messages: persistedMessages,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
    createNew: createNewConversation,
  } = useConversation(documentId);

  // Use the chat hook for sending messages and streaming
  // Pass the loaded conversation ID and messages to sync state
  const {
    messages: streamingMessages,
    isLoading,
    sendMessage,
    retryMessage,
    clearMessages,
    conversationId,
  } = useChat(documentId, {
    initialConversationId: conversation?.id ?? null,
    initialMessages: persistedMessages,
  });

  // Merge persisted messages with streaming messages
  // If streaming has messages, use those (they include persisted + new)
  // Otherwise show persisted messages
  // Both types are compatible with ChatMessageData
  const displayMessages =
    streamingMessages.length > 0 ? streamingMessages : persistedMessages;

  // Determine if conversation is empty (for showing suggestions)
  const isEmptyConversation = displayMessages.length === 0 && !isLoadingHistory;

  // Check if we're currently streaming a response
  const isStreaming = hasStreamingMessage(streamingMessages);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [displayMessages, isLoading]);

  // Handle send message
  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  // Handle suggested question click - AC-5.2.6
  const handleSuggestionSelect = useCallback((question: string) => {
    // Fill the input field with the selected question
    if (inputRef.current) {
      inputRef.current.setValue(question);
      inputRef.current.focus();
    }
  }, []);

  // Handle New Chat button click - AC-5.6.7
  const handleNewChatClick = useCallback(() => {
    setShowNewChatDialog(true);
  }, []);

  // Handle New Chat confirmation - AC-5.6.9
  const handleNewChatConfirm = useCallback(async () => {
    setShowNewChatDialog(false);
    await createNewConversation();
    clearMessages();
  }, [createNewConversation, clearMessages]);

  // Handle keyboard events for dialog - AC-5.6.8
  const handleDialogKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleNewChatConfirm();
      }
    },
    [handleNewChatConfirm]
  );

  // Expose focus method to parent
  useEffect(() => {
    if (onFocusInput) {
      onFocusInput();
    }
  }, [onFocusInput]);

  return (
    <div className={cn('h-full flex flex-col bg-white', className)} data-testid="chat-panel">
      {/* Chat Header with New Chat Button - AC-5.6.7 */}
      <div className="flex-shrink-0 h-14 border-b border-slate-200 flex items-center justify-between px-4">
        <h2 className="font-medium text-slate-700">Chat</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNewChatClick}
              disabled={isLoading || isStreaming}
              aria-label="Start a new conversation"
            >
              <MessageSquarePlus className="h-5 w-5 text-slate-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Start a fresh conversation about this document
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Scrollable Conversation History Area - AC-5.6.1 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {/* Loading State - AC-5.6.4 */}
        {isLoadingHistory ? (
          <ChatLoadingSkeleton />
        ) : historyError ? (
          /* Error State - AC-5.6.11 */
          <ChatErrorState error={historyError} onRetry={refetchHistory} />
        ) : isEmptyConversation && !isLoading ? (
          // Empty state with suggested questions - AC-5.2.5
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center px-4 mb-6">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-4 text-sm text-slate-600">
                Ask anything about this document
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Get answers with source citations
              </p>
            </div>
            {/* Suggested Questions - AC-5.2.5, AC-5.2.6 */}
            <SuggestedQuestions onSelect={handleSuggestionSelect} data-testid="suggested-questions" />
          </div>
        ) : (
          // Messages and thinking indicator
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={retryMessage}
                onSourceClick={onSourceClick}
              />
            ))}
            {/* Thinking Indicator - AC-5.2.8 - only show when loading and not streaming */}
            {isLoading && !isStreaming && <ThinkingIndicator />}
          </div>
        )}
      </div>

      {/* Fixed Input Area at Bottom - AC-5.1.2 */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4">
        <ChatInput
          ref={inputRef}
          onSend={handleSendMessage}
          placeholder="Ask a question..."
          autoFocus
          isLoading={isLoading || isStreaming}
        />
      </div>

      {/* New Chat Confirmation Dialog - AC-5.6.8 */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent onKeyDown={handleDialogKeyDown}>
          <DialogHeader>
            <DialogTitle>Start a new conversation?</DialogTitle>
            <DialogDescription>
              This will clear the current conversation from view. Your
              conversation history will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewChatDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleNewChatConfirm}>Start New</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
