/**
 * Chat Message List Component
 * Story 14.5: Component Scaffolding
 *
 * Renders a scrollable list of chat messages.
 * Stub implementation - full functionality in Epic 15.
 */

import { ChatMessage, type ChatMessageProps } from './chat-message';
import { cn } from '@/lib/utils';

export interface ChatMessageListProps {
  messages: ChatMessageProps[];
  className?: string;
}

export function ChatMessageList({ messages, className }: ChatMessageListProps) {
  return (
    <div className={cn('flex flex-col overflow-y-auto', className)}>
      {messages.map((message, index) => (
        <ChatMessage key={index} {...message} />
      ))}
    </div>
  );
}
