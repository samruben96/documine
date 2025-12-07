/**
 * Chat Message Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a single message (user or assistant) in the chat.
 * Stub implementation - full functionality in Epic 15.
 */

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  className?: string;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  className,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex gap-3 py-4',
        role === 'user' ? 'flex-row-reverse' : '',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          role === 'assistant' ? 'bg-emerald-500' : 'bg-blue-500'
        )}
      >
        {role === 'assistant' ? (
          <Bot className="h-4 w-4 text-white" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm text-[var(--text-primary)]">{content}</p>
        {timestamp && (
          <p className="text-xs text-[var(--text-muted)]">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
