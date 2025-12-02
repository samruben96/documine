'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ConfidenceBadge, type ConfidenceLevel } from './confidence-badge';
import type { SourceCitation } from '@/lib/chat/types';
import { RefreshCw } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  confidence?: ConfidenceLevel;
  sources?: SourceCitation[];
  isStreaming?: boolean;
  error?: {
    code: string;
    message: string;
    canRetry: boolean;
  };
}

interface ChatMessageProps {
  message: ChatMessageData;
  className?: string;
  onRetry?: (messageId: string) => void;
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
 *
 * Implements AC-5.3.2: Confidence badge after streaming completes
 * Implements AC-5.3.3, AC-5.3.4, AC-5.3.5: Confidence badge variants
 * Implements AC-5.3.8, AC-5.3.9, AC-5.3.10: Error handling with retry button
 */
export function ChatMessage({ message, className, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const hasError = !!message.error;
  const showConfidence = !isUser && !isStreaming && !hasError && message.confidence;

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
            : hasError
            ? 'bg-red-50 text-red-800 border border-red-200' // Error state
            : 'bg-slate-100 text-slate-800' // Surface color for assistant
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
          {/* Streaming cursor indicator */}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse" />
          )}
        </p>

        {/* Retry button for errors - AC-5.3.8, AC-5.3.10 */}
        {hasError && message.error?.canRetry && onRetry && (
          <button
            onClick={() => onRetry(message.id)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            aria-label="Retry sending message"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>

      {/* Trust elements container - shown after streaming completes */}
      {!isUser && !isStreaming && (
        <div className="flex items-center gap-2 pl-1">
          {/* Confidence Badge - AC-5.3.2, AC-5.3.3, AC-5.3.4, AC-5.3.5 */}
          {showConfidence && (
            <ConfidenceBadge confidence={message.confidence!} />
          )}

          {/* Timestamp */}
          <span className="text-xs text-slate-400">
            {relativeTime}
          </span>
        </div>
      )}

      {/* User message timestamp */}
      {isUser && (
        <span className="text-xs text-slate-400 pr-1">
          {relativeTime}
        </span>
      )}
    </div>
  );
}
