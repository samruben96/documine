'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChatInput, type ChatInputRef } from './chat-input';
import { ChatMessage } from './chat-message';
import { SuggestedQuestions } from './suggested-questions';
import { ThinkingIndicator } from './thinking-indicator';
import { useChat } from '@/hooks/use-chat';

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
  return messages.some(m => m.isStreaming);
}

/**
 * Chat Panel Component
 *
 * Implements AC-5.1.2: Scrollable conversation history with fixed input area.
 * Implements AC-5.1.3: Placeholder text "Ask a question..." with muted color.
 * Implements AC-5.2.5: Suggested questions for empty conversations.
 * Implements AC-5.2.6: Suggested question click behavior.
 * Implements AC-5.2.7: Message send behavior with user message display.
 * Implements AC-5.2.8: Thinking indicator while waiting for response.
 * Implements AC-5.2.9: Input disabled during response.
 *
 * Layout:
 * - Scrollable conversation history area
 * - Suggested questions when conversation is empty
 * - Thinking indicator when loading
 * - Fixed input area at bottom
 */
export function ChatPanel({ documentId, className, onFocusInput, onSourceClick }: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputRef>(null);

  // Use the chat hook for state management
  const { messages, isLoading, sendMessage, retryMessage } = useChat(documentId);

  // Determine if conversation is empty (for showing suggestions)
  const isEmptyConversation = messages.length === 0;

  // Check if we're currently streaming a response
  const isStreaming = hasStreamingMessage(messages);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle send message
  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  // Handle suggested question click - AC-5.2.6
  const handleSuggestionSelect = useCallback((question: string) => {
    // Fill the input field with the selected question
    if (inputRef.current) {
      inputRef.current.setValue(question);
      inputRef.current.focus();
    }
  }, []);

  // Expose focus method to parent
  useEffect(() => {
    if (onFocusInput) {
      onFocusInput();
    }
  }, [onFocusInput]);

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-white',
        className
      )}
    >
      {/* Chat Header */}
      <div className="flex-shrink-0 h-14 border-b border-slate-200 flex items-center px-4">
        <h2 className="font-medium text-slate-700">Chat</h2>
      </div>

      {/* Scrollable Conversation History Area - AC-5.1.2 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {isEmptyConversation && !isLoading ? (
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
                Ask questions about this document
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Get answers with source citations
              </p>
            </div>
            {/* Suggested Questions - AC-5.2.5, AC-5.2.6 */}
            <SuggestedQuestions onSelect={handleSuggestionSelect} />
          </div>
        ) : (
          // Messages and thinking indicator
          <div className="space-y-4">
            {messages.map((message) => (
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
    </div>
  );
}
