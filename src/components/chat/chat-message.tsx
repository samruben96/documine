'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
  className?: string;
}

/**
 * Format relative time for message timestamps
 * Examples: "just now", "2 min ago", "1 hr ago", "3 hrs ago"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return 'just now';
  }
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  if (diffHr === 1) {
    return '1 hr ago';
  }
  if (diffHr < 24) {
    return `${diffHr} hrs ago`;
  }
  // For older messages, show date
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Chat Message Component
 *
 * Implements AC-5.2.7: Message send behavior
 * - User messages: right-aligned with primary color bubble (#475569)
 * - Assistant messages: left-aligned with gray background
 * - Message bubble shows sender's text with timestamp
 * - Supports markdown rendering in messages (basic whitespace preservation)
 */
export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Memoize the relative time calculation
  const relativeTime = useMemo(() => formatRelativeTime(message.createdAt), [message.createdAt]);

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isUser ? 'items-end' : 'items-start',
        className
      )}
    >
      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-slate-600 text-white' // Primary Slate #475569 (slate-600 closest match)
            : 'bg-slate-100 text-slate-800' // Surface color for assistant
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {/* Timestamp */}
      <span
        className={cn(
          'text-xs text-slate-400',
          isUser ? 'pr-1' : 'pl-1'
        )}
      >
        {relativeTime}
      </span>
    </div>
  );
}
