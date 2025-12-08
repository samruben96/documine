/**
 * Streaming Indicator Component
 * Story 15.2: Message Display Component
 *
 * Shows animated indicator while AI is generating a response.
 *
 * Implements:
 * - AC-15.2.7: Typing indicator (animated dots) shown during AI response streaming
 */

'use client';

import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export interface StreamingIndicatorProps {
  /** Control visibility of the indicator */
  isVisible: boolean;
  /** Partial content being streamed (optional) */
  streamingContent?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated Dots Component
 * Three bouncing dots to indicate typing/processing
 */
function AnimatedDots() {
  return (
    <div
      className="flex items-center gap-1"
      data-testid="animated-dots"
      aria-label="AI is typing"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
    </div>
  );
}

/**
 * Streaming Indicator Component
 *
 * Shows a typing indicator with:
 * - Green AI avatar matching AI message style
 * - Animated three-dot loading indicator
 * - Optional streaming content preview
 * - Conditional rendering based on isVisible prop
 */
export function StreamingIndicator({
  isVisible,
  streamingContent,
  className,
}: StreamingIndicatorProps) {
  // AC-15.2.7: Conditional rendering based on isLoading prop
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex gap-3 py-4 px-2',
        // Match AI message alignment (left-aligned)
        className
      )}
      data-testid="streaming-indicator"
      role="status"
      aria-label="AI is generating a response"
    >
      {/* AI Avatar - matches ChatMessage AI avatar style */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500"
        data-testid="streaming-avatar"
        aria-hidden="true"
      >
        <Bot className="h-4 w-4 text-white" />
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* Message Bubble - matches AI message styling */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            'bg-slate-100 text-slate-800 rounded-bl-sm',
            'shadow-sm',
            'min-h-[40px]'
          )}
          data-testid="streaming-bubble"
        >
          {/* Show streaming content if available, otherwise show dots */}
          {streamingContent ? (
            <div className="prose prose-sm max-w-none prose-slate">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {streamingContent}
              </ReactMarkdown>
              {/* Cursor indicator while streaming */}
              <span
                className="inline-block w-2 h-4 bg-emerald-500 ml-0.5 animate-pulse"
                aria-hidden="true"
              />
            </div>
          ) : (
            <AnimatedDots />
          )}
        </div>
      </div>
    </div>
  );
}
