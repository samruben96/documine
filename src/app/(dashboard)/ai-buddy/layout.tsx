'use client';

import { useState } from 'react';
import { Menu, X, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * AI Buddy Layout
 * Story 14.4: Page Layout Shell
 *
 * Light theme layout for AI Buddy feature.
 * Consistent with rest of docuMINE app styling.
 *
 * AC 14.4.1: Layout shell with sidebar
 * AC 14.4.2: Sidebar 260px
 * AC 14.4.3: Main chat area
 * AC 14.4.4: Responsive breakpoints
 */

interface AiBuddyLayoutProps {
  children: React.ReactNode;
}

export default function AiBuddyLayout({ children }: AiBuddyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-700 hover:bg-slate-100 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Projects section placeholder */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Projects
            </h3>
            <p className="text-sm text-slate-500">
              No projects yet
            </p>
          </div>

          {/* Recent chats placeholder */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recent Chats
            </h3>
            <p className="text-sm text-slate-500">
              Start a conversation
            </p>
          </div>
        </div>
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
