/**
 * Project Sidebar Component
 * Story 15.4: Conversation Persistence
 *
 * Sidebar for navigating projects and conversations.
 *
 * AC-15.4.4: Conversations listed in sidebar "Recent" section
 * AC-15.4.8: Clicking conversation loads that conversation's messages
 */

'use client';

import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatHistoryItem } from './chat-history-item';
import type { Conversation } from '@/types/ai-buddy';

export interface ProjectSidebarProps {
  /** List of conversations to display */
  conversations?: Conversation[];
  /** Currently active conversation ID */
  activeConversationId?: string | null;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when "New Chat" is clicked */
  onNewChat?: () => void;
  /** Callback when "New Project" is clicked (future) */
  onNewProject?: () => void;
  /** Callback when a conversation is selected */
  onSelectConversation?: (id: string) => void;
  /** Callback when a conversation is deleted */
  onDeleteConversation?: (id: string) => void;
  className?: string;
}

export function ProjectSidebar({
  conversations = [],
  activeConversationId,
  isLoading = false,
  onNewChat,
  onNewProject,
  onSelectConversation,
  onDeleteConversation,
  className,
}: ProjectSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* New Chat Button */}
      <div className="p-4 border-b border-[var(--chat-border)]">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Section */}
        <div className="p-4">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Recent
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-[var(--text-muted)] animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">No conversations yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <ChatHistoryItem
                  key={conversation.id}
                  id={conversation.id}
                  title={conversation.title || 'New conversation'}
                  updatedAt={conversation.updatedAt}
                  isActive={conversation.id === activeConversationId}
                  onClick={() => onSelectConversation?.(conversation.id)}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Projects Section (Future - Epic 16) */}
        <div className="p-4 border-t border-[var(--chat-border)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Projects
          </p>
          <p className="text-sm text-[var(--text-muted)]">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
