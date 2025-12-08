'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProjectSidebar } from '@/components/ai-buddy/project-sidebar';
import { ProjectCreateDialog } from '@/components/ai-buddy/project-create-dialog';
import { ProjectContextHeader } from '@/components/ai-buddy/project-context-header';
import { AiBuddyProvider, useAiBuddyContext } from '@/contexts/ai-buddy-context';

/**
 * AI Buddy Layout
 * Story 16.1: Project Creation & Sidebar (updated from 15.4)
 *
 * Light theme layout for AI Buddy feature with project and conversation sidebar.
 *
 * AC-16.1.1: New Project dialog opens
 * AC-16.1.8: Projects section in sidebar
 * AC-16.1.14: Mobile: Sidebar rendered in Sheet overlay
 * AC-15.4.4: Conversations listed in sidebar "Recent" section
 * AC-15.4.8: Clicking conversation loads that conversation's messages
 */

interface AiBuddyLayoutProps {
  children: React.ReactNode;
}

/**
 * Inner layout component that uses the context
 */
function AiBuddyLayoutInner({ children }: AiBuddyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    // Conversations
    conversations,
    isLoading: isLoadingConversations,
    selectedConversationId,
    selectConversation,
    deleteConversation,
    startNewConversation,
    // Projects
    projects,
    isLoadingProjects,
    activeProject,
    activeProjectId,
    selectProject,
    archiveProject,
    createProject,
    isCreateProjectDialogOpen,
    openCreateProjectDialog,
    closeCreateProjectDialog,
  } = useAiBuddyContext();

  const handleNewChat = () => {
    startNewConversation();
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

  // Sidebar content component - shared between desktop and mobile
  const sidebarContent = (
    <ProjectSidebar
      projects={projects}
      activeProjectId={activeProjectId}
      conversations={conversations}
      activeConversationId={selectedConversationId}
      isLoadingProjects={isLoadingProjects}
      isLoadingConversations={isLoadingConversations}
      onNewChat={handleNewChat}
      onNewProject={handleNewProject}
      onSelectProject={selectProject}
      onArchiveProject={archiveProject}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
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
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
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
      </main>

      {/* Project Create Dialog - AC-16.1.1 */}
      <ProjectCreateDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={closeCreateProjectDialog}
        onSubmit={createProject}
        onProjectCreated={handleProjectCreated}
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
