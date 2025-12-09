'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ProjectSidebar } from '@/components/ai-buddy/project-sidebar';
import { ProjectCreateDialog } from '@/components/ai-buddy/project-create-dialog';
import { ProjectContextHeader } from '@/components/ai-buddy/project-context-header';
import { ArchiveConfirmationDialog } from '@/components/ai-buddy/archive-confirmation-dialog';
import { ArchivedProjectsSheet } from '@/components/ai-buddy/archived-projects-sheet';
import { ConversationSearch } from '@/components/ai-buddy/conversation-search';
import { DocumentPanel } from '@/components/ai-buddy/documents/document-panel';
import { AiBuddyProvider, useAiBuddyContext } from '@/contexts/ai-buddy-context';
import { OnboardingFlow } from '@/components/ai-buddy/onboarding';
import { useOnboarding } from '@/hooks/ai-buddy';

// Dynamic import for DocumentPreviewModal to avoid SSR issues with react-pdf
const DocumentPreviewModal = dynamic(
  () => import('@/components/ai-buddy/documents/document-preview-modal').then(mod => mod.DocumentPreviewModal),
  { ssr: false }
);

/**
 * AI Buddy Layout
 * Story 16.1: Project Creation & Sidebar (updated from 15.4)
 * Story 16.3: Project Management - Rename & Archive
 * Story 16.4: Conversation History & General Chat
 * Story 16.5: Conversation Search (FR4)
 * Story 17.2: Project Document Management
 * Story 17.3: Document Preview & Multi-Document Context
 * Story 17.5: ChatGPT-Style Project Navigation
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Light theme layout for AI Buddy feature with project and conversation sidebar.
 *
 * AC-18.1.1: Show onboarding modal for new users on first AI Buddy visit
 *
 * AC-16.1.1: New Project dialog opens
 * AC-16.1.8: Projects section in sidebar
 * AC-16.1.14: Mobile: Sidebar rendered in Sheet overlay
 * AC-15.4.4: Conversations listed in sidebar "Recent" section
 * AC-15.4.8: Clicking conversation loads that conversation's messages
 * AC-16.3.5: Archive confirmation dialog
 * AC-16.3.7: View Archived sheet
 * AC-16.4.1: Date-grouped conversations
 * AC-16.4.6: Load more pagination
 * AC-16.5.1: Cmd/Ctrl+K opens search dialog
 * AC-17.2.1: Document panel with Add Document menu (Upload/Library options)
 * AC-17.3.1: Click on document opens preview in modal with page navigation
 * AC-17.5.1: New Chat defaults to standalone (no project)
 * AC-17.5.5: New chat within project context
 */

interface AiBuddyLayoutProps {
  children: React.ReactNode;
}

/**
 * Inner layout component that uses the context
 */
