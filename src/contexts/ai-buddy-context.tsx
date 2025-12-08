/**
 * AI Buddy Context Provider
 * Story 16.1: Project Creation & Sidebar (updated from 15.4)
 *
 * Provides shared state between AI Buddy layout (sidebar) and page (chat).
 * Manages project selection, conversation selection, and coordination.
 *
 * AC-16.1.4: Create project and select it as active
 * AC-16.1.11: Clicking a project switches to that project's context
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.8: Clicking conversation in sidebar loads that conversation's messages
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useConversations, type UseConversationsReturn } from '@/hooks/ai-buddy/use-conversations';
import { useProjects, type UseProjectsReturn } from '@/hooks/ai-buddy/use-projects';
import { useActiveProject, type UseActiveProjectReturn } from '@/hooks/ai-buddy/use-active-project';
import type { Conversation, Message, Project, CreateProjectRequest } from '@/types/ai-buddy';

interface AiBuddyContextValue extends UseConversationsReturn {
  // Conversation state
  /** Currently selected conversation ID (may differ from loaded conversation) */
  selectedConversationId: string | null;
  /** Select a conversation by ID */
  selectConversation: (id: string | null) => void;
  /** Start a new conversation */
  startNewConversation: () => void;
  /** Messages for the current conversation (from activeConversation) */
  currentMessages: Message[];

  // Project state (Story 16.1)
  /** List of projects */
  projects: Project[];
  /** Loading state for projects */
  isLoadingProjects: boolean;
  /** Currently active project */
  activeProject: Project | null;
  /** Currently active project ID */
  activeProjectId: string | null;
  /** Select a project */
  selectProject: (project: Project | null) => void;
  /** Create a new project */
  createProject: (input: CreateProjectRequest) => Promise<Project | null>;
  /** Archive a project */
  archiveProject: (projectId: string) => Promise<void>;
  /** Whether project create dialog is open */
  isCreateProjectDialogOpen: boolean;
  /** Open create project dialog */
  openCreateProjectDialog: () => void;
  /** Close create project dialog */
  closeCreateProjectDialog: () => void;
}

const AiBuddyContext = createContext<AiBuddyContextValue | null>(null);

interface AiBuddyProviderProps {
  children: ReactNode;
}

export function AiBuddyProvider({ children }: AiBuddyProviderProps) {
  const projectsHook = useProjects({ autoFetch: true });
  const activeProjectHook = useActiveProject();

  // Story 16.2: Pass activeProjectId to useConversations (AC-16.2.6)
  // This enables project-scoped conversation filtering and automatic refresh on project switch
  const conversationsHook = useConversations({
    autoFetch: true,
    projectId: activeProjectHook.activeProjectId ?? undefined,
  });

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);

  // Sync active project with projects list when projects load
  useEffect(() => {
    if (activeProjectHook.activeProjectId && projectsHook.projects.length > 0) {
      const project = projectsHook.projects.find(
        (p) => p.id === activeProjectHook.activeProjectId
      );
      if (project) {
        activeProjectHook.setActiveProject(project);
      } else {
        // Project not found (maybe archived), clear selection
        activeProjectHook.clearActiveProject();
      }
    }
  }, [activeProjectHook.activeProjectId, projectsHook.projects, activeProjectHook]);

  const selectConversation = useCallback(
    async (id: string | null) => {
      setSelectedConversationId(id);
      if (id) {
        await conversationsHook.loadConversation(id);
      } else {
        conversationsHook.clearActiveConversation();
      }
    },
    [conversationsHook]
  );

  const startNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    conversationsHook.clearActiveConversation();
  }, [conversationsHook]);

  // AC-16.1.11: Clicking project switches context
  // Story 16.2: Clear conversation selection when switching projects (AC-16.2.6)
  const selectProject = useCallback(
    (project: Project | null) => {
      activeProjectHook.setActiveProject(project);
      // Clear conversation selection when switching projects
      // useConversations will automatically re-fetch with new projectId
      setSelectedConversationId(null);
      conversationsHook.clearActiveConversation();
    },
    [activeProjectHook, conversationsHook]
  );

  // AC-16.1.4: Create project and select as active
  const createProject = useCallback(
    async (input: CreateProjectRequest): Promise<Project | null> => {
      const project = await projectsHook.createProject(input);
      if (project) {
        activeProjectHook.setActiveProject(project);
      }
      return project;
    },
    [projectsHook, activeProjectHook]
  );

  const archiveProject = useCallback(
    async (projectId: string) => {
      await projectsHook.archiveProject(projectId);
      // If archived project was active, clear selection
      if (activeProjectHook.activeProjectId === projectId) {
        activeProjectHook.clearActiveProject();
      }
    },
    [projectsHook, activeProjectHook]
  );

  const openCreateProjectDialog = useCallback(() => {
    setIsCreateProjectDialogOpen(true);
  }, []);

  const closeCreateProjectDialog = useCallback(() => {
    setIsCreateProjectDialogOpen(false);
  }, []);

  // Get messages from active conversation
  const currentMessages = conversationsHook.activeConversation?.messages ?? [];

  const value: AiBuddyContextValue = {
    ...conversationsHook,
    selectedConversationId,
    selectConversation,
    startNewConversation,
    currentMessages,
    // Project state
    projects: projectsHook.projects,
    isLoadingProjects: projectsHook.isLoading,
    activeProject: activeProjectHook.activeProject,
    activeProjectId: activeProjectHook.activeProjectId,
    selectProject,
    createProject,
    archiveProject,
    isCreateProjectDialogOpen,
    openCreateProjectDialog,
    closeCreateProjectDialog,
  };

  return (
    <AiBuddyContext.Provider value={value}>
      {children}
    </AiBuddyContext.Provider>
  );
}

export function useAiBuddyContext(): AiBuddyContextValue {
  const context = useContext(AiBuddyContext);
  if (!context) {
    throw new Error('useAiBuddyContext must be used within an AiBuddyProvider');
  }
  return context;
}
