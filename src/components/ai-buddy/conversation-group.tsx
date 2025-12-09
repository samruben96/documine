/**
 * Conversation Group Component
 * Story 16.4: Conversation History & General Chat
 *
 * Displays a date group header with its list of conversations.
 *
 * AC-16.4.1: Sidebar "Recent" section shows conversations grouped by date
 * AC-16.4.2: Date groups: Today, Yesterday, Previous 7 days, Older
 */

'use client';

import { ChatHistoryItem } from './chat-history-item';
import type { Conversation } from '@/types/ai-buddy';

export interface ConversationGroupProps {
  /** Group label (Today, Yesterday, etc.) */
  label: string;
  /** Conversations in this group */
  conversations: Conversation[];
  /** Currently active conversation ID */
  activeConversationId: string | null;
  /** Callback when a conversation is selected */
  onSelectConversation: (id: string) => void;
  /** Callback when a conversation is deleted */
  onDeleteConversation: (id: string) => void;
  /** Map of project IDs to project names for displaying badges */
  projectNames?: Map<string, string>;
}

export function ConversationGroup({
  label,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  projectNames,
}: ConversationGroupProps) {
  return (
    <div className="mb-4" data-testid={`conversation-group-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] px-3 py-2 uppercase tracking-wider">
        {label}
      </h3>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <ChatHistoryItem
            key={conv.id}
            id={conv.id}
            title={conv.title || 'New conversation'}
            updatedAt={conv.updatedAt}
            isActive={conv.id === activeConversationId}
            onClick={() => onSelectConversation(conv.id)}
            projectId={conv.projectId}
            projectName={conv.projectId ? projectNames?.get(conv.projectId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
