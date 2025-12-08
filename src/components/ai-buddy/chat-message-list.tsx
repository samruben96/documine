/**
 * Chat Message List Component
 * Story 15.2: Message Display Component
 *
 * Renders a virtualized scrollable list of chat messages with auto-scroll.
 * Uses react-virtuoso for performance with large message histories.
 *
 * Implements:
 * - AC-15.2.3: Messages display in chronological order (oldest at top)
 * - AC-15.2.4: Auto-scroll to newest message when new messages arrive
 * - AC-15.2.7: Typing indicator shown during AI response streaming
 * - AC-15.2.8: Empty state shown when no messages in conversation
 * - Performance: Virtualized rendering for 500+ message conversations
 */

'use client';

import { useRef, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
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
 * Renders a virtualized list of chat messages with:
 * - Chronological ordering (oldest at top)
 * - Auto-scroll to bottom on new messages (followOutput)
 * - Streaming indicator during AI response
 * - Empty state when no messages
 * - Virtualization for performance at scale
 */
export function ChatMessageList({
  messages,
  isLoading = false,
  streamingContent,
  onCitationClick,
  className,
  userName,
}: ChatMessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  /**
   * Render individual message item
   * Used by Virtuoso's itemContent prop
   */
  const renderMessage = useCallback(
    (index: number, message: Message) => (
      <ChatMessage
        key={message.id}
        message={message}
        onCitationClick={onCitationClick}
        userName={userName}
      />
    ),
    [onCitationClick, userName]
  );

  /**
   * Footer component containing streaming indicator
   * Rendered after all messages when AI is generating
   */
  const Footer = useCallback(() => {
    if (!isLoading) return null;
    return (
      <StreamingIndicator
        isVisible={true}
        streamingContent={streamingContent}
      />
    );
  }, [isLoading, streamingContent]);

  // AC-15.2.8: Show empty state when no messages
  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1 overflow-hidden', className)}>
        <EmptyState />
      </div>
    );
  }

  // Show just streaming indicator when loading with no messages
  if (messages.length === 0 && isLoading) {
    return (
      <div
        className={cn('flex-1 overflow-y-auto px-4 py-2', className)}
        data-testid="chat-message-list"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <StreamingIndicator
          isVisible={true}
          streamingContent={streamingContent}
        />
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      itemContent={renderMessage}
      components={{ Footer }}
      // AC-15.2.4: Auto-scroll to newest message
      // 'smooth' follows new messages when user is at bottom
      followOutput="smooth"
      // Start scrolled to bottom (chat-style)
      initialTopMostItemIndex={messages.length - 1}
      // Overscan for smoother scrolling
      overscan={200}
      className={cn('flex-1', className)}
      data-testid="chat-message-list"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      style={{ height: '100%' }}
    />
  );
}
