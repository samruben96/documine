'use client';

import { cn } from '@/lib/utils';

interface SplitViewProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}

/**
 * Split View Layout Component
 *
 * Creates a two-panel layout with sidebar and main content.
 * Implements AC-4.3.7: Split view for document viewer + chat panel.
 *
 * Layout structure:
 * - Sidebar (240px on desktop) - Document list
 * - Main content - Document viewer (future: + chat panel)
 */
export function SplitView({ sidebar, main, className }: SplitViewProps) {
  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar area - handled by Sidebar component */}
      {sidebar}

      {/* Main content area */}
      <main className="flex-1 overflow-hidden lg:ml-0">
        {main}
      </main>
    </div>
  );
}

export interface DocumentChatSplitViewProps {
  documentViewer: React.ReactNode;
  chatPanel: React.ReactNode;
  className?: string;
}

/**
 * Document Chat Split View Component
 *
 * Creates a two-panel layout for document viewer + chat panel.
 * Implements AC-5.1.1: Split-view layout with document and chat side-by-side.
 *
 * Layout structure:
 * - Document Viewer (min 40% width, flexible)
 * - Chat Panel (360px fixed width on desktop)
 *
 * Responsive behavior:
 * - Desktop (>1024px): Document (flex) + Chat (360px fixed)
 * - Tablet (640-1024px): Document (60%) + Chat (40%)
 * - Mobile (<640px): Handled by parent with tabbed interface
 */
export function DocumentChatSplitView({
  documentViewer,
  chatPanel,
  className,
}: DocumentChatSplitViewProps) {
  return (
    <div
      className={cn(
        'h-full grid',
        // Desktop: Document viewer flexible, Chat panel 360px fixed
        'lg:grid-cols-[minmax(40%,1fr)_360px]',
        // Tablet: Document 60%, Chat 40%
        'md:grid-cols-[60%_40%]',
        // Mobile: Single column (tabbed interface handled by parent)
        'grid-cols-1',
        className
      )}
    >
      {/* Document Viewer Panel - min 40% width, flex-grow */}
      <div className="min-w-0 overflow-hidden">{documentViewer}</div>

      {/* Chat Panel - 360px fixed on desktop, 40% on tablet, hidden on mobile */}
      <div className="hidden md:block min-w-0 overflow-hidden border-l border-slate-200">
        {chatPanel}
      </div>
    </div>
  );
}

/**
 * Document View Placeholder Component
 *
 * Placeholder for the document viewer panel.
 * Will be replaced with actual viewer in Epic 5.
 */
export function DocumentViewPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 text-slate-500">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-sm">Select a document to view</p>
      </div>
    </div>
  );
}

/**
 * Chat Panel Placeholder Component
 *
 * Placeholder for the chat panel.
 * Will be implemented in Epic 5.
 */
export function ChatPanelPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-white border-l border-slate-200 text-slate-500">
      <div className="text-center px-4">
        <svg
          className="mx-auto h-12 w-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="mt-4 text-sm">Chat with your document</p>
        <p className="mt-1 text-xs text-slate-400">Coming in Epic 5</p>
      </div>
    </div>
  );
}
