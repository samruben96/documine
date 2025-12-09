/**
 * Project Sidebar Component
 * Story 16.1: Project Creation & Sidebar
 * Story 16.3: Project Management - Rename & Archive
 * Story 16.4: Conversation History & General Chat
 *
 * Sidebar for navigating projects and conversations.
 *
 * AC-16.1.8: Sidebar shows "Projects" section with all active projects
 * AC-16.1.11: Clicking a project switches to that project's context
 * AC-16.1.13: Empty state when no projects exist
 * AC-16.1.14: Mobile renders in Sheet overlay
 * AC-16.3.7: "View Archived" link shows archived projects
 * AC-16.4.1: Conversations grouped by date
 * AC-16.4.6: "Load more" pagination
 */

'use client';

import { Plus, MessageSquare, Loader2, FolderPlus, Archive, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProjectCard } from './project-card';
import { ConversationGroup } from './conversation-group';
import { groupConversationsByDate, type ConversationGroup as ConversationGroupType } from '@/lib/ai-buddy/date-grouping';
import type { Conversation, Project } from '@/types/ai-buddy';
import { useMemo } from 'react';

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
  /** Callback when a project is archived (Story 16.3) */
  onArchiveProject?: (projectId: string) => void;
  /** Callback when a project is renamed (Story 16.3) */
  onRenameProject?: (projectId: string, newName: string) => void;
  /** Callback when "View Archived" is clicked (Story 16.3) */
  onViewArchived?: () => void;
  /** Callback when a conversation is selected */
  onSelectConversation?: (id: string) => void;
  /** Callback when a conversation is deleted */
  onDeleteConversation?: (id: string) => void;
  /** Whether there are more conversations to load (Story 16.4) */
  hasMoreConversations?: boolean;
  /** Callback when "Load more" is clicked (Story 16.4) */
  onLoadMoreConversations?: () => void;
  /** Whether "Load more" is loading */
  isLoadingMore?: boolean;
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
  onRenameProject,
  onViewArchived,
  onSelectConversation,
  onDeleteConversation,
  hasMoreConversations = false,
  onLoadMoreConversations,
  isLoadingMore = false,
  className,
}: ProjectSidebarProps) {
  // Story 16.4: Group conversations by date
  const conversationGroups = useMemo<ConversationGroupType[]>(() => {
    return groupConversationsByDate(conversations);
  }, [conversations]);

  // Create a map of project IDs to names for displaying badges
  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

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
            <>
              <div className="space-y-1">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
                    onClick={() => onSelectProject?.(project)}
                    onArchive={onArchiveProject}
                    onRename={onRenameProject}
                  />
                ))}
              </div>
              {/* AC-16.3.7: View Archived link */}
              {onViewArchived && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewArchived}
                  className="w-full justify-start text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-2"
                  data-testid="view-archived-button"
                >
                  <Archive className="h-3 w-3 mr-2" />
                  View Archived
                </Button>
              )}
            </>
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
            <>
              {/* AC-16.4.1: Date-grouped conversations */}
              {conversationGroups.map((group) => (
                <ConversationGroup
                  key={group.label}
                  label={group.label}
                  conversations={group.conversations}
                  activeConversationId={activeConversationId ?? null}
                  onSelectConversation={(id) => onSelectConversation?.(id)}
                  onDeleteConversation={(id) => onDeleteConversation?.(id)}
                  projectNames={projectNames}
                />
              ))}
              {/* AC-16.4.6: Load more pagination */}
              {hasMoreConversations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadMoreConversations}
                  disabled={isLoadingMore}
                  className="w-full justify-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-2"
                  data-testid="load-more-conversations"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  Load more
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
