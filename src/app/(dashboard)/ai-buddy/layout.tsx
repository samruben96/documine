'use client';

import { useState } from 'react';
import { Menu, X, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * AI Buddy Layout
 * Story 14.4: Page Layout Shell
 *
 * ChatGPT-style dark theme layout for AI Buddy feature.
 * Scoped to /ai-buddy routes only - doesn't affect rest of app.
 *
 * AC 14.4.1: Dark theme layout
 * AC 14.4.2: Sidebar 260px with dark bg
 * AC 14.4.3: Main chat area with #212121 bg
 * AC 14.4.4: Responsive breakpoints
 */

interface AiBuddyLayoutProps {
  children: React.ReactNode;
}

export default function AiBuddyLayout({ children }: AiBuddyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-[calc(100vh-3.5rem)] overflow-hidden"
      style={
        {
          '--sidebar-bg': '#171717',
          '--sidebar-hover': '#212121',
          '--sidebar-active': '#2d2d2d',
          '--chat-bg': '#212121',
          '--chat-surface': '#2d2d2d',
          '--chat-border': '#3d3d3d',
          '--text-primary': '#ececec',
          '--text-muted': '#8e8e8e',
        } as React.CSSProperties
      }
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - AC 14.4.2: 260px with dark bg */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--chat-border)]">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Projects section placeholder */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Projects
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              No projects yet
            </p>
          </div>

          {/* Recent chats placeholder */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Recent Chats
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Start a conversation
            </p>
          </div>
        </div>
      </aside>

      {/* Main content area - AC 14.4.3: #212121 bg */}
      <main
        className="flex-1 flex flex-col min-w-0"
        style={{ backgroundColor: 'var(--chat-bg)' }}
      >
        {/* Mobile header with menu toggle */}
        <div className="flex h-14 items-center px-4 border-b border-[var(--chat-border)] lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 text-[var(--text-primary)] font-medium flex items-center gap-2">
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
