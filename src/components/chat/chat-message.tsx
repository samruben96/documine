'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ConfidenceBadge, type ConfidenceLevel } from './confidence-badge';
import { SourceCitationList } from './source-citation';
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
  onSourceClick?: (source: SourceCitation) => void;
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
 *
 * Implements AC-5.4.1, AC-5.4.2: Source citation display after confidence badge
 * Implements AC-5.4.3, AC-5.4.4: Multiple sources and expandable sources UI
 */
export function ChatMessage({ message, className, onRetry, onSourceClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const hasError = !!message.error;
  const showConfidence = !isUser && !isStreaming && !hasError && message.confidence;
  // AC-5.4.1: Only show sources for assistant messages after streaming completes
  const showSources = !isUser && !isStreaming && !hasError && message.sources && message.sources.length > 0;

  // Memoize the relative time calculation
  const relativeTime = useMemo(() => formatRelativeTime(message.createdAt), [message.createdAt]);

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isUser ? 'items-end' : 'items-start',
        className
      )}
      data-testid="chat-message"
      data-role={message.role}
    >
      {/* Message Bubble - AC-6.8.1: User messages use brand accent color */}
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground shadow-sm' // Electric Blue brand accent
            : hasError
            ? 'bg-red-50 text-red-800 border border-red-200' // Error state
            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' // Surface color for assistant
        )}
      >
        {/* AC-6.8.16: Markdown rendering for assistant messages */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="text-sm markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="my-2 p-3 bg-slate-200 dark:bg-slate-700 rounded-md overflow-x-auto">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                a: ({ href, children }) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary pl-3 italic my-2">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 bg-slate-100 dark:bg-slate-700 font-medium text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {/* Streaming cursor indicator */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse" />
            )}
          </div>
        )}

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
        <div className="flex flex-col gap-1 pl-1">
          {/* Row 1: Confidence Badge + Timestamp */}
          <div className="flex items-center gap-2">
            {/* Confidence Badge - AC-5.3.2, AC-5.3.3, AC-5.3.4, AC-5.3.5 */}
            {showConfidence && (
              <ConfidenceBadge confidence={message.confidence!} />
            )}

            {/* Timestamp */}
            <span className="text-xs text-slate-400">
              {relativeTime}
            </span>
          </div>

          {/* Row 2: Source Citations - AC-5.4.1, AC-5.4.2, AC-5.4.3, AC-5.4.4 */}
          {showSources && (
            <SourceCitationList
              sources={message.sources!}
              onSourceClick={onSourceClick}
            />
          )}
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
