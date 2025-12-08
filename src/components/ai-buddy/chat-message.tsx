/**
 * Chat Message Component
 * Story 15.2: Message Display Component
 * Story 15.5: AI Response Quality & Attribution
 *
 * Displays a single message (user or assistant) in the chat.
 *
 * Implements:
 * - AC-15.2.1: User messages right-aligned with blue avatar (user initials)
 * - AC-15.2.2: AI messages left-aligned with green avatar (AI icon)
 * - AC-15.2.5: Timestamps shown on hover (relative format)
 * - AC-15.2.6: Markdown rendering (via ReactMarkdown)
 * - AC7: Confidence badge displayed below each AI response
 * - AC1-AC4: Source citations with tooltips
 */

'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ConfidenceBadge } from './confidence-badge';
import { CitationList } from './source-citation';
import type { Message, Citation } from '@/types/ai-buddy';

export interface ChatMessageProps {
  /** The message to display */
  message: Message;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Callback when user clicks a citation */
  onCitationClick?: (citation: Citation) => void;
  /** Additional CSS classes */
  className?: string;
  /** User's display name for generating initials (for user messages) */
  userName?: string;
}

/**
 * Get user initials from a name string
 * Returns first letter of first name + first letter of last name (if available)
 * Defaults to "U" if no name provided
 */
function getUserInitials(name?: string): string {
  if (!name?.trim()) return 'U';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.charAt(0)?.toUpperCase() ?? 'U';
  }
  const first = parts[0]?.charAt(0)?.toUpperCase() ?? '';
  const last = parts[parts.length - 1]?.charAt(0)?.toUpperCase() ?? '';
  return first + last || 'U';
}

/**
 * Format timestamp for display
 * Returns relative time (e.g., "2 min ago", "1 hour ago")
 */
function formatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Chat Message Component
 *
 * Renders a single chat message with:
 * - Role-based styling (user vs assistant)
 * - Avatar (initials for user, icon for AI)
 * - Message bubble with proper alignment
 * - Hover-revealed timestamp
 * - Markdown content rendering
 * - Confidence badge for AI responses (AC7)
 * - Source citations (AC1-AC4)
 */
export function ChatMessage({
  message,
  isStreaming = false,
  onCitationClick,
  className,
  userName,
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const initials = getUserInitials(userName);
  const timestamp = formatTimestamp(message.createdAt);

  // Extract citations and confidence for AI messages
  const citations = message.sources ?? [];
  const confidence = message.confidence;

  return (
    <div
      className={cn(
        'flex gap-3 py-4 px-2 group',
        // AC-15.2.1: User messages right-aligned (flex-row-reverse)
        // AC-15.2.2: AI messages left-aligned (default)
        isUser ? 'flex-row-reverse' : '',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`chat-message-${message.role}`}
      data-message-id={message.id}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          // AC-15.2.1: Blue avatar for user
          // AC-15.2.2: Green avatar for AI
          isUser ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
        )}
        data-testid={`avatar-${message.role}`}
        aria-label={isUser ? 'User avatar' : 'AI avatar'}
      >
        {isUser ? (
          <span>{initials}</span>
        ) : (
          <Bot className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1',
          // Max width 80% for message bubbles
          'max-w-[80%]',
          // Alignment based on role
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            // Different styling for user vs assistant
            isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-slate-100 text-slate-800 rounded-bl-sm dark:bg-slate-800 dark:text-slate-100',
            // Subtle shadow
            'shadow-sm'
          )}
          data-testid="message-bubble"
        >
          {/* Markdown Content - AC-15.2.6 */}
          <div
            className={cn(
              'prose prose-sm max-w-none',
              // Adjust prose colors for user messages (white text)
              isUser && 'prose-invert',
              // Assistant message styling
              !isUser && 'prose-slate dark:prose-invert'
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom link handling - external links open in new tab
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'underline underline-offset-2',
                      isUser ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                    )}
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // Code blocks with dark theme styling
                code: ({ className: codeClassName, children, ...props }) => {
                  const isInline = !codeClassName;
                  return isInline ? (
                    <code
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-mono',
                        isUser ? 'bg-blue-400/30' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={cn(codeClassName, 'text-xs')}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Pre blocks for code with dark theme
                pre: ({ children, ...props }) => (
                  <pre
                    className={cn(
                      'rounded-lg p-3 overflow-x-auto text-xs my-2',
                      'bg-slate-800 text-slate-100'
                    )}
                    {...props}
                  >
                    {children}
                  </pre>
                ),
                // List styling
                ul: ({ children, ...props }) => (
                  <ul className="list-disc pl-4 my-1 space-y-0.5" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal pl-4 my-1 space-y-0.5" {...props}>
                    {children}
                  </ol>
                ),
                // Paragraph spacing
                p: ({ children, ...props }) => (
                  <p className="my-1 leading-relaxed" {...props}>
                    {children}
                  </p>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Source Citations - AC1-AC4 */}
          {isAssistant && citations.length > 0 && (
            <CitationList
              citations={citations}
              onCitationClick={onCitationClick}
              className="mt-2"
            />
          )}
        </div>

        {/* Footer: Timestamp and Confidence Badge */}
        <div
          className={cn(
            'flex items-center gap-3 mt-1',
            isUser ? 'flex-row-reverse' : ''
          )}
        >
          {/* AC7: Confidence badge displayed below each AI response */}
          {isAssistant && confidence && !isStreaming && (
            <ConfidenceBadge level={confidence} />
          )}

          {/* Timestamp - AC-15.2.5: Show on hover */}
          <div
            className={cn(
              'text-xs text-slate-400 transition-opacity duration-200',
              // Only visible on hover
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            data-testid="message-timestamp"
            aria-label={`Sent ${timestamp}`}
          >
            {timestamp}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