function AiBuddyLayoutInner({ children }: AiBuddyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Story 18.1: Onboarding flow (AC-18.1.1)
  const {
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Show onboarding when shouldShowOnboarding becomes true
  useEffect(() => {
    if (shouldShowOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [shouldShowOnboarding]);

  const {
    // Conversations
    conversations,
    isLoading: isLoadingConversations,
    selectedConversationId,
    selectConversation,
    deleteConversation,
    startNewConversation,
    startNewConversationInProject,
    hasMoreConversations,
    loadMoreConversations,
    isLoadingMore,
    // Projects
    projects,
    isLoadingProjects,
    activeProject,
    activeProjectId,
    selectProject,
    updateProject,
    createProject,
    isCreateProjectDialogOpen,
    openCreateProjectDialog,
    closeCreateProjectDialog,
    // Story 16.3: Archive functionality
    projectToArchive,
    showArchiveConfirmation,
    closeArchiveConfirmation,
    confirmArchive,
    archivedProjects,
    restoreProject,
    isArchivedSheetOpen,
    openArchivedSheet,
    closeArchivedSheet,
    // Story 16.5: Search functionality
    isSearchOpen,
    setSearchOpen,
    // Story 17.3: Document preview functionality (AC-17.3.1)
    isDocumentPreviewOpen,
    previewDocument,
    openDocumentPreview,
    setDocumentPreviewOpen,
  } = useAiBuddyContext();

  // Story 16.5: Cmd/Ctrl+K keyboard shortcut (AC-16.5.1)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const [restoringProjectId, setRestoringProjectId] = useState<string | null>(null);

  // AC-17.5.1: New Chat creates standalone conversation
  const handleNewChat = () => {
    startNewConversation();
    setSidebarOpen(false);
  };

  // AC-17.5.5: New Chat in Project creates conversation with projectId
  const handleNewChatInProject = (projectId: string) => {
    startNewConversationInProject(projectId);
    setSidebarOpen(false);
  };

  const handleNewProject = () => {
    openCreateProjectDialog();
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
  };

  const handleProjectCreated = () => {
    closeCreateProjectDialog();
    setSidebarOpen(false);
  };

  // Story 16.3: Archive handlers
  const handleArchiveProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      showArchiveConfirmation(project);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await updateProject(projectId, { name: newName });
  };

  const handleRestoreProject = async (projectId: string) => {
    setRestoringProjectId(projectId);
    try {
      await restoreProject(projectId);
    } finally {
      setRestoringProjectId(null);
    }
  };

  // Story 16.4: Load more handler
  const handleLoadMoreConversations = async () => {
    await loadMoreConversations();
  };

  // Sidebar content component - shared between desktop and mobile
  // Story 17.5: Now supports ChatGPT-style project folders with nested conversations
  const sidebarContent = (
    <ProjectSidebar
      projects={projects}
      activeProjectId={activeProjectId}
      conversations={conversations}
      activeConversationId={selectedConversationId}
      isLoadingProjects={isLoadingProjects}
      isLoadingConversations={isLoadingConversations}
      onNewChat={handleNewChat}
      onNewChatInProject={handleNewChatInProject}
      onNewProject={handleNewProject}
      onSelectProject={selectProject}
      onArchiveProject={handleArchiveProject}
      onRenameProject={handleRenameProject}
      onViewArchived={openArchivedSheet}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
      hasMoreConversations={hasMoreConversations}
      onLoadMoreConversations={handleLoadMoreConversations}
      isLoadingMore={isLoadingMore}
      className="flex-1"
    />
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Desktop Sidebar - AC 14.4.2: 260px */}
      <aside className="hidden lg:flex w-[260px] flex-col bg-white border-r border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar using Sheet - AC-16.1.14 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content area - AC 14.4.3 */}
      <main className="flex-1 flex min-w-0 bg-slate-50">
        {/* Chat area container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header with menu toggle - Story 16.2: AC-16.2.1, AC-16.2.2 */}
          <div className="flex h-14 items-center px-4 border-b border-slate-200 bg-white lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-700 hover:bg-slate-100"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-3">
              <ProjectContextHeader
                projectName={activeProject?.name}
                isLoading={isLoadingProjects && !activeProject}
              />
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>

        {/* Story 17.2: Document Panel - Right side panel for project documents */}
        {/* AC-17.2.1: Shows Add Document with Upload/Library options */}
        {/* AC-17.3.1: Click on document opens preview modal */}
        {/* Only visible on desktop (lg+) when a project is selected */}
        {activeProjectId && (
          <DocumentPanel
            projectId={activeProjectId}
            onDocumentClick={openDocumentPreview}
            className="hidden lg:flex"
          />
        )}
      </main>

      {/* Project Create Dialog - AC-16.1.1 */}
      <ProjectCreateDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={closeCreateProjectDialog}
        onSubmit={createProject}
        onProjectCreated={handleProjectCreated}
      />

      {/* Archive Confirmation Dialog - AC-16.3.5 */}
      <ArchiveConfirmationDialog
        project={projectToArchive}
        open={!!projectToArchive}
        onOpenChange={(open) => !open && closeArchiveConfirmation()}
        onConfirm={confirmArchive}
      />

      {/* Archived Projects Sheet - AC-16.3.7 */}
      <ArchivedProjectsSheet
        open={isArchivedSheetOpen}
        onOpenChange={closeArchivedSheet}
        archivedProjects={archivedProjects}
        onRestore={handleRestoreProject}
        restoringProjectId={restoringProjectId}
      />

      {/* Conversation Search Dialog - AC-16.5.1 */}
      <ConversationSearch open={isSearchOpen} onOpenChange={setSearchOpen} />

      {/* Document Preview Modal - AC-17.3.1, AC-17.3.2 */}
      <DocumentPreviewModal
        open={isDocumentPreviewOpen}
        onOpenChange={setDocumentPreviewOpen}
        document={previewDocument}
      />

      {/* Onboarding Flow Modal - AC-18.1.1 */}
      <OnboardingFlow
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    </div>
  );
}

/**
 * Outer layout that provides the context
 */
export default function AiBuddyLayout({ children }: AiBuddyLayoutProps) {
  return (
    <AiBuddyProvider>
      <AiBuddyLayoutInner>{children}</AiBuddyLayoutInner>
    </AiBuddyProvider>
  );
}
