'use client';

import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChatInput } from './chat-input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  documentId: string;
  className?: string;
  onFocusInput?: () => void;
}

/**
 * Chat Panel Component
 *
 * Implements AC-5.1.2: Scrollable conversation history with fixed input area.
 * Implements AC-5.1.3: Placeholder text "Ask a question..." with muted color.
 *
 * Layout:
 * - Scrollable conversation history area
 * - Fixed input area at bottom
 */
export function ChatPanel({ documentId, className, onFocusInput }: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<{ focus: () => void } | null>(null);

  // Empty messages array - will be populated when chat functionality is added
  // Memoized to prevent unnecessary re-renders
  const messages: Message[] = useMemo(() => [], []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message - placeholder for now
  const handleSendMessage = (message: string) => {
    // Will be implemented in Story 5.2/5.3 with actual AI chat
    console.log('Message sent:', message, 'for document:', documentId);
  };

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
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
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
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
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
        />
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
}

/**
 * Chat Message Component
 *
 * Displays a single message in the conversation.
 * User messages: right-aligned with primary color
 * AI messages: left-aligned with surface color
 */
function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-slate-600 text-white' // Primary Slate #475569 (using slate-600 as closest)
            : 'bg-slate-100 text-slate-800' // Surface color
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
