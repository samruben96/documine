/**
 * AI Buddy Context Provider
 * Story 16.1: Project Creation & Sidebar (updated from 15.4)
 * Story 16.5: Conversation Search (FR4)
 * Story 17.5: ChatGPT-Style Project Navigation
 *
 * Provides shared state between AI Buddy layout (sidebar) and page (chat).
 * Manages project selection, conversation selection, search, and coordination.
 *
 * AC-16.1.4: Create project and select it as active
 * AC-16.1.11: Clicking a project switches to that project's context
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.8: Clicking conversation in sidebar loads that conversation's messages
 * AC-16.5.1: Cmd/Ctrl+K opens search dialog
 * AC-16.5.4: Clicking result opens that conversation
 * AC-17.5.1: New Chat defaults to standalone (no project)
 * AC-17.5.5: New chat within project context
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
import type { Conversation, Message, Project, CreateProjectRequest, Citation, ProjectDocument } from '@/types/ai-buddy';
import type { DocumentPreviewData } from '@/components/ai-buddy/documents/document-preview-modal';

interface AiBuddyContextValue extends UseConversationsReturn {
  // Conversation state
  /** Currently selected conversation ID (may differ from loaded conversation) */
  selectedConversationId: string | null;
  /** Select a conversation by ID */
  selectConversation: (id: string | null) => void;
  /** Start a new conversation (AC-17.5.1: standalone by default) */
  startNewConversation: () => void;
  /** Start a new conversation within a specific project (AC-17.5.5) */
  startNewConversationInProject: (projectId: string) => void;
  /** Pending project ID for new chat (set when creating chat in project) */
  pendingProjectId: string | null;
  /** Messages for the current conversation (from activeConversation) */
  currentMessages: Message[];
  /** Whether there are more conversations to load */
  hasMoreConversations: boolean;
  /** Load more conversations (pagination) */
  loadMoreConversations: () => Promise<void>;
  /** Whether loading more conversations */
  isLoadingMore: boolean;

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
  /** Update a project (Story 16.3) */
  updateProject: (projectId: string, input: { name?: string; description?: string }) => Promise<Project | null>;
  /** Restore a project (Story 16.3) */
  restoreProject: (projectId: string) => Promise<Project | null>;
  /** Archived projects (Story 16.3) */
  archivedProjects: Project[];
  /** Fetch archived projects (Story 16.3) */
  fetchArchivedProjects: () => Promise<void>;
  /** Whether project create dialog is open */
  isCreateProjectDialogOpen: boolean;
  /** Open create project dialog */
  openCreateProjectDialog: () => void;
  /** Close create project dialog */
  closeCreateProjectDialog: () => void;
  /** Whether archived projects sheet is open (Story 16.3) */
  isArchivedSheetOpen: boolean;
  /** Open archived projects sheet (Story 16.3) */
  openArchivedSheet: () => void;
  /** Close archived projects sheet (Story 16.3) */
  closeArchivedSheet: () => void;
  /** Project to archive (for confirmation dialog) (Story 16.3) */
  projectToArchive: Project | null;
  /** Show archive confirmation dialog (Story 16.3) */
  showArchiveConfirmation: (project: Project) => void;
  /** Close archive confirmation dialog (Story 16.3) */
  closeArchiveConfirmation: () => void;
  /** Confirm archive and perform operation (Story 16.3) */
  confirmArchive: () => Promise<void>;

  // Search state (Story 16.5)
  /** Whether search dialog is open */
  isSearchOpen: boolean;
  /** Open search dialog */
  openSearch: () => void;
  /** Close search dialog */
  closeSearch: () => void;
  /** Set search dialog open state */
  setSearchOpen: (open: boolean) => void;
  /** Set active conversation by ID (for search result selection) */
  setActiveConversation: (conversationId: string) => void;

  // Conversation management (Story 16.6)
  /** Move a conversation to a different project */
  moveConversation: (conversationId: string, projectId: string | null) => Promise<Conversation | null>;
  /** Whether a conversation is being moved */
  isMovingConversation: boolean;
  /** Conversation to delete (for confirmation dialog) */
  conversationToDelete: { id: string; title: string } | null;
  /** Show delete confirmation dialog */
  showDeleteConfirmation: (conversation: { id: string; title: string }) => void;
  /** Close delete confirmation dialog */
  closeDeleteConfirmation: () => void;
  /** Confirm delete and perform operation */
  confirmDelete: () => Promise<void>;

  // Document preview state (Story 17.3)
  /** Whether document preview modal is open */
  isDocumentPreviewOpen: boolean;
  /** Current document being previewed */
  previewDocument: DocumentPreviewData | null;
  /** Open preview for a project document (AC-17.3.1) */
  openDocumentPreview: (document: ProjectDocument) => void;
  /** Open preview from citation with page navigation (AC-17.3.2) */
  openCitationPreview: (citation: Citation) => void;
  /** Close document preview modal */
  closeDocumentPreview: () => void;
  /** Set document preview open state */
  setDocumentPreviewOpen: (open: boolean) => void;
}

