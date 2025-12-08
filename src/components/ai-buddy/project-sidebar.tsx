/**
 * Project Sidebar Component
 * Story 16.1: Project Creation & Sidebar
 *
 * Sidebar for navigating projects and conversations.
 *
 * AC-16.1.8: Sidebar shows "Projects" section with all active projects
 * AC-16.1.11: Clicking a project switches to that project's context
 * AC-16.1.13: Empty state when no projects exist
 * AC-16.1.14: Mobile renders in Sheet overlay
 */

'use client';

import { Plus, MessageSquare, Loader2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatHistoryItem } from './chat-history-item';
import { ProjectCard } from './project-card';
import type { Conversation, Project } from '@/types/ai-buddy';

export interface ProjectSidebarProps {
  /** List of projects to display */
  projects?: Project[];
  /** Currently active project ID */
  activeProjectId?: string | null;
  /** List of conversations to display */
  conversations?: Conversation[];
  /** Currently active conversation ID */
  activeConversationId?: string | null;
  /** Loading state for projects */
  isLoadingProjects?: boolean;
  /** Loading state for conversations */
  isLoadingConversations?: boolean;
  /** Callback when "New Chat" is clicked */
  onNewChat?: () => void;
  /** Callback when "New Project" is clicked */
  onNewProject?: () => void;
  /** Callback when a project is selected */
  onSelectProject?: (project: Project) => void;
  /** Callback when a project is archived */
  onArchiveProject?: (projectId: string) => void;
  /** Callback when a conversation is selected */
  onSelectConversation?: (id: string) => void;
  /** Callback when a conversation is deleted */
  onDeleteConversation?: (id: string) => void;
  className?: string;
}

export function ProjectSidebar({
  projects = [],
  activeProjectId,
  conversations = [],
  activeConversationId,
  isLoadingProjects = false,
  isLoadingConversations = false,
  onNewChat,
  onNewProject,
  onSelectProject,
  onArchiveProject,
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
          data-testid="new-chat-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="p-4 border-b border-[var(--chat-border)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Projects
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewProject}
              className="h-6 w-6 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              data-testid="new-project-button"
              title="New Project"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          {isLoadingProjects ? (
            <div
              className="flex items-center justify-center py-4"
              data-testid="projects-loading"
            >
              <Loader2 className="h-5 w-5 text-[var(--text-muted)] animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            // AC-16.1.13: Empty state
            <div
              className="flex flex-col items-center justify-center py-4 text-center"
              data-testid="projects-empty-state"
            >
              <FolderPlus className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                No projects yet
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={onNewProject}
                className="text-xs mt-1"
              >
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  onClick={() => onSelectProject?.(project)}
                  onArchive={onArchiveProject}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations Section */}
        <div className="p-4">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Recent
          </p>

          {isLoadingConversations ? (
            <div
              className="flex items-center justify-center py-8"
              data-testid="conversations-loading"
            >
              <Loader2 className="h-5 w-5 text-[var(--text-muted)] animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                No conversations yet
              </p>
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
      </div>
    </div>
  );
}
