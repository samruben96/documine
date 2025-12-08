'use client';

import { useState } from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectSidebar } from '@/components/ai-buddy/project-sidebar';
import { AiBuddyProvider, useAiBuddyContext } from '@/contexts/ai-buddy-context';

/**
 * AI Buddy Layout
 * Story 15.4: Conversation Persistence (updated from Story 14.4)
 *
 * Light theme layout for AI Buddy feature with conversation sidebar.
 *
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
    conversations,
    isLoading,
    selectedConversationId,
    selectConversation,
    deleteConversation,
    startNewConversation,
  } = useAiBuddyContext();

  const handleNewChat = () => {
    startNewConversation();
    // Close mobile sidebar after action
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    // Close mobile sidebar after selection
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - AC 14.4.2: 260px */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 bg-white border-r border-slate-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-14 items-center justify-end px-4 border-b border-slate-200 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Project Sidebar Component */}
        <ProjectSidebar
          conversations={conversations}
          activeConversationId={selectedConversationId}
          isLoading={isLoading}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          className="flex-1"
        />
      </aside>

      {/* Main content area - AC 14.4.3 */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Mobile header with menu toggle */}
        <div className="flex h-14 items-center px-4 border-b border-slate-200 bg-white lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-700 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 text-slate-900 font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Buddy
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
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
