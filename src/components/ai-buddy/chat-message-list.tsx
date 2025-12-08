/**
 * Chat Message List Component
 * Story 15.2: Message Display Component
 *
 * Renders a scrollable list of chat messages with auto-scroll.
 *
 * Implements:
 * - AC-15.2.3: Messages display in chronological order (oldest at top)
 * - AC-15.2.4: Auto-scroll to newest message when new messages arrive
 * - AC-15.2.7: Typing indicator shown during AI response streaming
 * - AC-15.2.8: Empty state shown when no messages in conversation
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { StreamingIndicator } from './streaming-indicator';
import { cn } from '@/lib/utils';
import type { Message, Citation } from '@/types/ai-buddy';

export interface ChatMessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Whether AI is currently generating a response */
  isLoading?: boolean;
  /** Partial content while streaming (shown in streaming indicator) */
  streamingContent?: string;
  /** Callback when user clicks a citation */
  onCitationClick?: (citation: Citation) => void;
  /** Additional CSS classes */
  className?: string;
  /** User's display name for avatars */
  userName?: string;
}

/**
 * Empty State Component
 * Shown when there are no messages in the conversation
 * AC-15.2.8
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-4"
      data-testid="empty-state"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
        <MessageSquare className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Start a conversation
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Ask AI Buddy anything about insurance policies, coverage details, or
        get help analyzing your documents.
      </p>
    </div>
  );
}

/**
 * Chat Message List Component
 *
 * Renders a scrollable list of chat messages with:
 * - Chronological ordering (oldest at top)
 * - Auto-scroll to bottom on new messages
 * - Streaming indicator during AI response
 * - Empty state when no messages
 */
export function ChatMessageList({
  messages,
  isLoading = false,
  streamingContent,
  onCitationClick,
  className,
  userName,
}: ChatMessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(messages.length);

  /**
   * Check if user is near bottom of scroll container
   * Used to determine whether to auto-scroll
   */
  const isNearBottom = useCallback((): boolean => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  }, []);

  /**
   * Scroll to bottom of message list
   * Uses smooth behavior for better UX
   * AC-15.2.4
   */
  const scrollToBottom = useCallback((smooth = true) => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
      block: 'end',
    });
  }, []);

  /**
   * Auto-scroll when new messages arrive
   * Only scrolls if user is already near the bottom
   * AC-15.2.4
   */
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    // New message arrived
    if (currentCount > prevCount) {
      // Only auto-scroll if user is near bottom
      if (isNearBottom()) {
        scrollToBottom();
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [messages.length, isNearBottom, scrollToBottom]);

  /**
   * Auto-scroll when streaming content updates
   * Keeps the streaming message in view
   */
  useEffect(() => {
    if (isLoading && streamingContent && isNearBottom()) {
      scrollToBottom();
    }
  }, [isLoading, streamingContent, isNearBottom, scrollToBottom]);

  /**
   * Scroll to bottom when isLoading starts
   * Ensures user sees the typing indicator
   */
  useEffect(() => {
    if (isLoading && isNearBottom()) {
      scrollToBottom();
    }
  }, [isLoading, isNearBottom, scrollToBottom]);

  // AC-15.2.8: Show empty state when no messages
  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1 overflow-hidden', className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'flex-1 overflow-y-auto',
        // Add padding for content
        'px-4 py-2',
        className
      )}
      data-testid="chat-message-list"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {/* AC-15.2.3: Messages in chronological order (oldest at top) */}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onCitationClick={onCitationClick}
          userName={userName}
        />
      ))}

      {/* AC-15.2.7: Streaming indicator during AI response */}
      {isLoading && (
        <StreamingIndicator
          isVisible={true}
          streamingContent={streamingContent}
        />
      )}

      {/* Scroll anchor for auto-scroll */}
      <div ref={scrollAnchorRef} aria-hidden="true" />
    </div>
  );
}
