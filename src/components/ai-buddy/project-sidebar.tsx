/**
 * Project Sidebar Component
 * Story 16.1: Project Creation & Sidebar
 * Story 16.3: Project Management - Rename & Archive
 * Story 16.4: Conversation History & General Chat
 * Story 17.5: ChatGPT-Style Project Navigation
 *
 * Sidebar for navigating projects and conversations.
 * ChatGPT-style: projects as collapsible folders with nested conversations.
 *
 * AC-16.1.8: Sidebar shows "Projects" section with all active projects
 * AC-16.1.11: Clicking a project switches to that project's context
 * AC-16.1.13: Empty state when no projects exist
 * AC-16.1.14: Mobile renders in Sheet overlay
 * AC-16.3.7: "View Archived" link shows archived projects
 * AC-16.4.1: Conversations grouped by date
 * AC-16.4.6: "Load more" pagination
 * AC-17.5.1: New Chat defaults to standalone (no project)
 * AC-17.5.2: Projects display as collapsible folders
 * AC-17.5.3: Clicking folder icon expands project
 * AC-17.5.4: Nested chats show within project
 * AC-17.5.5: New chat within project context
 * AC-17.5.6: Hover states for navigation
 * AC-17.5.7: Active states for current selection
 * AC-17.5.8: Project click navigates to project view
 * AC-17.5.9: Standalone chats section
 * AC-17.5.10: Collapse persists during session
 */

'use client';

import { Plus, MessageSquare, Loader2, FolderPlus, Archive, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProjectFolder } from './project-folder';
import { ConversationGroup } from './conversation-group';
import { groupConversationsByDate, type ConversationGroup as ConversationGroupType } from '@/lib/ai-buddy/date-grouping';
import type { Conversation, Project } from '@/types/ai-buddy';
import { useMemo, useState, useCallback, useEffect } from 'react';

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
  /** Callback when "New Chat" is clicked (AC-17.5.1: standalone chat) */
  onNewChat?: () => void;
  /** Callback when "New Chat in Project" is clicked (AC-17.5.5) */
  onNewChatInProject?: (projectId: string) => void;
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
  onNewChatInProject,
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
  // AC-17.5.10: Store expanded project IDs for session persistence
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    () => {
      // Default: expand the active project if there is one
      if (activeProjectId) {
        return new Set([activeProjectId]);
      }
      return new Set();
    }
  );

  // Auto-collapse other projects when activeProjectId changes (accordion behavior)
  // This ensures only the active project is expanded, preventing the "empty" look
  useEffect(() => {
    if (activeProjectId) {
      // When a project becomes active, only expand that one (collapse others)
      setExpandedProjectIds(new Set([activeProjectId]));
    }
    // Don't collapse all when activeProjectId becomes null (user clicked New Chat)
    // Let the user manually manage collapsed state in that case
  }, [activeProjectId]);

  // Toggle expand/collapse for a project
  const toggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  // AC-17.5.4, AC-17.5.9: Group conversations by projectId
  // Conversations with projectId = null go to standalone "Recent" section
  const { conversationsByProject, standaloneConversations } = useMemo(() => {
    const byProject = new Map<string, Conversation[]>();
    const standalone: Conversation[] = [];

    for (const conv of conversations) {
      if (conv.projectId) {
        const existing = byProject.get(conv.projectId) || [];
        existing.push(conv);
        byProject.set(conv.projectId, existing);
      } else {
        standalone.push(conv);
      }
    }

    return {
      conversationsByProject: byProject,
      standaloneConversations: standalone,
    };
  }, [conversations]);

  // Story 16.4: Group standalone conversations by date
  const standaloneGroups = useMemo<ConversationGroupType[]>(() => {
    return groupConversationsByDate(standaloneConversations);
  }, [standaloneConversations]);

  // Create a map of project IDs to names for displaying badges (for standalone chats)
  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Handle new chat in project - if no handler provided, use regular onNewChat
  const handleNewChatInProject = useCallback(
    (projectId: string) => {
      if (onNewChatInProject) {
        onNewChatInProject(projectId);
      }
    },
    [onNewChatInProject]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* AC-17.5.1: New Chat Button - creates standalone chat */}
      <div className="p-4 border-b border-[var(--chat-border)]">
        <Button
          onClick={onNewChat}
          variant="default"
          className="w-full justify-start cursor-pointer"
          data-testid="new-chat-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Projects Section (AC-17.5.2: as collapsible folders) */}
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
              {/* AC-17.5.2, AC-17.5.3: Render projects as collapsible folders */}
              <div className="space-y-1">
                {projects.map((project) => (
                  <ProjectFolder
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjectIds.has(project.id)}
                    isActive={project.id === activeProjectId}
                    conversations={conversationsByProject.get(project.id) || []}
                    activeConversationId={activeConversationId ?? null}
                    onToggle={() => toggleProjectExpand(project.id)}
                    onSelectProject={() => onSelectProject?.(project)}
                    onSelectConversation={(id) => onSelectConversation?.(id)}
                    onNewChatInProject={() => handleNewChatInProject(project.id)}
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

        {/* AC-17.5.9: Recent/Standalone Conversations Section */}
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
          ) : standaloneConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                No standalone chats
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Start a new chat or create one in a project
              </p>
            </div>
          ) : (
            <>
              {/* AC-16.4.1: Date-grouped standalone conversations */}
              {standaloneGroups.map((group) => (
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