const AiBuddyContext = createContext<AiBuddyContextValue | null>(null);

interface AiBuddyProviderProps {
  children: ReactNode;
}

export function AiBuddyProvider({ children }: AiBuddyProviderProps) {
  const projectsHook = useProjects({ autoFetch: true });
  const activeProjectHook = useActiveProject();

  // Story 17.5: Fetch ALL conversations (don't filter by projectId)
  // ChatGPT-style navigation requires all conversations to be available:
  // - Project conversations shown nested under their project folder
  // - Standalone conversations always visible in "Recent" section
  // Filtering is done in ProjectSidebar based on conversation.projectId
  const conversationsHook = useConversations({
    autoFetch: true,
    // Note: Removed projectId filter to support ChatGPT-style navigation (AC-17.5.9)
  });

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  // AC-17.5.5: Track pending project ID for new chats created within a project
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isArchivedSheetOpen, setIsArchivedSheetOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Story 16.6: Conversation management state
  const [isMovingConversation, setIsMovingConversation] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; title: string } | null>(null);
  // Story 17.3: Document preview state
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentPreviewData | null>(null);

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

  // AC-17.5.1: Start new standalone conversation (no project)
  const startNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    setPendingProjectId(null); // Clear any pending project
    activeProjectHook.clearActiveProject(); // Clear active project for standalone chat
    conversationsHook.clearActiveConversation();
  }, [conversationsHook, activeProjectHook]);

  // AC-17.5.5: Start new conversation within a specific project
  const startNewConversationInProject = useCallback(
    (projectId: string) => {
      setSelectedConversationId(null);
      setPendingProjectId(projectId); // Set pending project for new chat
      conversationsHook.clearActiveConversation();
      // Also set this as the active project for proper context
      const project = projectsHook.projects.find((p) => p.id === projectId);
      if (project) {
        activeProjectHook.setActiveProject(project);
      }
    },
    [conversationsHook, projectsHook.projects, activeProjectHook]
  );

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

  // Story 16.3: Archived sheet handlers
  const openArchivedSheet = useCallback(() => {
    projectsHook.fetchArchivedProjects();
    setIsArchivedSheetOpen(true);
  }, [projectsHook]);

  const closeArchivedSheet = useCallback(() => {
    setIsArchivedSheetOpen(false);
  }, []);

  // Story 16.3: Archive confirmation handlers
  const showArchiveConfirmation = useCallback((project: Project) => {
    setProjectToArchive(project);
  }, []);

  const closeArchiveConfirmation = useCallback(() => {
    setProjectToArchive(null);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (projectToArchive) {
      await archiveProject(projectToArchive.id);
      setProjectToArchive(null);
    }
  }, [archiveProject, projectToArchive]);

  // Story 16.5: Search handlers
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  // AC-16.5.4: Set active conversation (from search result)
  const setActiveConversation = useCallback(
    (conversationId: string) => {
      selectConversation(conversationId);
    },
    [selectConversation]
  );

  // Story 16.3: Restore project handler
  const restoreProject = useCallback(
    async (projectId: string) => {
      const result = await projectsHook.restoreProject(projectId);
      return result;
    },
    [projectsHook]
  );

  // Story 16.3: Update project handler
  const updateProject = useCallback(
    async (projectId: string, input: { name?: string; description?: string }) => {
      const result = await projectsHook.updateProject(projectId, input);
      return result;
    },
    [projectsHook]
  );

  // Story 16.6: Move conversation to project handler
  const moveConversation = useCallback(
    async (conversationId: string, targetProjectId: string | null): Promise<Conversation | null> => {
      setIsMovingConversation(true);
      try {
        return await conversationsHook.moveConversation(conversationId, targetProjectId);
      } finally {
        setIsMovingConversation(false);
      }
    },
    [conversationsHook]
  );

  // Story 16.6: Delete conversation confirmation handlers
  const showDeleteConfirmation = useCallback(
    (conversation: { id: string; title: string }) => {
      setConversationToDelete(conversation);
    },
    []
  );

  const closeDeleteConfirmation = useCallback(() => {
    setConversationToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (conversationToDelete) {
      await conversationsHook.deleteConversation(conversationToDelete.id);
      // AC-16.6.6: After delete, clear selection if it was the active conversation
      if (selectedConversationId === conversationToDelete.id) {
        setSelectedConversationId(null);
        conversationsHook.clearActiveConversation();
      }
      setConversationToDelete(null);
    }
  }, [conversationToDelete, conversationsHook, selectedConversationId]);

  // Story 16.4: Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (conversationsHook.nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await conversationsHook.fetchConversations({ cursor: conversationsHook.nextCursor });
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [conversationsHook, isLoadingMore]);

  // Story 17.3: Document preview handlers (AC-17.3.1, AC-17.3.2)
  const openDocumentPreview = useCallback((document: ProjectDocument) => {
    setPreviewDocument({
      documentId: document.document_id,
      documentName: document.document.name,
      initialPage: undefined,
    });
    setIsDocumentPreviewOpen(true);
  }, []);

  const openCitationPreview = useCallback((citation: Citation) => {
    setPreviewDocument({
      documentId: citation.documentId,
      documentName: citation.documentName,
      initialPage: citation.page,
    });
    setIsDocumentPreviewOpen(true);
  }, []);

  const closeDocumentPreview = useCallback(() => {
    setIsDocumentPreviewOpen(false);
    // Delay clearing to allow modal close animation
    setTimeout(() => {
      setPreviewDocument(null);
    }, 200);
  }, []);

  const handleSetDocumentPreviewOpen = useCallback((open: boolean) => {
    if (!open) {
      closeDocumentPreview();
    } else {
      setIsDocumentPreviewOpen(true);
    }
  }, [closeDocumentPreview]);

  // Get messages from active conversation
  const currentMessages = conversationsHook.activeConversation?.messages ?? [];

  const value: AiBuddyContextValue = {
    ...conversationsHook,
    selectedConversationId,
    selectConversation,
    startNewConversation,
    startNewConversationInProject,
    pendingProjectId,
    currentMessages,
    hasMoreConversations: !!conversationsHook.nextCursor,
    loadMoreConversations,
    isLoadingMore,
    // Project state
    projects: projectsHook.projects,
    isLoadingProjects: projectsHook.isLoading,
    activeProject: activeProjectHook.activeProject,
    activeProjectId: activeProjectHook.activeProjectId,
    selectProject,
    createProject,
    archiveProject,
    updateProject,
    restoreProject,
    archivedProjects: projectsHook.archivedProjects,
    fetchArchivedProjects: projectsHook.fetchArchivedProjects,
    isCreateProjectDialogOpen,
    openCreateProjectDialog,
    closeCreateProjectDialog,
    isArchivedSheetOpen,
    openArchivedSheet,
    closeArchivedSheet,
    projectToArchive,
    showArchiveConfirmation,
    closeArchiveConfirmation,
    confirmArchive,
    // Search state (Story 16.5)
    isSearchOpen,
    openSearch,
    closeSearch,
    setSearchOpen: setIsSearchOpen,
    setActiveConversation,
    // Conversation management (Story 16.6)
    moveConversation,
    isMovingConversation,
    conversationToDelete,
    showDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDelete,
    // Document preview state (Story 17.3)
    isDocumentPreviewOpen,
    previewDocument,
    openDocumentPreview,
    openCitationPreview,
    closeDocumentPreview,
    setDocumentPreviewOpen: handleSetDocumentPreviewOpen,
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
